"use client";

import { Users, MapPin, Activity, Route, TrendingUp, Map } from "lucide-react";
import { useAdminDashboard, useAdminMap } from "@/hooks/queries/useDashboard";
import { KpiCard } from "@/components/admin/KpiCard";
import { ActivityFeed } from "@/components/admin/ActivityFeed";
import { ActivityTrendChart } from "@/components/charts/ActivityTrendChart";
import { DistanceChart } from "@/components/charts/DistanceChart";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { PageHeader } from "@/components/ui";
import { formatDayLabel, formatNumber } from "@/lib/utils";
import dynamic from "next/dynamic";

const FleetMap = dynamic(
  () => import("@/components/maps/FleetMap").then((m) => m.FleetMap),
  { ssr: false, loading: () => <div className="card h-72 animate-pulse" /> }
);

export default function AdminDashboardPage() {
  const { data, isLoading } = useAdminDashboard();
  const { data: markers = [] } = useAdminMap();

  const activityData = (data?.sessionTrend ?? []).map((row) => ({
    label: formatDayLabel(row.date),
    checkIns: row.sessions,
  }));

  const distanceData = (data?.sessionTrend ?? []).map((row) => ({
    day: formatDayLabel(row.date),
    km: row.distance,
  }));

  const fleet = markers.map((marker) => ({
    employeeId: marker.employeeId,
    employeeName: marker.employeeName,
    latitude: marker.latitude,
    longitude: marker.longitude,
    status: (marker.status === "ACTIVE" ? "ACTIVE" : "CLOSED") as "ACTIVE" | "CLOSED",
  }));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" subtitle="Organisation overview" />
        <LoadingSkeleton variant="dashboard" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="Organisation overview" />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Total Sessions Today"
          value={formatNumber(data?.todaySessionCount ?? 0)}
          icon={<Activity className="w-5 h-5" />}
          accent="primary"
          highlighted
        />
        <KpiCard
          title="Active Employees"
          value={formatNumber(data?.activeEmployeesToday ?? 0)}
          icon={<Users className="w-5 h-5" />}
          accent="lime"
        />
        <KpiCard
          title="Distance Today"
          value={`${(data?.todayDistanceKm ?? 0).toFixed(1)} km`}
          icon={<Route className="w-5 h-5" />}
          accent="cyan"
        />
        <KpiCard
          title="Pending Expenses"
          value={formatNumber(data?.pendingExpenseCount ?? 0)}
          icon={<MapPin className="w-5 h-5" />}
          accent="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-lexend font-bold text-base text-on-surface">Activity Trend</p>
              <p className="text-xs text-on-surface-variant mt-0.5">Check-ins over time</p>
            </div>
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
          </div>
          <ActivityTrendChart data={activityData} />
        </div>
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-lexend font-bold text-base text-on-surface">Distance Covered</p>
              <p className="text-xs text-on-surface-variant mt-0.5">Last 7 days (km)</p>
            </div>
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-cyan/10">
              <Route className="w-4 h-4 text-accent-cyan" />
            </div>
          </div>
          <DistanceChart data={distanceData} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-lexend font-bold text-base text-on-surface">Live Fleet</p>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {fleet.filter((f) => f.status === "ACTIVE").length} active · {fleet.length} total
              </p>
            </div>
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-lime/10">
              <Map className="w-4 h-4 text-accent-lime" />
            </div>
          </div>
          <FleetMap fleet={fleet} className="h-72 rounded-xl overflow-hidden" />
        </div>
        <ActivityFeed />
      </div>
    </div>
  );
}
