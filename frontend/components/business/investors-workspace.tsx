"use client";

import { useMemo } from "react";
import { Users, IndianRupee, TrendingUp } from "lucide-react";
import { useInvestors, useInvestorProjects } from "@/lib/business-store";
import type { Investor, InvestorProject } from "@/lib/business-store";
import { formatINR } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/app/stat-card";
import { StatusBadge } from "@/components/app/status-badge";
import { DataTable, type DataTableColumn } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import { RecordManager } from "@/components/app/record-manager";

export function InvestorsWorkspace({ projectId }: { projectId?: string }) {
  const investors = useInvestors();
  const investorProjects = useInvestorProjects(projectId);

  const stats = useMemo(() => ({
    total: investors.length,
    committed: investorProjects.reduce((s, ip) => s + ip.committedAmount, 0),
    received: investorProjects.reduce((s, ip) => s + ip.receivedAmount, 0),
  }), [investors, investorProjects]);

  const investorColumns: DataTableColumn<Investor>[] = [
    { key: "name", header: "Name", cell: (r) => <span className="font-medium">{r.name}</span>, sortValue: (r) => r.name },
    { key: "type", header: "Type", cell: (r) => <span className="capitalize">{r.investorType}</span>, sortValue: (r) => r.investorType },
    { key: "company", header: "Company", cell: (r) => r.company || "—", sortValue: (r) => r.company || "" },
    { key: "email", header: "Email", cell: (r) => r.email || "—", sortValue: (r) => r.email || "" },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.isActive ? "active" : "inactive"} />, sortValue: (r) => (r.isActive ? "active" : "inactive") },
  ];

  const ipColumns: DataTableColumn<InvestorProject>[] = [
    { key: "investor", header: "Investor", cell: (r) => <span className="font-medium">{investors.find((i) => i.id === r.investorId)?.name || r.investorId}</span>, sortValue: (r) => investors.find((i) => i.id === r.investorId)?.name || "" },
    { key: "type", header: "Type", cell: (r) => <span className="capitalize">{r.investmentType}</span>, sortValue: (r) => r.investmentType },
    { key: "committed", header: "Committed", cell: (r) => <span className="font-mono">{formatINR(r.committedAmount)}</span>, sortValue: (r) => r.committedAmount, align: "right" },
    { key: "received", header: "Received", cell: (r) => <span className="font-mono">{formatINR(r.receivedAmount)}</span>, sortValue: (r) => r.receivedAmount, align: "right" },
    { key: "returned", header: "Returned", cell: (r) => <span className="font-mono">{formatINR(r.returnedAmount)}</span>, sortValue: (r) => r.returnedAmount, align: "right" },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} />, sortValue: (r) => r.status },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-end gap-2">
        <RecordManager source="module" sliceKey="investors" label="Investor" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label="Total Investors" value={String(stats.total)} icon={Users} />
        <StatCard label="Total Committed" value={formatINR(stats.committed)} icon={IndianRupee} />
        <StatCard label="Total Received" value={formatINR(stats.received)} icon={TrendingUp} />
      </div>

      {investors.length === 0 ? <EmptyState title="No investors" description="No investor records found." icon={Users} /> : (
        <Card>
          <CardContent className="pt-4">
            <DataTable columns={investorColumns} rows={investors} rowKey={(r) => r.id} caption="Investors" />
          </CardContent>
        </Card>
      )}

      {investorProjects.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm font-semibold mb-3">Investments by Project</div>
            <DataTable columns={ipColumns} rows={investorProjects} rowKey={(r) => r.id} caption="Investor project allocations" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
