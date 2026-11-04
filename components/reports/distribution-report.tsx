"use client";

import { useMemo } from "react";
import { Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { useRightsDeals, useDistributionAgreements, useDistributionRevenue, calcDistributionStats } from "@/lib/distribution-store";
import { formatINR } from "@/lib/utils";
import { exportToCsv, formatFilterContext, type CsvColumn } from "@/lib/report-export";
import { formatCrore } from "@/lib/report-utils";
import type { ReportFilterState } from "./report-filters";
import type { RightsDeal } from "@/lib/types";

const COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

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

  const columns: CsvColumn<RightsDeal>[] = [
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
    return (
      <Card><CardContent className="p-8 text-center text-muted-foreground">
        No distribution data available for the selected filters.
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Generated: {new Date().toLocaleString()} | {filterCtx}</p>
        <Button variant="outline" size="sm" className="gap-1" onClick={() => exportToCsv(deals, columns, { filename: "distribution-report", title: "Distribution Report", filters: filterCtx })}>
          <Download className="w-3.5 h-3.5" /> CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Rights Value</p><p className="text-xl font-semibold mt-1">{formatCrore(stats.totalMG)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Advance Received</p><p className="text-xl font-semibold mt-1 text-emerald-500">{formatCrore(stats.totalAdvance)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Receivable</p><p className="text-xl font-semibold mt-1 text-amber-500">{formatCrore(stats.totalReceivable)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Signed / Total Deals</p><p className="text-xl font-semibold mt-1">{stats.signedDeals} / {stats.totalDeals}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Revenue by Rights Type</CardTitle></CardHeader>
          <CardContent>
            {channelData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={channelData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ₹${value.toFixed(1)} Cr`}>
                    {channelData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => `₹${value.toFixed(2)} Cr`} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-8">No channel data</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Top Territories by MG</CardTitle></CardHeader>
          <CardContent>
            {territoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={territoryData} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(v) => `₹${v} Cr`} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: number) => `₹${value.toFixed(2)} Cr`} />
                  <Legend />
                  <Bar dataKey="MG" fill="#f59e0b" name="Minimum Guarantee" />
                  <Bar dataKey="Advance" fill="#10b981" name="Advance Received" />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-8">No territory data</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Rights Deals</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 pr-3">Territory</th>
                <th className="pb-2 pr-3">Distributor</th>
                <th className="pb-2 pr-3">Type</th>
                <th className="pb-2 pr-3">Status</th>
                <th className="pb-2 pr-3 text-right">MG</th>
                <th className="pb-2 pr-3 text-right">Advance</th>
                <th className="pb-2 text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((deal) => (
                <tr key={deal.id} className="border-b border-border/50">
                  <td className="py-2 pr-3">{deal.territory}</td>
                  <td className="py-2 pr-3">{deal.distributor}</td>
                  <td className="py-2 pr-3"><Badge variant="outline" className="text-xs">{deal.rightsType}</Badge></td>
                  <td className="py-2 pr-3">
                    <Badge variant="outline" className={`text-xs ${deal.status === "signed" ? "border-emerald-500/30 text-emerald-500" : deal.status === "negotiating" ? "border-amber-500/30 text-amber-500" : ""}`}>
                      {deal.status}
                    </Badge>
                  </td>
                  <td className="py-2 pr-3 text-right">{formatINR(deal.minimumGuarantee)}</td>
                  <td className="py-2 pr-3 text-right">{formatINR(deal.advanceReceived)}</td>
                  <td className="py-2 text-right">{formatINR(deal.minimumGuarantee - deal.advanceReceived)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {stats.expiringAgreements.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm text-amber-500">Expiring Agreements (30 days)</CardTitle></CardHeader>
          <CardContent>
            {stats.expiringAgreements.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div><p className="text-sm font-medium">{a.distributorName}</p><p className="text-xs text-muted-foreground">{a.territories.join(", ")}</p></div>
                <p className="text-xs text-amber-500">Expires: {a.endDate}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
