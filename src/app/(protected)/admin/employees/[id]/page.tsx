"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Phone, UserSquare2, Clock, CreditCard, Activity } from "lucide-react";
import { useEmployee, useEmployeeProfile } from "@/hooks/queries/useEmployees";
import { useEmployeeSessionHistory } from "@/hooks/queries/useSessions";
import { useEmployeeOrgExpenses } from "@/hooks/queries/useExpenses";
import { PageHeader, LoadingState, EmptyState, StatusBadge } from "@/components/ui";
import { formatDuration, formatKm, formatDate, timeAgo } from "@/lib/utils";

const TABS = ["Summary", "Sessions", "Expenses"] as const;
type Tab = (typeof TABS)[number];

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<Tab>("Summary");

  const { data: employee,  isLoading: loadEmp }  = useEmployee(id);
  const { data: profile,   isLoading: loadProf } = useEmployeeProfile(id);
  const { data: sessions,  isLoading: loadSess } = useEmployeeSessionHistory(id);
  const { data: expenses,  isLoading: loadExp }  = useEmployeeOrgExpenses(id);

  if (loadEmp || loadProf) return <LoadingState />;
  if (!employee) return <EmptyState title="Employee not found" description="This employee record does not exist." />;

  const prof = profile;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/employees" className="btn-icon">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <PageHeader
          title={employee.name ?? employee.full_name ?? "Employee"}
          subtitle={employee.employee_code ? `Employee #${employee.employee_code}` : "Employee profile"}
          actions={
            <div className="flex items-center gap-2">
              {prof?.employee?.is_checked_in && (
                <span className="badge-success gap-1.5 text-xs">
                  <Activity className="w-3 h-3" />
                  Currently Checked In
                </span>
              )}
              <StatusBadge status={employee.is_active ? "ACTIVE" : "CLOSED"} />
            </div>
          }
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
            {prof?.summary?.totalSessions ?? "—"}
          </p>
        </div>
        <div className="space-y-1">
          <p className="section-heading">Total Distance</p>
          <p className="text-2xl font-manrope font-bold text-on-surface">
            {formatKm(prof?.summary?.totalDistanceKm)}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Total Time",
            value: formatDuration(prof?.summary?.totalDurationSeconds ?? 0),
            icon: <Clock className="w-4 h-4" />,
          },
          {
            label: "Expenses Submitted",
            value: String(prof?.summary?.expensesSubmitted ?? 0),
            icon: <CreditCard className="w-4 h-4" />,
          },
          {
            label: "Expenses Approved",
            value: String(prof?.summary?.expensesApproved ?? 0),
            icon: <CreditCard className="w-4 h-4" />,
          },
          {
            label: "Last Seen",
            value: prof?.employee?.last_check_in_at ? timeAgo(prof.employee.last_check_in_at) : "—",
            icon: <Activity className="w-4 h-4" />,
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

      {/* Tabs */}
      <div className="tab-group">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? "tab-btn-active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "Summary" && (
        <div className="card space-y-3">
          <p className="font-manrope font-bold text-on-surface">Recent Sessions</p>
          {(prof?.recentSessions ?? []).length === 0 ? (
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
                {(prof?.recentSessions ?? []).map((s) => (
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
      )}

      {activeTab === "Sessions" && (
        <div className="card space-y-3">
          <p className="font-manrope font-bold text-on-surface">All Sessions</p>
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
      )}

      {activeTab === "Expenses" && (
        <div className="card space-y-3">
          <p className="font-manrope font-bold text-on-surface">Expenses</p>
          {loadExp ? (
            <LoadingState />
          ) : (expenses?.data ?? []).length === 0 ? (
            <EmptyState title="No expenses" description="No expense records available." />
          ) : (
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Description</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(expenses?.data ?? []).map((exp) => (
                  <tr key={exp.id}>
                    <td>{formatDate(exp.submitted_at)}</td>
                    <td className="font-medium">₹{exp.amount.toLocaleString()}</td>
                    <td className="text-on-surface-variant max-w-xs truncate">{exp.description}</td>
                    <td><StatusBadge status={exp.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
