"use client";

import { useParams } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { AttendanceTab } from "@/components/schedule/attendance-tab";

export default function ProjectAttendancePage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="space-y-5">
      <PageHeader
        icon={CheckCircle}
        title="Attendance"
        description="Daily register and catering set count for this project."
      />
      <AttendanceTab key={id} projectId={id} />
    </div>
  );
}
