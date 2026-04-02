"use client";

import { useMemo, useState, type FormEvent } from "react";
import { WEBHOOK_EVENT_TYPES } from "@/hooks/queries/useWebhooks";
import { useCreateWebhook } from "@/hooks/queries/useWebhooks";
import type { WebhookEventType } from "@/types";
import { Spinner } from "@/components/ui";

export function WebhookSetupCard() {
  const createWebhook = useCreateWebhook();
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [events, setEvents] = useState<WebhookEventType[]>(["employee.created"]);
  const [msg, setMsg] = useState<string | null>(null);

  const eventOptions = useMemo(() => WEBHOOK_EVENT_TYPES as readonly WebhookEventType[], []);

  function toggleEvent(e: WebhookEventType) {
    setEvents((curr) =>
      curr.includes(e) ? curr.filter((x) => x !== e) : [...curr, e]
    );
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    setMsg(null);
    try {
      await createWebhook.mutateAsync({
        url: url.trim(),
        events: events,
        secret: secret.trim(),
      });
      setMsg("Webhook created.");
      setUrl("");
      setSecret("");
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Failed to create webhook");
    }
  }

  return (
    <div className="card space-y-4">
      <h3 className="font-manrope font-bold text-on-surface">Register Webhook</h3>
      <form className="space-y-3" onSubmit={onSubmit}>
        <input
          className="input w-full"
          placeholder="https://example.com/webhook"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
        <input
          className="input w-full"
          placeholder="secret"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-2">
          {eventOptions.map((e) => (
            <label key={e} className="text-xs text-on-surface-variant flex items-center gap-2">
              <input type="checkbox" checked={events.includes(e)} onChange={() => toggleEvent(e)} />
              {e}
            </label>
          ))}
        </div>
        <button className="btn-primary" disabled={createWebhook.isPending || !url || !secret.trim() || events.length === 0}>
          {createWebhook.isPending ? <Spinner size="sm" /> : null}
          Create
        </button>
      </form>
      {msg ? <p className="text-xs text-on-surface-variant">{msg}</p> : null}
    </div>
  );
}
