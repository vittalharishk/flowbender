"use client";

import { useMemo } from "react";
import { Download } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEquipmentInventory, useEquipmentAllocations, useEquipmentMaintenance, calcEquipmentStats } from "@/lib/equipment-store";
import { exportToCsv, formatFilterContext } from "@/lib/report-export";
import { pct } from "@/lib/report-utils";
import { StatCard } from "@/components/app/stat-card";
import { StatusBadge } from "@/components/app/status-badge";
import { ChartContainer, seriesColors } from "@/components/app/chart-container";
import { DataTable, type DataTableColumn } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import type { ReportFilterState } from "./report-filters";

interface Props {
  projectId?: string;
  filters: ReportFilterState;
  projectName: string;
}

export function EquipmentUtilizationReport({ projectId, filters, projectName }: Props) {
  const equipment = useEquipmentInventory(projectId);
  const allocations = useEquipmentAllocations(projectId);
  const maintenance = useEquipmentMaintenance();

  const stats = useMemo(() => calcEquipmentStats(equipment), [equipment]);

  const utilization = useMemo(() => {
    if (stats.total === 0) return 0;
    return pct(stats.total - stats.available, stats.total);
  }, [stats]);

  const statusPieData = useMemo(() => {
    return [
      { name: "Available", value: stats.available, fill: seriesColors[2] },
      { name: "Reserved", value: stats.reserved, fill: seriesColors[0] },
      { name: "In Use", value: stats.inUse, fill: seriesColors[1] },
      { name: "Maintenance", value: stats.maintenance, fill: seriesColors[3] },
    ].filter((d) => d.value > 0);
  }, [stats]);

  const categoryChartData = useMemo(() => {
    return Object.entries(stats.byCategory)
      .map(([name, value]) => ({ name, count: value }))
      .sort((a, b) => b.count - a.count);
  }, [stats.byCategory]);

  const tableRows = useMemo(() => {
    return equipment.map((eq) => {
      const eqAllocations = allocations.filter(
        (a) => a.equipmentId === eq.id && (a.status === "active" || a.status === "pending")
      );
      const activeAllocated = eqAllocations.reduce((s, a) => s + (a.quantity - a.returnedQuantity), 0);

      const eqMaintenance = maintenance.filter((m) => m.equipmentId === eq.id);
      const lastMaint = eqMaintenance
        .filter((m) => m.status === "completed" && m.completedDate)
        .sort((a, b) => (b.completedDate || "").localeCompare(a.completedDate || ""))[0];

      return {
        id: eq.id,
        name: eq.name,
        category: eq.category,
        status: eq.status,
        quantity: eq.quantity,
        activeAllocations: activeAllocated,
        lastMaintenance: lastMaint?.completedDate || "—",
      };
    });
  }, [equipment, allocations, maintenance]);

  const handleExport = () => {
    exportToCsv(tableRows, [
      { header: "Name", accessor: (r) => r.name },
      { header: "Category", accessor: (r) => r.category },
      { header: "Status", accessor: (r) => r.status },
      { header: "Quantity", accessor: (r) => r.quantity },
      { header: "Active Allocations", accessor: (r) => r.activeAllocations },
      { header: "Last Maintenance", accessor: (r) => r.lastMaintenance },
    ], {
      filename: "equipment-utilization",
      title: "Equipment Utilization Report",
      filters: formatFilterContext({ projectId, projectName }),
    });
  };

  if (equipment.length === 0) {
    return <EmptyState title="No equipment data" description="No equipment data available for the selected filters." />;
  }

  type EqRow = (typeof tableRows)[number];

  const columns = useMemo((): DataTableColumn<EqRow>[] => [
    { key: "name", header: "Name", cell: (r) => <span className="font-medium">{r.name}</span>, sortValue: (r) => r.name },
    { key: "category", header: "Category", cell: (r) => r.category, sortValue: (r) => r.category },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
    { key: "qty", header: "Qty", cell: (r) => r.quantity, align: "right", sortValue: (r) => r.quantity },
    { key: "alloc", header: "Active Alloc.", cell: (r) => r.activeAllocations, align: "right", sortValue: (r) => r.activeAllocations },
    { key: "maint", header: "Last Maintenance", cell: (r) => r.lastMaintenance },
  ], []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Generated at {new Date().toLocaleString()}</p>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}><Download className="w-3.5 h-3.5" /> CSV</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Total Equipment" value={String(stats.total)} />
        <StatCard label="Available" value={String(stats.available)} />
        <StatCard label="In Use" value={String(stats.inUse)} />
        <StatCard label="Under Maintenance" value={String(stats.maintenance)} />
        <StatCard label="Utilization" value={`${utilization}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {statusPieData.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Status Distribution</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer label="Equipment status distribution pie chart" height={260}>
                <PieChart>
                  <Pie data={statusPieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {statusPieData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {categoryChartData.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Equipment by Category</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer label="Equipment by category bar chart" height={260}>
                <BarChart data={categoryChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Bar dataKey="count" fill={seriesColors[2]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
      </div>

      <h3 className="text-sm font-semibold">Equipment Details</h3>
      <DataTable columns={columns} rows={tableRows} rowKey={(r) => r.id} caption="Equipment details" />
    </div>
  );
}
