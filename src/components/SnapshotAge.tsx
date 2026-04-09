"use client";

import { useEffect, useState } from "react";

interface SnapshotAgeProps {
  updatedAt: string | null | undefined;
  className?: string;
}

function formatAge(ms: number): string {
  if (ms < 60_000) return `${Math.floor(ms / 1000)}s ago`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  return `${Math.floor(ms / 3_600_000)}h ago`;
}

/**
 * SnapshotAge — displays "Last updated X seconds ago" for any snapshot table.
 *
 * Re-renders every 10 seconds so the displayed age stays accurate without
 * causing frequent API refetches.
 *
 * Usage:
 *   <SnapshotAge updatedAt={dashboard.snapshotUpdatedAt} />
 */
export function SnapshotAge({ updatedAt, className }: SnapshotAgeProps) {
  const [, tick] = useState(0);

  // Refresh the displayed age every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => tick((n) => n + 1), 10_000);
    return () => clearInterval(timer);
  }, []);

  if (!updatedAt) return null;

  const ageMs = Date.now() - new Date(updatedAt).getTime();
  const isStale = ageMs > 10 * 60 * 1000; // >10 min = warn

  return (
    <span
      className={[
        "text-xs",
        isStale ? "text-warning" : "text-base-content/50",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      title={`Snapshot written at ${new Date(updatedAt).toLocaleTimeString()}`}
    >
      Last updated {formatAge(ageMs)}
      {isStale && " ⚠ stale"}
    </span>
  );
}
