"use client";

import { useState, useMemo } from "react";
import { Music2, FileText, IndianRupee, TrendingUp } from "lucide-react";
import { useAudioDistribution } from "@/lib/distribution-ext-store";
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
import type { AudioDistribution } from "@/lib/distribution-ext-store";
import { RecordManager } from "@/components/app/record-manager";

export function AudioDistributionWorkspace() {
  const projects = useProjects();
  const [projectId, setProjectId] = useState("all");
  const pid = projectId === "all" ? undefined : projectId;

  const deals = useAudioDistribution(pid);

  const totalDeals = deals.length;
  const totalRevenue = useMemo(() => deals.reduce((s, a) => s + (a.dealAmount || a.revenueEarned || 0), 0), [deals]);
  const activeDeals = useMemo(() => deals.filter((a) => a.status === "released" || a.status === "signed").length, [deals]);
  const totalStreams = useMemo(() => deals.reduce((s, a) => s + (a.totalStreams || 0), 0), [deals]);

  const columns: DataTableColumn<AudioDistribution>[] = [
    { key: "label", header: "Music Label", cell: (r) => <span className="font-medium">{r.label}</span>, sortValue: (r) => r.label },
    { key: "deal", header: "Deal Type", cell: (r) => <span className="capitalize">{r.dealType.replace("-", " ")}</span>, sortValue: (r) => r.dealType },
    { key: "platforms", header: "Platforms", cell: (r) => <span className="max-w-[180px] truncate block text-muted-foreground">{r.platforms?.join(", ") || "—"}</span> },
    { key: "value", header: "Deal Value", cell: (r) => <span className="font-mono">{r.dealAmount ? formatINR(r.dealAmount) : r.revenueSharePercent ? `${r.revenueSharePercent}% share` : "—"}</span>, sortValue: (r) => r.dealAmount || 0, align: "right" },
    { key: "streams", header: "Total Streams", cell: (r) => r.totalStreams ? `${(r.totalStreams / 1000000).toFixed(1)}M` : "—", sortValue: (r) => r.totalStreams || 0, align: "right" },
    { key: "revenue", header: "Revenue Earned", cell: (r) => <span className="font-mono">{r.revenueEarned ? formatINR(r.revenueEarned) : "—"}</span>, sortValue: (r) => r.revenueEarned || 0, align: "right" },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} />, sortValue: (r) => r.status },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        as="h1"
        title="Audio Distribution"
        description="Manage music rights, streaming deals, and audio revenue."
        icon={Music2}
        badge={pid ? <Badge variant="outline" className="text-xs">{projects.find((p) => p.id === pid)?.title}</Badge> : undefined}
        actions={
          <div>
            <Label htmlFor="aud-project-filter" className="sr-only">Project</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger id="aud-project-filter" aria-label="Filter by project" className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All projects</SelectItem>
                {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        }
      />
      <div className="flex flex-wrap justify-end gap-2">
        <RecordManager source="module" sliceKey="audioDistribution" label="Audio deal" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Deals" value={String(totalDeals)} icon={FileText} />
        <StatCard label="Total Revenue" value={formatINR(totalRevenue)} icon={IndianRupee} />
        <StatCard label="Active Deals" value={String(activeDeals)} icon={TrendingUp} />
        <StatCard label="Total Streams" value={totalStreams ? `${(totalStreams / 1000000).toFixed(0)}M` : "0"} icon={Music2} />
      </div>

      {deals.length === 0 ? (
        <EmptyState title="No audio distribution deals" description="No music/audio distribution deals found." icon={Music2} />
      ) : (
        <Card>
          <CardContent className="pt-4">
            <DataTable columns={columns} rows={deals} rowKey={(r) => r.id} caption="Audio distribution deals" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
