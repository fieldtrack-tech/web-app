import { apiGet, apiPost, apiPatch } from "./client";
import type { FieldReportPeriod, FieldReportSelection } from "../field-report";

export type FieldSettings = { currency: string; timezone: string };
export type SiteInput = { name: string; address: string; latitude: number; longitude: number;
  arrival_radius_m: number; departure_radius_m: number; visit_rate_minor: number; is_active: boolean };
export type FieldSite = SiteInput & { id: string };
export type BasicPay = { employee_id: string; effective_month: string; amount_minor: number };
export type CameraCheckIn = { challenge_id: string; latitude: number; longitude: number; accuracy: number;
  captured_at: string; location_at: string };
export type ArrivalFix = { latitude: number; longitude: number; accuracy: number; recorded_at: string };
export type ArrivalReceipt = { visit_id: string | null; site_id: string; arrived_at: string; amount_minor: number; currency: string; payable?: boolean };
export type PaymentComponent = "visits" | "basic" | "both";
export type PaymentPreview = {
  employee_id: string;
  from: string;
  to_exclusive: string;
  currency: string;
  basic_pay_minor: number | null;
  visit_pay_minor: number;
  total_pay_minor: number | null;
  visit_count: number;
  missing_salary_months: string[];
  recordable: boolean;
  reason: string | null;
};
export type PaymentRecord = {
  id: string;
  employee_id: string;
  from: string;
  to_exclusive: string;
  component: PaymentComponent;
  currency: string;
  basic_pay_minor: number | null;
  visit_pay_minor: number;
  total_pay_minor: number;
  created_at: string;
  recorded_by: string;
  reference: string | null;
};
export type FieldReportDay = { date: string; attendance_count: number; worked_seconds: number;
  visit_count: number; visit_pay_minor: number; has_open_shift: boolean };
export type FieldReport = { period: FieldReportPeriod; from: string; to_exclusive: string; currency: string; timezone: string;
  employees: Array<{ employee_id: string; employee_name: string; employee_code: string; attendance_days: number;
    attendance_count: number; worked_seconds: number; has_open_shift: boolean; days: FieldReportDay[];
    salary_configured: boolean; basic_pay_minor: number | null; visit_count: number; visit_pay_minor: number;
    basic_pay_months: Array<{ month: string; amount_minor: number | null }>; total_pay_minor: number | null;
    visits: Array<{ id: string; site_id: string; site_name: string; arrived_at: string; departed_from_at: string | null; rate_minor: number }>;
    attendance: Array<{ id: string; checkin_at: string; checkout_at: string | null; start_latitude: number | null;
      start_longitude: number | null; selfie_available: boolean; selfie_verified?: boolean }> }> };

function reportParams(selection: FieldReportSelection, employeeId?: string) {
  const { period, date, from, to } = selection;
  return {
    period,
    ...(period === "range" ? { from, to } : { date }),
    ...(employeeId ? { employee_id: employeeId } : {}),
  };
}

export const fieldApi = {
  settings: () => apiGet<FieldSettings | null>("/field/settings"),
  configure: (body: FieldSettings) => apiPost<FieldSettings>("/admin/field/settings", body),
  sites: () => apiGet<FieldSite[]>("/field/sites"),
  reach: (siteId: string, fix: ArrivalFix) => apiPost<ArrivalReceipt>(`/field/sites/${siteId}/reach`, fix),
  saveSite: (body: SiteInput, id?: string) => id ? apiPatch<FieldSite>(`/admin/field/sites/${id}`, body)
    : apiPost<FieldSite>("/admin/field/sites", body),
  salaries: () => apiGet<BasicPay[]>("/admin/field/basic-pay"),
  setSalary: (employeeId: string, body: { effective_month: string; amount_minor: number }) =>
    apiPost(`/admin/field/basic-pay/${employeeId}`, body),
  report: (selection: FieldReportSelection, employeeId?: string) =>
    apiGet<FieldReport>("/admin/field/reports", reportParams(selection, employeeId)),
  myReport: (selection: FieldReportSelection) => apiGet<FieldReport>("/field/my-report", reportParams(selection)),
  export: (selection: FieldReportSelection, employeeId?: string) =>
    apiGet<{ filename: string; csv: string }>("/admin/field/reports/export", reportParams(selection, employeeId)),
  paymentHistory: (employeeId: string) => apiGet<PaymentRecord[]>(`/admin/field/payments/${employeeId}`),
  paymentPreview: (employeeId: string, selection: FieldReportSelection, component: PaymentComponent) =>
    apiGet<PaymentPreview>(`/admin/field/payments/${employeeId}/preview`, { ...reportParams(selection), component }),
  recordPayment: (employeeId: string, selection: FieldReportSelection, component: PaymentComponent, total: number, requestId: string, reference: string) =>
    apiPost<PaymentRecord>(`/admin/field/payments/${employeeId}`, {
      ...reportParams(selection), component, expected_total_minor: total, request_id: requestId,
      ...(reference.trim() ? { reference: reference.trim() } : {}),
    }),
  selfie: (sessionId: string) => apiGet<{ url: string }>(`/attendance/${sessionId}/selfie`),
  challenge: () => apiPost<{ challenge_id: string; upload_url: string; expires_at: string }>("/attendance/selfie-challenge", {}),
};

export function moneyToMinor(value: string) {
  if (!/^\d+(\.\d{1,2})?$/.test(value)) throw new Error("Enter a non-negative amount with at most two decimal places.");
  const [whole, fraction = ""] = value.split(".");
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(amount) || amount > 100_000_000_000) throw new Error("Amount is too large.");
  return amount;
}
export function formatPay(amount: number | null, currency: string) {
  return amount == null ? "—" : new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount / 100);
}
