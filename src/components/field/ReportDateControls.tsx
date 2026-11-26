import type { FieldReportPeriod, FieldReportSelection } from "@/lib/field-report";

const inputClass = "block w-full rounded-lg border border-outline-variant/30 bg-surface px-3 py-2 text-on-surface";

interface ReportDateControlsProps {
  selection: FieldReportSelection;
  onChange: (selection: FieldReportSelection) => void;
}

export function ReportDateControls({ selection, onChange }: ReportDateControlsProps) {
  const { period, date, from, to } = selection;
  return (
    <>
      <label>
        Period
        <select className={inputClass} value={period} onChange={(event) => onChange({ ...selection, period: event.target.value as FieldReportPeriod })}>
          <option value="day">Daily</option>
          <option value="week">Weekly</option>
          <option value="month">Monthly</option>
          <option value="range">Custom date range</option>
        </select>
      </label>
      {period === "range" ? (
        <>
          <label>
            From
            <input className={inputClass} type="date" max={to || undefined} required value={from}
              onChange={(event) => onChange({ ...selection, from: event.target.value })} />
          </label>
          <label>
            Through
            <input className={inputClass} type="date" min={from || undefined} required value={to}
              onChange={(event) => onChange({ ...selection, to: event.target.value })} />
          </label>
        </>
      ) : (
        <label>
          {period === "month" ? "Month" : period === "week" ? "Date in week" : "Date"}
          <input className={inputClass} type={period === "month" ? "month" : "date"} required value={period === "month" ? date.slice(0, 7) : date}
            onChange={(event) => {
              const next = event.target.value && period === "month" ? `${event.target.value}-01` : event.target.value;
              onChange({ period, date: next, from: next, to: next });
            }} />
        </label>
      )}
    </>
  );
}
