"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { KpiSparkline } from "@/components/charts/index";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;     // e.g. 2.4 → "+2.4%"
    direction: "up" | "down" | "neutral";
  };
  sparkData?: number[];
  icon?: React.ReactNode;
  accent?: "primary" | "success" | "error" | "tertiary";
  className?: string;
}

const accentColors: Record<string, string> = {
  primary:  "#c0c1ff",
  success:  "#81c784",
  error:    "#ffb4ab",
  tertiary: "#ffb695",
};

export function KpiCard({
  title,
  value,
  subtitle,
  trend,
  sparkData,
  icon,
  accent = "primary",
  className,
}: KpiCardProps) {
  const color = accentColors[accent];

  return (
    <div className={cn("kpi-card animate-fade-in", className)}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
            {title}
          </p>
          <p className="font-manrope font-bold text-3xl text-on-surface leading-none">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-on-surface-variant">{subtitle}</p>
          )}
        </div>

        {icon && (
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
            style={{ background: `${color}18` }}
          >
            <span style={{ color }}>{icon}</span>
          </div>
        )}
      </div>

      {/* Sparkline */}
      {sparkData && (
        <div className="-mx-1">
          <KpiSparkline data={sparkData} color={color} height={40} />
        </div>
      )}

      {/* Trend */}
      {trend && (
        <div className="flex items-center gap-1.5">
          {trend.direction === "up" && (
            <TrendingUp className="w-3.5 h-3.5 text-success-green" />
          )}
          {trend.direction === "down" && (
            <TrendingDown className="w-3.5 h-3.5 text-error" />
          )}
          {trend.direction === "neutral" && (
            <Minus className="w-3.5 h-3.5 text-on-surface-variant" />
          )}
          <span
            className={cn(
              "text-xs font-medium",
              trend.direction === "up" && "text-success-green",
              trend.direction === "down" && "text-error",
              trend.direction === "neutral" && "text-on-surface-variant"
            )}
          >
            {trend.direction === "up" ? "+" : ""}
            {trend.value}%
          </span>
        </div>
      )}
    </div>
  );
}
