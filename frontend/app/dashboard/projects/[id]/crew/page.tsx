"use client";

import { useParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CrewDepartmentsWorkspace } from "@/components/crew/crew-departments-workspace";
import { RentalsWorkspace } from "@/components/crew/rentals-workspace";
import { ExpensesWorkspace } from "@/components/crew/expenses-workspace";
import LocationsWorkspace from "@/components/crew/locations-workspace";
import { ArtWorkspace } from "@/components/crew/art-workspace";
import VehiclesStuntsWorkspace from "@/components/crew/vehicles-stunts-workspace";

export default function ProjectCrewPage() {
  const params = useParams();
  const id = params.id as string;

  return (
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
  );
}
