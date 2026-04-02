"use client";

import { Activity } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdminQueues } from "@/hooks/queries/useQueues";
import { ErrorBanner } from "@/components/ErrorBanner";
import { LoadingState } from "@/components/ui";

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-outline-variant/20 last:border-0">
      <span className="text-sm text-on-surface-variant">{label}</span>
      <span className="text-sm font-mono font-medium text-on-surface">{value.toLocaleString()}</span>
    </div>
  );
}

function QueueCard({ name, stats }: { name: string; stats: { waiting: number; active: number; completed: number; failed: number; dlq?: number } }) {
  const hasBacklog = stats.waiting > 100 || stats.failed > 5;
  return (
    <div className="card space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-manrope font-bold text-on-surface capitalize">{name} Queue</p>
        <span className={hasBacklog ? "badge-error" : "badge-success"}>{hasBacklog ? "Attention" : "Healthy"}</span>
      </div>
      <StatRow label="Waiting" value={stats.waiting} />
      <StatRow label="Active" value={stats.active} />
      <StatRow label="Completed" value={stats.completed} />
      <StatRow label="Failed" value={stats.failed} />
      {stats.dlq !== undefined ? <StatRow label="Dead-letter (DLQ)" value={stats.dlq} /> : null}
    </div>
  );
}

export default function AdminQueuesPage() {
  const { permissions } = useAuth();
  const { data, isLoading, error } = useAdminQueues();

  if (!permissions.viewAnalytics) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Activity className="w-5 h-5 text-on-surface-variant" />
        <div>
          <h2 className="font-manrope text-3xl font-bold text-on-surface">Queue Monitor</h2>
          <p className="text-sm text-on-surface-variant">BullMQ stats, auto-refresh every 30 seconds.</p>
        </div>
      </div>

      {error ? <ErrorBanner error={error} /> : null}
      {isLoading ? <LoadingState message="Loading queue stats..." /> : null}

      {!isLoading && data ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <QueueCard name="analytics" stats={data.queues.analytics} />
          <QueueCard name="distance" stats={data.queues.distance} />
        </div>
      ) : null}
    </div>
  );
}
