"use client";

import { useMemo } from "react";
import { AlertTriangle, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { useInsurancePolicies, useInsuranceDashboard } from "@/lib/insurance-store";
import { exportToCsv, formatFilterContext } from "@/lib/report-export";
import { formatCrore } from "@/lib/report-utils";
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

export function InsuranceSummaryReport({ projectId, filters, projectName }: Props) {
  const policies = useInsurancePolicies(projectId);
  const dashboard = useInsuranceDashboard(projectId);

  const data = useMemo(() => {
    const typeChart = Object.entries(dashboard.byType).map(([name, v]) => ({ name, value: v.count }));

    const statusCounts: Record<string, number> = {};
    for (const p of policies) {
      statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
    }
    const statusChart = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    const allClaims = policies.flatMap((p) => p.claims.map((c) => ({ ...c, policyNumber: p.policyNumber, policyType: p.policyType })));
    const claimStatusCounts: Record<string, number> = {};
    for (const c of allClaims) {
      claimStatusCounts[c.status] = (claimStatusCounts[c.status] || 0) + 1;
    }

    return { typeChart, statusChart, allClaims, claimStatusCounts };
  }, [policies, dashboard]);

  const handleExportPolicies = () => {
    exportToCsv(policies, [
      { header: "Policy Number", accessor: (r) => r.policyNumber },
      { header: "Type", accessor: (r) => r.policyType },
      { header: "Provider", accessor: (r) => r.provider },
      { header: "Status", accessor: (r) => r.status },
      { header: "Coverage", accessor: (r) => r.coverageAmount },
      { header: "Premium", accessor: (r) => r.premiumAmount },
      { header: "Premium Paid", accessor: (r) => r.totalPremiumPaid },
      { header: "Start Date", accessor: (r) => r.startDate },
      { header: "End Date", accessor: (r) => r.endDate },
    ], {
      filename: "insurance-policies-report",
      title: "Insurance Summary Report — Policies",
      filters: formatFilterContext({ projectName, dateFrom: filters.dateFrom, dateTo: filters.dateTo }),
    });
  };

  const handleExportClaims = () => {
    exportToCsv(data.allClaims, [
      { header: "Claim Number", accessor: (r) => r.claimNumber },
      { header: "Policy", accessor: (r) => r.policyNumber },
      { header: "Type", accessor: (r) => r.policyType },
      { header: "Claimed Amount", accessor: (r) => r.claimedAmount },
      { header: "Settled Amount", accessor: (r) => r.settledAmount },
      { header: "Status", accessor: (r) => r.status },
      { header: "Filed Date", accessor: (r) => r.claimDate },
    ], {
      filename: "insurance-claims-report",
      title: "Insurance Summary Report — Claims",
      filters: formatFilterContext({ projectName }),
    });
  };

  if (policies.length === 0) {
    return <EmptyState title="No insurance data" description={`No insurance data available${projectId ? " for this project" : ""}.`} />;
  }

  const d = dashboard;

  type PolicyRow = (typeof policies)[number];
  type ClaimRow = (typeof data.allClaims)[number];

  const policyColumns = useMemo((): DataTableColumn<PolicyRow>[] => [
    { key: "number", header: "Policy Number", cell: (r) => <span className="font-medium">{r.policyNumber}</span>, sortValue: (r) => r.policyNumber },
    { key: "type", header: "Type", cell: (r) => r.policyType },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
    { key: "coverage", header: "Coverage", cell: (r) => formatCrore(r.coverageAmount), align: "right", sortValue: (r) => r.coverageAmount },
    { key: "premium", header: "Premium", cell: (r) => formatCrore(r.premiumAmount), align: "right", sortValue: (r) => r.premiumAmount },
    { key: "expiry", header: "Expiry", cell: (r) => {
      const isExpiring = d.expiringWithin30Days.some((e) => e.id === r.id);
      return <>{r.endDate}{isExpiring && <StatusBadge status="expiring" tone="warning" label="Soon" className="ml-1" />}</>;
    }},
  ], [d.expiringWithin30Days]);

  const claimColumns = useMemo((): DataTableColumn<ClaimRow>[] => [
    { key: "claimNumber", header: "Claim #", cell: (r) => <span className="font-medium">{r.claimNumber}</span> },
    { key: "policy", header: "Policy", cell: (r) => r.policyNumber },
    { key: "type", header: "Type", cell: (r) => r.policyType },
    { key: "claimed", header: "Claimed", cell: (r) => formatCrore(r.claimedAmount), align: "right", sortValue: (r) => r.claimedAmount },
    { key: "settled", header: "Settled", cell: (r) => formatCrore(r.settledAmount), align: "right", sortValue: (r) => r.settledAmount },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
    { key: "filed", header: "Filed", cell: (r) => r.claimDate },
  ], []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Generated: {new Date().toLocaleString()}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportPolicies}><Download className="w-3.5 h-3.5" /> Policies CSV</Button>
          {data.allClaims.length > 0 && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportClaims}><Download className="w-3.5 h-3.5" /> Claims CSV</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Total Policies" value={String(d.totalPolicies)} />
        <StatCard label="Active Policies" value={String(d.activePolicies)} />
        <StatCard label="Total Coverage" value={formatCrore(d.totalCoverage)} />
        <StatCard label="Premium Paid" value={formatCrore(d.totalPremiumsPaid)} />
        <StatCard label="Premium Due" value={formatCrore(d.totalPremiumsDue)} />
      </div>

      {d.expiringWithin30Days.length > 0 && (
        <Card className="border-amber-500/30">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Expiring Soon</p>
              <p className="text-xs text-muted-foreground mt-1">
                {d.expiringWithin30Days.length} {d.expiringWithin30Days.length === 1 ? "policy" : "policies"} expiring within 30 days
                {d.expiringWithin7Days.length > 0 && ` (${d.expiringWithin7Days.length} within 7 days)`}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {d.expiringWithin30Days.map((p) => (
                  <StatusBadge key={p.id} status="expiring" tone="warning" label={`${p.policyNumber} — expires ${p.endDate}`} />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {data.typeChart.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Policies by Type</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer label="Policies by type pie chart" height={250}>
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
        {data.statusChart.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Policies by Status</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer label="Policies by status bar chart" height={250}>
                <BarChart data={data.statusChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill={seriesColors[1]} name="Policies" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {data.allClaims.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Claims Summary</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3 mb-3">
              <Badge variant="outline">Total Claims: {data.allClaims.length}</Badge>
              {Object.entries(data.claimStatusCounts).map(([status, count]) => (
                <Badge key={status} variant="outline" className="text-xs">{status}: {count}</Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="text-muted-foreground">Total Claimed: <span className="font-semibold text-foreground">{formatCrore(d.totalClaimed)}</span></span>
              <span className="text-muted-foreground">Total Settled: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCrore(d.totalSettled)}</span></span>
              <span className="text-muted-foreground">Open Claims: <span className="font-semibold text-amber-600 dark:text-amber-400">{d.openClaims}</span></span>
            </div>
          </CardContent>
        </Card>
      )}

      <h3 className="text-sm font-semibold">Policies Detail</h3>
      <DataTable columns={policyColumns} rows={policies} rowKey={(r) => r.id} caption="Insurance policies" />

      {data.allClaims.length > 0 && (
        <>
          <h3 className="text-sm font-semibold">Claims Detail</h3>
          <DataTable columns={claimColumns} rows={data.allClaims} rowKey={(r) => r.id} caption="Insurance claims" />
        </>
      )}
    </div>
  );
}
