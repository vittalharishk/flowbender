"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Scissors,
  Plus,
  Tv,
  Film,
  Sparkles,
  Volume2,
  Mic,
  Music,
  CheckCircle2,
  Clock,
  HardDrive,
  Eye,
  FileCheck,
  Calendar,
  Layers,
  ArrowRight,
  Filter,
} from "lucide-react";
import { useProject, useSelectedProjectId, useProjects } from "@/lib/project-store";
import { useAppDataSlice, updateAppDataSlice } from "@/lib/app-data-store";
import { useCrewByProject } from "@/lib/crew-store";
import type {
  DeliverableItem,
  PostProductionItem,
  PostProductionStatus,
  SeriesEpisode,
} from "@/lib/types";
import { ProjectSelector } from "@/components/app/project-selector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

const DEPARTMENTS = [
  "Editing",
  "DI & Color",
  "Sound Design",
  "Dubbing",
  "Music & Score",
  "VFX",
  "DIT & Rushes",
  "Quality Control (QC)",
  "Deliverables",
] as const;

const POST_STATUSES: { value: PostProductionStatus; label: string }[] = [
  { value: "not-started", label: "Not Started" },
  { value: "in-progress", label: "In Progress" },
  { value: "review", label: "In Review" },
  { value: "approved", label: "Approved" },
  { value: "completed", label: "Completed" },
];

interface PostProductionWorkspaceProps {
  projectId?: string;
}

export function PostProductionWorkspace({ projectId }: PostProductionWorkspaceProps) {
  const centralSelectedId = useSelectedProjectId();
  const activeProjectId = projectId || centralSelectedId || "p1";

  const project = useProject(activeProjectId);
  const projects = useProjects();
  const crew = useCrewByProject(activeProjectId);

  const allTasks = useAppDataSlice("postProductionItems");
  const allDeliverables = useAppDataSlice("deliverables");
  const allEpisodes = useAppDataSlice("seriesEpisodes");
  const allVfx = useAppDataSlice("vfxShots");

  const tasks = useMemo(
    () => allTasks.filter((item) => item.projectId === activeProjectId),
    [allTasks, activeProjectId]
  );

  const deliverables = useMemo(
    () => allDeliverables.filter((item) => item.projectId === activeProjectId),
    [allDeliverables, activeProjectId]
  );

  const episodes = useMemo(
    () => allEpisodes.filter((item) => item.projectId === activeProjectId),
    [allEpisodes, activeProjectId]
  );

  const vfxShots = useMemo(
    () => allVfx.filter((item) => item.projectId === activeProjectId),
    [allVfx, activeProjectId]
  );

  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [taskFilter, setTaskFilter] = useState<string>("all");
  const [formType, setFormType] = useState<"task" | "deliverable" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [taskForm, setTaskForm] = useState({
    task: "",
    department: "Editing",
    owner: "",
    dueDate: new Date().toLocaleDateString("en-CA"),
    progress: 0,
    status: "in-progress" as PostProductionStatus,
  });

  const [deliverableForm, setDeliverableForm] = useState({
    name: "",
    format: "4K DCI DCP",
    territory: "Theatrical (Worldwide)",
    dueDate: new Date().toLocaleDateString("en-CA"),
    status: "pending" as DeliverableItem["status"],
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (!project) {
    return (
      <div className="mx-auto max-w-[1400px] p-8 text-center space-y-4">
        <p className="text-muted-foreground">Select an active flowbender project to view post production pipeline.</p>
        <ProjectSelector />
      </div>
    );
  }

  // Metrics calculation
  const overallProgress = tasks.length
    ? Math.round(tasks.reduce((sum, item) => sum + (item.progress || 0), 0) / tasks.length)
    : 0;

  const inReviewCount = tasks.filter((t) => t.status === "review").length;
  const inProgressCount = tasks.filter((t) => t.status === "in-progress").length;
  const readyDeliverables = deliverables.filter((d) => ["ready", "delivered"].includes(d.status)).length;
  const vfxDoneCount = vfxShots.filter((v) => v.status === "final").length;

  const isSeries = project.type === "series" || project.type === "documentary" || episodes.length > 0;

  // Filtered Tasks
  const visibleTasks = tasks.filter((t) => {
    if (selectedDept !== "all" && t.department.toLowerCase() !== selectedDept.toLowerCase()) {
      return false;
    }
    if (taskFilter !== "all" && t.status !== taskFilter) {
      return false;
    }
    return true;
  });

  // Department Summary stats
  const deptProgressMap = DEPARTMENTS.map((dept) => {
    const deptTasks = tasks.filter((t) => t.department.toLowerCase().includes(dept.toLowerCase().slice(0, 4)));
    const avg = deptTasks.length
      ? Math.round(deptTasks.reduce((s, t) => s + (t.progress || 0), 0) / deptTasks.length)
      : 0;
    return { name: dept, count: deptTasks.length, progress: avg };
  });

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!taskForm.task.trim() || !taskForm.owner.trim() || !taskForm.dueDate) {
      setError("Please fill out task name, owner, and valid due date.");
      return;
    }

    const newTask: PostProductionItem = {
      id: editingId || `post-${crypto.randomUUID()}`,
      projectId: activeProjectId,
      task: taskForm.task.trim(),
      department: taskForm.department,
      owner: taskForm.owner.trim(),
      dueDate: taskForm.dueDate,
      progress: taskForm.progress,
      status: taskForm.status,
    };

    updateAppDataSlice("postProductionItems", (current) =>
      editingId
        ? current.map((item) => (item.id === editingId ? newTask : item))
        : [newTask, ...current]
    );

    setFormType(null);
    setEditingId(null);
    setMessage(`Post task "${newTask.task}" updated successfully.`);
  };

  const handleSaveDeliverable = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!deliverableForm.name.trim() || !deliverableForm.format.trim() || !deliverableForm.dueDate) {
      setError("Please fill out deliverable name, format, and due date.");
      return;
    }

    const newDeliverable: DeliverableItem = {
      id: editingId || `deliv-${crypto.randomUUID()}`,
      projectId: activeProjectId,
      name: deliverableForm.name.trim(),
      format: deliverableForm.format.trim(),
      territory: deliverableForm.territory.trim(),
      dueDate: deliverableForm.dueDate,
      status: deliverableForm.status,
    };

    updateAppDataSlice("deliverables", (current) =>
      editingId
        ? current.map((item) => (item.id === editingId ? newDeliverable : item))
        : [newDeliverable, ...current]
    );

    setFormType(null);
    setEditingId(null);
    setMessage(`Deliverable "${newDeliverable.name}" saved successfully.`);
  };

  const handleDeleteTask = (taskId: string) => {
    if (confirm("Delete this post production task?")) {
      updateAppDataSlice("postProductionItems", (current) => current.filter((item) => item.id !== taskId));
    }
  };

  const handleDeleteDeliverable = (delivId: string) => {
    if (confirm("Delete this deliverable item?")) {
      updateAppDataSlice("deliverables", (current) => current.filter((item) => item.id !== delivId));
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-12">
      {/* Top Banner with Project Context Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border bg-card/60 backdrop-blur-sm shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-500 border border-violet-500/20">
            <Scissors className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold">Post Production Suite</h1>
              <Badge variant="outline" className="text-xs lowercase">
                flowbender hub
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Editing, DI, Sound, Dubbing, Music, VFX, QC, and Deliverables
            </p>
          </div>
        </div>

        <div className="w-full sm:w-auto">
          <ProjectSelector currentProjectId={activeProjectId} />
        </div>
      </div>

      {message && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-between">
          <span>{message}</span>
          <Button variant="ghost" size="sm" onClick={() => setMessage("")} className="h-6 text-xs">
            Dismiss
          </Button>
        </div>
      )}

      {/* Project Status Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl border bg-gradient-to-br from-card via-card/80 to-muted/20">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-bold">{project.title}</h2>
            <Badge variant="secondary" className="capitalize">
              {project.type.replace("-", " ")}
            </Badge>
            <Badge variant="outline" className="capitalize text-violet-400 border-violet-500/30">
              {project.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl">{project.logline}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => {
              setEditingId(null);
              setFormType("task");
              setTaskForm({
                task: "",
                department: "Editing",
                owner: crew[0]?.name || "Lead Editor",
                dueDate: new Date().toLocaleDateString("en-CA"),
                progress: 0,
                status: "in-progress",
              });
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Post Task
          </Button>

          <Button
            size="sm"
            className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white"
            onClick={() => {
              setEditingId(null);
              setFormType("deliverable");
              setDeliverableForm({
                name: "",
                format: "4K DCI DCP",
                territory: "Theatrical (Worldwide)",
                dueDate: new Date().toLocaleDateString("en-CA"),
                status: "pending",
              });
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Deliverable
          </Button>
        </div>
      </div>

      {/* Modal / Inline Form for adding task or deliverable */}
      {formType === "task" && (
        <Card className="border-violet-500/30 bg-card/80 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span>{editingId ? "Edit Post Production Task" : "Create New Post Production Task"}</span>
              <Button variant="ghost" size="sm" onClick={() => setFormType(null)} className="h-7 text-xs">
                Cancel
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveTask} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-medium">Task Description / Milestone</label>
                <Input
                  required
                  placeholder="e.g. Dialogue cleanup & Foley replacement for Reel 3"
                  value={taskForm.task}
                  onChange={(e) => setTaskForm({ ...taskForm, task: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Department</label>
                <select
                  className="w-full h-9 rounded-md border bg-background px-3 text-xs"
                  value={taskForm.department}
                  onChange={(e) => setTaskForm({ ...taskForm, department: e.target.value })}
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Assigned Lead / Owner</label>
                <Input
                  required
                  placeholder="e.g. Shravan Katragadda"
                  value={taskForm.owner}
                  onChange={(e) => setTaskForm({ ...taskForm, owner: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Target Delivery Date</label>
                <Input
                  type="date"
                  required
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Current Status</label>
                <select
                  className="w-full h-9 rounded-md border bg-background px-3 text-xs"
                  value={taskForm.status}
                  onChange={(e) =>
                    setTaskForm({
                      ...taskForm,
                      status: e.target.value as PostProductionStatus,
                    })
                  }
                >
                  {POST_STATUSES.map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-3 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span>Task Completion Progress</span>
                  <span className="font-semibold">{taskForm.progress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  className="w-full accent-violet-600"
                  value={taskForm.progress}
                  onChange={(e) =>
                    setTaskForm({
                      ...taskForm,
                      progress: Number(e.target.value),
                    })
                  }
                />
              </div>

              {error && <p className="text-xs text-red-500 md:col-span-3">{error}</p>}

              <div className="md:col-span-3 flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setFormType(null)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-violet-600 hover:bg-violet-700 text-white">
                  Save Task
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {formType === "deliverable" && (
        <Card className="border-violet-500/30 bg-card/80 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span>{editingId ? "Edit Deliverable Item" : "Add Master Deliverable Asset"}</span>
              <Button variant="ghost" size="sm" onClick={() => setFormType(null)} className="h-7 text-xs">
                Cancel
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveDeliverable} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Deliverable Item Name</label>
                <Input
                  required
                  placeholder="e.g. Worldwide Theatrical DCI 4K SMPTE DCP"
                  value={deliverableForm.name}
                  onChange={(e) => setDeliverableForm({ ...deliverableForm, name: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">File Format / Specifications</label>
                <Input
                  required
                  placeholder="e.g. ProRes 4444 XQ / Dolby Atmos 7.1.4"
                  value={deliverableForm.format}
                  onChange={(e) => setDeliverableForm({ ...deliverableForm, format: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Destination / Territory</label>
                <Input
                  required
                  placeholder="e.g. Netflix India / Worldwide Theatrical"
                  value={deliverableForm.territory}
                  onChange={(e) => setDeliverableForm({ ...deliverableForm, territory: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Delivery Deadline</label>
                <Input
                  type="date"
                  required
                  value={deliverableForm.dueDate}
                  onChange={(e) => setDeliverableForm({ ...deliverableForm, dueDate: e.target.value })}
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-medium">Delivery Status</label>
                <select
                  className="w-full h-9 rounded-md border bg-background px-3 text-xs"
                  value={deliverableForm.status}
                  onChange={(e) =>
                    setDeliverableForm({
                      ...deliverableForm,
                      status: e.target.value as DeliverableItem["status"],
                    })
                  }
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress / Exporting</option>
                  <option value="ready">Master Ready (QC Verified)</option>
                  <option value="delivered">Delivered to Platform</option>
                </select>
              </div>

              {error && <p className="text-xs text-red-500 md:col-span-2">{error}</p>}

              <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setFormType(null)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-violet-600 hover:bg-violet-700 text-white">
                  Save Deliverable
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium">Overall Progress</p>
              <Scissors className="w-4 h-4 text-violet-500" />
            </div>
            <p className="text-2xl font-bold">{overallProgress}%</p>
            <Progress value={overallProgress} className="h-1.5" />
            <p className="text-[11px] text-muted-foreground">Across {tasks.length} total tasks</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium">In Progress & Review</p>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-amber-500">{inProgressCount + inReviewCount}</p>
            <p className="text-[11px] text-muted-foreground">
              {inReviewCount} pending director / QC sign-off
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium">Master Deliverables</p>
              <FileCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-emerald-500">
              {readyDeliverables} / {deliverables.length}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {deliverables.length > 0
                ? `${Math.round((readyDeliverables / deliverables.length) * 100)}% delivered / ready`
                : "No deliverables added yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium">
                {isSeries ? "Episodic Pipeline" : "VFX Finals"}
              </p>
              {isSeries ? (
                <Tv className="w-4 h-4 text-cyan-500" />
              ) : (
                <Sparkles className="w-4 h-4 text-indigo-500" />
              )}
            </div>
            <p className="text-2xl font-bold">
              {isSeries ? `${episodes.length} Episodes` : `${vfxDoneCount}/${vfxShots.length}`}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {isSeries ? "Season 1 serialized post" : "VFX composite finals"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="tasks" className="space-y-6">
        <TabsList className="grid grid-cols-4 max-w-lg">
          <TabsTrigger value="tasks" className="text-xs">
            Tasks ({tasks.length})
          </TabsTrigger>
          <TabsTrigger value="departments" className="text-xs">
            Departments
          </TabsTrigger>
          <TabsTrigger value="deliverables" className="text-xs">
            Deliverables ({deliverables.length})
          </TabsTrigger>
          <TabsTrigger value="episodes" className="text-xs">
            {isSeries ? `Episodes (${episodes.length})` : "Post Crew"}
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Tasks */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border bg-card/40">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium">Filter Department:</span>
              <select
                className="h-8 rounded-md border bg-background px-2 text-xs"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
              >
                <option value="all">All Departments</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium">Status:</span>
              <select
                className="h-8 rounded-md border bg-background px-2 text-xs"
                value={taskFilter}
                onChange={(e) => setTaskFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                {POST_STATUSES.map((st) => (
                  <option key={st.value} value={st.value}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="divide-y rounded-xl border bg-card">
            {visibleTasks.map((task) => (
              <div key={task.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{task.task}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {task.department}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-[10px] capitalize ${
                        task.status === "completed" || task.status === "approved"
                          ? "border-emerald-500/40 text-emerald-500"
                          : task.status === "review"
                          ? "border-amber-500/40 text-amber-500"
                          : "border-blue-500/40 text-blue-500"
                      }`}
                    >
                      {task.status.replace("-", " ")}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Lead: <span className="text-foreground">{task.owner}</span> • Due Date: {task.dueDate}
                  </p>
                </div>

                <div className="flex items-center gap-4 min-w-[240px]">
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>Progress</span>
                      <span>{task.progress}%</span>
                    </div>
                    <Progress value={task.progress} className="h-1.5" />
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => {
                        setEditingId(task.id);
                        setFormType("task");
                        setTaskForm({
                          task: task.task,
                          department: task.department,
                          owner: task.owner,
                          dueDate: task.dueDate,
                          progress: task.progress,
                          status: task.status,
                        });
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-red-500 hover:text-red-600"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {visibleTasks.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No tasks match the selected filter. Click &quot;Add Post Task&quot; above to create one.
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 2: Departments */}
        <TabsContent value="departments" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {deptProgressMap.map((dept) => (
              <Card key={dept.name} className="hover:border-violet-500/30 transition-all">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">{dept.name}</CardTitle>
                    <Badge variant="outline" className="text-[10px]">
                      {dept.count} tasks
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold">{dept.progress}%</span>
                    </div>
                    <Progress value={dept.progress} className="h-1.5" />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-violet-500 hover:text-violet-600"
                    onClick={() => {
                      setSelectedDept(dept.name);
                      const tasksTab = document.querySelector('[value="tasks"]') as HTMLElement;
                      tasksTab?.click();
                    }}
                  >
                    View department tasks <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab 3: Deliverables */}
        <TabsContent value="deliverables" className="space-y-4">
          <div className="rounded-xl border bg-card divide-y">
            {deliverables.map((deliv) => (
              <div key={deliv.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{deliv.name}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {deliv.format}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-[10px] capitalize ${
                        deliv.status === "delivered" || deliv.status === "ready"
                          ? "border-emerald-500/40 text-emerald-500"
                          : deliv.status === "in-progress"
                          ? "border-blue-500/40 text-blue-500"
                          : "border-muted-foreground/30 text-muted-foreground"
                      }`}
                    >
                      {deliv.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Destination: <span className="text-foreground">{deliv.territory}</span> • Due Date:{" "}
                    {deliv.dueDate}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <select
                    className="h-8 rounded-md border bg-background px-2 text-xs"
                    value={deliv.status}
                    onChange={(e) => {
                      const nextStatus = e.target.value as DeliverableItem["status"];
                      updateAppDataSlice("deliverables", (current) =>
                        current.map((item) => (item.id === deliv.id ? { ...item, status: nextStatus } : item))
                      );
                    }}
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="ready">Ready (QC Approved)</option>
                    <option value="delivered">Delivered</option>
                  </select>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs text-red-500 hover:text-red-600"
                    onClick={() => handleDeleteDeliverable(deliv.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}

            {deliverables.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No deliverables listed yet. Click &quot;Add Deliverable&quot; above to create master export items.
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 4: Episodes / Crew */}
        <TabsContent value="episodes" className="space-y-4">
          {isSeries ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm">Season 1 Episodic Assembly</h3>
                  <p className="text-xs text-muted-foreground">
                    Direct cut progress and audio passes for each streaming episode
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {episodes.length} Episodes Planned
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {episodes.map((ep) => (
                  <Card key={ep.id} className="bg-card/70">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">
                          Ep {ep.episodeNumber}: {ep.title}
                        </span>
                        <Badge
                          variant="secondary"
                          className="text-[10px] capitalize"
                        >
                          {ep.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-2 space-y-2 text-xs text-muted-foreground">
                      <p>{ep.synopsis || "Episode locked for final sound mix and VFX packaging."}</p>
                      <div className="flex justify-between pt-2 border-t text-[11px]">
                        <span>Air Date: {ep.airDate || "2027-01-25"}</span>
                        <span>Duration: {ep.duration ? `${ep.duration} min` : "45 min"}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border bg-card divide-y">
              <div className="p-4 font-semibold text-sm">Post Production Team Assigned</div>
              {crew
                .filter((member) =>
                  ["editing", "sound", "vfx", "direction", "camera"].includes(member.department)
                )
                .map((member) => (
                  <div key={member.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {member.role} • {member.department}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">
                      {member.availability}
                    </Badge>
                  </div>
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
