"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fieldApi, formatPay, moneyToMinor, type FieldSite, type SiteInput } from "@/lib/api/field-operations";
import { COMPANY_CURRENCY, COMPANY_TIMEZONE, COMPANY_TIMEZONE_LABEL, companyDate } from "@/lib/attendance-selfie";
import { DailyWorkTable } from "@/components/field/DailyWorkTable";
import { ReportDateControls } from "@/components/field/ReportDateControls";
import { EmployeePayment } from "@/components/field/EmployeePayment";
import { adminApi } from "@/lib/api/admin";
import { formatWorkDuration, hasReportDates, initialFieldReportSelection } from "@/lib/field-report";

const blankSite = { name: "", address: "", latitude: "", longitude: "", arrival_radius_m: "100", departure_radius_m: "500", rate: "", is_active: true };
export default function FieldOperationsPage() {
  const client = useQueryClient();
  const [selection, setSelection] = useState(initialFieldReportSelection);
  const datesValid = hasReportDates(selection);
  const [employeeId, setEmployeeId] = useState("");
  const currency = COMPANY_CURRENCY;
  const timezone = COMPANY_TIMEZONE;
  const [site, setSite] = useState(blankSite);
  const [editingId, setEditingId] = useState<string>();
  const [salaryEmployee, setSalaryEmployee] = useState("");
  const [salaryMonth, setSalaryMonth] = useState(() => companyDate().slice(0, 7));
  const [salary, setSalary] = useState("");
  const [notice, setNotice] = useState("");
  const [localError, setLocalError] = useState("");
  const [openingSelfie, setOpeningSelfie] = useState<string>();
  const settings = useQuery({ queryKey: ["field", "settings"], queryFn: fieldApi.settings });
  const sites = useQuery({ queryKey: ["field", "sites"], queryFn: fieldApi.sites });
  const salaries = useQuery({ queryKey: ["field", "salaries"], queryFn: fieldApi.salaries, enabled: !!settings.data });
  const employees = useQuery({
    queryKey: ["employees", "field-directory"], queryFn: async ({ signal }) => {
      const first = await adminApi.employees(1, 100, {}, signal);
      const directory = [...first.data];
      for (let page = 2; page <= first.pagination.totalPages; page++) {
        const next = await adminApi.employees(page, 100, {}, signal);
        directory.push(...next.data);
      }
      return directory.sort((a, b) => (a.name ?? a.full_name ?? "").localeCompare(b.name ?? b.full_name ?? ""));
    }, enabled: !!settings.data,
  });
  const report = useQuery({ queryKey: ["field", "report", selection, employeeId], queryFn: () => fieldApi.report(selection, employeeId || undefined), enabled: !!settings.data && datesValid, refetchInterval: 30_000 });
  const action = useMutation({ mutationFn: (run: () => Promise<unknown>) => run(), retry: false, meta: { suppressGlobalError: true }, onSuccess: () => {
    void client.invalidateQueries({ queryKey: ["field"] }); setNotice("Saved successfully.");
  } });
  function run(fn: () => Promise<unknown>) { setLocalError(""); setNotice(""); action.mutate(fn); }
  function saveSite() {
    try {
      const body: SiteInput = { name: site.name, address: site.address, latitude: Number(site.latitude), longitude: Number(site.longitude),
        arrival_radius_m: Number(site.arrival_radius_m), departure_radius_m: Number(site.departure_radius_m), visit_rate_minor: moneyToMinor(site.rate), is_active: site.is_active };
      run(async () => { await fieldApi.saveSite(body, editingId); setSite(blankSite); setEditingId(undefined); });
    } catch (e) { setLocalError((e as Error).message); }
  }
  function editSite(s: FieldSite) {
    setEditingId(s.id); setSite({ name: s.name, address: s.address, latitude: String(s.latitude), longitude: String(s.longitude),
      arrival_radius_m: String(s.arrival_radius_m), departure_radius_m: String(s.departure_radius_m), rate: String(s.visit_rate_minor / 100), is_active: s.is_active });
  }
  const download = useMutation({ mutationFn: async () => {
      const result = await fieldApi.export(selection, employeeId || undefined);
      const url = URL.createObjectURL(new Blob(["\uFEFF", result.csv], { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a"); link.href = url; link.download = result.filename; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, meta: { suppressGlobalError: true } });
  async function viewSelfie(sessionId: string) {
    setLocalError("");
    setOpeningSelfie(sessionId);
    const tab = window.open("about:blank", "_blank");
    if (tab) tab.opener = null;
    try {
      const photo = await fieldApi.selfie(sessionId);
      if (tab) tab.location.replace(photo.url);
      else window.location.assign(photo.url);
    } catch (error) {
      tab?.close();
      setLocalError(error instanceof Error ? error.message : "Could not open the attendance selfie.");
    } finally {
      setOpeningSelfie(undefined);
    }
  }
  const error = localError || action.error?.message || download.error?.message || settings.error?.message || sites.error?.message || salaries.error?.message || employees.error?.message || report.error?.message;
  const rows = report.data?.employees ?? [];
  const code = settings.data?.currency ?? currency;
  const companyTimezone = settings.data?.timezone ?? timezone;
  const inputClass = "w-full rounded-lg border border-outline-variant/30 bg-surface px-3 py-2 text-on-surface";
  return <div className="space-y-6">
    <header><h1 className="text-2xl font-bold text-on-surface">Field locations & payroll</h1>
      <p className="text-on-surface-variant mt-1">Manage warehouses and monthly basic pay, then review attendance, work hours and verified visits.</p></header>
    {error && <p role="alert" className="card-high text-error">{error}</p>}
    {notice && <p role="status" className="text-success-green">{notice}</p>}
    {settings.isLoading ? <p>Loading company settings…</p> : settings.data === null && <form className="card-high space-y-4" onSubmit={(e) => { e.preventDefault(); run(() => fieldApi.configure({ currency, timezone })); }}>
      <h2 className="font-bold">Company setup</h2><p className="text-sm text-on-surface-variant">Confirmed company settings: INR and IST (UTC+05:30). Location rates and employee monthly basic pay remain configurable below.</p>
      <div className="grid sm:grid-cols-2 gap-4">
        <label>Currency<input readOnly className={inputClass} value="INR (₹)" /></label>
        <label>Company timezone<input readOnly className={inputClass} value={`${COMPANY_TIMEZONE_LABEL} · ${timezone}`} /></label>
      </div><button className="btn-primary" disabled={action.isPending}>Save company settings</button>
    </form>}
    {settings.data && <>
      <div className="card-high text-sm">Currency: <strong>{code}</strong> · Timezone: <strong>{settings.data.timezone === COMPANY_TIMEZONE ? COMPANY_TIMEZONE_LABEL : settings.data.timezone}</strong> · No attendance deductions are applied to basic pay.</div>
      <section className="card-high space-y-4">
        <h2 className="font-bold">Preset warehouses / work locations</h2>
        <form onSubmit={(e) => { e.preventDefault(); saveSite(); }} className="space-y-3">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {([['name', 'Location name', 'text'], ['address', 'Address', 'text'], ['latitude', 'Latitude', 'number'], ['longitude', 'Longitude', 'number'],
              ['arrival_radius_m', 'Arrival radius (metres)', 'number'], ['departure_radius_m', 'Distant departure (metres)', 'number'], ['rate', `Pay per visit (${code})`, 'number']] as const).map(([key, label, type]) =>
              <label key={key} className="text-sm">{label}<input className={inputClass} required={key !== "address"} type={type} step={type === "number" ? "any" : undefined}
                value={site[key]} onChange={(e) => setSite({ ...site, [key]: e.target.value })} /></label>)}
          </div>
          <label className="flex gap-2 text-sm"><input type="checkbox" checked={site.is_active} onChange={(e) => setSite({ ...site, is_active: e.target.checked })} />Location active</label>
          <p className="text-sm text-on-surface-variant">Arrival requires an accurate GPS fix inside the arrival radius. A repeat visit requires a GPS fix beyond the departure radius before returning.</p>
          <div className="flex gap-3"><button className="btn-primary" disabled={action.isPending}>{editingId ? "Update location" : "Add location"}</button>
            {editingId && <button type="button" className="btn-secondary" onClick={() => { setSite(blankSite); setEditingId(undefined); }}>Cancel edit</button>}</div>
        </form>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left"><th className="p-2">Location</th><th>Arrival / departure</th><th>Visit rate</th><th>Status</th><th /></tr></thead>
          <tbody>{sites.data?.map((s) => <tr key={s.id} className="border-t border-outline-variant/20"><td className="p-2">{s.name}<p className="text-xs text-on-surface-variant">{s.address}</p></td><td>{s.arrival_radius_m}m / {s.departure_radius_m}m</td>
            <td>{formatPay(s.visit_rate_minor, code)}</td><td>{s.is_active ? "Active" : "Inactive"}</td><td><button className="btn-secondary" onClick={() => editSite(s)}>Edit</button></td></tr>)}</tbody></table></div>
        {sites.data?.length === 0 && <p className="text-on-surface-variant">No locations configured yet.</p>}
      </section>
      <form className="card-high space-y-4" onSubmit={(e) => { e.preventDefault(); try { const amount = moneyToMinor(salary); run(() => fieldApi.setSalary(salaryEmployee, { effective_month: `${salaryMonth}-01`, amount_minor: amount })); } catch (e) { setLocalError((e as Error).message); } }}>
        <h2 className="font-bold">Employee monthly basic pay</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <label>Employee<select aria-label="Employee for basic pay" required className={inputClass} value={salaryEmployee} onChange={(e) => setSalaryEmployee(e.target.value)}><option value="">Select employee</option>{employees.data?.map((e) => <option key={e.id} value={e.id}>{e.name ?? e.full_name} · {e.employee_code}</option>)}</select></label>
          <label>Effective month<input required type="month" className={inputClass} value={salaryMonth} onChange={(e) => setSalaryMonth(e.target.value)} /></label>
          <label>Basic pay ({code})<input required type="number" min="0" step="0.01" className={inputClass} value={salary} onChange={(e) => setSalary(e.target.value)} /></label>
        </div><button className="btn-primary" disabled={action.isPending || !salaryEmployee}>Save monthly basic pay</button>
        <p className="text-sm text-on-surface-variant">Applies from the chosen month onward. Past months cannot be changed. Missing salary is flagged, not silently treated as zero.</p>
        {salaryEmployee && <ul className="text-sm">{salaries.data?.filter((s) => s.employee_id === salaryEmployee).map((s) => <li key={s.effective_month}>From {s.effective_month.slice(0, 7)}: {formatPay(s.amount_minor, code)}</li>)}</ul>}
      </form>
      <section className="card-high space-y-4">
        <div className="flex flex-wrap items-end gap-3"><h2 className="font-bold mr-auto">Employee reports</h2>
          <ReportDateControls selection={selection} onChange={setSelection} />
          <label>Employee<select aria-label="Employee for reports" className={inputClass} value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}><option value="">All employees</option>{employees.data?.map((e) => <option key={e.id} value={e.id}>{e.name ?? e.full_name} · {e.employee_code}</option>)}</select></label>
          <button className="btn-secondary" disabled={!report.data || download.isPending} onClick={() => download.mutate()}>{download.isPending ? "Preparing CSV…" : "Export CSV"}</button>
        </div>
        {!datesValid && <p role="status">Choose a report date or a range of up to 366 days.</p>}
        <p className="text-sm text-on-surface-variant">Payout includes visit pay and basic pay for complete calendar months in the selected period. Open shifts accrue work time as the report refreshes. Reporting timezone {settings.data.timezone}.</p>
        {report.isLoading && <p>Loading report…</p>}
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left"><th className="p-2">Employee</th><th>Attendance days</th><th>Check-ins</th><th>Work time</th><th>Visits</th><th>Basic pay</th><th>Visit earnings</th><th>Calculated payout</th></tr></thead>
          <tbody>{rows.map((e) => <tr key={e.employee_id} className="border-t border-outline-variant/20"><td className="p-2">{e.employee_name}<p className="text-xs">{e.employee_code}</p></td><td>{e.attendance_days}</td><td>{e.attendance_count}</td><td>{formatWorkDuration(e.worked_seconds)}{e.has_open_shift && " (active)"}</td><td>{e.visit_count}</td><td>{formatPay(e.basic_pay_minor, code)}</td><td>{formatPay(e.visit_pay_minor, code)}</td><td>{e.total_pay_minor === null ? <span className="text-error">Basic pay missing</span> : formatPay(e.total_pay_minor, code)}</td></tr>)}</tbody></table></div>
        {report.data && rows.length === 0 && <p>No employees in this period.</p>}
        {rows.map((e) => <details key={e.employee_id} className="border-t border-outline-variant/20 pt-3"><summary className="cursor-pointer font-semibold">{e.employee_name} · daily report and evidence</summary>
          <div className="mt-3"><DailyWorkTable days={e.days} currency={code} /></div>
          {e.basic_pay_months.length > 0 && <ul className="mt-3 space-y-1 text-sm">{e.basic_pay_months.map((month) => <li key={month.month}>{month.month.slice(0, 7)} basic pay · {month.amount_minor === null ? "Missing" : formatPay(month.amount_minor, code)}</li>)}</ul>}
          <div className="grid lg:grid-cols-2 gap-4 mt-3"><div><h3 className="font-semibold">Attendance</h3>{e.attendance.map((a) => <div key={a.id} className="py-2 text-sm border-b border-outline-variant/10">
            <p>{new Date(a.checkin_at).toLocaleString(undefined, { timeZone: companyTimezone })} → {a.checkout_at ? new Date(a.checkout_at).toLocaleString(undefined, { timeZone: companyTimezone }) : "Active"}</p>
            {a.start_latitude !== null && a.start_longitude !== null && <p>Start GPS {a.start_latitude}, {a.start_longitude}</p>}
            {a.selfie_available ? <button className="text-primary underline" disabled={!!openingSelfie} onClick={() => { void viewSelfie(a.id); }}>{openingSelfie === a.id ? "Opening selfie…" : "View selfie"}</button> : <span className="text-on-surface-variant">{a.selfie_verified ? "Selfie verified · image expired" : "Selfie unavailable"}</span>}
          </div>)}</div><div><h3 className="font-semibold">Verified visits</h3>{e.visits.map((v) => <div key={v.id} className="py-2 text-sm border-b border-outline-variant/10"><p>{v.site_name} · {formatPay(v.rate_minor, code)}</p>
            <p>{new Date(v.arrived_at).toLocaleString(undefined, { timeZone: companyTimezone })}</p>{v.departed_from_at && <p className="text-on-surface-variant">Distant GPS observed {new Date(v.departed_from_at).toLocaleString(undefined, { timeZone: companyTimezone })}</p>}</div>)}</div></div>
        </details>)}
      </section>
      {datesValid && employeeId && <EmployeePayment key={JSON.stringify([employeeId, selection])} employeeId={employeeId} selection={selection} timezone={companyTimezone} />}
    </>}
  </div>;
}
