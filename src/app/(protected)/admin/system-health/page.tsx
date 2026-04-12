"use client";

import { Activity, AlertTriangle, CheckCircle, Server, Webhook } from "lucide-react";
import { useSystemHealth } from "@/hooks/queries/useSystemHealth";
import { PageHeader } from "@/components/ui";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { ErrorBanner } from "@/components/ErrorBanner";

function StatusBullet({ ok }: { ok: boolean }) {
  return ok
    ? <CheckCircle className="w-4 h-4 text-success shrink-0" />
    : <AlertTriangle className="w-4 h-4 text-warning shrink-0" />;
}

function MetricRow({ label, value, warn }: { label: string; value: string | number; warn?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-on-surface-variant">{label}</span>
      <span className={`font-mono font-semibold ${warn ? "text-warning" : "text-on-surface"}`}>
        {value}
      </span>
    </div>
  );
}

export default function SystemHealthPage() {
  const { data, isLoading, error, refetch } = useSystemHealth();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="System Health" subtitle="Infrastructure + queue status" />
        <LoadingSkeleton variant="table" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="System Health" subtitle="Infrastructure + queue status" />
        <ErrorBanner error={error} onRetry={() => void refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="System Health" subtitle="Infrastructure + queue status" />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Workers */}
        <div className="card space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <Server className="w-4 h-4 text-primary" />
            </div>
            <p className="font-lexend font-bold text-sm text-on-surface">Workers</p>
            <StatusBullet ok={data?.workers.healthy ?? false} />
          </div>
          <div className="divide-y divide-outline-variant/30">
            <MetricRow label="Active" value={data?.workers.active ?? "–"} />
            <MetricRow label="Expected" value={data?.workers.expected ?? "–"} />
          </div>
        </div>

        {/* Queues */}
        <div className="card space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-cyan/10">
              <Activity className="w-4 h-4 text-accent-cyan" />
            </div>
            <p className="font-lexend font-bold text-sm text-on-surface">Queue Backlogs</p>
          </div>
          <div className="divide-y divide-outline-variant/30">
            <MetricRow
              label="Webhook"
              value={data?.queues.webhook.backlog ?? "–"}
              warn={(data?.queues.webhook.backlog ?? 0) > 100}
            />
            <MetricRow
              label="Analytics"
              value={data?.queues.analytics.backlog ?? "–"}
              warn={(data?.queues.analytics.backlog ?? 0) > 100}
            />
            <MetricRow
              label="Distance"
              value={data?.queues.distance.backlog ?? "–"}
              warn={(data?.queues.distance.backlog ?? 0) > 100}
            />
            <MetricRow
              label="Webhook DLQ"
              value={data?.queues.webhook.dlq ?? "–"}
              warn={(data?.queues.webhook.dlq ?? 0) > 0}
            />
          </div>
        </div>

        {/* Webhooks */}
        <div className="card space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-lime/10">
              <Webhook className="w-4 h-4 text-accent-lime" />
            </div>
            <p className="font-lexend font-bold text-sm text-on-surface">Webhook Deliveries</p>
          </div>
          <div className="divide-y divide-outline-variant/30">
            <MetricRow label="Total" value={data?.webhooks.totalDeliveries ?? "–"} />
            <MetricRow
              label="Success Rate"
              value={`${data?.webhooks.successRatePct ?? 0}%`}
              warn={(data?.webhooks.successRatePct ?? 100) < 90}
            />
            <MetricRow
              label="Failures"
              value={data?.webhooks.failureCount ?? "–"}
              warn={(data?.webhooks.failureCount ?? 0) > 0}
            />
            <MetricRow label="Retries" value={data?.webhooks.retryCount ?? "–"} />
          </div>
        </div>
      </div>

      <p className="text-xs text-on-surface-variant">
        Last updated: {data?.timestamp ? new Date(data.timestamp).toLocaleTimeString() : "–"} · Refreshes every 30 s
      </p>
    </div>
  );
}
