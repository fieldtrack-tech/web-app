import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO } from "date-fns";

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

/** Format currency (USD by default). */
export function formatCurrency(
  amount: number,
  currency = "USD",
  locale = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Format a large number with comma separators. */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

/** Format ISO date string as "MMM d, yyyy". */
export function formatDate(iso: string): string {
  try {
    return format(parseISO(iso), "MMM d, yyyy");
  } catch {
    return iso;
  }
}

/** Format ISO date string as "MMM d, yyyy HH:mm". */
export function formatDateTime(iso: string): string {
  try {
    return format(parseISO(iso), "MMM d, yyyy HH:mm");
  } catch {
    return iso;
  }
}

/** Relative time: "2m ago". */
export function timeAgo(iso: string): string {
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true });
  } catch {
    return iso;
  }
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
