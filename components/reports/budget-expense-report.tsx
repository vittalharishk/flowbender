"use client";

import { useMemo } from "react";
import { Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useAccountsDashboard, useConsolidatedExpenses } from "@/lib/accounts-store";
import { useAppDataSlice } from "@/lib/app-data-store";
import { exportToCsv, formatFilterContext } from "@/lib/report-export";
import { formatCrore, pct, filterByProject } from "@/lib/report-utils";
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Generated: {new Date().toLocaleString()}</p>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}>
          <Download className="w-3.5 h-3.5" /> CSV
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI label="Approved Budget" value={formatCrore(s.totalApprovedBudget)} />
        <KPI label="Committed" value={formatCrore(s.totalCommitted)} tone="text-amber-400" />
        <KPI label="Paid" value={formatCrore(s.totalPaid)} tone="text-emerald-400" />
        <KPI label="Outstanding" value={formatCrore(s.totalOutstanding)} tone={s.totalOutstanding > 0 ? "text-red-400" : "text-foreground"} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI label="Deposits" value={formatCrore(s.totalDeposits)} />
        <KPI label="PO Commitment" value={formatCrore(s.poCommitment)} />
        <KPI label="Available Budget" value={formatCrore(s.availableBudget)} tone={s.availableBudget >= 0 ? "text-emerald-400" : "text-red-400"} />
        <KPI label="Budget Utilization" value={`${data.utilization}%`} tone={data.utilization > 100 ? "text-red-400" : data.utilization > 80 ? "text-amber-400" : "text-foreground"} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {data.categoryChart.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">By Category (₹ Lakhs)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.categoryChart} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="committed" fill="#f59e0b" name="Committed" />
                  <Bar dataKey="paid" fill="#10b981" name="Paid" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
        {data.projectChart.length > 0 && !projectId && (
          <Card>
            <CardHeader><CardTitle className="text-sm">By Project (₹ Lakhs)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.projectChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="committed" fill="#f59e0b" name="Committed" />
                  <Bar dataKey="paid" fill="#10b981" name="Paid" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Department table */}
      {data.byDepartment.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Department Breakdown</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="p-3">Department</th><th className="p-3 text-right">Allocated</th>
                  <th className="p-3 text-right">Committed</th><th className="p-3 text-right">Paid</th>
                  <th className="p-3 text-right">Outstanding</th><th className="p-3 text-right">Variance</th>
                </tr></thead>
                <tbody>
                  {data.byDepartment.map((d) => (
                    <tr key={d.departmentKey} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3 font-medium">{d.display}</td>
                      <td className="p-3 text-right">{formatCrore(d.allocated)}</td>
                      <td className="p-3 text-right">{formatCrore(d.committed)}</td>
                      <td className="p-3 text-right">{formatCrore(d.paid)}</td>
                      <td className="p-3 text-right">{formatCrore(d.outstanding)}</td>
                      <td className={`p-3 text-right ${d.variance < 0 ? "text-red-400" : ""}`}>{formatCrore(d.variance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category table */}
      {data.byCategory.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Category Breakdown</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="p-3">Category</th><th className="p-3 text-right">Committed</th>
                  <th className="p-3 text-right">Paid</th><th className="p-3 text-right">Deposits</th>
                  <th className="p-3 text-right">Outstanding</th>
                </tr></thead>
                <tbody>
                  {data.byCategory.map((c) => (
                    <tr key={c.category} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3 font-medium">{c.category}</td>
                      <td className="p-3 text-right">{formatCrore(c.committed)}</td>
                      <td className="p-3 text-right">{formatCrore(c.paid)}</td>
                      <td className="p-3 text-right">{formatCrore(c.deposits)}</td>
                      <td className="p-3 text-right">{formatCrore(c.outstanding)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PO Summary */}
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

function KPI({ label, value, tone = "text-foreground" }: { label: string; value: string; tone?: string }) {
  return (
    <Card><CardContent className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-xl font-semibold mt-1 ${tone}`}>{value}</p>
    </CardContent></Card>
  );
}
