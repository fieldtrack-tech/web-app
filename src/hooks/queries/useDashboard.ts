"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api/analytics";
import type { AdminDashboardData } from "@/types";

export function useAdminMap() {
  return useQuery({
    queryKey: ["adminMap"],
    queryFn: () => analyticsApi.adminMap(),
    staleTime: 30_000,
    refetchInterval: 30_000,
    meta: { suppressGlobalError: true },
  });
}

export function useAdminDashboard() {
  return useQuery<AdminDashboardData>({
    queryKey: ["adminDashboard"],
    queryFn: () => analyticsApi.adminDashboard(),
    staleTime: 60_000,
  });
}
