"use client";

import { useMemo } from "react";
import { Landmark, IndianRupee, TrendingUp, AlertTriangle } from "lucide-react";
import { useLoans } from "@/lib/business-store";
import type { Loan } from "@/lib/business-store";
import { formatINR } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/app/stat-card";
import { StatusBadge } from "@/components/app/status-badge";
import { DataTable, type DataTableColumn } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";

export function LoansWorkspace({ projectId }: { projectId?: string }) {
  const loans = useLoans(projectId);

  const stats = useMemo(() => ({
    active: loans.filter((l) => l.status === "active").length,
    totalPrincipal: loans.reduce((s, l) => s + l.principal, 0),
    outstanding: loans.reduce((s, l) => s + l.outstandingPrincipal, 0),
    interestDue: loans.reduce((s, l) => s + l.accruedInterest, 0),
  }), [loans]);

  const columns: DataTableColumn<Loan>[] = [
    { key: "lender", header: "Lender", cell: (r) => <span className="font-medium">{r.lender}</span>, sortValue: (r) => r.lender },
    { key: "principal", header: "Principal", cell: (r) => <span className="font-mono">{formatINR(r.principal)}</span>, sortValue: (r) => r.principal, align: "right" },
    { key: "rate", header: "Interest Rate", cell: (r) => <span>{r.annualInterestRate}%</span>, sortValue: (r) => r.annualInterestRate, align: "right" },
    { key: "method", header: "Method", cell: (r) => <span className="capitalize">{r.interestMethod}{r.compoundingFrequency ? ` (${r.compoundingFrequency})` : ""}</span>, sortValue: (r) => r.interestMethod },
    { key: "outstanding", header: "Outstanding", cell: (r) => <span className="font-mono">{formatINR(r.outstandingPrincipal)}</span>, sortValue: (r) => r.outstandingPrincipal, align: "right" },
    { key: "accrued", header: "Accrued Interest", cell: (r) => <span className="font-mono">{formatINR(r.accruedInterest)}</span>, sortValue: (r) => r.accruedInterest, align: "right" },
    { key: "maturity", header: "Maturity", cell: (r) => <span className="text-muted-foreground">{r.maturityDate}</span>, sortValue: (r) => r.maturityDate },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} />, sortValue: (r) => r.status },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Active Loans" value={String(stats.active)} icon={Landmark} />
        <StatCard label="Total Principal" value={formatINR(stats.totalPrincipal)} icon={IndianRupee} />
        <StatCard label="Outstanding" value={formatINR(stats.outstanding)} icon={TrendingUp} />
        <StatCard label="Interest Due" value={formatINR(stats.interestDue)} icon={AlertTriangle} />
      </div>

      {loans.length === 0 ? <EmptyState title="No loans" description="No loan records found." icon={Landmark} /> : (
        <Card>
          <CardContent className="pt-4">
            <DataTable columns={columns} rows={loans} rowKey={(r) => r.id} caption="Loans" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
