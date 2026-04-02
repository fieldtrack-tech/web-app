import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/types";

function emitQueryError(message: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("fieldtrack:query-error", { detail: { message } }));
}

function shouldSuppressError(error: unknown): boolean {
  // Suppress 401 Unauthorized — the api client handles these by redirecting to /login.
  if (error instanceof ApiError && error.status === 401) return true;
  return false;
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
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
    },
  },
});
