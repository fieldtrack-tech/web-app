"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useRetryIntents } from "@/hooks/queries/useRetryIntents";
import { PageHeader, StatusBadge, Pagination } from "@/components/ui";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ErrorBanner } from "@/components/ErrorBanner";
import { formatDate } from "@/lib/utils";
import type { RetryIntentStatus } from "@/lib/api/retryIntents";

const STATUS_TABS: { label: string; value: RetryIntentStatus }[] = [
  { label: "Pending", value: "pending" },
  { label: "Failed", value: "failed" },
  { label: "Dead", value: "dead" },
  { label: "All", value: "all" },
];

export default function RetryIntentsPage() {
  const [status, setStatus] = useState<RetryIntentStatus>("pending");
  const [page, setPage] = useState(1);
  const LIMIT = 50;

  const { data, isLoading, error, refetch } = useRetryIntents(status, page, LIMIT);
  const items = data?.data ?? [];
  const totalPages = data?.pagination.totalPages ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Retry Intents"
        subtitle="Queue enqueue failures awaiting retry"
        actions={
          <button
            onClick={() => void refetch()}
            className="btn-secondary h-9 px-3 text-xs flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        }
      />

      {/* Status filter */}
      <div className="flex flex-wrap gap-1 rounded-lg bg-surface-container-high p-1 w-fit">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => { setStatus(t.value); setPage(1); }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              status === t.value
                ? "bg-primary text-on-primary"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error ? <ErrorBanner error={error} onRetry={() => void refetch()} /> : null}

      {isLoading ? (
        <LoadingSkeleton variant="table" />
      ) : items.length === 0 ? (
        <div className="card text-center py-12 text-on-surface-variant text-sm">
          No {status} retry intents.
        </div>
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Queue</th>
                  <th>Job Key</th>
                  <th>Status</th>
                  <th>Retries</th>
                  <th>Error</th>
                  <th>Next Retry</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="font-mono text-xs">{item.queue_name}</td>
                    <td className="font-mono text-xs max-w-[200px] truncate" title={item.job_key}>
                      {item.job_key}
                    </td>
                    <td>
                      <StatusBadge
                        status={item.status === "pending" ? "PENDING" : item.status === "dead" ? "REJECTED" : "REVIEWING"}
                      />
                    </td>
                    <td className="tabular-nums">{item.retry_count}</td>
                    <td className="max-w-[250px] truncate text-xs text-on-surface-variant" title={item.error_message ?? ""}>
                      {item.error_message ?? "–"}
                    </td>
                    <td className="text-xs">{item.next_retry_at ? formatDate(item.next_retry_at) : "–"}</td>
                    <td className="text-xs">{formatDate(item.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <Pagination
              page={page}
              hasMore={page < totalPages}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => p + 1)}
              totalPages={totalPages}
            />
          )}
        </>
      )}
    </div>
  );
}
