"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSegmentedOrgSessions, useForceCheckout } from "@/hooks/queries/useSessions";
import { PageHeader, EmptyState } from "@/components/ui";
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
  const forceCheckoutMutation = useForceCheckout();

  const {
    data: sessions,
    isLoading,
    isLoadingRecent,
    isLoadingInactive,
    error,
    refetch,
  } = useSegmentedOrgSessions();

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

    // Sort by status priority: ACTIVE → RECENT → INACTIVE, then by checkin_at DESC
    const statusPriority = (s: ActivityStatus): number =>
      s === "ACTIVE" ? 1 : s === "RECENT" ? 2 : 3;
    return rows.sort((a, b) => {
      const diff = statusPriority(a.status) - statusPriority(b.status);
      if (diff !== 0) return diff;
      return new Date(b.latest.checkin_at).getTime() - new Date(a.latest.checkin_at).getTime();
    });
  }, [sessions]);

  if (!permissions.viewOrgSessions) return null;

  const filtered = tab === "all" ? grouped : grouped.filter((g) => g.status === tab);

  return (
    <div className="space-y-4">
      <PageHeader
        title="All Sessions"
        subtitle={isLoading ? "Loading…" : `${grouped.length} employee${grouped.length !== 1 ? "s" : ""} with session activity`}
      />

      <div className="flex flex-wrap gap-1 rounded-lg bg-surface-container-high p-1 w-fit max-w-full">
        {(["all", "ACTIVE", "RECENT", "INACTIVE"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k as FilterTab)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === k ? "bg-primary text-on-primary" : "text-on-surface-variant hover:text-on-surface"}`}
          >
            {k.toUpperCase()}
            {k === "RECENT" && isLoadingRecent ? " …" : ""}
            {k === "INACTIVE" && isLoadingInactive ? " …" : ""}
          </button>
        ))}
      </div>

      {error ? <ErrorBanner error={error} onRetry={() => void refetch()} /> : null}

      {isLoading ? (
        <LoadingSkeleton variant="table" />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={tab === "all" ? "No sessions yet" : `No ${tab.toLowerCase()} sessions`}
          description={tab === "all" ? "Session activity will appear here once employees check in." : "Try a different filter."}
        />
      ) : (
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.employeeId}>
                  <td>
                    <Link href={`/admin/employees/${row.employeeId}`} className="font-medium hover:text-primary transition-colors">
                      {row.latest.employee_name ?? row.employeeId}
                    </Link>
                  </td>
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
                  <td>
                    {row.status === "ACTIVE" && (
                      <button
                        onClick={() => {
                          if (confirm(`Force checkout ${row.latest.employee_name ?? row.employeeId}?`)) {
                            forceCheckoutMutation.mutate(row.employeeId);
                          }
                        }}
                        disabled={forceCheckoutMutation.isPending}
                        className="btn-icon w-7 h-7 rounded-lg text-error hover:bg-error/10"
                        title="Force checkout"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
