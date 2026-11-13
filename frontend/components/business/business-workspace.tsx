"use client";

import { useState, useMemo } from "react";
import {
  Briefcase,
  IndianRupee,
  TrendingUp,
  Landmark,
  Music,
  Flame,
} from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import {
  useInvestorProjects,
  useLoans,
  useBrandingDeals,
  useFundingTranches,
  useOstReceivables,
  useBurnRecords,
  useBusinessDashboard,
} from "@/lib/business-store";
import type { OstReceivable, BurnRecord } from "@/lib/business-store";
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
import { InvestorsWorkspace } from "./investors-workspace";
import { LoansWorkspace } from "./loans-workspace";
import { BrandingWorkspace } from "./branding-workspace";
import { TranchesWorkspace } from "./tranches-workspace";

export function BusinessWorkspace() {
  const projects = useProjects();
  const [projectId, setProjectId] = useState("all");
  const pid = projectId === "all" ? undefined : projectId;

  const dashboard = useBusinessDashboard(pid);
  const ost = useOstReceivables(pid);
  const burn = useBurnRecords(pid);

  const fundingSourceData = useMemo(() => {
    const sources: Record<string, number> = {};
    if (dashboard.investmentReceived > 0) sources["Investors"] = dashboard.investmentReceived;
    if (dashboard.tranchesReceived > 0) sources["Tranches"] = dashboard.tranchesReceived;
    if (dashboard.outstandingPrincipal > 0) sources["Loans"] = dashboard.outstandingPrincipal;
    return Object.entries(sources).map(([name, value]) => ({ name, value }));
  }, [dashboard]);

  const burnByDept = useMemo(() => {
    const depts: Record<string, { budget: number; actual: number }> = {};
    burn.forEach((b) => {
      const dept = b.department || "Other";
      if (!depts[dept]) depts[dept] = { budget: 0, actual: 0 };
      depts[dept].budget += b.budget;
      depts[dept].actual += b.actualSpend;
    });
    return Object.entries(depts).map(([name, v]) => ({ name, Budget: v.budget, Actual: v.actual }));
  }, [burn]);

  const ostColumns: DataTableColumn<OstReceivable>[] = [
    { key: "label", header: "Music Label", cell: (r) => <span className="font-medium">{r.musicLabel}</span>, sortValue: (r) => r.musicLabel },
    { key: "contract", header: "Contract Value", cell: (r) => <span className="font-mono">{formatINR(r.contractValue)}</span>, sortValue: (r) => r.contractValue, align: "right" },
    { key: "invoiced", header: "Invoiced", cell: (r) => <span className="font-mono">{formatINR(r.invoicedAmount)}</span>, sortValue: (r) => r.invoicedAmount, align: "right" },
    { key: "received", header: "Received", cell: (r) => <span className="font-mono">{formatINR(r.receivedAmount)}</span>, sortValue: (r) => r.receivedAmount, align: "right" },
    { key: "outstanding", header: "Outstanding", cell: (r) => <span className="font-mono">{formatINR(r.outstandingAmount)}</span>, sortValue: (r) => r.outstandingAmount, align: "right" },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} />, sortValue: (r) => r.status },
  ];

  const burnColumns: DataTableColumn<BurnRecord>[] = [
    { key: "dept", header: "Department", cell: (r) => <span className="font-medium">{r.department || "—"}</span>, sortValue: (r) => r.department || "" },
    { key: "period", header: "Period", cell: (r) => <span className="text-muted-foreground text-xs">{r.periodStart} – {r.periodEnd}</span> },
    { key: "budget", header: "Budget", cell: (r) => <span className="font-mono">{formatINR(r.budget)}</span>, sortValue: (r) => r.budget, align: "right" },
    { key: "actual", header: "Actual", cell: (r) => <span className="font-mono">{formatINR(r.actualSpend)}</span>, sortValue: (r) => r.actualSpend, align: "right" },
    { key: "committed", header: "Committed", cell: (r) => <span className="font-mono">{formatINR(r.committedSpend)}</span>, sortValue: (r) => r.committedSpend, align: "right" },
    { key: "variance", header: "Variance", cell: (r) => <span className="font-mono">{formatINR(r.variance)}</span>, sortValue: (r) => r.variance, align: "right" },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        as="h1"
        title="Business & Finance"
        description="Investors, loans, branding deals, funding tranches, OST receivables, and burn tracking."
        icon={Briefcase}
        badge={pid ? <Badge variant="outline" className="text-xs">{projects.find((p) => p.id === pid)?.title}</Badge> : undefined}
        actions={
          <div>
            <Label htmlFor="biz-project-filter" className="sr-only">Project</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger id="biz-project-filter" aria-label="Filter by project" className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All projects</SelectItem>
                {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard label="Investment Committed" value={formatINR(dashboard.investmentCommitted)} icon={IndianRupee} />
        <StatCard label="Investment Received" value={formatINR(dashboard.investmentReceived)} icon={TrendingUp} />
        <StatCard label="Outstanding Loans" value={formatINR(dashboard.outstandingPrincipal)} icon={Landmark} />
        <StatCard label="Branding Receivables" value={formatINR(dashboard.brandingReceivables)} icon={IndianRupee} />
        <StatCard label="OST Receivables" value={formatINR(dashboard.ostReceivables)} icon={Music} />
        <StatCard label="Burn vs Budget" value={`${formatINR(dashboard.totalBurn)} / ${formatINR(dashboard.totalBudget)}`} icon={Flame} />
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="investors">Investors</TabsTrigger>
          <TabsTrigger value="loans">Loans</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="tranches">Tranches</TabsTrigger>
          <TabsTrigger value="ost">OST</TabsTrigger>
          <TabsTrigger value="burn">Burn</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><div className="text-base font-semibold leading-none tracking-tight">Funding Sources</div></CardHeader>
              <CardContent>
                {fundingSourceData.length > 0 ? (
                  <ChartContainer label="Funding sources chart" height={280}>
                    <PieChart>
                      <Pie data={fundingSourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name} (${formatINR(value)})`}>
                        {fundingSourceData.map((_, i) => <Cell key={i} fill={seriesColors[i % seriesColors.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatINR(v)} />
                    </PieChart>
                  </ChartContainer>
                ) : <p className="text-sm text-muted-foreground text-center py-8">No funding data</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><div className="text-base font-semibold leading-none tracking-tight">Burn by Department</div></CardHeader>
              <CardContent>
                {burnByDept.length > 0 ? (
                  <ChartContainer label="Burn by department chart" height={280}>
                    <BarChart data={burnByDept} margin={{ left: 10, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${Math.round(v / 1e5)}L`} />
                      <Tooltip formatter={(v: number) => formatINR(v)} />
                      <Legend />
                      <Bar dataKey="Budget" fill={seriesColors[0]} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Actual" fill={seriesColors[2]} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                ) : <p className="text-sm text-muted-foreground text-center py-8">No burn data</p>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="investors" className="mt-4">
          <InvestorsWorkspace projectId={pid} />
        </TabsContent>

        <TabsContent value="loans" className="mt-4">
          <LoansWorkspace projectId={pid} />
        </TabsContent>

        <TabsContent value="branding" className="mt-4">
          <BrandingWorkspace projectId={pid} />
        </TabsContent>

        <TabsContent value="tranches" className="mt-4">
          <TranchesWorkspace projectId={pid} />
        </TabsContent>

        <TabsContent value="ost" className="space-y-4 mt-4">
          {ost.length === 0 ? <EmptyState title="No OST receivables" description="No OST receivable records found." icon={Music} /> : (
            <Card>
              <CardContent className="pt-4">
                <DataTable columns={ostColumns} rows={ost} rowKey={(r) => r.id} caption="OST receivables" />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="burn" className="space-y-4 mt-4">
          {burn.length === 0 ? <EmptyState title="No burn records" description="No burn tracking records found." icon={Flame} /> : (
            <Card>
              <CardContent className="pt-4">
                <DataTable columns={burnColumns} rows={burn} rowKey={(r) => r.id} caption="Burn records" />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
