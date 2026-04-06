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
    <div className="absolute right-0 top-0 h-full w-80 bg-surface-container shadow-xl z-[1000] flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-outline-variant">
        <h3 className="font-manrope font-semibold text-on-surface text-sm">
          Employee Details
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-surface-container-high transition-colors"
        >
          <X className="w-4 h-4 text-on-surface-variant" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Employee Info */}
        <div className="flex items-center gap-3">
          <Avatar name={marker.employeeName} size="lg" />
          <div>
            <p className="font-medium text-on-surface">{marker.employeeName}</p>
            <p className="text-xs text-on-surface-variant">
              {marker.employeeCode ? `#${marker.employeeCode}` : "No code"}
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-on-surface-variant" />
          <span className="text-sm text-on-surface-variant">Status:</span>
          <StatusBadge status={marker.status === "ACTIVE" ? "ACTIVE" : "CLOSED"} />
        </div>

        {/* Location */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-on-surface-variant" />
            <span className="text-sm text-on-surface-variant">Last Location</span>
          </div>
          <div className="pl-6 space-y-1">
            <p className="text-xs text-on-surface">
              {marker.latitude.toFixed(6)}, {marker.longitude.toFixed(6)}
            </p>
            <p className="text-xs text-on-surface-variant">
              Updated {timeAgo(marker.recordedAt)}
            </p>
          </div>
        </div>

        {/* Session Info */}
        {marker.sessionId && (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-on-surface-variant" />
            <span className="text-xs text-on-surface-variant">
              Active Session: {marker.sessionId.slice(0, 8)}…
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-outline-variant space-y-2">
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
