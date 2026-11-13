"use client";

import { useMemo } from "react";
import Link from "next/link";
import { addDays, format } from "date-fns";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Film,
  IndianRupee,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { ScheduleEntry } from "@/lib/types";
import { useAuth } from "@/components/auth-provider";
import "@/lib/persistence-bootstrap";
import { useAppDataSlice } from "@/lib/app-data-store";
import { useProjects } from "@/lib/project-store";
import { useShootDays } from "@/lib/schedule-store";
import { useAccountsDashboard, useBudgetAlerts } from "@/lib/accounts-store";
import { useInsuranceDashboard } from "@/lib/insurance-store";
import { useCalendarEvents } from "@/lib/calendar-store";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { StatusBadge } from "@/components/app/status-badge";
import { EmptyState } from "@/components/app/empty-state";
import { ActiveProductions } from "@/components/dashboard/active-productions";
import { UpcomingShootDays } from "@/components/dashboard/upcoming-shoot-days";
import { DashboardAlerts } from "@/components/dashboard/dashboard-alerts";
import { BudgetByProjectChart } from "@/components/dashboard/budget-by-project-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatINR } from "@/lib/utils";

const quickLinks = [
  { href: "/dashboard/projects", label: "Projects", description: "Review active productions", icon: Film },
  { href: "/dashboard/schedule", label: "Schedule", description: "Check upcoming shoot days", icon: CalendarDays },
  { href: "/dashboard/production", label: "Production", description: "Track tasks and daily progress", icon: ClipboardList },
  { href: "/dashboard/accounts", label: "Accounts", description: "Budgets, expenses and approvals", icon: IndianRupee },
];

export default function DashboardPage() {
  const projects = useProjects();
  const shootDays = useShootDays();
  const callSheets = useAppDataSlice("callSheets");
  const accounts = useAccountsDashboard();
  const budgetAlerts = useBudgetAlerts();
  const insurance = useInsuranceDashboard();
  const calendarEvents = useCalendarEvents();
  const { user } = useAuth();

  const today = format(new Date(), "yyyy-MM-dd");
  const endOfWindow = format(addDays(new Date(), 30), "yyyy-MM-dd");

  const activeProjects = projects.filter((p) => !["completed", "on-hold"].includes(p.status));
  const completedProjects = projects.filter((p) => p.status === "completed");

  const upcomingDays = useMemo(
    () =>
      shootDays
        .filter((d) => d.date >= today && d.date <= endOfWindow && !["completed", "cancelled"].includes(d.status))
        .sort((a, b) => a.date.localeCompare(b.date) || a.callTime.localeCompare(b.callTime)),
    [shootDays, today, endOfWindow]
  );

  const liveScheduleEntries: ScheduleEntry[] = useMemo(
    () =>
      upcomingDays.map((day) => {
        const sheet = callSheets
          .filter((item) => item.shootDayId === day.id)
          .sort((a, b) => (b.version ?? 1) - (a.version ?? 1))[0];
        return {
          id: day.id,
          projectId: day.projectId,
          projectTitle: projects.find((p) => p.id === day.projectId)?.title ?? day.projectTitle,
          date: day.date,
          callTime: day.callTime,
          location: day.location,
          scenes: day.scenes.map((s) => s.sceneNumber),
          shootDayNumber: day.shootDayNumber,
          totalShootDays: day.totalShootDays,
          callSheetStatus: sheet
            ? ["Published", "Revised", "Completed"].includes(sheet.status)
              ? "published"
              : "draft"
            : "pending",
          status: day.status === "in-progress" ? "shooting" : "scheduled",
        };
      }),
    [upcomingDays, callSheets, projects]
  );

  const upcomingMilestones = useMemo(
    () =>
      calendarEvents
        .filter((e) => e.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 5),
    [calendarEvents, today]
  );

  const { summary } = accounts;
  const utilization = summary.totalApprovedBudget > 0 ? Math.round((summary.totalPaid / summary.totalApprovedBudget) * 100) : 0;
  const totalPlannedDays = projects.reduce((s, p) => s + (p.totalShootDays || 0), 0);
  const totalCompletedDays = projects.reduce((s, p) => s + (p.completedShootDays || 0), 0);
  const shootProgress = totalPlannedDays > 0 ? Math.round((totalCompletedDays / totalPlannedDays) * 100) : 0;

  const statusBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    projects.forEach((p) => counts.set(p.status, (counts.get(p.status) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [projects]);

  return (
    <div className="space-y-6">
      <PageHeader
        as="h1"
        title={`Welcome back, ${user?.full_name.split(" ")[0] ?? "producer"}`}
        description="Your productions at a glance. Stay focused on what moves the next shoot forward."
        actions={
          <Button asChild variant="primary" className="gap-1.5">
            <Link href="/dashboard/projects">
              View projects
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active Projects" value={activeProjects.length} icon={Film} hint={`${projects.length} total · ${completedProjects.length} completed`} />
        <StatCard label="Approved Budget" value={formatINR(summary.totalApprovedBudget)} icon={IndianRupee} hint="Across all projects" />
        <StatCard label="Paid to Date" value={formatINR(summary.totalPaid)} icon={Wallet} hint={`${utilization}% of approved budget`} />
        <StatCard label="Upcoming Shoot Days" value={upcomingDays.length} icon={CalendarDays} hint="Next 30 days" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Committed" value={formatINR(summary.totalCommitted)} compact hint="Contracted obligations" />
        <StatCard label="Outstanding" value={formatINR(summary.totalOutstanding)} compact hint="Committed minus paid" />
        <StatCard label="PO Commitment" value={formatINR(summary.poCommitment)} compact hint="Open purchase orders" />
        <StatCard label="Available Budget" value={formatINR(summary.availableBudget)} compact hint="Approved minus committed" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="text-lg font-semibold leading-none tracking-tight">Production progress</div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Shoot days completed</span>
                <span className="font-semibold tabular-nums">
                  {totalCompletedDays} / {totalPlannedDays} ({shootProgress}%)
                </span>
              </div>
              <Progress value={shootProgress} className="mt-2 h-2" aria-label={`Shoot days completed: ${shootProgress} percent`} />
            </div>
            <div className="flex flex-wrap gap-2">
              {statusBreakdown.map(([status, count]) => (
                <span key={status} className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs">
                  <StatusBadge status={status} className="border-0 bg-transparent px-0 py-0" />
                  <span className="font-semibold tabular-nums">{count}</span>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <DashboardAlerts budgetAlerts={budgetAlerts} expiringPolicies={insurance.expiringWithin30Days} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <BudgetByProjectChart data={accounts.byProject} />
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-lg font-semibold leading-none tracking-tight">
              <TrendingUp className="h-4 w-4 text-amber-500" aria-hidden="true" />
              Upcoming milestones
            </div>
          </CardHeader>
          <CardContent>
            {upcomingMilestones.length === 0 ? (
              <EmptyState title="No upcoming milestones" description="Scheduled calendar events will appear here." className="py-6" />
            ) : (
              <ul className="space-y-3">
                {upcomingMilestones.map((event) => (
                  <li key={event.id} className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-xs font-semibold text-amber-600 dark:text-amber-400">
                      {format(new Date(event.date), "dd")}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{event.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {format(new Date(event.date), "MMM d, yyyy")}
                        {event.projectTitle ? ` · ${event.projectTitle}` : ""}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {accounts.pendingApprovals.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-lg font-semibold leading-none tracking-tight">
              <CheckCircle2 className="h-4 w-4 text-amber-500" aria-hidden="true" />
              Pending approvals
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                {accounts.pendingApprovals.length}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {accounts.pendingApprovals.slice(0, 5).map((approval) => (
                <li key={approval.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate font-medium capitalize">{approval.type.replace(/[-_]/g, " ")}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {approval.requestor} · {approval.level} · {approval.submittedDate}
                    </span>
                  </span>
                  <span className="font-semibold tabular-nums">{formatINR(approval.amount)}</span>
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link href="/dashboard/accounts">Open Accounts</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {quickLinks.map(({ href, label, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-amber-500/50 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{label}</span>
              <span className="block truncate text-xs text-muted-foreground">{description}</span>
            </span>
          </Link>
        ))}
      </div>

      <ActiveProductions projects={activeProjects.slice(0, 3)} />

      {liveScheduleEntries.length > 0 && (
        <div className="overflow-x-auto">
          <UpcomingShootDays entries={liveScheduleEntries} />
        </div>
      )}
    </div>
  );
}
