"use client";

import { useParams } from "next/navigation";
import { AttendanceTab } from "@/components/schedule/attendance-tab";

export default function ProjectAttendancePage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Attendance</h1>
        <p className="text-sm text-muted-foreground">Daily register and catering set count for this project.</p>
      </div>
      <AttendanceTab key={id} projectId={id} />
    </div>
  );
}
