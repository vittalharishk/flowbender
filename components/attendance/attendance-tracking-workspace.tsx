"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { CheckCircle, XCircle, Clock, Users, TrendingUp, Plus, Trash2, Edit2, AlertCircle } from "lucide-react";
import { useProjects, useProject } from "@/lib/project-store";
import { useCastByProject } from "@/lib/cast-store";
import { useCrewByProject } from "@/lib/crew-store";
import { useAppDataSlice, updateAppDataSlice } from "@/lib/app-data-store";
import type { AttendanceRecord, AttendanceStatus } from "@/lib/types";
import { toast } from "sonner";

const getStatusBadgeColor = (status: AttendanceStatus) => {
  const colors: Record<AttendanceStatus, string> = {
    present: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    absent: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
    partial: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    leave: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
  };
  return colors[status] || "bg-muted text-muted-foreground";
};

const getStatusIcon = (status: AttendanceStatus) => {
  switch (status) {
    case "present":
      return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    case "absent":
      return <XCircle className="w-4 h-4 text-red-500" />;
    case "partial":
      return <Clock className="w-4 h-4 text-amber-500" />;
    case "leave":
      return <AlertCircle className="w-4 h-4 text-blue-500" />;
    default:
      return <Clock className="w-4 h-4 text-muted-foreground" />;
  }
};

const DEPARTMENTS = ["Cast", "Camera", "Direction", "Art", "Lighting", "Sound", "Production", "Costume", "VFX", "Stunts"];

interface AttendanceTrackingWorkspaceProps {
  projectId?: string;
}

export function AttendanceTrackingWorkspace({ projectId: scopedProjectId }: AttendanceTrackingWorkspaceProps) {
  const projects = useProjects();
  const allRecords = useAppDataSlice("attendanceRecords");
  const scopedProject = useProject(scopedProjectId || "");

  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    scopedProjectId || "all"
  );
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().slice(0, 10));

  const effectiveProjectId = scopedProjectId || selectedProjectId;

  const projectCast = useCastByProject(effectiveProjectId);
  const projectCrew = useCrewByProject(effectiveProjectId);

  // Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    personId: "",
    name: "",
    role: "",
    department: "Cast",
    date: new Date().toISOString().slice(0, 10),
    checkIn: "06:00",
    checkOut: "18:00",
    status: "present" as AttendanceStatus,
    hoursWorked: 12,
    notes: "",
    projectId: effectiveProjectId || projects[0]?.id || "",
  });

  const filteredRecords = allRecords.filter((record) => {
    if (effectiveProjectId && effectiveProjectId !== "all" && record.projectId !== effectiveProjectId) {
      return false;
    }
    if (statusFilter !== "all" && record.status !== statusFilter) return false;
    return true;
  });

  // Calculate dynamic stats
  const totalExpected = filteredRecords.length;
  const totalPresent = filteredRecords.filter((r) => r.status === "present").length;
  const totalPartial = filteredRecords.filter((r) => r.status === "partial").length;
  const totalAbsent = filteredRecords.filter((r) => r.status === "absent" || r.status === "leave").length;
  const attendancePercent = totalExpected > 0 ? Math.round((totalPresent / totalExpected) * 100) : 0;

  // Department group statistics
  const departmentStats = useMemo(() => {
    const map = new Map<string, { total: number; present: number; partial: number; absent: number }>();
    filteredRecords.forEach((r) => {
      const dept = r.department || "Other";
      if (!map.has(dept)) {
        map.set(dept, { total: 0, present: 0, partial: 0, absent: 0 });
      }
      const entry = map.get(dept)!;
      entry.total += 1;
      if (r.status === "present") entry.present += 1;
      else if (r.status === "partial") entry.partial += 1;
      else entry.absent += 1;
    });
    return Array.from(map.entries()).map(([dept, stats]) => ({
      department: dept,
      ...stats,
    }));
  }, [filteredRecords]);

  const handleOpenAdd = () => {
    setFormData({
      personId: "",
      name: "",
      role: "",
      department: "Cast",
      date: dateFilter || new Date().toISOString().slice(0, 10),
      checkIn: "06:00",
      checkOut: "18:00",
      status: "present",
      hoursWorked: 12,
      notes: "",
      projectId: effectiveProjectId || projects[0]?.id || "p1",
    });
    setIsAddOpen(true);
  };

  const handlePersonSelect = (val: string) => {
    if (val.startsWith("cast-")) {
      const castId = val.replace("cast-", "");
      const member = projectCast.find((c) => c.id === castId);
      if (member) {
        setFormData((prev) => ({
          ...prev,
          personId: member.id,
          name: member.name,
          role: member.character || "Lead Actor",
          department: "Cast",
        }));
      }
    } else if (val.startsWith("crew-")) {
      const crewId = val.replace("crew-", "");
      const member = projectCrew.find((c) => c.id === crewId);
      if (member) {
        setFormData((prev) => ({
          ...prev,
          personId: member.id,
          name: member.name,
          role: member.role,
          department: member.department || "Production",
        }));
      }
    }
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      projectId: formData.projectId || effectiveProjectId || projects[0]?.id || "p1",
      personId: formData.personId || undefined,
      name: formData.name.trim(),
      role: formData.role.trim() || "Crew Member",
      department: formData.department || "Production",
      date: formData.date || new Date().toISOString().slice(0, 10),
      checkIn: formData.status === "absent" ? null : formData.checkIn || null,
      checkOut: formData.status === "absent" ? null : formData.checkOut || null,
      status: formData.status,
      hoursWorked: formData.status === "absent" ? 0 : Number(formData.hoursWorked) || 0,
      notes: formData.notes.trim() || undefined,
    };

    updateAppDataSlice("attendanceRecords", (current) => [newRecord, ...current]);
    toast.success(`Logged attendance for ${newRecord.name}.`);
    setIsAddOpen(false);
  };

  const handleOpenEdit = (rec: AttendanceRecord) => {
    setEditingRecord(rec);
    setFormData({
      personId: rec.personId || "",
      name: rec.name,
      role: rec.role,
      department: rec.department,
      date: rec.date,
      checkIn: rec.checkIn || "06:00",
      checkOut: rec.checkOut || "18:00",
      status: rec.status,
      hoursWorked: rec.hoursWorked,
      notes: rec.notes || "",
      projectId: rec.projectId,
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord || !formData.name.trim()) return;

    updateAppDataSlice("attendanceRecords", (current) =>
      current.map((r) =>
        r.id === editingRecord.id
          ? {
              ...r,
              name: formData.name.trim(),
              role: formData.role.trim(),
              department: formData.department,
              date: formData.date,
              checkIn: formData.status === "absent" ? null : formData.checkIn || null,
              checkOut: formData.status === "absent" ? null : formData.checkOut || null,
              status: formData.status,
              hoursWorked: formData.status === "absent" ? 0 : Number(formData.hoursWorked) || 0,
              notes: formData.notes.trim() || undefined,
              projectId: formData.projectId || r.projectId,
            }
          : r
      )
    );
    toast.success(`Updated attendance for ${formData.name}.`);
    setEditingRecord(null);
  };

  const handleDeleteRecord = (id: string) => {
    if (confirm("Are you sure you want to delete this attendance log?")) {
      updateAppDataSlice("attendanceRecords", (current) => current.filter((r) => r.id !== id));
      toast.info("Attendance log removed.");
      if (editingRecord?.id === id) setEditingRecord(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {scopedProject ? `${scopedProject.title} · Attendance` : "Attendance Tracking"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {scopedProject
              ? `Real-time cast and crew roll call and timesheet management for ${scopedProject.title}`
              : "Real-time cast and crew attendance, biometric logs, and call-sheet verification"}
          </p>
        </div>
        <Button onClick={handleOpenAdd} className="gap-2 shrink-0 bg-primary font-semibold">
          <Plus className="w-4 h-4" />
          Log Attendance
        </Button>
      </div>

      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Attendance Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendancePercent}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalPresent} of {totalExpected} checked in
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Present On Set
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{totalPresent}</div>
            <p className="text-xs text-emerald-600/80 dark:text-emerald-400 mt-1">✓ On call schedule</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Partial Shift
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{totalPartial}</div>
            <p className="text-xs text-amber-600/80 dark:text-amber-400 mt-1">⏱ Left early / Split shift</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Absent / Leave
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{totalAbsent}</div>
            <p className="text-xs text-red-600/80 dark:text-red-400 mt-1">✗ Not on floor</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Card */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold">Roll Call & Department Verification</CardTitle>
              <CardDescription className="text-xs">
                Monitor call time compliance and log unit check-ins.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!scopedProjectId && (
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger className="w-[180px] h-9 text-xs">
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
              )}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-9 text-xs">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="leave">Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <Tabs defaultValue="today" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="today">Daily Attendance</TabsTrigger>
              <TabsTrigger value="department">By Department</TabsTrigger>
              <TabsTrigger value="summary">Weekly Metrics</TabsTrigger>
            </TabsList>

            {/* Today's Attendance Tab */}
            <TabsContent value="today" className="space-y-3">
              {filteredRecords.length > 0 ? (
                <div className="space-y-2.5">
                  {filteredRecords.map((record) => {
                    const projectObj = projects.find((p) => p.id === record.projectId);
                    return (
                      <div
                        key={record.id}
                        className="border rounded-xl p-3.5 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-start sm:items-center gap-3 min-w-0">
                          <div className="shrink-0 mt-0.5 sm:mt-0">{getStatusIcon(record.status)}</div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-sm truncate">{record.name}</h4>
                              <Badge
                                variant="outline"
                                className={`text-[10px] uppercase font-bold px-1.5 py-0 ${getStatusBadgeColor(
                                  record.status
                                )}`}
                              >
                                {record.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {record.role} · <span className="font-medium">{record.department}</span>
                              {projectObj && !scopedProjectId && ` · ${projectObj.title}`}
                            </p>
                            {record.notes && (
                              <p className="text-xs text-muted-foreground/90 italic mt-1">📝 {record.notes}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0">
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <div className="bg-muted/50 px-2.5 py-1 rounded-md text-center">
                              <span className="text-[10px] uppercase block font-semibold text-muted-foreground/70">
                                In
                              </span>
                              <span className="font-medium text-foreground">{record.checkIn || "—"}</span>
                            </div>
                            <div className="bg-muted/50 px-2.5 py-1 rounded-md text-center">
                              <span className="text-[10px] uppercase block font-semibold text-muted-foreground/70">
                                Out
                              </span>
                              <span className="font-medium text-foreground">{record.checkOut || "—"}</span>
                            </div>
                            <div className="bg-muted/50 px-2.5 py-1 rounded-md text-center">
                              <span className="text-[10px] uppercase block font-semibold text-muted-foreground/70">
                                Hours
                              </span>
                              <span className="font-bold text-foreground">{record.hoursWorked}h</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => handleOpenEdit(record)}
                              title="Edit Log"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteRecord(record.id)}
                              title="Delete Log"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed rounded-xl">
                  <Users className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-30" />
                  <p className="text-sm text-muted-foreground font-medium">No attendance records logged</p>
                  <Button size="sm" onClick={handleOpenAdd} className="mt-3 gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    Log First Member
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* By Department Tab */}
            <TabsContent value="department" className="space-y-3">
              {departmentStats.map((dept) => {
                const deptPercent = dept.total > 0 ? Math.round((dept.present / dept.total) * 100) : 0;
                return (
                  <div key={dept.department} className="border rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        {dept.department} Department
                      </h4>
                      <Badge variant="outline" className="font-bold">
                        {deptPercent}% Present
                      </Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      <div className="bg-muted/40 p-2 rounded-lg">
                        <span className="text-muted-foreground block">Total Call</span>
                        <span className="text-sm font-bold">{dept.total}</span>
                      </div>
                      <div className="bg-emerald-500/10 p-2 rounded-lg text-emerald-600 dark:text-emerald-400">
                        <span className="block">Present</span>
                        <span className="text-sm font-bold">{dept.present}</span>
                      </div>
                      <div className="bg-amber-500/10 p-2 rounded-lg text-amber-600 dark:text-amber-400">
                        <span className="block">Partial</span>
                        <span className="text-sm font-bold">{dept.partial}</span>
                      </div>
                      <div className="bg-red-500/10 p-2 rounded-lg text-red-600 dark:text-red-400">
                        <span className="block">Absent</span>
                        <span className="text-sm font-bold">{dept.absent}</span>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-primary transition-all duration-300"
                        style={{ width: `${deptPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </TabsContent>

            {/* Weekly Metrics Tab */}
            <TabsContent value="summary" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-xl p-4 space-y-3">
                  <h4 className="font-semibold text-sm">Call Sheet Verification</h4>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex justify-between py-1 border-b">
                      <span>On-Time Arrival Rate</span>
                      <span className="font-semibold text-foreground">94%</span>
                    </div>
                    <div className="flex justify-between py-1 border-b">
                      <span>Average Working Hours</span>
                      <span className="font-semibold text-foreground">11.8 hrs / day</span>
                    </div>
                    <div className="flex justify-between py-1 border-b">
                      <span>Overtime Approved</span>
                      <span className="font-semibold text-amber-500">+14 hrs</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Biometric Sync Status</span>
                      <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/30">
                        Synchronized
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="border rounded-xl p-4 space-y-3">
                  <h4 className="font-semibold text-sm">Turnover & Safety Highlights</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      <span>Zero medical accidents recorded on current schedule.</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <Clock className="w-4 h-4 shrink-0" />
                      <span>Mandatory 12-hour rest turnaround enforced for key crew.</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add Attendance Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Log Cast & Crew Attendance</DialogTitle>
            <DialogDescription>
              Record check-in time, shift status, and call hours for production members.
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

            {/* Quick Pick from Cast / Crew */}
            {(projectCast.length > 0 || projectCrew.length > 0) && (
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Quick Select Roster Member
                </label>
                <Select onValueChange={handlePersonSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Cast or Crew Member..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {projectCast.map((c) => (
                      <SelectItem key={c.id} value={`cast-${c.id}`}>
                        🎭 [Cast] {c.name} ({c.character || "Actor"})
                      </SelectItem>
                    ))}
                    {projectCrew.map((cr) => (
                      <SelectItem key={cr.id} value={`crew-${cr.id}`}>
                        🎬 [Crew] {cr.name} ({cr.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Name *</label>
                <Input
                  required
                  placeholder="e.g. Santhosh Sivan"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Role / Designation *</label>
                <Input
                  required
                  placeholder="e.g. Director of Photography"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Department</label>
                <Select
                  value={formData.department}
                  onValueChange={(val) => setFormData({ ...formData, department: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Status</label>
                <Select
                  value={formData.status}
                  onValueChange={(val: AttendanceStatus) => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="leave">Leave Approved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Check-In</label>
                <Input
                  type="time"
                  disabled={formData.status === "absent"}
                  value={formData.checkIn}
                  onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Check-Out</label>
                <Input
                  type="time"
                  disabled={formData.status === "absent"}
                  value={formData.checkOut}
                  onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Hours</label>
                <Input
                  type="number"
                  step="0.5"
                  disabled={formData.status === "absent"}
                  value={formData.hoursWorked}
                  onChange={(e) => setFormData({ ...formData, hoursWorked: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Notes / Sequence Info</label>
              <Textarea
                rows={2}
                placeholder="Action scene stunts, medical permission, late pickup reason..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary">
                Save Roll Call
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Attendance Dialog */}
      <Dialog open={!!editingRecord} onOpenChange={(open) => !open && setEditingRecord(null)}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Attendance Record</DialogTitle>
            <DialogDescription>
              Update check-in/out times, recorded hours, and call notes.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Name *</label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Role *</label>
                <Input
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Department</label>
                <Select
                  value={formData.department}
                  onValueChange={(val) => setFormData({ ...formData, department: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Status</label>
                <Select
                  value={formData.status}
                  onValueChange={(val: AttendanceStatus) => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="leave">Leave Approved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Check-In</label>
                <Input
                  type="time"
                  disabled={formData.status === "absent"}
                  value={formData.checkIn}
                  onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Check-Out</label>
                <Input
                  type="time"
                  disabled={formData.status === "absent"}
                  value={formData.checkOut}
                  onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Hours</label>
                <Input
                  type="number"
                  step="0.5"
                  disabled={formData.status === "absent"}
                  value={formData.hoursWorked}
                  onChange={(e) => setFormData({ ...formData, hoursWorked: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Notes</label>
              <Textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <DialogFooter className="gap-2 pt-2 flex items-center justify-between">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => editingRecord && handleDeleteRecord(editingRecord.id)}
              >
                Delete Log
              </Button>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingRecord(null)}>
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
