"use client";

import { PageHeader } from "@/components/ui";
import { EmployeeTable } from "@/components/admin/EmployeeTable";

export default function EmployeesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Employees" subtitle="Manage your workforce" />
      <EmployeeTable />
    </div>
  );
}
