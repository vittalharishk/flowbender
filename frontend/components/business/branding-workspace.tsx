"use client";

import { useMemo } from "react";
import { Tag, IndianRupee, TrendingUp, AlertTriangle } from "lucide-react";
import { useBrandingDeals } from "@/lib/business-store";
import type { BrandingDeal } from "@/lib/business-store";
import { formatINR } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/app/stat-card";
import { StatusBadge } from "@/components/app/status-badge";
import { DataTable, type DataTableColumn } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import { RecordManager } from "@/components/app/record-manager";

export function BrandingWorkspace({ projectId }: { projectId?: string }) {
  const deals = useBrandingDeals(projectId);

  const stats = useMemo(() => ({
    total: deals.length,
    agreementValue: deals.reduce((s, d) => s + d.agreementValue, 0),
    received: deals.reduce((s, d) => s + d.receivedAmount, 0),
    outstanding: deals.reduce((s, d) => s + d.outstandingAmount, 0),
  }), [deals]);

  const columns: DataTableColumn<BrandingDeal>[] = [
    { key: "brand", header: "Brand", cell: (r) => <span className="font-medium">{r.brand}</span>, sortValue: (r) => r.brand },
    { key: "type", header: "Placement Type", cell: (r) => <span className="capitalize">{r.placementType.replace("-", " ")}</span>, sortValue: (r) => r.placementType },
    { key: "value", header: "Agreement Value", cell: (r) => <span className="font-mono">{formatINR(r.agreementValue)}</span>, sortValue: (r) => r.agreementValue, align: "right" },
    { key: "invoiced", header: "Invoiced", cell: (r) => <span className="font-mono">{formatINR(r.invoicedAmount)}</span>, sortValue: (r) => r.invoicedAmount, align: "right" },
    { key: "received", header: "Received", cell: (r) => <span className="font-mono">{formatINR(r.receivedAmount)}</span>, sortValue: (r) => r.receivedAmount, align: "right" },
    { key: "outstanding", header: "Outstanding", cell: (r) => <span className="font-mono">{formatINR(r.outstandingAmount)}</span>, sortValue: (r) => r.outstandingAmount, align: "right" },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} />, sortValue: (r) => r.status },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-end gap-2">
        <RecordManager source="module" sliceKey="brandingDeals" label="Branding deal" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Deals" value={String(stats.total)} icon={Tag} />
        <StatCard label="Agreement Value" value={formatINR(stats.agreementValue)} icon={IndianRupee} />
        <StatCard label="Received" value={formatINR(stats.received)} icon={TrendingUp} />
        <StatCard label="Outstanding" value={formatINR(stats.outstanding)} icon={AlertTriangle} />
      </div>

      {deals.length === 0 ? <EmptyState title="No branding deals" description="No branding deal records found." icon={Tag} /> : (
        <Card>
          <CardContent className="pt-4">
            <DataTable columns={columns} rows={deals} rowKey={(r) => r.id} caption="Branding deals" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
