"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, format, parseISO } from "date-fns";
import Link from "next/link";
import {
  BarChart3,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Film,
  Gauge,
  GitCompareArrows,
  Presentation,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useProjects } from "@/lib/project-store";
import { updateAppDataSlice, useAppDataSlice } from "@/lib/app-data-store";
import { verifiedFilmMetadata } from "@/lib/film-metadata-registry";
import { formatINR } from "@/lib/utils";

type Decision = { id: string; title: string; project: string; priority: "Critical" | "High" | "Normal"; due: string };

const scenarioLabels = {
  base: "Base plan",
  delay: "7-day shoot delay",
  overrun: "10% budget overrun",
  release: "Release moved 30 days",
} as const;

export function ProducerCommandCenter() {
  const projects = useProjects();
  const budgetItems = useAppDataSlice("budgetLineItems");
  const postItems = useAppDataSlice("postProductionItems");
  const tasks = useAppDataSlice("productionTasks");
  const decisions: Decision[] = tasks.filter((task) => task.status !== "done")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .map((task) => ({ id: task.id, title: task.title, project: projects.find((project) => project.id === task.projectId)?.title ?? "Unlinked project", priority: task.priority === "critical" ? "Critical" : task.priority === "high" ? "High" : "Normal", due: task.dueDate || "Not scheduled" }));
  function completeDecision(id: string) {
    updateAppDataSlice("productionTasks", (current) => current.map((task) => task.id === id ? { ...task, status: "done" as const } : task));
  }
  const [scenario, setScenario] = useState<keyof typeof scenarioLabels>("base");
  const [presentation, setPresentation] = useState(false);
  const [compare, setCompare] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  useEffect(() => {
    if (!presentation) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPresentation(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [presentation]);

  const totals = useMemo(() => {
    const budget = projects.reduce((sum, project) => sum + project.budget, 0);
    const spent = projects.reduce((sum, project) => sum + project.spent, 0);
    const completed = projects.reduce((sum, project) => sum + project.completedShootDays, 0);
    const planned = projects.reduce((sum, project) => sum + project.totalShootDays, 0);
    const postProgress = postItems.length ? Math.round(postItems.reduce((sum, item) => sum + item.progress, 0) / postItems.length) : 0;
    return { budget, spent, completed, planned, postProgress, utilization: budget ? Math.round((spent / budget) * 100) : 0 };
  }, [projects, postItems]);

  const scenarioFactor = scenario === "overrun" ? 1.1 : 1;
  const scenarioDays = scenario === "delay" ? totals.planned + 7 : totals.planned;
  const latestDelivery = projects.map((project) => project.endDate).filter(Boolean).sort().pop();
  const scenarioDelivery = latestDelivery ? format(addDays(parseISO(latestDelivery), scenario === "release" ? 30 : scenario === "delay" ? 7 : 0), "dd MMM yyyy") : "Set project dates";
  const budgetData = [
    { name: "Plan", value: Math.round(totals.budget / 10000000) },
    { name: "Committed", value: Math.round(budgetItems.reduce((sum, item) => sum + item.committed, 0) / 10000000) },
    { name: "Spent", value: Math.round((totals.spent * scenarioFactor) / 10000000) },
  ];
  const progressData = projects.slice(0, 7).map((project) => ({
    name: project.title.split(":")[0].replace("They Call Him", "OG").slice(0, 12),
    shoot: project.shootProgress,
    post: postItems.filter((item) => item.projectId === project.id).length
      ? Math.round(postItems.filter((item) => item.projectId === project.id).reduce((sum, item) => sum + item.progress, 0) / postItems.filter((item) => item.projectId === project.id).length)
      : 0,
  }));
  const health = totals.utilization > 85 || tasks.some((task) => task.status === "blocked") || scenario !== "base" ? "Attention" : "On track";
  const healthClass = health === "On track" ? "text-emerald-400" : "text-amber-400";
  const metadataByProject = useMemo(
    () => new Map(verifiedFilmMetadata.map((item) => [item.projectId, item])),
    [],
  );

  function toggleProject(id: string) {
    setSelectedProjects((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id].slice(-3));
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 p-6 text-slate-50 shadow-2xl">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300"><Sparkles className="h-3.5 w-3.5" /> Producer command center</div>
            <h2 className="text-2xl font-bold tracking-tight">All your films, in one clear view.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">See what is happening with every film, what needs your approval, and which numbers are public facts or demo planning figures.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" className="bg-amber-500 text-slate-950 hover:bg-amber-400" onClick={() => setPresentation(true)}><Presentation className="mr-2 h-4 w-4" /> View visual snapshot</Button>
          </div>
        </div>
        <div className="relative mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4"><p className="text-xs text-slate-400">Overall status</p><p className={`mt-1 text-lg font-semibold ${healthClass}`}>{health}</p><p className="mt-1 text-xs text-slate-400">Based on spending, schedule and blockers</p></div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4"><p className="text-xs text-slate-400">Next action</p><p className="mt-1 text-lg font-semibold">{decisions[0]?.due ?? "Nothing pending"}</p><p className="mt-1 text-xs text-slate-400">{decisions.length} approvals need your attention</p></div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4"><p className="text-xs text-slate-400">What-if plan</p><p className="mt-1 text-lg font-semibold">{scenarioLabels[scenario]}</p><p className="mt-1 text-xs text-slate-400">A planning example, not a confirmed change</p></div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Film} label="Films in the app" value={projects.length.toString()} detail="Public film records and demo plans" />
        <MetricCard icon={CircleDollarSign} label="Money used" value={`${totals.utilization}%`} detail={`${formatINR(totals.spent)} used of ${formatINR(totals.budget)}`} progress={totals.utilization} />
        <MetricCard icon={Target} label="Shoot days done" value={`${totals.completed}/${totals.planned}`} detail={`${Math.round((totals.completed / Math.max(totals.planned, 1)) * 100)}% of demo plan`} progress={Math.round((totals.completed / Math.max(totals.planned, 1)) * 100)} />
        <MetricCard icon={Gauge} label="Editing and delivery" value={`${totals.postProgress}%`} detail="Demo progress for post-production" progress={totals.postProgress} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_.9fr]">
        <Card><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-amber-500" /> Film progress</CardTitle><p className="mt-1 text-xs text-muted-foreground">Orange = shooting · purple = editing and delivery</p></div><Badge variant="outline">Demo planning numbers</Badge></CardHeader><CardContent><div className="h-[260px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={progressData} barGap={5}><CartesianGrid strokeDasharray="3 3" className="stroke-border/50" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} unit="%" /><Tooltip /><Bar dataKey="shoot" name="Shooting" fill="#f59e0b" radius={[4, 4, 0, 0]} /><Bar dataKey="post" name="Editing / delivery" fill="#8b5cf6" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-500" /> Money summary</CardTitle><p className="mt-1 text-xs text-muted-foreground">Demo budget numbers in ₹ crore</p></CardHeader><CardContent><div className="h-[190px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={budgetData} layout="vertical"><CartesianGrid strokeDasharray="3 3" className="stroke-border/50" /><XAxis type="number" tick={{ fontSize: 11 }} /><YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={65} /><Tooltip /><Bar dataKey="value" fill="#14b8a6" radius={[0, 5, 5, 0]} /></BarChart></ResponsiveContainer></div><p className="text-center text-xs text-muted-foreground">{scenarioLabels[scenario]} · Not public financial data</p></CardContent></Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between"><div><CardTitle className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-blue-500" /> Actions waiting for you</CardTitle><p className="mt-1 text-xs text-muted-foreground">Open production tasks; completion is saved to the workspace</p></div><Badge>{decisions.length} open</Badge></CardHeader>
          <CardContent className="space-y-3">
            {decisions.slice(0, 6).map((decision) => <div key={decision.id} className="flex items-center gap-3 rounded-xl border p-3"><div className={`h-2 w-2 rounded-full ${decision.priority === "Critical" ? "bg-red-500" : decision.priority === "High" ? "bg-amber-500" : "bg-blue-500"}`} /><div className="min-w-0 flex-1"><p className="text-sm font-medium">{decision.title}</p><p className="text-xs text-muted-foreground">{decision.project} - Due {decision.due}</p></div><Badge variant="outline" className="hidden sm:inline-flex">{decision.priority}</Badge><Button size="icon" variant="ghost" onClick={() => completeDecision(decision.id)} aria-label={`Mark ${decision.title} complete`}><Check className="h-4 w-4 text-emerald-500" /></Button></div>)}
            {decisions.length === 0 && <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">No open production tasks.</p>}
            <Link href="/dashboard/production" className="inline-block text-sm text-primary hover:underline">View all production tasks</Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><RefreshCw className="h-4 w-4 text-purple-500" /> Try a what-if plan</CardTitle><p className="mt-1 text-xs text-muted-foreground">See how a delay or extra cost changes the plan</p></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{(Object.keys(scenarioLabels) as Array<keyof typeof scenarioLabels>).map((key) => <Button key={key} variant={scenario === key ? "default" : "outline"} className="justify-start text-xs" onClick={() => setScenario(key)}>{scenarioLabels[key]}</Button>)}</div>
            <Separator className="my-4" />
            <div className="grid grid-cols-2 gap-4"><div><p className="text-xs text-muted-foreground">Possible budget</p><p className="mt-1 text-xl font-bold">{formatINR(Math.round(totals.budget * scenarioFactor))}</p></div><div><p className="text-xs text-muted-foreground">Possible shoot days</p><p className="mt-1 text-xl font-bold">{scenarioDays}</p></div><div className="col-span-2"><p className="text-xs text-muted-foreground">Latest planned delivery</p><p className="mt-1 text-xl font-bold">{scenarioDelivery}</p></div></div>
            <div className="mt-4 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">{scenario === "base" ? "This is the current demo plan." : "This is an example only. It does not change your projects."}</div>
          </CardContent>
        </Card>
      </div>

      <Card><CardContent className="flex flex-wrap items-center gap-3 p-4"><span className="text-xs font-semibold text-muted-foreground">What the labels mean</span><Badge variant="outline" className="border-emerald-500/40 text-emerald-600"><ShieldCheck className="mr-1 h-3 w-3" /> Public film fact</Badge><Badge variant="outline" className="border-purple-500/40 text-purple-600"><Sparkles className="mr-1 h-3 w-3" /> Demo planning number</Badge><Badge variant="outline" className="border-blue-500/40 text-blue-600"><UserEnteredIcon className="mr-1 h-3 w-3" /> Added by you</Badge><Badge variant="outline" className="border-amber-500/40 text-amber-600"><Clock3 className="mr-1 h-3 w-3" /> Not confirmed publicly</Badge></CardContent></Card>

      <Card><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle className="flex items-center gap-2"><GitCompareArrows className="h-4 w-4 text-cyan-500" /> Compare films</CardTitle><p className="mt-1 text-xs text-muted-foreground">Select films to compare their demo progress</p></div><Button variant="outline" size="sm" onClick={() => setCompare(!compare)}>{compare ? "Close comparison" : "Compare films"}</Button></CardHeader>{compare && <CardContent><div className="mb-4 flex flex-wrap gap-2">{projects.map((project) => <Button key={project.id} variant={selectedProjects.includes(project.id) ? "default" : "outline"} size="sm" onClick={() => toggleProject(project.id)}>{project.title}</Button>)}</div><div className="grid gap-3 md:grid-cols-3">{projects.filter((project) => selectedProjects.includes(project.id)).map((project) => <div key={project.id} className="rounded-xl border p-4"><div className="flex items-start justify-between gap-2"><p className="font-semibold">{project.title}</p><Badge variant="outline">{project.status}</Badge></div><div className="mt-4 space-y-3 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Demo budget</span><span>{formatINR(project.budget)}</span></div><div><div className="mb-1 flex justify-between text-xs"><span className="text-muted-foreground">Shooting progress</span><span>{project.shootProgress}%</span></div><Progress value={project.shootProgress} /></div><Link className="inline-flex items-center text-xs text-amber-600 hover:underline" href={`/dashboard/projects/${project.id}`}>Open film page <ChevronRight className="ml-1 h-3 w-3" /></Link></div></div>)}</div></CardContent>}</Card>

      {presentation && <div className="fixed inset-0 z-50 overflow-auto bg-slate-950 p-6 text-white"><div className="mx-auto max-w-6xl"><div className="mb-8 flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.25em] text-amber-300">flowbender · Producer briefing</p><h2 className="mt-2 text-3xl font-bold">All films overview</h2><p className="mt-1 text-sm text-slate-400">Public film facts are shown with demo planning progress.</p></div><Button variant="ghost" className="text-white hover:bg-white/10" onClick={() => setPresentation(false)}><X className="mr-2 h-4 w-4" /> Close snapshot</Button></div><div className="grid gap-4 md:grid-cols-4">{[["Films", projects.length], ["Money used", `${totals.utilization}%`], ["Shoot days done", `${totals.completed}/${totals.planned}`], ["Editing and delivery", `${totals.postProgress}%`]].map(([label, value]) => <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-5"><p className="text-sm text-slate-400">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></div>)}</div><div className="mt-6 grid gap-4 md:grid-cols-2">{projects.map((project) => { const metadata = metadataByProject.get(project.id); return <div key={project.id} className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"><div className="h-28 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-800">{project.posterImage && <img src={project.posterImage} alt={`${project.title} poster`} className="h-full w-full object-cover" />}</div><div className="min-w-0 flex-1"><div className="flex justify-between gap-3"><h3 className="font-semibold">{project.title}</h3><span className="shrink-0 text-amber-300">{project.shootProgress}%</span></div><p className="mt-1 text-xs text-slate-400">{metadata?.status ?? "Demo project"} · Director: {metadata?.director ?? project.director}</p><Progress className="mt-3" value={project.shootProgress} /><p className="mt-3 text-xs text-slate-400">{metadata?.genre ?? project.genre} · {metadata?.studio ?? project.productionHouse}</p></div></div>; })}</div></div></div>}
    </div>
  );
}

function UserEnteredIcon({ className }: { className?: string }) {
  return <span className={className}>●</span>;
}

function MetricCard({ icon: Icon, label, value, detail, progress }: { icon: typeof Film; label: string; value: string; detail: string; progress?: number }) {
  return <Card><CardContent className="p-5"><div className="flex items-start justify-between"><div><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div><div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-500"><Icon className="h-4 w-4" /></div></div><p className="mt-2 truncate text-xs text-muted-foreground">{detail}</p>{progress !== undefined && <Progress className="mt-3 h-1.5" value={progress} />}</CardContent></Card>;
}
