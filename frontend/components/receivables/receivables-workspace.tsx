"use client";

import { useState, useMemo } from "react";
import { IndianRupee, CheckCircle2, Clock, ListTodo } from "lucide-react";
import { useDistributionRevenue } from "@/lib/distribution-store";
import { useBrandingDeals, useOstReceivables } from "@/lib/business-store";
import { useProjects } from "@/lib/project-store";
import { formatINR } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { StatusBadge } from "@/components/app/status-badge";
import { DataTable, type DataTableColumn } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import { RecordManager } from "@/components/app/record-manager";

interface ReceivableRow {
  id: string;
  source: string;
  description: string;
  totalAmount: number;
  receivedAmount: number;
  outstandingAmount: number;
  status: string;
}

export function ReceivablesWorkspace() {
  const projects = useProjects();
  const [projectId, setProjectId] = useState("all");
  const pid = projectId === "all" ? undefined : projectId;

  const distRevenue = useDistributionRevenue(pid);
  const brandingDeals = useBrandingDeals(pid);
  const ostReceivables = useOstReceivables(pid);

  const rows = useMemo<ReceivableRow[]>(() => {
    const result: ReceivableRow[] = [];

    for (const r of distRevenue) {
      result.push({
        id: r.id,
        source: "Distribution",
        description: `${r.revenueType.replace("-", " ")} — ${r.territory || "General"}`,
        totalAmount: r.amount,
        receivedAmount: r.status === "collected" ? r.amount : 0,
        outstandingAmount: r.status === "collected" ? 0 : r.amount,
        status: r.status,
      });
    }

    for (const b of brandingDeals) {
      result.push({
        id: b.id,
        source: "Branding",
        description: `${b.brand} — ${b.placementType.replace("-", " ")}`,
        totalAmount: b.agreementValue,
        receivedAmount: b.receivedAmount,
        outstandingAmount: b.outstandingAmount,
        status: b.status,
      });
    }

    for (const o of ostReceivables) {
      result.push({
        id: o.id,
        source: "OST / Music",
        description: o.musicLabel,
        totalAmount: o.contractValue,
        receivedAmount: o.receivedAmount,
        outstandingAmount: o.outstandingAmount,
        status: o.status,
      });
    }

    return result;
  }, [distRevenue, brandingDeals, ostReceivables]);

  const stats = useMemo(() => {
    const totalReceivables = rows.reduce((s, r) => s + r.totalAmount, 0);
    const received = rows.reduce((s, r) => s + r.receivedAmount, 0);
    const pending = rows.reduce((s, r) => s + r.outstandingAmount, 0);
    return { totalReceivables, received, pending };
  }, [rows]);

  const columns: DataTableColumn<ReceivableRow>[] = [
    { key: "source", header: "Source", cell: (r) => <span className="font-medium">{r.source}</span>, sortValue: (r) => r.source },
    { key: "desc", header: "Description", cell: (r) => <span className="max-w-[200px] truncate block">{r.description}</span>, sortValue: (r) => r.description },
    { key: "total", header: "Total", cell: (r) => <span className="font-mono">{formatINR(r.totalAmount)}</span>, sortValue: (r) => r.totalAmount, align: "right" },
    { key: "received", header: "Received", cell: (r) => <span className="font-mono">{formatINR(r.receivedAmount)}</span>, sortValue: (r) => r.receivedAmount, align: "right" },
    { key: "outstanding", header: "Outstanding", cell: (r) => <span className="font-mono">{formatINR(r.outstandingAmount)}</span>, sortValue: (r) => r.outstandingAmount, align: "right" },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} />, sortValue: (r) => r.status },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        as="h1"
        title="Receivables"
        description="Consolidated view of all receivables across distribution, branding, and music."
        icon={IndianRupee}
        badge={pid ? <Badge variant="outline" className="text-xs">{projects.find((p) => p.id === pid)?.title}</Badge> : undefined}
        actions={
          <div>
            <Label htmlFor="receivables-project-filter" className="sr-only">Project</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger id="receivables-project-filter" aria-label="Filter by project" className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All projects</SelectItem>
                {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        }
      />
      <div className="flex flex-wrap justify-end gap-2">
        <RecordManager source="app" sliceKey="distributionRevenue" label="Collection" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label="Total Receivables" value={formatINR(stats.totalReceivables)} icon={ListTodo} />
        <StatCard label="Received" value={formatINR(stats.received)} icon={CheckCircle2} />
        <StatCard label="Pending" value={formatINR(stats.pending)} icon={Clock} />
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No receivables" description="No receivable records found for the selected project." icon={IndianRupee} />
      ) : (
        <Card>
          <CardContent className="pt-4">
            <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} caption="Receivables" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
