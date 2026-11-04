"use client";

import { useMemo } from "react";
import { Download } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEquipmentInventory, useEquipmentAllocations, useEquipmentMaintenance, calcEquipmentStats } from "@/lib/equipment-store";
import { exportToCsv, formatFilterContext } from "@/lib/report-export";
import { pct } from "@/lib/report-utils";
import type { ReportFilterState } from "./report-filters";

const COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

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
      { name: "Available", value: stats.available, fill: "#10b981" },
      { name: "Reserved", value: stats.reserved, fill: "#f59e0b" },
      { name: "In Use", value: stats.inUse, fill: "#3b82f6" },
      { name: "Maintenance", value: stats.maintenance, fill: "#ef4444" },
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
    return <Card><CardContent className="p-8 text-center text-muted-foreground">No equipment data available for the selected filters.</CardContent></Card>;
  }

  const statusColor = (s: string) => {
    switch (s) {
      case "available": return "border-emerald-500/30 text-emerald-400";
      case "in-use": return "border-blue-500/30 text-blue-400";
      case "reserved": return "border-amber-500/30 text-amber-400";
      case "maintenance": return "border-red-500/30 text-red-400";
      default: return "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Generated at {new Date().toLocaleString()}</p>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}><Download className="w-3.5 h-3.5" /> CSV</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KPI label="Total Equipment" value={String(stats.total)} />
        <KPI label="Available" value={String(stats.available)} tone="text-emerald-400" />
        <KPI label="In Use" value={String(stats.inUse)} tone="text-blue-400" />
        <KPI label="Under Maintenance" value={String(stats.maintenance)} tone="text-red-400" />
        <KPI label="Utilization" value={`${utilization}%`} tone="text-amber-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {statusPieData.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Status Distribution</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={statusPieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {statusPieData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {categoryChartData.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Equipment by Category</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={categoryChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Bar dataKey="count" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Equipment Details</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Category</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-right p-3">Qty</th>
                  <th className="text-right p-3">Active Alloc.</th>
                  <th className="text-left p-3">Last Maintenance</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((r) => (
                  <tr key={r.id} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-medium">{r.name}</td>
                    <td className="p-3">{r.category}</td>
                    <td className="p-3"><Badge variant="outline" className={`text-xs ${statusColor(r.status)}`}>{r.status}</Badge></td>
                    <td className="p-3 text-right">{r.quantity}</td>
                    <td className="p-3 text-right">{r.activeAllocations}</td>
                    <td className="p-3">{r.lastMaintenance}</td>
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
  return <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={`text-lg font-semibold mt-1 ${tone}`}>{value}</p></CardContent></Card>;
}
