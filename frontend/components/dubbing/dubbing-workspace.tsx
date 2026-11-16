"use client";

import { useState, useMemo } from "react";
import { Mic, CheckCircle2, Clock, ListTodo } from "lucide-react";
import { useDubbingSessions } from "@/lib/dubbing-store";
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

export function DubbingWorkspace() {
  const projects = useProjects();
  const [projectId, setProjectId] = useState("all");
  const pid = projectId === "all" ? undefined : projectId;
  const sessions = useDubbingSessions(pid);

  const stats = useMemo(() => {
    const total = sessions.length;
    const completed = sessions.filter((s) => s.status === "completed" || s.status === "approved").length;
    const pending = sessions.filter((s) => s.status === "scheduled").length;
    return { total, completed, pending };
  }, [sessions]);

  type Session = (typeof sessions)[number];
  const columns: DataTableColumn<Session>[] = [
    { key: "language", header: "Language", cell: (r) => <span className="font-medium">{r.language}</span>, sortValue: (r) => r.language },
    { key: "artist", header: "Artist", cell: (r) => r.dubbingArtist || "—", sortValue: (r) => r.dubbingArtist || "" },
    { key: "character", header: "Character", cell: (r) => r.character, sortValue: (r) => r.character },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} />, sortValue: (r) => r.status },
    { key: "date", header: "Date", cell: (r) => <span className="text-muted-foreground">{r.scheduledDate || "—"}</span>, sortValue: (r) => r.scheduledDate || "" },
    { key: "retakes", header: "Retakes", cell: (r) => String(r.retakes), sortValue: (r) => r.retakes, align: "right" as const },
    { key: "version", header: "Version", cell: (r) => `v${r.version}`, sortValue: (r) => r.version, align: "right" as const },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        as="h1"
        title="Dubbing"
        description="Manage dubbing sessions, artists, and language tracks."
        icon={Mic}
        badge={pid ? <Badge variant="outline" className="text-xs">{projects.find((p) => p.id === pid)?.title}</Badge> : undefined}
        actions={
          <div>
            <Label htmlFor="dubbing-project-filter" className="sr-only">Project</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger id="dubbing-project-filter" aria-label="Filter by project" className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All projects</SelectItem>
                {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        }
      />
      <div className="flex flex-wrap justify-end gap-2">
        <RecordManager source="module" sliceKey="dubbingSessions" label="Dubbing session" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label="Total Sessions" value={String(stats.total)} icon={ListTodo} />
        <StatCard label="Completed" value={String(stats.completed)} icon={CheckCircle2} />
        <StatCard label="Pending" value={String(stats.pending)} icon={Clock} />
      </div>

      {sessions.length === 0 ? (
        <EmptyState title="No dubbing sessions" description="No dubbing sessions found for the selected project." icon={Mic} />
      ) : (
        <Card>
          <CardContent className="pt-4">
            <DataTable columns={columns} rows={sessions} rowKey={(r) => r.id} caption="Dubbing sessions" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
