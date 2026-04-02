"use client";

import { LineChart, Line, ResponsiveContainer } from "recharts";

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
}

export function KpiSparkline({
  data,
  color = "#c0c1ff",
  height = 40,
}: SparklineProps) {
  const chartData = data.map((value, index) => ({ index, value }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <defs>
          <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.15} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={0.75}
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
    <div className="card-glass px-3 py-2 text-xs space-y-1">
      <p className="text-on-surface-variant font-medium">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.stroke }}>
          {p.name}: <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

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
            <stop offset="5%" stopColor="#c0c1ff" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#c0c1ff" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gDistance" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#81c784" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#81c784" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(70,69,85,0.2)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: "#c7c4d8", fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#c7c4d8", fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip content={<ChartTooltip />} />
        <Area
          type="monotone"
          dataKey="sessions"
          name="Sessions"
          stroke="#c0c1ff"
          strokeWidth={1.5}
          fill="url(#gSessions)"
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="distanceKm"
          name="Distance (km)"
          stroke="#81c784"
          strokeWidth={1.5}
          fill="url(#gDistance)"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
