"use client";

import { useState, useMemo } from "react";
import { Image, CheckCircle2, Clock, ListTodo } from "lucide-react";
import { usePublicityAssets } from "@/lib/publicity-store";
import { useProjects } from "@/lib/project-store";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { StatusBadge } from "@/components/app/status-badge";
import { DataTable, type DataTableColumn } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";

export function PublicityWorkspace() {
  const projects = useProjects();
  const [projectId, setProjectId] = useState("all");
  const pid = projectId === "all" ? undefined : projectId;
  const assets = usePublicityAssets(pid);

  const stats = useMemo(() => {
    const total = assets.length;
    const published = assets.filter((a) => a.publishStatus === "published").length;
    const pending = assets.filter((a) => a.publishStatus === "unpublished" || a.approvalStatus === "draft" || a.approvalStatus === "review").length;
    return { total, published, pending };
  }, [assets]);

  type Asset = (typeof assets)[number];
  const columns: DataTableColumn<Asset>[] = [
    { key: "name", header: "Title", cell: (r) => <span className="font-medium">{r.name}</span>, sortValue: (r) => r.name },
    { key: "type", header: "Type", cell: (r) => <span className="capitalize">{r.assetType.replace("-", " ")}</span>, sortValue: (r) => r.assetType },
    { key: "approval", header: "Approval", cell: (r) => <StatusBadge status={r.approvalStatus} />, sortValue: (r) => r.approvalStatus },
    { key: "publish", header: "Publish Status", cell: (r) => <StatusBadge status={r.publishStatus} />, sortValue: (r) => r.publishStatus },
    { key: "release", header: "Release Date", cell: (r) => <span className="text-muted-foreground">{r.releaseDate || "—"}</span>, sortValue: (r) => r.releaseDate || "" },
    { key: "platform", header: "Platform", cell: (r) => r.platform || "—", sortValue: (r) => r.platform || "" },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        as="h1"
        title="Publicity"
        description="Manage publicity assets, posters, and promotional materials."
        icon={Image}
        badge={pid ? <Badge variant="outline" className="text-xs">{projects.find((p) => p.id === pid)?.title}</Badge> : undefined}
        actions={
          <div>
            <Label htmlFor="publicity-project-filter" className="sr-only">Project</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger id="publicity-project-filter" aria-label="Filter by project" className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All projects</SelectItem>
                {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label="Total Assets" value={String(stats.total)} icon={ListTodo} />
        <StatCard label="Published" value={String(stats.published)} icon={CheckCircle2} />
        <StatCard label="Pending" value={String(stats.pending)} icon={Clock} />
      </div>

      {assets.length === 0 ? (
        <EmptyState title="No publicity assets" description="No publicity assets found for the selected project." icon={Image} />
      ) : (
        <Card>
          <CardContent className="pt-4">
            <DataTable columns={columns} rows={assets} rowKey={(r) => r.id} caption="Publicity assets" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
