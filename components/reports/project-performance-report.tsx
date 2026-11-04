"use client";

import { useMemo } from "react";
import { Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAccountsDashboard } from "@/lib/accounts-store";
import { useProjects } from "@/lib/project-store";
import { useAppDataSlice } from "@/lib/app-data-store";
import { exportToCsv, formatFilterContext } from "@/lib/report-export";
import { formatCrore, pct } from "@/lib/report-utils";
import type { ReportFilterState } from "./report-filters";

const COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

interface Props {
  projectId?: string;
  filters: ReportFilterState;
  projectName: string;
}

export function ProjectPerformanceReport({ projectId, filters, projectName }: Props) {
  const dashboard = useAccountsDashboard(projectId);
  const projects = useProjects();
  const scenes = useAppDataSlice("scenes");

  const { summary } = dashboard;

  const tableRows = useMemo(() => {
    return dashboard.byProject.map((p) => {
      const projectScenes = scenes.filter((s) => s.projectId === p.projectId);
      const completed = projectScenes.filter((s) => s.status === "shot" || s.status === "partially-shot").length;
      const total = projectScenes.length;
      const proj = projects.find((pr) => pr.id === p.projectId);
      return {
        ...p,
        status: proj?.status ?? "unknown",
        sceneTotal: total,
        sceneCompleted: completed,
        sceneProgress: total > 0 ? pct(completed, total) : 0,
      };
    });
  }, [dashboard.byProject, scenes, projects]);

  const chartData = useMemo(() => {
    return tableRows.map((r) => ({
      name: r.projectName.length > 15 ? r.projectName.slice(0, 14) + "…" : r.projectName,
      Budget: Math.round(r.approvedBudget / 1e5) / 100,
      Committed: Math.round(r.committed / 1e5) / 100,
      Paid: Math.round(r.paid / 1e5) / 100,
    }));
  }, [tableRows]);

  const handleExport = () => {
    exportToCsv(tableRows, [
      { header: "Project", accessor: (r) => r.projectName },
      { header: "Status", accessor: (r) => r.status },
      { header: "Approved Budget", accessor: (r) => r.approvedBudget },
      { header: "Committed", accessor: (r) => r.committed },
      { header: "Paid", accessor: (r) => r.paid },
      { header: "Outstanding", accessor: (r) => r.outstanding },
      { header: "Utilization %", accessor: (r) => Math.round(r.utilization) },
      { header: "Scenes Total", accessor: (r) => r.sceneTotal },
      { header: "Scenes Completed", accessor: (r) => r.sceneCompleted },
      { header: "Scene Progress %", accessor: (r) => r.sceneProgress },
    ], {
      filename: "project-performance",
      title: "Project Performance Report",
      filters: formatFilterContext({ projectId, projectName, dateFrom: filters.dateFrom, dateTo: filters.dateTo }),
    });
  };

  if (dashboard.byProject.length === 0) {
    return (
      <Card><CardContent className="p-8 text-center text-muted-foreground">No project data available for the selected filters.</CardContent></Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Generated at {new Date().toLocaleString()}</p>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}><Download className="w-3.5 h-3.5" /> CSV</Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KPI label="Total Budget" value={formatCrore(summary.totalApprovedBudget)} />
        <KPI label="Committed" value={formatCrore(summary.totalCommitted)} tone="text-amber-400" />
        <KPI label="Paid" value={formatCrore(summary.totalPaid)} tone="text-emerald-400" />
        <KPI label="Outstanding" value={formatCrore(summary.totalOutstanding)} tone="text-red-400" />
        <KPI label="Available" value={formatCrore(summary.availableBudget)} tone="text-blue-400" />
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Budget vs Committed vs Paid (₹ Lakhs)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Legend />
                <Bar dataKey="Budget" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Committed" fill={COLORS[1]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Paid" fill={COLORS[2]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Project Details</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="text-left p-3">Project</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-right p-3">Approved Budget</th>
                  <th className="text-right p-3">Committed</th>
                  <th className="text-right p-3">Paid</th>
                  <th className="text-right p-3">Outstanding</th>
                  <th className="text-right p-3">Utilization</th>
                  <th className="text-right p-3">Scene Progress</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((r) => (
                  <tr key={r.projectId} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-medium">{r.projectName}</td>
                    <td className="p-3"><Badge variant="outline" className="text-xs">{r.status}</Badge></td>
                    <td className="p-3 text-right">{formatCrore(r.approvedBudget)}</td>
                    <td className="p-3 text-right">{formatCrore(r.committed)}</td>
                    <td className="p-3 text-right">{formatCrore(r.paid)}</td>
                    <td className="p-3 text-right">{formatCrore(r.outstanding)}</td>
                    <td className="p-3 text-right">{Math.round(r.utilization)}%</td>
                    <td className="p-3 text-right">
                      {r.sceneTotal > 0 ? `${r.sceneCompleted}/${r.sceneTotal} (${r.sceneProgress}%)` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KPI({ label, value, tone = "text-foreground" }: { label: string; value: string; tone?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-lg font-semibold mt-1 ${tone}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
