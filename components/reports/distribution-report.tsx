"use client";

import { useMemo } from "react";
import { Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { useRightsDeals, useDistributionAgreements, useDistributionRevenue, calcDistributionStats } from "@/lib/distribution-store";
import { formatINR } from "@/lib/utils";
import { exportToCsv, formatFilterContext, type CsvColumn } from "@/lib/report-export";
import { formatCrore } from "@/lib/report-utils";
import { StatCard } from "@/components/app/stat-card";
import { StatusBadge } from "@/components/app/status-badge";
import { ChartContainer, seriesColors } from "@/components/app/chart-container";
import { DataTable, type DataTableColumn } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import type { ReportFilterState } from "./report-filters";
import type { RightsDeal } from "@/lib/types";

export function DistributionReport({ projectId, filters, projectName }: { projectId?: string; filters: ReportFilterState; projectName: string }) {
  const deals = useRightsDeals(projectId);
  const agreements = useDistributionAgreements(projectId);
  const revenue = useDistributionRevenue(projectId);

  const stats = useMemo(() => calcDistributionStats(deals, agreements, revenue), [deals, agreements, revenue]);

  const channelData = useMemo(() =>
    Object.entries(stats.byChannel).map(([channel, data]) => ({
      name: channel, deals: data.count, value: data.mg / 1e7,
    })).sort((a, b) => b.value - a.value),
  [stats.byChannel]);

  const territoryData = useMemo(() =>
    Object.entries(stats.byTerritory).map(([territory, data]) => ({
      name: territory.length > 20 ? territory.slice(0, 19) + "…" : territory,
      MG: data.mg / 1e7, Advance: data.advance / 1e7,
    })).sort((a, b) => b.MG - a.MG).slice(0, 10),
  [stats.byTerritory]);

  const filterCtx = formatFilterContext({ projectName, dateFrom: filters.dateFrom, dateTo: filters.dateTo });

  const csvColumns: CsvColumn<RightsDeal>[] = [
    { header: "Territory", accessor: (r) => r.territory },
    { header: "Distributor", accessor: (r) => r.distributor },
    { header: "Rights Type", accessor: (r) => r.rightsType },
    { header: "Status", accessor: (r) => r.status },
    { header: "Minimum Guarantee", accessor: (r) => r.minimumGuarantee },
    { header: "Advance Received", accessor: (r) => r.advanceReceived },
    { header: "Balance", accessor: (r) => r.minimumGuarantee - r.advanceReceived },
    { header: "Delivery Status", accessor: (r) => r.deliveryStatus },
  ];

  if (deals.length === 0) {
    return <EmptyState title="No distribution data" description="No distribution data available for the selected filters." />;
  }

  const dealColumns = useMemo((): DataTableColumn<RightsDeal>[] => [
    { key: "territory", header: "Territory", cell: (d) => d.territory, sortValue: (d) => d.territory },
    { key: "distributor", header: "Distributor", cell: (d) => d.distributor, sortValue: (d) => d.distributor },
    { key: "type", header: "Type", cell: (d) => <StatusBadge status={d.rightsType} tone="neutral" /> },
    { key: "status", header: "Status", cell: (d) => <StatusBadge status={d.status} /> },
    { key: "mg", header: "MG", cell: (d) => formatINR(d.minimumGuarantee), align: "right", sortValue: (d) => d.minimumGuarantee },
    { key: "advance", header: "Advance", cell: (d) => formatINR(d.advanceReceived), align: "right", sortValue: (d) => d.advanceReceived },
    { key: "balance", header: "Balance", cell: (d) => formatINR(d.minimumGuarantee - d.advanceReceived), align: "right", sortValue: (d) => d.minimumGuarantee - d.advanceReceived },
  ], []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Generated: {new Date().toLocaleString()} | {filterCtx}</p>
        <Button variant="outline" size="sm" className="gap-1" onClick={() => exportToCsv(deals, csvColumns, { filename: "distribution-report", title: "Distribution Report", filters: filterCtx })}>
          <Download className="w-3.5 h-3.5" /> CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Rights Value" value={formatCrore(stats.totalMG)} />
        <StatCard label="Advance Received" value={formatCrore(stats.totalAdvance)} />
        <StatCard label="Receivable" value={formatCrore(stats.totalReceivable)} />
        <StatCard label="Signed / Total Deals" value={`${stats.signedDeals} / ${stats.totalDeals}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Revenue by Rights Type</CardTitle></CardHeader>
          <CardContent>
            {channelData.length > 0 ? (
              <ChartContainer label="Revenue by rights type pie chart" height={250}>
                <PieChart>
                  <Pie data={channelData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ₹${value.toFixed(1)} Cr`}>
                    {channelData.map((_, i) => <Cell key={i} fill={seriesColors[i % seriesColors.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => `₹${value.toFixed(2)} Cr`} />
                </PieChart>
              </ChartContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-8">No channel data</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Top Territories by MG</CardTitle></CardHeader>
          <CardContent>
            {territoryData.length > 0 ? (
              <ChartContainer label="Top territories by MG bar chart" height={250}>
                <BarChart data={territoryData} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(v) => `₹${v} Cr`} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: number) => `₹${value.toFixed(2)} Cr`} />
                  <Legend />
                  <Bar dataKey="MG" fill={seriesColors[0]} name="Minimum Guarantee" />
                  <Bar dataKey="Advance" fill={seriesColors[2]} name="Advance Received" />
                </BarChart>
              </ChartContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-8">No territory data</p>}
          </CardContent>
        </Card>
      </div>

      <h3 className="text-sm font-semibold">Rights Deals</h3>
      <DataTable columns={dealColumns} rows={deals} rowKey={(d) => d.id} caption="Rights deals" />

      {stats.expiringAgreements.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm text-amber-600 dark:text-amber-400">Expiring Agreements (30 days)</CardTitle></CardHeader>
          <CardContent>
            {stats.expiringAgreements.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div><p className="text-sm font-medium">{a.distributorName}</p><p className="text-xs text-muted-foreground">{a.territories.join(", ")}</p></div>
                <p className="text-xs text-amber-600 dark:text-amber-400">Expires: {a.endDate}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
