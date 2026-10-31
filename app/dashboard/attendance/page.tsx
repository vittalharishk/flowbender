"use client";

import { AttendanceTab } from "@/components/schedule/attendance-tab";

export default function AttendancePage() {
  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Attendance</h1>
        <p className="text-sm text-muted-foreground">Daily register, catering counts, and history across projects.</p>
      </div>
      <AttendanceTab />
    </div>
  );
}
