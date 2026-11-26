import { formatPay, type FieldReportDay } from "@/lib/api/field-operations";
import { formatWorkDuration } from "@/lib/field-report";

export function DailyWorkTable({ days, currency }: { days: FieldReportDay[]; currency: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm tabular-nums">
        <caption className="sr-only">Daily attendance, work hours and visit pay</caption>
        <thead>
          <tr className="text-left">
            <th className="p-2" scope="col">Date</th>
            <th className="p-2" scope="col">Check-ins</th>
            <th className="p-2" scope="col">Work time</th>
            <th className="p-2" scope="col">Visits</th>
            <th className="p-2" scope="col">Visit pay</th>
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <tr key={day.date} className="border-t border-outline-variant/20">
              <th className="p-2 text-left font-medium" scope="row">{day.date}</th>
              <td className="p-2">{day.attendance_count}</td>
              <td className="p-2">{formatWorkDuration(day.worked_seconds)}{day.has_open_shift && " (active)"}</td>
              <td className="p-2">{day.visit_count}</td>
              <td className="p-2">{formatPay(day.visit_pay_minor, currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {days.length === 0 && <p className="p-2 text-sm text-on-surface-variant">No daily records in this period.</p>}
    </div>
  );
}
