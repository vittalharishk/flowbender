"use client";

import { useMemo } from "react";
import { Download } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppDataSlice } from "@/lib/app-data-store";
import { exportToCsv, formatFilterContext } from "@/lib/report-export";
import { pct, filterByProject, countByStatus, groupBy } from "@/lib/report-utils";
import { StatCard } from "@/components/app/stat-card";
import { StatusBadge } from "@/components/app/status-badge";
import { ChartContainer, seriesColors } from "@/components/app/chart-container";
import { DataTable, type DataTableColumn } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import type { ReportFilterState } from "./report-filters";

const STATUS_LABELS: Record<string, string> = {
  "shot": "Completed",
  "partially-shot": "Partially Shot",
  "scheduled": "Scheduled",
  "not-scheduled": "Not Scheduled",
  "reshoot-required": "Reshoot Required",
};

interface Props {
  projectId?: string;
  filters: ReportFilterState;
  projectName: string;
}

export function ProductionProgressReport({ projectId, filters, projectName }: Props) {
  const allScenes = useAppDataSlice("scenes");
  const allShootDays = useAppDataSlice("shootDays");
  const allSchedule = useAppDataSlice("scheduleEntries");

  const scenes = useMemo(() => filterByProject(allScenes, projectId), [allScenes, projectId]);
  const shootDays = useMemo(() => filterByProject(allShootDays, projectId), [allShootDays, projectId]);
  const schedule = useMemo(() => filterByProject(allSchedule, projectId), [allSchedule, projectId]);

  const progress = useMemo(() => {
    const total = scenes.length;
    const completed = scenes.filter((s) => s.status === "shot").length;
    const partiallyShot = scenes.filter((s) => s.status === "partially-shot").length;
    const scheduled = scenes.filter((s) => s.status === "scheduled").length;
    const notScheduled = scenes.filter((s) => s.status === "not-scheduled").length;
    const reshoot = scenes.filter((s) => s.status === "reshoot-required").length;
    return { total, completed, partiallyShot, scheduled, notScheduled, reshoot, completionPct: pct(completed, total) };
  }, [scenes]);

  const statusCounts = useMemo(() => countByStatus(scenes, (s) => s.status), [scenes]);

  const pieData = useMemo(() => {
    return Object.entries(statusCounts)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => ({ name: STATUS_LABELS[k] || k, value: v }));
  }, [statusCounts]);

  const shootDayStats = useMemo(() => {
    const total = shootDays.length;
    const completed = shootDays.filter((sd) => sd.status === "completed" || sd.status === "cancelled").length;
    const inProgress = shootDays.filter((sd) => sd.status === "in-progress" || sd.status === "confirmed").length;
    return { total, completed, inProgress, remaining: total - completed - inProgress };
  }, [shootDays]);

  const shootDayChartData = useMemo(() => {
    if (!projectId) {
      const byProj = groupBy(shootDays, (sd) => sd.projectTitle || sd.projectId);
      return Object.entries(byProj).map(([name, days]) => ({
        name: name.length > 15 ? name.slice(0, 14) + "…" : name,
        Planned: days.length,
        Completed: days.filter((d) => d.status === "completed").length,
      }));
    }
    return [{ name: "Shoot Days", Planned: shootDayStats.total, Completed: shootDayStats.completed }];
  }, [projectId, shootDays, shootDayStats]);

  const handleExport = () => {
    exportToCsv(scenes, [
      { header: "Scene #", accessor: (s) => s.sceneNumber },
      { header: "Heading", accessor: (s) => s.heading },
      { header: "Location", accessor: (s) => s.location },
      { header: "Status", accessor: (s) => s.status },
      { header: "Int/Ext", accessor: (s) => s.intExt },
      { header: "Time of Day", accessor: (s) => s.timeOfDay },
      { header: "Pages", accessor: (s) => s.pages },
      { header: "Shoot Date", accessor: (s) => s.shootDate || "—" },
    ], {
      filename: "production-progress",
      title: "Production Progress Report",
      filters: formatFilterContext({ projectId, projectName, dateFrom: filters.dateFrom, dateTo: filters.dateTo }),
    });
  };

  if (scenes.length === 0) {
    return <EmptyState title="No scene data" description="No scene data available for the selected filters." />;
  }

  type SceneRow = (typeof scenes)[number];

  const columns = useMemo((): DataTableColumn<SceneRow>[] => [
    { key: "sceneNumber", header: "Scene #", cell: (s) => <span className="font-medium">{s.sceneNumber}</span>, sortValue: (s) => s.sceneNumber },
    { key: "heading", header: "Heading", cell: (s) => <span className="max-w-[200px] truncate block">{s.heading}</span> },
    { key: "location", header: "Location", cell: (s) => s.location },
    { key: "status", header: "Status", cell: (s) => <StatusBadge status={s.status} label={STATUS_LABELS[s.status] || s.status} /> },
    { key: "pages", header: "Pages", cell: (s) => s.pages, align: "right", sortValue: (s) => s.pages },
    { key: "shootDate", header: "Shoot Date", cell: (s) => s.shootDate || "—" },
  ], []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Generated at {new Date().toLocaleString()}</p>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}><Download className="w-3.5 h-3.5" /> CSV</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Total Scenes" value={String(progress.total)} />
        <StatCard label="Completed" value={String(progress.completed)} />
        <StatCard label="Partially Shot" value={String(progress.partiallyShot)} />
        <StatCard label="Scheduled" value={String(progress.scheduled)} />
        <StatCard label="Completion" value={`${progress.completionPct}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {pieData.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Scene Status Distribution</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer label="Scene status distribution pie chart" height={260}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {pieData.map((_, i) => <Cell key={i} fill={seriesColors[i % seriesColors.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle className="text-sm">Shoot Days: Planned vs Completed</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer label="Shoot days planned vs completed bar chart" height={260}>
              <BarChart data={shootDayChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Legend />
                <Bar dataKey="Planned" fill={seriesColors[1]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Completed" fill={seriesColors[2]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <h3 className="text-sm font-semibold">Scene Details</h3>
      <DataTable columns={columns} rows={scenes} rowKey={(s) => s.id} caption="Scene details" />
    </div>
  );
}
