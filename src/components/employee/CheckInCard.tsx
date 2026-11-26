"use client";

import { useEffect, useState } from "react";
import { CameraAttendance } from "./CameraAttendance";
import { useBrowserTrackingStatus } from "./BrowserShiftTracking";

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
  const [showCamera, setShowCamera] = useState(false);
  const trackingStatus = useBrowserTrackingStatus();
  const [now, setNow] = useState(Date.now);
  const checkIn  = useCheckIn();
  const checkOut = useCheckOut();
  const isPending = checkIn.isPending || checkOut.isPending;
  const isActive  = !!activeSession && !activeSession.checkout_at;

  useEffect(() => {
    if (!isActive) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isActive]);

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
              {formatDuration(Math.max(0, Math.floor((now - Date.parse(activeSession.checkin_at)) / 1000)))}
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
            <p role="status" className="text-on-surface-variant text-sm font-medium">
              {trackingStatus ?? "Managed by the device that started this shift"}
            </p>
          </div>
        </div>
      )}

      {trackingStatus && <p className="text-sm text-on-surface-variant">Keep this tab open during work so it can send GPS updates.</p>}

      {/* CTA */}
      {isActive ? (
        <button
          className="btn-primary w-full"
          style={{ background: "linear-gradient(135deg, hsl(4, 85%, 38%) 0%, hsl(4, 75%, 52%) 100%)" }}
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
      ) : showCamera ? (
        <CameraAttendance onSubmit={(body) => checkIn.mutateAsync(body)} onCancel={() => setShowCamera(false)} />
      ) : (
        <button
          className="btn-primary w-full"
          disabled={isPending}
          onClick={() => setShowCamera(true)}
        >
          {isPending ? <Spinner size="sm" /> : <Power className="w-4 h-4" />}
          Start work with selfie & GPS
        </button>
      )}

      {checkOut.isError && (
        <p className="text-xs text-error text-center">
          {(checkOut.error as Error)?.message ?? "Check-out failed"}
        </p>
      )}
    </div>
  );
}
