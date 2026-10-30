"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  Film,
  Filter,
  Layers,
  MapPin,
  MoveRight,
  Sparkles,
  Users,
  Wrench,
  Zap,
} from "lucide-react";
import type { ShootDay, ShootDayScene, Scene } from "@/lib/types";
import { useAppDataSlice } from "@/lib/app-data-store";
import { updateShootDay } from "@/lib/schedule-store";
import { updateScene } from "@/lib/scene-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface StripboardProps {
  shootDays: ShootDay[];
  basePath?: string;
  projectId?: string;
}

// Industry standard strip colors
export type StripType = "DAY EXT" | "NIGHT INT" | "NIGHT EXT" | "DAY INT" | "DAWN/DUSK";

export function getStripType(intExt?: string, timeOfDay?: string, heading?: string): StripType {
  const isExt = (intExt ?? "").toUpperCase().includes("EXT") || (heading ?? "").toUpperCase().includes("EXT");
  const rawTod = (timeOfDay ?? (heading?.toUpperCase().includes("NIGHT") ? "NIGHT" : heading?.toUpperCase().includes("DAWN") ? "DAWN" : heading?.toUpperCase().includes("DUSK") ? "DUSK" : "DAY")).toUpperCase();
  const isNight = rawTod.includes("NIGHT");
  const isDawnDusk = rawTod.includes("DAWN") || rawTod.includes("DUSK") || rawTod.includes("MAGIC");

  if (isDawnDusk) return "DAWN/DUSK";
  if (isExt && !isNight) return "DAY EXT";
  if (!isExt && isNight) return "NIGHT INT";
  if (isExt && isNight) return "NIGHT EXT";
  return "DAY INT";
}

export const stripColorStyles: Record<
  StripType,
  {
    bg: string;
    border: string;
    text: string;
    badgeBg: string;
    badgeText: string;
    label: string;
  }
> = {
  "DAY EXT": {
    bg: "bg-amber-500/10 dark:bg-amber-500/15 hover:bg-amber-500/20",
    border: "border-amber-500/40",
    text: "text-amber-900 dark:text-amber-200",
    badgeBg: "bg-amber-500/25 text-amber-950 dark:text-amber-100 border-amber-500/40",
    badgeText: "text-amber-800 dark:text-amber-300",
    label: "Day Ext (Yellow)",
  },
  "NIGHT INT": {
    bg: "bg-blue-600/10 dark:bg-blue-600/20 hover:bg-blue-600/25",
    border: "border-blue-500/40",
    text: "text-blue-900 dark:text-blue-200",
    badgeBg: "bg-blue-500/25 text-blue-950 dark:text-blue-100 border-blue-500/40",
    badgeText: "text-blue-800 dark:text-blue-300",
    label: "Night Int (Blue)",
  },
  "NIGHT EXT": {
    bg: "bg-emerald-600/10 dark:bg-emerald-600/20 hover:bg-emerald-600/25",
    border: "border-emerald-500/40",
    text: "text-emerald-900 dark:text-emerald-200",
    badgeBg: "bg-emerald-500/25 text-emerald-950 dark:text-emerald-100 border-emerald-500/40",
    badgeText: "text-emerald-800 dark:text-emerald-300",
    label: "Night Ext (Green)",
  },
  "DAY INT": {
    bg: "bg-slate-500/10 dark:bg-zinc-800/40 hover:bg-slate-500/15",
    border: "border-slate-400/40 dark:border-zinc-700",
    text: "text-slate-900 dark:text-zinc-100",
    badgeBg: "bg-slate-200 dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 border-slate-300 dark:border-zinc-600",
    badgeText: "text-slate-700 dark:text-zinc-300",
    label: "Day Int (White)",
  },
  "DAWN/DUSK": {
    bg: "bg-orange-500/10 dark:bg-orange-500/15 hover:bg-orange-500/20",
    border: "border-orange-500/40",
    text: "text-orange-900 dark:text-orange-200",
    badgeBg: "bg-orange-500/25 text-orange-950 dark:text-orange-100 border-orange-500/40",
    badgeText: "text-orange-800 dark:text-orange-300",
    label: "Dawn/Dusk (Coral)",
  },
};

export function SceneStripboard({ shootDays: initialDays, basePath = "/dashboard/schedule", projectId }: StripboardProps) {
  const equipmentInventory = useAppDataSlice("equipmentInventory");
  const days = initialDays;
  const allDays = useAppDataSlice("shootDays");
  const sceneRecords = useAppDataSlice("scenes");
  const castRecords = useAppDataSlice("castMembers");
  const [projectFilter, setProjectFilter] = useState(projectId ?? "all");
  const [stripFilter, setStripFilter] = useState<string>("all");
  const [expandedScenes, setExpandedScenes] = useState<Record<string, boolean>>({});

  // Filter days by project
  const filteredDays = useMemo(() => {
    let result = days;
    if (projectFilter !== "all") {
      result = result.filter((d) => d.projectId === projectFilter);
    }
    return result;
  }, [days, projectFilter]);

  // Unique projects list
  const projectList = useMemo(() => {
    const map = new Map<string, string>();
    days.forEach((d) => map.set(d.projectId, d.projectTitle));
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [days]);

  // Live Conflict Detection Engine
  const conflicts = useMemo(() => {
    const detected: Array<{
      id: string;
      type: "equipment" | "turnaround" | "workload" | "cast";
      severity: "critical" | "warning";
      dayId: string;
      dayNumber: number;
      projectTitle: string;
      title: string;
      description: string;
      actionLabel?: string;
    }> = [];

    // 1. Equipment Conflicts: Check if shoot day requires equipment currently in maintenance
    const maintenanceGear = equipmentInventory.filter((e) => e.status === "maintenance");
    days.forEach((d) => {
      d.equipment.forEach((req) => {
        const foundMaint = maintenanceGear.find(
          (m) => m.name.toLowerCase() === req.name.toLowerCase()
        );
        if (foundMaint) {
          detected.push({
            id: `conf-eq-${d.id}-${foundMaint.id}`,
            type: "equipment",
            severity: "critical",
            dayId: d.id,
            dayNumber: d.shootDayNumber,
            projectTitle: d.projectTitle,
            title: `Equipment in Maintenance: ${req.name}`,
            description: `Day ${d.shootDayNumber} requires "${req.name}", which is currently tagged for maintenance in the gear register.`,
            actionLabel: "View Equipment Specs",
          });
        }
      });
    });

    // 2. Turnaround Rule Violation: Night shoot wrapped late (< 12 hrs before next day call)
    {
      const chronological = [...allDays].filter((day) => day.status !== "cancelled").sort((a, b) => a.projectId.localeCompare(b.projectId) || a.date.localeCompare(b.date) || a.callTime.localeCompare(b.callTime));
      for (let i = 0; i < chronological.length - 1; i++) {
        const curr = chronological[i];
        const next = chronological[i + 1];
        if (curr.projectId === next.projectId) {
          const wrap = new Date(`${curr.date}T${curr.wrapTime}`);
          if (curr.wrapTime < curr.callTime) wrap.setDate(wrap.getDate() + 1);
          const restHours = (new Date(`${next.date}T${next.callTime}`).getTime() - wrap.getTime()) / 3600000;
          if (restHours < 12 && filteredDays.some((day) => day.id === next.id)) {
            detected.push({
              id: `conf-turn-${curr.id}-${next.id}`,
              type: "turnaround",
              severity: "critical",
              dayId: next.id,
              dayNumber: next.shootDayNumber,
              projectTitle: next.projectTitle,
              title: `Turnaround Violation: Day ${curr.shootDayNumber} → Day ${next.shootDayNumber}`,
              description: `Only ${restHours.toFixed(1)} hours between wrap and the next call. Review the schedule against the production's 12-hour turnaround target.`,
              actionLabel: "Review shoot day",
            });
          }
        }
      }
    }

    // 3. Workload Warnings: Days with > 4.5 pages
    days.forEach((d) => {
      if (d.totalPages >= 4.0) {
        detected.push({
          id: `conf-work-${d.id}`,
          type: "workload",
          severity: "warning",
          dayId: d.id,
          dayNumber: d.shootDayNumber,
          projectTitle: d.projectTitle,
          title: `Heavy Day Load: ${d.totalPages} Pages Scheduled`,
          description: `Day ${d.shootDayNumber} has ${d.scenes.length} scenes totaling ${d.totalPages} pages. Typical Pan-India drama throughput is 2.5–3.0 pages/day.`,
          actionLabel: "Review shoot day",
        });
      }
    });

    return detected.filter((conflict) => filteredDays.some((day) => day.id === conflict.dayId));
  }, [days, allDays, filteredDays, equipmentInventory]);

  const toggleExpand = (sceneId: string) => {
    setExpandedScenes((prev) => ({ ...prev, [sceneId]: !prev[sceneId] }));
  };

  const shiftSceneWithinDay = (dayId: string, sceneIndex: number, direction: "up" | "down") => {
    const day = allDays.find((item) => item.id === dayId);
    if (!day) return;
        const newScenes = [...day.scenes];
        const targetIndex = direction === "up" ? sceneIndex - 1 : sceneIndex + 1;
        if (targetIndex < 0 || targetIndex >= newScenes.length) return;
        const [moved] = newScenes.splice(sceneIndex, 1);
        newScenes.splice(targetIndex, 0, moved);
        updateShootDay(day.id, { scenes: newScenes });
  };

  const nextDay = (day: ShootDay) => [...allDays].filter((item) => item.projectId === day.projectId && item.date > day.date && item.status !== "cancelled" && item.status !== "completed").sort((a, b) => a.date.localeCompare(b.date))[0];
  const moveSceneToNextDay = (fromId: string, sceneIndex: number) => {
    const from = allDays.find((day) => day.id === fromId);
    const to = from && nextDay(from);
    const scene = from?.scenes[sceneIndex];
    if (!from || !to || !scene) return;
    if (to.scenes.some((item) => item.sceneNumber === scene.sceneNumber)) { window.alert("That scene is already scheduled on the next day."); return; }
    if (!window.confirm(`Move scene ${scene.sceneNumber} to Day ${to.shootDayNumber} (${to.date})? Review any existing call sheets after this change.`)) return;
    const patchScenes = (day: ShootDay, scenes: ShootDayScene[]) => updateShootDay(day.id, {
      scenes, totalPages: scenes.reduce((total, item) => total + item.pages, 0),
      castRequired: castRecords.filter((member) => member.projectId === day.projectId && scenes.some((item) => item.characters.includes(member.character))).map((member) => member.name),
    });
    patchScenes(from, from.scenes.filter((_, index) => index !== sceneIndex));
    patchScenes(to, [...to.scenes, scene]);
    const record = sceneRecords.find((item) => item.projectId === from.projectId && item.sceneNumber === scene.sceneNumber);
    if (record) updateScene(record.id, { shootDay: to.shootDayNumber, shootDate: to.date });
  };

  return (
    <div className="space-y-6">
      {/* Stripboard Header & Stats Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/20 border rounded-xl p-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight">Production Scene Stripboard</h2>
            <Badge variant="outline" className="font-mono text-xs">
              Industry Standard
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Visual breakdown strips for Assistant Directors and Production Managers with real-time clash alerts.
          </p>
        </div>

        {/* Color Legend Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(Object.entries(stripColorStyles) as [StripType, (typeof stripColorStyles)["DAY EXT"]][]).map(
            ([type, style]) => (
              <button
                key={type}
                type="button"
                onClick={() => setStripFilter(stripFilter === type ? "all" : type)}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold border transition-all ${
                  style.bg
                } ${style.border} ${style.text} ${
                  stripFilter === type ? "ring-2 ring-primary shadow-xs" : "opacity-85 hover:opacity-100"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current" />
                {type}
              </button>
            )
          )}
        </div>
      </div>

      {/* Production Conflict Advisor Banner */}
      {conflicts.length > 0 && (
        <Card className="border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-500">
                <AlertTriangle className="h-4 w-4" />
                Production Conflict Advisor ({conflicts.length} Detected)
              </CardTitle>
              <span className="text-xs text-muted-foreground">Review conflicts before changing the schedule.</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {conflicts.map((c) => (
              <div
                key={c.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-amber-500/20 bg-background/80 p-2.5 text-xs"
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`mt-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                      c.severity === "critical"
                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                        : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    {c.type}
                  </span>
                  <div>
                    <span className="font-semibold text-foreground">{c.title}</span>
                    <p className="text-muted-foreground mt-0.5">{c.description}</p>
                  </div>
                </div>

                {c.actionLabel && (
                  <Button
                    asChild
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-primary hover:bg-primary/10 shrink-0 self-end sm:self-center"
                  >
                    <Link href={c.type === "equipment" ? "/dashboard/equipment" : `${basePath}/${c.dayId}`}>{c.actionLabel} →</Link>
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Filter Controls */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="h-9 rounded-md border bg-background px-3 text-xs focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Active Productions</option>
            {projectList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>

          {stripFilter !== "all" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setStripFilter("all")}
              className="h-9 text-xs"
            >
              Clear Filter ({stripFilter}) ×
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Layers className="h-3.5 w-3.5" />
          <span>
            {filteredDays.length} Shoot Days ·{" "}
            {filteredDays.reduce((acc, d) => acc + d.scenes.length, 0)} Total Scenes
          </span>
        </div>
      </div>

      {/* Master Stripboard Rows by Shoot Day */}
      <div className="space-y-6">
        {filteredDays.map((day, dayIndex) => {
          const dayConflicts = conflicts.filter((c) => c.dayId === day.id);
          const visibleScenes =
            stripFilter === "all"
              ? day.scenes
              : day.scenes.filter(
                  (s) => getStripType(s.intExt, s.timeOfDay, s.heading) === stripFilter
                );

          return (
            <div
              key={day.id}
              className="rounded-xl border border-border bg-card/60 backdrop-blur overflow-hidden shadow-xs"
            >
              {/* Day Header Banner (Divider Strip) */}
              <div className="bg-muted/60 border-b p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-primary/15 text-primary px-2.5 py-1 text-xs font-bold uppercase tracking-wider">
                      Day {day.shootDayNumber}
                    </span>
                    <h3 className="font-bold text-sm text-foreground">
                      {new Date(day.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </h3>
                  </div>

                  <span className="text-muted-foreground text-xs hidden sm:inline">•</span>
                  <span className="text-xs font-semibold text-primary/90">
                    {day.projectTitle}
                  </span>

                  <span className="text-muted-foreground text-xs hidden sm:inline">•</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {day.location}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 font-mono text-muted-foreground">
                    <Clock className="h-3 w-3" /> {day.callTime} – {day.wrapTime}
                  </span>
                  <Badge variant="outline" className="font-mono text-xs">
                    {day.totalPages} pgs
                  </Badge>
                  {dayConflicts.length > 0 && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">
                      <AlertTriangle className="h-3 w-3" /> {dayConflicts.length} Conflict
                    </span>
                  )}
                  <Link
                    href={`${basePath}/${day.id}`}
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5"
                  >
                    Shoot day details →
                  </Link>
                </div>
              </div>

              {/* Day Scenes Strip Container */}
              <div className="p-3 space-y-2">
                {visibleScenes.map((scene) => {
                  const sceneIndex = day.scenes.indexOf(scene);
                  const stripType = getStripType(scene.intExt, scene.timeOfDay, scene.heading);
                  const style = stripColorStyles[stripType];
                  const isExpanded = expandedScenes[`${day.id}:${scene.sceneNumber}`];
                  const todLabel =
                    scene.timeOfDay ||
                    (scene.heading.toUpperCase().includes("NIGHT") ? "NIGHT" : "DAY");

                  return (
                    <div
                      key={scene.sceneNumber}
                      className={`rounded-lg border transition-all ${style.bg} ${style.border} ${style.text} overflow-hidden shadow-2xs`}
                    >
                      {/* Main Strip Line */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between p-2.5 sm:p-3 gap-2">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Scene Number Plate */}
                          <div className="flex flex-col items-center justify-center w-12 sm:w-14 shrink-0 rounded bg-black/40 text-white font-mono p-1 border border-white/10">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                              Scene
                            </span>
                            <span className="text-base font-extrabold leading-none">
                              {scene.sceneNumber}
                            </span>
                          </div>

                          {/* Setting Badge (Day/Night & Int/Ext) */}
                          <div className="flex flex-col shrink-0 gap-1">
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${style.badgeBg}`}
                            >
                              {scene.intExt} · {todLabel}
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground/80">
                              {scene.pages} {scene.pages === 1 ? "page" : "pages"}
                            </span>
                          </div>

                          {/* Heading & Synopsis */}
                          <div className="min-w-0 flex-1 pl-1">
                            <h4 className="text-xs sm:text-sm font-bold truncate leading-tight">
                              {scene.heading}
                            </h4>
                            <div className="flex items-center gap-2 mt-1 flex-wrap text-[11px]">
                              {scene.characters.map((char) => (
                                <span
                                  key={char}
                                  className="rounded bg-black/30 px-1.5 py-0.2 text-[10px] font-medium border border-black/10"
                                >
                                  {char}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Reordering & Shift Actions */}
                        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                          {/* Shift between shoot days */}
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Shift scene to next shoot day"
                            onClick={() => moveSceneToNextDay(day.id, sceneIndex)}
                            disabled={!nextDay(day) || day.status === "completed" || day.status === "cancelled"}
                            className="h-7 px-2 text-xs hover:bg-black/20"
                          >
                            <MoveRight className="h-3.5 w-3.5 mr-1" /> Next Day
                          </Button>

                          {/* Reorder Up/Down in Day */}
                          <div className="flex items-center rounded border border-black/20 bg-black/20">
                            <button
                              type="button"
                              title="Move scene earlier in schedule"
                              onClick={() => shiftSceneWithinDay(day.id, sceneIndex, "up")}
                              disabled={sceneIndex === 0}
                              className="p-1 hover:bg-black/30 disabled:opacity-30"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              title="Move scene later in schedule"
                              onClick={() => shiftSceneWithinDay(day.id, sceneIndex, "down")}
                              disabled={sceneIndex === day.scenes.length - 1}
                              className="p-1 hover:bg-black/30 disabled:opacity-30 border-l border-black/20"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {/* Expand Details */}
                          <button
                            type="button"
                            onClick={() => toggleExpand(`${day.id}:${scene.sceneNumber}`)}
                            className="rounded p-1 hover:bg-black/20 text-muted-foreground"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Expandable Breakdown Drawer */}
                      {isExpanded && (
                        <div className="border-t border-black/10 bg-black/20 p-3 text-xs space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <span className="font-semibold text-muted-foreground block text-[10px] uppercase">
                                Estimated Screen Time
                              </span>
                              <p className="font-medium mt-0.5">
                                {scene.estimatedDuration ?? "Approx 2 min"}
                              </p>
                            </div>
                            <div>
                              <span className="font-semibold text-muted-foreground block text-[10px] uppercase">
                                Production Location
                              </span>
                              <p className="font-medium mt-0.5">{scene.location}</p>
                            </div>
                            <div>
                              <span className="font-semibold text-muted-foreground block text-[10px] uppercase">
                                Script Supervision
                              </span>
                              <p className="font-medium mt-0.5">
                                Scene status: {scene.status}
                              </p>
                            </div>
                          </div>

                          {scene.synopsis && (
                            <p className="text-xs italic bg-black/20 p-2 rounded">
                              &ldquo;{scene.synopsis}&rdquo;
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {!visibleScenes.length && (
                  <p className="text-xs text-muted-foreground italic text-center py-4">
                    No scenes match the &quot;{stripFilter}&quot; filter on this shoot day.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
