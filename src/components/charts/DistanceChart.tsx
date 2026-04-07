"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";

interface DayData {
  day: string;
  km: number;
}

interface DistanceChartProps {
  data?: DayData[];
}

interface TooltipPayloadItem {
  value: number;
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
      className="px-3 py-2 text-xs rounded-xl border"
      style={{
        background: "var(--chart-tooltip-bg)",
        borderColor: "var(--chart-tooltip-border)",
      }}
    >
      <p style={{ color: "var(--chart-text)" }}>{label}</p>
      <p className="font-semibold" style={{ color: "var(--chart-line-primary)" }}>
        {Number(payload[0].value).toLocaleString()} km
      </p>
    </div>
  );
};

// Theme-aware tick components
const XTick = ({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) => (
  <text x={x} y={(y ?? 0) + 12} textAnchor="middle" style={{ fill: "var(--chart-text)", fontSize: "10px" }}>
    {payload?.value}
  </text>
);
const YTick = ({ x, y, payload }: { x?: number; y?: number; payload?: { value: string | number } }) => (
  <text x={(x ?? 0) - 4} y={y} textAnchor="end" dominantBaseline="middle" style={{ fill: "var(--chart-text)", fontSize: "10px" }}>
    {typeof payload?.value === "number" ? `${(payload.value / 1000).toFixed(0)}k` : payload?.value}
  </text>
);

export function DistanceChart({ data = [] }: DistanceChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-sm text-on-surface-variant">
        No distance trend data available.
      </div>
    );
  }

  const maxKm = Math.max(...data.map((d) => d.km));

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} barSize={22}>
        <defs>
          <linearGradient id="gradBar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="var(--chart-accent-cyan)" stopOpacity={1} />
            <stop offset="100%" stopColor="var(--chart-accent-cyan)" stopOpacity={0.5} />
          </linearGradient>
          <linearGradient id="gradBarDim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="var(--chart-line-primary)" stopOpacity={0.55} />
            <stop offset="100%" stopColor="var(--chart-line-primary)" stopOpacity={0.2} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="day" tick={<XTick />} axisLine={false} tickLine={false} />
        <YAxis tick={<YTick />} axisLine={false} tickLine={false} />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ fill: "var(--chart-accent-cyan)", opacity: 0.06 }}
        />
        <Bar dataKey="km" radius={[5, 5, 0, 0]}>
          {data.map((entry) => (
            <Cell
              key={entry.day}
              fill={entry.km === maxKm ? "url(#gradBar)" : "url(#gradBarDim)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
