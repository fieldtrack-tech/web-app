"use client";

import { useState } from "react";
import { Play, Square } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMonitoringHistory, useStartMonitoring, useStopMonitoring } from "@/hooks/queries/useMonitoring";
import { ErrorBanner } from "@/components/ErrorBanner";
import { LoadingState, Pagination } from "@/components/ui";
import { formatDate, formatDuration } from "@/lib/utils";

const PAGE_LIMIT = 20;

function sessionDuration(startedAt: string, endedAt: string | null) {
  if (!endedAt) return "Ongoing";
  const seconds = Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000);
  return formatDuration(seconds);
}

export default function AdminMonitoringPage() {
  const { permissions } = useAuth();
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useMonitoringHistory(page, PAGE_LIMIT);
  const startMonitoring = useStartMonitoring();
  const stopMonitoring = useStopMonitoring();

  if (!permissions.viewAnalytics) return null;

  const sessions = data?.data ?? [];
  const total = data?.pagination.total ?? 0;
  const activeSession = sessions.find((s) => !s.ended_at);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-manrope text-3xl font-bold text-on-surface">Monitoring</h2>
        <p className="text-sm text-on-surface-variant">Control and review location monitoring sessions.</p>
      </div>

      <div className="card flex flex-wrap items-center gap-3">
        <span className={activeSession ? "badge-success" : "badge-neutral"}>
          {activeSession ? "Active" : "Inactive"}
        </span>
        <button
          className="btn-primary"
          onClick={() => startMonitoring.mutate()}
          disabled={startMonitoring.isPending || !!activeSession}
        >
          <Play className="w-4 h-4" />
          Start Monitoring
        </button>
        <button
          className="btn-secondary"
          onClick={() => stopMonitoring.mutate()}
          disabled={stopMonitoring.isPending || !activeSession}
        >
          <Square className="w-4 h-4" />
          Stop Monitoring
        </button>
      </div>

      {error ? <ErrorBanner error={error} /> : null}
      {isLoading ? <LoadingState /> : null}

      {!isLoading ? (
        <div className="card overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Duration</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td>{formatDate(s.started_at)}</td>
                  <td>{s.ended_at ? formatDate(s.ended_at) : "-"}</td>
                  <td>{sessionDuration(s.started_at, s.ended_at)}</td>
                  <td><span className={s.ended_at ? "badge-neutral" : "badge-success"}>{s.ended_at ? "Ended" : "Active"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            page={page}
            hasMore={page * PAGE_LIMIT < total}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => p + 1)}
            showing={sessions.length}
            total={total}
          />
        </div>
      ) : null}
    </div>
  );
}
