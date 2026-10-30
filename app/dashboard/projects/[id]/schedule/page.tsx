"use client";

import { useParams } from "next/navigation";
import { useProject } from "@/lib/project-store";
import { useShootDaysByProject } from "@/lib/schedule-store";
import { ScheduleListView } from "@/components/schedule/schedule-list-view";

export default function ProjectSchedulePage() {
  const params = useParams();
  const projectId = params.id as string;
  const project = useProject(projectId);
  const days = useShootDaysByProject(projectId);

  if (!project) return null;

  return (
    <ScheduleListView
      key={projectId}
      shootDays={days}
      basePath={`/dashboard/projects/${projectId}/schedule`}
      projectScope
      projectId={project.id}
      projectTitle={project.title}
      onAdded={() => undefined}
    />
  );
}
