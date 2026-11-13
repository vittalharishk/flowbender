"use client";

import { useMemo } from "react";
import { Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { useAppDataSlice } from "@/lib/app-data-store";
import { useCameraCards, useStorageDevices, useFootageMetadata, useMediaAssets, calcMediaStats } from "@/lib/media-store";
import type { MediaVersion } from "@/lib/media-store";
import { exportToCsv, formatFilterContext } from "@/lib/report-export";
import { formatCrore, pct } from "@/lib/report-utils";
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
    return <EmptyState title="No media data" description={`No media or footage data available${projectId ? " for this project" : ""}.`} />;
  }

  type AssetRow = (typeof assets)[number];

  const assetColumns = useMemo((): DataTableColumn<AssetRow>[] => [
    { key: "title", header: "Title", cell: (r) => <span className="font-medium">{r.title}</span>, sortValue: (r) => r.title },
    { key: "type", header: "Type", cell: (r) => r.mediaType, sortValue: (r) => r.mediaType },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
    { key: "version", header: "Version", cell: (r) => `v${r.currentVersion}` },
    { key: "tags", header: "Tags", cell: (r) => <span className="text-muted-foreground text-xs">{r.tags.join(", ") || "—"}</span> },
  ], []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Generated: {new Date().toLocaleString()}</p>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}><Download className="w-3.5 h-3.5" /> CSV</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Assets" value={String(assets.length)} />
        <StatCard label="Camera Cards" value={String(data.stats.cards.total)} hint={`${data.stats.cards.active} active`} />
        <StatCard label="Storage Devices" value={String(data.stats.storage.devices)} hint={`${data.stats.storage.usagePercent}% used`} />
        <StatCard label="Footage Records" value={String(data.stats.footage.total)} hint={`${data.stats.footage.synced} synced`} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Versions" value={String(data.versionCounts.total)} />
        <StatCard label="Active Versions" value={String(data.versionCounts.active)} />
        <StatCard label="Superseded" value={String(data.versionCounts.superseded)} />
        <StatCard label="Rejected" value={String(data.versionCounts.rejected)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {data.typeChart.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Assets by Type</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer label="Assets by type pie chart" height={250}>
                <PieChart>
                  <Pie data={data.typeChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {data.typeChart.map((_, i) => <Cell key={i} fill={seriesColors[i % seriesColors.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
        {data.storageChart.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Storage Usage (GB)</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer label="Storage usage bar chart" height={250}>
                <BarChart data={data.storageChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip />
                  <Bar dataKey="capacity" fill={seriesColors[1]} name="Capacity" />
                  <Bar dataKey="used" fill={seriesColors[0]} name="Used" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {assets.length > 0 && (
        <>
          <h3 className="text-sm font-semibold">Media Assets</h3>
          <DataTable columns={assetColumns} rows={assets} rowKey={(r) => r.id} caption="Media assets" />
        </>
      )}
    </div>
  );
}
