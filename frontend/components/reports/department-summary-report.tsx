"use client";

import { useMemo } from "react";
import { Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { useAccountsDashboard } from "@/lib/accounts-store";
import { exportToCsv, formatFilterContext } from "@/lib/report-export";
import { formatCrore } from "@/lib/report-utils";
import { StatCard } from "@/components/app/stat-card";
import { ChartContainer, seriesColors } from "@/components/app/chart-container";
import { DataTable, type DataTableColumn } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import type { ReportFilterState } from "./report-filters";

interface Props {
  projectId?: string;
  filters: ReportFilterState;
  projectName: string;
}

export function DepartmentSummaryReport({ projectId, filters, projectName }: Props) {
  const dashboard = useAccountsDashboard(projectId);

  const data = useMemo(() => {
    let depts = dashboard.byDepartment;
    if (filters.department && filters.department !== "all") {
      depts = depts.filter((d) => d.departmentKey === filters.department);
    }

    const totalAllocated = depts.reduce((s, d) => s + d.allocated, 0);
    const totalCommitted = depts.reduce((s, d) => s + d.committed, 0);
    const totalPaid = depts.reduce((s, d) => s + d.paid, 0);

    const chart = depts.map((d) => ({
      name: d.display.length > 18 ? d.display.slice(0, 15) + "…" : d.display,
      committed: Math.round(d.committed / 1e5) / 100,
      paid: Math.round(d.paid / 1e5) / 100,
    }));

    return { depts, totalAllocated, totalCommitted, totalPaid, activeDepts: depts.length, chart };
  }, [dashboard, filters.department]);

  const handleExport = () => {
    exportToCsv(data.depts, [
      { header: "Department", accessor: (r) => r.display },
      { header: "Allocated Budget", accessor: (r) => r.allocated },
      { header: "Committed", accessor: (r) => r.committed },
      { header: "Paid", accessor: (r) => r.paid },
      { header: "Outstanding", accessor: (r) => r.outstanding },
      { header: "Available", accessor: (r) => r.available },
      { header: "Variance", accessor: (r) => r.variance },
    ], {
      filename: "department-summary-report",
      title: "Department Summary Report",
      filters: formatFilterContext({ projectName, dateFrom: filters.dateFrom, dateTo: filters.dateTo, department: filters.department }),
    });
  };

  if (data.depts.length === 0) {
    return <EmptyState title="No department data" description={`No department data available${projectId ? " for this project" : ""}.`} />;
  }

  type DeptRow = (typeof data.depts)[number];

  const columns = useMemo((): DataTableColumn<DeptRow>[] => [
    { key: "dept", header: "Department", cell: (r) => <span className="font-medium">{r.display}</span>, sortValue: (r) => r.display },
    { key: "allocated", header: "Allocated", cell: (r) => formatCrore(r.allocated), align: "right", sortValue: (r) => r.allocated },
    { key: "committed", header: "Committed", cell: (r) => formatCrore(r.committed), align: "right", sortValue: (r) => r.committed },
    { key: "paid", header: "Paid", cell: (r) => formatCrore(r.paid), align: "right", sortValue: (r) => r.paid },
    { key: "outstanding", header: "Outstanding", cell: (r) => formatCrore(r.outstanding), align: "right", sortValue: (r) => r.outstanding },
    { key: "available", header: "Available", cell: (r) => formatCrore(r.available), align: "right", sortValue: (r) => r.available },
    { key: "variance", header: "Variance", cell: (r) => <span className={r.variance < 0 ? "text-red-400" : ""}>{formatCrore(r.variance)}</span>, align: "right", sortValue: (r) => r.variance },
  ], []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Generated: {new Date().toLocaleString()}</p>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}>
          <Download className="w-3.5 h-3.5" /> CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Departments (with activity)" value={String(data.activeDepts)} />
        <StatCard label="Total Allocated" value={formatCrore(data.totalAllocated)} />
        <StatCard label="Total Committed" value={formatCrore(data.totalCommitted)} />
        <StatCard label="Total Paid" value={formatCrore(data.totalPaid)} />
      </div>

      {data.chart.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Department Committed vs Paid (₹ Lakhs)</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer label="Department committed vs paid bar chart" height={Math.max(250, data.chart.length * 35)}>
              <BarChart data={data.chart} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="committed" fill={seriesColors[0]} name="Committed" />
                <Bar dataKey="paid" fill={seriesColors[2]} name="Paid" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      <h3 className="text-sm font-semibold">Department Detail</h3>
      <DataTable columns={columns} rows={data.depts} rowKey={(r) => r.departmentKey} caption="Department detail" />
    </div>
  );
}
