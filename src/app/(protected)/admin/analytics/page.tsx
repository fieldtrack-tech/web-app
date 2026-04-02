"use client";

import { useMemo, useState } from "react";
import { useOrgSummary, useSessionTrend, useTopPerformers } from "@/hooks/queries/useAnalytics";
import { PageHeader, LoadingState } from "@/components/ui";
import { OrgAnalyticsChart } from "@/components/charts/index";
import { formatDuration, formatKm } from "@/lib/utils";
import { Trophy } from "lucide-react";
import type { TopPerformerMetric } from "@/types";

const METRICS: Array<Extract<TopPerformerMetric, "distance" | "duration" | "sessions">> = [
  "distance",
  "duration",
  "sessions",
];

function defaultFromDate(): string {
  const from = new Date();
  from.setDate(from.getDate() - 29);
  return from.toISOString().slice(0, 10);
}

function toQueryDate(date: string, boundary: "start" | "end"): string {
  return new Date(`${date}T${boundary === "start" ? "00:00:00.000" : "23:59:59.999"}`).toISOString();
}

function metricLabel(metric: TopPerformerMetric): string {
  if (metric === "sessions") return "Sessions";
  if (metric === "duration") return "Duration";
  return "Distance";
}

function metricValue(metric: TopPerformerMetric, entry: { totalDistanceKm?: number; totalDurationSeconds?: number; sessionsCount?: number; totalSessions?: number }) {
  if (metric === "duration") return formatDuration(entry.totalDurationSeconds ?? 0);
  if (metric === "sessions") return String(entry.sessionsCount ?? entry.totalSessions ?? 0);
  return formatKm(entry.totalDistanceKm ?? 0);
}

export default function AdminAnalyticsPage() {
  const [from, setFrom] = useState(defaultFromDate);
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [metric, setMetric] = useState<Extract<TopPerformerMetric, "distance" | "duration" | "sessions">>("distance");

  const range = useMemo(
    () => ({ from: toQueryDate(from, "start"), to: toQueryDate(to, "end") }),
    [from, to]
  );
  const { data: summary, isLoading: loadSum } = useOrgSummary(range);
  const { data: trend = [], isLoading: loadTrend } = useSessionTrend(range);
  const { data: topPerfs = [], isLoading: loadTop } = useTopPerformers(metric, range);

  const chartData = trend.map((row) => ({
    date: row.date,
    sessions: row.sessions,
    distanceKm: Number(row.distance.toFixed(2)),
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" subtitle="Organisation-wide performance metrics" />

      <div className="card grid gap-4 md:grid-cols-[repeat(3,minmax(0,1fr))_auto]">
        <label className="space-y-2 text-xs text-on-surface-variant uppercase tracking-wider">
          <span>From</span>
          <input className="input h-10 text-sm" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        </label>
        <label className="space-y-2 text-xs text-on-surface-variant uppercase tracking-wider">
          <span>To</span>
          <input className="input h-10 text-sm" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        </label>
        <div className="space-y-2 text-xs text-on-surface-variant uppercase tracking-wider">
          <span>Metric</span>
          <div className="flex flex-wrap gap-2">
            {METRICS.map((option) => (
              <button
                key={option}
                className={option === metric ? "btn-primary px-3 py-2 text-xs" : "btn-secondary px-3 py-2 text-xs"}
                onClick={() => setMetric(option)}
                type="button"
              >
                {metricLabel(option)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Sessions",    value: String(summary?.totalSessions ?? "—") },
          { label: "Total Distance",    value: formatKm(summary?.totalDistanceKm) },
          { label: "Total Hours",       value: formatDuration(summary?.totalDurationSeconds ?? 0) },
          { label: "Total Expenses",    value: String(summary?.totalExpenses ?? "—") },
        ].map((s) => (
          <div key={s.label} className="card space-y-1 text-center">
            <p className="section-heading">{s.label}</p>
            <p className="font-manrope font-bold text-2xl text-on-surface">{loadSum ? "—" : s.value}</p>
          </div>
        ))}
      </div>

      {/* Trend chart */}
      <div className="card space-y-3">
        <p className="font-manrope font-bold text-on-surface">Activity Overview</p>
        {loadTrend ? <LoadingState message="Loading trend data..." /> : <OrgAnalyticsChart data={chartData} />}
      </div>

      {/* Top performers */}
      <div className="card space-y-4">
        <p className="font-manrope font-bold text-on-surface flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" />
          Top Performers — {metricLabel(metric)}
        </p>
        {loadTop ? (
          <LoadingState />
        ) : (
          <div className="space-y-2">
            {topPerfs.map((p, i) => (
              <div
                key={p.employeeId}
                className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-surface-container-high/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-on-surface">{p.employeeName}</span>
                </div>
                <span className="text-sm text-on-surface-variant">{metricValue(metric, p)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
