"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api/analytics";

export function useMyDashboard() {
  return useQuery({
    queryKey: ["myDashboard"],
    queryFn: () => analyticsApi.myDashboard(),
    staleTime: 30_000,
  });
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: ["adminDashboard"],
    queryFn: () => analyticsApi.adminDashboard(),
    staleTime: 30_000,
  });
}

export function useAdminMap() {
  return useQuery({
    queryKey: ["adminMap"],
    queryFn: () => analyticsApi.adminMap(),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}
