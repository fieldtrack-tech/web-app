"use client";

import { cn } from "@/lib/utils";
import type { ExpenseStatus } from "@/types";

// ─── StatusBadge ─────────────────────────────────────────────────────────
interface StatusBadgeProps {
  status: ExpenseStatus | "ACTIVE" | "CLOSED" | string;
  className?: string;
}

const STATUS_MAP: Record<string, string> = {
  APPROVED: "badge-success",
  ACTIVE:   "badge-success",
  CLOSED:   "badge-neutral",
  PENDING:  "badge-pending",
  REJECTED: "badge-error",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variant = STATUS_MAP[status] ?? "badge-neutral";
  return (
    <span className={cn(variant, className)}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────
interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}
const sizeMap = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-10 h-10" };

export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <svg
      className={cn("animate-spin text-primary", sizeMap[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

// ─── LoadingState ─────────────────────────────────────────────────────────
export function LoadingState({ message = "Loading…" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-on-surface-variant">
      <Spinner size="lg" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon,
  title = "No data",
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      {icon && (
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-surface-container-high text-on-surface-variant">
          {icon}
        </div>
      )}
      <p className="font-manrope font-semibold text-on-surface">{title}</p>
      {description && (
        <p className="text-xs text-on-surface-variant max-w-xs">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

// ─── PageHeader ───────────────────────────────────────────────────────────
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-8">
      <div className="pl-4" style={{ borderLeft: "3px solid hsl(145, 58%, 22%)" }}>
        <h1 className="font-lexend font-bold text-2xl text-on-surface">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-on-surface-variant">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────
interface PaginationProps {
  page: number;
  hasMore: boolean;
  onPrev: () => void;
  onNext: () => void;
  onGoToPage?: (page: number) => void;
  showing?: number;
  total?: number;
  totalPages?: number;
  limit?: number;
}

export function Pagination({
  page,
  hasMore,
  onPrev,
  onNext,
  onGoToPage,
  showing,
  total,
  totalPages,
  limit = 50,
}: PaginationProps) {
  const rangeStart = total != null && total > 0 ? (page - 1) * limit + 1 : 0;
  const rangeEnd = showing != null ? rangeStart + showing - 1 : rangeStart;

  return (
    <div className="flex items-center justify-between pt-4">
      <span className="text-xs text-on-surface-variant">
        {total != null && total > 0
          ? `${rangeStart}–${Math.min(rangeEnd, total)} of ${total}`
          : `Page ${page}`}
        {totalPages != null && totalPages > 1 && (
          <span className="ml-1">({totalPages} pages)</span>
        )}
      </span>
      <div className="flex items-center gap-2">
        <button
          className="btn-secondary px-3 py-1.5 text-xs"
          disabled={page <= 1}
          onClick={onPrev}
        >
          Previous
        </button>
        {onGoToPage && totalPages != null && totalPages > 2 && (
          <select
            className="bg-surface-container border border-outline-variant rounded px-2 py-1 text-xs text-on-surface"
            value={page}
            onChange={(e) => onGoToPage(Number(e.target.value))}
          >
            {Array.from({ length: totalPages }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        )}
        <button
          className="btn-secondary px-3 py-1.5 text-xs"
          disabled={!hasMore}
          onClick={onNext}
        >
          Next
        </button>
      </div>
    </div>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────
export function Divider({ className }: { className?: string }) {
  return (
    <div
      className={cn("h-px w-full", className)}
      style={{ background: "hsl(var(--outline-variant) / 0.3)" }}
      aria-hidden
    />
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────
interface AvatarProps {
  name: string | null | undefined;
  size?: "sm" | "md" | "lg";
  className?: string;
}
const avatarSizeMap = {
  sm: "w-6 h-6 text-xs",
  md: "w-8 h-8 text-xs",
  lg: "w-10 h-10 text-sm",
};

export function Avatar({ name, size = "md", className }: AvatarProps) {
  const initials = name
    ? name.split(" ").slice(0, 2).map((n) => n[0]?.toUpperCase()).join("")
    : "?";

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-primary/15 text-primary font-semibold shrink-0",
        avatarSizeMap[size],
        className
      )}
    >
      {initials}
    </div>
  );
}

// ─── Select Filter ────────────────────────────────────────────────────────
interface FilterSelectProps {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
  className?: string;
}

export function FilterSelect({
  value,
  onChange,
  options,
  className,
}: FilterSelectProps) {
  return (
    <select
      className={cn("select h-9 text-xs min-w-[140px]", className)}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
