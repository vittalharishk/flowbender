"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  CalendarDays,
  List,
  Calendar,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Film,
  Clapperboard,
  MapPin,
  Clock,
  TrendingUp,
  Sparkles,
  Users,
  CheckCircle2,
  CalendarRange,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/app/search-input";
import { EmptyState } from "@/components/app/empty-state";
import { StatCard } from "@/components/app/stat-card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ShootDay, ShootDayStatus } from "@/lib/types";
import { shootDayStatusLabels, shootDayStatusDot } from "@/lib/schedule-store";
import { ShootDayStrip } from "./shoot-day-strip";
import { ScheduleCalendar } from "./schedule-calendar";
import { SceneStripboard } from "./scene-stripboard";
import { AddShootDayDialog } from "./add-shoot-day-dialog";
import { DigitalClapperboardModal } from "@/components/production/digital-clapperboard-modal";
import { useProjects } from "@/lib/project-store";
import { GanttChartView } from "./gantt-chart-view";
import { ScheduleDashboardFooter } from "./schedule-dashboard-footer";

interface Props {
  shootDays: ShootDay[];
  basePath: string;
  projectScope?: boolean;
  projectId?: string;
  projectTitle?: string;
  onAdded?: () => void;
}

export function ScheduleListView({ shootDays, basePath, projectScope, projectId, projectTitle, onAdded }: Props) {
  const TODAY = new Date().toLocaleDateString("en-CA");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"gantt" | "list" | "calendar" | "stripboard">("gantt");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>(projectId ?? "all");
  const [showAdd, setShowAdd] = useState(false);
  const [clapperOpen, setClapperOpen] = useState(false);

  // Determine initial calendar year and month based on active shoot dates
  const initialYear = useMemo(() => {
    if (shootDays.length > 0) {
      const years = shootDays.map((d) => parseInt(d.date.slice(0, 4), 10)).filter((y) => !isNaN(y));
      if (years.length > 0) {
        return years[0];
      }
    }
    return new Date().getFullYear();
  }, [shootDays]);

  const initialMonth = useMemo(() => {
    if (shootDays.length > 0) {
      const firstDate = shootDays[0]?.date;
      if (firstDate) {
        const m = parseInt(firstDate.slice(5, 7), 10) - 1;
        if (!isNaN(m) && m >= 0 && m <= 11) return m;
      }
    }
    return new Date().getMonth();
  }, [shootDays]);

  const [calMonth, setCalMonth] = useState(initialMonth);
  const [calYear, setCalYear] = useState(initialYear);

  const projects = useProjects();
  const visibleProjects = useMemo(
    () => projects.filter((project) => shootDays.some((day) => day.projectId === project.id) || project.id === projectId),
    [projects, shootDays, projectId]
  );

  const projectScopedDays = useMemo(
    () => (projectFilter === "all" ? shootDays : shootDays.filter((day) => day.projectId === projectFilter)),
    [shootDays, projectFilter]
  );

  const filtered = useMemo(() => {
    let results = projectScopedDays;
    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(
        (d) =>
          d.location.toLowerCase().includes(q) ||
          d.projectTitle.toLowerCase().includes(q) ||
          d.scenes.some((s) => s.sceneNumber.toLowerCase().includes(q) || s.heading.toLowerCase().includes(q)) ||
          d.castRequired.some((c) => c.toLowerCase().includes(q))
      );
    }
    if (statusFilter !== "all") results = results.filter((d) => d.status === statusFilter);
    return [...results].sort((a, b) => a.date.localeCompare(b.date));
  }, [projectScopedDays, search, statusFilter]);

  const stats = useMemo(() => {
    const counts: Record<ShootDayStatus, number> = {
      planned: 0,
      confirmed: 0,
      "in-progress": 0,
      completed: 0,
      cancelled: 0,
    };
    projectScopedDays.forEach((d) => counts[d.status]++);
    const totalPages = projectScopedDays.reduce((s, d) => s + d.totalPages, 0);
    const withConflicts = projectScopedDays.filter((d) => d.conflicts.length > 0).length;
    return { counts, total: projectScopedDays.length, totalPages, withConflicts };
  }, [projectScopedDays]);

  const completedPages = useMemo(() => {
    return projectScopedDays
      .filter((d) => d.status === "completed")
      .reduce((s, d) => s + d.totalPages, 0);
  }, [projectScopedDays]);

  const pageProgressPercent =
    stats.totalPages > 0 ? Math.min(100, Math.round((completedPages / stats.totalPages) * 100)) : 0;

  const upcoming = filtered.filter((d) => d.date >= TODAY && d.status !== "completed" && d.status !== "cancelled");
  const past = filtered.filter((d) => d.date < TODAY || d.status === "completed" || d.status === "cancelled");

  // Highlight active or top upcoming shoot day
  const featuredDay = useMemo(() => {
    return (
      projectScopedDays.find((d) => d.status === "in-progress") ||
      projectScopedDays.find((d) => d.status === "confirmed") ||
      upcoming[0] ||
      projectScopedDays[0]
    );
  }, [projectScopedDays, upcoming]);

  const targetReleaseStr = useMemo(() => {
    if (projectFilter !== "all") {
      const p = projects.find(p => p.id === projectFilter);
      if (p?.releaseDate) {
        return new Date(p.releaseDate).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' });
      }
      return "Not Set";
    }
    return "Multiple";
  }, [projectFilter, projects]);

  function prevMonth() {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(calYear - 1);
    } else setCalMonth(calMonth - 1);
  }
  function nextMonth() {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(calYear + 1);
    } else setCalMonth(calMonth + 1);
  }

  return (
    <div className="space-y-6">
      {/* Featured Active Unit on Set Card */}
      {featuredDay && (
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-card via-card to-amber-950/15 p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div className="space-y-2 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  {featuredDay.status === "in-progress" ? "UNIT ON SET NOW" : "SCHEDULED HIGHLIGHT"}
                </span>
                <span className="text-sm font-bold text-foreground">
                  {featuredDay.projectTitle} · Shoot Day {featuredDay.shootDayNumber} of {featuredDay.totalShootDays}
                </span>
                <Badge variant="outline" className="text-xs font-bold capitalize border-amber-500/40 text-amber-500">
                  {featuredDay.status.replace("-", " ")}
                </Badge>
              </div>

              <div className="text-base font-bold text-foreground flex items-center gap-2 truncate">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <span>{featuredDay.location}</span>
                <span className="text-xs text-muted-foreground font-normal">
                  ({new Date(`${featuredDay.date}T12:00:00`).toLocaleDateString("en-IN", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })})
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-primary" /> Call: {featuredDay.callTime} — Wrap: {featuredDay.wrapTime}
                </span>
                <span className="flex items-center gap-1">
                  <Film className="w-3.5 h-3.5 text-primary" /> {featuredDay.scenes.length} Scenes ({featuredDay.totalPages} pgs)
                </span>
                {featuredDay.castRequired.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-purple-400" /> Cast:{" "}
                    <strong className="text-foreground font-medium">{featuredDay.castRequired.slice(0, 3).join(", ")}</strong>
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs h-9 border-amber-500/40 text-amber-500 hover:bg-amber-500/10"
                onClick={() => setClapperOpen(true)}
              >
                <Clapperboard className="w-3.5 h-3.5" />
                Digital Slate
              </Button>
              <Button size="sm" asChild className="gap-1 text-xs h-9 bg-primary font-semibold shadow-sm">
                <Link href={`${basePath}/${featuredDay.id}`}>
                  View Shoot Day →
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Status Filters */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {(Object.entries(shootDayStatusLabels) as [ShootDayStatus, string][]).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(statusFilter === key ? "all" : key)}
              aria-pressed={statusFilter === key}
              aria-label={`Filter by ${label}: ${stats.counts[key]} shoot days`}
              className={`rounded-lg border p-3.5 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                statusFilter === key
                  ? "border-amber-500/60 bg-amber-500/10"
                  : "bg-card hover:border-muted-foreground/40"
              }`}
            >
              <div className="mb-1 flex items-center justify-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${shootDayStatusDot[key]}`} aria-hidden="true" />
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
              </div>
              <p className="text-2xl font-bold tabular-nums text-foreground">{stats.counts[key]}</p>
            </button>
          ))}
          {stats.withConflicts > 0 && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3.5 text-center">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">Conflicts</p>
              <p className="text-2xl font-bold tabular-nums text-red-600 dark:text-red-400">{stats.withConflicts}</p>
            </div>
          )}
        </div>

        {/* Screenplay Execution Progress Bar */}
        <div className="p-3.5 rounded-xl border bg-card/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="font-bold text-foreground">Screenplay Page Execution:</span>
            <span className="text-muted-foreground">
              {completedPages.toFixed(1)} of {stats.totalPages.toFixed(1)} Total Pages Wrapped ({pageProgressPercent}%)
            </span>
          </div>
          <div className="w-full sm:w-72">
            <Progress value={pageProgressPercent} className="h-2" />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {!projectScope && (
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger aria-label="Select project" className="w-full sm:w-[240px] bg-muted/40 font-medium">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects ({shootDays.length} Days)</SelectItem>
              {visibleProjects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="relative flex-1">
          <SearchInput
            label="Search shoot days"
            placeholder="Search locations, scenes, cast..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 bg-muted/40"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="flex items-center overflow-hidden rounded-lg border bg-background" role="group" aria-label="Schedule view mode">
            <button
              type="button"
              onClick={() => setView("gantt")}
              aria-pressed={view === "gantt"}
              aria-label="Gantt view"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500 ${
                view === "gantt" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Gantt View</span>
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              aria-pressed={view === "list"}
              aria-label="List view"
              className={`flex items-center gap-1.5 border-l px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500 ${
                view === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">List</span>
            </button>
            <button
              type="button"
              onClick={() => setView("calendar")}
              aria-pressed={view === "calendar"}
              aria-label="Calendar view"
              className={`flex items-center gap-1.5 border-l px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500 ${
                view === "calendar" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Calendar className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Calendar</span>
            </button>
            <button
              type="button"
              onClick={() => setView("stripboard")}
              aria-pressed={view === "stripboard"}
              aria-label="Visual scene stripboard view"
              className={`flex items-center gap-1.5 border-l px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500 ${
                view === "stripboard"
                  ? "border-amber-500/30 bg-amber-500/15 text-amber-400"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Film className="h-4 w-4 text-amber-500" aria-hidden="true" />
              <span className="hidden sm:inline">Stripboard</span>
            </button>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setClapperOpen(true)}
            className="border-amber-500/40 text-amber-500 hover:bg-amber-500/10 gap-1.5 h-9"
          >
            <Clapperboard className="w-4 h-4" />
            Digital Slate
          </Button>

          <Button variant="primary"
            size="sm"
            className="font-bold gap-1.5 h-9"
            onClick={() => setShowAdd(true)}
          >
            <Plus className="w-4 h-4" /> Add Shoot Day
          </Button>
        </div>
      </div>

      {/* Content */}
      {view === "gantt" ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatCard
              label="Total Shoot Days"
              value={stats.total}
              icon={CalendarDays}
              hint={`${stats.counts.completed} completed${stats.total > 0 ? ` (${Math.round((stats.counts.completed / stats.total) * 100)}%)` : ""}`}
            />
            <StatCard
              label="In Progress"
              value={stats.counts["in-progress"]}
              icon={Video}
              hint={`${stats.counts.confirmed} confirmed`}
            />
            <StatCard
              label="Planned"
              value={stats.counts.planned}
              icon={Clapperboard}
              hint={`${stats.counts.cancelled} cancelled`}
            />
            <StatCard
              label="Page Execution"
              value={`${pageProgressPercent}%`}
              icon={Film}
              hint={`${completedPages.toFixed(1)} of ${stats.totalPages.toFixed(1)} pages`}
            />
            <StatCard
              label="Target Release"
              value={targetReleaseStr}
              icon={CheckCircle2}
              hint={targetReleaseStr === "Not Set" ? "Update project" : targetReleaseStr === "Multiple" ? "Select a project" : "Scheduled"}
            />
          </div>
          <GanttChartView shootDays={filtered} />
          <ScheduleDashboardFooter />
        </div>
      ) : view === "stripboard" ? (
        <SceneStripboard shootDays={filtered} basePath={basePath} projectId={projectId} />
      ) : view === "list" ? (
        <>
          {filtered.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No shoot days found"
              description={
                search || statusFilter !== "all"
                  ? "Try adjusting your search or filters."
                  : "Add your first shoot day to begin scheduling."
              }
              className="rounded-lg border bg-card/50"
            />
          ) : (
            <div className="space-y-6">
              {upcoming.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <CalendarRange className="w-3.5 h-3.5 text-amber-500" />
                    Upcoming & In-Progress Calls ({upcoming.length})
                  </h3>
                  <div className="space-y-2">
                    {upcoming.map((d) => (
                      <ShootDayStrip key={d.id} day={d} basePath={basePath} isToday={d.date === TODAY} />
                    ))}
                  </div>
                </div>
              )}
              {past.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Completed Shoot Days ({past.length})
                  </h3>
                  <div className="space-y-2">
                    {past.map((d) => (
                      <ShootDayStrip key={d.id} day={d} basePath={basePath} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-4">
            <Button variant="ghost" size="icon" onClick={prevMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-bold w-48 text-center text-foreground">
              {new Date(calYear, calMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </span>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <ScheduleCalendar shootDays={filtered} month={calMonth} year={calYear} basePath={basePath} today={TODAY} />
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center pt-2">
        Showing {filtered.length} of {shootDays.length} shoot day{shootDays.length !== 1 ? "s" : ""}
        {" "}&middot; {stats.totalPages.toFixed(1)} total scheduled screen pages
      </p>

      {/* Add Shoot Day Dialog */}
      <AddShootDayDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        projectId={projectScope ? projectId : projectFilter !== "all" ? projectFilter : undefined}
        projectTitle={projectScope ? projectTitle : projects.find((project) => project.id === projectFilter)?.title}
        onCreated={() => {
          setShowAdd(false);
          onAdded?.();
        }}
      />

      {/* Digital Clapperboard Modal */}
      <DigitalClapperboardModal
        open={clapperOpen}
        onOpenChange={setClapperOpen}
        defaultProjectId={projectScope ? projectId : featuredDay?.projectId || "p1"}
        defaultProjectTitle={projectScope ? projectTitle : featuredDay?.projectTitle || "Pushpa 2: The Rule"}
      />
    </div>
  );
}
