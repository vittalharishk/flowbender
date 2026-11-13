"use client";

import { useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProjects } from "@/lib/project-store";
import { useShootDays } from "@/lib/schedule-store";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const PHASE_COLORS: Record<string, { bg: string; border: string; label: string }> = {
  "pre-production": { bg: "bg-blue-500/20", border: "border-blue-500/40", label: "Pre-Production" },
  production: { bg: "bg-amber-500/20", border: "border-amber-500/40", label: "Production" },
  "post-production": { bg: "bg-purple-500/20", border: "border-purple-500/40", label: "Post-Production" },
  completed: { bg: "bg-green-500/20", border: "border-green-500/40", label: "Completed" },
  distribution: { bg: "bg-pink-500/20", border: "border-pink-500/40", label: "Distribution" },
};

function monthsBetween(start: Date, end: Date): Date[] {
  const months: Date[] = [];
  const current = new Date(start.getFullYear(), start.getMonth(), 1);
  while (current <= end) {
    months.push(new Date(current));
    current.setMonth(current.getMonth() + 1);
  }
  return months;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function formatMonth(d: Date) {
  return d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

export function GanttChartReport() {
  const projects = useProjects();
  const shootDays = useShootDays();
  const [scrollOffset, setScrollOffset] = useState(0);

  const { timeline, rows, totalDays, months } = useMemo(() => {
    if (projects.length === 0) return { timeline: null, rows: [], totalDays: 0, months: [] };

    const dates = projects.flatMap((p) => {
      const d: Date[] = [];
      if (p.startDate) d.push(new Date(p.startDate));
      if (p.endDate) d.push(new Date(p.endDate));
      if (p.releaseDate) d.push(new Date(p.releaseDate));
      return d;
    }).filter((d) => !isNaN(d.getTime()));

    if (dates.length === 0) return { timeline: null, rows: [], totalDays: 0, months: [] };

    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));
    minDate.setDate(1);
    maxDate.setMonth(maxDate.getMonth() + 1, 0);

    const totalDays = daysBetween(minDate, maxDate) || 1;
    const months = monthsBetween(minDate, maxDate);

    const rows = projects.map((p) => {
      const start = p.startDate ? new Date(p.startDate) : minDate;
      const end = p.endDate ? new Date(p.endDate) : maxDate;
      const release = p.releaseDate ? new Date(p.releaseDate) : null;

      const startOffset = daysBetween(minDate, start);
      const duration = daysBetween(start, end);

      const projectShootDays = shootDays.filter((sd) => sd.projectId === p.id);
      const firstShoot = projectShootDays.length > 0
        ? new Date(Math.min(...projectShootDays.map((sd) => new Date(sd.date).getTime())))
        : null;
      const lastShoot = projectShootDays.length > 0
        ? new Date(Math.max(...projectShootDays.map((sd) => new Date(sd.date).getTime())))
        : null;

      const phases: { label: string; left: number; width: number; color: string; borderColor: string }[] = [];

      if (firstShoot && lastShoot) {
        const preEnd = firstShoot;
        if (daysBetween(start, preEnd) > 0) {
          phases.push({
            label: "Pre-Prod",
            left: (daysBetween(minDate, start) / totalDays) * 100,
            width: (daysBetween(start, preEnd) / totalDays) * 100,
            color: PHASE_COLORS["pre-production"].bg,
            borderColor: PHASE_COLORS["pre-production"].border,
          });
        }
        phases.push({
          label: "Production",
          left: (daysBetween(minDate, firstShoot) / totalDays) * 100,
          width: (daysBetween(firstShoot, lastShoot) / totalDays) * 100,
          color: PHASE_COLORS["production"].bg,
          borderColor: PHASE_COLORS["production"].border,
        });
        if (daysBetween(lastShoot, end) > 0) {
          phases.push({
            label: "Post-Prod",
            left: (daysBetween(minDate, lastShoot) / totalDays) * 100,
            width: (daysBetween(lastShoot, end) / totalDays) * 100,
            color: PHASE_COLORS["post-production"].bg,
            borderColor: PHASE_COLORS["post-production"].border,
          });
        }
      } else {
        const phaseKey = p.status in PHASE_COLORS ? p.status : "production";
        phases.push({
          label: PHASE_COLORS[phaseKey].label,
          left: (startOffset / totalDays) * 100,
          width: (duration / totalDays) * 100,
          color: PHASE_COLORS[phaseKey].bg,
          borderColor: PHASE_COLORS[phaseKey].border,
        });
      }

      return { id: p.id, title: p.title, phases, release, minDate };
    });

    return { timeline: { minDate, maxDate }, rows, totalDays, months };
  }, [projects, shootDays]);

  if (!timeline || rows.length === 0) {
    return (
      <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">
        No projects with dates to display on the Gantt chart.
      </CardContent></Card>
    );
  }

  const today = new Date();
  const todayOffset = daysBetween(timeline.minDate, today);
  const todayPercent = (todayOffset / totalDays) * 100;

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(PHASE_COLORS).filter(([k]) => k !== "completed" && k !== "distribution").map(([key, val]) => (
          <div key={key} className="flex items-center gap-1.5 text-xs">
            <div className={`w-3 h-3 rounded-sm ${val.bg} border ${val.border}`} />
            <span className="text-muted-foreground">{val.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-xs">
          <div className="w-3 h-0.5 bg-red-500" />
          <span className="text-muted-foreground">Today</span>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Month header */}
            <div className="flex border-b border-border/50 bg-muted/30">
              <div className="w-48 flex-shrink-0 px-3 py-2 text-xs font-medium text-muted-foreground border-r border-border/50">
                Project
              </div>
              <div className="flex-1 relative flex">
                {months.map((m, i) => {
                  const mStart = daysBetween(timeline.minDate, m);
                  const mEnd = i < months.length - 1
                    ? daysBetween(timeline.minDate, months[i + 1])
                    : totalDays;
                  const width = ((mEnd - mStart) / totalDays) * 100;
                  return (
                    <div key={i} className="text-center text-[10px] text-muted-foreground py-2 border-r border-border/30" style={{ width: `${width}%` }}>
                      {formatMonth(m)}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rows */}
            {rows.map((row) => (
              <div key={row.id} className="flex border-b border-border/30 hover:bg-muted/20 transition-colors">
                <div className="w-48 flex-shrink-0 px-3 py-3 text-xs font-medium truncate border-r border-border/50">
                  {row.title}
                </div>
                <div className="flex-1 relative py-2 px-1">
                  {row.phases.map((phase, i) => (
                    <div
                      key={i}
                      className={`absolute top-2 h-6 rounded-md ${phase.color} border ${phase.borderColor} flex items-center justify-center`}
                      style={{ left: `${phase.left}%`, width: `${Math.max(phase.width, 0.5)}%` }}
                      title={phase.label}
                    >
                      {phase.width > 5 && (
                        <span className="text-[9px] font-medium truncate px-1">{phase.label}</span>
                      )}
                    </div>
                  ))}
                  {/* Today line */}
                  {todayPercent >= 0 && todayPercent <= 100 && (
                    <div
                      className="absolute top-0 bottom-0 w-px bg-red-500 z-10"
                      style={{ left: `${todayPercent}%` }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
