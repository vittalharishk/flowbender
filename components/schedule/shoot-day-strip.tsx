"use client";

import Link from "next/link";
import { MapPin, Users, Film, Clock, AlertTriangle, FileText, UserCog, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ShootDay } from "@/lib/types";
import { shootDayStatusLabels, shootDayStatusColors, shootDayStatusDot } from "@/lib/schedule-store";

interface Props {
  day: ShootDay;
  basePath: string;
  isToday?: boolean;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function ShootDayStrip({ day, basePath, isToday }: Props) {
  const href = `${basePath}/${day.id}`;
  const hasConflicts = day.conflicts.length > 0;
  const criticalConflicts = day.conflicts.filter((c) => c.severity === "critical");

  return (
    <Link href={href} className="group block">
      <div className={cn(
        "flex items-stretch border rounded-lg transition-all bg-card overflow-hidden",
        isToday ? "border-amber-500/40 shadow-lg shadow-amber-500/5" : "hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/5",
        hasConflicts && criticalConflicts.length > 0 && "border-red-500/30",
      )}>
        {/* Status strip */}
        <div className={cn("w-1.5 shrink-0", shootDayStatusDot[day.status])} />

        {/* Date box */}
        <div className={cn(
          "w-16 sm:w-20 flex flex-col items-center justify-center shrink-0 border-r py-3",
          isToday ? "bg-gradient-to-b from-amber-500/10 to-orange-600/5" : "bg-muted/30"
        )}>
          <span className={cn("text-2xl font-bold leading-none", isToday && "text-amber-400")}>
            {new Date(day.date).getDate()}
          </span>
          <span className="text-[10px] uppercase text-muted-foreground mt-0.5">
            {new Date(day.date).toLocaleDateString("en", { month: "short" })}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {new Date(day.date).toLocaleDateString("en", { weekday: "short" })}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 p-3 sm:p-4 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {day.shootDayNumber > 0 && (
                  <span className="text-xs font-semibold text-muted-foreground">Day {day.shootDayNumber}</span>
                )}
                <span className="text-sm font-semibold group-hover:text-amber-400 transition-colors">{day.projectTitle}</span>
                {isToday && <span className="text-[10px] text-amber-400 font-bold uppercase">Today</span>}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {day.location}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {day.callTime} — {day.wrapTime}</span>
                <span className="flex items-center gap-1"><Film className="w-3 h-3" /> {day.scenes.length} scene{day.scenes.length !== 1 ? "s" : ""}</span>
                <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {day.totalPages} pg</span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {day.castRequired.length} cast</span>
                <span className="flex items-center gap-1"><UserCog className="w-3 h-3" /> {day.crewRequired.length} crew</span>
              </div>

              {/* Scenes preview */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {day.scenes.slice(0, 4).map((sc) => (
                  <span key={sc.sceneNumber} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    Sc. {sc.sceneNumber}
                  </span>
                ))}
                {day.scenes.length > 4 && (
                  <span className="text-[10px] text-muted-foreground">+{day.scenes.length - 4} more</span>
                )}
              </div>
            </div>

            {/* Right side — status + conflicts */}
            <div className="flex flex-col items-end gap-1.5 shrink-0 self-start">
              <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full border", shootDayStatusColors[day.status])}>
                {shootDayStatusLabels[day.status]}
              </span>
              {hasConflicts && (
                <span className={cn(
                  "flex items-center gap-1 text-[10px] font-medium",
                  criticalConflicts.length > 0 ? "text-red-400" : "text-amber-400"
                )}>
                  <AlertTriangle className="w-3 h-3" />
                  {day.conflicts.length} conflict{day.conflicts.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
