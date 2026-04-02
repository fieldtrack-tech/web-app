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
    <div className="card-glass px-3 py-2 text-xs space-y-1">
      <p className="text-on-surface-variant">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

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
            <stop offset="5%"  stopColor="#c0c1ff" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#c0c1ff" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(70,69,85,0.2)" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "#c7c4d8", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#c7c4d8", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="checkIns"
          name="Check-ins"
          stroke="#c0c1ff"
          strokeWidth={1.5}
          fill="url(#gradCheckIns)"
          dot={false}
          activeDot={{ r: 4, fill: "#c0c1ff" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
