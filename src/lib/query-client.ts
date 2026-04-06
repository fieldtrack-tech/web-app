import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/types";

function emitQueryError(message: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("fieldtrack:query-error", { detail: { message } }));
}

function shouldSuppressError(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  // 401 — withAuthRetry has already attempted a refresh and is handling the
  // redirect. Suppress the toast; there's nothing the user can action here.
  if (error.status === 401) return true;
  // 403 — role or permission denial surfaced by withAuthRetry after a valid
  // refresh. The page component owns the error UI; global toast is noise.
  if (error.status === 403) return true;
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
    onError(error) {
      logErrorInDev("Query error", error);
      if (shouldSuppressError(error)) return;
      const message = error instanceof Error ? error.message : "An unexpected error occurred.";
      emitQueryError(message);
    },
  }),
  mutationCache: new MutationCache({
    onError(error) {
      logErrorInDev("Mutation error", error);
      if (shouldSuppressError(error)) return;
      const message = error instanceof Error ? error.message : "An unexpected error occurred.";
      emitQueryError(message);
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
