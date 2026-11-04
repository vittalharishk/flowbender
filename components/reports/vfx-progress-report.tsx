"use client";

import { useMemo } from "react";
import { Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { useAppDataSlice } from "@/lib/app-data-store";
import { calcVfxStats } from "@/lib/vfx-store";
import { exportToCsv, formatFilterContext } from "@/lib/report-export";
import { filterByProject } from "@/lib/report-utils";
import type { ReportFilterState } from "./report-filters";
import type { VfxShot } from "@/lib/types";

const COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];
const STATUS_COLORS: Record<string, string> = { briefed: "#3b82f6", "in-progress": "#f59e0b", "client-review": "#8b5cf6", final: "#10b981" };

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
    return (
      <Card><CardContent className="p-8 text-center text-muted-foreground">
        No VFX shot data available{projectId ? " for this project" : ""}.
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
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <KPI label="Total Shots" value={String(data.stats.total)} />
        <KPI label="Briefed" value={String(data.stats.briefed)} tone="text-blue-400" />
        <KPI label="In Progress" value={String(data.stats.inProgress)} tone="text-amber-400" />
        <KPI label="Client Review" value={String(data.stats.inReview)} tone="text-purple-400" />
        <KPI label="Final" value={String(data.stats.final)} tone="text-emerald-400" />
        <KPI label="Overdue" value={String(data.stats.overdue)} tone={data.stats.overdue > 0 ? "text-red-400" : "text-foreground"} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {data.statusChart.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Status Distribution</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={data.statusChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {data.statusChart.map((d, i) => (
                      <Cell key={i} fill={STATUS_COLORS[d.name.toLowerCase().replace(" ", "-")] || COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
        {data.vendorChart.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Shots by Vendor</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.vendorChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#f59e0b" name="Shots" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardHeader><CardTitle className="text-sm">VFX Shots Detail</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-xs text-muted-foreground">
                <th className="p-3">Shot Code</th><th className="p-3">Sequence</th><th className="p-3">Status</th>
                <th className="p-3">Priority</th><th className="p-3">Vendor</th><th className="p-3">Due Date</th>
                <th className="p-3">Versions</th>
              </tr></thead>
              <tbody>
                {data.rows.map((r) => (
                  <tr key={r.id} className={`border-b last:border-0 hover:bg-muted/30 ${r.isOverdue ? "bg-red-500/5" : ""}`}>
                    <td className="p-3 font-medium">{r.shotCode}</td>
                    <td className="p-3">{r.sequence}</td>
                    <td className="p-3"><Badge variant="outline" className="text-xs">{r.status}</Badge></td>
                    <td className="p-3">
                      <Badge variant="outline" className={`text-xs ${r.priority === "high" ? "border-red-500/30 text-red-400" : r.priority === "medium" ? "border-amber-500/30 text-amber-400" : ""}`}>
                        {r.priority}
                      </Badge>
                    </td>
                    <td className="p-3">{r.vendorId || <span className="text-muted-foreground">Unassigned</span>}</td>
                    <td className="p-3">
                      {r.dueDate}
                      {r.isOverdue && <Badge variant="outline" className="ml-1 text-xs border-red-500/30 text-red-400">Overdue</Badge>}
                    </td>
                    <td className="p-3">{r.versionsCount}</td>
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
