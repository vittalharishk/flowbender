"use client";

import { useParams } from "next/navigation";
import { AttendanceTrackingWorkspace } from "@/components/attendance/attendance-tracking-workspace";

export default function ProjectAttendancePage() {
  const { id } = useParams<{ id: string }>();
  return <AttendanceTrackingWorkspace key={id} projectId={id} />;
}
