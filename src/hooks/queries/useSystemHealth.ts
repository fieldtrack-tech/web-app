"use client";

import { useQuery } from "@tanstack/react-query";
import { systemHealthApi } from "@/lib/api/systemHealth";
import type { SystemHealthData } from "@/lib/api/systemHealth";

export function useSystemHealth() {
  return useQuery<SystemHealthData>({
    queryKey: ["systemHealth"],
    queryFn: () => systemHealthApi.get(),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}
