"use client";

import { useState } from "react";
import { useAuditLogs } from "@/hooks/queries/useEmployees";
import {
  LoadingState,
  EmptyState,
} from "@/components/ui";
import { formatDateTime } from "@/lib/utils";

const LIMIT = 50;

export function AuditLogTable() {
  // cursor-based pagination: `before` is the created_at of the oldest item on the current page
  const [before, setBefore] = useState<string | undefined>(undefined);
  const [cursorHistory, setCursorHistory] = useState<Array<string | undefined>>([]);

  const { data: logs = [], isLoading } = useAuditLogs(LIMIT, before);

  const hasNext = logs.length === LIMIT;
  const hasPrev = cursorHistory.length > 0;

  function handleNext() {
    if (logs.length === 0) return;
    setCursorHistory((h) => [...h, before]);
    setBefore(logs[logs.length - 1].created_at);
  }

  function handlePrev() {
    const history = [...cursorHistory];
    const prev = history.pop();
    setCursorHistory(history);
    setBefore(prev);
  }

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl overflow-hidden bg-surface-container">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Actor</th>
                <th>Event</th>
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
                      <span className="font-mono text-xs text-on-surface-variant">
                        {log.actor_id ? `…${log.actor_id.slice(-8)}` : "System"}
                      </span>
                    </td>
                    <td>
                      <span className="badge-info font-mono text-xs">
                        {log.event}
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

      <div className="flex items-center justify-between pt-4">
        <span className="text-xs text-on-surface-variant">
          Showing {logs.length} {logs.length === 1 ? "entry" : "entries"}
        </span>
        <div className="flex items-center gap-2">
          <button
            className="btn-secondary px-3 py-1.5 text-xs"
            disabled={!hasPrev}
            onClick={handlePrev}
          >
            Previous
          </button>
          <button
            className="btn-secondary px-3 py-1.5 text-xs"
            disabled={!hasNext}
            onClick={handleNext}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

