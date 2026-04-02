"use client";

import { useState } from "react";
import { useAuditLogs } from "@/hooks/queries/useEmployees";
import {
  LoadingState,
  EmptyState,
  Pagination,
  Avatar,
} from "@/components/ui";
import { formatDateTime } from "@/lib/utils";

export function AuditLogTable() {
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const { data, isLoading } = useAuditLogs(page, LIMIT);
  const logs = data?.data ?? [];
  const total = data?.pagination.total ?? 0;

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl overflow-hidden bg-surface-container">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Actor</th>
                <th>Action</th>
                <th>Resource</th>
                <th>Resource ID</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {!logs?.length ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      title="No audit logs"
                      description="No audit events found."
                    />
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={log.actor_name} size="sm" />
                        <span className="font-medium text-on-surface">
                          {log.actor_name ?? log.actor_id?.slice(-8) ?? "System"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="badge-info font-mono text-xs">
                        {log.action}
                      </span>
                    </td>
                    <td className="text-on-surface-variant">
                      {log.resource_type}
                    </td>
                    <td className="font-mono text-xs text-on-surface-variant">
                      {log.resource_id ? `…${log.resource_id.slice(-8)}` : "—"}
                    </td>
                    <td className="text-on-surface-variant whitespace-nowrap">
                      {formatDateTime(log.created_at)}
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
        showing={logs.length}
        total={total}
      />
    </div>
  );
}
