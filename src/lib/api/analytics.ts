import { apiGet } from "@/lib/api/client";
import { API } from "@/lib/api/endpoints";
import type {
  AdminDashboardData,
  DashboardSummary,
  LeaderboardEntry,
  OrgSummaryData,
  SessionTrendEntry,
  TopPerformerEntry,
  TopPerformerMetric,
  UserSummaryData,
  EmployeeMapMarker,
} from "@/types";

interface DateRangeParams {
  from?: string;
  to?: string;
  [key: string]: string | number | boolean | null | undefined;
}

export const analyticsApi = {
  orgSummary: (params: DateRangeParams = {}) =>
    apiGet<OrgSummaryData>(API.orgSummary, stringifyParams(params)),

  userSummary: (userId: string, params: DateRangeParams = {}) =>
    apiGet<UserSummaryData>("/admin/user-summary", stringifyParams({ userId, ...params })),

  topPerformers: (
    metric: TopPerformerMetric,
    params: DateRangeParams & { limit?: number } = {}
  ) =>
    apiGet<TopPerformerEntry[]>(API.topPerformers, stringifyParams({ metric, ...params })),

  sessionTrend: (params: DateRangeParams = {}) =>
    apiGet<SessionTrendEntry[]>(API.sessionTrend, stringifyParams(params)),

  leaderboard: (params: { metric: TopPerformerMetric; limit?: number } & DateRangeParams) =>
    apiGet<LeaderboardEntry[]>(API.leaderboard, stringifyParams(params)),

  myDashboard: () => apiGet<DashboardSummary>(API.myDashboard),

  adminDashboard: () => apiGet<AdminDashboardData>(API.adminDashboard),

  adminMap: () => apiGet<EmployeeMapMarker[]>(API.adminMap),
};

function stringifyParams(
  params: Record<string, string | number | boolean | null | undefined>
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== "") out[k] = String(v);
  }
  return out;
}
