"use client";

import { useState, useMemo } from "react";
import { Film, CheckCircle2, Clock, ListTodo } from "lucide-react";
import { useEditingTasks } from "@/lib/editing-store";
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

export function EditingWorkspace() {
  const projects = useProjects();
  const [projectId, setProjectId] = useState("all");
  const pid = projectId === "all" ? undefined : projectId;
  const tasks = useEditingTasks(pid);

  const stats = useMemo(() => {
    const total = tasks.length;
    const inProgress = tasks.filter((t) => t.status === "in-progress").length;
    const completed = tasks.filter((t) => t.status === "approved" || t.status === "final").length;
    return { total, inProgress, completed };
  }, [tasks]);

  type Task = (typeof tasks)[number];
  const columns: DataTableColumn<Task>[] = [
    { key: "scene", header: "Scene Reference", cell: (r) => <span className="font-medium">{r.sceneReference || "—"}</span>, sortValue: (r) => r.sceneReference || "" },
    { key: "cut", header: "Cut Type", cell: (r) => <span className="capitalize">{r.currentCut.replace("-", " ")}</span>, sortValue: (r) => r.currentCut },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} />, sortValue: (r) => r.status },
    { key: "approval", header: "Approval", cell: (r) => <StatusBadge status={r.approvalStatus} />, sortValue: (r) => r.approvalStatus },
    { key: "editor", header: "Assigned To", cell: (r) => r.editor || "—", sortValue: (r) => r.editor || "" },
    { key: "start", header: "Start Date", cell: (r) => <span className="text-muted-foreground">{r.startDate || "—"}</span>, sortValue: (r) => r.startDate || "" },
    { key: "completion", header: "Completion", cell: (r) => <span className="text-muted-foreground">{r.completionDate || "—"}</span>, sortValue: (r) => r.completionDate || "" },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        as="h1"
        title="Editing"
        description="Manage editing tasks, cuts, and approvals."
        icon={Film}
        badge={pid ? <Badge variant="outline" className="text-xs">{projects.find((p) => p.id === pid)?.title}</Badge> : undefined}
        actions={
          <div>
            <Label htmlFor="editing-project-filter" className="sr-only">Project</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger id="editing-project-filter" aria-label="Filter by project" className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All projects</SelectItem>
                {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        }
      />
      <div className="flex flex-wrap justify-end gap-2">
        <RecordManager source="module" sliceKey="editingTasks" label="Editing task" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label="Total Tasks" value={String(stats.total)} icon={ListTodo} />
        <StatCard label="In Progress" value={String(stats.inProgress)} icon={Clock} />
        <StatCard label="Completed" value={String(stats.completed)} icon={CheckCircle2} />
      </div>

      {tasks.length === 0 ? (
        <EmptyState title="No editing tasks" description="No editing tasks found for the selected project." icon={Film} />
      ) : (
        <Card>
          <CardContent className="pt-4">
            <DataTable columns={columns} rows={tasks} rowKey={(r) => r.id} caption="Editing tasks" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
