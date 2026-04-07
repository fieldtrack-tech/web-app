"use client";

import { LineChart, Line, ResponsiveContainer } from "recharts";

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
}

export function KpiSparkline({
  data,
  color = "var(--chart-line-primary)",
  height = 40,
}: SparklineProps) {
  const chartData = data.map((value, index) => ({ index, value }));
  const gradId = `spark-${Math.random().toString(36).slice(2, 7)}`;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.15} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 2, fill: color }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── OrgAnalytics multi-line chart ────────────────────────────────────────
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface AnalyticsDataPoint {
  date: string;
  sessions: number;
  distanceKm: number;
}

interface OrgAnalyticsChartProps {
  data?: AnalyticsDataPoint[];
}

interface ChartTooltipPayloadItem {
  name: string;
  value: number;
  stroke: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: ChartTooltipPayloadItem[];
  label?: string;
}

const ChartTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2 text-xs space-y-1 rounded-xl border"
      style={{
        background: "var(--chart-tooltip-bg)",
        borderColor: "var(--chart-tooltip-border)",
      }}
    >
      <p className="font-medium" style={{ color: "var(--chart-text)" }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.stroke }}>
          {p.name}: <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

// Theme-aware custom tick components (inline styles support CSS vars; SVG presentation attrs don't)
const XTick = ({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) => (
  <text x={x} y={(y ?? 0) + 12} textAnchor="middle" style={{ fill: "var(--chart-text)", fontSize: "10px" }}>
    {payload?.value}
  </text>
);
const YTick = ({ x, y, payload }: { x?: number; y?: number; payload?: { value: string | number } }) => (
  <text x={(x ?? 0) - 4} y={y} textAnchor="end" dominantBaseline="middle" style={{ fill: "var(--chart-text)", fontSize: "10px" }}>
    {payload?.value}
  </text>
);

export function OrgAnalyticsChart({ data = [] }: OrgAnalyticsChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-on-surface-variant">
        No analytics trend data available.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id="gSessions" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="var(--chart-line-primary)" stopOpacity={0.38} />
            <stop offset="60%" stopColor="var(--chart-line-primary)" stopOpacity={0.1} />
            <stop offset="100%" stopColor="var(--chart-line-primary)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gDistance" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="var(--chart-accent-cyan)" stopOpacity={0.38} />
            <stop offset="60%" stopColor="var(--chart-accent-cyan)" stopOpacity={0.1} />
            <stop offset="100%" stopColor="var(--chart-accent-cyan)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" tick={<XTick />} axisLine={false} tickLine={false} />
        <YAxis tick={<YTick />} axisLine={false} tickLine={false} />
        <Tooltip content={<ChartTooltip />} />
        <Area
          type="monotone"
          dataKey="sessions"
          name="Sessions"
          stroke="var(--chart-line-primary)"
          strokeWidth={2}
          fill="url(#gSessions)"
          dot={false}
          activeDot={{ r: 5, fill: "var(--chart-line-primary)", stroke: "var(--chart-tooltip-bg)", strokeWidth: 2 }}
        />
        <Area
          type="monotone"
          dataKey="distanceKm"
          name="Distance (km)"
          stroke="var(--chart-accent-cyan)"
          strokeWidth={2}
          fill="url(#gDistance)"
          dot={false}
          activeDot={{ r: 5, fill: "var(--chart-accent-cyan)", stroke: "var(--chart-tooltip-bg)", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
