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
        "card relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
        highlighted && "border-0",
        className
      )}
      style={highlighted ? {
        background: "linear-gradient(145deg, hsl(145, 60%, 16%) 0%, hsl(142, 54%, 30%) 100%)",
        boxShadow: "0 4px 20px hsl(145 52% 20% / 0.30), 0 2px 8px hsl(145 52% 20% / 0.18)",
      } : undefined}
    >
      {highlighted && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 10% 10%, rgba(255,255,255,0.08), transparent 55%)" }}
          aria-hidden="true"
        />
      )}
      <div className="relative flex items-center justify-between mb-3">
        <p className={cn("section-heading", highlighted && "text-white/70")}>{title}</p>
        {icon ? (
          <span className={cn("p-2 rounded-xl", highlighted ? "bg-white/15 text-white" : "text-primary bg-primary/10")}>
            {icon}
          </span>
        ) : null}
      </div>
      <p className={cn("relative font-manrope text-3xl font-bold tabular-nums", highlighted ? "text-white" : "text-on-surface")}>{display}</p>
      {description ? <p className={cn("relative text-xs mt-2", highlighted ? "text-white/70" : "text-on-surface-variant")}>{description}</p> : null}
    </div>
  );
}
