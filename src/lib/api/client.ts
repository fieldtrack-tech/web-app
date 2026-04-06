import { supabase } from "@/lib/supabase";
import { ApiError, PaginatedResponse } from "@/types";
import { env } from "@/lib/env";
import type { ZodSchema } from "zod";

const BASE_URL = env.API_BASE_URL;

// ─── Token cache ─────────────────────────────────────────────────────────
let _cachedToken: string | null = null;
let _tokenExpiry: number = 0;

// Shared inflight refresh — at most one simultaneous supabase.auth.refreshSession().
// All concurrent 401 handlers await the same promise; none can start a second refresh.
let _refreshPromise: Promise<boolean> | null = null;

export function clearAuthTokenCache() {
  _cachedToken = null;
  _tokenExpiry = 0;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const now = Date.now();
  if (_cachedToken && _tokenExpiry > now + 30_000) {
    return { "Content-Type": "application/json", Authorization: `Bearer ${_cachedToken}` };
  }
  const { data } = await supabase.auth.getSession();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (data.session?.access_token) {
    headers["Authorization"] = `Bearer ${data.session.access_token}`;
    _cachedToken = data.session.access_token;
    _tokenExpiry = (data.session.expires_at ?? 0) * 1000;
  } else {
    _cachedToken = null;
    _tokenExpiry = 0;
  }
  return headers;
}

// ─── Auth-aware retry wrapper ────────────────────────────────────────────────
// On a 401, attempt a Supabase token refresh and replay the request once.
// Multiple simultaneous 401s share a single refresh via _refreshPromise so
// supabase.auth.refreshSession() is never called more than once concurrently.
// • If the refresh itself fails  → session is truly expired → sign out + redirect.
// • If the retry also returns 401 → role/permission denial, NOT an auth failure;
//   re-throw as 403 so the component can surface an error without signing out.
async function doRefresh(): Promise<boolean> {
  if (!_refreshPromise) {
    _refreshPromise = supabase.auth
      .refreshSession()
      .then(({ error }) => !error)
      // Network failure during refresh (e.g. offline) resolves as false rather
      // than rejecting. withAuthRetry treats false → session gone → logout.
      // Without this, a thrown network error would escape the catch block in
      // withAuthRetry unhandled, bypassing the logout path entirely.
      .catch(() => false)
      .finally(() => { _refreshPromise = null; });
  }
  return _refreshPromise;
}

async function withAuthRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 401) throw err;
    // Token may be expired — try a silent refresh (deduplicated).
    clearAuthTokenCache();
    const refreshed = await doRefresh();
    if (!refreshed) {
      // Refresh failed: session is gone. Sign out and hard-navigate.
      await supabase.auth.signOut();
      if (typeof window !== "undefined") window.location.href = "/login";
      throw err;
    }
    // Token refreshed — replay with the new credentials.
    try {
      return await fn();
    } catch (retryErr) {
      // Still 401 after a valid refresh → resource is off-limits for this role.
      // Promote to 403 so callers never confuse this with an auth failure.
      if (retryErr instanceof ApiError && retryErr.status === 401) {
        throw new ApiError("Access denied.", 403, (retryErr as ApiError).requestId);
      }
      throw retryErr;
    }
  }
}

function buildUrl(path: string, params?: Record<string, string>): string {
  const url = `${BASE_URL}${path}`;
  if (!params || Object.keys(params).length === 0) return url;
  const qs = new URLSearchParams(params).toString();
  return `${url}?${qs}`;
}

async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    if (err instanceof Error && err.name === "AbortError") {
      throw new ApiError("Request timeout", 408, undefined, "TIMEOUT");
    }
    // Convert any network-level failure (offline, DNS, CORS, etc.) to a typed error.
    throw new ApiError(
      "Network error — check your internet connection",
      0,
      undefined,
      "NETWORK_ERROR"
    );
  }
}

async function retryableFetch(url: string, options: RequestInit, maxRetries = 2): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fetchWithTimeout(url, options);
    } catch (err) {
      if (options.method && options.method !== "GET") throw err;
      if (attempt === maxRetries) throw err;
      await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
    }
  }
  throw new ApiError("Request failed", 500);
}

async function parseJsonOrThrow(response: Response): Promise<unknown> {
  const ct = response.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    const text = await response.text();
    throw new ApiError(
      `API Error: Expected JSON but got "${ct}" (HTTP ${response.status}). ` +
        `Check NEXT_PUBLIC_API_BASE_URL config. Preview: ${text.slice(0, 200)}`,
      response.status
    );
  }
  return response.json();
}

async function parseEnvelopeOrThrow<T extends { success?: boolean; error?: string; requestId?: string }>(
  response: Response
): Promise<T> {
  if (response.status === 401) {
    throw new ApiError("Unauthorized. Please log in again.", 401);
  }
  if (!response.ok) {
    const ct = response.headers.get("content-type") ?? "";
    if (!ct.includes("application/json")) {
      const text = await response.text();
      throw new ApiError(`HTTP ${response.status}: ${text.slice(0, 200)}`, response.status);
    }
  }

  const json = (await parseJsonOrThrow(response)) as T & {
    details?: Array<{ path: string[]; message: string }>;
  };
  if (!json.success) {
    // For validation errors (400), include field-level details if present.
    const details = json.details;
    let message = json.error ?? "Unknown error";
    if (details?.length) {
      message = details.map((d) => d.message).join("; ");
    }
    throw new ApiError(message, response.status, json.requestId);
  }
  return json;
}

async function handleResponse<T>(response: Response, schema?: ZodSchema<T>): Promise<T> {
  const json = await parseEnvelopeOrThrow<{ success: true; data: T; requestId?: string }>(response);
  if (schema && process.env.NODE_ENV !== "production") {
    const result = schema.safeParse(json.data);
    if (!result.success) {
      console.warn(
        "[API contract drift]",
        response.url,
        result.error.format(),
      );
    }
  }
  return json.data;
}

async function handlePaginatedResponse<T>(response: Response): Promise<PaginatedResponse<T>> {
  if (response.status === 401) {
    throw new ApiError("Unauthorized. Please log in again.", 401);
  }
  if (!response.ok) {
    const ct = response.headers.get("content-type") ?? "";
    if (!ct.includes("application/json")) {
      throw new ApiError(`HTTP ${response.status}`, response.status);
    }
  }
  const json = (await parseJsonOrThrow(response)) as Record<string, unknown>;
  if (!json["success"]) {
    throw new ApiError((json["error"] as string) ?? "Unknown error", response.status, json["requestId"] as string | undefined);
  }
  return {
    success: true,
    data: (json["data"] as T[]) ?? [],
    pagination: (json["pagination"] as { page: number; limit: number; total: number; totalPages: number }) ?? {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    },
  };
}

// ─── Public helpers ───────────────────────────────────────────────────────

export async function apiGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  return withAuthRetry(async () => {
    const url = buildUrl(path, params);
    const headers = await getAuthHeaders();
    const response = await retryableFetch(url, { method: "GET", headers });
    return handleResponse<T>(response);
  });
}

/**
 * Like apiGet but validates the response shape against a Zod schema in dev/test.
 * In production the schema is skipped entirely — zero runtime cost.
 * Use this for endpoints where contract drift would cause silent UI bugs.
 */
export async function apiGetValidated<T>(path: string, schema: ZodSchema<T>, params?: Record<string, string>): Promise<T> {
  return withAuthRetry(async () => {
    const url = buildUrl(path, params);
    const headers = await getAuthHeaders();
    const response = await retryableFetch(url, { method: "GET", headers });
    return handleResponse<T>(response, schema);
  });
}

export async function apiGetEnvelope<T extends { success?: boolean; error?: string; requestId?: string }>(
  path: string,
  params?: Record<string, string>
): Promise<T> {
  return withAuthRetry(async () => {
    const url = buildUrl(path, params);
    const headers = await getAuthHeaders();
    const response = await retryableFetch(url, { method: "GET", headers });
    return parseEnvelopeOrThrow<T>(response);
  });
}

export async function apiGetPaginated<T>(
  path: string,
  params?: Record<string, string>
): Promise<PaginatedResponse<T>> {
  return withAuthRetry(async () => {
    const url = buildUrl(path, params);
    const headers = await getAuthHeaders();
    const response = await retryableFetch(url, { method: "GET", headers });
    return handlePaginatedResponse<T>(response);
  });
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return withAuthRetry(async () => {
    const url = buildUrl(path);
    const headers = await getAuthHeaders();
    const response = await retryableFetch(url, {
      method: "POST",
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  });
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return withAuthRetry(async () => {
    const url = buildUrl(path);
    const headers = await getAuthHeaders();
    const response = await retryableFetch(url, {
      method: "PATCH",
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  });
}

export async function apiDelete<T = void>(path: string): Promise<T> {
  return withAuthRetry(async () => {
    const url = buildUrl(path);
    const headers = await getAuthHeaders();
    const response = await retryableFetch(url, { method: "DELETE", headers });
    if (response.status === 204) {
      return undefined as T;
    }
    return handleResponse<T>(response);
  });
}

