"use client";

import { useMemo } from "react";
import { Clock, Download } from "lucide-react";
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/app/stat-card";
import { StatusBadge } from "@/components/app/status-badge";
import { DataTable, type DataTableColumn } from "@/components/app/data-table";
import { ChartContainer, seriesColors } from "@/components/app/chart-container";
import { EmptyState } from "@/components/app/empty-state";
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
      { name: "On Time", value: stats.onTime, fill: seriesColors[2] },
      { name: "Delayed", value: stats.delayed, fill: seriesColors[3] },
      { name: "Ahead", value: stats.ahead, fill: seriesColors[1] },
      { name: "Pending", value: stats.pending, fill: seriesColors[4] },
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
    return <EmptyState title="No schedule data" description="No schedule data available for the selected filters." icon={Clock} />;
  }

  const columns: DataTableColumn<VarianceItem>[] = [
    { key: "label", header: "Item", cell: (r) => <span className="font-medium max-w-[250px] truncate block">{r.label}</span>, sortValue: (r) => r.label },
    { key: "planned", header: "Planned", cell: (r) => r.plannedDate || "—", sortValue: (r) => r.plannedDate || "" },
    { key: "actual", header: "Actual", cell: (r) => r.actualDate || "—", sortValue: (r) => r.actualDate || "" },
    { key: "variance", header: "Variance (days)", cell: (r) => <span className={`font-medium ${r.varianceDays > 0 ? "text-red-600 dark:text-red-400" : r.varianceDays < 0 ? "text-blue-600 dark:text-blue-400" : ""}`}>{r.varianceDays > 0 ? `+${r.varianceDays}` : r.varianceDays}</span>, sortValue: (r) => r.varianceDays, align: "right" },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} />, sortValue: (r) => r.status },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Generated at {new Date().toLocaleString()}</p>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}><Download className="w-3.5 h-3.5" /> CSV</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Items" value={String(stats.total)} icon={Clock} />
        <StatCard label="On Time" value={String(stats.onTime)} />
        <StatCard label="Delayed" value={String(stats.delayed)} />
        <StatCard label="Pending" value={String(stats.pending)} />
      </div>

      {chartData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Variance Distribution</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer label="Schedule variance distribution chart" height={260}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-sm">Variance Details</CardTitle></CardHeader>
        <CardContent>
          <DataTable columns={columns} rows={items} rowKey={(r) => r.id} caption="Schedule variance details" />
        </CardContent>
      </Card>
    </div>
  );
}
