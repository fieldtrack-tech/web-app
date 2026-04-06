"use client";

import { useQuery } from "@tanstack/react-query";
import { profileApi } from "@/lib/api/profile";

export function useMyProfile(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["myProfile"],
    queryFn: () => profileApi.myProfile(),
    enabled: options?.enabled !== false,
  });
}

export function useEmployeeProfile(employeeId: string) {
  return useQuery({
    queryKey: ["employeeProfile", employeeId],
    queryFn: () => profileApi.employeeProfile(employeeId),
    enabled: !!employeeId,
  });
}
