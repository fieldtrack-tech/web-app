"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api/analytics";
import { useAuthContext } from "@/contexts/AuthContext";
import type { AdminDashboardData, EmployeeMapMarker } from "@/types";

const LIVE_FIX_MAX_AGE_MS = 60_000;

export type LiveFleetMember = EmployeeMapMarker & { stale: boolean };

export function useAdminMap(employeeId?: string) {
  const { identityKey, role } = useAuthContext();
  const query = useQuery({
    queryKey: ["adminMap", identityKey, employeeId],
    queryFn: () => analyticsApi.adminMap(employeeId),
    enabled: role === "ADMIN",
    staleTime: 8_000,
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
    meta: { suppressGlobalError: true },
  });
  const now = Date.now();
  const data: LiveFleetMember[] | undefined = query.data
    ?.filter((marker) => marker.status === "ACTIVE")
    .map((marker) => ({ ...marker, stale: now - Date.parse(marker.recordedAt) >= LIVE_FIX_MAX_AGE_MS }));
  return { ...query, data };
}

export function useAdminDashboard() {
  return useQuery<AdminDashboardData>({
    queryKey: ["adminDashboard"],
    queryFn: () => analyticsApi.adminDashboard(),
    staleTime: 60_000,
  });
}
