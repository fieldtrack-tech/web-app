"use client";

import { Users, MapPin, Activity, Route } from "lucide-react";
import { useOrgSummary, useSessionTrend } from "@/hooks/queries/useAnalytics";
import { KpiCard } from "@/components/admin/KpiCard";
import { ActivityFeed } from "@/components/admin/ActivityFeed";
import { ActivityTrendChart } from "@/components/charts/ActivityTrendChart";
import { DistanceChart } from "@/components/charts/DistanceChart";
import { PageHeader } from "@/components/ui";
import dynamic from "next/dynamic";
import { useAdminMap } from "@/hooks/queries/useDashboard";

const FleetMap = dynamic(
  () => import("@/components/maps/FleetMap").then((m) => m.FleetMap),
  { ssr: false, loading: () => <div className="card h-72 animate-pulse" /> }
);

export default function AdminDashboardPage() {
  const { data: summary, isLoading } = useOrgSummary();
  const { data: trend = [] } = useSessionTrend();
  const { data: markers = [] } = useAdminMap();

  const activityData = trend.map((row) => ({
    label: row.date,
    checkIns: row.sessions,
  }));

  const distanceData = trend.map((row) => ({
    day: row.date,
    km: row.distance,
  }));

  const fleet = markers.map((marker) => ({
    employeeId: marker.employeeId,
    employeeName: marker.employeeName,
    latitude: marker.latitude,
    longitude: marker.longitude,
    status: (marker.status === "ACTIVE" ? "ACTIVE" : "CLOSED") as "ACTIVE" | "CLOSED",
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="Organisation overview" />

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Total Sessions"
          value={isLoading ? "—" : String(summary?.totalSessions ?? 0)}
          icon={<Activity className="w-5 h-5" />}
          accent="primary"
        />
        <KpiCard
          title="Active Employees"
          value={isLoading ? "—" : String(summary?.activeEmployeesCount ?? 0)}
          icon={<Users className="w-5 h-5" />}
          accent="success"
        />
        <KpiCard
          title="Total Distance"
          value={isLoading ? "—" : `${(summary?.totalDistanceKm ?? 0).toFixed(1)} km`}
          icon={<Route className="w-5 h-5" />}
          accent="tertiary"
        />
        <KpiCard
          title="Total Expenses"
          value={isLoading ? "—" : String(summary?.totalExpenses ?? 0)}
          icon={<MapPin className="w-5 h-5" />}
          accent={summary?.totalExpenses ? "error" : "primary"}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card space-y-3">
          <p className="font-manrope font-bold text-on-surface">Activity Trend</p>
          <ActivityTrendChart data={activityData} />
        </div>
        <div className="card space-y-3">
          <p className="font-manrope font-bold text-on-surface">Distance — Last 7 Days</p>
          <DistanceChart data={distanceData} />
        </div>
      </div>

      {/* Map + feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card space-y-3">
          <p className="font-manrope font-bold text-on-surface">Live Fleet</p>
          <FleetMap fleet={fleet} className="h-72 rounded-xl overflow-hidden" />
        </div>
        <ActivityFeed />
      </div>
    </div>
  );
}
