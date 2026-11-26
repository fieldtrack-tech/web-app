import { supabase } from "@/lib/supabase";
import { ApiError, PaginatedResponse } from "@/types";
import { env } from "@/lib/env";
import { sessionIdentityKey } from "@/lib/auth/role";
import type { Session } from "@supabase/supabase-js";
import type { ZodSchema } from "zod";

const BASE_URL = env.API_BASE_URL;

let _accessToken: string | undefined;
let _apiIdentity: string | null = null;
let _identityVersion = 0;

// Shared inflight refresh — at most one simultaneous supabase.auth.refreshSession().
// All concurrent 401 handlers await the same promise; none can start a second refresh.
let _refreshPromise: Promise<void> | null = null;

export function setApiSession(session: Session | null, identity = session ? sessionIdentityKey(session) : null) {
  _accessToken = session?.access_token;
  if (identity === _apiIdentity) return;
  _apiIdentity = identity;
  _identityVersion++;
  _refreshPromise = null;
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (_accessToken) headers.Authorization = `Bearer ${_accessToken}`;
  return headers;
}

async function doRefresh(): Promise<void> {
  if (!_refreshPromise) {
    const pending = supabase.auth.refreshSession().then(({ error }) => {
      if (!error) return;
      if (error.name === "AuthRetryableFetchError") {
        throw new ApiError("Could not refresh your session. Check your connection and try again.", 0, undefined, "NETWORK_ERROR");
      }
      throw new ApiError("Your session expired. Log in again.", 401);
    }).finally(() => {
      if (_refreshPromise === pending) _refreshPromise = null;
    });
    _refreshPromise = pending;
  }
  return _refreshPromise;
}

async function withAuthRetry<T>(fn: () => Promise<T>): Promise<T> {
  const identityVersion = _identityVersion;
  const accessToken = _accessToken;
  try {
    return await fn();
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 401 || identityVersion !== _identityVersion || !_apiIdentity) throw err;
    if (accessToken === _accessToken) await doRefresh();
    if (identityVersion !== _identityVersion) throw err;
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
    const signal = options.signal ? AbortSignal.any([options.signal, controller.signal]) : controller.signal;
    const response = await fetch(url, { ...options, signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    if (options.signal?.aborted) throw options.signal.reason;
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
  const identityVersion = _identityVersion;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    options.signal?.throwIfAborted();
    if (identityVersion !== _identityVersion) throw new ApiError("Your account changed. Try again.", 401);
    try {
      return await fetchWithTimeout(url, options);
    } catch (err) {
      if (options.signal?.aborted) throw err;
      if (options.method && options.method !== "GET") throw err;
      if (attempt === maxRetries) throw err;
      await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt)));
    }
  }
  throw new ApiError("Request failed", 500);
}

function normalizeHttpErrorMessage(status: number, body: string): string {
  const trimmed = body.trim();
  const looksLikeHtml = /<[^>]+>/.test(trimmed);

  if ([502, 503, 504, 521, 522, 523, 524].includes(status)) {
    return "Service temporarily unavailable. Please try again shortly.";
  }
  if (status >= 500) {
    return "Server error. Please try again.";
  }
  if (!trimmed || looksLikeHtml) {
    return `Request failed (HTTP ${status}).`;
  }
  return `HTTP ${status}: ${trimmed.slice(0, 200)}`;
}

async function parseJsonOrThrow(response: Response): Promise<unknown> {
  const ct = response.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    const text = await response.text();
    throw new ApiError(normalizeHttpErrorMessage(response.status, text), response.status);
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
      throw new ApiError(normalizeHttpErrorMessage(response.status, text), response.status);
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
    const headers = getAuthHeaders();
    const response = await retryableFetch(url, { method: "GET", headers });
    return handleResponse<T>(response);
  });
}

export async function apiOpenEventStream(path: string, signal: AbortSignal): Promise<Response> {
  return withAuthRetry(async () => {
    const { Authorization } = getAuthHeaders();
    if (!Authorization) throw new ApiError("Log in again to reconnect.", 401);
    const response = await fetch(buildUrl(path), {
      headers: { Authorization, Accept: "text/event-stream" },
      signal,
      cache: "no-store",
    });
    if (!response.ok || !response.headers.get("content-type")?.startsWith("text/event-stream") || !response.body) {
      await response.body?.cancel();
      throw new ApiError("Could not open the live event stream.", response.status);
    }
    return response;
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
    const headers = getAuthHeaders();
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
    const headers = getAuthHeaders();
    const response = await retryableFetch(url, { method: "GET", headers });
    return parseEnvelopeOrThrow<T>(response);
  });
}

export async function apiGetPaginated<T>(
  path: string,
  params?: Record<string, string>,
  signal?: AbortSignal,
): Promise<PaginatedResponse<T>> {
  return withAuthRetry(async () => {
    const url = buildUrl(path, params);
    const headers = getAuthHeaders();
    const response = await retryableFetch(url, { method: "GET", headers, signal });
    return handlePaginatedResponse<T>(response);
  });
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return withAuthRetry(async () => {
    const url = buildUrl(path);
    const headers = getAuthHeaders();
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
    const headers = getAuthHeaders();
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
    const headers = getAuthHeaders();
    const response = await retryableFetch(url, { method: "DELETE", headers });
    if (response.status === 204) {
      return undefined as T;
    }
    return handleResponse<T>(response);
  });
}

