"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppDataSlice } from "@/lib/app-data-store";
import {
  usePostProdItems,
  addPostProdItem,
  updatePostProdItem,
  updatePostProdStatus,
  deletePostProdItem,
  useMilestones,
  updateMilestone,
  addMilestone,
} from "@/lib/post-prod-store";
import type { PostProductionItem, PostProdMilestone, PostProductionStatus } from "@/lib/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const DEPARTMENTS = [
  "Editing",
  "VFX",
  "Dubbing",
  "Background Music",
  "Sound Design",
  "Subtitles",
  "Trailers & Teasers",
  "Final Delivery",
];

const MILESTONE_TITLES = [
  "Rough Cut",
  "First Cut",
  "Director Review",
  "Final Cut",
  "VFX Completion",
  "Dubbing Completion",
  "Sound Mix",
  "Subtitle Completion",
  "Trailer Completion",
  "Final Master Delivery",
];

const STATUS_COLORS: Record<string, string> = {
  "not-started": "bg-slate-500/20 text-slate-300 border-slate-500/30",
  "in-progress": "bg-blue-500/20 text-blue-300 border-blue-500/30",
  review: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "in-review": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  approved: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  completed: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  "on-hold": "bg-orange-500/20 text-orange-300 border-orange-500/30",
  delayed: "bg-red-500/20 text-red-300 border-red-500/30",
};

const STATUS_LABELS: Record<string, string> = {
  "not-started": "Not Started",
  "in-progress": "In Progress",
  review: "In Review",
  "in-review": "In Review",
  approved: "Approved",
  completed: "Completed",
  "on-hold": "On Hold",
  delayed: "Delayed",
};

const MILESTONE_STATUS_COLORS: Record<string, string> = {
  pending: "bg-slate-500/20 text-slate-300",
  "in-progress": "bg-blue-500/20 text-blue-300",
  completed: "bg-emerald-500/20 text-emerald-300",
  delayed: "bg-red-500/20 text-red-300",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[status] ?? "bg-slate-500/20 text-slate-300"}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-muted">
        <div className="h-1.5 rounded-full bg-amber-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">{pct}%</span>
    </div>
  );
}

// ─── Task Dialog ──────────────────────────────────────────────────────────────

interface TaskDialogProps {
  open: boolean;
  onClose: () => void;
  initial?: Partial<PostProductionItem>;
  projectId?: string;
  projects: { id: string; title: string }[];
}

function TaskDialog({ open, onClose, initial, projectId, projects }: TaskDialogProps) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState<Partial<PostProductionItem>>(() => ({
    projectId: projectId ?? projects[0]?.id ?? "",
    department: "Editing",
    task: "",
    owner: "",
    status: "not-started" as PostProductionStatus,
    progress: 0,
    dueDate: "",
    priority: "medium",
    description: "",
    notes: "",
    ...initial,
  }));

  function set(key: keyof PostProductionItem, val: unknown) {
    setForm(f => ({ ...f, [key]: val }));
  }

  function handleSave() {
    if (!form.task?.trim()) return;
    if (isEdit && initial?.id) {
      updatePostProdItem(initial.id, form);
    } else {
      addPostProdItem({
        projectId: form.projectId ?? "",
        department: form.department ?? "Editing",
        task: form.task ?? "",
        owner: form.owner ?? "",
        status: (form.status as PostProductionStatus) ?? "not-started",
        progress: form.progress ?? 0,
        dueDate: form.dueDate ?? "",
        priority: form.priority,
        description: form.description,
        notes: form.notes,
        approvalHistory: [],
        completionPercentage: form.progress ?? 0,
      });
    }
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Task" : "New Post-Production Task"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Project</label>
              <Select value={form.projectId} onValueChange={v => set("projectId", v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Department</label>
              <Select value={form.department} onValueChange={v => set("department", v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Task Title *</label>
            <Input className="h-8 text-sm" value={form.task ?? ""} onChange={e => set("task", e.target.value)} placeholder="e.g. Picture Lock - Act 2" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Assigned To</label>
              <Input className="h-8 text-sm" value={form.owner ?? ""} onChange={e => set("owner", e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Priority</label>
              <Select value={form.priority ?? "medium"} onValueChange={v => set("priority", v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["low", "medium", "high", "critical"].map(p => <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Status</label>
              <Select value={form.status} onValueChange={v => set("status", v as PostProductionStatus)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["not-started", "in-progress", "in-review", "approved", "completed", "on-hold", "delayed"].map(s => (
                    <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Due Date</label>
              <Input className="h-8 text-sm" type="date" value={form.dueDate ?? ""} onChange={e => set("dueDate", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Start Date</label>
              <Input className="h-8 text-sm" type="date" value={form.startDate ?? ""} onChange={e => set("startDate", e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Progress %</label>
              <Input className="h-8 text-sm" type="number" min={0} max={100} value={form.progress ?? 0} onChange={e => set("progress", Number(e.target.value))} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Description</label>
            <Textarea className="min-h-[60px] text-sm" value={form.description ?? ""} onChange={e => set("description", e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Notes</label>
            <Textarea className="min-h-[50px] text-sm" value={form.notes ?? ""} onChange={e => set("notes", e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSave}>{isEdit ? "Save" : "Create Task"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────

function DashboardTab({ items, milestones, projects }: {
  items: PostProductionItem[];
  milestones: PostProdMilestone[];
  projects: { id: string; title: string }[];
}) {
  const today = new Date().toISOString().slice(0, 10);

  const total = items.length;
  const notStarted = items.filter(i => i.status === "not-started").length;
  const inProgress = items.filter(i => i.status === "in-progress").length;
  const inReview = items.filter(i => i.status === "review" || i.status === "in-review").length;
  const completed = items.filter(i => i.status === "completed").length;
  const delayed = items.filter(i => i.status === "delayed" || (i.dueDate && i.dueDate < today && i.status !== "completed")).length;
  const overdue = items.filter(i => i.dueDate && i.dueDate < today && i.status !== "completed").length;

  const upcoming = items.filter(i => i.dueDate && i.dueDate >= today && i.status !== "completed")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  const cards = [
    { label: "Total Tasks", value: total, color: "text-slate-300" },
    { label: "Not Started", value: notStarted, color: "text-slate-400" },
    { label: "In Progress", value: inProgress, color: "text-blue-400" },
    { label: "In Review", value: inReview, color: "text-amber-400" },
    { label: "Completed", value: completed, color: "text-emerald-400" },
    { label: "Delayed / Overdue", value: overdue, color: "text-red-400" },
  ];

  // Project-wise progress
  const projectProgress = projects.map(p => {
    const pItems = items.filter(i => i.projectId === p.id);
    const done = pItems.filter(i => i.status === "completed").length;
    const pct = pItems.length ? Math.round((done / pItems.length) * 100) : 0;
    return { ...p, total: pItems.length, done, pct };
  }).filter(p => p.total > 0);

  // Department progress
  const deptProgress = DEPARTMENTS.map(dept => {
    const dItems = items.filter(i => i.department === dept);
    if (!dItems.length) return null;
    const avg = Math.round(dItems.reduce((a, i) => a + (i.progress ?? i.completionPercentage ?? 0), 0) / dItems.length);
    const done = dItems.filter(i => i.status === "completed").length;
    return { dept, total: dItems.length, done, avg };
  }).filter(Boolean) as { dept: string; total: number; done: number; avg: number }[];

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map(c => (
          <Card key={c.label} className="border-white/5">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className={`mt-1 text-2xl font-bold ${c.color}`}>{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Project-wise progress */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Project-wise Progress</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {projectProgress.map(p => (
              <div key={p.id}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-medium truncate max-w-[180px]" title={p.title}>{p.title}</span>
                  <span className="text-muted-foreground ml-2">{p.done}/{p.total} tasks · {p.pct}%</span>
                </div>
                <ProgressBar value={p.pct} />
              </div>
            ))}
            {projectProgress.length === 0 && <p className="text-xs text-muted-foreground">No tasks</p>}
          </CardContent>
        </Card>

        {/* Department progress */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Department-wise Progress</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {deptProgress.map(d => (
              <div key={d.dept}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-medium">{d.dept}</span>
                  <span className="text-muted-foreground">{d.done}/{d.total} · {d.avg}%</span>
                </div>
                <ProgressBar value={d.avg} />
              </div>
            ))}
            {deptProgress.length === 0 && <p className="text-xs text-muted-foreground">No tasks</p>}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming deadlines */}
      {upcoming.length > 0 && (
        <Card className="border-amber-500/20">
          <CardHeader><CardTitle className="text-sm text-amber-400">Upcoming Deadlines</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcoming.map(i => {
                const proj = projects.find(p => p.id === i.projectId);
                return (
                  <div key={i.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                    <div>
                      <span className="font-medium">{i.task}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{i.department} · {proj?.title ?? i.projectId}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={i.status} />
                      <span className="text-xs text-muted-foreground">{i.dueDate}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Milestone summary */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Milestone Overview</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            {["pending", "in-progress", "completed", "delayed"].map(st => {
              const count = milestones.filter(m => m.status === st).length;
              return (
                <div key={st} className={`rounded-lg border px-3 py-2 ${MILESTONE_STATUS_COLORS[st]}`}>
                  <span className="text-xs font-medium capitalize">{st.replace("-", " ")}</span>
                  <span className="ml-2 text-lg font-bold">{count}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Pipeline Tab ─────────────────────────────────────────────────────────────

function PipelineTab({ items, projects }: { items: PostProductionItem[]; projects: { id: string; title: string }[] }) {
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [detailItem, setDetailItem] = useState<PostProductionItem | null>(null);

  const filtered = items.filter(i =>
    (selectedProject === "all" || i.projectId === selectedProject) &&
    (selectedStatus === "all" || i.status === selectedStatus)
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="h-8 w-48 text-xs"><SelectValue placeholder="All Projects" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(STATUS_LABELS).filter(([k]) => !k.includes("review") || k === "in-review").map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {DEPARTMENTS.map(dept => {
          const dItems = filtered.filter(i => i.department === dept);
          if (!dItems.length) return null;
          const avg = Math.round(dItems.reduce((a, i) => a + (i.progress ?? 0), 0) / dItems.length);
          const done = dItems.filter(i => i.status === "completed").length;
          return (
            <Card key={dept}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{dept}</CardTitle>
                  <span className="text-xs text-muted-foreground">{done}/{dItems.length} completed</span>
                </div>
                <ProgressBar value={avg} />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dItems.map(i => {
                    const proj = projects.find(p => p.id === i.projectId);
                    return (
                      <button
                        key={i.id}
                        onClick={() => setDetailItem(i)}
                        className="flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{i.task}</p>
                          <p className="text-xs text-muted-foreground">{proj?.title ?? i.projectId} · {i.owner}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <ProgressBar value={i.progress ?? 0} />
                          <StatusBadge status={i.status} />
                          <span className="text-xs text-muted-foreground w-24 text-right">{i.dueDate}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detail dialog */}
      {detailItem && (
        <Dialog open onOpenChange={() => setDetailItem(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{detailItem.task}</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2 text-sm">
              <div className="flex gap-2 flex-wrap">
                <StatusBadge status={detailItem.status} />
                {detailItem.priority && <Badge variant="outline" className="text-xs">{detailItem.priority}</Badge>}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">Department: </span>{detailItem.department}</div>
                <div><span className="text-muted-foreground">Owner: </span>{detailItem.owner}</div>
                <div><span className="text-muted-foreground">Due: </span>{detailItem.dueDate}</div>
                <div><span className="text-muted-foreground">Progress: </span>{detailItem.progress}%</div>
              </div>
              <ProgressBar value={detailItem.progress ?? 0} />
              {detailItem.description && <p className="text-xs text-muted-foreground">{detailItem.description}</p>}
              {detailItem.notes && <p className="text-xs border rounded p-2">{detailItem.notes}</p>}
              {(detailItem.approvalHistory?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-medium mb-1">History</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {detailItem.approvalHistory!.map((h, idx) => (
                      <p key={idx} className="text-xs text-muted-foreground">{h.at.slice(0, 10)} — {h.by}: {h.action}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setDetailItem(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ─── Task Board (Kanban) ──────────────────────────────────────────────────────

const KANBAN_COLS: { status: string; label: string }[] = [
  { status: "not-started", label: "Not Started" },
  { status: "in-progress", label: "In Progress" },
  { status: "in-review", label: "In Review" },
  { status: "approved", label: "Approved" },
  { status: "completed", label: "Completed" },
  { status: "delayed", label: "Delayed" },
];

function TaskBoardTab({ items, projects }: { items: PostProductionItem[]; projects: { id: string; title: string }[] }) {
  const [filterProject, setFilterProject] = useState("all");
  const [filterDept, setFilterDept] = useState("all");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<PostProductionItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewTarget, setReviewTarget] = useState<{ id: string; action: "approve" | "request" } | null>(null);

  const filtered = items.filter(i =>
    (filterProject === "all" || i.projectId === filterProject) &&
    (filterDept === "all" || i.department === filterDept) &&
    (search === "" || i.task.toLowerCase().includes(search.toLowerCase()) || i.owner.toLowerCase().includes(search.toLowerCase()))
  );

  // Normalize "review" → "in-review" for Kanban display
  function normalizeStatus(status: string) {
    return status === "review" ? "in-review" : status;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Input className="h-8 w-48 text-xs" placeholder="Search tasks…" value={search} onChange={e => setSearch(e.target.value)} />
        <Select value={filterProject} onValueChange={setFilterProject}>
          <SelectTrigger className="h-8 w-44 text-xs"><SelectValue placeholder="All Projects" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterDept} onValueChange={setFilterDept}>
          <SelectTrigger className="h-8 w-44 text-xs"><SelectValue placeholder="All Departments" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button size="sm" className="h-8 ml-auto" onClick={() => { setEditItem(null); setDialogOpen(true); }}>
          + New Task
        </Button>
      </div>

      {/* Kanban columns — horizontal scroll */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {KANBAN_COLS.map(col => {
          const colItems = filtered.filter(i => normalizeStatus(i.status) === col.status);
          return (
            <div key={col.status} className="w-56 shrink-0">
              <div className={`mb-2 flex items-center justify-between rounded px-2 py-1 text-xs font-medium ${STATUS_COLORS[col.status] ?? ""}`}>
                <span>{col.label}</span>
                <span>{colItems.length}</span>
              </div>
              <div className="space-y-2">
                {colItems.map(item => {
                  const proj = projects.find(p => p.id === item.projectId);
                  return (
                    <div key={item.id} className="rounded-lg border bg-card p-3 text-sm space-y-2">
                      <p className="font-medium leading-tight line-clamp-2">{item.task}</p>
                      <p className="text-xs text-muted-foreground">{item.department}</p>
                      <p className="text-xs text-muted-foreground truncate">{proj?.title ?? item.projectId}</p>
                      {item.owner && <p className="text-xs text-muted-foreground">👤 {item.owner}</p>}
                      <ProgressBar value={item.progress ?? 0} />
                      {item.dueDate && <p className="text-xs text-muted-foreground">Due: {item.dueDate}</p>}
                      <div className="flex gap-1 flex-wrap">
                        <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => { setEditItem(item); setDialogOpen(true); }}>Edit</Button>
                        {(item.status === "in-progress" || item.status === "in-review" || item.status === "review") && (
                          <Button variant="ghost" size="sm" className="h-6 text-xs px-2 text-amber-400 hover:text-amber-300"
                            onClick={() => updatePostProdStatus(item.id, "in-review", "User")}>
                            Submit Review
                          </Button>
                        )}
                        {(item.status === "in-review" || item.status === "review") && (
                          <Button variant="ghost" size="sm" className="h-6 text-xs px-2 text-emerald-400 hover:text-emerald-300"
                            onClick={() => setReviewTarget({ id: item.id, action: "approve" })}>
                            Approve
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-6 text-xs px-2 text-red-400 hover:text-red-300" onClick={() => setDeleteConfirm(item.id)}>Del</Button>
                      </div>
                    </div>
                  );
                })}
                {colItems.length === 0 && <p className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">Empty</p>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create/Edit dialog */}
      <TaskDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditItem(null); }}
        initial={editItem ?? undefined}
        projectId={filterProject !== "all" ? filterProject : undefined}
        projects={projects}
      />

      {/* Delete confirm */}
      {deleteConfirm && (
        <Dialog open onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Delete Task?</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button variant="destructive" size="sm" onClick={() => { deletePostProdItem(deleteConfirm); setDeleteConfirm(null); }}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Review action dialog */}
      {reviewTarget && (
        <Dialog open onOpenChange={() => setReviewTarget(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>{reviewTarget.action === "approve" ? "Approve Task" : "Request Changes"}</DialogTitle></DialogHeader>
            <div className="py-2">
              <label className="mb-1 block text-xs text-muted-foreground">Notes</label>
              <Textarea className="min-h-[80px] text-sm" value={reviewNote} onChange={e => setReviewNote(e.target.value)} placeholder="Optional review notes…" />
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setReviewTarget(null)}>Cancel</Button>
              <Button size="sm" onClick={() => {
                const status = reviewTarget.action === "approve" ? "approved" : "in-progress";
                updatePostProdStatus(reviewTarget.id, status as PostProductionStatus, "Reviewer", reviewNote);
                setReviewNote(""); setReviewTarget(null);
              }}>
                {reviewTarget.action === "approve" ? "Approve" : "Request Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ─── Milestones Tab ───────────────────────────────────────────────────────────

function MilestonesTab({ projects }: { projects: { id: string; title: string }[] }) {
  const [selectedProject, setSelectedProject] = useState(projects[0]?.id ?? "");
  const milestones = useMilestones(selectedProject);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<PostProdMilestone>>({});
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<Partial<PostProdMilestone>>({ projectId: selectedProject, status: "pending", notes: "" });

  function startEdit(m: PostProdMilestone) {
    setEditId(m.id);
    setEditForm({ ...m });
  }
  function saveEdit() {
    if (editId) updateMilestone(editId, editForm);
    setEditId(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={selectedProject} onValueChange={v => { setSelectedProject(v); setAddForm(f => ({ ...f, projectId: v })); }}>
          <SelectTrigger className="h-8 w-56 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button size="sm" className="h-8" onClick={() => setAddOpen(true)}>+ Add Milestone</Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="space-y-2">
            {milestones.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No milestones for this project.</p>}
            {milestones.map(m => (
              <div key={m.id} className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm">
                {editId === m.id ? (
                  <div className="flex flex-1 flex-wrap gap-2 items-center">
                    <Select value={editForm.title} onValueChange={v => setEditForm(f => ({ ...f, title: v }))}>
                      <SelectTrigger className="h-7 w-44 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{MILESTONE_TITLES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={editForm.status} onValueChange={v => setEditForm(f => ({ ...f, status: v as PostProdMilestone["status"] }))}>
                      <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{["pending", "in-progress", "completed", "delayed"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input type="date" className="h-7 text-xs w-36" value={editForm.targetDate ?? ""} onChange={e => setEditForm(f => ({ ...f, targetDate: e.target.value }))} />
                    <Input className="h-7 text-xs w-40" placeholder="Notes" value={editForm.notes ?? ""} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} />
                    <Button size="sm" className="h-7" onClick={saveEdit}>Save</Button>
                    <Button variant="outline" size="sm" className="h-7" onClick={() => setEditId(null)}>Cancel</Button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1">
                      <span className="font-medium">{m.title}</span>
                      {m.notes && <span className="ml-2 text-xs text-muted-foreground">{m.notes}</span>}
                    </div>
                    <span className="text-xs text-muted-foreground">Target: {m.targetDate}</span>
                    {m.actualDate && <span className="text-xs text-emerald-400">Done: {m.actualDate}</span>}
                    <span className={`rounded-full px-2 py-0.5 text-xs ${MILESTONE_STATUS_COLORS[m.status] ?? ""}`}>{m.status}</span>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => startEdit(m)}>Edit</Button>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-emerald-400" onClick={() => updateMilestone(m.id, { status: "completed", actualDate: new Date().toISOString().slice(0, 10) })}>✓</Button>
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add milestone dialog */}
      {addOpen && (
        <Dialog open onOpenChange={() => setAddOpen(false)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Add Milestone</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Title</label>
                <Select value={addForm.title} onValueChange={v => setAddForm(f => ({ ...f, title: v }))}>
                  <SelectTrigger className="text-xs"><SelectValue placeholder="Select milestone" /></SelectTrigger>
                  <SelectContent>{MILESTONE_TITLES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Target Date</label>
                <Input type="date" className="text-sm" value={addForm.targetDate ?? ""} onChange={e => setAddForm(f => ({ ...f, targetDate: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Notes</label>
                <Input className="text-sm" value={addForm.notes ?? ""} onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={() => {
                if (!addForm.title || !addForm.targetDate) return;
                addMilestone({ projectId: selectedProject, title: addForm.title, targetDate: addForm.targetDate, status: "pending", notes: addForm.notes ?? "" });
                setAddOpen(false); setAddForm({ projectId: selectedProject, status: "pending", notes: "" });
              }}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ─── Approvals Tab ────────────────────────────────────────────────────────────

function ApprovalsTab({ items, projects }: { items: PostProductionItem[]; projects: { id: string; title: string }[] }) {
  const today = new Date().toISOString().slice(0, 10);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewTarget, setReviewTarget] = useState<{ id: string; action: "approve" | "request" } | null>(null);

  const pending = items.filter(i => i.status === "review" || i.status === "in-review");

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{pending.length} task{pending.length !== 1 ? "s" : ""} awaiting review</p>
      {pending.length === 0 && (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No tasks pending review.</CardContent></Card>
      )}
      {pending.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Task</th>
                  <th className="pb-2 font-medium">Project</th>
                  <th className="pb-2 font-medium">Department</th>
                  <th className="pb-2 font-medium">Assignee</th>
                  <th className="pb-2 font-medium">Due</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pending.map(i => {
                  const proj = projects.find(p => p.id === i.projectId);
                  const overdue = i.dueDate && i.dueDate < today;
                  return (
                    <tr key={i.id} className="text-xs">
                      <td className="py-2 font-medium max-w-[160px] truncate" title={i.task}>{i.task}</td>
                      <td className="py-2 text-muted-foreground max-w-[120px] truncate">{proj?.title ?? i.projectId}</td>
                      <td className="py-2 text-muted-foreground">{i.department}</td>
                      <td className="py-2 text-muted-foreground">{i.owner}</td>
                      <td className={`py-2 ${overdue ? "text-red-400" : "text-muted-foreground"}`}>{i.dueDate}</td>
                      <td className="py-2">
                        <div className="flex gap-1">
                          <Button size="sm" className="h-6 px-2 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={() => setReviewTarget({ id: i.id, action: "approve" })}>Approve</Button>
                          <Button variant="outline" size="sm" className="h-6 px-2 text-xs" onClick={() => setReviewTarget({ id: i.id, action: "request" })}>Request Changes</Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {reviewTarget && (
        <Dialog open onOpenChange={() => setReviewTarget(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>{reviewTarget.action === "approve" ? "Approve Task" : "Request Changes"}</DialogTitle></DialogHeader>
            <div className="py-2">
              <label className="mb-1 block text-xs text-muted-foreground">Review Notes</label>
              <Textarea className="min-h-[80px] text-sm" value={reviewNote} onChange={e => setReviewNote(e.target.value)} placeholder="Optional notes…" />
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setReviewTarget(null)}>Cancel</Button>
              <Button size="sm" onClick={() => {
                const status = reviewTarget.action === "approve" ? "approved" : "in-progress";
                updatePostProdStatus(reviewTarget.id, status as PostProductionStatus, "Reviewer", reviewNote);
                setReviewNote(""); setReviewTarget(null);
              }}>
                {reviewTarget.action === "approve" ? "Approve" : "Send Back"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface PostProdPipelineProps {
  projectId?: string;
}

export function PostProdPipeline({ projectId }: PostProdPipelineProps) {
  const allProjects = useAppDataSlice("projects") ?? [];
  const projects = useMemo(() =>
    allProjects.map(p => ({ id: p.id, title: p.title })),
    [allProjects]
  );
  const items = usePostProdItems(projectId);
  const milestones = useMilestones(projectId);

  return (
    <Tabs defaultValue="dashboard">
      <TabsList className="mb-4">
        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
        <TabsTrigger value="taskboard">Task Board</TabsTrigger>
        <TabsTrigger value="milestones">Milestones</TabsTrigger>
        <TabsTrigger value="approvals">
          Approvals
          {items.filter(i => i.status === "review" || i.status === "in-review").length > 0 && (
            <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] text-black font-bold">
              {items.filter(i => i.status === "review" || i.status === "in-review").length}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="dashboard">
        <DashboardTab items={items} milestones={milestones} projects={projects} />
      </TabsContent>
      <TabsContent value="pipeline">
        <PipelineTab items={items} projects={projects} />
      </TabsContent>
      <TabsContent value="taskboard">
        <TaskBoardTab items={items} projects={projects} />
      </TabsContent>
      <TabsContent value="milestones">
        <MilestonesTab projects={projectId ? projects.filter(p => p.id === projectId) : projects} />
      </TabsContent>
      <TabsContent value="approvals">
        <ApprovalsTab items={items} projects={projects} />
      </TabsContent>
    </Tabs>
  );
}
