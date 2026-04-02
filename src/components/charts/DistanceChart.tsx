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
    <div className="card-glass px-3 py-2 text-xs">
      <p className="text-on-surface-variant">{label}</p>
      <p className="text-primary font-semibold">
        {Number(payload[0].value).toLocaleString()} km
      </p>
    </div>
  );
};

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
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} barSize={20}>
        <CartesianGrid stroke="rgba(70,69,85,0.2)" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fill: "#c7c4d8", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#c7c4d8", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(192,193,255,0.05)" }} />
        <Bar dataKey="km" radius={[4, 4, 0, 0]}>
          {data.map((entry) => (
            <Cell
              key={entry.day}
              fill={
                entry.km === maxKm
                  ? "#c0c1ff"
                  : "rgba(192,193,255,0.35)"
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
