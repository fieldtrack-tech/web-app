"use client";

import { useState, type FormEvent } from "react";
import { useMyExpenses, useSubmitExpense } from "@/hooks/queries/useExpenses";
import { PageHeader, LoadingState, EmptyState, StatusBadge, Pagination, Spinner } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PlusCircle, X } from "lucide-react";

function SubmitExpenseModal({ onClose }: { onClose: () => void }) {
  const submit = useSubmitExpense();
  const [amount,      setAmount]      = useState("");
  const [description, setDescription] = useState("");
  const [receiptUrl,  setReceiptUrl]  = useState("");
  const [error,       setError]       = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    try {
      await submit.mutateAsync({
        amount: amt,
        description: description.trim(),
        ...(receiptUrl.trim() ? { receipt_url: receiptUrl.trim() } : {}),
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Submission failed.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="card-high w-full max-w-md space-y-5 animate-fade-in">
        <div className="flex items-center justify-between">
          <p className="font-manrope font-bold text-on-surface text-lg">Submit Expense</p>
          <button className="btn-icon" onClick={onClose} aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wider">
              Amount (USD)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              className="input w-full"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wider">
              Description
            </label>
            <input
              type="text"
              required
              className="input w-full"
              placeholder="Travel, fuel, meals…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wider">
              Receipt URL <span className="normal-case opacity-60">(optional)</span>
            </label>
            <input
              type="url"
              className="input w-full"
              placeholder="https://…"
              value={receiptUrl}
              onChange={(e) => setReceiptUrl(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-xs text-error bg-error/10 rounded-xl px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={submit.isPending || !amount || !description}
          >
            {submit.isPending ? <Spinner size="sm" /> : null}
            Submit Expense
          </button>
        </form>
      </div>
    </div>
  );
}

export default function EmployeeExpensesPage() {
  const [page,      setPage]      = useState(1);
  const [showModal, setShowModal] = useState(false);
  const limit = 15;

  const { data, isLoading, isError } = useMyExpenses(page, limit);

  const expenses = data?.data ?? [];
  const hasMore = page * limit < (data?.pagination.total ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="My Expenses" subtitle="Track and submit expense claims" />
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <PlusCircle className="w-4 h-4" />
          Submit Expense
        </button>
      </div>

      {isLoading && <LoadingState />}
      {isError   && <EmptyState title="Failed to load" description="Please try again." />}

      {!isLoading && !isError && (
        <div className="card overflow-x-auto">
          {expenses.length === 0 ? (
            <EmptyState title="No expenses yet" description="Submit your first expense claim." />
          ) : (
            <>
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp) => (
                    <tr key={exp.id}>
                      <td>{formatDate(exp.created_at)}</td>
                      <td className="max-w-xs truncate">{exp.description}</td>
                      <td>{formatCurrency(exp.amount)}</td>
                      <td><StatusBadge status={exp.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(page > 1 || hasMore) && (
                <div className="pt-4">
                  <Pagination
                    page={page}
                    hasMore={hasMore}
                    onPrev={() => setPage((p) => Math.max(1, p - 1))}
                    onNext={() => setPage((p) => p + 1)}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {showModal && <SubmitExpenseModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
