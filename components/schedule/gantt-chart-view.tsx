"use client";

import React, { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { ShootDay } from "@/lib/types";

interface GanttTask {
  id: string;
  number: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  subtasks?: GanttTask[];
  color?: string;
  isMilestone?: boolean;
}

interface GanttChartViewProps {
  shootDays: ShootDay[];
}

const mockTasks: GanttTask[] = [
  {
    id: "1",
    number: "1",
    name: "Pre-Production",
    startDate: "01 Jan 2024",
    endDate: "28 Feb 2024",
    status: "Completed",
    color: "emerald",
    subtasks: [
      { id: "1.1", number: "1.1", name: "Script Development", startDate: "01 Jan 2024", endDate: "15 Jan 2024", status: "Completed", color: "emerald" },
      { id: "1.2", number: "1.2", name: "Casting", startDate: "10 Jan 2024", endDate: "15 Feb 2024", status: "Completed", color: "emerald" },
      { id: "1.3", number: "1.3", name: "Location Scouting", startDate: "20 Jan 2024", endDate: "28 Feb 2024", status: "Completed", color: "emerald" },
    ],
  },
  {
    id: "2",
    number: "2",
    name: "Production",
    startDate: "01 Mar 2024",
    endDate: "30 Jun 2024",
    status: "In Progress",
    color: "blue",
    subtasks: [
      { id: "2.1", number: "2.1", name: "Schedule A (Hyderabad)", startDate: "01 Mar 2024", endDate: "31 Mar 2024", status: "Completed", color: "blue" },
      { id: "2.2", number: "2.2", name: "Schedule B (Ramoji Film City)", startDate: "01 Apr 2024", endDate: "30 Apr 2024", status: "In Progress", color: "blue" },
      { id: "2.3", number: "2.3", name: "Schedule C (Vizag)", startDate: "01 May 2024", endDate: "31 May 2024", status: "Pending", color: "blue" },
      { id: "2.4", number: "2.4", name: "Schedule D (Abroad)", startDate: "01 Jun 2024", endDate: "30 Jun 2024", status: "Pending", color: "blue" },
    ],
  },
  {
    id: "3",
    number: "3",
    name: "Post-Production",
    startDate: "01 Jul 2024",
    endDate: "30 Sep 2024",
    status: "In Progress",
    color: "purple",
    subtasks: [
      { id: "3.1", number: "3.1", name: "Editing", startDate: "01 Jul 2024", endDate: "31 Jul 2024", status: "In Progress", color: "purple" },
      { id: "3.2", number: "3.2", name: "VFX", startDate: "15 Jul 2024", endDate: "31 Aug 2024", status: "Pending", color: "purple" },
      { id: "3.3", number: "3.3", name: "DI & Sound", startDate: "01 Sep 2024", endDate: "30 Sep 2024", status: "Pending", color: "purple" },
    ],
  },
  {
    id: "4",
    number: "4",
    name: "Marketing & Promotion",
    startDate: "01 Oct 2024",
    endDate: "31 Dec 2024",
    status: "Not Started",
    color: "pink",
  },
  {
    id: "5",
    number: "5",
    name: "Release",
    startDate: "12 Jan 2025",
    endDate: "12 Jan 2025",
    status: "Not Started",
    color: "red",
    isMilestone: true,
  },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan 2025"];

function getStatusColors(status: string) {
  const s = status.toLowerCase();
  if (s === "completed") return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400";
  if (s === "in progress" || s === "shooting" || s === "in-progress") return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400";
  if (s === "pending" || s === "confirmed" || s === "planned") return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400";
  if (s === "cancelled") return "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-400";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function getBarColor(color: string | undefined, isSubtask: boolean) {
  switch (color) {
    case "emerald": return isSubtask ? "bg-emerald-400/80" : "bg-emerald-500";
    case "blue": return isSubtask ? "bg-blue-400/80" : "bg-blue-500";
    case "purple": return isSubtask ? "bg-purple-400/80" : "bg-purple-500";
    case "pink": return "bg-pink-400";
    case "red": return "bg-red-500";
    default: return "bg-slate-400";
  }
}

export function GanttChartView({ shootDays }: GanttChartViewProps) {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({
    "1": false,
    "2": true, // Production expanded by default
    "3": false,
  });

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Generate hierarchical tasks from real data!
  const tasks = useMemo(() => {
    if (!shootDays || shootDays.length === 0) return [];

    // We will build: 1. Pre-Production (dummy), 2. Production (real data), 3. Post (dummy)
    // Find min and max dates of all shoot days to position Production
    const sortedDays = [...shootDays].sort((a, b) => a.date.localeCompare(b.date));
    const firstDate = new Date(sortedDays[0].date);
    const lastDate = new Date(sortedDays[sortedDays.length - 1].date);
    
    // Helper to format Date to "DD Mmm YYYY"
    const formatDt = (d: Date) => `${d.getDate().toString().padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

    // Dummy Pre-Production 2 months before first shoot
    const preStart = new Date(firstDate);
    preStart.setMonth(preStart.getMonth() - 2);
    const preEnd = new Date(firstDate);
    preEnd.setDate(preEnd.getDate() - 1);

    // Dummy Post-Production 3 months after last shoot
    const postStart = new Date(lastDate);
    postStart.setDate(postStart.getDate() + 1);
    const postEnd = new Date(lastDate);
    postEnd.setMonth(postEnd.getMonth() + 3);

    // Group shoot days by location for Production subtasks
    const locations = new Map<string, ShootDay[]>();
    sortedDays.forEach(d => {
      const loc = d.location || "Main Unit Stage";
      if (!locations.has(loc)) locations.set(loc, []);
      locations.get(loc)?.push(d);
    });

    const prodSubtasks: GanttTask[] = [];
    let sIdx = 1;
    locations.forEach((days, loc) => {
      days.sort((a, b) => a.date.localeCompare(b.date));
      const sStart = new Date(days[0].date);
      const sEnd = new Date(days[days.length - 1].date);
      const isCompleted = days.every(d => d.status === "completed");
      const isInProgress = days.some(d => d.status === "in-progress");
      
      prodSubtasks.push({
        id: `2.${sIdx}`,
        number: `2.${sIdx}`,
        name: `Schedule ${sIdx} (${loc})`,
        startDate: formatDt(sStart),
        endDate: formatDt(sEnd),
        status: isCompleted ? "Completed" : (isInProgress ? "In Progress" : "Pending"),
        color: "blue"
      });
      sIdx++;
    });

    const isProdCompleted = shootDays.every(d => d.status === "completed");
    const isProdInProgress = shootDays.some(d => d.status === "in-progress");

    return [
      {
        id: "1",
        number: "1",
        name: "Pre-Production (Est.)",
        startDate: formatDt(preStart),
        endDate: formatDt(preEnd),
        status: "Completed",
        color: "emerald",
        subtasks: [
          { id: "1.1", number: "1.1", name: "Script & Casting", startDate: formatDt(preStart), endDate: formatDt(preEnd), status: "Completed", color: "emerald" },
        ]
      },
      {
        id: "2",
        number: "2",
        name: "Production (Actual)",
        startDate: formatDt(firstDate),
        endDate: formatDt(lastDate),
        status: isProdCompleted ? "Completed" : (isProdInProgress ? "In Progress" : "Pending"),
        color: "blue",
        subtasks: prodSubtasks
      },
      {
        id: "3",
        number: "3",
        name: "Post-Production (Est.)",
        startDate: formatDt(postStart),
        endDate: formatDt(postEnd),
        status: isProdCompleted ? "In Progress" : "Pending",
        color: "purple",
        subtasks: [
          { id: "3.1", number: "3.1", name: "Editing & VFX", startDate: formatDt(postStart), endDate: formatDt(postEnd), status: isProdCompleted ? "In Progress" : "Pending", color: "purple" },
        ]
      }
    ];
  }, [shootDays]);

  const calculatePosition = (startDate: string, endDate: string) => {
    const parseDate = (d: string) => {
      const parts = d.split(" ");
      const day = parseInt(parts[0], 10);
      const monthStr = parts[1];
      const year = parseInt(parts[2], 10) || 2024;
      let monthIndex = MONTHS.findIndex((m) => m.startsWith(monthStr));
      if (year === 2025 && monthStr === "Jan") monthIndex = 12;
      return monthIndex + (day - 1) / 30;
    };

    const start = parseDate(startDate);
    const end = parseDate(endDate) + (startDate === endDate ? 0.2 : 0);

    const totalDuration = 13;
    const left = (start / totalDuration) * 100;
    const width = ((end - start) / totalDuration) * 100;

    return { left: `${Math.max(0, left)}%`, width: `${Math.max(0.5, width)}%` };
  };

  const renderRow = (task: GanttTask, isSubtask = false) => {
    const pos = calculatePosition(task.startDate, task.endDate);
    const isMilestone = task.isMilestone || task.startDate === task.endDate;
    const hasSubtasks = !isSubtask && task.subtasks && task.subtasks.length > 0;
    const isExpanded = expandedRows[task.id];

    return (
      <div key={task.id} className="grid grid-cols-[450px_1fr] border-b hover:bg-muted/30 transition-colors">
        <div className="grid grid-cols-[30px_1fr_80px_80px_90px] items-center text-xs py-2.5 pr-4 border-r gap-1">
          <div className="text-center font-medium text-muted-foreground">{task.number}</div>
          <div 
            className={`flex items-center gap-2 pr-2 ${isSubtask ? "pl-7" : "font-bold text-[13px]"} ${hasSubtasks ? "cursor-pointer select-none hover:text-primary transition-colors" : ""}`}
            onClick={() => hasSubtasks && toggleRow(task.id)}
          >
            {hasSubtasks ? (
              isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            ) : (
              !isMilestone && <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${getBarColor(task.color, false)}`} />
            )}
            <span className="whitespace-normal leading-tight" title={task.name}>{task.name}</span>
          </div>
          <div className="text-muted-foreground text-[11px]">{task.startDate}</div>
          <div className="text-muted-foreground text-[11px]">{task.endDate}</div>
          <div className="flex justify-end">
            <Badge variant="outline" className={`justify-center text-[10px] py-0 h-5 px-1.5 ${getStatusColors(task.status)}`}>
              {task.status}
            </Badge>
          </div>
        </div>

        <div className="relative py-2.5 flex items-center group overflow-hidden">
          <div
            className={`absolute h-5 rounded-md shadow-sm transition-all flex items-center px-2 text-[10px] text-white font-bold whitespace-nowrap overflow-hidden
              ${getBarColor(task.color, isSubtask)} ${isMilestone ? "transform -rotate-45 !w-3.5 !h-3.5 ml-[-6px] rounded-sm" : ""}`}
            style={{ left: pos.left, width: isMilestone ? undefined : pos.width }}
          >
            {!isMilestone && task.name}
          </div>
          {isMilestone && (
            <div className="absolute text-[10px] font-bold text-foreground mt-8 ml-[-12px]" style={{ left: pos.left }}>
              {task.name}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-xl border bg-card shadow-sm flex flex-col mb-6 overflow-hidden">
      <div className="grid grid-cols-[450px_1fr] border-b bg-muted/40">
        <div className="grid grid-cols-[30px_1fr_80px_80px_90px] items-center text-[11px] uppercase tracking-wider font-bold text-muted-foreground py-2.5 pr-4 border-r gap-1">
          <div className="text-center">#</div>
          <div>Task / Milestone</div>
          <div>Start Date</div>
          <div>End Date</div>
          <div className="text-right">Status</div>
        </div>
        <div className="flex items-center text-[11px] font-bold text-muted-foreground text-center py-2 relative">
          {MONTHS.map((m, i) => (
            <div key={i} className="flex-1 relative">
              {m === "Aug" && i === 7 ? (
                <div className="flex flex-col items-center relative -top-0.5 z-20">
                  <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px]">Today</span>
                </div>
              ) : (
                <span className="relative z-10">{m}</span>
              )}
            </div>
          ))}
          <div className="absolute top-7 bottom-[-1000px] border-l-2 border-dashed border-red-500/50 z-0 pointer-events-none" style={{ left: `${(7.5/13)*100}%` }} />
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex pointer-events-none">
          {MONTHS.map((_, i) => (
             <div key={i} className="flex-1 border-r border-border/40 h-full" />
          ))}
        </div>

        <div className="relative z-10 flex flex-col">
          {tasks.length > 0 ? tasks.map((task) => (
            <React.Fragment key={task.id}>
              {renderRow(task)}
              {expandedRows[task.id] && task.subtasks?.map((sub) => renderRow(sub, true))}
            </React.Fragment>
          )) : (
            <div className="py-8 text-center text-muted-foreground text-sm">No shoot days scheduled for this period.</div>
          )}
        </div>
      </div>
    </div>
  );
}
