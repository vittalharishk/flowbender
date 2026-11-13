"use client";

import { useMemo } from "react";
import { Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { useAccountsDashboard, useConsolidatedExpenses } from "@/lib/accounts-store";
import { useAppDataSlice } from "@/lib/app-data-store";
import { exportToCsv, formatFilterContext } from "@/lib/report-export";
import { formatCrore, pct, filterByProject } from "@/lib/report-utils";
import { StatCard } from "@/components/app/stat-card";
import { ChartContainer, seriesColors } from "@/components/app/chart-container";
import { DataTable, type DataTableColumn } from "@/components/app/data-table";
import type { ReportFilterState } from "./report-filters";

interface Props {
  projectId?: string;
  filters: ReportFilterState;
  projectName: string;
}

export function BudgetExpenseReport({ projectId, filters, projectName }: Props) {
  const dashboard = useAccountsDashboard(projectId);
  const allPOs = useAppDataSlice("purchaseOrders");

  const data = useMemo(() => {
    const { summary, byProject, byDepartment, byCategory } = dashboard;

    const utilization = summary.totalApprovedBudget > 0
      ? Math.round((summary.totalCommitted / summary.totalApprovedBudget) * 100)
      : 0;

    const categoryChart = byCategory.map((c) => ({
      name: c.category,
      committed: Math.round(c.committed / 1e5) / 100,
      paid: Math.round(c.paid / 1e5) / 100,
    }));

    const projectChart = byProject.map((p) => ({
      name: p.projectName.length > 15 ? p.projectName.slice(0, 12) + "…" : p.projectName,
      committed: Math.round(p.committed / 1e5) / 100,
      paid: Math.round(p.paid / 1e5) / 100,
    }));

    const pos = filterByProject(allPOs, projectId);
    const poStatusCounts: Record<string, number> = {};
    let poTotal = 0;
    for (const po of pos) {
      poStatusCounts[po.status] = (poStatusCounts[po.status] || 0) + 1;
      poTotal += po.inrTotal || po.grandTotal || 0;
    }

    return { summary, utilization, byProject, byDepartment, byCategory, categoryChart, projectChart, pos, poStatusCounts, poTotal };
  }, [dashboard, allPOs, projectId]);

  const handleExport = () => {
    exportToCsv(data.byDepartment, [
      { header: "Department", accessor: (r) => r.display },
      { header: "Allocated", accessor: (r) => r.allocated },
      { header: "Committed", accessor: (r) => r.committed },
      { header: "Paid", accessor: (r) => r.paid },
      { header: "Outstanding", accessor: (r) => r.outstanding },
      { header: "Variance", accessor: (r) => r.variance },
    ], {
      filename: "budget-expense-report",
      title: "Budget & Expense Report",
      filters: formatFilterContext({ projectName, dateFrom: filters.dateFrom, dateTo: filters.dateTo }),
    });
  };

  const s = data.summary;

  type DeptRow = (typeof data.byDepartment)[number];
  type CatRow = (typeof data.byCategory)[number];

  const deptColumns = useMemo((): DataTableColumn<DeptRow>[] => [
    { key: "dept", header: "Department", cell: (r) => <span className="font-medium">{r.display}</span>, sortValue: (r) => r.display },
    { key: "allocated", header: "Allocated", cell: (r) => formatCrore(r.allocated), align: "right", sortValue: (r) => r.allocated },
    { key: "committed", header: "Committed", cell: (r) => formatCrore(r.committed), align: "right", sortValue: (r) => r.committed },
    { key: "paid", header: "Paid", cell: (r) => formatCrore(r.paid), align: "right", sortValue: (r) => r.paid },
    { key: "outstanding", header: "Outstanding", cell: (r) => formatCrore(r.outstanding), align: "right", sortValue: (r) => r.outstanding },
    { key: "variance", header: "Variance", cell: (r) => <span className={r.variance < 0 ? "text-red-400" : ""}>{formatCrore(r.variance)}</span>, align: "right", sortValue: (r) => r.variance },
  ], []);

  const catColumns = useMemo((): DataTableColumn<CatRow>[] => [
    { key: "cat", header: "Category", cell: (r) => <span className="font-medium">{r.category}</span>, sortValue: (r) => r.category },
    { key: "committed", header: "Committed", cell: (r) => formatCrore(r.committed), align: "right", sortValue: (r) => r.committed },
    { key: "paid", header: "Paid", cell: (r) => formatCrore(r.paid), align: "right", sortValue: (r) => r.paid },
    { key: "deposits", header: "Deposits", cell: (r) => formatCrore(r.deposits), align: "right", sortValue: (r) => r.deposits },
    { key: "outstanding", header: "Outstanding", cell: (r) => formatCrore(r.outstanding), align: "right", sortValue: (r) => r.outstanding },
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
        <StatCard label="Approved Budget" value={formatCrore(s.totalApprovedBudget)} />
        <StatCard label="Committed" value={formatCrore(s.totalCommitted)} />
        <StatCard label="Paid" value={formatCrore(s.totalPaid)} />
        <StatCard label="Outstanding" value={formatCrore(s.totalOutstanding)} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Deposits" value={formatCrore(s.totalDeposits)} />
        <StatCard label="PO Commitment" value={formatCrore(s.poCommitment)} />
        <StatCard label="Available Budget" value={formatCrore(s.availableBudget)} />
        <StatCard label="Budget Utilization" value={`${data.utilization}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {data.categoryChart.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">By Category (₹ Lakhs)</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer label="Budget by category bar chart" height={300}>
                <BarChart data={data.categoryChart} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="committed" fill={seriesColors[0]} name="Committed" />
                  <Bar dataKey="paid" fill={seriesColors[2]} name="Paid" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
        {data.projectChart.length > 0 && !projectId && (
          <Card>
            <CardHeader><CardTitle className="text-sm">By Project (₹ Lakhs)</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer label="Budget by project bar chart" height={300}>
                <BarChart data={data.projectChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="committed" fill={seriesColors[0]} name="Committed" />
                  <Bar dataKey="paid" fill={seriesColors[2]} name="Paid" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {data.byDepartment.length > 0 && (
        <>
          <h3 className="text-sm font-semibold">Department Breakdown</h3>
          <DataTable columns={deptColumns} rows={data.byDepartment} rowKey={(r) => r.departmentKey} caption="Department breakdown" />
        </>
      )}

      {data.byCategory.length > 0 && (
        <>
          <h3 className="text-sm font-semibold">Category Breakdown</h3>
          <DataTable columns={catColumns} rows={data.byCategory} rowKey={(r) => r.category} caption="Category breakdown" />
        </>
      )}

      {data.pos.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Purchase Order Summary (separate from expense totals)</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3 mb-3">
              {Object.entries(data.poStatusCounts).map(([status, count]) => (
                <Badge key={status} variant="outline" className="text-xs">{status}: {count}</Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">Total PO Value: <span className="font-semibold text-foreground">{formatCrore(data.poTotal)}</span></p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
