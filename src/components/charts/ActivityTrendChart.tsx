"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface DataPoint {
  label: string;
  checkIns: number;
}

interface ActivityTrendChartProps {
  data?: DataPoint[];
}

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2 text-xs space-y-1 rounded-xl border"
      style={{
        background: "var(--chart-tooltip-bg)",
        borderColor: "var(--chart-tooltip-border)",
        color: "var(--chart-text)",
      }}
    >
      <p style={{ color: "var(--chart-text)" }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: "var(--chart-line-primary)" }}>
          {p.name}: <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

// Custom tick components so inline styles carry CSS variable values (SVG attribute fill doesn't support vars)
const CustomXTick = ({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) => (
  <text x={x} y={(y ?? 0) + 12} textAnchor="middle" style={{ fill: "var(--chart-text)", fontSize: "10px" }}>
    {payload?.value}
  </text>
);
const CustomYTick = ({ x, y, payload }: { x?: number; y?: number; payload?: { value: string | number } }) => (
  <text x={(x ?? 0) - 4} y={y} textAnchor="end" dominantBaseline="middle" style={{ fill: "var(--chart-text)", fontSize: "10px" }}>
    {payload?.value}
  </text>
);

export function ActivityTrendChart({ data = [] }: ActivityTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-52 flex items-center justify-center text-sm text-on-surface-variant">
        No activity trend data available.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id="gradCheckIns" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="var(--chart-line-primary)" stopOpacity={0.4} />
            <stop offset="60%" stopColor="var(--chart-line-primary)" stopOpacity={0.12} />
            <stop offset="100%" stopColor="var(--chart-line-primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={<CustomXTick />} axisLine={false} tickLine={false} />
        <YAxis tick={<CustomYTick />} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="checkIns"
          name="Check-ins"
          stroke="var(--chart-line-primary)"
          strokeWidth={2}
          fill="url(#gradCheckIns)"
          dot={false}
          activeDot={{ r: 5, fill: "var(--chart-line-primary)", stroke: "var(--chart-tooltip-bg)", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
