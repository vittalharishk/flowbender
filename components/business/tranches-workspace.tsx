"use client";

import { useMemo } from "react";
import { Layers, IndianRupee, TrendingUp, CheckCircle2 } from "lucide-react";
import { useFundingTranches } from "@/lib/business-store";
import type { FundingTranche } from "@/lib/business-store";
import { formatINR } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/app/stat-card";
import { StatusBadge } from "@/components/app/status-badge";
import { DataTable, type DataTableColumn } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";

export function TranchesWorkspace({ projectId }: { projectId?: string }) {
  const tranches = useFundingTranches(projectId);

  const stats = useMemo(() => ({
    planned: tranches.reduce((s, t) => s + t.plannedAmount, 0),
    approved: tranches.reduce((s, t) => s + t.approvedAmount, 0),
    received: tranches.reduce((s, t) => s + t.receivedAmount, 0),
  }), [tranches]);

  const columns: DataTableColumn<FundingTranche>[] = [
    { key: "source", header: "Source", cell: (r) => <span className="font-medium">{r.fundingSource}</span>, sortValue: (r) => r.fundingSource },
    { key: "tranche", header: "Tranche #", cell: (r) => <span>{r.trancheNumber}</span>, sortValue: (r) => r.trancheNumber },
    { key: "planned", header: "Planned", cell: (r) => <span className="font-mono">{formatINR(r.plannedAmount)}</span>, sortValue: (r) => r.plannedAmount, align: "right" },
    { key: "approved", header: "Approved", cell: (r) => <span className="font-mono">{formatINR(r.approvedAmount)}</span>, sortValue: (r) => r.approvedAmount, align: "right" },
    { key: "released", header: "Released", cell: (r) => <span className="font-mono">{formatINR(r.releasedAmount)}</span>, sortValue: (r) => r.releasedAmount, align: "right" },
    { key: "received", header: "Received", cell: (r) => <span className="font-mono">{formatINR(r.receivedAmount)}</span>, sortValue: (r) => r.receivedAmount, align: "right" },
    { key: "date", header: "Release Date", cell: (r) => <span className="text-muted-foreground">{r.actualReleaseDate || r.plannedReleaseDate || "—"}</span>, sortValue: (r) => r.actualReleaseDate || r.plannedReleaseDate || "" },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} />, sortValue: (r) => r.status },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label="Total Planned" value={formatINR(stats.planned)} icon={Layers} />
        <StatCard label="Approved" value={formatINR(stats.approved)} icon={CheckCircle2} />
        <StatCard label="Received" value={formatINR(stats.received)} icon={TrendingUp} />
      </div>

      {tranches.length === 0 ? <EmptyState title="No funding tranches" description="No funding tranche records found." icon={Layers} /> : (
        <Card>
          <CardContent className="pt-4">
            <DataTable columns={columns} rows={tranches} rowKey={(r) => r.id} caption="Funding tranches" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
