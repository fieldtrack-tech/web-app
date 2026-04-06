"use client";

import { useState } from "react";
import { Check, Search, X } from "lucide-react";
import {
  useEmployeePendingExpenses,
  useExpenseSummaryByEmployee,
  useReviewExpense,
} from "@/hooks/queries/useExpenses";
import {
  StatusBadge,
  EmptyState,
  Pagination,
  Avatar,
} from "@/components/ui";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { formatCurrency, formatDate } from "@/lib/utils";

export function ExpenseTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const LIMIT = 20;

  const { data, isLoading } = useExpenseSummaryByEmployee(page, LIMIT);
  const summaries = data?.data ?? [];
  const total = data?.pagination.total ?? 0;
  const reviewMutation = useReviewExpense();

  const selectedSummary = summaries.find((summary) => summary.employeeId === selectedEmployeeId) ?? null;
  const { data: selectedExpenses = [], isLoading: detailLoading } = useEmployeePendingExpenses(
    selectedSummary
      ? {
          employeeId: selectedSummary.employeeId,
          employeeName: selectedSummary.employeeName,
          employeeCode: selectedSummary.employeeCode,
          pendingCount: selectedSummary.pendingCount,
        }
      : null,
  );
  const sortedSelectedExpenses = selectedExpenses
    .sort((left, right) => Number(right.status === "PENDING") - Number(left.status === "PENDING"));

  const filtered = summaries.filter((summary) =>
    !search ||
    summary.employeeName.toLowerCase().includes(search.toLowerCase()) ||
    (summary.employeeCode ?? "").toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <LoadingSkeleton variant="table" />;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant" />
          <input
            className="input pl-9 h-9 text-xs"
            placeholder="Search employees awaiting review…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="text-xs text-on-surface-variant">
          {filtered.filter((summary) => summary.pendingCount > 0).length} employees require action
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
        <div className="rounded-2xl overflow-hidden bg-surface-container">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Pending</th>
                  <th>Pending Amount</th>
                  <th>Latest Expense</th>
                </tr>
              </thead>
              <tbody>
                {!filtered.length ? (
                  <tr>
                    <td colSpan={4}>
                      <EmptyState
                        title="No pending expenses"
                        description="No employees match the current search or require action."
                      />
                    </td>
                  </tr>
                ) : (
                  filtered.map((summary) => (
                    <tr
                      key={summary.employeeId}
                      className={selectedEmployeeId === summary.employeeId ? "bg-surface-container-high/40" : undefined}
                      onClick={() => setSelectedEmployeeId(summary.employeeId)}
                    >
                      <td>
                        <div className="flex items-center gap-2.5">
                          <Avatar name={summary.employeeName} size="sm" />
                          <div>
                            <p className="font-medium text-on-surface">{summary.employeeName}</p>
                            <p className="text-xs text-on-surface-variant">
                              {summary.employeeCode ? `#${summary.employeeCode}` : summary.employeeId}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={summary.pendingCount > 0 ? "PENDING" : "CLOSED"} />
                        <span className="ml-2 text-sm text-on-surface-variant">{summary.pendingCount}</span>
                      </td>
                      <td className="font-semibold text-on-surface">
                        {summary.pendingAmount > 0 ? formatCurrency(summary.pendingAmount) : "—"}
                      </td>
                      <td className="text-on-surface-variant">
                        {summary.latestExpenseDate ? formatDate(summary.latestExpenseDate) : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl bg-surface-container p-4 space-y-4">
          {!selectedSummary ? (
            <EmptyState
              title="Select an employee"
              description="Choose a row to inspect and action that employee's expense claims."
            />
          ) : detailLoading && sortedSelectedExpenses.length === 0 ? (
            <LoadingSkeleton variant="list" />
          ) : (
            <>
              <div>
                <p className="font-manrope font-bold text-on-surface">{selectedSummary.employeeName}</p>
                <p className="text-xs text-on-surface-variant">
                  {selectedSummary.employeeCode ? `#${selectedSummary.employeeCode}` : selectedSummary.employeeId}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-surface-container-high/30 p-3">
                  <p className="section-heading">Pending</p>
                  <p className="font-semibold text-on-surface">{selectedSummary.pendingCount}</p>
                </div>
                <div className="rounded-xl bg-surface-container-high/30 p-3">
                  <p className="section-heading">Amount</p>
                  <p className="font-semibold text-on-surface">{formatCurrency(selectedSummary.pendingAmount)}</p>
                </div>
              </div>

              <div className="space-y-3">
                {sortedSelectedExpenses.length === 0 ? (
                  <EmptyState
                    title="No expense details"
                    description="No expense rows were returned for this employee."
                  />
                ) : (
                  sortedSelectedExpenses.map((exp) => (
                    <div key={exp.id} className="rounded-xl border border-outline-variant/20 p-3 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-on-surface">{exp.description || "Expense claim"}</p>
                          <p className="text-xs text-on-surface-variant">Submitted {formatDate(exp.submitted_at)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-on-surface">{formatCurrency(exp.amount)}</p>
                          <StatusBadge status={exp.status} />
                        </div>
                      </div>

                      {exp.status === "PENDING" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="btn-secondary px-3 py-1.5 text-xs text-success-green"
                            onClick={() =>
                              reviewMutation.mutate({
                                id: exp.id,
                                status: "APPROVED",
                              })
                            }
                            disabled={reviewMutation.isPending}
                          >
                            <Check className="mr-1 inline-flex h-3.5 w-3.5" />
                            Approve
                          </button>
                          <button
                            className="btn-secondary px-3 py-1.5 text-xs text-error"
                            onClick={() =>
                              reviewMutation.mutate({
                                id: exp.id,
                                status: "REJECTED",
                              })
                            }
                            disabled={reviewMutation.isPending}
                          >
                            <X className="mr-1 inline-flex h-3.5 w-3.5" />
                            Reject
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <Pagination
        page={page}
        hasMore={page * LIMIT < total}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => p + 1)}
        showing={filtered.length}
        total={total}
      />
    </div>
  );
}
