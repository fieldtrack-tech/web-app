"use client";

import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { env } from "@/lib/env";
import { supabase } from "@/lib/supabase";
import type { AttendanceSession, PaginatedResponse } from "@/types";
import { sessionKeys } from "@/hooks/queries/useSessions";

type SseEventType =
  | "session.checkin"
  | "session.checkout"
  | "expense.created"
  | "expense.status"
  | "connected";

interface SseEvent {
  type: SseEventType;
  payload: Record<string, unknown>;
  ts: string;
}

/**
 * useAdminSSE — connects to /admin/events SSE stream and invalidates
 * relevant React Query caches when real-time events arrive.
 *
 * Usage:
 *   function AdminLayout({ children }) {
 *     useAdminSSE();
 *     return <>{children}</>;
 *   }
 *
 * This hook:
 *   1. Opens an EventSource connection to the backend SSE endpoint
 *   2. Listens for session and expense events
 *   3. Invalidates matching React Query caches so data refreshes automatically
 *   4. Reconnects on connection loss with exponential backoff
 *   5. Cleans up on unmount
 *
 * Future: can be extended to dispatch events to a global event bus
 * for live toast notifications, map marker updates, etc.
 */
export function useAdminSSE({ enabled = true }: { enabled?: boolean } = {}) {
  const qc = useQueryClient();
  const esRef = useRef<EventSource | null>(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const handleEvent = useCallback(
    (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as SseEvent;

        switch (data.type) {
          case "session.checkin": {
            // Optimistic prepend: if the SSE payload carries the full session, push
            // it into the first page of org sessions cache so the UI updates without
            // waiting for the next refetch.  Still invalidate so sort order / counts
            // self-correct from the server.
            const ciPayload = data.payload as { sessionId?: string; employeeId?: string; session?: AttendanceSession };
            if (ciPayload.session) {
              qc.setQueriesData<PaginatedResponse<AttendanceSession>>(
                { queryKey: sessionKeys.orgSegment("active") },
                (old) => old
                  ? { ...old, data: [ciPayload.session!, ...old.data.filter((s) => s.id !== ciPayload.session!.id)] }
                  : old,
              );
            }
            void qc.invalidateQueries({ queryKey: sessionKeys.all });
            void qc.invalidateQueries({ queryKey: ["adminDashboard"] });
            void qc.invalidateQueries({ queryKey: ["adminMap"] });
            break;
          }
          case "session.checkout": {
            // Optimistic patch: update checkout_at on the session across all cached
            // session pages so the UI flips from ACTIVE to CLOSED immediately.
            // Still invalidate so segment lists (active/recent/inactive) re-sort.
            const coPayload = data.payload as { sessionId?: string; employeeId?: string; session?: AttendanceSession };
            if (coPayload.sessionId && coPayload.session) {
              qc.setQueriesData<PaginatedResponse<AttendanceSession>>(
                { queryKey: sessionKeys.all },
                (old) => old
                  ? { ...old, data: old.data.map((s) => s.id === coPayload.sessionId ? { ...s, ...coPayload.session } : s) }
                  : old,
              );
            }
            void qc.invalidateQueries({ queryKey: sessionKeys.all });
            void qc.invalidateQueries({ queryKey: ["adminDashboard"] });
            void qc.invalidateQueries({ queryKey: ["adminMap"] });
            break;
          }
          case "expense.created":
          case "expense.status":
            void qc.invalidateQueries({ queryKey: ["expenses"] });
            // ["adminDashboard"] replaces ["orgSummary"] — dashboard now shows
            // pending expense count from GET /admin/dashboard (P2-1 / P4-2).
            void qc.invalidateQueries({ queryKey: ["adminDashboard"] });
            break;
        }
      } catch {
        // Ignore malformed events (e.g. ping heartbeats)
      }
    },
    [qc],
  );

  const connect = useCallback(async () => {
    if (esRef.current) return;

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;

    const url = `${env.API_BASE_URL}/admin/events`;

    // EventSource doesn't support Authorization header natively.
    // We use the fetch-based EventSource polyfill pattern via token in URL.
    // For now, structure the code for future SSE usage with proper auth.
    // The backend SSE endpoint already validates JWT via preValidation.
    const es = new EventSource(`${url}?token=${encodeURIComponent(token)}`);

    const eventTypes: SseEventType[] = [
      "session.checkin",
      "session.checkout",
      "expense.created",
      "expense.status",
      "connected",
    ];

    for (const type of eventTypes) {
      es.addEventListener(type, handleEvent);
    }

    es.onerror = () => {
      es.close();
      esRef.current = null;

      // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s
      const delay = Math.min(30_000, 1000 * Math.pow(2, retryCountRef.current));
      retryCountRef.current++;

      retryTimerRef.current = setTimeout(() => {
        void connect();
      }, delay);
    };

    es.onopen = () => {
      retryCountRef.current = 0;
    };

    esRef.current = es;
  }, [handleEvent]);

  useEffect(() => {
    if (!enabled) return;

    void connect();

    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, [enabled, connect]);
}
