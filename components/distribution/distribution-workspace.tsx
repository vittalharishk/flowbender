"use client";

import { useState, useMemo } from "react";
import {
  BarChart3,
  Globe,
  IndianRupee,
  Megaphone,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Film,
  Layers,
  TrendingUp,
} from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { useRightsDeals, useDistributionAgreements, useDistributionReleases, useDistributionRevenue, useDistributionSettlements, useDeliverables, calcDistributionStats } from "@/lib/distribution-store";
import { useProjects } from "@/lib/project-store";
import { formatINR } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

function KpiCard({ label, value, icon: Icon, tone = "text-foreground" }: { label: string; value: string; icon: typeof Megaphone; tone?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{label}</span>
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <p className={`text-xl font-semibold mt-2 ${tone}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function dealStatusColor(status: string) {
  switch (status) {
    case "signed": return "border-emerald-500/30 text-emerald-500 bg-emerald-500/10";
    case "negotiating": return "border-amber-500/30 text-amber-500 bg-amber-500/10";
    case "open": return "border-blue-500/30 text-blue-500 bg-blue-500/10";
    default: return "border-muted-foreground/30 text-muted-foreground bg-muted/30";
  }
}

function agreementStatusColor(status: string) {
  switch (status) {
    case "active": return "border-emerald-500/30 text-emerald-500 bg-emerald-500/10";
    case "negotiating": case "pending-approval": return "border-amber-500/30 text-amber-500 bg-amber-500/10";
    case "draft": return "border-blue-500/30 text-blue-500 bg-blue-500/10";
    case "expired": case "terminated": case "cancelled": return "border-red-500/30 text-red-500 bg-red-500/10";
    default: return "border-muted-foreground/30 text-muted-foreground bg-muted/30";
  }
}

function releaseStatusColor(status: string) {
  switch (status) {
    case "released": return "border-emerald-500/30 text-emerald-500 bg-emerald-500/10";
    case "confirmed": return "border-blue-500/30 text-blue-500 bg-blue-500/10";
    case "planned": return "border-amber-500/30 text-amber-500 bg-amber-500/10";
    case "postponed": return "border-red-500/30 text-red-500 bg-red-500/10";
    case "cancelled": return "border-muted-foreground/30 text-muted-foreground bg-muted/30";
    default: return "";
  }
}

function collectionStatusColor(status: string) {
  switch (status) {
    case "collected": return "border-emerald-500/30 text-emerald-500 bg-emerald-500/10";
    case "pending": case "partial": return "border-amber-500/30 text-amber-500 bg-amber-500/10";
    case "overdue": case "disputed": return "border-red-500/30 text-red-500 bg-red-500/10";
    default: return "border-muted-foreground/30 text-muted-foreground bg-muted/30";
  }
}

function deliverableStatusColor(status: string) {
  switch (status) {
    case "delivered": return "border-emerald-500/30 text-emerald-500 bg-emerald-500/10";
    case "ready": return "border-blue-500/30 text-blue-500 bg-blue-500/10";
    case "in-progress": return "border-amber-500/30 text-amber-500 bg-amber-500/10";
    case "pending": return "border-muted-foreground/30 text-muted-foreground bg-muted/30";
    default: return "";
  }
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="p-8 text-center text-muted-foreground">
        <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">{message}</p>
      </CardContent>
    </Card>
  );
}

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

  return (
    <div className="space-y-4 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/10 flex items-center justify-center shrink-0">
            <Megaphone className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-bold">Distribution & Rights</h2>
              {pid && <Badge variant="outline" className="text-xs">{projects.find((p) => p.id === pid)?.title}</Badge>}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Manage territories, rights, agreements, releases, revenue, and deliverables.
            </p>
          </div>
        </div>
        <Select value={projectId} onValueChange={setProjectId}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard label="Total Rights Value" value={formatINR(stats.totalMG)} icon={IndianRupee} tone="text-emerald-400" />
        <KpiCard label="Advance Received" value={formatINR(stats.totalAdvance)} icon={TrendingUp} tone="text-cyan-400" />
        <KpiCard label="Receivable" value={formatINR(stats.totalReceivable)} icon={IndianRupee} tone="text-amber-400" />
        <KpiCard label="Signed Deals" value={String(stats.signedDeals)} icon={CheckCircle2} />
        <KpiCard label="Active Agreements" value={String(activeAgreements)} icon={FileText} />
        <KpiCard label="Upcoming Releases" value={String(upcomingReleases)} icon={Film} />
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

        {/* ── Overview ─────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Deals by Rights Type</CardTitle></CardHeader>
              <CardContent>
                {channelChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={channelChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name} (${value})`}>
                        {channelChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-muted-foreground text-center py-8">No deals data</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Top Territories by MG (₹ Cr)</CardTitle></CardHeader>
              <CardContent>
                {territoryChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={territoryChartData} layout="vertical" margin={{ left: 10, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v: number) => `₹${v} Cr`} />
                      <Legend />
                      <Bar dataKey="MG" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="Advance" fill="#10b981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-muted-foreground text-center py-8">No territory data</p>}
              </CardContent>
            </Card>
          </div>

          {/* Alerts */}
          {(stats.expiringAgreements.length > 0 || stats.overdueCollections.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {stats.expiringAgreements.length > 0 && (
                <Card className="border-amber-500/30">
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /> Expiring Agreements (30 days)</CardTitle></CardHeader>
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
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-500" /> Overdue Collections</CardTitle></CardHeader>
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

        {/* ── Rights & Deals ───────────────────────────── */}
        <TabsContent value="rights" className="space-y-4 mt-4">
          <div className="flex items-center gap-3">
            <Select value={rightsFilter} onValueChange={setRightsFilter}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Filter by type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {["theatrical", "satellite", "digital", "audio", "dubbed", "remake", "broadcast", "ancillary"].map((t) => (
                  <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">{filteredDeals.length} deal{filteredDeals.length !== 1 ? "s" : ""}</span>
          </div>
          {filteredDeals.length === 0 ? <EmptyState message="No rights deals found for the selected filters." /> : (
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="px-4 py-3 font-medium">Territory</th>
                      <th className="px-4 py-3 font-medium">Distributor</th>
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-right">MG</th>
                      <th className="px-4 py-3 font-medium text-right">Advance</th>
                      <th className="px-4 py-3 font-medium text-right">Balance</th>
                      <th className="px-4 py-3 font-medium">Delivery</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDeals.map((d) => (
                      <tr key={d.id} className="border-b hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{d.territory}</td>
                        <td className="px-4 py-3">{d.distributor}</td>
                        <td className="px-4 py-3 capitalize">{d.rightsType}</td>
                        <td className="px-4 py-3"><Badge variant="outline" className={`text-xs ${dealStatusColor(d.status)}`}>{d.status}</Badge></td>
                        <td className="px-4 py-3 text-right font-mono">{formatINR(d.minimumGuarantee)}</td>
                        <td className="px-4 py-3 text-right font-mono">{formatINR(d.advanceReceived)}</td>
                        <td className="px-4 py-3 text-right font-mono">{formatINR(d.minimumGuarantee - d.advanceReceived)}</td>
                        <td className="px-4 py-3"><Badge variant="outline" className={`text-xs ${d.deliveryStatus === "complete" ? "text-emerald-500" : d.deliveryStatus === "partial" ? "text-amber-500" : "text-muted-foreground"}`}>{d.deliveryStatus}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Agreements ───────────────────────────────── */}
        <TabsContent value="agreements" className="space-y-4 mt-4">
          {agreements.length === 0 ? <EmptyState message="No distribution agreements found. Agreements will appear here once created." /> : (
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="px-4 py-3 font-medium">Distributor</th>
                      <th className="px-4 py-3 font-medium">Channel</th>
                      <th className="px-4 py-3 font-medium">Territories</th>
                      <th className="px-4 py-3 font-medium text-right">Value</th>
                      <th className="px-4 py-3 font-medium text-right">Advance</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Start</th>
                      <th className="px-4 py-3 font-medium">End</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agreements.map((a) => (
                      <tr key={a.id} className="border-b hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{a.distributorName}</td>
                        <td className="px-4 py-3 capitalize">{a.channel.replace("-", " ")}</td>
                        <td className="px-4 py-3 max-w-[200px] truncate">{a.territories.join(", ")}</td>
                        <td className="px-4 py-3 text-right font-mono">{formatINR(a.agreementValue)}</td>
                        <td className="px-4 py-3 text-right font-mono">{formatINR(a.advancePaid)}</td>
                        <td className="px-4 py-3"><Badge variant="outline" className={`text-xs ${agreementStatusColor(a.status)}`}>{a.status}</Badge></td>
                        <td className="px-4 py-3 text-muted-foreground">{a.startDate}</td>
                        <td className="px-4 py-3 text-muted-foreground">{a.endDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Releases ─────────────────────────────────── */}
        <TabsContent value="releases" className="space-y-4 mt-4">
          {releases.length === 0 ? <EmptyState message="No releases scheduled. Release plans will appear here once created." /> : (
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="px-4 py-3 font-medium">Title</th>
                      <th className="px-4 py-3 font-medium">Channel</th>
                      <th className="px-4 py-3 font-medium">Territory</th>
                      <th className="px-4 py-3 font-medium">Planned</th>
                      <th className="px-4 py-3 font-medium">Actual</th>
                      <th className="px-4 py-3 font-medium">Window</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {releases.map((r) => (
                      <tr key={r.id} className="border-b hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{r.title}</td>
                        <td className="px-4 py-3 capitalize">{r.channel.replace("-", " ")}</td>
                        <td className="px-4 py-3">{r.territory}</td>
                        <td className="px-4 py-3 text-muted-foreground">{r.plannedDate}</td>
                        <td className="px-4 py-3 text-muted-foreground">{r.actualDate || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{r.windowStart && r.windowEnd ? `${r.windowStart} – ${r.windowEnd}` : "—"}</td>
                        <td className="px-4 py-3"><Badge variant="outline" className={`text-xs ${releaseStatusColor(r.status)}`}>{r.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Revenue ──────────────────────────────────── */}
        <TabsContent value="revenue" className="space-y-4 mt-4">
          {revenue.length === 0 ? <EmptyState message="No revenue records found. Revenue and collection records will appear here." /> : (
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium text-right">Amount</th>
                      <th className="px-4 py-3 font-medium">Territory</th>
                      <th className="px-4 py-3 font-medium">Channel</th>
                      <th className="px-4 py-3 font-medium">Due Date</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenue.map((r) => (
                      <tr key={r.id} className="border-b hover:bg-muted/30">
                        <td className="px-4 py-3 capitalize">{r.revenueType.replace("-", " ")}</td>
                        <td className="px-4 py-3 text-right font-mono">{formatINR(r.amount)}</td>
                        <td className="px-4 py-3">{r.territory || "—"}</td>
                        <td className="px-4 py-3 capitalize">{r.channel?.replace("-", " ") || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{r.dueDate || "—"}</td>
                        <td className="px-4 py-3"><Badge variant="outline" className={`text-xs ${collectionStatusColor(r.status)}`}>{r.status}</Badge></td>
                        <td className="px-4 py-3 text-muted-foreground">{r.referenceNumber || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Deliverables ─────────────────────────────── */}
        <TabsContent value="deliverables" className="space-y-4 mt-4">
          {deliverables.length === 0 ? <EmptyState message="No deliverables found for the selected project." /> : (
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Format</th>
                      <th className="px-4 py-3 font-medium">Territory</th>
                      <th className="px-4 py-3 font-medium">Due Date</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliverables.map((d) => (
                      <tr key={d.id} className="border-b hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{d.name}</td>
                        <td className="px-4 py-3">{d.format}</td>
                        <td className="px-4 py-3">{d.territory}</td>
                        <td className="px-4 py-3 text-muted-foreground">{d.dueDate}</td>
                        <td className="px-4 py-3"><Badge variant="outline" className={`text-xs ${deliverableStatusColor(d.status)}`}>{d.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
