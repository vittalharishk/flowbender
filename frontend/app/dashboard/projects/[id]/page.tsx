"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Film,
  IndianRupee,
  Info,
  Layers,
  MapPin,
  UserPlus,
  Users,
} from "lucide-react";
import { differenceInDays, differenceInMonths, differenceInYears, format } from "date-fns";
import { cn, formatINR } from "@/lib/utils";
import { useAppDataSlice } from "@/lib/app-data-store";
import { useProject } from "@/lib/project-store";
import { useAccountsDashboard } from "@/lib/accounts-store";
import { useCalendarEvents } from "@/lib/calendar-store";
import { useScenesByProject } from "@/lib/scene-store";
import { useCrewByProject } from "@/lib/crew-store";
import { useCastByProject } from "@/lib/cast-store";
import { getProjectOverviewData } from "@/lib/project-mock-data";
import type { ActivityItem, ProductionAlert } from "@/lib/types";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { StatusBadge } from "@/components/app/status-badge";
import { EmptyState } from "@/components/app/empty-state";
import { QuickActionGrid } from "@/components/app/quick-action-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

function timeAgo(ts: string): string {
  const now = new Date();
  const then = new Date(ts);
  const days = Math.max(0, differenceInDays(now, then));
  if (days === 0) return "Today";
  if (days < 30) return `${days}d ago`;
  const months = Math.max(1, differenceInMonths(now, then));
  if (months < 12) return `${months}mo ago`;
  return `${Math.max(1, differenceInYears(now, then))}y ago`;
}

function safeDate(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export default function ProjectOverviewPage() {
  const params = useParams();
  const projectId = params.id as string;
  const project = useProject(projectId);
  const liveScheduleEntries = useAppDataSlice("scheduleEntries");
  const scenes = useScenesByProject(projectId);
  const crew = useCrewByProject(projectId);
  const cast = useCastByProject(projectId);
  const accounts = useAccountsDashboard(projectId);
  const calendarEvents = useCalendarEvents(projectId);

  const today = new Date().toLocaleDateString("en-CA");

  const upcoming = useMemo(
    () =>
      liveScheduleEntries
        .filter((s) => s.projectId === projectId && s.date >= today && s.status !== "completed" && s.status !== "postponed")
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 4),
    [liveScheduleEntries, projectId, today]
  );

  const milestones = useMemo(
    () => calendarEvents.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5),
    [calendarEvents, today]
  );

  if (!project) return null;

  // Authoritative financials from the Accounts selector — never recomputed here.
  const financials = accounts.byProject.find((p) => p.projectId === projectId);
  const approvedBudget = financials?.approvedBudget ?? 0;
  const paid = financials?.paid ?? 0;
  const committed = financials?.committed ?? 0;
  const outstanding = financials?.outstanding ?? 0;
  const available = financials?.available ?? 0;
  const utilization = Math.round(financials?.utilization ?? 0);

  const sceneStats = {
    total: scenes.length,
    completed: scenes.filter((s) => s.status === "shot").length,
    inProgress: scenes.filter((s) => s.status === "partially-shot").length,
  };
  const scenePct = sceneStats.total > 0 ? Math.round((sceneStats.completed / sceneStats.total) * 100) : 0;

  const personnel = [
    { name: project.director, role: "Director", initials: project.director.split(/\s+/).map((w) => w[0]).join("").slice(0, 2) },
    { name: project.producer, role: "Producer", initials: project.producer.split(/\s+/).map((w) => w[0]).join("").slice(0, 2) },
    ...crew.filter((m) => m.name !== project.director && m.name !== project.producer),
  ]
    .filter((p) => p.name.trim())
    .slice(0, 8);

  const alerts: ProductionAlert[] = [];
  if (approvedBudget > 0 && utilization >= 85) {
    alerts.push({
      id: "budget",
      severity: utilization >= 100 ? "critical" : "warning",
      title: "Budget utilization",
      description: `${formatINR(paid)} paid against ${formatINR(approvedBudget)} approved (${utilization}%).`,
      project: project.title,
      timestamp: new Date().toISOString(),
      actionLabel: "Review budget",
    });
  }
  const pendingContracts = [...cast, ...crew].filter((p) => p.contractStatus !== "signed").length;
  if (pendingContracts > 0) {
    alerts.push({
      id: "contracts",
      severity: "warning",
      title: "Unsigned contracts",
      description: `${pendingContracts} cast or crew contracts are not signed.`,
      project: project.title,
      timestamp: new Date().toISOString(),
      actionLabel: "Review contracts",
    });
  }

  const activity = getProjectOverviewData(projectId).activity;

  const startDate = safeDate(project.startDate);
  const endDate = safeDate(project.endDate);
  const releaseDate = safeDate(project.releaseDate);
  const nextShoot = safeDate(project.nextShootDate);
  const keyDates = [
    { label: "Shoot start", value: startDate },
    { label: "Shoot end", value: endDate },
    { label: "Next shoot", value: nextShoot },
    { label: "Release", value: releaseDate },
  ].filter((d) => d.value);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project overview"
        description={project.logline || `${project.genre} · ${project.language}`}
        badge={<StatusBadge status={project.status} />}
      />

      {/* Headline numbers */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Shoot days"
          value={`${project.completedShootDays} / ${project.totalShootDays}`}
          icon={Film}
          hint={`${project.shootProgress}% complete`}
        />
        <StatCard
          label="Scenes"
          value={`${sceneStats.completed} / ${sceneStats.total}`}
          icon={Layers}
          hint={sceneStats.inProgress > 0 ? `${sceneStats.inProgress} in progress` : `${scenePct}% complete`}
        />
        <StatCard label="Approved budget" value={formatINR(approvedBudget)} icon={IndianRupee} hint="From Accounts" />
        <StatCard
          label="Paid to date"
          value={formatINR(paid)}
          icon={CheckCircle2}
          hint={approvedBudget > 0 ? `${utilization}% utilized` : "No approved budget"}
        />
      </div>

      {/* Progress */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Production progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Film className="h-3.5 w-3.5" aria-hidden="true" /> Shoot days
                </span>
                <span className="font-semibold tabular-nums">{project.shootProgress}%</span>
              </div>
              <Progress value={project.shootProgress} className="h-2" aria-label={`Shoot days ${project.shootProgress} percent complete`} />
              <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
                <span>{project.completedShootDays} completed</span>
                <span>{Math.max(0, project.totalShootDays - project.completedShootDays)} remaining</span>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Layers className="h-3.5 w-3.5" aria-hidden="true" /> Scenes
                </span>
                <span className="font-semibold tabular-nums">{scenePct}%</span>
              </div>
              <Progress value={scenePct} className="h-2" aria-label={`Scenes ${scenePct} percent complete`} />
              <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
                <span>
                  {sceneStats.completed} completed
                  {sceneStats.inProgress > 0 ? `, ${sceneStats.inProgress} in progress` : ""}
                </span>
                <span>{Math.max(0, sceneStats.total - sceneStats.completed)} remaining</span>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <IndianRupee className="h-3.5 w-3.5" aria-hidden="true" /> Budget utilization
              </span>
              <span className="font-semibold tabular-nums">{utilization}%</span>
            </div>
            <Progress value={Math.min(utilization, 100)} className="h-2" aria-label={`Budget ${utilization} percent utilized`} />
            <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
              <span>{formatINR(paid)} paid</span>
              <span>{formatINR(available)} available</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Budget summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatCard compact label="Approved" value={formatINR(approvedBudget)} />
            <StatCard compact label="Committed" value={formatINR(committed)} />
            <StatCard compact label="Paid" value={formatINR(paid)} />
            <StatCard compact label="Outstanding" value={formatINR(outstanding)} />
            <StatCard compact label="Available" value={formatINR(available)} />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Figures come from the Accounts module and reconcile with its dashboard.{" "}
            <Link href={`/dashboard/projects/${projectId}/accounts`} className="font-medium text-primary hover:underline">
              Open Accounts
            </Link>
          </p>
        </CardContent>
      </Card>

      {/* Dates + milestones */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarDays className="h-4 w-4 text-amber-500" aria-hidden="true" />
              Key dates
            </CardTitle>
          </CardHeader>
          <CardContent>
            {keyDates.length === 0 ? (
              <EmptyState title="No dates set" description="Add shoot and release dates to the project." className="py-6" />
            ) : (
              <dl className="grid grid-cols-2 gap-4">
                {keyDates.map((d) => (
                  <div key={d.label}>
                    <dt className="text-xs text-muted-foreground">{d.label}</dt>
                    <dd className="mt-0.5 text-sm font-medium">{format(d.value as Date, "d MMM yyyy")}</dd>
                  </div>
                ))}
              </dl>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarDays className="h-4 w-4 text-amber-500" aria-hidden="true" />
              Upcoming milestones
            </CardTitle>
          </CardHeader>
          <CardContent>
            {milestones.length === 0 ? (
              <EmptyState title="No upcoming milestones" description="Calendar events for this project appear here." className="py-6" />
            ) : (
              <ul className="space-y-3">
                {milestones.map((event) => (
                  <li key={event.id} className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-xs font-semibold text-amber-600 dark:text-amber-400">
                      {format(new Date(event.date), "dd")}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{event.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {format(new Date(event.date), "MMM d, yyyy")}
                        {event.location ? ` · ${event.location}` : ""}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming shoots + key people */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <span>Upcoming shoots</span>
              <span className="text-xs font-normal text-muted-foreground">{upcoming.length} scheduled</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <QuickActionGrid projectId={projectId} />
            {upcoming.length === 0 ? (
              <EmptyState
                title="No upcoming shoots"
                description="Plan a shoot day to see it here."
                className="py-6"
                action={
                  <Link href={`/dashboard/projects/${projectId}/schedule`} className="text-sm font-medium text-primary hover:underline">
                    Plan a shoot
                  </Link>
                }
              />
            ) : (
              <ul className="space-y-3">
                {upcoming.map((entry) => {
                  const isToday = entry.date === today;
                  return (
                    <li key={entry.id}>
                      <Link
                        href={`/dashboard/projects/${projectId}/schedule`}
                        className={cn(
                          "flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
                          isToday ? "border border-amber-500/30 bg-amber-500/5" : "bg-muted/30"
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg text-xs",
                            isToday ? "bg-amber-500 text-white" : "bg-muted"
                          )}
                        >
                          <span className="font-bold leading-none">{new Date(entry.date).getDate()}</span>
                          <span className="text-xs uppercase opacity-80">
                            {new Date(entry.date).toLocaleDateString("en", { month: "short" })}
                          </span>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            {isToday && (
                              <span className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                                Today
                              </span>
                            )}
                            {entry.shootDayNumber > 0 && (
                              <span className="text-xs text-muted-foreground">Day {entry.shootDayNumber}</span>
                            )}
                          </span>
                          <span className="mt-0.5 flex items-center gap-1.5 text-sm font-medium">
                            <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden="true" />
                            <span className="truncate">{entry.location}</span>
                          </span>
                          <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
                            Call: {entry.callTime} · {entry.scenes.join(", ")}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-4 w-4 text-amber-500" aria-hidden="true" />
              Key people
            </CardTitle>
          </CardHeader>
          <CardContent>
            {personnel.length === 0 ? (
              <EmptyState
                title="No key personnel assigned"
                description="Add crew to see them listed here."
                className="py-6"
                action={
                  <Link href={`/dashboard/projects/${projectId}/crew`} className="text-sm font-medium text-primary hover:underline">
                    Add crew
                  </Link>
                }
              />
            ) : (
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {personnel.map((person) => (
                  <li key={`${person.name}-${person.role}`} className="flex items-center gap-3 rounded-lg bg-muted/30 p-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/15">
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{person.initials}</span>
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{person.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{person.role}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity + alerts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Demo activity examples</CardTitle>
            <p className="text-xs text-muted-foreground">Illustrative seeded events, not a live audit log.</p>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <EmptyState title="No recent activity" className="py-6" />
            ) : (
              <ul className="divide-y">
                {activity.map((item) => (
                  <ActivityRow key={item.id} item={item} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <span>Production alerts</span>
              {alerts.filter((a) => a.severity === "critical").length > 0 && (
                <span className="text-xs font-medium text-red-600 dark:text-red-400">
                  {alerts.filter((a) => a.severity === "critical").length} critical
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" aria-hidden="true" />
                <p className="mt-2 text-sm text-muted-foreground">No active alerts. All clear.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {alerts.map((alert) => (
                  <AlertRow key={alert.id} alert={alert} projectId={projectId} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ---- Sub-components ---- */

const activityIcons: Record<ActivityItem["type"], typeof FileText> = {
  "call-sheet": FileText,
  "scene-completed": CheckCircle2,
  expense: IndianRupee,
  schedule: CalendarDays,
  cast: UserPlus,
  review: Eye,
};

function ActivityRow({ item }: { item: ActivityItem }) {
  const Icon = activityIcons[item.type];
  return (
    <li className="flex gap-3 py-2.5">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="text-sm font-medium">{item.title}</span>
          <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">{timeAgo(item.timestamp)}</span>
        </span>
        <span className="mt-0.5 line-clamp-1 block text-xs text-muted-foreground">{item.description}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground/70">{item.user}</span>
      </span>
    </li>
  );
}

const severityConfig: Record<ProductionAlert["severity"], { icon: typeof Info; className: string }> = {
  critical: { icon: AlertOctagon, className: "border-red-500/30 bg-red-500/5 text-red-600 dark:text-red-400" },
  warning: { icon: AlertTriangle, className: "border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400" },
  info: { icon: Info, className: "border-blue-500/30 bg-blue-500/5 text-blue-600 dark:text-blue-400" },
};

function AlertRow({ alert, projectId }: { alert: ProductionAlert; projectId: string }) {
  const cfg = severityConfig[alert.severity];
  const Icon = cfg.icon;
  return (
    <li className={cn("rounded-lg border p-3", cfg.className)}>
      <div className="flex gap-2.5">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{alert.title}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{alert.description}</p>
          <div className="mt-2 flex flex-wrap gap-3">
            {alert.actionLabel && (
              <Link
                href={alert.id === "budget" ? `/dashboard/projects/${projectId}/accounts` : `/dashboard/projects/${projectId}/cast`}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                {alert.actionLabel}
                <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </Link>
            )}
            {alert.id === "contracts" && (
              <Link href={`/dashboard/projects/${projectId}/crew`} className="text-xs font-medium text-primary hover:underline">
                Review crew contracts
              </Link>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
