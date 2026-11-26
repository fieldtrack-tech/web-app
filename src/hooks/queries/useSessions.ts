import {
  keepPreviousData,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { attendanceApi } from "@/lib/api/attendance";
import { adminApi } from "@/lib/api/admin";
import { useAuthContext } from "@/contexts/AuthContext";
import { rememberBrowserShift } from "@/lib/browser-location";
import type { AttendanceSession, PaginatedResponse } from "@/types";

export const sessionKeys = {
  all: ["sessions"] as const,
  mine: (page: number, limit: number, status: string) => ["sessions", "mine", page, limit, status] as const,
  activeShift: (identityKey: string | null) => ["sessions", "active-shift", identityKey] as const,
  org: (page: number, limit: number, status: string) => ["sessions", "org", page, limit, status] as const,
  orgStatus: (status: string) => ["sessions", "org", "status", status] as const,
  detail: (id: string) => ["sessions", "detail", id] as const,
  employeeHistory: (employeeId: string) => ["sessions", "employee", employeeId] as const,
};

export function useActiveShift() {
  const { identityKey, role } = useAuthContext();
  return useQuery({
    queryKey: sessionKeys.activeShift(identityKey),
    queryFn: ({ signal }) => attendanceApi.mySessions(1, 1, "active", signal),
    enabled: role === "EMPLOYEE",
    staleTime: 10_000,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
    meta: { suppressGlobalError: true },
  });
}

export function useMySessions(page = 1, limit = 50, status = "all") {
  return useQuery<PaginatedResponse<AttendanceSession>>({
    queryKey: sessionKeys.mine(page, limit, status),
    queryFn: () => attendanceApi.mySessions(page, limit, status),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useOrgSessions(page = 1, limit = 50, status = "all") {
  return useQuery<PaginatedResponse<AttendanceSession>>({
    queryKey: sessionKeys.org(page, limit, status),
    queryFn: () => attendanceApi.orgSessions(page, limit, status),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

/**
 * Status-bucket session loading:
 * 1. Active sessions load immediately (critical data)
 * 2. Recent + Inactive sessions load in PARALLEL after active completes
 *
 * Returns merged data sorted: ACTIVE → RECENT → INACTIVE.
 */
// Backend enforces limit ≤ 100 (attendance.schema.ts + admin/sessions.routes.ts).
// Segment queries fetch the first page of each status; large orgs will need
// pagination on the sessions page in a future iteration.
const SEGMENT_PAGE_LIMIT = 100;

export function useStatusBucketedOrgSessions() {
  const activeQuery = useQuery<PaginatedResponse<AttendanceSession>>({
    queryKey: sessionKeys.orgStatus("active"),
    queryFn: () => attendanceApi.orgSessions(1, SEGMENT_PAGE_LIMIT, "active"),
    staleTime: 30_000,
  });

  // Recent + Inactive load in PARALLEL once active is done (not sequentially)
  const activeLoaded = !activeQuery.isLoading;

  const recentQuery = useQuery<PaginatedResponse<AttendanceSession>>({
    queryKey: sessionKeys.orgStatus("recent"),
    queryFn: () => attendanceApi.orgSessions(1, SEGMENT_PAGE_LIMIT, "recent"),
    staleTime: 60_000,
    enabled: activeLoaded,
  });

  const inactiveQuery = useQuery<PaginatedResponse<AttendanceSession>>({
    queryKey: sessionKeys.orgStatus("inactive"),
    queryFn: () => attendanceApi.orgSessions(1, SEGMENT_PAGE_LIMIT, "inactive"),
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

export function useEmployeeSessionHistory(employeeId: string | null) {
  return useQuery<PaginatedResponse<AttendanceSession>>({
    queryKey: sessionKeys.employeeHistory(employeeId!),
    queryFn: () => attendanceApi.employeeHistory(employeeId!),
    enabled: !!employeeId,
    staleTime: 30_000,
  });
}

export function useMySession(id: string) {
  const queryClient = useQueryClient();
  return useQuery<AttendanceSession | undefined>({
    queryKey: sessionKeys.detail(id),
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
  const { identityKey } = useAuthContext();
  return useMutation({
    mutationFn: attendanceApi.checkIn,
    retry: false,
    meta: { suppressGlobalError: true },
    onSuccess: async (session) => {
      await qc.cancelQueries({ queryKey: sessionKeys.activeShift(identityKey) });
      rememberBrowserShift(session.id);
      qc.setQueryData(sessionKeys.activeShift(identityKey), {
        success: true,
        data: [session],
        pagination: { page: 1, limit: 1, total: 1, totalPages: 1 },
      } satisfies PaginatedResponse<AttendanceSession>);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: sessionKeys.all });
      void qc.invalidateQueries({ queryKey: ["field", "my-report"] });
    },
  });
}

export function useCheckOut() {
  const qc = useQueryClient();
  const { identityKey } = useAuthContext();
  return useMutation({
    mutationFn: attendanceApi.checkOut,
    retry: false,
    meta: { suppressGlobalError: true },
    onSuccess: async () => {
      await qc.cancelQueries({ queryKey: sessionKeys.activeShift(identityKey) });
      rememberBrowserShift(null);
      qc.setQueryData(sessionKeys.activeShift(identityKey), {
        success: true,
        data: [],
        pagination: { page: 1, limit: 1, total: 0, totalPages: 0 },
      } satisfies PaginatedResponse<AttendanceSession>);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: sessionKeys.all });
      void qc.invalidateQueries({ queryKey: ["field", "my-report"] });
    },
  });
}

export function useForceCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (employeeId: string) => adminApi.forceCheckout(employeeId),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: sessionKeys.all });
      void qc.invalidateQueries({ queryKey: ["adminDashboard"] });
      void qc.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}
