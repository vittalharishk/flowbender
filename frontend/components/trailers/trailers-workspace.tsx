"use client";

import { useState, useMemo } from "react";
import { Clapperboard, CheckCircle2, Clock, ListTodo } from "lucide-react";
import { useTrailers } from "@/lib/trailer-store";
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
import { RecordManager } from "@/components/app/record-manager";

export function TrailersWorkspace() {
  const projects = useProjects();
  const [projectId, setProjectId] = useState("all");
  const pid = projectId === "all" ? undefined : projectId;
  const trailers = useTrailers(pid);

  const stats = useMemo(() => {
    const total = trailers.length;
    const released = trailers.filter((t) => t.status === "released").length;
    const inProduction = trailers.filter((t) => t.status === "in-progress" || t.status === "review").length;
    return { total, released, inProduction };
  }, [trailers]);

  type Trailer = (typeof trailers)[number];
  const columns: DataTableColumn<Trailer>[] = [
    { key: "title", header: "Title", cell: (r) => <span className="font-medium">{r.title}</span>, sortValue: (r) => r.title },
    { key: "type", header: "Type", cell: (r) => <span className="capitalize">{r.promoType.replace("-", " ")}</span>, sortValue: (r) => r.promoType },
    { key: "duration", header: "Duration", cell: (r) => r.runtimeSeconds ? `${Math.floor(r.runtimeSeconds / 60)}:${String(r.runtimeSeconds % 60).padStart(2, "0")}` : "—", sortValue: (r) => r.runtimeSeconds || 0, align: "right" as const },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} />, sortValue: (r) => r.status },
    { key: "release", header: "Release Date", cell: (r) => <span className="text-muted-foreground">{r.releaseDate || "—"}</span>, sortValue: (r) => r.releaseDate || "" },
    { key: "editor", header: "Editor", cell: (r) => r.editor || "—", sortValue: (r) => r.editor || "" },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        as="h1"
        title="Trailers & Teasers"
        description="Manage trailers, teasers, and promotional clips."
        icon={Clapperboard}
        badge={pid ? <Badge variant="outline" className="text-xs">{projects.find((p) => p.id === pid)?.title}</Badge> : undefined}
        actions={
          <div>
            <Label htmlFor="trailers-project-filter" className="sr-only">Project</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger id="trailers-project-filter" aria-label="Filter by project" className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All projects</SelectItem>
                {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        }
      />
      <div className="flex flex-wrap justify-end gap-2">
        <RecordManager source="module" sliceKey="trailersTeasers" label="Trailer" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label="Total" value={String(stats.total)} icon={ListTodo} />
        <StatCard label="Released" value={String(stats.released)} icon={CheckCircle2} />
        <StatCard label="In Production" value={String(stats.inProduction)} icon={Clock} />
      </div>

      {trailers.length === 0 ? (
        <EmptyState title="No trailers" description="No trailers or teasers found for the selected project." icon={Clapperboard} />
      ) : (
        <Card>
          <CardContent className="pt-4">
            <DataTable columns={columns} rows={trailers} rowKey={(r) => r.id} caption="Trailers and teasers" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
