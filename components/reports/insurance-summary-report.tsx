"use client";

import { useMemo } from "react";
import { AlertTriangle, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { useInsurancePolicies, useInsuranceDashboard } from "@/lib/insurance-store";
import { exportToCsv, formatFilterContext } from "@/lib/report-export";
import { formatCrore } from "@/lib/report-utils";
import type { ReportFilterState } from "./report-filters";

const COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

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
    return (
      <Card><CardContent className="p-8 text-center text-muted-foreground">
        No insurance data available{projectId ? " for this project" : ""}.
      </CardContent></Card>
    );
  }

  const d = dashboard;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Generated: {new Date().toLocaleString()}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportPolicies}>
            <Download className="w-3.5 h-3.5" /> Policies CSV
          </Button>
          {data.allClaims.length > 0 && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportClaims}>
              <Download className="w-3.5 h-3.5" /> Claims CSV
            </Button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KPI label="Total Policies" value={String(d.totalPolicies)} />
        <KPI label="Active Policies" value={String(d.activePolicies)} tone="text-emerald-400" />
        <KPI label="Total Coverage" value={formatCrore(d.totalCoverage)} />
        <KPI label="Premium Paid" value={formatCrore(d.totalPremiumsPaid)} tone="text-amber-400" />
        <KPI label="Premium Due" value={formatCrore(d.totalPremiumsDue)} tone={d.totalPremiumsDue > 0 ? "text-red-400" : "text-foreground"} />
      </div>

      {/* Expiring policies warning */}
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
                  <Badge key={p.id} variant="outline" className="text-xs border-amber-500/30 text-amber-400">
                    {p.policyNumber} — expires {p.endDate}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {data.typeChart.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Policies by Type</CardTitle></CardHeader>
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
        {data.statusChart.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Policies by Status</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.statusChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" name="Policies" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Claims summary */}
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
            <div className="flex gap-4 text-sm">
              <span className="text-muted-foreground">Total Claimed: <span className="font-semibold text-foreground">{formatCrore(d.totalClaimed)}</span></span>
              <span className="text-muted-foreground">Total Settled: <span className="font-semibold text-emerald-400">{formatCrore(d.totalSettled)}</span></span>
              <span className="text-muted-foreground">Open Claims: <span className="font-semibold text-amber-400">{d.openClaims}</span></span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Policies table */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Policies Detail</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-xs text-muted-foreground">
                <th className="p-3">Policy Number</th><th className="p-3">Type</th><th className="p-3">Status</th>
                <th className="p-3 text-right">Coverage</th><th className="p-3 text-right">Premium</th>
                <th className="p-3">Expiry</th>
              </tr></thead>
              <tbody>
                {policies.map((p) => {
                  const isExpiring = d.expiringWithin30Days.some((e) => e.id === p.id);
                  return (
                    <tr key={p.id} className={`border-b last:border-0 hover:bg-muted/30 ${isExpiring ? "bg-amber-500/5" : ""}`}>
                      <td className="p-3 font-medium">{p.policyNumber}</td>
                      <td className="p-3">{p.policyType}</td>
                      <td className="p-3"><Badge variant="outline" className={`text-xs ${p.status === "active" ? "border-emerald-500/30 text-emerald-400" : p.status === "expired" ? "border-red-500/30 text-red-400" : ""}`}>{p.status}</Badge></td>
                      <td className="p-3 text-right">{formatCrore(p.coverageAmount)}</td>
                      <td className="p-3 text-right">{formatCrore(p.premiumAmount)}</td>
                      <td className="p-3">{p.endDate}{isExpiring && <Badge variant="outline" className="ml-1 text-xs border-amber-500/30 text-amber-400">Soon</Badge>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Claims table */}
      {data.allClaims.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Claims Detail</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="p-3">Claim #</th><th className="p-3">Policy</th><th className="p-3">Type</th>
                  <th className="p-3 text-right">Claimed</th><th className="p-3 text-right">Settled</th>
                  <th className="p-3">Status</th><th className="p-3">Filed</th>
                </tr></thead>
                <tbody>
                  {data.allClaims.map((c) => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3 font-medium">{c.claimNumber}</td>
                      <td className="p-3">{c.policyNumber}</td>
                      <td className="p-3">{c.policyType}</td>
                      <td className="p-3 text-right">{formatCrore(c.claimedAmount)}</td>
                      <td className="p-3 text-right">{formatCrore(c.settledAmount)}</td>
                      <td className="p-3"><Badge variant="outline" className="text-xs">{c.status}</Badge></td>
                      <td className="p-3">{c.claimDate}</td>
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

function KPI({ label, value, tone = "text-foreground" }: { label: string; value: string; tone?: string }) {
  return (
    <Card><CardContent className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-xl font-semibold mt-1 ${tone}`}>{value}</p>
    </CardContent></Card>
  );
}
