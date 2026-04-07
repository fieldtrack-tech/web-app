"use client";

import {
  Power,
  PowerOff,
  MapPin,
} from "lucide-react";
import { useCheckIn, useCheckOut } from "@/hooks/queries/useSessions";
import { Spinner } from "@/components/ui";
import { formatDuration, formatKm } from "@/lib/utils";
import type { AttendanceSession } from "@/types";

interface CheckInCardProps {
  activeSession: AttendanceSession | null;
}

export function CheckInCard({ activeSession }: CheckInCardProps) {
  const checkIn  = useCheckIn();
  const checkOut = useCheckOut();
  const isPending = checkIn.isPending || checkOut.isPending;
  const isActive  = !!activeSession && !activeSession.checkout_at;

  return (
    <div className="card-high space-y-5 animate-fade-in">
      {/* Status indicator */}
      <div className="flex items-center justify-between">
        <div>
          <p className="section-heading">Session Status</p>
          <p className="mt-1 font-manrope font-bold text-2xl text-on-surface">
            {isActive ? "Active Session" : "Not Checked In"}
          </p>
        </div>
        <div
          className={`flex items-center justify-center w-12 h-12 rounded-2xl ${
            isActive ? "bg-success-green/15" : "bg-surface-container-highest"
          }`}
        >
          {isActive ? (
            <div className="relative">
              <MapPin className="w-5 h-5 text-success-green" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-success-green animate-ping" />
            </div>
          ) : (
            <Power className="w-5 h-5 text-on-surface-variant" />
          )}
        </div>
      </div>

      {/* Stats row */}
      {isActive && activeSession && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-0.5">
            <p className="section-heading">Duration</p>
            <p className="font-manrope font-semibold text-on-surface">
              {formatDuration(activeSession.total_duration_seconds ?? 0)}
            </p>
          </div>
          <div className="space-y-0.5">
            <p className="section-heading">Distance</p>
            <p className="font-manrope font-semibold text-on-surface">
              {formatKm(activeSession.total_distance_km)}
            </p>
          </div>
          <div className="space-y-0.5">
            <p className="section-heading">Tracking</p>
            <p className="flex items-center gap-1 text-success-green text-sm font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-success-green animate-pulse-slow inline-block" />
              Active
            </p>
          </div>
        </div>
      )}

      {/* CTA */}
      {isActive ? (
        <button
          className="btn-primary w-full"
          style={{ background: "linear-gradient(135deg, hsl(var(--error)) 0%, hsl(var(--error-container)) 100%)" }}
          disabled={isPending}
          onClick={() => checkOut.mutate()}
        >
          {isPending ? (
            <Spinner size="sm" />
          ) : (
            <PowerOff className="w-4 h-4" />
          )}
          Check Out
        </button>
      ) : (
        <button
          className="btn-primary w-full"
          disabled={isPending}
          onClick={() => checkIn.mutate()}
        >
          {isPending ? <Spinner size="sm" /> : <Power className="w-4 h-4" />}
          Check In
        </button>
      )}

      {checkIn.isError && (
        <p className="text-xs text-error text-center">
          {(checkIn.error as Error)?.message ?? "Check-in failed"}
        </p>
      )}
      {checkOut.isError && (
        <p className="text-xs text-error text-center">
          {(checkOut.error as Error)?.message ?? "Check-out failed"}
        </p>
      )}
    </div>
  );
}
