"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAllOrgSessions } from "@/hooks/queries/useSessions";
import { ErrorBanner } from "@/components/ErrorBanner";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ActivityBadge } from "@/components/ActivityBadge";
import { formatDate, formatDuration, formatKm } from "@/lib/utils";
import type { ActivityStatus, AttendanceSession } from "@/types";

type FilterTab = "all" | ActivityStatus;

function deriveStatus(session: AttendanceSession): ActivityStatus {
  if (!session.checkout_at) return "ACTIVE";
  const lastTs = new Date(session.checkout_at).getTime();
  return Date.now() - lastTs < 86_400_000 ? "RECENT" : "INACTIVE";
}

export default function AdminSessionsPage() {
  const { permissions } = useAuth();
  const [tab, setTab] = useState<FilterTab>("all");

  const { data: sessions, isLoading, error, refetch } = useAllOrgSessions();

  const grouped = useMemo(() => {
    const map = new Map<string, AttendanceSession[]>();
    for (const s of sessions) {
      const arr = map.get(s.employee_id) ?? [];
      arr.push(s);
      map.set(s.employee_id, arr);
    }

    const rows = Array.from(map.entries()).map(([employeeId, all]) => {
      const sorted = [...all].sort(
        (a, b) => new Date(b.checkin_at).getTime() - new Date(a.checkin_at).getTime()
      );
      const latest = sorted[0];
      const status = latest.activityStatus ?? deriveStatus(latest);
      return { employeeId, latest, status, count: sorted.length };
    });

    return rows.sort((a, b) => new Date(b.latest.checkin_at).getTime() - new Date(a.latest.checkin_at).getTime());
  }, [sessions]);

  if (!permissions.viewOrgSessions) return null;

  const filtered = tab === "all" ? grouped : grouped.filter((g) => g.status === tab);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-manrope text-3xl font-bold text-on-surface">All Sessions</h2>
        <p className="text-sm text-on-surface-variant">
          {isLoading ? "Loading..." : `${grouped.length} employees with session activity`}
        </p>
      </div>

      <div className="flex flex-wrap gap-1 rounded-lg bg-surface-container-high p-1 w-fit max-w-full">
        {(["all", "ACTIVE", "RECENT", "INACTIVE"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k as FilterTab)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium ${tab === k ? "bg-surface-container text-on-surface" : "text-on-surface-variant"}`}
          >
            {k}
          </button>
        ))}
      </div>

      {error ? <ErrorBanner error={error} onRetry={() => void refetch()} /> : null}
      {isLoading ? <LoadingSkeleton variant="table" /> : null}

      {!isLoading ? (
        <div className="card overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Latest Check-in</th>
                <th>Check-out</th>
                <th>Distance</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Map</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.employeeId}>
                  <td>{row.latest.employee_name ?? row.employeeId}</td>
                  <td>{formatDate(row.latest.checkin_at)}</td>
                  <td>{row.latest.checkout_at ? formatDate(row.latest.checkout_at) : "Live"}</td>
                  <td>{formatKm(row.latest.total_distance_km)}</td>
                  <td>{formatDuration(row.latest.total_duration_seconds ?? 0)}</td>
                  <td><ActivityBadge status={row.status} /></td>
                  <td>
                    <Link href={`/admin/sessions/${row.latest.id}/locations`} className="btn-icon w-7 h-7 rounded-lg">
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
