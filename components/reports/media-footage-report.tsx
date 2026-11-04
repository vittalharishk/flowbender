"use client";

import { useMemo } from "react";
import { Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { useAppDataSlice } from "@/lib/app-data-store";
import { useCameraCards, useStorageDevices, useFootageMetadata, useMediaAssets, calcMediaStats } from "@/lib/media-store";
import type { MediaVersion } from "@/lib/media-store";
import { exportToCsv, formatFilterContext } from "@/lib/report-export";
import { formatCrore, pct } from "@/lib/report-utils";
import type { ReportFilterState } from "./report-filters";

const COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

interface Props {
  projectId?: string;
  filters: ReportFilterState;
  projectName: string;
}

export function MediaFootageReport({ projectId, filters, projectName }: Props) {
  const cards = useCameraCards(projectId);
  const storage = useStorageDevices(projectId);
  const footage = useFootageMetadata(projectId);
  const assets = useMediaAssets(projectId);
  const allVersions = useAppDataSlice("mediaVersions") as MediaVersion[];

  const data = useMemo(() => {
    const stats = calcMediaStats(cards, storage, footage);
    const versions = assets.length > 0
      ? allVersions.filter((v) => assets.some((a) => a.id === v.assetId))
      : allVersions;

    const versionCounts = {
      total: versions.length,
      active: versions.filter((v) => v.status === "active").length,
      superseded: versions.filter((v) => v.status === "superseded").length,
      rejected: versions.filter((v) => v.status === "rejected").length,
    };

    const byType: Record<string, number> = {};
    for (const a of assets) {
      byType[a.mediaType] = (byType[a.mediaType] || 0) + 1;
    }
    const typeChart = Object.entries(byType).map(([name, value]) => ({ name, value }));

    const storageChart = storage.map((s) => ({
      name: s.deviceId,
      capacity: s.capacity,
      used: s.used,
    }));

    return { stats, versionCounts, typeChart, storageChart };
  }, [cards, storage, footage, assets, allVersions]);

  const handleExport = () => {
    exportToCsv(assets, [
      { header: "Title", accessor: (r) => r.title },
      { header: "Type", accessor: (r) => r.mediaType },
      { header: "Status", accessor: (r) => r.status },
      { header: "Current Version", accessor: (r) => r.currentVersion },
      { header: "Tags", accessor: (r) => r.tags.join(", ") },
    ], {
      filename: "media-footage-report",
      title: "Media & Footage Report",
      filters: formatFilterContext({ projectName, dateFrom: filters.dateFrom, dateTo: filters.dateTo }),
    });
  };

  if (assets.length === 0 && cards.length === 0 && storage.length === 0 && footage.length === 0) {
    return (
      <Card><CardContent className="p-8 text-center text-muted-foreground">
        No media or footage data available{projectId ? " for this project" : ""}.
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
        <KPI label="Total Assets" value={String(assets.length)} />
        <KPI label="Camera Cards" value={String(data.stats.cards.total)} sub={`${data.stats.cards.active} active`} />
        <KPI label="Storage Devices" value={String(data.stats.storage.devices)} sub={`${data.stats.storage.usagePercent}% used`} />
        <KPI label="Footage Records" value={String(data.stats.footage.total)} sub={`${data.stats.footage.synced} synced`} />
      </div>

      {/* Version summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI label="Total Versions" value={String(data.versionCounts.total)} />
        <KPI label="Active Versions" value={String(data.versionCounts.active)} tone="text-emerald-400" />
        <KPI label="Superseded" value={String(data.versionCounts.superseded)} tone="text-amber-400" />
        <KPI label="Rejected" value={String(data.versionCounts.rejected)} tone="text-red-400" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {data.typeChart.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Assets by Type</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={data.typeChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {data.typeChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
        {data.storageChart.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Storage Usage (GB)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.storageChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip />
                  <Bar dataKey="capacity" fill="#3b82f6" name="Capacity" />
                  <Bar dataKey="used" fill="#f59e0b" name="Used" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Assets table */}
      {assets.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Media Assets</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="p-3">Title</th><th className="p-3">Type</th><th className="p-3">Status</th>
                  <th className="p-3">Version</th><th className="p-3">Tags</th>
                </tr></thead>
                <tbody>
                  {assets.map((a) => (
                    <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3 font-medium">{a.title}</td>
                      <td className="p-3">{a.mediaType}</td>
                      <td className="p-3"><Badge variant="outline" className="text-xs">{a.status}</Badge></td>
                      <td className="p-3">v{a.currentVersion}</td>
                      <td className="p-3 text-muted-foreground text-xs">{a.tags.join(", ") || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function KPI({ label, value, sub, tone = "text-foreground" }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <Card><CardContent className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-xl font-semibold mt-1 ${tone}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </CardContent></Card>
  );
}
