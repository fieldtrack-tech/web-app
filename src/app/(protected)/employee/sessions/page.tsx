"use client";

import { useState } from "react";
import { useMySessions } from "@/hooks/queries/useSessions";
import { PageHeader, LoadingState, EmptyState, StatusBadge, Pagination } from "@/components/ui";
import { formatDuration, formatKm, formatDate } from "@/lib/utils";
import dynamic from "next/dynamic";
import type { AttendanceSession } from "@/types";
import { useSessionRoute } from "@/hooks/queries/useLocations";

const RouteMap = dynamic(
  () => import("@/components/maps/RouteMap").then((m) => m.RouteMap),
  { ssr: false, loading: () => <div className="h-48 animate-pulse rounded-xl bg-surface-container" /> }
);

type SessionStatusFilter = "all" | "active" | "recent" | "inactive";

function SessionRouteRow({ session }: { session: AttendanceSession }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <tr
        className="cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <td>{formatDate(session.checkin_at)}</td>
        <td>{session.checkout_at ? formatDate(session.checkout_at) : "—"}</td>
        <td>{formatDuration(session.total_duration_seconds ?? 0)}</td>
        <td>{formatKm(session.total_distance_km)}</td>
        <td><StatusBadge status={session.checkout_at ? "CLOSED" : "ACTIVE"} /></td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={5} className="!p-0">
            <SessionMapExpanded sessionId={session.id} />
          </td>
        </tr>
      )}
    </>
  );
}

function SessionMapExpanded({ sessionId }: { sessionId: string }) {
  const { data: route } = useSessionRoute(sessionId);
  if (!route?.length) return (
    <p className="px-4 py-3 text-xs text-on-surface-variant">No route data available.</p>
  );
  return (
    <div className="px-4 py-3">
      <RouteMap points={route} className="h-48 rounded-xl overflow-hidden" />
    </div>
  );
}

export default function EmployeeSessionsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<SessionStatusFilter>("all");
  const limit = 15;
  const { data, isLoading, isError } = useMySessions(page, limit, status);

  const sessions = data?.data ?? [];
  const hasMore = page * limit < (data?.pagination.total ?? 0);

  return (
    <div className="space-y-6">
      <PageHeader title="My Sessions" subtitle="Your session history" />

      <div className="flex flex-wrap gap-1 rounded-lg bg-surface-container-high p-1 w-fit max-w-full">
        {(["all", "active", "recent", "inactive"] as const).map((value) => (
          <button
            key={value}
            onClick={() => {
              setStatus(value);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${status === value ? "bg-primary text-on-primary" : "text-on-surface-variant hover:text-on-surface"}`}
          >
            {value.toUpperCase()}
          </button>
        ))}
      </div>

      {isLoading  && <LoadingState />}
      {isError    && <EmptyState title="Failed to load" description="Please try again." />}

      {!isLoading && !isError && (
        <div className="card overflow-x-auto">
          {sessions.length === 0 ? (
            <EmptyState title="No sessions yet" description="Check in to start tracking your activity." />
          ) : (
            <>
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Duration</th>
                    <th>Distance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <SessionRouteRow key={s.id} session={s} />
                  ))}
                </tbody>
              </table>
              {(page > 1 || hasMore) && (
                <div className="pt-4">
                  <Pagination
                    page={page}
                    hasMore={hasMore}
                    onPrev={() => setPage((p) => Math.max(1, p - 1))}
                    onNext={() => setPage((p) => p + 1)}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
