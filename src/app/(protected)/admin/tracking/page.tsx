"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { ErrorBanner } from "@/components/ErrorBanner";
import { useAdminMap } from "@/hooks/queries/useDashboard";
import { PageHeader, LoadingState, StatusBadge } from "@/components/ui";
import { timeAgo } from "@/lib/utils";

const FleetMap = dynamic(
  () => import("@/components/maps/FleetMap").then((m) => m.FleetMap),
  { ssr: false, loading: () => <div className="rounded-2xl bg-surface-container h-full animate-pulse" /> }
);

export default function LiveTrackingPage() {
  const [search, setSearch] = useState("");
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

  return (
    <div className="space-y-6 h-full">
      <PageHeader title="Live Tracking" subtitle={`${filtered.length} employees with live coordinates`} />

      {error ? <ErrorBanner error={error} /> : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-14rem)]">
        {/* Full map */}
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          {isLoading ? <LoadingState /> : <FleetMap fleet={fleet} className="h-full w-full" />}
        </div>

        {/* Live employee list */}
        <div className="card overflow-y-auto no-scrollbar space-y-1">
          <input
            className="input h-9 text-xs"
            placeholder="Search employees..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <p className="font-manrope font-bold text-on-surface px-1 pb-2">Active Locations</p>
          {isLoading ? (
            <LoadingState />
          ) : filtered.length === 0 ? (
            <p className="text-sm text-on-surface-variant text-center py-8">No live locations</p>
          ) : (
            filtered.map((marker) => (
              <div
                key={marker.employeeId}
                className="p-3 rounded-xl hover:bg-surface-container-high/30 transition-colors space-y-1"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-on-surface">{marker.employeeName}</p>
                  <StatusBadge status={marker.status === "ACTIVE" ? "ACTIVE" : "CLOSED"} />
                </div>
                <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                  <span>{marker.employeeCode ? `#${marker.employeeCode}` : marker.employeeId}</span>
                  <span>{timeAgo(marker.recordedAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
