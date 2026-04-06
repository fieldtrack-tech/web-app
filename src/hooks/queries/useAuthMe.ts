"use client";

import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/api/auth";

/**
 * Fetches the caller's server-side identity via GET /auth/me.
 *
 * Gracefully no-ops (returns null) when the backend has not implemented
 * the endpoint yet — no errors, no toasts, no retries.
 *
 * When the backend ships /auth/me, this hook will automatically start
 * returning real data on the next navigation without any code changes.
 */
export function useAuthMe() {
  return useQuery({
    queryKey: ["authMe"],
    queryFn: () => authApi.me(),
    // Identity is stable for the duration of a session.
    staleTime: Infinity,
    gcTime: Infinity,
    // Never retry — a missing endpoint should not hammer the backend.
    retry: false,
  });
}
