"use client";

import { useState } from "react";
import { useRetryDelivery, useWebhookDeliveries, useWebhooks } from "@/hooks/queries/useWebhooks";
import { Spinner } from "@/components/ui";

export function DeliveryPanel() {
  const [page, setPage] = useState(1);
  const [filterWebhook, setFilterWebhook] = useState<string>("");
  const { data: hooks } = useWebhooks();
  const { data, isLoading } = useWebhookDeliveries(page, 20, filterWebhook || undefined);
  const retry = useRetryDelivery();

  const rows = data?.data ?? [];
  const total = data?.pagination.total ?? 0;

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-manrope font-bold text-on-surface">Deliveries</h3>
        <select className="select h-8 text-xs" value={filterWebhook} onChange={(e) => setFilterWebhook(e.target.value)}>
          <option value="">All webhooks</option>
          {(hooks ?? []).map((w) => (
            <option key={w.id} value={w.id}>{w.url}</option>
          ))}
        </select>
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
                <th>Status</th>
                <th>Webhook</th>
                <th>Attempt</th>
                <th>Response</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id}>
                  <td>{d.status}</td>
                  <td className="font-mono text-xs">{d.webhook_id.slice(0, 8)}...</td>
                  <td>{d.attempt_count}</td>
                  <td>{d.response_status ?? "-"}</td>
                  <td>
                    <button className="btn-secondary h-7 px-2 text-xs" onClick={() => retry.mutate(d.id)}>
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
