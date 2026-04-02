"use client";

import { PageHeader } from "@/components/ui";
import { AuditLogTable } from "@/components/admin/AuditLogTable";

export default function AuditLogsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Audit Logs" subtitle="Immutable activity history" />
      <AuditLogTable />
    </div>
  );
}
