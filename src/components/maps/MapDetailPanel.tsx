"use client";

import { X, User, Clock, MapPin, Activity } from "lucide-react";
import { useRouter } from "next/navigation";
import type { EmployeeMapMarker } from "@/types";
import { StatusBadge, Avatar } from "@/components/ui";
import { timeAgo } from "@/lib/utils";

interface MapDetailPanelProps {
  marker: EmployeeMapMarker | null;
  onClose: () => void;
}

export function MapDetailPanel({ marker, onClose }: MapDetailPanelProps) {
  const router = useRouter();

  if (!marker) return null;

  return (
    <div className="absolute right-3 top-3 bottom-3 w-80 rounded-2xl bg-surface/95 backdrop-blur-md shadow-lg border border-outline-variant/30 z-[1000] flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-outline-variant/20">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
          <h3 className="font-semibold text-on-surface text-sm">
            Employee Details
          </h3>
        </div>
        <button
          onClick={onClose}
          className="btn-icon w-7 h-7"
        >
          <X className="w-3.5 h-3.5 text-on-surface-variant" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Employee Info */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/6">
          <Avatar name={marker.employeeName} size="lg" />
          <div>
            <p className="font-semibold text-on-surface">{marker.employeeName}</p>
            <p className="text-xs text-on-surface-variant">
              {marker.employeeCode ? `#${marker.employeeCode}` : "No code"}
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 px-1">
          <Activity className="w-4 h-4 text-on-surface-variant shrink-0" />
          <span className="text-sm text-on-surface-variant">Status</span>
          <div className="ml-auto">
            <StatusBadge status={marker.status === "ACTIVE" ? "ACTIVE" : "CLOSED"} />
          </div>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <MapPin className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm font-medium text-on-surface">Last Location</span>
          </div>
          <div className="bg-surface-container-high rounded-xl px-3 py-2.5 space-y-1">
            <p className="text-xs font-mono text-on-surface">
              {marker.latitude.toFixed(6)}, {marker.longitude.toFixed(6)}
            </p>
            <p className="text-xs text-on-surface-variant">
              Updated {timeAgo(marker.recordedAt)}
            </p>
          </div>
        </div>

        {/* Session Info */}
        {marker.sessionId && (
          <div className="bg-surface-container-high rounded-xl px-3 py-2.5">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary shrink-0" />
              <div>
                <p className="text-xs font-medium text-on-surface">Active Session</p>
                <p className="text-xs font-mono text-on-surface-variant">{marker.sessionId.slice(0, 16)}…</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-outline-variant/20 space-y-2">
        <button
          className="btn-primary w-full text-xs py-2"
          onClick={() => router.push(`/admin/employees/${marker.employeeId}`)}
        >
          <User className="w-3.5 h-3.5 mr-1.5" />
          View Profile
        </button>
        {marker.sessionId && (
          <button
            className="btn-secondary w-full text-xs py-2"
            onClick={() => router.push(`/admin/sessions/${marker.sessionId}`)}
          >
            <Clock className="w-3.5 h-3.5 mr-1.5" />
            View Session
          </button>
        )}
      </div>
    </div>
  );
}
