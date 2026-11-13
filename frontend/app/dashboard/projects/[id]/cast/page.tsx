"use client";

import { useParams } from "next/navigation";
import { useProject } from "@/lib/project-store";
import { useCastByProject } from "@/lib/cast-store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CastListView } from "@/components/cast/cast-list-view";
import { RolesProbableTab } from "@/components/cast/roles-probable-tab";
import { CastingDashboardTab } from "@/components/cast/casting-dashboard-tab";
import { ContractsTab } from "@/components/cast/contracts-tab";
import { AvailabilityTab } from "@/components/cast/availability-tab";

export default function ProjectCastPage() {
  const params = useParams();
  const project = useProject(params.id as string);
  const members = useCastByProject(params.id as string);

  if (!project) return null;

  return (
    <Tabs defaultValue="members" className="space-y-5">
      <TabsList className="h-auto flex-wrap">
        <TabsTrigger value="members">Cast Members</TabsTrigger>
        <TabsTrigger value="roles">Roles &amp; Probable</TabsTrigger>
        <TabsTrigger value="casting">Casting</TabsTrigger>
        <TabsTrigger value="contracts">Contracts</TabsTrigger>
        <TabsTrigger value="availability">Availability</TabsTrigger>
      </TabsList>

      <TabsContent value="members">
        <CastListView members={members} projectScope projectId={project.id} projectTitle={project.title} />
      </TabsContent>
      <TabsContent value="roles">
        <RolesProbableTab projectId={project.id} />
      </TabsContent>
      <TabsContent value="casting">
        <CastingDashboardTab projectId={project.id} />
      </TabsContent>
      <TabsContent value="contracts">
        <ContractsTab projectId={project.id} />
      </TabsContent>
      <TabsContent value="availability">
        <AvailabilityTab projectId={project.id} />
      </TabsContent>
    </Tabs>
  );
}
