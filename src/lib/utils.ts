import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from "date-fns";

const INDIAN_LOCALE = "en-IN";
const INDIAN_CURRENCY = "INR";

function parseDateOrNull(iso: string): Date | null {
  try {
    const date = parseISO(iso);
    return Number.isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

function formatIndianTime(date: Date): string {
  return new Intl.DateTimeFormat(INDIAN_LOCALE, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

/** Merge Tailwind classes safely. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format seconds as "Xh Ym". */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Format km with 1 decimal place. */
export function formatKm(km: number | null | undefined): string {
  if (km === null) return "Calculating...";
  if (km === undefined) return "—";
  return `${km.toFixed(1)} km`;
}

/** Format currency (INR by default). */
export function formatCurrency(
  amount: number,
  currency = INDIAN_CURRENCY,
  locale = INDIAN_LOCALE
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Format a large number with comma separators. */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat(INDIAN_LOCALE).format(n);
}

/** Format ISO date string as Today/Yesterday or dd MMM yyyy. */
export function formatDate(iso: string): string {
  const date = parseDateOrNull(iso);
  if (!date) return iso;
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "dd MMM yyyy");
}

/** Format ISO date string as Today/Yesterday with Indian time. */
export function formatDateTime(iso: string): string {
  const date = parseDateOrNull(iso);
  if (!date) return iso;
  const time = formatIndianTime(date);
  if (isToday(date)) return `Today, ${time}`;
  if (isYesterday(date)) return `Yesterday, ${time}`;
  return `${format(date, "dd MMM yyyy")}, ${time}`;
}

/** Relative label with Today/Yesterday, else distance-to-now fallback. */
export function timeAgo(iso: string): string {
  const date = parseDateOrNull(iso);
  if (!date) return iso;
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return formatDistanceToNow(date, { addSuffix: true });
}

/** Compact day label for trend charts: Today, Yesterday, or calendar date. */
export function formatDayLabel(iso: string): string {
  const date = parseDateOrNull(iso);
  if (!date) return iso;
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "dd MMM");
}

/** Get initials from a full name. */
export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

/** Build a query string from an object, ignoring null/undefined values. */
export function buildQuery(
  params: Record<string, string | number | boolean | null | undefined>
): string {
  const q = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val != null && val !== "") q.set(key, String(val));
  }
  const str = q.toString();
  return str ? `?${str}` : "";
}
