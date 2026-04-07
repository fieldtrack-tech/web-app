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

  // Harmonized multi-color palette — green-dominant, with cyan/purple/yellow accents
  const BAR_PALETTES = [
    { id: "bpGreen",  stops: [{ off: "0%",   color: "#1a5c28", op: 1 }, { off: "100%", color: "#2da84e", op: 0.85 }] },
    { id: "bpCyan",   stops: [{ off: "0%",   color: "#0e6b7a", op: 1 }, { off: "100%", color: "#22afc5", op: 0.85 }] },
    { id: "bpPurple", stops: [{ off: "0%",   color: "#5b30a0", op: 1 }, { off: "100%", color: "#9b6fe0", op: 0.85 }] },
    { id: "bpYellow", stops: [{ off: "0%",   color: "#8a6500", op: 1 }, { off: "100%", color: "#e9ab1e", op: 0.85 }] },
    { id: "bpTeal",   stops: [{ off: "0%",   color: "#0b6b5a", op: 1 }, { off: "100%", color: "#1cbf9c", op: 0.85 }] },
  ];

  // Max bar always gets the bright green; others cycle through palette by index
  const getBarFill = (entry: DayData, idx: number) => {
    if (entry.km === maxKm) return "url(#bpGreen)";
    return `url(#${BAR_PALETTES[((idx % (BAR_PALETTES.length - 1)) + 1)]?.id ?? "bpCyan"})`;
  };

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} barSize={22}>
        <defs>
          {BAR_PALETTES.map(({ id, stops }) => (
            <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
              {stops.map((s) => (
                <stop key={s.off} offset={s.off} stopColor={s.color} stopOpacity={s.op} />
              ))}
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="day" tick={<XTick />} axisLine={false} tickLine={false} />
        <YAxis tick={<YTick />} axisLine={false} tickLine={false} />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ fill: "var(--chart-grid)", opacity: 0.5, radius: 6 }}
        />
        <Bar dataKey="km" radius={[6, 6, 0, 0]}>
          {data.map((entry, idx) => (
            <Cell
              key={entry.day}
              fill={getBarFill(entry, idx)}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
