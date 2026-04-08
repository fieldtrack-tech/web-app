"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { ErrorBanner } from "@/components/ErrorBanner";
import { useAdminMap } from "@/hooks/queries/useDashboard";
import { StatusBadge } from "@/components/ui";
import { timeAgo } from "@/lib/utils";
import { Search, MapPin, X } from "lucide-react";

const FleetMap = dynamic(
  () => import("@/components/maps/FleetMap").then((m) => m.FleetMap),
  { ssr: false, loading: () => <div className="rounded-2xl bg-surface-container h-full animate-pulse" /> }
);

export default function LiveTrackingPage() {
  const [search, setSearch] = useState("");
  const [listOpen, setListOpen] = useState(true);
  const { data: markers = [], isLoading, error } = useAdminMap();

  const filtered = markers.filter((marker) =>
    !search ||
    marker.employeeName.toLowerCase().includes(search.toLowerCase()) ||
    (marker.employeeCode ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const fleet = filtered.map((marker) => ({
    employeeId: marker.employeeId,
    employeeName: marker.employeeName,
    latitude: marker.latitude,
    longitude: marker.longitude,
    status: marker.status === "ACTIVE" ? ("ACTIVE" as const) : ("CLOSED" as const),
  }));

  const activeCount = markers.filter((m) => m.status === "ACTIVE").length;

  return (
    <div className="relative h-[calc(100vh-8rem)] -mx-4 md:-mx-6 -mt-2">
      {/* Full-bleed map */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden">
        {error ? (
          <div className="p-6"><ErrorBanner error={error} /></div>
        ) : (
          <FleetMap fleet={fleet} className="w-full h-full" />
        )}
      </div>

      {/* Floating header overlay */}
      <div className="absolute top-4 left-4 right-4 flex items-center gap-3 z-[500] pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-surface/95 backdrop-blur-sm shadow-lg border border-outline-variant/30">
          <MapPin className="w-4 h-4 text-primary shrink-0" />
          <div>
            <p className="text-sm font-semibold text-on-surface leading-tight">Live Tracking</p>
            <p className="text-xs text-on-surface-variant leading-tight">{activeCount} active · {markers.length} total</p>
          </div>
        </div>
      </div>

      {/* Slide-in employee list panel */}
      <div
        className={`absolute top-4 right-4 bottom-4 z-[500] w-72 flex flex-col gap-3 transition-transform duration-300 ${
          listOpen ? "translate-x-0" : "translate-x-[calc(100%+1rem)]"
        }`}
      >
        {/* Panel card */}
        <div className="flex-1 flex flex-col rounded-2xl bg-surface/95 backdrop-blur-sm shadow-lg border border-outline-variant/30 overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/20">
            <p className="text-sm font-semibold text-on-surface">Active Locations</p>
            <button
              className="btn-icon w-7 h-7"
              onClick={() => setListOpen(false)}
              aria-label="Close panel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Search */}
          <div className="px-3 pt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant" />
              <input
                className="input h-8 pl-8 text-xs"
                placeholder="Search employees..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          {/* Employee list */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-2">
            {isLoading ? (
              <div className="space-y-2 pt-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 rounded-xl bg-surface-container-high animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-on-surface-variant text-center py-8">No live locations</p>
            ) : (
              filtered.map((marker) => (
                <div
                  key={marker.employeeId}
                  className="px-3 py-3.5 rounded-xl hover:bg-surface-container-high/60 transition-colors border border-transparent hover:border-outline-variant/20"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-sm font-semibold text-on-surface truncate">{marker.employeeName}</p>
                    <StatusBadge status={marker.status === "ACTIVE" ? "ACTIVE" : "CLOSED"} />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-on-surface-variant/70">
                    <span className="truncate">{marker.employeeCode ? `#${marker.employeeCode}` : marker.employeeId.slice(0, 8)}</span>
                    <span className="shrink-0">{timeAgo(marker.recordedAt)}</span>
                  </div>
                  <p className="text-[10px] text-on-surface-variant/50 font-mono mt-1">
                    {marker.latitude.toFixed(4)}, {marker.longitude.toFixed(4)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Toggle button when panel is closed */}
      {!listOpen && (
        <button
          className="absolute top-4 right-4 z-[500] flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-surface/95 backdrop-blur-sm shadow-lg border border-outline-variant/30 text-sm font-medium text-on-surface hover:bg-surface transition-colors"
          onClick={() => setListOpen(true)}
        >
          <MapPin className="w-4 h-4 text-primary" />
          Show Employees
        </button>
      )}
    </div>
  );
}
