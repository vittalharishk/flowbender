"use client";

import { useMemo } from "react";
import { Download, Wand2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { StatCard } from "@/components/app/stat-card";
import { StatusBadge } from "@/components/app/status-badge";
import { DataTable, type DataTableColumn } from "@/components/app/data-table";
import { ChartContainer, seriesColors } from "@/components/app/chart-container";
import { EmptyState } from "@/components/app/empty-state";
import { useAppDataSlice } from "@/lib/app-data-store";
import { calcVfxStats } from "@/lib/vfx-store";
import { exportToCsv, formatFilterContext } from "@/lib/report-export";
import { filterByProject } from "@/lib/report-utils";
import type { ReportFilterState } from "./report-filters";
import type { VfxShot } from "@/lib/types";

interface Props {
  projectId?: string;
  filters: ReportFilterState;
  projectName: string;
}

export function VfxProgressReport({ projectId, filters, projectName }: Props) {
  const allShots = useAppDataSlice("vfxShots") as VfxShot[];
  const allVersions = useAppDataSlice("vfxVersions");
  const allReviews = useAppDataSlice("vfxReviews");

  const data = useMemo(() => {
    const shots = filterByProject(allShots, projectId);
    const stats = calcVfxStats(shots);
    const today = new Date().toISOString().slice(0, 10);

    const versionCountByShot: Record<string, number> = {};
    for (const v of allVersions) {
      versionCountByShot[v.shotId] = (versionCountByShot[v.shotId] || 0) + 1;
    }

    const statusChart = [
      { name: "Briefed", value: stats.briefed },
      { name: "In Progress", value: stats.inProgress },
      { name: "Client Review", value: stats.inReview },
      { name: "Final", value: stats.final },
    ].filter((d) => d.value > 0);

    const vendorChart = Object.entries(stats.byVendor).map(([name, value]) => ({ name, value }));

    const rows = shots.map((s) => ({
      ...s,
      versionsCount: versionCountByShot[s.id] || 0,
      isOverdue: s.status !== "final" && s.dueDate < today,
    }));

    return { stats, statusChart, vendorChart, rows, totalReviews: allReviews.length };
  }, [allShots, allVersions, allReviews, projectId]);

  const handleExport = () => {
    exportToCsv(data.rows, [
      { header: "Shot Code", accessor: (r) => r.shotCode },
      { header: "Sequence", accessor: (r) => r.sequence },
      { header: "Status", accessor: (r) => r.status },
      { header: "Priority", accessor: (r) => r.priority },
      { header: "Vendor", accessor: (r) => r.vendorId || "Unassigned" },
      { header: "Due Date", accessor: (r) => r.dueDate },
      { header: "Versions", accessor: (r) => r.versionsCount },
      { header: "Overdue", accessor: (r) => r.isOverdue ? "Yes" : "No" },
    ], {
      filename: "vfx-progress-report",
      title: "VFX Progress Report",
      filters: formatFilterContext({ projectName, dateFrom: filters.dateFrom, dateTo: filters.dateTo }),
    });
  };

  if (data.rows.length === 0) {
    return <EmptyState title="No VFX shot data" description={`No VFX shot data available${projectId ? " for this project" : ""}.`} icon={Wand2} />;
  }

  type ShotRow = (typeof data.rows)[number];
  const columns: DataTableColumn<ShotRow>[] = [
    { key: "code", header: "Shot Code", cell: (r) => <span className="font-medium">{r.shotCode}</span>, sortValue: (r) => r.shotCode },
    { key: "seq", header: "Sequence", cell: (r) => r.sequence, sortValue: (r) => r.sequence },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} />, sortValue: (r) => r.status },
    { key: "priority", header: "Priority", cell: (r) => <StatusBadge status={r.priority} />, sortValue: (r) => r.priority },
    { key: "vendor", header: "Vendor", cell: (r) => r.vendorId || <span className="text-muted-foreground">Unassigned</span>, sortValue: (r) => r.vendorId || "" },
    { key: "due", header: "Due Date", cell: (r) => <>{r.dueDate}{r.isOverdue && <StatusBadge status="overdue" className="ml-1" />}</>, sortValue: (r) => r.dueDate },
    { key: "versions", header: "Versions", cell: (r) => r.versionsCount, sortValue: (r) => r.versionsCount, align: "right" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Generated: {new Date().toLocaleString()}</p>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}>
          <Download className="w-3.5 h-3.5" /> CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard label="Total Shots" value={String(data.stats.total)} icon={Wand2} />
        <StatCard label="Briefed" value={String(data.stats.briefed)} />
        <StatCard label="In Progress" value={String(data.stats.inProgress)} />
        <StatCard label="Client Review" value={String(data.stats.inReview)} />
        <StatCard label="Final" value={String(data.stats.final)} />
        <StatCard label="Overdue" value={String(data.stats.overdue)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {data.statusChart.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Status Distribution</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer label="VFX status distribution chart" height={250}>
                <PieChart>
                  <Pie data={data.statusChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {data.statusChart.map((_, i) => <Cell key={i} fill={seriesColors[i % seriesColors.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
        {data.vendorChart.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Shots by Vendor</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer label="Shots by vendor chart" height={250}>
                <BarChart data={data.vendorChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill={seriesColors[0]} name="Shots" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">VFX Shots Detail</CardTitle></CardHeader>
        <CardContent>
          <DataTable columns={columns} rows={data.rows} rowKey={(r) => r.id} caption="VFX shots" />
        </CardContent>
      </Card>
    </div>
  );
}
