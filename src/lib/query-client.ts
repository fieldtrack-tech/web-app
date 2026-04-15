import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/types";
import type { ApiErrorCode } from "@/types";

function emitQueryError(message: string, code?: ApiErrorCode, requestId?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("fieldtrack:query-error", { detail: { message, code, requestId } }));
}

function querySuppressesGlobalError(query: unknown): boolean {
  if (!query || typeof query !== "object") return false;
  const q = query as { meta?: Record<string, unknown>; options?: { meta?: Record<string, unknown> } };
  return q.meta?.suppressGlobalError === true || q.options?.meta?.suppressGlobalError === true;
}

function shouldSuppressError(error: unknown, query?: unknown): boolean {
  if (querySuppressesGlobalError(query)) return true;
  if (!(error instanceof ApiError)) return false;
  // 401 — withAuthRetry has already attempted a refresh and is handling the
  // redirect. Suppress the toast; there's nothing the user can action here.
  if (error.status === 401) return true;
  return false;
}

/**
 * React Query retry predicate.
 * Do NOT let RQ retry 401 or 403 responses — auth errors are already handled
 * with a single coordinated refresh inside withAuthRetry. A second RQ-level
 * retry would invoke withAuthRetry again, wasting a refresh attempt.
 * 5xx / network errors retain the default single retry.
 */
function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
    return false;
  }
  return failureCount < 1;
}

function logErrorInDev(label: string, error: unknown): void {
  if (typeof window === "undefined" || process.env.NODE_ENV !== "development") return;
  const message = error instanceof Error ? error.message : String(error);
  const requestId = error instanceof ApiError ? error.requestId : undefined;
  console.error(`[FieldTrack] ${label}`, { message, requestId, error });
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError(error, query) {
      logErrorInDev("Query error", error);
      if (shouldSuppressError(error, query)) return;
      const message = error instanceof Error ? error.message : "An unexpected error occurred.";
      const code = error instanceof ApiError ? error.code : undefined;
      const requestId = error instanceof ApiError ? error.requestId : undefined;
      emitQueryError(message, code, requestId);
    },
  }),
  mutationCache: new MutationCache({
    onError(error) {
      logErrorInDev("Mutation error", error);
      if (shouldSuppressError(error)) return;
      const message = error instanceof Error ? error.message : "An unexpected error occurred.";
      const code = error instanceof ApiError ? error.code : undefined;
      const requestId = error instanceof ApiError ? error.requestId : undefined;
      emitQueryError(message, code, requestId);
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: shouldRetryQuery,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
    },
  },
});
