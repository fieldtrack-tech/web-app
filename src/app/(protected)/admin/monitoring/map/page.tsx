"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAdminMap } from "@/hooks/queries/useDashboard";
import { ErrorBanner } from "@/components/ErrorBanner";
import { LoadingState } from "@/components/ui";

const FleetMap = dynamic(
  () => import("@/components/maps/FleetMap").then((m) => m.FleetMap),
  { ssr: false, loading: () => <div className="h-96 rounded-2xl bg-surface-container animate-pulse" /> }
);

export default function MonitoringMapPage() {
  const { permissions } = useAuth();
  const [search, setSearch] = useState("");
  const { data: markers = [], isLoading, error } = useAdminMap();

  if (!permissions.viewAnalytics) return null;

  const filtered = markers.filter((m) =>
    search
      ? m.employeeName.toLowerCase().includes(search.toLowerCase()) ||
        (m.employeeCode ?? "").toLowerCase().includes(search.toLowerCase())
      : true
  );

  const fleet = filtered.map((m) => ({
    employeeId: m.employeeId,
    employeeName: m.employeeName,
    latitude: m.latitude,
    longitude: m.longitude,
    status: (m.status === "ACTIVE" ? "ACTIVE" : "CLOSED") as "ACTIVE" | "CLOSED",
  }));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-manrope text-3xl font-bold text-on-surface">Live Employee Map</h2>
        <p className="text-sm text-on-surface-variant">Latest GPS position per employee.</p>
      </div>

      {error ? <ErrorBanner error={error} /> : null}
      {isLoading ? <LoadingState /> : null}

      {!isLoading ? (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-4">
          <div className="card p-0 overflow-hidden h-[calc(100vh-16rem)]">
            <FleetMap fleet={fleet} className="w-full h-full" />
          </div>
          <div className="card space-y-3 overflow-y-auto no-scrollbar">
            <input
              className="input h-9 text-xs"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="space-y-1">
              {filtered.map((m) => (
                <div key={m.employeeId} className="p-2 rounded-lg hover:bg-surface-container-high/30 transition-colors">
                  <p className="text-sm font-medium text-on-surface">{m.employeeName}</p>
                  <p className="text-xs text-on-surface-variant">{m.employeeCode ?? m.employeeId}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
