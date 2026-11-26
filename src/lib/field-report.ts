import { companyDate } from "./attendance-selfie";

export type FieldReportPeriod = "day" | "week" | "month" | "range";

export interface FieldReportSelection {
  period: FieldReportPeriod;
  date: string;
  from: string;
  to: string;
}

export function initialFieldReportSelection(): FieldReportSelection {
  const date = companyDate();
  return { period: "month", date, from: date, to: date };
}

export function hasReportDates(selection: FieldReportSelection) {
  if (selection.period !== "range") return Boolean(selection.date);
  const days = (Date.parse(selection.to) - Date.parse(selection.from)) / 86_400_000 + 1;
  return days >= 1 && days <= 366;
}

export function formatWorkDuration(seconds: number) {
  const minutes = Math.max(0, Math.floor(seconds / 60));
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}
