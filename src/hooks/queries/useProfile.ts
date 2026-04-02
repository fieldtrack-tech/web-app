"use client";

import { useQuery } from "@tanstack/react-query";
import { profileApi } from "@/lib/api/profile";

export function useMyProfile() {
  return useQuery({
    queryKey: ["myProfile"],
    queryFn: () => profileApi.myProfile(),
  });
}

export function useEmployeeProfile(employeeId: string) {
  return useQuery({
    queryKey: ["employeeProfile", employeeId],
    queryFn: () => profileApi.employeeProfile(employeeId),
    enabled: !!employeeId,
  });
}
