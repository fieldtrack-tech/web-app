"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { KpiSparkline } from "@/components/charts/index";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
  };
  sparkData?: number[];
  icon?: React.ReactNode;
  accent?: "primary" | "success" | "error" | "tertiary" | "lime" | "cyan" | "purple" | "yellow";
  highlighted?: boolean;
  className?: string;
}

interface AccentConfig {
  iconBg: string;
  iconText: string;
  sparkColor: string;
  borderColor: string;
  glowColor: string;
}

// Tailwind classes — engine resolves CSS vars at runtime, opacity modifier works
// sparkColor must use pre-computed CSS var (not raw HSL channels) for SVG stroke compatibility
const accentMap: Record<string, AccentConfig> = {
  primary:  {
    iconBg: "bg-primary/10",
    iconText: "text-primary",
    sparkColor: "#2da84e",
    borderColor: "hsl(145, 58%, 22%)",
    glowColor: "hsl(145 52% 22% / 0.07)",
  },
  success:  {
    iconBg: "bg-success-green/10",
    iconText: "text-success-green",
    sparkColor: "#2da84e",
    borderColor: "hsl(var(--success-green))",
    glowColor: "hsl(var(--success-green) / 0.07)",
  },
  error:    {
    iconBg: "bg-error/10",
    iconText: "text-error",
    sparkColor: "var(--chart-accent-pink)",
    borderColor: "hsl(var(--error))",
    glowColor: "hsl(var(--error) / 0.07)",
  },
  tertiary: {
    iconBg: "bg-tertiary/10",
    iconText: "text-tertiary",
    sparkColor: "var(--chart-accent-yellow)",
    borderColor: "hsl(var(--tertiary))",
    glowColor: "hsl(var(--tertiary) / 0.07)",
  },
  lime:     {
    iconBg: "bg-accent-lime/10",
    iconText: "text-accent-lime",
    sparkColor: "#2da84e",
    borderColor: "hsl(145, 50%, 30%)",
    glowColor: "hsl(145 50% 30% / 0.07)",
  },
  cyan:     {
    iconBg: "bg-accent-cyan/10",
    iconText: "text-accent-cyan",
    sparkColor: "var(--chart-accent-cyan)",
    borderColor: "hsl(var(--accent-cyan))",
    glowColor: "hsl(var(--accent-cyan) / 0.07)",
  },
  purple:   {
    iconBg: "bg-accent-purple/10",
    iconText: "text-accent-purple",
    sparkColor: "var(--chart-accent-purple)",
    borderColor: "hsl(var(--accent-purple))",
    glowColor: "hsl(var(--accent-purple) / 0.07)",
  },
  yellow:   {
    iconBg: "bg-accent-yellow/10",
    iconText: "text-accent-yellow",
    sparkColor: "var(--chart-accent-yellow)",
    borderColor: "hsl(var(--accent-yellow))",
    glowColor: "hsl(var(--accent-yellow) / 0.07)",
  },
};

export function KpiCard({
  title,
  value,
  subtitle,
  trend,
  sparkData,
  icon,
  accent = "primary",
  highlighted = false,
  className,
}: KpiCardProps) {
  const { iconBg, iconText, sparkColor, borderColor, glowColor } = accentMap[accent] ?? accentMap.primary;

  // Highlighted variant — dark green gradient, white text
  if (highlighted) {
    return (
      <div className={cn("kpi-card-highlight animate-fade-in relative overflow-hidden", className)}>
        {/* Header row */}
        <div className="relative flex items-start justify-between gap-2">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/70">
              {title}
            </p>
            <p className="font-sans font-bold text-3xl text-white leading-none">
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-white/70">{subtitle}</p>
            )}
          </div>
          {icon && (
            <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl shrink-0 bg-white/15">
              <span className="text-white">{icon}</span>
            </div>
          )}
        </div>
        {sparkData && (
          <div className="relative -mx-1">
            <KpiSparkline data={sparkData} color="rgba(255,255,255,0.5)" height={40} />
          </div>
        )}
        {trend && (
          <div className="relative flex items-center gap-1.5">
            {trend.direction === "up" && <TrendingUp className="w-3.5 h-3.5 text-white/80" />}
            {trend.direction === "down" && <TrendingDown className="w-3.5 h-3.5 text-white/80" />}
            {trend.direction === "neutral" && <Minus className="w-3.5 h-3.5 text-white/80" />}
            <span className="text-xs font-medium text-white/80">
              {trend.direction === "up" ? "+" : ""}{trend.value}%
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn("kpi-card animate-fade-in relative overflow-hidden", className)}
      style={{ borderTop: `2px solid ${borderColor}` }}
    >
      {/* Accent glow overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 0% 0%, ${glowColor}, transparent 60%)` }}
        aria-hidden="true"
      />

      {/* Header row */}
      <div className="relative flex items-start justify-between gap-2">
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
          <div className={cn("relative flex items-center justify-center w-11 h-11 rounded-2xl shrink-0 ring-1 ring-inset ring-white/5", iconBg)}>
            <span className={iconText}>{icon}</span>
          </div>
        )}
      </div>

      {/* Sparkline */}
      {sparkData && (
        <div className="relative -mx-1">
          <KpiSparkline data={sparkData} color={sparkColor} height={40} />
        </div>
      )}

      {/* Trend */}
      {trend && (
        <div className="relative flex items-center gap-1.5">
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
