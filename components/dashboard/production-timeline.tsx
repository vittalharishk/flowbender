"use client";

import { Flag, Play, CheckCircle2, Eye, Truck } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import type { TimelineMilestone } from "@/lib/types";

const typeConfig: Record<TimelineMilestone["type"], { icon: typeof Flag; color: string; bg: string }> = {
  start: { icon: Play, color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/30" },
  wrap: { icon: CheckCircle2, color: "text-amber-400", bg: "bg-amber-500/15 border-amber-500/30" },
  delivery: { icon: Truck, color: "text-blue-400", bg: "bg-blue-500/15 border-blue-500/30" },
  review: { icon: Eye, color: "text-cyan-400", bg: "bg-cyan-500/15 border-cyan-500/30" },
  milestone: { icon: Flag, color: "text-orange-400", bg: "bg-orange-500/15 border-orange-500/30" },
};

function formatDate(dateStr: string) {
  return parseISO(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function daysUntil(dateStr: string) {
  const diff = differenceInCalendarDays(parseISO(dateStr), new Date());
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff < 0) return `${Math.abs(diff)}d ago`;
  return `In ${diff}d`;
}

interface ProductionTimelineProps {
  milestones: TimelineMilestone[];
}

export function ProductionTimeline({ milestones }: ProductionTimelineProps) {
  const [expanded, setExpanded] = useState(false);
  const visibleMilestones = expanded ? milestones : milestones.slice(0, 6);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Production Timeline</h3>
        {milestones.length > 6 && <button onClick={() => setExpanded(!expanded)} className="text-sm text-primary hover:underline">{expanded ? "Show less" : "Full timeline"}</button>}
      </div>
      <div className="rounded-xl border bg-card p-4">
        <div className="space-y-0">
          {visibleMilestones.map((m, i) => {
            const config = typeConfig[m.type];
            const Icon = config.icon;
            const isLast = i === visibleMilestones.length - 1;
            const isToday = daysUntil(m.date) === "Today";

            return (
              <div key={m.id} className="flex gap-3">
                {/* Timeline line + dot */}
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full border flex items-center justify-center shrink-0",
                      config.bg,
                      isToday && "ring-2 ring-amber-500/30"
                    )}
                  >
                    <Icon className={cn("w-3.5 h-3.5", config.color)} />
                  </div>
                  {!isLast && <div className="w-px flex-1 bg-border min-h-[24px]" />}
                </div>

                {/* Content */}
                <div className={cn("pb-5 min-w-0 flex-1", isLast && "pb-0")}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link href={`/dashboard/projects/${m.projectId}`} className="text-sm font-medium hover:underline">{m.title}</Link>
                      <p className="text-xs text-muted-foreground mt-0.5">{m.projectTitle}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-medium">{formatDate(m.date)}</p>
                      <p
                        className={cn(
                          "text-[11px] mt-0.5",
                          isToday ? "text-amber-400 font-medium" : "text-muted-foreground"
                        )}
                      >
                        {daysUntil(m.date)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {milestones.length === 0 && <p className="text-sm text-muted-foreground">No upcoming milestones. Set project start and end dates to plan your timeline.</p>}
        </div>
      </div>
    </div>
  );
}
