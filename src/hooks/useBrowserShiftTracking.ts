"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { locationsApi } from "@/lib/api/locations";
import { capturePreciseLocation } from "@/lib/browser-location";
import { locationKeys } from "@/hooks/queries/useLocations";

const GPS_INTERVAL_MS = 15_000;

export function useBrowserShiftTracking(sessionId: string | null) {
  const queryClient = useQueryClient();
  const [lastResult, setLastResult] = useState<{ sessionId: string; message: string }>();

  useEffect(() => {
    if (!sessionId) return;
    const id = sessionId;
    let stopped = false;
    let running = false;

    async function updateLocation() {
      if (stopped || running) return;
      running = true;
      try {
        const fix = await capturePreciseLocation();
        if (stopped) return;
        await locationsApi.record(id, fix);
        if (stopped) return;
        setLastResult({ sessionId: id, message: "Sending live GPS" });
        void queryClient.invalidateQueries({ queryKey: locationKeys.route(id) });
      } catch (error) {
        if (!stopped) setLastResult({ sessionId: id, message: error instanceof Error ? error.message : "Could not send GPS." });
      } finally {
        running = false;
      }
    }

    void updateLocation();
    const timer = setInterval(updateLocation, GPS_INTERVAL_MS);
    window.addEventListener("online", updateLocation);
    document.addEventListener("visibilitychange", updateLocation);
    return () => {
      stopped = true;
      clearInterval(timer);
      window.removeEventListener("online", updateLocation);
      document.removeEventListener("visibilitychange", updateLocation);
    };
  }, [sessionId, queryClient]);

  return sessionId && lastResult?.sessionId === sessionId ? lastResult.message : "Waiting for a GPS fix";
}
