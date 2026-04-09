"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api/client";

interface SnapshotTableHealth {
  latestUpdateAt: string | null;
  rowCount: number;
  stale: boolean;
  error?: string;
}

export interface SnapshotHealthData {
  status: "healthy" | "degraded";
  checkedAt: string;
  tables: {
    employee_last_state: SnapshotTableHealth;
    org_dashboard_snapshot: SnapshotTableHealth;
    employee_metrics_snapshot: SnapshotTableHealth;
  };
}

/**
 * Polls /internal/snapshot-health every 60 seconds.
 * Returns overall status and per-table freshness.
 */
export function useSnapshotHealth() {
  return useQuery<SnapshotHealthData>({
    queryKey: ["snapshot-health"],
    queryFn: () => apiGet<SnapshotHealthData>("/internal/snapshot-health"),
    staleTime: 60_000,
    refetchInterval: 60_000,
    // Don't show errors to user if endpoint is unavailable
    retry: 1,
  });
}
