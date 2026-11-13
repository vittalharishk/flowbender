"use client";

import Link from "next/link";
import { CalendarDays, Video } from "lucide-react";
import { useShootDays } from "@/lib/schedule-store";
import { ScheduleListView } from "@/components/schedule/schedule-list-view";
import { MasterCalendar } from "@/components/schedule/master-calendar";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function GlobalSchedulePage() {
  const days = useShootDays();

  return (
    <div className="space-y-6">
      <PageHeader
        as="h1"
        icon={CalendarDays}
        title="Master Production Schedule"
        description={`${days.length} shoot days across active feature slates. Cross-production call sheets, soundstage reservations, stripboards and scene page tracking.`}
        actions={
          <Button variant="outline" size="sm" asChild className="h-9 gap-1.5">
            <Link href="/dashboard/production">
              <Video className="h-3.5 w-3.5" aria-hidden="true" />
              Production Floor
            </Link>
          </Button>
        }
      />

      <Tabs defaultValue="schedule">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="schedule">Shoot Day Schedule</TabsTrigger>
          <TabsTrigger value="calendar">Event Calendar</TabsTrigger>
        </TabsList>
        <TabsContent value="schedule" className="mt-4">
          <ScheduleListView shootDays={days} basePath="/dashboard/schedule" onAdded={() => undefined} />
        </TabsContent>
        <TabsContent value="calendar" className="mt-4">
          <MasterCalendar />
        </TabsContent>
      </Tabs>
    </div>
  );
}
