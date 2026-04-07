"use client";

import type { ReactNode } from "react";
import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";
import { cn } from "@/lib/utils";

export function MetricCard({
  title,
  value,
  numericValue,
  icon,
  description,
  highlighted = false,
  className,
}: {
  title: string;
  value: string | number;
  numericValue?: number;
  icon?: ReactNode;
  description?: string;
  highlighted?: boolean;
  className?: string;
}) {
  const animated = useAnimatedNumber(numericValue ?? 0);
  const display = numericValue !== undefined ? animated : value;

  return (
    <div
      className={cn(
        "card relative overflow-hidden transition-transform hover:-translate-y-0.5",
        highlighted && "border-accent-lime/30",
        className
      )}
      style={highlighted ? { borderTop: "2px solid hsl(var(--accent-lime))" } : undefined}
    >
      {highlighted && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 0% 0%, hsl(var(--accent-lime) / 0.06), transparent 60%)" }}
          aria-hidden="true"
        />
      )}
      <div className="relative flex items-center justify-between mb-3">
        <p className="section-heading">{title}</p>
        {icon ? (
          <span className={cn("p-2 rounded-xl", highlighted ? "text-accent-lime bg-accent-lime/10" : "text-primary bg-primary/10")}>
            {icon}
          </span>
        ) : null}
      </div>
      <p className="relative font-manrope text-3xl font-bold text-on-surface tabular-nums">{display}</p>
      {description ? <p className="relative text-xs text-on-surface-variant mt-2">{description}</p> : null}
    </div>
  );
}
