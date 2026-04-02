"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Phone, UserSquare2, Route, Clock, CreditCard } from "lucide-react";
import { useEmployee } from "@/hooks/queries/useEmployees";
import { useUserSummary } from "@/hooks/queries/useAnalytics";
import { useEmployeeSessionHistory } from "@/hooks/queries/useSessions";
import { PageHeader, LoadingState, EmptyState, StatusBadge } from "@/components/ui";
import { formatDuration, formatKm, formatDate } from "@/lib/utils";

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: employee,  isLoading: loadEmp }  = useEmployee(id);
  const { data: summary,   isLoading: loadSum }  = useUserSummary(id);
  const { data: sessions,  isLoading: loadSess } = useEmployeeSessionHistory(id);

  if (loadEmp || loadSum) return <LoadingState />;
  if (!employee) return <EmptyState title="Employee not found" description="This employee record does not exist." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/employees" className="btn-icon">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <PageHeader
          title={employee.name ?? employee.full_name ?? "Employee"}
          subtitle={employee.employee_code ? `Employee #${employee.employee_code}` : "Employee profile"}
        />
      </div>

      {/* Profile card */}
      <div className="card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="space-y-1">
          <p className="section-heading">Phone</p>
          <p className="flex items-center gap-1.5 text-sm text-on-surface">
            <Phone className="w-4 h-4 text-on-surface-variant" />
            {employee.phone ?? "—"}
          </p>
        </div>
        <div className="space-y-1">
          <p className="section-heading">Employee Code</p>
          <p className="flex items-center gap-1.5 text-sm text-on-surface">
            <UserSquare2 className="w-4 h-4 text-on-surface-variant" />
            {employee.employee_code ?? "—"}
          </p>
        </div>
        <div className="space-y-1">
          <p className="section-heading">Total Sessions</p>
          <p className="text-2xl font-manrope font-bold text-on-surface">
            {summary?.totalSessions ?? "—"}
          </p>
        </div>
        <div className="space-y-1">
          <p className="section-heading">Total Distance</p>
          <p className="text-2xl font-manrope font-bold text-on-surface">
            {formatKm(summary?.totalDistanceKm)}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Avg Distance / Session",
            value: formatKm(summary?.avgDistanceKmPerSession),
            icon: <Route className="w-4 h-4" />,
          },
          {
            label: "Total Time",
            value: formatDuration(summary?.totalDurationSeconds ?? 0),
            icon: <Clock className="w-4 h-4" />,
          },
          {
            label: "Total Expenses",
            value: String(summary?.totalExpenses ?? 0),
            icon: <CreditCard className="w-4 h-4" />,
          },
        ].map((s) => (
          <div key={s.label} className="card flex items-center gap-4">
            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
              {s.icon}
            </span>
            <div>
              <p className="section-heading">{s.label}</p>
              <p className="text-xl font-manrope font-semibold text-on-surface">
                {s.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent sessions */}
      <div className="card space-y-3">
        <p className="font-manrope font-bold text-on-surface">Recent Sessions</p>
        {loadSess ? (
          <LoadingState />
        ) : (sessions?.data ?? []).length === 0 ? (
          <EmptyState title="No sessions" description="No session data available." />
        ) : (
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Date</th>
                <th>Duration</th>
                <th>Distance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(sessions?.data ?? []).map((s) => (
                <tr key={s.id}>
                  <td>{formatDate(s.checkin_at)}</td>
                  <td>{formatDuration(s.total_duration_seconds ?? 0)}</td>
                  <td>{formatKm(s.total_distance_km)}</td>
                  <td><StatusBadge status={s.checkout_at ? "CLOSED" : "ACTIVE"} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
