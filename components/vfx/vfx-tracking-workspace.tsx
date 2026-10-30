"use client";

import { useState } from "react";
import { Plus, Zap, Send, Edit2, Trash2, CheckCircle2, Clock, Eye } from "lucide-react";
import { useAppDataSlice, updateAppDataSlice } from "@/lib/app-data-store";
import { useProjects, useProject } from "@/lib/project-store";
import type { VfxShot, VfxShotStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const VfxStatusColors: Record<VfxShotStatus, string> = {
  "briefed": "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
  "in-progress": "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  "client-review": "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
  "final": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
};

const PriorityColors = {
  "low": "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30",
  "medium": "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  "high": "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
};

interface VfxTrackingWorkspaceProps {
  projectId?: string;
}

export function VfxTrackingWorkspace({ projectId: scopedProjectId }: VfxTrackingWorkspaceProps) {
  const projects = useProjects();
  const vfxShots = useAppDataSlice("vfxShots");
  const scopedProject = useProject(scopedProjectId || "");

  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    scopedProjectId || "all"
  );
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const effectiveProjectId = scopedProjectId || selectedProjectId;

  // Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingShot, setEditingShot] = useState<VfxShot | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    shotCode: "",
    sequence: "",
    description: "",
    vendorId: "",
    status: "briefed" as VfxShotStatus,
    priority: "medium" as "low" | "medium" | "high",
    dueDate: new Date().toISOString().slice(0, 10),
    projectId: effectiveProjectId || projects[0]?.id || "",
  });

  const filteredShots = vfxShots.filter((shot) => {
    if (effectiveProjectId && effectiveProjectId !== "all" && shot.projectId !== effectiveProjectId) {
      return false;
    }
    if (statusFilter !== "all" && shot.status !== statusFilter) return false;
    if (priorityFilter !== "all" && shot.priority !== priorityFilter) return false;
    return true;
  });

  const stats = {
    total: filteredShots.length,
    briefed: filteredShots.filter((s) => s.status === "briefed").length,
    inProgress: filteredShots.filter((s) => s.status === "in-progress").length,
    review: filteredShots.filter((s) => s.status === "client-review").length,
    final: filteredShots.filter((s) => s.status === "final").length,
  };

  const handleOpenAdd = () => {
    setFormData({
      shotCode: `VFX-${String(vfxShots.length + 1).padStart(3, "0")}`,
      sequence: "Sequence 01",
      description: "",
      vendorId: "DNEG India",
      status: "briefed",
      priority: "medium",
      dueDate: new Date().toISOString().slice(0, 10),
      projectId: effectiveProjectId || projects[0]?.id || "p1",
    });
    setIsAddOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.shotCode.trim()) return;

    const newShot: VfxShot = {
      id: `vfx-${Date.now()}`,
      projectId: formData.projectId || effectiveProjectId || projects[0]?.id || "p1",
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
  };

  const handleOpenEdit = (shot: VfxShot) => {
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
  };

  const handleSaveEdit = (e: React.FormEvent) => {
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
  };

  const handleDeleteShot = (id: string) => {
    if (confirm("Are you sure you want to delete this VFX shot?")) {
      updateAppDataSlice("vfxShots", (current) => current.filter((s) => s.id !== id));
      toast.info("VFX shot removed.");
      if (editingShot?.id === id) setEditingShot(null);
    }
  };

  const handleSendToVendor = (shot: VfxShot) => {
    const nextStatus: VfxShotStatus = shot.status === "briefed" ? "in-progress" : shot.status;
    updateAppDataSlice("vfxShots", (current) =>
      current.map((s) => (s.id === shot.id ? { ...s, status: nextStatus } : s))
    );
    toast.success(`Plate turnover dispatched for ${shot.shotCode} to ${shot.vendorId || "assigned vendor"}.`);
  };

  const handleQuickAdvance = (shot: VfxShot) => {
    let nextStatus: VfxShotStatus = shot.status;
    if (shot.status === "briefed") nextStatus = "in-progress";
    else if (shot.status === "in-progress") nextStatus = "client-review";
    else if (shot.status === "client-review") nextStatus = "final";

    updateAppDataSlice("vfxShots", (current) =>
      current.map((s) => (s.id === shot.id ? { ...s, status: nextStatus } : s))
    );
    toast.success(`${shot.shotCode} advanced to ${nextStatus.replace("-", " ")}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {scopedProject ? `${scopedProject.title} · VFX Tracking` : "VFX Tracking"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {scopedProject
              ? `Manage shots, vendor turnovers, and review approvals for ${scopedProject.title}`
              : "Manage visual effects shots, studio vendor turnovers, and plate deliverables"}
          </p>
        </div>
        <Button onClick={handleOpenAdd} className="gap-2 shrink-0 bg-primary font-semibold">
          <Plus className="w-4 h-4" />
          Add VFX Shot
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Total Shots
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Briefed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.briefed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              In Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">{stats.review}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Final Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{stats.final}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-col sm:flex-row gap-3">
            {!scopedProjectId && (
              <div className="flex-1">
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Project</label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger>
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
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
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
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Priority</label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
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

      {/* VFX Shots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredShots.length > 0 ? (
          filteredShots.map((shot) => {
            const projectObj = projects.find((p) => p.id === shot.projectId);
            return (
              <Card
                key={shot.id}
                className="group border hover:border-primary/50 transition-all shadow-sm flex flex-col justify-between"
              >
                <div>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                          <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                          <span>{shot.shotCode}</span>
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {shot.sequence}
                          {projectObj && !scopedProjectId && ` · ${projectObj.title}`}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge
                          variant="outline"
                          className={`capitalize text-xs font-semibold ${
                            VfxStatusColors[shot.status] || ""
                          }`}
                        >
                          {shot.status.replace("-", " ")}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`capitalize text-xs font-medium ${
                            PriorityColors[shot.priority] || ""
                          }`}
                        >
                          {shot.priority}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <p className="text-sm text-foreground/90">{shot.description}</p>
                    <div className="pt-2 border-t text-xs text-muted-foreground flex flex-wrap justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Due: {shot.dueDate}</span>
                      </div>
                      {shot.vendorId && (
                        <div className="font-medium text-foreground">
                          Vendor: <span className="text-primary">{shot.vendorId}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </div>

                <div className="p-3 border-t bg-muted/10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {shot.status !== "final" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-8 gap-1 border-primary/30 hover:bg-primary/10"
                        onClick={() => handleQuickAdvance(shot)}
                      >
                        <CheckCircle2 className="w-3 h-3 text-primary" />
                        Advance
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs h-8 gap-1"
                      onClick={() => handleSendToVendor(shot)}
                    >
                      <Send className="w-3 h-3" />
                      Dispatch
                    </Button>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8 gap-1"
                      onClick={() => handleOpenEdit(shot)}
                    >
                      <Edit2 className="w-3 h-3" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs h-8 text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteShot(shot.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full text-center py-16 rounded-xl border border-dashed">
            <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
            <h3 className="font-semibold text-base mb-1">No VFX shots found</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-4">
              Create and dispatch VFX shots to monitor plate turnarounds and client review approvals.
            </p>
            <Button onClick={handleOpenAdd} size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              Add First VFX Shot
            </Button>
          </div>
        )}
      </div>

      {/* Add VFX Shot Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add VFX Shot</DialogTitle>
            <DialogDescription>
              Assign a new visual effects plate to studio vendors and track deliverables.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveAdd} className="space-y-4 pt-2">
            {!scopedProjectId && (
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Project</label>
                <Select
                  value={formData.projectId}
                  onValueChange={(val) => setFormData({ ...formData, projectId: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Shot Code *</label>
                <Input
                  required
                  placeholder="e.g. VFX-042"
                  value={formData.shotCode}
                  onChange={(e) => setFormData({ ...formData, shotCode: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Sequence</label>
                <Input
                  placeholder="e.g. Climax Battle"
                  value={formData.sequence}
                  onChange={(e) => setFormData({ ...formData, sequence: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Description *</label>
              <Textarea
                required
                rows={3}
                placeholder="Describe plate cleanup, 3D asset integration, green screen replacement..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Status</label>
                <Select
                  value={formData.status}
                  onValueChange={(val: VfxShotStatus) => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="briefed">Briefed</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="client-review">Client Review</SelectItem>
                    <SelectItem value="final">Final</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Priority</label>
                <Select
                  value={formData.priority}
                  onValueChange={(val: any) => setFormData({ ...formData, priority: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Target Due Date</label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Assigned VFX Vendor</label>
              <Input
                placeholder="e.g. DNEG, Makuta VFX, Red Chillies.vfx"
                value={formData.vendorId}
                onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary">
                Save VFX Shot
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit VFX Shot Modal */}
      <Dialog open={!!editingShot} onOpenChange={(open) => !open && setEditingShot(null)}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit VFX Shot</DialogTitle>
            <DialogDescription>
              Update turnaround status, assigned vendor, and plate instructions.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
            {!scopedProjectId && (
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Project</label>
                <Select
                  value={formData.projectId}
                  onValueChange={(val) => setFormData({ ...formData, projectId: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Shot Code *</label>
                <Input
                  required
                  value={formData.shotCode}
                  onChange={(e) => setFormData({ ...formData, shotCode: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Sequence</label>
                <Input
                  value={formData.sequence}
                  onChange={(e) => setFormData({ ...formData, sequence: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Description *</label>
              <Textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Status</label>
                <Select
                  value={formData.status}
                  onValueChange={(val: VfxShotStatus) => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="briefed">Briefed</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="client-review">Client Review</SelectItem>
                    <SelectItem value="final">Final</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Priority</label>
                <Select
                  value={formData.priority}
                  onValueChange={(val: any) => setFormData({ ...formData, priority: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Due Date</label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Assigned VFX Vendor</label>
              <Input
                value={formData.vendorId}
                onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
              />
            </div>

            <DialogFooter className="gap-2 pt-2 flex items-center justify-between">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => editingShot && handleDeleteShot(editingShot.id)}
              >
                Delete Shot
              </Button>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingShot(null)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-primary">
                  Save Changes
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
