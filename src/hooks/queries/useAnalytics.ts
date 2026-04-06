import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api/analytics";
import type { TopPerformerMetric } from "@/types";

interface DateRange {
  from?: string;
  to?: string;
  [key: string]: string | number | boolean | null | undefined;
}

const DEFAULT_METRIC: TopPerformerMetric = "distance";

export const analyticsKeys = {
  orgSummary: (range: DateRange) => ["orgSummary", range] as const,
  userSummary: (userId: string, range: DateRange) =>
    ["analytics", "user-summary", userId, range] as const,
  topPerformers: (metric: TopPerformerMetric, range: DateRange, limit?: number) =>
    ["topPerformers", metric, range, limit] as const,
  sessionTrend: (range: DateRange) => ["sessionTrend", range] as const,
  leaderboard: (metric: TopPerformerMetric, range: DateRange, limit?: number) =>
    ["leaderboard", metric, range, limit] as const,
  adminLeaderboard: (metric: TopPerformerMetric, range: DateRange, limit?: number) =>
    ["adminLeaderboard", metric, range, limit] as const,
};

export function useOrgSummary(range: DateRange = {}) {
  return useQuery({
    queryKey: analyticsKeys.orgSummary(range),
    queryFn: () => analyticsApi.orgSummary(range),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useUserSummary(userId: string | null, range: DateRange = {}) {
  return useQuery({
    enabled: !!userId,
    queryKey: analyticsKeys.userSummary(userId!, range),
    queryFn: () => analyticsApi.userSummary(userId!, range),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useTopPerformers(
  metric: TopPerformerMetric = DEFAULT_METRIC,
  range: DateRange = {},
  limit = 10
) {
  const safeMetric = metric ?? DEFAULT_METRIC;
  return useQuery({
    queryKey: analyticsKeys.topPerformers(safeMetric, range, limit),
    queryFn: () => analyticsApi.topPerformers(safeMetric, { ...range, limit }),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}

export function useSessionTrend(range: DateRange = {}) {
  return useQuery({
    queryKey: analyticsKeys.sessionTrend(range),
    queryFn: () => analyticsApi.sessionTrend(range),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}

export function useLeaderboard(
  metric: TopPerformerMetric = DEFAULT_METRIC,
  limit = 50,
  range: DateRange = {}
) {
  const safeMetric = metric ?? DEFAULT_METRIC;
  return useQuery({
    queryKey: analyticsKeys.leaderboard(safeMetric, range, limit),
    queryFn: () => analyticsApi.leaderboard({ metric: safeMetric, limit, ...range }),
    staleTime: 120_000,
    placeholderData: keepPreviousData,
  });
}

export function useAdminLeaderboard(
  metric: TopPerformerMetric = DEFAULT_METRIC,
  limit = 50,
  range: DateRange = {}
) {
  const safeMetric = metric ?? DEFAULT_METRIC;
  return useQuery({
    queryKey: analyticsKeys.adminLeaderboard(safeMetric, range, limit),
    queryFn: () => analyticsApi.adminLeaderboard({ metric: safeMetric, limit, ...range }),
    staleTime: 120_000,
    placeholderData: keepPreviousData,
  });
}
