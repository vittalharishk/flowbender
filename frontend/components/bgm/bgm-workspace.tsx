"use client";

import { useState, useMemo } from "react";
import { Music, CheckCircle2, Clock, ListTodo } from "lucide-react";
import { useBgmCues } from "@/lib/bgm-store";
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

export function BgmWorkspace() {
  const projects = useProjects();
  const [projectId, setProjectId] = useState("all");
  const pid = projectId === "all" ? undefined : projectId;
  const cues = useBgmCues(pid);

  const stats = useMemo(() => {
    const total = cues.length;
    const approved = cues.filter((c) => c.status === "approved" || c.status === "final").length;
    const pending = cues.filter((c) => c.status === "pending" || c.status === "composing").length;
    return { total, approved, pending };
  }, [cues]);

  type Cue = (typeof cues)[number];
  const columns: DataTableColumn<Cue>[] = [
    { key: "code", header: "Cue ID", cell: (r) => <span className="font-medium font-mono">{r.cueIdCode}</span>, sortValue: (r) => r.cueIdCode },
    { key: "scene", header: "Scene", cell: (r) => r.sceneReference || "—", sortValue: (r) => r.sceneReference || "" },
    { key: "desc", header: "Description", cell: (r) => <span className="max-w-[200px] truncate block">{r.description || "—"}</span>, sortValue: (r) => r.description || "" },
    { key: "duration", header: "Duration", cell: (r) => r.durationSeconds ? `${Math.floor(r.durationSeconds / 60)}:${String(r.durationSeconds % 60).padStart(2, "0")}` : "—", sortValue: (r) => r.durationSeconds || 0, align: "right" as const },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} />, sortValue: (r) => r.status },
    { key: "composer", header: "Composer", cell: (r) => r.composer || "—", sortValue: (r) => r.composer || "" },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        as="h1"
        title="Background Music"
        description="Manage BGM cues, compositions, and approvals."
        icon={Music}
        badge={pid ? <Badge variant="outline" className="text-xs">{projects.find((p) => p.id === pid)?.title}</Badge> : undefined}
        actions={
          <div>
            <Label htmlFor="bgm-project-filter" className="sr-only">Project</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger id="bgm-project-filter" aria-label="Filter by project" className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All projects</SelectItem>
                {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label="Total Cues" value={String(stats.total)} icon={ListTodo} />
        <StatCard label="Approved" value={String(stats.approved)} icon={CheckCircle2} />
        <StatCard label="Pending" value={String(stats.pending)} icon={Clock} />
      </div>

      {cues.length === 0 ? (
        <EmptyState title="No BGM cues" description="No BGM cues found for the selected project." icon={Music} />
      ) : (
        <Card>
          <CardContent className="pt-4">
            <DataTable columns={columns} rows={cues} rowKey={(r) => r.id} caption="BGM cues" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
