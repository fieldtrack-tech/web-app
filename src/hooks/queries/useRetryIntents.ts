"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { retryIntentsApi } from "@/lib/api/retryIntents";
import type { RetryIntentStatus } from "@/lib/api/retryIntents";

export function useRetryIntents(status: RetryIntentStatus = "pending", page = 1, limit = 50) {
  return useQuery({
    queryKey: ["retryIntents", status, page, limit],
    queryFn: () => retryIntentsApi.list(status, page, limit),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}
