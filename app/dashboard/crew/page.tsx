"use client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CrewDepartmentsWorkspace } from "@/components/crew/crew-departments-workspace";
import { RentalsWorkspace } from "@/components/crew/rentals-workspace";
import { ExpensesWorkspace } from "@/components/crew/expenses-workspace";
import LocationsWorkspace from "@/components/crew/locations-workspace";
import { ArtWorkspace } from "@/components/crew/art-workspace";
import VehiclesStuntsWorkspace from "@/components/crew/vehicles-stunts-workspace";

export default function CrewPage() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">Production Crew & Departments</h1>
        <p className="text-sm text-muted-foreground">Crew management, departments, rentals, vendors, expenses and locations</p>
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
          <CrewDepartmentsWorkspace />
        </TabsContent>
        <TabsContent value="rentals">
          <RentalsWorkspace />
        </TabsContent>
        <TabsContent value="expenses">
          <ExpensesWorkspace />
        </TabsContent>
        <TabsContent value="locations">
          <LocationsWorkspace />
        </TabsContent>
        <TabsContent value="art">
          <ArtWorkspace />
        </TabsContent>
        <TabsContent value="vehicles">
          <VehiclesStuntsWorkspace />
        </TabsContent>
      </Tabs>
    </div>
  );
}
