"use client";

import { useState, useMemo } from "react";
import { Satellite, FileText, IndianRupee, TrendingUp } from "lucide-react";
import { useDistributionAgreements } from "@/lib/distribution-store";
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

export function SatelliteDistributionWorkspace() {
  const projects = useProjects();
  const [projectId, setProjectId] = useState("all");
  const pid = projectId === "all" ? undefined : projectId;

  const allAgreements = useDistributionAgreements(pid);

  const agreements = useMemo(
    () => allAgreements.filter((a) => a.channel === "satellite"),
    [allAgreements]
  );

  const totalAgreements = agreements.length;
  const totalRevenue = useMemo(() => agreements.reduce((s, a) => s + a.agreementValue, 0), [agreements]);
  const activeDeals = useMemo(() => agreements.filter((a) => a.status === "active").length, [agreements]);

  type Agreement = (typeof agreements)[number];
  const columns: DataTableColumn<Agreement>[] = [
    { key: "broadcaster", header: "Broadcaster", cell: (r) => <span className="font-medium">{r.distributorName}</span>, sortValue: (r) => r.distributorName },
    { key: "territory", header: "Territory", cell: (r) => <span className="max-w-[200px] truncate block">{r.territories.join(", ")}</span> },
    { key: "value", header: "Agreement Value", cell: (r) => <span className="font-mono">{formatINR(r.agreementValue)}</span>, sortValue: (r) => r.agreementValue, align: "right" },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} />, sortValue: (r) => r.status },
    { key: "start", header: "Start Date", cell: (r) => <span className="text-muted-foreground">{r.startDate}</span>, sortValue: (r) => r.startDate },
    { key: "end", header: "End Date", cell: (r) => <span className="text-muted-foreground">{r.endDate}</span>, sortValue: (r) => r.endDate },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        as="h1"
        title="Satellite Distribution"
        description="Manage satellite TV distribution agreements and broadcasters."
        icon={Satellite}
        badge={pid ? <Badge variant="outline" className="text-xs">{projects.find((p) => p.id === pid)?.title}</Badge> : undefined}
        actions={
          <div>
            <Label htmlFor="sat-project-filter" className="sr-only">Project</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger id="sat-project-filter" aria-label="Filter by project" className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All projects</SelectItem>
                {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        }
      />
      <div className="flex flex-wrap justify-end gap-2">
        <RecordManager source="module" sliceKey="satelliteDistribution" label="Satellite deal" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label="Total Agreements" value={String(totalAgreements)} icon={FileText} />
        <StatCard label="Revenue" value={formatINR(totalRevenue)} icon={IndianRupee} />
        <StatCard label="Active Deals" value={String(activeDeals)} icon={TrendingUp} />
      </div>

      {agreements.length === 0 ? (
        <EmptyState title="No satellite agreements" description="No satellite distribution agreements found." icon={Satellite} />
      ) : (
        <Card>
          <CardContent className="pt-4">
            <DataTable columns={columns} rows={agreements} rowKey={(r) => r.id} caption="Satellite distribution agreements" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
