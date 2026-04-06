"use client";

import { useState } from "react";
import { CalendarCheck } from "lucide-react";
import { useOrgSessions } from "@/hooks/queries/useSessions";
import {
  StatusBadge,
  EmptyState,
  Pagination,
  Avatar,
} from "@/components/ui";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { formatDate, formatDuration, formatKm } from "@/lib/utils";

export function AttendanceTable() {
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const { data, isLoading } = useOrgSessions(page, LIMIT);
  const sessions = data?.data ?? [];
  const total = data?.pagination.total ?? 0;

  if (isLoading) return <LoadingSkeleton variant="table" />;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl overflow-hidden bg-surface-container">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Duration</th>
                <th>Distance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {!sessions?.length ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={<CalendarCheck className="w-5 h-5" />}
                      title="No sessions"
                      description="No attendance sessions found."
                    />
                  </td>
                </tr>
              ) : (
                sessions.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={s.employee_name} size="sm" />
                        <span className="font-medium">
                          {s.employee_name ?? (s.employee_id ? `#${s.employee_id.slice(-4)}` : "Unknown employee")}
                        </span>
                      </div>
                    </td>
                    <td className="text-on-surface-variant">
                      {formatDate(s.checkin_at)}
                    </td>
                    <td className="text-on-surface-variant">
                      {s.checkout_at ? formatDate(s.checkout_at) : "—"}
                    </td>
                    <td>
                      {formatDuration(s.total_duration_seconds ?? 0)}
                    </td>
                    <td>{formatKm(s.total_distance_km)}</td>
                    <td>
                      <StatusBadge status={s.checkout_at ? "CLOSED" : "ACTIVE"} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        page={page}
        hasMore={page * LIMIT < total}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => p + 1)}
        showing={sessions.length}
        total={total}
      />
    </div>
  );
}
