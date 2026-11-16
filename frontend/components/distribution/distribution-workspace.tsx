"use client";

import { useState, useMemo } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Film,
  IndianRupee,
  Megaphone,
  TrendingUp,
} from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { useRightsDeals, useDistributionAgreements, useDistributionReleases, useDistributionRevenue, useDistributionSettlements, useDeliverables, calcDistributionStats } from "@/lib/distribution-store";
import { useProjects } from "@/lib/project-store";
import { formatINR } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { StatusBadge } from "@/components/app/status-badge";
import { DataTable, type DataTableColumn } from "@/components/app/data-table";
import { ChartContainer, seriesColors } from "@/components/app/chart-container";
import { EmptyState } from "@/components/app/empty-state";
import { RecordManager } from "@/components/app/record-manager";

export function DistributionWorkspace() {
  const projects = useProjects();
  const [projectId, setProjectId] = useState("all");
  const pid = projectId === "all" ? undefined : projectId;

  const deals = useRightsDeals(pid);
  const agreements = useDistributionAgreements(pid);
  const releases = useDistributionReleases(pid);
  const revenue = useDistributionRevenue(pid);
  const settlements = useDistributionSettlements(pid);
  const deliverables = useDeliverables(pid);

  const stats = useMemo(() => calcDistributionStats(deals, agreements, revenue), [deals, agreements, revenue]);

  const activeAgreements = useMemo(() => agreements.filter((a) => a.status === "active").length, [agreements]);
  const upcomingReleases = useMemo(() => releases.filter((r) => r.status === "planned" || r.status === "confirmed").length, [releases]);

  const channelChartData = useMemo(() => {
    return Object.entries(stats.byChannel).map(([name, val]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: val.count,
      mg: val.mg,
    }));
  }, [stats.byChannel]);

  const territoryChartData = useMemo(() => {
    return Object.entries(stats.byTerritory)
      .sort((a, b) => b[1].mg - a[1].mg)
      .slice(0, 8)
      .map(([name, val]) => ({
        name: name.length > 20 ? name.slice(0, 19) + "…" : name,
        MG: Math.round(val.mg / 1e7),
        Advance: Math.round(val.advance / 1e7),
      }));
  }, [stats.byTerritory]);

  const [rightsFilter, setRightsFilter] = useState("all");

  const filteredDeals = useMemo(() => {
    if (rightsFilter === "all") return deals;
    return deals.filter((d) => d.rightsType === rightsFilter);
  }, [deals, rightsFilter]);

  /* DataTable column definitions */
  type Deal = (typeof deals)[number];
  const dealColumns: DataTableColumn<Deal>[] = [
    { key: "territory", header: "Territory", cell: (r) => <span className="font-medium">{r.territory}</span>, sortValue: (r) => r.territory },
    { key: "distributor", header: "Distributor", cell: (r) => r.distributor, sortValue: (r) => r.distributor },
    { key: "type", header: "Type", cell: (r) => <span className="capitalize">{r.rightsType}</span>, sortValue: (r) => r.rightsType },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} />, sortValue: (r) => r.status },
    { key: "mg", header: "MG", cell: (r) => <span className="font-mono">{formatINR(r.minimumGuarantee)}</span>, sortValue: (r) => r.minimumGuarantee, align: "right" },
    { key: "advance", header: "Advance", cell: (r) => <span className="font-mono">{formatINR(r.advanceReceived)}</span>, sortValue: (r) => r.advanceReceived, align: "right" },
    { key: "balance", header: "Balance", cell: (r) => <span className="font-mono">{formatINR(r.minimumGuarantee - r.advanceReceived)}</span>, sortValue: (r) => r.minimumGuarantee - r.advanceReceived, align: "right" },
    { key: "delivery", header: "Delivery", cell: (r) => <StatusBadge status={r.deliveryStatus} />, sortValue: (r) => r.deliveryStatus },
  ];

  type Agreement = (typeof agreements)[number];
  const agreementColumns: DataTableColumn<Agreement>[] = [
    { key: "dist", header: "Distributor", cell: (r) => <span className="font-medium">{r.distributorName}</span>, sortValue: (r) => r.distributorName },
    { key: "channel", header: "Channel", cell: (r) => <span className="capitalize">{r.channel.replace("-", " ")}</span>, sortValue: (r) => r.channel },
    { key: "territories", header: "Territories", cell: (r) => <span className="max-w-[200px] truncate block">{r.territories.join(", ")}</span> },
    { key: "value", header: "Value", cell: (r) => <span className="font-mono">{formatINR(r.agreementValue)}</span>, sortValue: (r) => r.agreementValue, align: "right" },
    { key: "advance", header: "Advance", cell: (r) => <span className="font-mono">{formatINR(r.advancePaid)}</span>, sortValue: (r) => r.advancePaid, align: "right" },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} />, sortValue: (r) => r.status },
    { key: "start", header: "Start", cell: (r) => <span className="text-muted-foreground">{r.startDate}</span>, sortValue: (r) => r.startDate },
    { key: "end", header: "End", cell: (r) => <span className="text-muted-foreground">{r.endDate}</span>, sortValue: (r) => r.endDate },
  ];

  type Release = (typeof releases)[number];
  const releaseColumns: DataTableColumn<Release>[] = [
    { key: "title", header: "Title", cell: (r) => <span className="font-medium">{r.title}</span>, sortValue: (r) => r.title },
    { key: "channel", header: "Channel", cell: (r) => <span className="capitalize">{r.channel.replace("-", " ")}</span>, sortValue: (r) => r.channel },
    { key: "territory", header: "Territory", cell: (r) => r.territory, sortValue: (r) => r.territory },
    { key: "planned", header: "Planned", cell: (r) => <span className="text-muted-foreground">{r.plannedDate}</span>, sortValue: (r) => r.plannedDate },
    { key: "actual", header: "Actual", cell: (r) => <span className="text-muted-foreground">{r.actualDate || "—"}</span>, sortValue: (r) => r.actualDate || "" },
    { key: "window", header: "Window", cell: (r) => <span className="text-muted-foreground text-xs">{r.windowStart && r.windowEnd ? `${r.windowStart} – ${r.windowEnd}` : "—"}</span> },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} />, sortValue: (r) => r.status },
  ];

  type Revenue = (typeof revenue)[number];
  const revenueColumns: DataTableColumn<Revenue>[] = [
    { key: "type", header: "Type", cell: (r) => <span className="capitalize">{r.revenueType.replace("-", " ")}</span>, sortValue: (r) => r.revenueType },
    { key: "amount", header: "Amount", cell: (r) => <span className="font-mono">{formatINR(r.amount)}</span>, sortValue: (r) => r.amount, align: "right" },
    { key: "territory", header: "Territory", cell: (r) => r.territory || "—", sortValue: (r) => r.territory || "" },
    { key: "channel", header: "Channel", cell: (r) => <span className="capitalize">{r.channel?.replace("-", " ") || "—"}</span>, sortValue: (r) => r.channel || "" },
    { key: "due", header: "Due Date", cell: (r) => <span className="text-muted-foreground">{r.dueDate || "—"}</span>, sortValue: (r) => r.dueDate || "" },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} />, sortValue: (r) => r.status },
    { key: "ref", header: "Reference", cell: (r) => <span className="text-muted-foreground">{r.referenceNumber || "—"}</span> },
  ];

  type Deliverable = (typeof deliverables)[number];
  const deliverableColumns: DataTableColumn<Deliverable>[] = [
    { key: "name", header: "Name", cell: (r) => <span className="font-medium">{r.name}</span>, sortValue: (r) => r.name },
    { key: "format", header: "Format", cell: (r) => r.format, sortValue: (r) => r.format },
    { key: "territory", header: "Territory", cell: (r) => r.territory, sortValue: (r) => r.territory },
    { key: "due", header: "Due Date", cell: (r) => <span className="text-muted-foreground">{r.dueDate}</span>, sortValue: (r) => r.dueDate },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} />, sortValue: (r) => r.status },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        as="h1"
        title="Distribution & Rights"
        description="Manage territories, rights, agreements, releases, revenue, and deliverables."
        icon={Megaphone}
        badge={pid ? <Badge variant="outline" className="text-xs">{projects.find((p) => p.id === pid)?.title}</Badge> : undefined}
        actions={
          <div>
            <Label htmlFor="dist-project-filter" className="sr-only">Project</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger id="dist-project-filter" aria-label="Filter by project" className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All projects</SelectItem>
                {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        }
      />
      <div className="flex flex-wrap justify-end gap-2">
        <RecordManager source="app" sliceKey="rightsDeals" label="Rights deal" />
        <RecordManager source="app" sliceKey="distributionAgreements" label="Agreement" />
        <RecordManager source="app" sliceKey="distributionReleases" label="Release" />
        <RecordManager source="app" sliceKey="distributionRevenue" label="Revenue entry" />
        <RecordManager source="app" sliceKey="distributionSettlements" label="Settlement" />
        <RecordManager source="app" sliceKey="deliverables" label="Deliverable" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard label="Total Rights Value" value={formatINR(stats.totalMG)} icon={IndianRupee} />
        <StatCard label="Advance Received" value={formatINR(stats.totalAdvance)} icon={TrendingUp} />
        <StatCard label="Receivable" value={formatINR(stats.totalReceivable)} icon={IndianRupee} />
        <StatCard label="Signed Deals" value={String(stats.signedDeals)} icon={CheckCircle2} />
        <StatCard label="Active Agreements" value={String(activeAgreements)} icon={FileText} />
        <StatCard label="Upcoming Releases" value={String(upcomingReleases)} icon={Film} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rights">Rights & Deals</TabsTrigger>
          <TabsTrigger value="agreements">Agreements</TabsTrigger>
          <TabsTrigger value="releases">Releases</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><div className="text-base font-semibold leading-none tracking-tight">Deals by Rights Type</div></CardHeader>
              <CardContent>
                {channelChartData.length > 0 ? (
                  <ChartContainer label="Deals by rights type chart" height={280}>
                    <PieChart>
                      <Pie data={channelChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name} (${value})`}>
                        {channelChartData.map((_, i) => <Cell key={i} fill={seriesColors[i % seriesColors.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ChartContainer>
                ) : <p className="text-sm text-muted-foreground text-center py-8">No deals data</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><div className="text-base font-semibold leading-none tracking-tight">Top Territories by MG (INR Cr)</div></CardHeader>
              <CardContent>
                {territoryChartData.length > 0 ? (
                  <ChartContainer label="Top territories by MG chart" height={280}>
                    <BarChart data={territoryChartData} layout="vertical" margin={{ left: 10, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v: number) => `₹${v} Cr`} />
                      <Legend />
                      <Bar dataKey="MG" fill={seriesColors[0]} radius={[0, 4, 4, 0]} />
                      <Bar dataKey="Advance" fill={seriesColors[2]} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ChartContainer>
                ) : <p className="text-sm text-muted-foreground text-center py-8">No territory data</p>}
              </CardContent>
            </Card>
          </div>

          {/* Alerts */}
          {(stats.expiringAgreements.length > 0 || stats.overdueCollections.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {stats.expiringAgreements.length > 0 && (
                <Card className="border-amber-500/30">
                  <CardHeader><div className="text-base font-semibold leading-none tracking-tight flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" aria-hidden="true" /> Expiring Agreements (30 days)</div></CardHeader>
                  <CardContent className="space-y-2">
                    {stats.expiringAgreements.map((a) => (
                      <div key={a.id} className="flex justify-between items-center text-sm p-2 rounded bg-amber-500/5">
                        <span>{a.distributorName}</span>
                        <span className="text-muted-foreground">{a.endDate}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
              {stats.overdueCollections.length > 0 && (
                <Card className="border-red-500/30">
                  <CardHeader><div className="text-base font-semibold leading-none tracking-tight flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-500" aria-hidden="true" /> Overdue Collections</div></CardHeader>
                  <CardContent className="space-y-2">
                    {stats.overdueCollections.map((r) => (
                      <div key={r.id} className="flex justify-between items-center text-sm p-2 rounded bg-red-500/5">
                        <span>{r.revenueType} — {formatINR(r.amount)}</span>
                        <span className="text-muted-foreground">Due: {r.dueDate}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* Rights & Deals */}
        <TabsContent value="rights" className="space-y-4 mt-4">
          <div className="flex items-center gap-3">
            <Label htmlFor="rights-type-filter" className="sr-only">Filter by rights type</Label>
            <Select value={rightsFilter} onValueChange={setRightsFilter}>
              <SelectTrigger id="rights-type-filter" className="w-48"><SelectValue placeholder="Filter by type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {["theatrical", "satellite", "digital", "audio", "dubbed", "remake", "broadcast", "ancillary"].map((t) => (
                  <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">{filteredDeals.length} deal{filteredDeals.length !== 1 ? "s" : ""}</span>
          </div>
          {filteredDeals.length === 0 ? <EmptyState title="No rights deals" description="No rights deals found for the selected filters." icon={FileText} /> : (
            <Card>
              <CardContent className="pt-4">
                <DataTable columns={dealColumns} rows={filteredDeals} rowKey={(r) => r.id} caption="Rights deals" />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Agreements */}
        <TabsContent value="agreements" className="space-y-4 mt-4">
          {agreements.length === 0 ? <EmptyState title="No agreements" description="No distribution agreements found. Agreements will appear here once created." icon={FileText} /> : (
            <Card>
              <CardContent className="pt-4">
                <DataTable columns={agreementColumns} rows={agreements} rowKey={(r) => r.id} caption="Distribution agreements" />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Releases */}
        <TabsContent value="releases" className="space-y-4 mt-4">
          {releases.length === 0 ? <EmptyState title="No releases" description="No releases scheduled. Release plans will appear here once created." icon={Film} /> : (
            <Card>
              <CardContent className="pt-4">
                <DataTable columns={releaseColumns} rows={releases} rowKey={(r) => r.id} caption="Distribution releases" />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Revenue */}
        <TabsContent value="revenue" className="space-y-4 mt-4">
          {revenue.length === 0 ? <EmptyState title="No revenue records" description="No revenue records found. Revenue and collection records will appear here." icon={IndianRupee} /> : (
            <Card>
              <CardContent className="pt-4">
                <DataTable columns={revenueColumns} rows={revenue} rowKey={(r) => r.id} caption="Revenue records" />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Deliverables */}
        <TabsContent value="deliverables" className="space-y-4 mt-4">
          {deliverables.length === 0 ? <EmptyState title="No deliverables" description="No deliverables found for the selected project." icon={FileText} /> : (
            <Card>
              <CardContent className="pt-4">
                <DataTable columns={deliverableColumns} rows={deliverables} rowKey={(r) => r.id} caption="Deliverables" />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
