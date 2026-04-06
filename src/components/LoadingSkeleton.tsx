"use client";

import { cn } from "@/lib/utils";

export function LoadingSkeleton({
  variant = "card",
  className,
}: {
  variant?: "card" | "table" | "list" | "dashboard";
  className?: string;
}) {
  if (variant === "table") {
    return (
      <div className={cn("card space-y-2", className)}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-10 rounded-xl bg-surface-container-high animate-pulse" />
        ))}
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 rounded-xl bg-surface-container-high animate-pulse" />
        ))}
      </div>
    );
  }

  if (variant === "dashboard") {
    return (
      <div className={cn("space-y-6", className)}>
        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card h-24 bg-surface-container-high animate-pulse" />
          ))}
        </div>
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card h-52 bg-surface-container-high animate-pulse" />
          <div className="card h-52 bg-surface-container-high animate-pulse" />
        </div>
      </div>
    );
  }

  return <div className={cn("card h-40 bg-surface-container-high animate-pulse", className)} />;
}
