"use client";

import { useState, useMemo } from "react";
import { Megaphone, IndianRupee, TrendingUp, ListTodo } from "lucide-react";
import { useMarketingCampaigns } from "@/lib/marketing-store";
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

export function MarketingWorkspace() {
  const projects = useProjects();
  const [projectId, setProjectId] = useState("all");
  const pid = projectId === "all" ? undefined : projectId;
  const campaigns = useMarketingCampaigns(pid);

  const stats = useMemo(() => {
    const total = campaigns.length;
    const totalBudget = campaigns.reduce((s, c) => s + c.campaignBudget, 0);
    const totalSpent = campaigns.reduce((s, c) => s + c.actualSpend, 0);
    return { total, totalBudget, totalSpent };
  }, [campaigns]);

  type Campaign = (typeof campaigns)[number];
  const columns: DataTableColumn<Campaign>[] = [
    { key: "name", header: "Campaign Name", cell: (r) => <span className="font-medium">{r.name}</span>, sortValue: (r) => r.name },
    { key: "platform", header: "Platform", cell: (r) => r.platform, sortValue: (r) => r.platform },
    { key: "budget", header: "Budget", cell: (r) => <span className="font-mono">{formatINR(r.campaignBudget)}</span>, sortValue: (r) => r.campaignBudget, align: "right" as const },
    { key: "spent", header: "Spent", cell: (r) => <span className="font-mono">{formatINR(r.actualSpend)}</span>, sortValue: (r) => r.actualSpend, align: "right" as const },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} />, sortValue: (r) => r.status },
    { key: "start", header: "Start Date", cell: (r) => <span className="text-muted-foreground">{r.startDate || "—"}</span>, sortValue: (r) => r.startDate || "" },
    { key: "end", header: "End Date", cell: (r) => <span className="text-muted-foreground">{r.endDate || "—"}</span>, sortValue: (r) => r.endDate || "" },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        as="h1"
        title="Marketing"
        description="Manage marketing campaigns, budgets, and performance."
        icon={Megaphone}
        badge={pid ? <Badge variant="outline" className="text-xs">{projects.find((p) => p.id === pid)?.title}</Badge> : undefined}
        actions={
          <div>
            <Label htmlFor="marketing-project-filter" className="sr-only">Project</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger id="marketing-project-filter" aria-label="Filter by project" className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All projects</SelectItem>
                {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label="Total Campaigns" value={String(stats.total)} icon={ListTodo} />
        <StatCard label="Total Budget" value={formatINR(stats.totalBudget)} icon={IndianRupee} />
        <StatCard label="Total Spent" value={formatINR(stats.totalSpent)} icon={TrendingUp} />
      </div>

      {campaigns.length === 0 ? (
        <EmptyState title="No campaigns" description="No marketing campaigns found for the selected project." icon={Megaphone} />
      ) : (
        <Card>
          <CardContent className="pt-4">
            <DataTable columns={columns} rows={campaigns} rowKey={(r) => r.id} caption="Marketing campaigns" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
