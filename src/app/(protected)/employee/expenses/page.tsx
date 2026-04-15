"use client";

import { useState, useRef, type FormEvent } from "react";
import { useMyExpenses, useSubmitExpense } from "@/hooks/queries/useExpenses";
import { expensesApi } from "@/lib/api/expenses";
import { PageHeader, LoadingState, EmptyState, StatusBadge, Pagination, Spinner } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PlusCircle, X, Paperclip } from "lucide-react";

type AllowedExtension = "jpg" | "jpeg" | "png" | "webp" | "pdf";

const ALLOWED_MIME_TYPES: ReadonlySet<string> = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const MAX_RECEIPT_BYTES = 5 * 1024 * 1024; // 5 MB

function getExtension(file: File): AllowedExtension {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg" || ext === "png" || ext === "webp" || ext === "pdf") {
    return ext;
  }
  // Fall back to MIME type
  if (file.type === "application/pdf") return "pdf";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/png") return "png";
  if (file.type === "image/jpeg") return "jpg";
  // Unknown type — caller must have validated MIME first
  return "jpg";
}

function validateReceiptFile(file: File): string | null {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return `Unsupported file type "${file.type}". Please upload a JPG, PNG, WebP, or PDF.`;
  }
  if (file.size > MAX_RECEIPT_BYTES) {
    return `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is 5 MB.`;
  }
  return null;
}

function SubmitExpenseModal({ onClose }: { onClose: () => void }) {
  const submit = useSubmitExpense();
  const [amount,      setAmount]      = useState("");
  const [description, setDescription] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploading,   setUploading]   = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    try {
      let receipt_url: string | undefined;
      let extension: AllowedExtension | undefined;

      if (receiptFile) {
        const validationError = validateReceiptFile(receiptFile);
        if (validationError) {
          setError(validationError);
          return;
        }
        setUploading(true);
        extension = getExtension(receiptFile);
        const { uploadUrl, receiptUrl } = await expensesApi.getReceiptUploadUrl(
          extension,
          receiptFile.type || undefined,
        );
        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": receiptFile.type || "application/octet-stream" },
          body: receiptFile,
        });
        if (!uploadRes.ok) {
          throw new Error(`Receipt upload failed (HTTP ${uploadRes.status}).`);
        }
        receipt_url = receiptUrl;
        setUploading(false);
      }

      await submit.mutateAsync({
        amount: amt,
        description: description.trim(),
        ...(receipt_url ? { receipt_url, extension } : {}),
      });
      onClose();
    } catch (err: unknown) {
      setUploading(false);
      setError(err instanceof Error ? err.message : "Submission failed.");
    }
  }

  const isPending = submit.isPending || uploading;

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
              Amount (INR)
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
              Receipt <span className="normal-case opacity-60">(optional)</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                if (file) {
                  const err = validateReceiptFile(file);
                  if (err) {
                    setError(err);
                    e.target.value = "";
                    return;
                  }
                }
                setError(null);
                setReceiptFile(file);
              }}
            />
            <button
              type="button"
              className="btn-secondary w-full flex items-center gap-2 justify-center"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="w-4 h-4" />
              {receiptFile ? receiptFile.name : "Attach receipt…"}
            </button>
            {receiptFile && (
              <button
                type="button"
                className="text-xs text-on-surface-variant underline"
                onClick={() => {
                  setReceiptFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                Remove
              </button>
            )}
          </div>

          {error && (
            <p className="text-xs text-error bg-error/10 rounded-xl px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={isPending || !amount || !description}
          >
            {isPending ? <Spinner size="sm" /> : null}
            {uploading ? "Uploading receipt…" : "Submit Expense"}
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
