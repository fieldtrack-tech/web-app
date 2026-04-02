import { ActivityBadge } from "@/components/ActivityBadge";
import { MetricCard } from "@/components/MetricCard";
import { formatDuration, formatKm, formatNumber } from "@/lib/utils";
import type { EmployeeProfileData } from "@/types";
import { Clock3, Route, Trophy, Receipt, CheckCircle } from "lucide-react";

export function ProfileView({ profile, rank }: { profile: EmployeeProfileData; rank?: number }) {
  return (
    <div className="space-y-5">
      <div className="card flex items-center justify-between">
        <div>
          <h3 className="font-manrope text-2xl font-bold text-on-surface">{profile.name}</h3>
          <p className="text-sm text-on-surface-variant">{profile.employee_code ? `#${profile.employee_code}` : profile.id}</p>
        </div>
        <div className="text-right space-y-1">
          <ActivityBadge status={profile.activityStatus} />
          {rank ? <p className="text-xs text-on-surface-variant">Rank #{rank}</p> : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard title="Sessions" value={formatNumber(profile.stats.totalSessions)} numericValue={profile.stats.totalSessions} icon={<Trophy className="w-4 h-4" />} />
        <MetricCard title="Distance" value={formatKm(profile.stats.totalDistanceKm)} numericValue={profile.stats.totalDistanceKm} icon={<Route className="w-4 h-4" />} />
        <MetricCard title="Duration" value={formatDuration(profile.stats.totalDurationSeconds)} numericValue={profile.stats.totalDurationSeconds} icon={<Clock3 className="w-4 h-4" />} />
        <MetricCard title="Expenses Submitted" value={formatNumber(profile.stats.expensesSubmitted)} numericValue={profile.stats.expensesSubmitted} icon={<Receipt className="w-4 h-4" />} />
        <MetricCard title="Expenses Approved" value={formatNumber(profile.stats.expensesApproved)} numericValue={profile.stats.expensesApproved} icon={<CheckCircle className="w-4 h-4" />} highlighted />
      </div>
    </div>
  );
}
