"use client";

import { useState, useMemo } from "react";
import { Globe, FileText, IndianRupee, TrendingUp } from "lucide-react";
import { useRightsDeals, calcDistributionStats, useDistributionAgreements, useDistributionRevenue } from "@/lib/distribution-store";
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

export function TerritoriesWorkspace() {
  const projects = useProjects();
  const [projectId, setProjectId] = useState("all");
  const pid = projectId === "all" ? undefined : projectId;

  const deals = useRightsDeals(pid);
  const agreements = useDistributionAgreements(pid);
  const revenue = useDistributionRevenue(pid);

  const stats = useMemo(() => calcDistributionStats(deals, agreements, revenue), [deals, agreements, revenue]);

  const territories = useMemo(() => {
    return Object.entries(stats.byTerritory).map(([territory, data]) => {
      const territoryDeals = deals.filter((d) => d.territory === territory);
      const activeDeals = territoryDeals.filter((d) => d.status === "signed" || d.status === "negotiating");
      const distributors = [...new Set(territoryDeals.map((d) => d.distributor))];
      const rightsTypes = [...new Set(territoryDeals.map((d) => d.rightsType))];
      return {
        id: territory,
        territory,
        distributor: distributors.join(", ") || "—",
        rightsTypes: rightsTypes.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(", "),
        status: activeDeals.length > 0 ? "active" : "closed",
        count: data.count,
        mg: data.mg,
        advance: data.advance,
      };
    });
  }, [stats.byTerritory, deals]);

  const totalTerritories = territories.length;
  const activeDeals = useMemo(() => deals.filter((d) => d.status === "signed" || d.status === "negotiating").length, [deals]);
  const totalMG = stats.totalMG;

  type Territory = (typeof territories)[number];
  const columns: DataTableColumn<Territory>[] = [
    { key: "territory", header: "Territory", cell: (r) => <span className="font-medium">{r.territory}</span>, sortValue: (r) => r.territory },
    { key: "distributor", header: "Distributor", cell: (r) => <span className="max-w-[200px] truncate block">{r.distributor}</span>, sortValue: (r) => r.distributor },
    { key: "rights", header: "Rights Type", cell: (r) => <span className="text-sm">{r.rightsTypes}</span> },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} />, sortValue: (r) => r.status },
    { key: "mg", header: "MG Amount", cell: (r) => <span className="font-mono">{formatINR(r.mg)}</span>, sortValue: (r) => r.mg, align: "right" },
    { key: "advance", header: "Advance", cell: (r) => <span className="font-mono">{formatINR(r.advance)}</span>, sortValue: (r) => r.advance, align: "right" },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        as="h1"
        title="Distribution Territories"
        description="Manage territory-level distribution rights and deals."
        icon={Globe}
        badge={pid ? <Badge variant="outline" className="text-xs">{projects.find((p) => p.id === pid)?.title}</Badge> : undefined}
        actions={
          <div>
            <Label htmlFor="terr-project-filter" className="sr-only">Project</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger id="terr-project-filter" aria-label="Filter by project" className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All projects</SelectItem>
                {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label="Total Territories" value={String(totalTerritories)} icon={Globe} />
        <StatCard label="Active Deals" value={String(activeDeals)} icon={TrendingUp} />
        <StatCard label="Total MG" value={formatINR(totalMG)} icon={IndianRupee} />
      </div>

      {territories.length === 0 ? (
        <EmptyState title="No territories" description="No territory-level distribution data found." icon={FileText} />
      ) : (
        <Card>
          <CardContent className="pt-4">
            <DataTable columns={columns} rows={territories} rowKey={(r) => r.id} caption="Distribution territories" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
