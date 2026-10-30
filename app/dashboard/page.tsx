"use client";

import { Film, Wallet, CalendarDays, IndianRupee, ArrowUpRight, Sparkles } from "lucide-react";
import { format, addDays } from "date-fns";
import Link from "next/link";
import type { ScheduleEntry } from "@/lib/types";
import { useAuth } from "@/components/auth-provider";
import "@/lib/persistence-bootstrap";
import { useAppDataSlice } from "@/lib/app-data-store";
import { useProjects } from "@/lib/project-store";
import { useShootDays } from "@/lib/schedule-store";
import { StatCard } from "@/components/app/stat-card";
import { ActiveProductions } from "@/components/dashboard/active-productions";
import { UpcomingShootDays } from "@/components/dashboard/upcoming-shoot-days";
import { formatINR } from "@/lib/utils";

function formatCurrency(value: number) {
  return formatINR(value);
}

export default function DashboardPage() {
  const projects = useProjects();
  const shootDays = useShootDays();
  const { user } = useAuth();
  const callSheets = useAppDataSlice("callSheets");
  const today = format(new Date(), "yyyy-MM-dd");
  const endOfWindow = format(addDays(new Date(), 30), "yyyy-MM-dd");
  const activeProjects = projects.filter((project) => !["completed", "on-hold"].includes(project.status));
  const upcomingDays = shootDays.filter((day) => day.date >= today && day.date <= endOfWindow && !["completed", "cancelled"].includes(day.status))
    .sort((a, b) => a.date.localeCompare(b.date) || a.callTime.localeCompare(b.callTime));
  const liveScheduleEntries: ScheduleEntry[] = upcomingDays.map((day) => {
    const sheet = callSheets.filter((item) => item.shootDayId === day.id).sort((a, b) => (b.version ?? 1) - (a.version ?? 1))[0];
    return {
      id: day.id, projectId: day.projectId,
      projectTitle: projects.find((project) => project.id === day.projectId)?.title ?? day.projectTitle,
      date: day.date, callTime: day.callTime, location: day.location,
      scenes: day.scenes.map((scene) => scene.sceneNumber), shootDayNumber: day.shootDayNumber,
      totalShootDays: day.totalShootDays,
      callSheetStatus: sheet ? (["Published", "Revised", "Completed"].includes(sheet.status) ? "published" : "draft") : "pending",
      status: day.status === "in-progress" ? "shooting" : "scheduled",
    };
  });
  const dashboardStats = {
    activeProjects: activeProjects.length,
    totalBudget: projects.reduce((total, project) => total + project.budget, 0),
    totalSpent: projects.reduce((total, project) => total + project.spent, 0),
    upcomingShootDays: upcomingDays.length,
  };

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto">
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.14] via-card to-card p-6 shadow-lg shadow-amber-950/10">
        <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-500">
              <Sparkles className="h-3.5 w-3.5" />
              Production overview
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Welcome back, {user?.full_name.split(" ")[0] ?? "producer"}
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Your productions at a glance. Stay focused on what moves the next shoot forward.
            </p>
          </div>
          <Link
            href="/dashboard/projects"
            className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-400"
          >
            View projects
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Projects"
          value={dashboardStats.activeProjects}
          icon={Film}
          trend={{ value: "Excludes completed and on-hold projects", positive: true }}
        />
        <StatCard
          label="Total Production Budget"
          value={formatCurrency(dashboardStats.totalBudget)}
          icon={IndianRupee}
          trend={{ value: "Across all projects", positive: true }}
        />
        <StatCard
          label="Total Spent"
          value={formatCurrency(dashboardStats.totalSpent)}
          icon={Wallet}
          trend={{
            value: `${dashboardStats.totalBudget > 0 ? Math.round((dashboardStats.totalSpent / dashboardStats.totalBudget) * 100) : 0}% utilized`,
            positive: dashboardStats.totalSpent <= dashboardStats.totalBudget,
          }}
        />
        <StatCard
          label="Upcoming Shoot Days"
          value={dashboardStats.upcomingShootDays}
          icon={CalendarDays}
          trend={{ value: "Next 30 days", positive: true }}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { href: "/dashboard/projects", label: "Projects", description: "Review your active productions", icon: Film },
          { href: "/dashboard/schedule", label: "Schedule", description: "Check upcoming shoot days", icon: CalendarDays },
          { href: "/dashboard/production", label: "Production", description: "Track tasks and daily progress", icon: Wallet },
        ].map(({ href, label, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/50 p-4 transition-colors hover:border-amber-500/50 hover:bg-card"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{label}</span>
              <span className="block truncate text-xs text-muted-foreground">{description}</span>
            </span>
          </Link>
        ))}
      </div>

      {/* Active Productions */}
      <ActiveProductions projects={activeProjects.slice(0, 3)} />

      {liveScheduleEntries.length > 0 && (
        /* Shoot Days Table (responsive — scrolls horizontally on small screens) */
        <div className="overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6">
          <div className="min-w-[800px]">
            <UpcomingShootDays entries={liveScheduleEntries} />
          </div>
        </div>
      )}

    </div>
  );
}
