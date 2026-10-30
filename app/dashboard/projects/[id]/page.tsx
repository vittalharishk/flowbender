"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Film,
  CalendarDays,
  IndianRupee,
  Clapperboard,
  Layers,
  Clock,
  MapPin,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  Info,
  ArrowRight,
  FileText,
  UserPlus,
  Eye,
} from "lucide-react";
import { cn, formatINR } from "@/lib/utils";
import { differenceInDays, differenceInMonths, differenceInYears } from "date-fns";
import { useAppDataSlice } from "@/lib/app-data-store";
import { useProject } from "@/lib/project-store";
import { productionStatusLabels } from "@/lib/mock-data";
import { useScenesByProject } from "@/lib/scene-store";
import { useCrewByProject } from "@/lib/crew-store";
import { useCastByProject } from "@/lib/cast-store";
import { getProjectOverviewData } from "@/lib/project-mock-data";
import type { ActivityItem, ProductionAlert } from "@/lib/types";
import { QuickActionGrid } from "@/components/app/quick-action-grid";

function fmt(value: number) {
  return formatINR(value);
}

function fmtShort(value: number) {
  return formatINR(value);
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

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

export default function ProjectOverviewPage() {
  const params = useParams();
  const project = useProject(params.id as string);
  const liveScheduleEntries = useAppDataSlice("scheduleEntries");
  const scenes = useScenesByProject(params.id as string);
  const crew = useCrewByProject(params.id as string);
  const cast = useCastByProject(params.id as string);
  if (!project) return null;

  const today = new Date().toLocaleDateString("en-CA");
  const personnel = [
    { name: project.director, role: "Director", initials: project.director.split(/\s+/).map((word) => word[0]).join("").slice(0, 2) },
    { name: project.producer, role: "Producer", initials: project.producer.split(/\s+/).map((word) => word[0]).join("").slice(0, 2) },
    ...crew.filter((member) => member.name !== project.director && member.name !== project.producer),
  ].filter((person) => person.name.trim()).slice(0, 8);
  const alerts: ProductionAlert[] = [];
  if (project.budget > 0 && project.spent / project.budget >= 0.85) {
    alerts.push({ id: "budget", severity: project.spent >= project.budget ? "critical" : "warning", title: "Budget utilization", description: `${fmt(project.spent)} spent against ${fmt(project.budget)} planned.`, project: project.title, timestamp: new Date().toISOString(), actionLabel: "Review budget" });
  }
  const pendingContracts = [...cast, ...crew].filter((person) => person.contractStatus !== "signed").length;
  if (pendingContracts > 0) {
    alerts.push({ id: "contracts", severity: "warning", title: "Unsigned contracts", description: `${pendingContracts} cast or crew contracts are not signed.`, project: project.title, timestamp: new Date().toISOString(), actionLabel: "Review contracts" });
  }
  const overview = {
    ...getProjectOverviewData(project.id),
    scenes: { total: scenes.length, completed: scenes.filter((scene) => scene.status === "shot").length, inProgress: scenes.filter((scene) => scene.status === "partially-shot").length },
    keyPeople: personnel,
    alerts,
  };
  const budgetPct = project.budget > 0 ? Math.round((project.spent / project.budget) * 100) : 0;
  const remaining = project.budget - project.spent;
  const scenePct = overview.scenes.total > 0 ? Math.round((overview.scenes.completed / overview.scenes.total) * 100) : 0;

  const upcoming = liveScheduleEntries
    .filter((s) => s.projectId === project.id && s.date >= today && s.status !== "completed" && s.status !== "postponed")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Production Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <SummaryCard label="Status" value={productionStatusLabels[project.status] ?? project.status} accent />
        <SummaryCard label="Shoot Planned" value={`${project.totalShootDays} days`} />
        <SummaryCard label="Shoot Done" value={`${project.completedShootDays} days`} />
        <SummaryCard label="Scenes Total" value={String(overview.scenes.total)} />
        <SummaryCard label="Scenes Done" value={String(overview.scenes.completed)} />
        <SummaryCard label="Budget" value={fmtShort(project.budget)} />
        <SummaryCard label="Spent" value={fmtShort(project.spent)} warn={budgetPct >= 85} />
        <SummaryCard label="Remaining" value={fmtShort(remaining)} good={remaining > 0} warn={remaining <= 0} />
      </div>

      {/* Production Progress */}
      <div className="rounded-xl border bg-card p-5 space-y-5">
        <h3 className="font-semibold">Production Progress</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Shoot progress */}
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5" /> Shoot Days
              </span>
              <span className="font-semibold">{project.shootProgress}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-700"
                style={{ width: `${project.shootProgress}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
              <span>{project.completedShootDays} completed</span>
              <span>{project.totalShootDays - project.completedShootDays} remaining</span>
            </div>
          </div>

          {/* Scene progress */}
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> Scenes
              </span>
              <span className="font-semibold">{scenePct}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-700"
                style={{ width: `${scenePct}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
              <span>{overview.scenes.completed} completed{overview.scenes.inProgress > 0 ? `, ${overview.scenes.inProgress} in progress` : ""}</span>
              <span>{overview.scenes.total - overview.scenes.completed} remaining</span>
            </div>
          </div>
        </div>

        {/* Budget usage */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5" /> Budget Utilization
            </span>
            <span className={cn("font-semibold", budgetPct >= 90 ? "text-red-400" : budgetPct >= 70 ? "text-amber-400" : "text-emerald-400")}>
              {budgetPct}%
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                budgetPct >= 90
                  ? "bg-gradient-to-r from-red-500 to-red-600"
                  : budgetPct >= 70
                  ? "bg-gradient-to-r from-amber-500 to-orange-500"
                  : "bg-gradient-to-r from-emerald-500 to-teal-500"
              )}
              style={{ width: `${Math.min(budgetPct, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
            <span>{fmt(project.spent)} spent</span>
            <span>{fmt(remaining)} remaining</span>
          </div>
        </div>
      </div>

      {/* Middle row: Upcoming + Key People */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Shoot */}
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Upcoming Shoots</h3>
            <span className="text-xs text-muted-foreground">{upcoming.length} scheduled</span>
          </div>

          <QuickActionGrid projectId={project.id} />
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No upcoming shoots scheduled. <Link href={`/dashboard/projects/${project.id}/schedule`} className="text-primary underline">Plan a shoot</Link></p>
          ) : (
            <div className="space-y-3">
              {upcoming.map((entry, i) => {
                const isToday = entry.date === today;
                return (
                  <Link href={`/dashboard/projects/${project.id}/schedule`}
                    key={entry.id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg transition-colors",
                      isToday ? "bg-amber-500/5 border border-amber-500/20" : "bg-muted/30"
                    )}
                  >
                    <div className={cn(
                      "w-11 h-11 rounded-lg flex flex-col items-center justify-center shrink-0 text-xs",
                      isToday ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white" : "bg-muted"
                    )}>
                      <span className="font-bold leading-none">{new Date(entry.date).getDate()}</span>
                      <span className="text-[9px] uppercase opacity-80">
                        {new Date(entry.date).toLocaleDateString("en", { month: "short" })}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {isToday && (
                          <span className="flex items-center gap-1 text-[10px] font-medium text-amber-400 uppercase tracking-wide">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Today
                          </span>
                        )}
                        {entry.shootDayNumber > 0 && (
                          <span className="text-xs text-muted-foreground">Day {entry.shootDayNumber}</span>
                        )}
                      </div>
                      <p className="text-sm font-medium mt-0.5 flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span className="truncate">{entry.location}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                        <Clock className="w-3 h-3 shrink-0" />
                        Call: {entry.callTime} &middot; {entry.scenes.join(", ")}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Key People */}
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <h3 className="font-semibold">Key People</h3>
          {overview.keyPeople.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No key personnel assigned. <Link href={`/dashboard/projects/${project.id}/crew`} className="text-primary underline">Add crew</Link></p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {overview.keyPeople.map((person) => (
                <div key={`${person.name}-${person.role}`} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-amber-400">{person.initials}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{person.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{person.role}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Budget Snapshot */}
      <div className="rounded-xl border bg-card p-5">
        <h3 className="font-semibold mb-4">Budget Snapshot</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <BudgetBlock label="Total Budget" value={fmt(project.budget)} />
          <BudgetBlock label="Spent to Date" value={fmt(project.spent)} color="text-amber-400" />
          <BudgetBlock label="Remaining" value={fmt(remaining)} color={remaining < 0 ? "text-red-400" : "text-emerald-400"} />
          <BudgetBlock label="Utilization" value={`${budgetPct}%`} color={budgetPct >= 90 ? "text-red-400" : budgetPct >= 70 ? "text-amber-400" : "text-emerald-400"} />
        </div>
      </div>

      {/* Bottom row: Activity + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <h3 className="font-semibold">Demo Activity Examples</h3>
          <p className="text-xs text-muted-foreground">Illustrative seeded events, not a live audit log.</p>
          {overview.activity.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No recent activity.</p>
          ) : (
            <div className="space-y-1 divide-y">
              {overview.activity.map((item) => (
                <ActivityRow key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Alerts */}
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Production Alerts</h3>
            {overview.alerts.filter((a) => a.severity === "critical").length > 0 && (
              <span className="text-xs text-red-400 font-medium">
                {overview.alerts.filter((a) => a.severity === "critical").length} critical
              </span>
            )}
          </div>
          {overview.alerts.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No active alerts. All clear.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {overview.alerts.map((alert) => (
                <AlertRow key={alert.id} alert={alert} projectId={project.id} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---- Sub-components ---- */

function SummaryCard({ label, value, accent, good, warn }: { label: string; value: string; accent?: boolean; good?: boolean; warn?: boolean }) {
  return (
    <div className={cn(
      "rounded-lg border p-3 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
      accent ? "bg-gradient-to-br from-amber-500/10 to-orange-600/5 border-amber-500/30 hover:border-amber-500/50" : "bg-card/80 border-border/70 hover:border-primary/30"
    )}>
      <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
      <p className={cn(
        "text-lg font-bold mt-0.5 tracking-tight",
        accent && "text-amber-500 dark:text-amber-400",
        good && "text-emerald-600 dark:text-emerald-400",
        warn && "text-red-500 dark:text-red-400"
      )}>
        {value}
      </p>
    </div>
  );
}

function BudgetBlock({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="text-center p-4 rounded-lg bg-muted/40 border border-border/40 transition-colors hover:bg-muted/60">
      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-medium">{label}</p>
      <p className={cn("text-xl font-bold tracking-tight", color)}>{value}</p>
    </div>
  );
}

function statusLabel(s: string): string {
  const map: Record<string, string> = {
    development: "Development",
    "pre-production": "Pre-Prod",
    production: "Shooting",
    "post-production": "Post-Prod",
    completed: "Completed",
    "on-hold": "On Hold",
  };
  return map[s] ?? s;
}

const activityIcons: Record<ActivityItem["type"], typeof FileText> = {
  "call-sheet": FileText,
  "scene-completed": CheckCircle2,
  expense: IndianRupee,
  schedule: CalendarDays,
  cast: UserPlus,
  review: Eye,
};

const activityColors: Record<ActivityItem["type"], string> = {
  "call-sheet": "text-blue-400 bg-blue-500/10",
  "scene-completed": "text-emerald-400 bg-emerald-500/10",
  expense: "text-amber-400 bg-amber-500/10",
  schedule: "text-cyan-400 bg-cyan-500/10",
  cast: "text-rose-400 bg-rose-500/10",
  review: "text-violet-400 bg-violet-500/10",
};

function ActivityRow({ item }: { item: ActivityItem }) {
  const Icon = activityIcons[item.type];
  return (
    <div className="flex gap-3 py-2.5">
      <div className={cn("w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5", activityColors[item.type])}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium">{item.title}</p>
          <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">{timeAgo(item.timestamp)}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>
        <p className="text-[11px] text-muted-foreground/60 mt-0.5">{item.user}</p>
      </div>
    </div>
  );
}

const severityConfig: Record<ProductionAlert["severity"], { icon: typeof Info; border: string; bg: string; iconColor: string }> = {
  critical: { icon: AlertOctagon, border: "border-red-500/30", bg: "bg-red-500/5", iconColor: "text-red-400" },
  warning: { icon: AlertTriangle, border: "border-amber-500/30", bg: "bg-amber-500/5", iconColor: "text-amber-400" },
  info: { icon: Info, border: "border-blue-500/30", bg: "bg-blue-500/5", iconColor: "text-blue-400" },
};

function AlertRow({ alert, projectId }: { alert: ProductionAlert; projectId: string }) {
  const cfg = severityConfig[alert.severity];
  const Icon = cfg.icon;
  return (
    <div className={cn("rounded-lg border p-3", cfg.border, cfg.bg)}>
      <div className="flex gap-2.5">
        <Icon className={cn("w-4 h-4 shrink-0 mt-0.5", cfg.iconColor)} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{alert.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{alert.description}</p>
          {alert.actionLabel && (
            <Link href={alert.id === "budget" ? `/dashboard/projects/${projectId}/finance` : `/dashboard/projects/${projectId}/cast`} className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1 mt-2">
              {alert.actionLabel}
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
          {alert.id === "contracts" && (
            <Link href={`/dashboard/projects/${projectId}/crew`} className="ml-3 text-xs font-medium text-primary hover:underline">Review crew contracts</Link>
          )}
        </div>
      </div>
    </div>
  );
}
