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
 * 2. Recent + Inactive sessions load in PARALLEL after active completes
 *
 * Returns merged data sorted: ACTIVE → RECENT → INACTIVE.
 */
export function useSegmentedOrgSessions() {
  const activeQuery = useQuery<PaginatedResponse<AttendanceSession>>({
    queryKey: sessionKeys.orgSegment("active"),
    queryFn: () => attendanceApi.orgSessions(1, 200, "active"),
    staleTime: 30_000,
  });

  // Recent + Inactive load in PARALLEL once active is done (not sequentially)
  const activeLoaded = !activeQuery.isLoading;

  const recentQuery = useQuery<PaginatedResponse<AttendanceSession>>({
    queryKey: sessionKeys.orgSegment("recent"),
    queryFn: () => attendanceApi.orgSessions(1, 200, "recent"),
    staleTime: 60_000,
    enabled: activeLoaded,
  });

  const inactiveQuery = useQuery<PaginatedResponse<AttendanceSession>>({
    queryKey: sessionKeys.orgSegment("inactive"),
    queryFn: () => attendanceApi.orgSessions(1, 200, "inactive"),
    staleTime: 60_000,
    // Load in parallel with recent — both enabled once active completes
    enabled: activeLoaded,
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
      // Cancel outgoing refetches to avoid overwriting optimistic update
      await qc.cancelQueries({ queryKey: sessionKeys.all });

      // Snapshot for rollback
      const previousQueries = qc.getQueriesData({ queryKey: sessionKeys.all });

      // Optimistically add a placeholder active session to "my sessions"
      const now = new Date().toISOString();
      const optimisticSession: AttendanceSession = {
        id: `optimistic-${Date.now()}`,
        employee_id: "",
        organization_id: "",
        checkin_at: now,
        checkout_at: null,
        total_distance_km: null,
        total_duration_seconds: null,
        distance_recalculation_status: null,
        created_at: now,
        updated_at: now,
        activityStatus: "ACTIVE",
      };

      qc.setQueriesData(
        { queryKey: ["sessions", "mine"] },
        (old: unknown) => {
          if (!old || typeof old !== "object") return old;
          const page = old as { data?: AttendanceSession[] };
          if (!Array.isArray(page.data)) return old;
          return { ...page, data: [optimisticSession, ...page.data] };
        },
      );

      return { previousQueries };
    },
    onError: (_err, _vars, context) => {
      // Revert on failure
      if (context?.previousQueries) {
        for (const [key, data] of context.previousQueries) {
          qc.setQueryData(key, data);
        }
      }
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: sessionKeys.all });
      void qc.invalidateQueries({ queryKey: ["adminDashboard"] });
    },
  });
}

export function useCheckOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: attendanceApi.checkOut,
    onMutate: async () => {
      // Cancel outgoing refetches to avoid overwriting optimistic update
      await qc.cancelQueries({ queryKey: sessionKeys.all });

      // Snapshot for rollback
      const previousQueries = qc.getQueriesData({ queryKey: sessionKeys.all });

      // Optimistically mark the active session as checked out
      const now = new Date().toISOString();
      qc.setQueriesData(
        { queryKey: ["sessions", "mine"] },
        (old: unknown) => {
          if (!old || typeof old !== "object") return old;
          const page = old as { data?: AttendanceSession[] };
          if (!Array.isArray(page.data)) return old;
          return {
            ...page,
            data: page.data.map((s) =>
              !s.checkout_at
                ? { ...s, checkout_at: now, activityStatus: "RECENT" as const }
                : s,
            ),
          };
        },
      );

      return { previousQueries };
    },
    onError: (_err, _vars, context) => {
      // Revert on failure
      if (context?.previousQueries) {
        for (const [key, data] of context.previousQueries) {
          qc.setQueryData(key, data);
        }
      }
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: sessionKeys.all });
      void qc.invalidateQueries({ queryKey: ["adminDashboard"] });
    },
    onError: () => qc.invalidateQueries({ queryKey: sessionKeys.all }),
  });
}
