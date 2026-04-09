import {
  keepPreviousData,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { attendanceApi } from "@/lib/api/attendance";
import type { AttendanceSession, PaginatedResponse } from "@/types";

export const sessionKeys = {
  all: ["sessions"] as const,
  mine: (page: number, limit: number) => ["sessions", "mine", page, limit] as const,
  org: (page: number, limit: number) => ["sessions", "org", page, limit] as const,
  orgSegment: (status: string) => ["sessions", "org", "segment", status] as const,
};

export function useMySessions(page = 1, limit = 50) {
  return useQuery<PaginatedResponse<AttendanceSession>>({
    queryKey: sessionKeys.mine(page, limit),
    queryFn: () => attendanceApi.mySessions(page, limit),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useOrgSessions(page = 1, limit = 50) {
  return useQuery<PaginatedResponse<AttendanceSession>>({
    queryKey: sessionKeys.org(page, limit),
    queryFn: () => attendanceApi.orgSessions(page, limit),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

/**
 * Segmented sessions loading:
 * 1. Active sessions load immediately (critical data)
 * 2. Recent sessions load in background
 * 3. Inactive sessions load last
 *
 * Returns merged data sorted: ACTIVE → RECENT → INACTIVE.
 */
export function useSegmentedOrgSessions() {
  const activeQuery = useQuery<PaginatedResponse<AttendanceSession>>({
    queryKey: sessionKeys.orgSegment("active"),
    queryFn: () => attendanceApi.orgSessions(1, 100, "active"),
    staleTime: 30_000,
  });

  const recentQuery = useQuery<PaginatedResponse<AttendanceSession>>({
    queryKey: sessionKeys.orgSegment("recent"),
    queryFn: () => attendanceApi.orgSessions(1, 100, "recent"),
    staleTime: 60_000,
    // Load in background after active loads
    enabled: !activeQuery.isLoading,
  });

  const inactiveQuery = useQuery<PaginatedResponse<AttendanceSession>>({
    queryKey: sessionKeys.orgSegment("inactive"),
    queryFn: () => attendanceApi.orgSessions(1, 100, "inactive"),
    staleTime: 60_000,
    // Load last, after recent loads
    enabled: !activeQuery.isLoading && !recentQuery.isLoading,
  });

  const activeSessions = activeQuery.data?.data ?? [];
  const recentSessions = recentQuery.data?.data ?? [];
  const inactiveSessions = inactiveQuery.data?.data ?? [];

  // Merge in priority order: ACTIVE → RECENT → INACTIVE
  const allSessions = [...activeSessions, ...recentSessions, ...inactiveSessions];

  return {
    data: allSessions,
    activeSessions,
    recentSessions,
    inactiveSessions,
    isLoading: activeQuery.isLoading,
    isLoadingRecent: recentQuery.isLoading,
    isLoadingInactive: inactiveQuery.isLoading,
    error: activeQuery.error ?? recentQuery.error ?? inactiveQuery.error,
    refetch: () => {
      void activeQuery.refetch();
      void recentQuery.refetch();
      void inactiveQuery.refetch();
    },
  };
}

/** @deprecated Use useSegmentedOrgSessions instead */
export function useAllOrgSessions() {
  const segmented = useSegmentedOrgSessions();
  return {
    data: segmented.data,
    isLoading: segmented.isLoading,
    error: segmented.error,
    refetch: segmented.refetch,
  };
}

export function useEmployeeSessionHistory(employeeId: string | null) {
  return useQuery<PaginatedResponse<AttendanceSession>>({
    queryKey: ["orgSessionsEmployee", employeeId],
    queryFn: () => attendanceApi.employeeHistory(employeeId!),
    enabled: !!employeeId,
    staleTime: 30_000,
  });
}

export function useMySession(id: string) {
  const queryClient = useQueryClient();
  return useQuery<AttendanceSession | undefined>({
    queryKey: ["session", id],
    queryFn: async () => {
      const allPages = queryClient.getQueriesData<PaginatedResponse<AttendanceSession>>({
        queryKey: ["sessions"],
      });
      for (const [, page] of allPages) {
        const found = page?.data?.find((s) => s.id === id);
        if (found) return found;
      }
      return attendanceApi.byIdFallback(id);
    },
    staleTime: 30_000,
  });
}

export function useCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: attendanceApi.checkIn,
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: sessionKeys.all });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: sessionKeys.all }),
    onError: () => qc.invalidateQueries({ queryKey: sessionKeys.all }),
  });
}

export function useCheckOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: attendanceApi.checkOut,
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: sessionKeys.all });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: sessionKeys.all }),
    onError: () => qc.invalidateQueries({ queryKey: sessionKeys.all }),
  });
}
