"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fieldApi, formatPay, type PaymentComponent } from "@/lib/api/field-operations";
import type { FieldReportSelection } from "@/lib/field-report";
import { ApiError } from "@/types";

const inputClass = "block w-full rounded-lg border border-outline-variant/30 bg-surface px-3 py-2 text-on-surface";

function inclusiveEnd(date: string) {
  const end = new Date(`${date}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() - 1);
  return end.toISOString().slice(0, 10);
}

export function EmployeePayment({ employeeId, selection, timezone }: {
  employeeId: string;
  selection: FieldReportSelection;
  timezone: string;
}) {
  const queryClient = useQueryClient();
  const [component, setComponent] = useState<PaymentComponent>("both");
  const [reference, setReference] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [saved, setSaved] = useState<string>();
  const history = useQuery({
    queryKey: ["field", "payments", employeeId],
    queryFn: () => fieldApi.paymentHistory(employeeId),
    meta: { suppressGlobalError: true },
  });
  const preview = useQuery({
    queryKey: ["field", "payment-preview", employeeId, selection, component],
    queryFn: () => fieldApi.paymentPreview(employeeId, selection, component),
    meta: { suppressGlobalError: true },
    staleTime: 5_000,
  });
  const payment = useMutation({
    mutationFn: ({ total, requestId }: { total: number; requestId: string }) =>
      fieldApi.recordPayment(employeeId, selection, component, total, requestId, reference),
    meta: { suppressGlobalError: true },
    retry: (failureCount, error) => failureCount === 0 && error instanceof ApiError && [0, 408, 502, 503, 504].includes(error.status),
    onSuccess: (record) => {
      setConfirming(false);
      setReference("");
      setSaved(`${formatPay(record.total_pay_minor, record.currency)} recorded.`);
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["field", "payments", employeeId] }),
        queryClient.invalidateQueries({ queryKey: ["field", "payment-preview", employeeId] }),
      ]);
    },
  });
  const outstanding = preview.data;
  const canRecord = !!outstanding?.recordable && outstanding.total_pay_minor !== null;

  return (
    <section className="card-high space-y-4">
      <h2 className="font-bold">Employee payments</h2>
      <p className="text-sm text-on-surface-variant">Review outstanding pay for the selected period. Record a payment after it has been made.</p>
      <label className="block max-w-sm text-sm">
        Pay to include
        <select className={inputClass} value={component} disabled={confirming || payment.isPending} onChange={(event) => {
          setComponent(event.target.value as PaymentComponent);
          payment.reset();
          setSaved(undefined);
        }}>
          <option value="both">Visit pay and monthly basic pay</option>
          <option value="visits">Visit pay only</option>
          <option value="basic">Monthly basic pay only</option>
        </select>
      </label>
      {preview.isLoading && <p>Calculating outstanding pay…</p>}
      {preview.error && <p role="alert" className="text-error">{preview.error.message}</p>}
      {outstanding && <>
        <p className="text-sm">{outstanding.from} through {inclusiveEnd(outstanding.to_exclusive)}</p>
        <dl className="grid gap-3 sm:grid-cols-3 text-sm">
          <div><dt>Visit pay ({outstanding.visit_count} visits)</dt><dd>{formatPay(outstanding.visit_pay_minor, outstanding.currency)}</dd></div>
          <div><dt>Monthly basic pay</dt><dd>{formatPay(outstanding.basic_pay_minor, outstanding.currency)}</dd></div>
          <div><dt>Outstanding pay</dt><dd className="font-semibold">{formatPay(outstanding.total_pay_minor, outstanding.currency)}</dd></div>
        </dl>
        {outstanding.reason && <p className="text-sm text-on-surface-variant">{outstanding.reason}</p>}
        {confirming ? (
            <form className="space-y-3" onSubmit={(event) => {
              event.preventDefault();
              if (!canRecord || outstanding.total_pay_minor === null || preview.isFetching || payment.isPending) return;
              setSaved(undefined);
              payment.mutate({ total: outstanding.total_pay_minor, requestId: crypto.randomUUID() });
            }}>
              <label className="block max-w-sm text-sm">Payment reference (optional)<input className={inputClass} value={reference} maxLength={160} disabled={payment.isPending} onChange={(event) => setReference(event.target.value)} /></label>
              <div className="flex flex-wrap gap-2">
                <button className="btn-primary" disabled={!canRecord || payment.isPending || preview.isFetching}>Confirm payment of {formatPay(outstanding.total_pay_minor, outstanding.currency)}</button>
                <button type="button" className="btn-secondary" disabled={payment.isPending} onClick={() => { setConfirming(false); payment.reset(); }}>Cancel</button>
              </div>
            </form>
          ) : canRecord && <button className="btn-primary" disabled={preview.isFetching} onClick={() => setConfirming(true)}>Record payment</button>}
      </>}
      {payment.error && <p role="alert" className="text-error">{payment.error.message}</p>}
      {saved && <p role="status" className="text-success-green">{saved}</p>}
      <div className="space-y-3 border-t border-outline-variant/20 pt-3">
        <h3 className="font-semibold">Payment history</h3>
        {history.isLoading && <p>Loading payment history…</p>}
        {history.error && <p role="alert" className="text-error">{history.error.message}</p>}
        {history.data?.length === 0 && <p className="text-sm text-on-surface-variant">No payments recorded.</p>}
        {!!history.data?.length && <div className="overflow-x-auto">
          <table className="data-table w-full text-sm">
            <thead><tr><th>Period</th><th>Recorded</th><th>Basic pay</th><th>Visit pay</th><th>Total</th><th>Reference</th></tr></thead>
            <tbody>{history.data.map((record) => (
              <tr key={record.id}>
                <td>{record.from} through {inclusiveEnd(record.to_exclusive)}</td>
                <td>{new Date(record.created_at).toLocaleDateString(undefined, { timeZone: timezone })}</td>
                <td>{formatPay(record.basic_pay_minor, record.currency)}</td>
                <td>{formatPay(record.visit_pay_minor, record.currency)}</td>
                <td>{formatPay(record.total_pay_minor, record.currency)}</td>
                <td>{record.reference ?? "—"}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>}
      </div>
    </section>
  );
}
