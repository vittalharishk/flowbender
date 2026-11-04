"use client";

import { use } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CrewDepartmentsWorkspace } from "@/components/crew/crew-departments-workspace";
import { RentalsWorkspace } from "@/components/crew/rentals-workspace";
import { ExpensesWorkspace } from "@/components/crew/expenses-workspace";
import LocationsWorkspace from "@/components/crew/locations-workspace";
import { ArtWorkspace } from "@/components/crew/art-workspace";
import VehiclesStuntsWorkspace from "@/components/crew/vehicles-stunts-workspace";

export default function ProjectCrewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">Crew, Rentals, Expenses & Locations</h1>
        <p className="text-sm text-muted-foreground">Department assignments, remuneration, equipment rentals, expenses and location travel for this project.</p>
      </div>
      <Tabs defaultValue="crew">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="crew">Crew & Departments</TabsTrigger>
          <TabsTrigger value="rentals">Rentals & Vendors</TabsTrigger>
          <TabsTrigger value="expenses">Expenses & Office</TabsTrigger>
          <TabsTrigger value="locations">Locations & Travel</TabsTrigger>
          <TabsTrigger value="art">Art & Props</TabsTrigger>
          <TabsTrigger value="vehicles">Vehicles & Stunts</TabsTrigger>
        </TabsList>
        <TabsContent value="crew">
          <CrewDepartmentsWorkspace projectId={id} />
        </TabsContent>
        <TabsContent value="rentals">
          <RentalsWorkspace projectId={id} />
        </TabsContent>
        <TabsContent value="expenses">
          <ExpensesWorkspace projectId={id} />
        </TabsContent>
        <TabsContent value="locations">
          <LocationsWorkspace projectId={id} />
        </TabsContent>
        <TabsContent value="art">
          <ArtWorkspace projectId={id} />
        </TabsContent>
        <TabsContent value="vehicles">
          <VehiclesStuntsWorkspace projectId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
