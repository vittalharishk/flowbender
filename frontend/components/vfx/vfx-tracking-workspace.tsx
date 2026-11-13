"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Edit2,
  LayoutGrid,
  List,
  Plus,
  Send,
  Trash2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useAppDataSlice, updateAppDataSlice } from "@/lib/app-data-store";
import { useProjects, useProject } from "@/lib/project-store";
import { calcVfxStats } from "@/lib/vfx-store";
import type { VfxShot, VfxShotStatus } from "@/lib/types";
import { useConfirm } from "@/components/app/confirm-dialog";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { StatusBadge } from "@/components/app/status-badge";
import { EmptyState } from "@/components/app/empty-state";
import { SearchInput } from "@/components/app/search-input";
import { DataTable, type DataTableColumn } from "@/components/app/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VfxPipelineBar } from "./vfx-pipeline-bar";
import { VfxShotDetailDialog } from "./vfx-shot-detail-dialog";
import { VfxShotFormDialog, type VfxShotFormData } from "./vfx-shot-form-dialog";
import { vfxPriorityTones, vfxStatusLabels, vfxStatusTones, isOverdue } from "./vfx-status";

interface VfxTrackingWorkspaceProps {
  projectId?: string;
}

const emptyForm: VfxShotFormData = {
  shotCode: "",
  sequence: "",
  description: "",
  vendorId: "",
  status: "briefed",
  priority: "medium",
  dueDate: new Date().toISOString().slice(0, 10),
  projectId: "",
};

export function VfxTrackingWorkspace({ projectId: scopedProjectId }: VfxTrackingWorkspaceProps) {
  const confirm = useConfirm();
  const projects = useProjects();
  const vfxShots = useAppDataSlice("vfxShots");
  const scopedProject = useProject(scopedProjectId || "");

  const [selectedProjectId, setSelectedProjectId] = useState<string>(scopedProjectId || "all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"cards" | "table">("cards");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingShot, setEditingShot] = useState<VfxShot | null>(null);
  const [detailShot, setDetailShot] = useState<VfxShot | null>(null);
  const [formData, setFormData] = useState<VfxShotFormData>(emptyForm);

  const effectiveProjectId = scopedProjectId || selectedProjectId;

  const filteredShots = useMemo(() => {
    const query = search.trim().toLowerCase();
    return vfxShots.filter((shot) => {
      if (effectiveProjectId && effectiveProjectId !== "all" && shot.projectId !== effectiveProjectId) return false;
      if (statusFilter !== "all" && shot.status !== statusFilter) return false;
      if (priorityFilter !== "all" && shot.priority !== priorityFilter) return false;
      if (
        query &&
        ![shot.shotCode, shot.sequence, shot.description, shot.vendorId ?? ""].some((field) =>
          field.toLowerCase().includes(query)
        )
      )
        return false;
      return true;
    });
  }, [vfxShots, effectiveProjectId, statusFilter, priorityFilter, search]);

  const stats = useMemo(() => calcVfxStats(filteredShots), [filteredShots]);
  const statusCounts: Record<VfxShotStatus, number> = {
    briefed: stats.briefed,
    "in-progress": stats.inProgress,
    "client-review": stats.inReview,
    final: stats.final,
  };

  const hasFilters = statusFilter !== "all" || priorityFilter !== "all" || search.trim().length > 0;
  const projectTitleFor = (id: string) => projects.find((p) => p.id === id)?.title;

  function handleOpenAdd() {
    setFormData({
      ...emptyForm,
      shotCode: `VFX-${String(vfxShots.length + 1).padStart(3, "0")}`,
      sequence: "Sequence 01",
      vendorId: "DNEG India",
      dueDate: new Date().toISOString().slice(0, 10),
      projectId: effectiveProjectId && effectiveProjectId !== "all" ? effectiveProjectId : projects[0]?.id || "p1",
    });
    setIsAddOpen(true);
  }

  function handleSaveAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.shotCode.trim()) return;

    const newShot: VfxShot = {
      id: `vfx-${Date.now()}`,
      projectId:
        formData.projectId ||
        (effectiveProjectId !== "all" ? effectiveProjectId : "") ||
        projects[0]?.id ||
        "p1",
      shotCode: formData.shotCode.trim(),
      sequence: formData.sequence.trim() || "General",
      description: formData.description.trim() || "CGI enhancement",
      vendorId: formData.vendorId.trim() || undefined,
      status: formData.status,
      priority: formData.priority,
      dueDate: formData.dueDate || new Date().toISOString().slice(0, 10),
    };

    updateAppDataSlice("vfxShots", (current) => [newShot, ...current]);
    toast.success(`VFX Shot ${newShot.shotCode} created.`);
    setIsAddOpen(false);
  }

  function handleOpenEdit(shot: VfxShot) {
    setDetailShot(null);
    setEditingShot(shot);
    setFormData({
      shotCode: shot.shotCode,
      sequence: shot.sequence,
      description: shot.description,
      vendorId: shot.vendorId || "",
      status: shot.status,
      priority: shot.priority,
      dueDate: shot.dueDate,
      projectId: shot.projectId,
    });
  }

  function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingShot || !formData.shotCode.trim()) return;

    updateAppDataSlice("vfxShots", (current) =>
      current.map((s) =>
        s.id === editingShot.id
          ? {
              ...s,
              shotCode: formData.shotCode.trim(),
              sequence: formData.sequence.trim(),
              description: formData.description.trim(),
              vendorId: formData.vendorId.trim() || undefined,
              status: formData.status,
              priority: formData.priority,
              dueDate: formData.dueDate,
              projectId: formData.projectId || s.projectId,
            }
          : s
      )
    );
    toast.success(`VFX Shot ${formData.shotCode} updated.`);
    setEditingShot(null);
  }

  async function handleDeleteShot(id: string) {
    if (
      await confirm({
        title: "Delete VFX shot?",
        description: "This VFX shot will be permanently removed.",
        confirmLabel: "Delete",
      })
    ) {
      updateAppDataSlice("vfxShots", (current) => current.filter((s) => s.id !== id));
      toast.info("VFX shot removed.");
      if (editingShot?.id === id) setEditingShot(null);
      if (detailShot?.id === id) setDetailShot(null);
    }
  }

  function handleSendToVendor(shot: VfxShot) {
    const nextStatus: VfxShotStatus = shot.status === "briefed" ? "in-progress" : shot.status;
    updateAppDataSlice("vfxShots", (current) =>
      current.map((s) => (s.id === shot.id ? { ...s, status: nextStatus } : s))
    );
    toast.success(`Plate turnover dispatched for ${shot.shotCode} to ${shot.vendorId || "assigned vendor"}.`);
  }

  function handleQuickAdvance(shot: VfxShot) {
    let nextStatus: VfxShotStatus = shot.status;
    if (shot.status === "briefed") nextStatus = "in-progress";
    else if (shot.status === "in-progress") nextStatus = "client-review";
    else if (shot.status === "client-review") nextStatus = "final";

    updateAppDataSlice("vfxShots", (current) =>
      current.map((s) => (s.id === shot.id ? { ...s, status: nextStatus } : s))
    );
    toast.success(`${shot.shotCode} advanced to ${nextStatus.replace("-", " ")}`);
  }

  const columns: DataTableColumn<VfxShot>[] = [
    {
      key: "shotCode",
      header: "Shot",
      sortValue: (s) => s.shotCode,
      cell: (s) => (
        <button
          type="button"
          onClick={() => setDetailShot(s)}
          className="font-medium text-amber-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-amber-400"
        >
          {s.shotCode}
        </button>
      ),
    },
    { key: "sequence", header: "Sequence", sortValue: (s) => s.sequence, cell: (s) => s.sequence },
    {
      key: "status",
      header: "Status",
      sortValue: (s) => s.status,
      cell: (s) => (
        <StatusBadge status={s.status} tone={vfxStatusTones[s.status]} label={vfxStatusLabels[s.status]} />
      ),
    },
    {
      key: "priority",
      header: "Priority",
      sortValue: (s) => s.priority,
      cell: (s) => (
        <StatusBadge status={s.priority} tone={vfxPriorityTones[s.priority]} label={s.priority} />
      ),
    },
    {
      key: "vendor",
      header: "Vendor",
      sortValue: (s) => s.vendorId ?? "",
      cell: (s) => s.vendorId || <span className="text-muted-foreground">Unassigned</span>,
    },
    {
      key: "dueDate",
      header: "Due",
      sortValue: (s) => s.dueDate,
      cell: (s) =>
        isOverdue(s.dueDate, s.status) ? (
          <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
            {s.dueDate}
          </span>
        ) : (
          s.dueDate
        ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      cell: (s) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="outline" className="h-8" onClick={() => setDetailShot(s)}>
            Details
          </Button>
          <Button size="sm" variant="ghost" className="h-8" aria-label={`Edit ${s.shotCode}`} onClick={() => handleOpenEdit(s)}>
            <Edit2 className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        as="h1"
        icon={Zap}
        title={scopedProject ? `${scopedProject.title} · VFX Tracking` : "VFX Tracking"}
        description={
          scopedProject
            ? `Manage shots, vendor turnovers, and review approvals for ${scopedProject.title}`
            : "Manage visual effects shots, studio vendor turnovers, and plate deliverables"
        }
        actions={
          <Button onClick={handleOpenAdd} variant="primary" className="gap-2">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add VFX Shot
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Shots" value={stats.total} icon={Zap} />
        <StatCard label="In Progress" value={stats.inProgress} icon={Clock} hint={`${stats.briefed} briefed`} />
        <StatCard label="In Review" value={stats.inReview} icon={CheckCircle2} hint={`${stats.final} final`} />
        <StatCard
          label="Overdue"
          value={stats.overdue}
          icon={AlertTriangle}
          hint={`${stats.highPriority} high priority open`}
        />
      </div>

      <Card>
        <CardContent className="pt-5">
          <VfxPipelineBar counts={statusCounts} total={stats.total} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 pt-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label htmlFor="vfx-search">Search</Label>
              <SearchInput
                id="vfx-search"
                label="Search VFX shots"
                className="mt-1 h-10"
                placeholder="Shot code, sequence, description or vendor"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex h-10 overflow-hidden rounded-lg border" role="group" aria-label="View mode">
              <button
                type="button"
                onClick={() => setView("cards")}
                aria-pressed={view === "cards"}
                aria-label="Card view"
                className={`flex items-center justify-center px-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500 ${
                  view === "cards" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setView("table")}
                aria-pressed={view === "table"}
                aria-label="Table view"
                className={`flex items-center justify-center border-l px-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500 ${
                  view === "table" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <List className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {!scopedProjectId && (
              <div className="flex-1">
                <Label htmlFor="vfx-project-filter">Project</Label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger id="vfx-project-filter" className="mt-1">
                    <SelectValue placeholder="Select Project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex-1">
              <Label htmlFor="vfx-status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="vfx-status-filter" className="mt-1">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="briefed">Briefed</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="client-review">Client Review</SelectItem>
                  <SelectItem value="final">Final</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label htmlFor="vfx-priority-filter">Priority</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger id="vfx-priority-filter" className="mt-1">
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredShots.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="No VFX shots found"
          description={
            hasFilters
              ? "No shots match the current search and filters."
              : "Create and dispatch VFX shots to monitor plate turnarounds and client review approvals."
          }
          action={
            hasFilters ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setPriorityFilter("all");
                }}
              >
                Clear search and filters
              </Button>
            ) : (
              <Button onClick={handleOpenAdd} variant="primary" className="gap-1.5">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add First VFX Shot
              </Button>
            )
          }
        />
      ) : view === "table" ? (
        <DataTable
          columns={columns}
          rows={filteredShots}
          rowKey={(s) => s.id}
          caption="VFX shots"
          empty="No VFX shots match the current filters."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredShots.map((shot) => {
            const overdue = isOverdue(shot.dueDate, shot.status);
            const projectTitle = projectTitleFor(shot.projectId);
            return (
              <Card key={shot.id} className="flex flex-col justify-between transition-colors hover:border-amber-500/50">
                <div>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Zap className="h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
                          <button
                            type="button"
                            onClick={() => setDetailShot(shot)}
                            className="truncate hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                          >
                            {shot.shotCode}
                          </button>
                        </CardTitle>
                        <CardDescription className="mt-1 text-xs">
                          {shot.sequence}
                          {projectTitle && !scopedProjectId ? ` · ${projectTitle}` : ""}
                        </CardDescription>
                      </div>
                      <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                        <StatusBadge
                          status={shot.status}
                          tone={vfxStatusTones[shot.status]}
                          label={vfxStatusLabels[shot.status]}
                        />
                        <StatusBadge
                          status={shot.priority}
                          tone={vfxPriorityTones[shot.priority]}
                          label={shot.priority}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <p className="text-sm text-foreground/90">{shot.description}</p>
                    <div className="flex flex-wrap justify-between gap-2 border-t pt-2 text-xs text-muted-foreground">
                      <span
                        className={`flex items-center gap-1.5 ${
                          overdue ? "font-medium text-red-600 dark:text-red-400" : ""
                        }`}
                      >
                        {overdue ? (
                          <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        {overdue ? "Overdue: " : "Due: "}
                        {shot.dueDate}
                      </span>
                      {shot.vendorId && (
                        <span className="font-medium text-foreground">
                          Vendor: <span className="text-amber-600 dark:text-amber-400">{shot.vendorId}</span>
                        </span>
                      )}
                    </div>
                  </CardContent>
                </div>

                <div className="flex items-center justify-between gap-2 border-t bg-muted/10 p-3">
                  <div className="flex items-center gap-1.5">
                    {shot.status !== "final" && (
                      <Button size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={() => handleQuickAdvance(shot)}>
                        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                        Advance
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-8 gap-1 text-xs" onClick={() => handleSendToVendor(shot)}>
                      <Send className="h-3 w-3" aria-hidden="true" />
                      Dispatch
                    </Button>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={() => handleOpenEdit(shot)}>
                      <Edit2 className="h-3 w-3" aria-hidden="true" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={`Delete ${shot.shotCode}`}
                      className="h-8 text-xs text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteShot(shot.id)}
                    >
                      <Trash2 className="h-3 w-3" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <VfxShotFormDialog
        open={isAddOpen}
        mode="add"
        formData={formData}
        projects={projects}
        showProjectPicker={!scopedProjectId}
        onChange={setFormData}
        onSubmit={handleSaveAdd}
        onOpenChange={setIsAddOpen}
      />

      <VfxShotFormDialog
        open={!!editingShot}
        mode="edit"
        formData={formData}
        projects={projects}
        showProjectPicker={!scopedProjectId}
        onChange={setFormData}
        onSubmit={handleSaveEdit}
        onOpenChange={(open) => !open && setEditingShot(null)}
        onDelete={() => editingShot && handleDeleteShot(editingShot.id)}
      />

      <VfxShotDetailDialog
        shot={detailShot}
        projectTitle={detailShot ? projectTitleFor(detailShot.projectId) : undefined}
        onClose={() => setDetailShot(null)}
        onEdit={handleOpenEdit}
      />
    </div>
  );
}
