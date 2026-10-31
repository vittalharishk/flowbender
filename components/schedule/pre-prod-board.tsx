"use client";

import { useState } from "react";
import {
  CheckSquare, ClipboardList, LayoutGrid, Shield, Plus, Pencil, Trash2, X, ChevronDown, ChevronRight,
} from "lucide-react";
import { useAppDataSlice, updateAppDataSlice } from "@/lib/app-data-store";
import {
  usePreProdChecklist,
  toggleChecklistItem,
  addChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
} from "@/lib/pre-prod-store";
import type { ProductionTask, PreProdChecklistItem, ChecklistStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";

// ── helpers ──────────────────────────────────────────────────────────────────

const TASK_STATUS_COLOR: Record<string, string> = {
  open: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  "in-progress": "bg-blue-500/20 text-blue-300 border-blue-500/30",
  blocked: "bg-red-500/20 text-red-300 border-red-500/30",
  done: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};
const TASK_STATUS_LABEL: Record<string, string> = {
  open: "Open",
  "in-progress": "In Progress",
  blocked: "Blocked",
  done: "Done",
};
const PRIORITY_COLOR: Record<string, string> = {
  low: "bg-slate-500/10 text-slate-400",
  medium: "bg-amber-500/15 text-amber-400",
  high: "bg-orange-500/20 text-orange-400",
  critical: "bg-red-500/20 text-red-400",
};
const CHECKLIST_STATUS_COLOR: Record<ChecklistStatus, string> = {
  pending: "bg-slate-500/20 text-slate-300",
  "in-progress": "bg-blue-500/20 text-blue-300",
  done: "bg-emerald-500/20 text-emerald-300",
  blocked: "bg-red-500/20 text-red-300",
};
const KANBAN_COLS = ["open", "in-progress", "blocked", "done"] as const;
const CHECKLIST_CATEGORIES = [
  "Script Preparation", "Casting", "Locations", "Art and Props",
  "Equipment", "Crew Preparation", "Production Planning",
];
const DEPARTMENTS = [
  "Locations", "Publicity", "Casting", "Post", "Research", "Music",
  "Direction", "Production", "Camera", "Art", "Sound",
];

// ── component ─────────────────────────────────────────────────────────────────

export function PreProdBoard({ projectId }: { projectId?: string }) {
  const allTasks = (useAppDataSlice("productionTasks") ?? []) as ProductionTask[];
  const projects = useAppDataSlice("projects") ?? [];
  const castMembers = useAppDataSlice("castMembers") ?? [];
  const crewMembers = useAppDataSlice("crewMembers") ?? [];
  const callSheets = useAppDataSlice("callSheets") ?? [];
  const shootDays = useAppDataSlice("shootDays") ?? [];
  const locations = useAppDataSlice("locations") ?? [];
  const equipmentInventory = useAppDataSlice("equipmentInventory") ?? [];
  const checklist = usePreProdChecklist(projectId);

  const [selectedProject, setSelectedProject] = useState<string>(projectId ?? "all");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [taskDialog, setTaskDialog] = useState<"create" | ProductionTask | null>(null);
  const [checklistDialog, setChecklistDialog] = useState<"create" | PreProdChecklistItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(CHECKLIST_CATEGORIES));

  const filteredTasks = allTasks.filter((t) => {
    if (selectedProject !== "all" && t.projectId !== selectedProject) return false;
    if (deptFilter !== "all" && t.department !== deptFilter) return false;
    return true;
  });

  // project for readiness
  const proj = projectId ? projects.find((p) => p.id === projectId) : null;
  const projCast = castMembers.filter((c) => c.projectId === projectId);
  const projCrew = crewMembers.filter((c) => c.projectId === projectId);
  const projCallSheets = callSheets.filter((c) => {
    const cs = c as { projectId?: string; project?: string };
    return cs.projectId === projectId || c.project === proj?.title;
  });
  const projShootDays = shootDays.filter((d) => d.projectId === projectId);
  const projLocations = locations.filter((l) => l.projectId === projectId);
  const projEquipment = equipmentInventory.filter((e) => e.projectId === projectId);

  const tasksByStatus = Object.fromEntries(
    KANBAN_COLS.map((col) => [col, filteredTasks.filter((t) => t.status === col)])
  ) as Record<string, ProductionTask[]>;

  const totalTasks = filteredTasks.length;
  const doneTasks = filteredTasks.filter((t) => t.status === "done").length;
  const inProgressTasks = filteredTasks.filter((t) => t.status === "in-progress").length;
  const blockedTasks = filteredTasks.filter((t) => t.status === "blocked").length;
  const openTasks = filteredTasks.filter((t) => t.status === "open").length;

  const doneChecklist = checklist.filter((c) => c.status === "done").length;
  const checklistPct = checklist.length ? Math.round((doneChecklist / checklist.length) * 100) : 0;

  function updateTaskStatus(id: string, status: string) {
    updateAppDataSlice("productionTasks", (tasks) =>
      tasks.map((t) => (t.id === id ? { ...t, status: status as ProductionTask["status"] } : t))
    );
  }

  function upsertTask(form: Partial<ProductionTask> & { id?: string }) {
    if (form.id) {
      updateAppDataSlice("productionTasks", (tasks) =>
        tasks.map((t) => (t.id === form.id ? { ...t, ...form } as ProductionTask : t))
      );
    } else {
      const newTask: ProductionTask = {
        id: `task-${Date.now()}`,
        projectId: selectedProject !== "all" ? selectedProject : (projectId ?? "p1"),
        department: form.department ?? "Production",
        title: form.title ?? "New Task",
        owner: form.owner ?? "",
        dueDate: form.dueDate ?? "",
        status: (form.status ?? "open") as ProductionTask["status"],
        priority: (form.priority ?? "medium") as ProductionTask["priority"],
      };
      updateAppDataSlice("productionTasks", (tasks) => [...tasks, newTask]);
    }
    setTaskDialog(null);
  }

  function deleteTask(id: string) {
    updateAppDataSlice("productionTasks", (tasks) => tasks.filter((t) => t.id !== id));
    setDeleteTarget(null);
  }

  function toggleCat(cat: string) {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        {!projectId && (
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-52 h-8 text-xs">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-44 h-8 text-xs">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {DEPARTMENTS.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList className="h-9 text-xs">
          <TabsTrigger value="dashboard" className="text-xs gap-1.5">
            <LayoutGrid className="w-3.5 h-3.5" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="tasks" className="text-xs gap-1.5">
            <ClipboardList className="w-3.5 h-3.5" /> Task Board
          </TabsTrigger>
          <TabsTrigger value="checklist" className="text-xs gap-1.5">
            <CheckSquare className="w-3.5 h-3.5" /> Checklist
          </TabsTrigger>
          {projectId && (
            <TabsTrigger value="readiness" className="text-xs gap-1.5">
              <Shield className="w-3.5 h-3.5" /> Readiness
            </TabsTrigger>
          )}
        </TabsList>

        {/* ── DASHBOARD ─────────────────────────────────────── */}
        <TabsContent value="dashboard" className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { label: "Total Tasks", value: totalTasks, color: "text-foreground" },
              { label: "Open", value: openTasks, color: "text-slate-400" },
              { label: "In Progress", value: inProgressTasks, color: "text-blue-400" },
              { label: "Blocked", value: blockedTasks, color: "text-red-400" },
              { label: "Done", value: doneTasks, color: "text-emerald-400" },
            ].map((s) => (
              <Card key={s.label} className="border">
                <CardContent className="p-3">
                  <p className="text-[11px] text-muted-foreground">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Checklist summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Checklist Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{doneChecklist} / {checklist.length} items done</span>
                <span>{checklistPct}%</span>
              </div>
              <Progress value={checklistPct} className="h-2" />
            </CardContent>
          </Card>

          {/* Department breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">By Department</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {DEPARTMENTS.filter((dept) =>
                filteredTasks.some((t) => t.department === dept)
              ).map((dept) => {
                const deptTasks = filteredTasks.filter((t) => t.department === dept);
                const done = deptTasks.filter((t) => t.status === "done").length;
                const pct = deptTasks.length ? Math.round((done / deptTasks.length) * 100) : 0;
                return (
                  <div key={dept} className="space-y-0.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{dept}</span>
                      <span className="text-foreground font-medium">{done}/{deptTasks.length}</span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Project breakdown */}
          {selectedProject === "all" && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">By Project</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {projects.map((p) => {
                  const pt = allTasks.filter((t) => t.projectId === p.id);
                  const done = pt.filter((t) => t.status === "done").length;
                  const pct = pt.length ? Math.round((done / pt.length) * 100) : 0;
                  if (!pt.length) return null;
                  return (
                    <div key={p.id} className="space-y-0.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground truncate max-w-[200px]">{p.title}</span>
                        <span className="text-foreground font-medium ml-2">{done}/{pt.length}</span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── TASK BOARD (KANBAN) ───────────────────────────── */}
        <TabsContent value="tasks" className="pt-4">
          <div className="flex justify-end mb-3">
            <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => setTaskDialog("create")}>
              <Plus className="w-3.5 h-3.5" /> New Task
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {KANBAN_COLS.map((col) => (
              <div key={col} className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <Badge className={`text-[11px] font-semibold ${TASK_STATUS_COLOR[col]}`}>
                    {TASK_STATUS_LABEL[col]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{tasksByStatus[col]?.length ?? 0}</span>
                </div>
                <div className="space-y-2 min-h-[100px]">
                  {(tasksByStatus[col] ?? []).map((task) => (
                    <Card
                      key={task.id}
                      className="border cursor-pointer hover:border-primary/40 transition-colors"
                      onClick={() => setTaskDialog(task)}
                    >
                      <CardContent className="p-3 space-y-2">
                        <p className="text-xs font-medium leading-snug">{task.title}</p>
                        <div className="flex flex-wrap gap-1">
                          <Badge className={`text-[10px] ${PRIORITY_COLOR[task.priority]}`}>
                            {task.priority}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">{task.department}</Badge>
                        </div>
                        {task.owner && (
                          <p className="text-[10px] text-muted-foreground">{task.owner}</p>
                        )}
                        {task.dueDate && (
                          <p className="text-[10px] text-muted-foreground">Due {task.dueDate}</p>
                        )}
                        <div className="flex gap-1 pt-1">
                          {KANBAN_COLS.filter((c) => c !== col).map((next) => (
                            <button
                              key={next}
                              className="text-[9px] text-muted-foreground hover:text-primary transition-colors px-1 py-0.5 rounded border border-transparent hover:border-primary/30"
                              onClick={(e) => { e.stopPropagation(); updateTaskStatus(task.id, next); }}
                            >
                              → {TASK_STATUS_LABEL[next]}
                            </button>
                          ))}
                          <button
                            className="ml-auto text-[9px] text-muted-foreground hover:text-destructive transition-colors px-1 py-0.5"
                            onClick={(e) => { e.stopPropagation(); setDeleteTarget(task.id); }}
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {(tasksByStatus[col] ?? []).length === 0 && (
                    <p className="text-[11px] text-muted-foreground text-center py-6 border border-dashed rounded-lg">No tasks</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ── CHECKLIST ─────────────────────────────────────── */}
        <TabsContent value="checklist" className="pt-4">
          <div className="flex justify-end mb-3">
            <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => setChecklistDialog("create")}>
              <Plus className="w-3.5 h-3.5" /> Add Item
            </Button>
          </div>
          <div className="space-y-3">
            {CHECKLIST_CATEGORIES.map((cat) => {
              const items = checklist.filter((c) => c.category === cat);
              if (!items.length) return null;
              const catDone = items.filter((c) => c.status === "done").length;
              const expanded = expandedCats.has(cat);
              return (
                <Card key={cat} className="border">
                  <button
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/30 transition-colors rounded-t-lg"
                    onClick={() => toggleCat(cat)}
                  >
                    <div className="flex items-center gap-2">
                      {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      <span className="text-sm font-semibold">{cat}</span>
                      <Badge variant="outline" className="text-[10px]">{catDone}/{items.length}</Badge>
                    </div>
                    <Progress value={items.length ? (catDone / items.length) * 100 : 0} className="h-1.5 w-24" />
                  </button>
                  {expanded && (
                    <CardContent className="pt-0 pb-2 divide-y">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 py-2">
                          <Checkbox
                            checked={item.status === "done"}
                            onCheckedChange={(checked) =>
                              toggleChecklistItem(item.id, checked ? "done" : "pending")
                            }
                          />
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-medium ${item.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                              {item.title}
                            </p>
                            <p className="text-[10px] text-muted-foreground">{item.owner} · Due {item.dueDate}</p>
                          </div>
                          <Badge className={`text-[10px] ${CHECKLIST_STATUS_COLOR[item.status]}`}>
                            {item.status}
                          </Badge>
                          <button
                            className="text-muted-foreground hover:text-primary"
                            onClick={() => setChecklistDialog(item)}
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => deleteChecklistItem(item.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </CardContent>
                  )}
                </Card>
              );
            })}
            {checklist.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-12 border border-dashed rounded-lg">
                No checklist items yet. Add items to get started.
              </p>
            )}
          </div>
        </TabsContent>

        {/* ── READINESS ─────────────────────────────────────── */}
        {projectId && (
          <TabsContent value="readiness" className="pt-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  label: "Cast",
                  icon: "🎭",
                  color: "border-violet-500/30",
                  items: [
                    { label: "Cast members", value: projCast.length, target: 10, ok: projCast.length >= 3 },
                    { label: "Contracts signed", value: 0, target: projCast.length, ok: false },
                  ],
                },
                {
                  label: "Crew",
                  icon: "🎬",
                  color: "border-blue-500/30",
                  items: [
                    { label: "Crew members", value: projCrew.length, target: 20, ok: projCrew.length >= 5 },
                    { label: "HODs confirmed", value: projCrew.filter((c) => c.role?.includes("Head") || c.role?.includes("Director") || c.role?.includes("DP")).length, target: 5, ok: true },
                  ],
                },
                {
                  label: "Locations",
                  icon: "📍",
                  color: "border-amber-500/30",
                  items: [
                    { label: "Locations listed", value: projLocations.length, target: 5, ok: projLocations.length >= 2 },
                  ],
                },
                {
                  label: "Equipment",
                  icon: "🎥",
                  color: "border-orange-500/30",
                  items: [
                    { label: "Equipment items", value: projEquipment.length, target: 10, ok: projEquipment.length >= 3 },
                    { label: "In-use or reserved", value: projEquipment.filter((e) => e.status === "in-use" || e.status === "reserved").length, target: projEquipment.length, ok: projEquipment.length > 0 },
                  ],
                },
                {
                  label: "Shooting Schedule",
                  icon: "📅",
                  color: "border-teal-500/30",
                  items: [
                    { label: "Shoot days planned", value: projShootDays.length, target: 30, ok: projShootDays.length >= 5 },
                    { label: "Confirmed days", value: projShootDays.filter((d) => d.status === "confirmed" || d.status === "completed" || d.status === "in-progress").length, target: projShootDays.length, ok: projShootDays.some((d) => d.status === "confirmed") },
                  ],
                },
                {
                  label: "Call Sheets",
                  icon: "📋",
                  color: "border-emerald-500/30",
                  items: [
                    { label: "Call sheets", value: projCallSheets.length, target: projShootDays.length, ok: projCallSheets.length >= 3 },
                    { label: "Published", value: projCallSheets.filter((c) => c.status === "Published").length, target: projCallSheets.length, ok: projCallSheets.some((c) => c.status === "Published") },
                  ],
                },
              ].map((section) => (
                <Card key={section.label} className={`border ${section.color}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <span>{section.icon}</span> {section.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {section.items.map((item) => (
                      <div key={item.label} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{item.label}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium">{item.value}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${item.ok ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}>
                            {item.ok ? "✓ Ready" : "Pending"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* ── TASK DIALOG ────────────────────────────────────── */}
      <TaskDialog
        open={taskDialog !== null}
        task={taskDialog !== "create" ? taskDialog : null}
        projectId={selectedProject !== "all" ? selectedProject : (projectId ?? "p1")}
        projects={projects}
        onSave={upsertTask}
        onClose={() => setTaskDialog(null)}
      />

      {/* ── CHECKLIST DIALOG ───────────────────────────────── */}
      <ChecklistDialog
        open={checklistDialog !== null}
        item={checklistDialog !== "create" ? checklistDialog : null}
        projectId={projectId ?? (selectedProject !== "all" ? selectedProject : "p1")}
        onSave={(form) => {
          if (form.id) {
            updateChecklistItem(form.id, form);
          } else {
            addChecklistItem({ ...form, status: form.status ?? "pending", notes: form.notes ?? "" } as Omit<PreProdChecklistItem, "id">);
          }
          setChecklistDialog(null);
        }}
        onClose={() => setChecklistDialog(null)}
      />

      {/* ── DELETE CONFIRM ─────────────────────────────────── */}
      <Dialog open={deleteTarget !== null} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Delete Task?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={() => deleteTarget && deleteTask(deleteTarget)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── TaskDialog ────────────────────────────────────────────────────────────────

function TaskDialog({
  open, task, projectId, projects, onSave, onClose,
}: {
  open: boolean;
  task: ProductionTask | null;
  projectId: string;
  projects: { id: string; title: string }[];
  onSave: (form: Partial<ProductionTask> & { id?: string }) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Partial<ProductionTask>>({});
  const patch = (u: Partial<ProductionTask>) => setForm((f) => ({ ...f, ...u }));

  const data = task ? { ...task, ...form } : form;
  const title = data.title ?? "";
  const dept = data.department ?? "Production";
  const owner = data.owner ?? "";
  const dueDate = data.dueDate ?? "";
  const status = data.status ?? "open";
  const priority = data.priority ?? "medium";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">{task ? "Edit Task" : "New Task"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs">Title *</Label>
            <Input value={title} onChange={(e) => patch({ title: e.target.value })} className="mt-1 text-xs" placeholder="Task title" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Department</Label>
              <Select value={dept} onValueChange={(v) => patch({ department: v })}>
                <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{DEPARTMENTS.map((d) => <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Priority</Label>
              <Select value={priority} onValueChange={(v) => patch({ priority: v as ProductionTask["priority"] })}>
                <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["low", "medium", "high", "critical"].map((p) => <SelectItem key={p} value={p} className="text-xs capitalize">{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={status} onValueChange={(v) => patch({ status: v as ProductionTask["status"] })}>
                <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["open", "in-progress", "blocked", "done"] as const).map((s) => (
                    <SelectItem key={s} value={s} className="text-xs">{TASK_STATUS_LABEL[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Due Date</Label>
              <Input type="date" value={dueDate} onChange={(e) => patch({ dueDate: e.target.value })} className="mt-1 h-8 text-xs" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Owner</Label>
            <Input value={owner} onChange={(e) => patch({ owner: e.target.value })} className="mt-1 text-xs" placeholder="Assigned to" />
          </div>
          {!task && (
            <div>
              <Label className="text-xs">Project</Label>
              <Select value={data.projectId ?? projectId} onValueChange={(v) => patch({ projectId: v })}>
                <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id} className="text-xs">{p.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={!title.trim()} onClick={() => onSave({ id: task?.id, ...data })}>
            {task ? "Save Changes" : "Create Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── ChecklistDialog ───────────────────────────────────────────────────────────

function ChecklistDialog({
  open, item, projectId, onSave, onClose,
}: {
  open: boolean;
  item: PreProdChecklistItem | null;
  projectId: string;
  onSave: (form: Partial<PreProdChecklistItem> & { id?: string }) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Partial<PreProdChecklistItem>>({});
  const patch = (u: Partial<PreProdChecklistItem>) => setForm((f) => ({ ...f, ...u }));

  const data = item ? { ...item, ...form } : form;
  const title = data.title ?? "";
  const category = data.category ?? "Script Preparation";
  const owner = data.owner ?? "";
  const dueDate = data.dueDate ?? "";
  const status = (data.status ?? "pending") as ChecklistStatus;
  const notes = data.notes ?? "";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">{item ? "Edit Item" : "New Checklist Item"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs">Title *</Label>
            <Input value={title} onChange={(e) => patch({ title: e.target.value })} className="mt-1 text-xs" placeholder="Checklist item" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Category</Label>
              <Select value={category} onValueChange={(v) => patch({ category: v })}>
                <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{CHECKLIST_CATEGORIES.map((c) => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={status} onValueChange={(v) => patch({ status: v as ChecklistStatus })}>
                <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["pending", "in-progress", "done", "blocked"] as ChecklistStatus[]).map((s) => (
                    <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Owner</Label>
              <Input value={owner} onChange={(e) => patch({ owner: e.target.value })} className="mt-1 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Due Date</Label>
              <Input type="date" value={dueDate} onChange={(e) => patch({ dueDate: e.target.value })} className="mt-1 h-8 text-xs" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea value={notes} onChange={(e) => patch({ notes: e.target.value })} rows={2} className="mt-1 text-xs" />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={!title.trim()} onClick={() => onSave({ id: item?.id, projectId, ...data })}>
            {item ? "Save" : "Add Item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
