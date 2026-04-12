"use client";

import { useEffect, useState } from "react";
import { useRetryDelivery, useWebhookDeliveries, useWebhooks } from "@/hooks/queries/useWebhooks";
import { Spinner } from "@/components/ui";
import type { DeliveryStatus } from "@/types";

interface DeliveryPanelProps {
  webhookId?: string;
}

export function DeliveryPanel({ webhookId }: DeliveryPanelProps) {
  const [page, setPage] = useState(1);
  const [filterWebhook, setFilterWebhook] = useState<string>(webhookId ?? "");
  const [status, setStatus] = useState<DeliveryStatus | "">("");
  const { data: hooks } = useWebhooks();
  const { data, isLoading } = useWebhookDeliveries(page, 20, filterWebhook || undefined, status || undefined);
  const retry = useRetryDelivery();

  useEffect(() => {
    setFilterWebhook(webhookId ?? "");
    setPage(1);
  }, [webhookId]);

  const rows = data?.data ?? [];
  const total = data?.pagination.total ?? 0;

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-manrope font-bold text-on-surface">Deliveries</h3>
        <div className="flex items-center gap-2">
          {!webhookId ? (
            <select className="select h-8 text-xs" value={filterWebhook} onChange={(e) => { setFilterWebhook(e.target.value); setPage(1); }}>
              <option value="">All webhooks</option>
              {(hooks ?? []).map((w) => (
                <option key={w.id} value={w.id}>{w.url}</option>
              ))}
            </select>
          ) : null}
          <select className="select h-8 text-xs" value={status} onChange={(e) => { setStatus(e.target.value as DeliveryStatus | ""); setPage(1); }}>
            <option value="">All statuses</option>
            <option value="pending">pending</option>
            <option value="success">success</option>
            <option value="failed">failed</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="py-6 flex justify-center"><Spinner /></div>
      ) : !rows.length ? (
        <p className="text-sm text-on-surface-variant text-center py-6">No deliveries yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Event</th>
                <th>Status</th>
                <th>Webhook</th>
                <th>Attempt</th>
                <th>Code</th>
                <th>Last Attempt</th>
                <th>Response Body</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id}>
                  <td>{d.event_type ?? "(unknown)"}</td>
                  <td>{d.status}</td>
                  <td className="font-mono text-xs">{d.webhook_id.slice(0, 8)}...</td>
                  <td>{d.attempt_count}</td>
                  <td>{d.response_code ?? d.response_status ?? "-"}</td>
                  <td>{d.last_attempt_at ? new Date(d.last_attempt_at).toLocaleString() : "-"}</td>
                  <td className="max-w-[280px] truncate" title={d.response_body ?? undefined}>{d.response_body ?? "-"}</td>
                  <td>
                    <button
                      className="btn-secondary h-7 px-2 text-xs"
                      onClick={() => retry.mutate(d.id)}
                      disabled={d.status !== "failed" || retry.isPending}
                    >
                      Retry
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between pt-3 text-xs text-on-surface-variant">
            <span>{total} total</span>
            <div className="flex gap-2">
              <button className="btn-secondary h-7 px-2 text-xs" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</button>
              <button className="btn-secondary h-7 px-2 text-xs" disabled={page * 20 >= total} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
