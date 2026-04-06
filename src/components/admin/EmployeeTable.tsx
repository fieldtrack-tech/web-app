"use client";

import { useState } from "react";
import { Search, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEmployees } from "@/hooks/queries/useEmployees";
import {
  EmptyState,
  Pagination,
  Avatar,
  StatusBadge,
} from "@/components/ui";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { formatDate, timeAgo } from "@/lib/utils";

export function EmployeeTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const LIMIT = 20;

  const { data, isLoading } = useEmployees(page, LIMIT);
  const employees = data?.data ?? [];
  const total = data?.pagination.total ?? 0;
  const checkedIn = employees.filter((e) => e.is_checked_in).length;

  const filtered = employees?.filter(
    (e) =>
      !search ||
      e.name?.toLowerCase().includes(search.toLowerCase()) ||
      (e.employee_code ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (e.phone ?? "").toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <LoadingSkeleton variant="table" />;

  return (
    <div className="space-y-4">
      {/* Stats + Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="badge-info gap-1.5">
            <Users className="w-3 h-3" />
            {total} total
          </span>
          {checkedIn > 0 && (
            <span className="badge-success gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success-green" />
              {checkedIn} checked in
            </span>
          )}
        </div>
        <div className="relative max-w-xs w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant" />
          <input
            className="input pl-9 h-9 text-xs"
            placeholder="Search name, code, or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden bg-surface-container">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Code</th>
                <th>Phone</th>
                <th>Employment</th>
                <th>Activity</th>
                <th>Last Activity</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {!filtered?.length ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={<Users className="w-5 h-5" />}
                      title="No employees"
                      description="No employees match your search."
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => (
                  <tr
                    key={emp.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/admin/employees/${emp.id}`)}
                  >
                    <td>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={emp.name} size="md" />
                        <div>
                          <p className="font-medium text-on-surface">
                            {emp.name ?? "—"}
                          </p>
                          <p className="text-xs text-on-surface-variant">
                            {emp.employee_code ? `#${emp.employee_code}` : emp.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="text-on-surface-variant">{emp.employee_code ?? "—"}</td>
                    <td className="text-on-surface-variant">{emp.phone ?? "—"}</td>
                    <td>
                      <span
                        className={
                          emp.is_active === false
                            ? "badge-neutral"
                            : "badge-success"
                        }
                      >
                        {emp.is_active === false ? "Inactive" : "Active"}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={emp.is_checked_in ? "ACTIVE" : "CLOSED"} />
                    </td>
                    <td className="text-on-surface-variant">
                      {emp.last_location_at
                        ? timeAgo(emp.last_location_at)
                        : emp.last_check_out_at
                          ? timeAgo(emp.last_check_out_at)
                          : emp.last_check_in_at
                            ? timeAgo(emp.last_check_in_at)
                            : "—"}
                    </td>
                    <td className="text-on-surface-variant">
                      {formatDate(emp.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        page={page}
        hasMore={page * LIMIT < total}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => p + 1)}
        showing={filtered?.length}
        total={total}
      />
    </div>
  );
}
