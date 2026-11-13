"use client";

import { CheckCircle } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { AttendanceTab } from "@/components/schedule/attendance-tab";

export default function AttendancePage() {
  return (
    <div className="space-y-5">
      <PageHeader
        as="h1"
        icon={CheckCircle}
        title="Attendance"
        description="Daily register, catering counts, and history across projects."
      />
      <AttendanceTab />
    </div>
  );
}
