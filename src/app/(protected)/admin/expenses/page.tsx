"use client";

import { PageHeader } from "@/components/ui";
import { ExpenseTable } from "@/components/admin/ExpenseTable";

export default function AdminExpensesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Expenses" subtitle="Review and approve expense submissions" />
      <ExpenseTable />
    </div>
  );
}
