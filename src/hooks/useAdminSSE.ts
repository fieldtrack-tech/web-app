"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiOpenEventStream } from "@/lib/api/client";
import { sessionKeys } from "@/hooks/queries/useSessions";

export async function readAdminEvents(
  stream: ReadableStream<Uint8Array>,
  onLine: (line: string) => void,
) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let unfinished = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) return;
      const lines = (unfinished + decoder.decode(value, { stream: true })).split("\n");
      unfinished = lines.pop() ?? "";
      for (const line of lines) onLine(line.trimEnd());
    }
  } finally {
    reader.releaseLock();
  }
}

export function useAdminSSE(enabled: boolean, accessToken?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || !accessToken) return;

    const abort = new AbortController();
    let reconnect: ReturnType<typeof setTimeout> | undefined;
    let failures = 0;

    function handleLine(line: string) {
      if (abort.signal.aborted || !line.startsWith("event:")) return;
      switch (line.slice("event:".length).trim()) {
        case "connected":
          failures = 0;
          break;
        case "session.checkin":
        case "session.checkout":
          void queryClient.invalidateQueries({ queryKey: sessionKeys.all });
          void queryClient.invalidateQueries({ queryKey: ["adminDashboard"] });
          void queryClient.invalidateQueries({ queryKey: ["adminMap"] });
          void queryClient.invalidateQueries({ queryKey: ["field", "report"] });
          break;
        case "expense.created":
        case "expense.status":
          void queryClient.invalidateQueries({ queryKey: ["expenses"] });
          void queryClient.invalidateQueries({ queryKey: ["adminDashboard"] });
          break;
      }
    }

    async function connect() {
      try {
        const response = await apiOpenEventStream("/admin/events", abort.signal);
        if (response.body) await readAdminEvents(response.body, handleLine);
      } catch {
        // Reconnect after a stream, authentication, or network interruption.
      }
      if (abort.signal.aborted) return;
      const delay = Math.min(30_000, 1000 * 2 ** failures);
      failures++;
      reconnect = setTimeout(connect, delay);
    }

    void connect();
    return () => {
      abort.abort();
      clearTimeout(reconnect);
    };
  }, [enabled, accessToken, queryClient]);
}
