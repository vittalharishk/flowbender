"use client";

import { useMemo } from "react";
import { Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useAccountsDashboard } from "@/lib/accounts-store";
import { exportToCsv, formatFilterContext } from "@/lib/report-export";
import { formatCrore } from "@/lib/report-utils";
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
    return (
      <Card><CardContent className="p-8 text-center text-muted-foreground">
        No department data available{projectId ? " for this project" : ""}.
      </CardContent></Card>
    );
  }

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
        <KPI label="Departments (with activity)" value={String(data.activeDepts)} />
        <KPI label="Total Allocated" value={formatCrore(data.totalAllocated)} />
        <KPI label="Total Committed" value={formatCrore(data.totalCommitted)} tone="text-amber-400" />
        <KPI label="Total Paid" value={formatCrore(data.totalPaid)} tone="text-emerald-400" />
      </div>

      {/* Chart */}
      {data.chart.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Department Committed vs Paid (₹ Lakhs)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={Math.max(250, data.chart.length * 35)}>
              <BarChart data={data.chart} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="committed" fill="#f59e0b" name="Committed" />
                <Bar dataKey="paid" fill="#10b981" name="Paid" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Department Detail</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-xs text-muted-foreground">
                <th className="p-3">Department</th><th className="p-3 text-right">Allocated</th>
                <th className="p-3 text-right">Committed</th><th className="p-3 text-right">Paid</th>
                <th className="p-3 text-right">Outstanding</th><th className="p-3 text-right">Available</th>
                <th className="p-3 text-right">Variance</th>
              </tr></thead>
              <tbody>
                {data.depts.map((d) => (
                  <tr key={d.departmentKey} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3 font-medium">{d.display}</td>
                    <td className="p-3 text-right">{formatCrore(d.allocated)}</td>
                    <td className="p-3 text-right">{formatCrore(d.committed)}</td>
                    <td className="p-3 text-right">{formatCrore(d.paid)}</td>
                    <td className="p-3 text-right">{formatCrore(d.outstanding)}</td>
                    <td className="p-3 text-right">{formatCrore(d.available)}</td>
                    <td className={`p-3 text-right ${d.variance < 0 ? "text-red-400" : ""}`}>{formatCrore(d.variance)}</td>
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
    <Card><CardContent className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-xl font-semibold mt-1 ${tone}`}>{value}</p>
    </CardContent></Card>
  );
}
