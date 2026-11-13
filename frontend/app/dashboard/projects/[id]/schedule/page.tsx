"use client";

import { useParams } from "next/navigation";
import { useProject } from "@/lib/project-store";
import { useShootDaysByProject } from "@/lib/schedule-store";
import { ScheduleListView } from "@/components/schedule/schedule-list-view";
import { MasterCalendar } from "@/components/schedule/master-calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ProjectSchedulePage() {
  const params = useParams();
  const projectId = params.id as string;
  const project = useProject(projectId);
  const days = useShootDaysByProject(projectId);

  if (!project) return null;

  return (
    <Tabs defaultValue="schedule">
      <TabsList>
        <TabsTrigger value="schedule">Shoot Day Schedule</TabsTrigger>
        <TabsTrigger value="calendar">Event Calendar</TabsTrigger>
      </TabsList>
      <TabsContent value="schedule" className="mt-4">
        <ScheduleListView
          key={projectId}
          shootDays={days}
          basePath={`/dashboard/projects/${projectId}/schedule`}
          projectScope
          projectId={project.id}
          projectTitle={project.title}
          onAdded={() => undefined}
        />
      </TabsContent>
      <TabsContent value="calendar" className="mt-4">
        <MasterCalendar projectId={projectId} />
      </TabsContent>
    </Tabs>
  );
}
