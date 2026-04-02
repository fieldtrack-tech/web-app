"use client";

import Link from "next/link";
import { useMySessions } from "@/hooks/queries/useSessions";
import { StatusBadge, LoadingState, EmptyState, Pagination } from "@/components/ui";
import { formatDuration, formatKm, formatDate } from "@/lib/utils";
import { useState } from "react";
import { Clock, Route } from "lucide-react";

export function SessionList() {
  const [page, setPage] = useState(1);
  const limit = 10;
  const { data, isLoading, isError } = useMySessions(page, limit);

  if (isLoading) return <LoadingState />;
  if (isError)   return <EmptyState title="Failed to load sessions" description="Please try again later." />;

  const sessions = data?.data ?? [];
  const hasMore = page * limit < (data?.pagination.total ?? 0);

  return (
    <div className="card space-y-1">
      <div className="flex items-center justify-between px-2 pb-2">
        <p className="font-manrope font-bold text-on-surface">Recent Sessions</p>
        <Link
          href="/employee/sessions"
          className="text-xs text-primary hover:underline"
        >
          View all
        </Link>
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          title="No sessions yet"
          description="Check in to start your first session."
        />
      ) : (
        <>
          <div className="divide-y divide-surface-container-high/30">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between py-3 px-2 hover:bg-surface-container-high/30 rounded-xl transition-colors"
              >
                <div className="space-y-0.5 min-w-0">
                  <p className="text-sm font-medium text-on-surface truncate">
                    {formatDate(s.checkin_at)}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(s.total_duration_seconds ?? 0)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Route className="w-3 h-3" />
                      {formatKm(s.total_distance_km)}
                    </span>
                  </div>
                </div>
                <StatusBadge status={s.checkout_at ? "CLOSED" : "ACTIVE"} />
              </div>
            ))}
          </div>

          {(page > 1 || hasMore) && (
            <Pagination
              page={page}
              hasMore={hasMore}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => p + 1)}
            />
          )}
        </>
      )}
    </div>
  );
}
