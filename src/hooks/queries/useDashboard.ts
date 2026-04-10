"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api/analytics";

export function useAdminMap() {
  return useQuery({
    queryKey: ["adminMap"],
    queryFn: () => analyticsApi.adminMap(),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}
