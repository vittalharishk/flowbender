"use client";

import Link from "next/link";
import { CalendarDays, Video } from "lucide-react";
import { useShootDays } from "@/lib/schedule-store";
import { ScheduleListView } from "@/components/schedule/schedule-list-view";
import { MasterCalendar } from "@/components/schedule/master-calendar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function GlobalSchedulePage() {
  const days = useShootDays();

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-amber-500">
              <CalendarDays className="w-3 h-3" />
              STUDIO MASTER SCHEDULE
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              {days.length} Shoot Days Across Active Feature Slates
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <CalendarDays className="w-7 h-7 text-amber-500" />
            Master Production Schedule
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Cross-production call sheets, soundstage reservations, visual stripboards, and scene page tracking.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" asChild className="gap-1.5 h-9 text-xs">
            <Link href="/dashboard/production">
              <Video className="w-3.5 h-3.5 text-primary" />
              Production Floor
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="schedule">
        <TabsList>
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
