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
        "card transition-transform hover:-translate-y-0.5",
        highlighted && "bg-primary/10 border border-primary/30",
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="section-heading">{title}</p>
        {icon ? <span className="text-primary">{icon}</span> : null}
      </div>
      <p className="font-manrope text-3xl font-bold text-on-surface tabular-nums">{display}</p>
      {description ? <p className="text-xs text-on-surface-variant mt-2">{description}</p> : null}
    </div>
  );
}
