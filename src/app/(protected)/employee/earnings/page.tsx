"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DailyWorkTable } from "@/components/field/DailyWorkTable";
import { ReportDateControls } from "@/components/field/ReportDateControls";
import { fieldApi, formatPay } from "@/lib/api/field-operations";
import { formatWorkDuration, hasReportDates, initialFieldReportSelection } from "@/lib/field-report";

export default function EarningsPage() {
  const [selection, setSelection] = useState(initialFieldReportSelection);
  const datesValid = hasReportDates(selection);
  const report = useQuery({
    queryKey: ["field", "my-report", selection],
    queryFn: () => fieldApi.myReport(selection),
    enabled: datesValid,
    refetchInterval: 30_000,
  });
  const row = report.data?.employees[0];
  const currency = report.data?.currency ?? "INR";

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">My attendance &amp; earnings</h1>
      <div className="card-high flex flex-wrap gap-3">
        <ReportDateControls selection={selection} onChange={setSelection} />
      </div>
      {!datesValid && <p role="status">Choose a report date or a range of up to 366 days.</p>}
      {report.error && <p role="alert" className="text-error">{report.error.message}</p>}
      {report.isLoading && <p>Loading earnings…</p>}
      {report.data && !row && <p>No earnings data is available for this period.</p>}
      {row && (
        <>
          <p className="text-sm text-on-surface-variant">Reporting timezone {report.data?.timezone}.</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Attendance days", row.attendance_days],
              ["Check-ins", row.attendance_count],
              ["Work time", formatWorkDuration(row.worked_seconds) + (row.has_open_shift ? " (active)" : "")],
              ["Verified visits", row.visit_count],
              ["Visit pay", formatPay(row.visit_pay_minor, currency)],
              ["Calculated payout", row.total_pay_minor === null ? "Basic pay missing" : formatPay(row.total_pay_minor, currency)],
            ].map(([label, value]) => (
              <div key={label} className="card-high">
                <p className="section-heading">{label}</p>
                <p className="mt-2 text-xl font-semibold">{value}</p>
              </div>
            ))}
          </div>
          <section className="card-high space-y-3">
            <h2 className="font-semibold">Monthly basic pay included</h2>
            {row.basic_pay_months.length ? (
              <ul className="space-y-1 text-sm">
                {row.basic_pay_months.map(({ month, amount_minor }) => (
                  <li key={month}>{month.slice(0, 7)} · {amount_minor === null ? "Basic pay missing" : formatPay(amount_minor, currency)}</li>
                ))}
              </ul>
            ) : <p className="text-sm text-on-surface-variant">Monthly basic pay is included for complete calendar months in the selected period.</p>}
          </section>
          <section className="card-high space-y-3">
            <h2 className="font-semibold">Daily report</h2>
            <DailyWorkTable days={row.days} currency={currency} />
          </section>
          <section className="card-high space-y-3">
            <h2 className="font-semibold">Location visits</h2>
            {row.visits.length === 0 && <p>No verified visits in this period.</p>}
            {row.visits.map((visit) => (
              <div key={visit.id} className="flex justify-between border-b border-outline-variant/20 py-2">
                <div>
                  <p>{visit.site_name}</p>
                  <p className="text-sm text-on-surface-variant">{new Date(visit.arrived_at).toLocaleString(undefined, { timeZone: report.data?.timezone })}</p>
                </div>
                <strong>{formatPay(visit.rate_minor, currency)}</strong>
              </div>
            ))}
          </section>
          <section className="card-high space-y-3">
            <h2 className="font-semibold">Attendance</h2>
            {row.attendance.length === 0 && <p>No check-ins in this period.</p>}
            {row.attendance.map((entry) => (
              <div key={entry.id} className="border-b border-outline-variant/20 py-2">
                <p>{new Date(entry.checkin_at).toLocaleString(undefined, { timeZone: report.data?.timezone })} · {entry.checkout_at ? "Completed" : "Active"}</p>
                <p className="text-sm text-on-surface-variant">
                  {entry.selfie_available ? "Selfie available" : entry.selfie_verified ? "Selfie verified · image expired" : "Selfie unavailable"}
                </p>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
