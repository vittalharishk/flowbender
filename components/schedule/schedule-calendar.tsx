"use client";

import { useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ShootDay } from "@/lib/types";
import { shootDayStatusDot } from "@/lib/schedule-store";

interface Props {
  shootDays: ShootDay[];
  month: number;
  year: number;
  basePath: string;
  today: string;
}

export function ScheduleCalendar({ shootDays, month, year, basePath, today }: Props) {
  const { weeks, monthLabel } = useMemo(() => {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const label = first.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    const startDay = first.getDay();
    const totalDays = last.getDate();

    const weeks: (number | null)[][] = [];
    let week: (number | null)[] = Array(startDay).fill(null);

    for (let d = 1; d <= totalDays; d++) {
      week.push(d);
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }
    if (week.length > 0) {
      while (week.length < 7) week.push(null);
      weeks.push(week);
    }

    return { weeks, monthLabel: label };
  }, [month, year]);

  const dayMap = useMemo(() => {
    const map: Record<number, ShootDay[]> = {};
    shootDays.forEach((sd) => {
      const d = new Date(sd.date);
      if (d.getMonth() === month && d.getFullYear() === year) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(sd);
      }
    });
    return map;
  }, [shootDays, month, year]);

  const todayDate = new Date(today);
  const isTodayMonth = todayDate.getMonth() === month && todayDate.getFullYear() === year;
  const todayDay = todayDate.getDate();

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-center">{monthLabel}</h3>
      </div>
      <div className="grid grid-cols-7">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="p-2 text-center text-[10px] uppercase tracking-wider text-muted-foreground border-b font-medium">
            {d}
          </div>
        ))}
        {weeks.flat().map((day, i) => {
          const isToday = isTodayMonth && day === todayDay;
          const events = day ? dayMap[day] || [] : [];
          const hasConflict = events.some((e) => e.conflicts.length > 0);

          return (
            <div
              key={i}
              className={cn(
                "min-h-[80px] sm:min-h-[100px] p-1.5 border-b border-r text-xs",
                !day && "bg-muted/20",
                isToday && "bg-amber-500/5",
              )}
            >
              {day && (
                <>
                  <span className={cn(
                    "inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-medium mb-1",
                    isToday && "bg-amber-500 text-white",
                  )}>
                    {day}
                  </span>
                  <div className="space-y-0.5">
                    {events.map((ev) => (
                      <Link
                        key={ev.id}
                        href={`${basePath}/${ev.id}`}
                        className={cn(
                          "block px-1.5 py-0.5 rounded text-[10px] truncate transition-colors hover:ring-1 hover:ring-amber-500/30",
                          hasConflict ? "bg-red-500/10 text-red-400" : "bg-muted/60 text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <span className={cn("inline-block w-1.5 h-1.5 rounded-full mr-1", shootDayStatusDot[ev.status])} />
                        {ev.shootDayNumber > 0 ? `D${ev.shootDayNumber}` : "Pre"} {ev.location.split("—")[0].trim().slice(0, 12)}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
