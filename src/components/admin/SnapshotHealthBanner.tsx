"use client";

import { AlertTriangle } from "lucide-react";
import { useSnapshotHealth } from "@/hooks/queries/useSnapshotHealth";

/**
 * SnapshotHealthBanner — shows a warning bar when snapshot data is stale (>10 min).
 *
 * Place on admin dashboard to alert admins when real-time data may be outdated.
 * Only renders when status is "degraded"; invisible when healthy.
 */
export function SnapshotHealthBanner() {
  const { data } = useSnapshotHealth();

  if (!data || data.status === "healthy") return null;

  const staleTables = Object.entries(data.tables)
    .filter(([, t]) => t.stale)
    .map(([name]) => name.replace(/_/g, " "));

  return (
    <div
      role="alert"
      className="flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3"
    >
      <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
      <div className="text-sm">
        <p className="font-medium text-on-surface">
          Snapshot data may be stale
        </p>
        <p className="text-xs text-on-surface-variant mt-0.5">
          The following tables haven&apos;t been updated in over 10 minutes:{" "}
          {staleTables.join(", ")}.
          Activity status and dashboard counts may be outdated.
        </p>
      </div>
    </div>
  );
}
