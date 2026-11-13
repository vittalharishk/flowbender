"use client";

import { useState } from "react";
import { UserCog } from "lucide-react";
import { useProjects } from "@/lib/project-store";
import { PageHeader } from "@/components/app/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CrewDepartmentsWorkspace } from "@/components/crew/crew-departments-workspace";
import { RentalsWorkspace } from "@/components/crew/rentals-workspace";
import { ExpensesWorkspace } from "@/components/crew/expenses-workspace";
import LocationsWorkspace from "@/components/crew/locations-workspace";
import { ArtWorkspace } from "@/components/crew/art-workspace";
import VehiclesStuntsWorkspace from "@/components/crew/vehicles-stunts-workspace";

export default function CrewPage() {
  const projects = useProjects();
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const scopedProjectId = projectFilter === "all" ? undefined : projectFilter;

  return (
    <div className="space-y-5">
      <PageHeader
        as="h1"
        icon={UserCog}
        title="Production Crew &amp; Departments"
        description="Crew management, departments, rentals, vendors, expenses and locations"
        actions={
          <div className="flex items-center gap-2">
            <label htmlFor="crew-project-filter" className="text-xs font-medium text-muted-foreground">
              Project
            </label>
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger id="crew-project-filter" className="h-9 w-[200px]">
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

      <Tabs defaultValue="crew" className="space-y-5">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="crew">Crew &amp; Departments</TabsTrigger>
          <TabsTrigger value="rentals">Rentals &amp; Vendors</TabsTrigger>
          <TabsTrigger value="expenses">Expenses &amp; Office</TabsTrigger>
          <TabsTrigger value="locations">Locations &amp; Travel</TabsTrigger>
          <TabsTrigger value="art">Art &amp; Props</TabsTrigger>
          <TabsTrigger value="vehicles">Vehicles &amp; Stunts</TabsTrigger>
        </TabsList>
        <TabsContent value="crew">
          <CrewDepartmentsWorkspace key={projectFilter} projectId={scopedProjectId} />
        </TabsContent>
        <TabsContent value="rentals">
          <RentalsWorkspace key={projectFilter} projectId={scopedProjectId} />
        </TabsContent>
        <TabsContent value="expenses">
          <ExpensesWorkspace key={projectFilter} projectId={scopedProjectId} />
        </TabsContent>
        <TabsContent value="locations">
          <LocationsWorkspace key={projectFilter} projectId={scopedProjectId} />
        </TabsContent>
        <TabsContent value="art">
          <ArtWorkspace key={projectFilter} projectId={scopedProjectId} />
        </TabsContent>
        <TabsContent value="vehicles">
          <VehiclesStuntsWorkspace key={projectFilter} projectId={scopedProjectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
