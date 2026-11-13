"use client";

import { useMemo } from "react";
import { Download, LayoutDashboard } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/app/stat-card";
import { StatusBadge } from "@/components/app/status-badge";
import { DataTable, type DataTableColumn } from "@/components/app/data-table";
import { ChartContainer, seriesColors } from "@/components/app/chart-container";
import { EmptyState } from "@/components/app/empty-state";
import { useAccountsDashboard } from "@/lib/accounts-store";
import { useProjects } from "@/lib/project-store";
import { useAppDataSlice } from "@/lib/app-data-store";
import { exportToCsv, formatFilterContext } from "@/lib/report-export";
import { formatCrore, pct } from "@/lib/report-utils";
import type { ReportFilterState } from "./report-filters";

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
    return <EmptyState title="No project data" description="No project data available for the selected filters." icon={LayoutDashboard} />;
  }

  type ProjRow = (typeof tableRows)[number];
  const columns: DataTableColumn<ProjRow>[] = [
    { key: "name", header: "Project", cell: (r) => <span className="font-medium">{r.projectName}</span>, sortValue: (r) => r.projectName },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} />, sortValue: (r) => r.status },
    { key: "budget", header: "Approved Budget", cell: (r) => formatCrore(r.approvedBudget), sortValue: (r) => r.approvedBudget, align: "right" },
    { key: "committed", header: "Committed", cell: (r) => formatCrore(r.committed), sortValue: (r) => r.committed, align: "right" },
    { key: "paid", header: "Paid", cell: (r) => formatCrore(r.paid), sortValue: (r) => r.paid, align: "right" },
    { key: "outstanding", header: "Outstanding", cell: (r) => formatCrore(r.outstanding), sortValue: (r) => r.outstanding, align: "right" },
    { key: "util", header: "Utilization", cell: (r) => `${Math.round(r.utilization)}%`, sortValue: (r) => r.utilization, align: "right" },
    { key: "scene", header: "Scene Progress", cell: (r) => r.sceneTotal > 0 ? `${r.sceneCompleted}/${r.sceneTotal} (${r.sceneProgress}%)` : "—", sortValue: (r) => r.sceneProgress, align: "right" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Generated at {new Date().toLocaleString()}</p>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}><Download className="w-3.5 h-3.5" /> CSV</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Total Budget" value={formatCrore(summary.totalApprovedBudget)} icon={LayoutDashboard} />
        <StatCard label="Committed" value={formatCrore(summary.totalCommitted)} />
        <StatCard label="Paid" value={formatCrore(summary.totalPaid)} />
        <StatCard label="Outstanding" value={formatCrore(summary.totalOutstanding)} />
        <StatCard label="Available" value={formatCrore(summary.availableBudget)} />
      </div>

      {chartData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Budget vs Committed vs Paid (INR Lakhs)</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer label="Budget vs committed vs paid chart" height={300}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Legend />
                <Bar dataKey="Budget" fill={seriesColors[0]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Committed" fill={seriesColors[1]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Paid" fill={seriesColors[2]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-sm">Project Details</CardTitle></CardHeader>
        <CardContent>
          <DataTable columns={columns} rows={tableRows} rowKey={(r) => r.projectId} caption="Project details" />
        </CardContent>
      </Card>
    </div>
  );
}
