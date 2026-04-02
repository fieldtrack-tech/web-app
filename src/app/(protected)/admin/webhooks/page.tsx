"use client";

import { useState } from "react";
import { useDeleteWebhook, useWebhooks } from "@/hooks/queries/useWebhooks";
import { ErrorBanner } from "@/components/ErrorBanner";
import { LoadingState } from "@/components/ui";
import { DeliveryPanel } from "@/components/webhook-test/DeliveryPanel";
import { WebhookSetupCard } from "@/components/webhook-test/WebhookSetupCard";

export default function AdminWebhooksPage() {
  const { data: webhooks, isLoading, error } = useWebhooks();
  const del = useDeleteWebhook();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-manrope text-3xl font-bold text-on-surface">Webhooks</h2>
        <p className="text-sm text-on-surface-variant">Manage registered webhook endpoints and delivery attempts.</p>
      </div>

      <WebhookSetupCard />

      {error ? <ErrorBanner error={error} /> : null}
      {isLoading ? <LoadingState message="Loading webhooks..." /> : null}

      {!isLoading ? (
        <div className="space-y-3">
          {(webhooks ?? []).map((w) => (
            <div key={w.id} className="card space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-on-surface break-all">{w.url}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {w.events.map((e) => (
                      <span key={e} className="badge-neutral text-[10px]">{e}</span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="btn-secondary h-8 px-2 text-xs" onClick={() => setExpanded((x) => (x === w.id ? null : w.id))}>
                    {expanded === w.id ? "Hide Deliveries" : "Show Deliveries"}
                  </button>
                  <button className="btn-secondary h-8 px-2 text-xs text-error" onClick={() => del.mutate(w.id)}>
                    Delete
                  </button>
                </div>
              </div>
              {expanded === w.id ? <DeliveryPanel /> : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
