"use client";

import { useMemo } from "react";
import { Download } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppDataSlice } from "@/lib/app-data-store";
import { exportToCsv, formatFilterContext } from "@/lib/report-export";
import { pct, filterByProject, countByStatus, groupBy } from "@/lib/report-utils";
import type { ReportFilterState } from "./report-filters";

const COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6", "#ec4899"];

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
    return <Card><CardContent className="p-8 text-center text-muted-foreground">No scene data available for the selected filters.</CardContent></Card>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Generated at {new Date().toLocaleString()}</p>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}><Download className="w-3.5 h-3.5" /> CSV</Button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KPI label="Total Scenes" value={String(progress.total)} />
        <KPI label="Completed" value={String(progress.completed)} tone="text-emerald-400" />
        <KPI label="Partially Shot" value={String(progress.partiallyShot)} tone="text-amber-400" />
        <KPI label="Scheduled" value={String(progress.scheduled)} tone="text-blue-400" />
        <KPI label="Completion" value={`${progress.completionPct}%`} tone="text-cyan-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pie */}
        {pieData.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Scene Status Distribution</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Bar */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Shoot Days: Planned vs Completed</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={shootDayChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Legend />
                <Bar dataKey="Planned" fill={COLORS[2]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Completed" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Scene Details</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="text-left p-3">Scene #</th>
                  <th className="text-left p-3">Heading</th>
                  <th className="text-left p-3">Location</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-right p-3">Pages</th>
                  <th className="text-left p-3">Shoot Date</th>
                </tr>
              </thead>
              <tbody>
                {scenes.slice(0, 100).map((s) => (
                  <tr key={s.id} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-medium">{s.sceneNumber}</td>
                    <td className="p-3 max-w-[200px] truncate">{s.heading}</td>
                    <td className="p-3">{s.location}</td>
                    <td className="p-3"><Badge variant="outline" className="text-xs">{STATUS_LABELS[s.status] || s.status}</Badge></td>
                    <td className="p-3 text-right">{s.pages}</td>
                    <td className="p-3">{s.shootDate || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {scenes.length > 100 && <p className="text-xs text-muted-foreground text-center py-2">Showing first 100 of {scenes.length} scenes. Use CSV export for full data.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KPI({ label, value, tone = "text-foreground" }: { label: string; value: string; tone?: string }) {
  return <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={`text-lg font-semibold mt-1 ${tone}`}>{value}</p></CardContent></Card>;
}
