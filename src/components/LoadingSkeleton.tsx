"use client";

import { cn } from "@/lib/utils";

export function LoadingSkeleton({
  variant = "card",
  className,
}: {
  variant?: "card" | "table" | "list";
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

  return <div className={cn("card h-40 bg-surface-container-high animate-pulse", className)} />;
}
