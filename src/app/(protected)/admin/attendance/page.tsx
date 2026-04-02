"use client";

import { PageHeader } from "@/components/ui";
import { AttendanceTable } from "@/components/admin/AttendanceTable";

export default function AdminAttendancePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Attendance" subtitle="Organisation check-in / check-out records" />
      <AttendanceTable />
    </div>
  );
}
