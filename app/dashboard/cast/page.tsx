"use client";

import { useMemo, useState } from "react";
import { Users } from "lucide-react";
import { useCastMembers } from "@/lib/cast-store";
import { useProjects } from "@/lib/project-store";
import { PageHeader } from "@/components/app/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CastListView } from "@/components/cast/cast-list-view";
import { RolesProbableTab } from "@/components/cast/roles-probable-tab";
import { CastingDashboardTab } from "@/components/cast/casting-dashboard-tab";
import { ContractsTab } from "@/components/cast/contracts-tab";
import { AvailabilityTab } from "@/components/cast/availability-tab";

export default function GlobalCastPage() {
  const members = useCastMembers();
  const projects = useProjects();
  const [projectFilter, setProjectFilter] = useState<string>("all");

  const scopedProjectId = projectFilter === "all" ? undefined : projectFilter;

  const visibleMembers = useMemo(
    () => (scopedProjectId ? members.filter((m) => m.projectId === scopedProjectId) : members),
    [members, scopedProjectId]
  );

  const selectedProject = projects.find((p) => p.id === scopedProjectId);

  return (
    <div className="space-y-5">
      <PageHeader
        as="h1"
        icon={Users}
        title="Cast"
        description="All cast members and the casting pipeline across every production"
        actions={
          <div className="flex items-center gap-2">
            <label htmlFor="cast-project-filter" className="text-xs font-medium text-muted-foreground">
              Project
            </label>
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger id="cast-project-filter" aria-label="Filter by project" className="h-9 w-[200px]">
                <SelectValue placeholder="All projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <Tabs defaultValue="members" className="space-y-5">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="members">Cast Members</TabsTrigger>
          <TabsTrigger value="roles">Roles &amp; Probable</TabsTrigger>
          <TabsTrigger value="casting">Casting</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <CastListView
            key={projectFilter}
            members={visibleMembers}
            projectScope={Boolean(scopedProjectId)}
            projectId={scopedProjectId}
            projectTitle={selectedProject?.title}
          />
        </TabsContent>
        <TabsContent value="roles">
          <RolesProbableTab key={projectFilter} projectId={scopedProjectId} />
        </TabsContent>
        <TabsContent value="casting">
          <CastingDashboardTab key={projectFilter} projectId={scopedProjectId} />
        </TabsContent>
        <TabsContent value="contracts">
          <ContractsTab key={projectFilter} projectId={scopedProjectId} />
        </TabsContent>
        <TabsContent value="availability">
          <AvailabilityTab key={projectFilter} projectId={scopedProjectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
