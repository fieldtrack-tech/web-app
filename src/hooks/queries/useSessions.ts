import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect } from "react";
import { attendanceApi } from "@/lib/api/attendance";
import type { AttendanceSession, PaginatedResponse } from "@/types";

export const sessionKeys = {
  all: ["sessions"] as const,
  mine: (page: number, limit: number) => ["sessions", "mine", page, limit] as const,
  org: (page: number, limit: number) => ["sessions", "org", page, limit] as const,
};

export function useMySessions(page = 1, limit = 20) {
  return useQuery<PaginatedResponse<AttendanceSession>>({
    queryKey: sessionKeys.mine(page, limit),
    queryFn: () => attendanceApi.mySessions(page, limit),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useOrgSessions(page = 1, limit = 20) {
  return useQuery<PaginatedResponse<AttendanceSession>>({
    queryKey: sessionKeys.org(page, limit),
    queryFn: () => attendanceApi.orgSessions(page, limit),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useAllOrgSessions() {
  const query = useInfiniteQuery<
    PaginatedResponse<AttendanceSession>,
    Error,
    AttendanceSession[],
    ["orgSessionsAll"],
    number
  >({
    queryKey: ["orgSessionsAll"],
    queryFn: ({ pageParam }) => attendanceApi.orgSessions(pageParam, 100),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const fetched = allPages.reduce((sum, p) => sum + p.data.length, 0);
      return fetched < lastPage.pagination.total ? allPages.length + 1 : undefined;
    },
    select: (data) => data.pages.flatMap((p) => p.data),
  });

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query;
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
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
    onSuccess: () => qc.invalidateQueries({ queryKey: sessionKeys.all }),
  });
}

export function useCheckOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: attendanceApi.checkOut,
    onSuccess: () => qc.invalidateQueries({ queryKey: sessionKeys.all }),
  });
}
