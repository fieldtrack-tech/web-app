import { supabase } from "@/lib/supabase";
import { ApiError, PaginatedResponse } from "@/types";
import { env } from "@/lib/env";

const BASE_URL = env.API_BASE_URL;

// ─── Token cache ─────────────────────────────────────────────────────────
let _cachedToken: string | null = null;
let _tokenExpiry: number = 0;

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

async function handleAuthFailure(): Promise<void> {
  clearAuthTokenCache();
  await supabase.auth.signOut();
  if (typeof window !== "undefined") window.location.href = "/login";
}

function buildUrl(path: string, params?: Record<string, string>): string {
  const url = `${BASE_URL}${path}`;
  if (!params || Object.keys(params).length === 0) return url;
  const qs = new URLSearchParams(params).toString();
  return `${url}?${qs}`;
}

async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    if (err instanceof Error && err.name === "AbortError") {
      throw new ApiError("Request timeout", 408);
    }
    throw err;
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
    await handleAuthFailure();
    throw new ApiError("Unauthorized. Please log in again.", 401);
  }
  if (!response.ok) {
    const ct = response.headers.get("content-type") ?? "";
    if (!ct.includes("application/json")) {
      const text = await response.text();
      throw new ApiError(`HTTP ${response.status}: ${text.slice(0, 200)}`, response.status);
    }
  }

  const json = (await parseJsonOrThrow(response)) as T;
  if (!json.success) {
    throw new ApiError(json.error ?? "Unknown error", response.status, json.requestId);
  }
  return json;
}

async function handleResponse<T>(response: Response): Promise<T> {
  const json = await parseEnvelopeOrThrow<{ success: true; data: T; requestId?: string }>(response);
  return json.data;
}

async function handlePaginatedResponse<T>(response: Response): Promise<PaginatedResponse<T>> {
  if (response.status === 401) {
    await handleAuthFailure();
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
    pagination: (json["pagination"] as { page: number; limit: number; total: number }) ?? {
      page: 1,
      limit: 20,
      total: 0,
    },
  };
}

// ─── Public helpers ───────────────────────────────────────────────────────

export async function apiGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = buildUrl(path, params);
  const headers = await getAuthHeaders();
  const response = await retryableFetch(url, { method: "GET", headers });
  return handleResponse<T>(response);
}

export async function apiGetEnvelope<T extends { success?: boolean; error?: string; requestId?: string }>(
  path: string,
  params?: Record<string, string>
): Promise<T> {
  const url = buildUrl(path, params);
  const headers = await getAuthHeaders();
  const response = await retryableFetch(url, { method: "GET", headers });
  return parseEnvelopeOrThrow<T>(response);
}

export async function apiGetPaginated<T>(
  path: string,
  params?: Record<string, string>
): Promise<PaginatedResponse<T>> {
  const url = buildUrl(path, params);
  const headers = await getAuthHeaders();
  const response = await retryableFetch(url, { method: "GET", headers });
  return handlePaginatedResponse<T>(response);
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const url = buildUrl(path);
  const headers = await getAuthHeaders();
  const response = await retryableFetch(url, {
    method: "POST",
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(response);
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  const url = buildUrl(path);
  const headers = await getAuthHeaders();
  const response = await retryableFetch(url, {
    method: "PATCH",
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(response);
}

export async function apiDelete<T = void>(path: string): Promise<T> {
  const url = buildUrl(path);
  const headers = await getAuthHeaders();
  const response = await retryableFetch(url, { method: "DELETE", headers });
  if (response.status === 204) {
    return undefined as T;
  }
  return handleResponse<T>(response);
}

