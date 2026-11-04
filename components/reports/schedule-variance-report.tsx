"use client";

import { useMemo } from "react";
import { Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppDataSlice } from "@/lib/app-data-store";
import { useMilestones } from "@/lib/post-prod-store";
import { usePreProdChecklist } from "@/lib/pre-prod-store";
import { exportToCsv, formatFilterContext } from "@/lib/report-export";
import { calcVarianceDays, varianceStatus, filterByProject, filterByDateRange } from "@/lib/report-utils";
import type { ReportFilterState } from "./report-filters";
import type { VarianceItem } from "@/lib/report-utils";

interface Props {
  projectId?: string;
  filters: ReportFilterState;
  projectName: string;
}

export function ScheduleVarianceReport({ projectId, filters, projectName }: Props) {
  const scheduleEntries = useAppDataSlice("scheduleEntries");
  const shootDays = useAppDataSlice("shootDays");
  const milestones = useMilestones(projectId);
  const preProd = usePreProdChecklist(projectId);

  const items = useMemo((): VarianceItem[] => {
    const result: VarianceItem[] = [];

    const filteredSchedule = filterByProject(scheduleEntries, projectId);
    for (const entry of filteredSchedule) {
      const planned = entry.date;
      const actual = entry.status === "completed" ? entry.date : undefined;
      result.push({
        id: entry.id,
        label: `Shoot Day ${entry.shootDayNumber} — ${entry.location}`,
        plannedDate: planned,
        actualDate: actual,
        varianceDays: calcVarianceDays(planned, actual),
        status: varianceStatus(planned, actual),
      });
    }

    for (const ms of milestones) {
      result.push({
        id: ms.id,
        label: `[Post] ${ms.title}`,
        plannedDate: ms.targetDate,
        actualDate: ms.actualDate,
        varianceDays: calcVarianceDays(ms.targetDate, ms.actualDate),
        status: varianceStatus(ms.targetDate, ms.actualDate),
      });
    }

    for (const item of preProd) {
      const actual = item.status === "done" ? item.dueDate : undefined;
      result.push({
        id: item.id,
        label: `[Pre-Prod] ${item.title}`,
        plannedDate: item.dueDate,
        actualDate: actual,
        varianceDays: calcVarianceDays(item.dueDate, actual),
        status: varianceStatus(item.dueDate, actual),
      });
    }

    const dateFiltered = filterByDateRange(result, (r) => r.plannedDate, { from: filters.dateFrom, to: filters.dateTo });
    return dateFiltered;
  }, [scheduleEntries, milestones, preProd, projectId, filters.dateFrom, filters.dateTo]);

  const stats = useMemo(() => {
    const onTime = items.filter((i) => i.status === "on-time").length;
    const delayed = items.filter((i) => i.status === "delayed").length;
    const ahead = items.filter((i) => i.status === "ahead").length;
    const pending = items.filter((i) => i.status === "pending").length;
    return { total: items.length, onTime, delayed, ahead, pending };
  }, [items]);

  const chartData = useMemo(() => {
    return [
      { name: "On Time", value: stats.onTime, fill: "#10b981" },
      { name: "Delayed", value: stats.delayed, fill: "#ef4444" },
      { name: "Ahead", value: stats.ahead, fill: "#3b82f6" },
      { name: "Pending", value: stats.pending, fill: "#6b7280" },
    ].filter((d) => d.value > 0);
  }, [stats]);

  const handleExport = () => {
    exportToCsv(items, [
      { header: "Item", accessor: (r) => r.label },
      { header: "Planned Date", accessor: (r) => r.plannedDate || "—" },
      { header: "Actual Date", accessor: (r) => r.actualDate || "—" },
      { header: "Variance (days)", accessor: (r) => r.varianceDays },
      { header: "Status", accessor: (r) => r.status },
    ], {
      filename: "schedule-variance",
      title: "Schedule Variance Report",
      filters: formatFilterContext({ projectId, projectName, dateFrom: filters.dateFrom, dateTo: filters.dateTo }),
    });
  };

  if (items.length === 0) {
    return <Card><CardContent className="p-8 text-center text-muted-foreground">No schedule data available for the selected filters.</CardContent></Card>;
  }

  const statusColor = (s: string) => {
    switch (s) {
      case "on-time": return "border-emerald-500/30 text-emerald-400";
      case "delayed": return "border-red-500/30 text-red-400";
      case "ahead": return "border-blue-500/30 text-blue-400";
      default: return "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Generated at {new Date().toLocaleString()}</p>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}><Download className="w-3.5 h-3.5" /> CSV</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI label="Total Items" value={String(stats.total)} />
        <KPI label="On Time" value={String(stats.onTime)} tone="text-emerald-400" />
        <KPI label="Delayed" value={String(stats.delayed)} tone="text-red-400" />
        <KPI label="Pending" value={String(stats.pending)} />
      </div>

      {chartData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Variance Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((d, i) => <rect key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-sm">Variance Details</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="text-left p-3">Item</th>
                  <th className="text-left p-3">Planned</th>
                  <th className="text-left p-3">Actual</th>
                  <th className="text-right p-3">Variance (days)</th>
                  <th className="text-left p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.slice(0, 100).map((item) => (
                  <tr key={item.id} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-medium max-w-[250px] truncate">{item.label}</td>
                    <td className="p-3">{item.plannedDate || "—"}</td>
                    <td className="p-3">{item.actualDate || "—"}</td>
                    <td className={`p-3 text-right font-medium ${item.varianceDays > 0 ? "text-red-400" : item.varianceDays < 0 ? "text-blue-400" : ""}`}>
                      {item.varianceDays > 0 ? `+${item.varianceDays}` : item.varianceDays}
                    </td>
                    <td className="p-3"><Badge variant="outline" className={`text-xs ${statusColor(item.status)}`}>{item.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {items.length > 100 && <p className="text-xs text-muted-foreground text-center py-2">Showing first 100 of {items.length} items.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KPI({ label, value, tone = "text-foreground" }: { label: string; value: string; tone?: string }) {
  return <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={`text-lg font-semibold mt-1 ${tone}`}>{value}</p></CardContent></Card>;
}
