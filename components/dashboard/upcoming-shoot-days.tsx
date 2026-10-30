"use client";

import { MapPin, Clapperboard, FileCheck, FileX, FileClock } from "lucide-react";
import Link from "next/link";
import { parseISO, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import type { ScheduleEntry } from "@/lib/types";

const callSheetConfig: Record<ScheduleEntry["callSheetStatus"], { label: string; icon: typeof FileCheck; className: string }> = {
  published: { label: "Published", icon: FileCheck, className: "text-emerald-400 bg-emerald-500/10" },
  draft: { label: "Draft", icon: FileClock, className: "text-amber-400 bg-amber-500/10" },
  pending: { label: "Pending", icon: FileX, className: "text-red-400 bg-red-500/10" },
};

function formatDate(dateStr: string) {
  const d = parseISO(dateStr);
  return {
    day: d.getDate(),
    weekday: d.toLocaleDateString("en-US", { weekday: "short" }),
    monthDay: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  };
}

interface UpcomingShootDaysProps {
  entries: ScheduleEntry[];
}

export function UpcomingShootDays({ entries }: UpcomingShootDaysProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Upcoming Shoot Days</h3>
        <Link href="/dashboard/schedule" className="text-sm text-primary hover:underline">Full schedule</Link>
      </div>
      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[56px_1fr_1fr_100px_120px_100px] gap-2 px-4 py-2.5 border-b bg-muted/30 text-xs font-medium text-muted-foreground">
          <span>Date</span>
          <span>Project</span>
          <span>Location</span>
          <span>Day</span>
          <span>Scenes</span>
          <span className="text-right">Call Sheet</span>
        </div>
        {/* Rows */}
        <div className="divide-y">
          {entries.map((entry) => {
            const { day, weekday, monthDay } = formatDate(entry.date);
            const today = isToday(parseISO(entry.date));
            const csConfig = callSheetConfig[entry.callSheetStatus];
            const CsIcon = csConfig.icon;

            return (
              <Link
                key={entry.id}
                href={`/dashboard/projects/${entry.projectId}/schedule/${entry.id}`}
                className={cn(
                  "grid grid-cols-[56px_1fr_1fr_100px_120px_100px] gap-2 px-4 py-3 items-center text-sm hover:bg-muted/30 transition-colors",
                  today && "bg-amber-500/5"
                )}
              >
                {/* Date */}
                <div className="text-center">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex flex-col items-center justify-center mx-auto",
                    today ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white" : "bg-muted"
                  )}>
                    <span className="text-xs font-bold leading-none">{day}</span>
                    <span className="text-[9px] uppercase opacity-80">{weekday}</span>
                  </div>
                </div>

                {/* Project */}
                <div className="min-w-0">
                  <p className="font-medium truncate">{entry.projectTitle}</p>
                </div>

                {/* Location */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                  <span className="truncate text-muted-foreground">{entry.location}</span>
                </div>

                {/* Day # */}
                <div className="text-muted-foreground">
                  {entry.shootDayNumber > 0 ? (
                    <span>
                      Day {entry.shootDayNumber}
                      <span className="text-muted-foreground/60">/{entry.totalShootDays}</span>
                    </span>
                  ) : (
                    <span className="text-xs">Pre-prod</span>
                  )}
                </div>

                {/* Scenes */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <Clapperboard className="w-3 h-3 text-muted-foreground shrink-0" />
                  <span className="truncate text-muted-foreground">{entry.scenes.join(", ")}</span>
                </div>

                {/* Call Sheet Status */}
                <div className="flex justify-end">
                  <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", csConfig.className)}>
                    <CsIcon className="w-3 h-3" />
                    {csConfig.label}
                  </span>
                </div>
             </Link>
            );
          })}
        </div>
        {entries.length === 0 && <p className="p-6 text-sm text-muted-foreground">No shoot days scheduled in the next 30 days. Open the schedule to plan one.</p>}
      </div>
    </div>
  );
}
