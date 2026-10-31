"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  XCircle,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
  UtensilsCrossed,
  Plus,
  Minus,
  AlertTriangle,
  CalendarDays,
  TrendingUp,
  Search,
} from "lucide-react";
import { useProjects } from "@/lib/project-store";
import { useAppDataSlice } from "@/lib/app-data-store";
import {
  useAttendanceRecords,
  useCateringAdjustments,
  upsertAttendance,
  addCateringAdjustment,
  deleteCateringAdjustment,
  calcCateringCount,
} from "@/lib/attendance-store";
import type { AttendanceStatus, AttendanceRecord } from "@/lib/types";
import { toast } from "sonner";

// ── helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; color: string; icon: React.ReactNode }> = {
  present: {
    label: "Present",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  absent: {
    label: "Absent",
    color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
  "half-day": {
    label: "Half Day",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  "on-leave": {
    label: "On Leave",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  },
  partial: {
    label: "Partial",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  leave: {
    label: "Leave",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  },
  "not-required": {
    label: "Not Required",
    color: "bg-muted text-muted-foreground border-border",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
  unconfirmed: {
    label: "Unconfirmed",
    color: "bg-muted text-muted-foreground border-border",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
};

function StatusBadge({ status }: { status: AttendanceStatus | "unconfirmed" }) {
  const cfg = STATUS_CONFIG[status as AttendanceStatus] ?? STATUS_CONFIG.unconfirmed;
  return (
    <Badge variant="outline" className={`gap-1 text-xs ${cfg.color}`}>
      {cfg.icon}
      {cfg.label}
    </Badge>
  );
}

// ── types ─────────────────────────────────────────────────────────────────────

interface RosterRow {
  personId: string;
  name: string;
  role: string;
  department: string;
  record?: AttendanceRecord;
}

interface AttendanceTabProps {
  projectId?: string; // if provided: project-scoped; otherwise: all-projects view
}

// ── main component ────────────────────────────────────────────────────────────

export function AttendanceTab({ projectId: scopedProjectId }: AttendanceTabProps) {
  const projects = useProjects();
  const allRecords = useAttendanceRecords();
  const allAdjustments = useCateringAdjustments();
  const shootDays = useAppDataSlice("shootDays");
  const castMembers = useAppDataSlice("castMembers");
  const crewMembers = useAppDataSlice("crewMembers");

  // project selection (for all-projects view)
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    scopedProjectId ?? projects[0]?.id ?? ""
  );
  const effectiveProjectId = scopedProjectId ?? selectedProjectId;

  // shoot days for the selected project, sorted
  const projectShootDays = useMemo(
    () =>
      shootDays
        .filter((sd) => sd.projectId === effectiveProjectId)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [shootDays, effectiveProjectId]
  );

  // selected shoot day index
  const [dayIdx, setDayIdx] = useState(0);
  const selectedDay = projectShootDays[dayIdx] ?? null;
  const selectedDate = selectedDay?.date ?? "";

  // history search
  const [historySearch, setHistorySearch] = useState("");

  // catering adjustment dialog
  const [showCateringDialog, setShowCateringDialog] = useState(false);
  const [cateringDelta, setCateringDelta] = useState<string>("");
  const [cateringReason, setCateringReason] = useState("");

  // build roster for the selected day
  const roster = useMemo<RosterRow[]>(() => {
    if (!selectedDay) return [];

    const rows: RosterRow[] = [];
    const seenIds = new Set<string>();

    // Cast required on this shoot day
    const castNames: string[] = selectedDay.castRequired ?? [];
    for (const name of castNames) {
      const member = castMembers.find((m) => m.name === name);
      const personId = member?.id ?? `cast-${name.toLowerCase().replace(/\s+/g, "-")}`;
      if (seenIds.has(personId)) continue;
      seenIds.add(personId);
      const record = allRecords.find(
        (r) => r.projectId === effectiveProjectId && r.date === selectedDate && r.personId === personId
      );
      rows.push({ personId, name, role: member?.character ?? "Cast", department: "Cast", record });
    }

    // Key crew for this project
    const projectCrew = crewMembers.filter((c) => c.projectId === effectiveProjectId).slice(0, 10);
    for (const crew of projectCrew) {
      if (seenIds.has(crew.id)) continue;
      seenIds.add(crew.id);
      const record = allRecords.find(
        (r) => r.projectId === effectiveProjectId && r.date === selectedDate && r.personId === crew.id
      );
      rows.push({ personId: crew.id, name: crew.name, role: crew.role, department: crew.department ?? "Production", record });
    }

    // Visitors on this day
    const visitorRecs = allRecords.filter(
      (r) => r.projectId === effectiveProjectId && r.date === selectedDate && r.department === "Visitors"
    );
    for (const vr of visitorRecs) {
      const vid = vr.personId ?? vr.id;
      if (seenIds.has(vid)) continue;
      seenIds.add(vid);
      rows.push({ personId: vid, name: vr.name, role: vr.role, department: "Visitors", record: vr });
    }

    return rows;
  }, [selectedDay, selectedDate, effectiveProjectId, allRecords, castMembers, crewMembers]);

  // summary stats
  const stats = useMemo(() => {
    const total = roster.length;
    const present = roster.filter((r) => r.record?.status === "present").length;
    const halfDay = roster.filter((r) => r.record?.status === "half-day" || r.record?.status === "partial").length;
    const absent = roster.filter((r) => r.record?.status === "absent").length;
    const onLeave = roster.filter((r) => r.record?.status === "on-leave" || r.record?.status === "leave").length;
    const unconfirmed = roster.filter((r) => !r.record || r.record.status === "unconfirmed").length;
    return { total, present, halfDay, absent, onLeave, unconfirmed };
  }, [roster]);

  const catering = useMemo(
    () => calcCateringCount(allRecords, allAdjustments, effectiveProjectId, selectedDate),
    [allRecords, allAdjustments, effectiveProjectId, selectedDate]
  );

  // history records
  const historyRecords = useMemo(() => {
    const base = allRecords.filter((r) => r.projectId === effectiveProjectId);
    const q = historySearch.toLowerCase();
    if (!q) return base;
    return base.filter(
      (r) => r.name.toLowerCase().includes(q) || r.date.includes(q) || r.department?.toLowerCase().includes(q)
    );
  }, [allRecords, effectiveProjectId, historySearch]);

  // change a single person's status
  function setStatus(row: RosterRow, status: AttendanceStatus) {
    upsertAttendance({
      id: row.record?.id,
      projectId: effectiveProjectId,
      personId: row.personId,
      name: row.name,
      role: row.role,
      department: row.department,
      date: selectedDate,
      status,
      checkIn: row.record?.checkIn ?? null,
      checkOut: row.record?.checkOut ?? null,
      hoursWorked: row.record?.hoursWorked ?? 0,
      notes: row.record?.notes ?? "",
    });
    toast.success(`${row.name} marked as ${STATUS_CONFIG[status]?.label ?? status}`);
  }

  // bulk mark all unconfirmed as present
  function bulkMarkPresent() {
    const unconfirmed = roster.filter((r) => !r.record || r.record.status === "unconfirmed");
    for (const row of unconfirmed) setStatus(row, "present");
    toast.success(`Marked ${unconfirmed.length} unconfirmed members as present`);
  }

  function submitCateringAdjustment() {
    const delta = parseInt(cateringDelta);
    if (isNaN(delta) || delta === 0 || !cateringReason.trim()) {
      toast.error("Enter a non-zero adjustment and a reason");
      return;
    }
    addCateringAdjustment({
      projectId: effectiveProjectId,
      date: selectedDate,
      delta,
      reason: cateringReason.trim(),
      adjustedBy: "Production Team",
    });
    setCateringDelta("");
    setCateringReason("");
    setShowCateringDialog(false);
    toast.success(`Catering adjustment of ${delta > 0 ? "+" : ""}${delta} saved`);
  }

  const todayAdjustments = useMemo(
    () => allAdjustments.filter((a) => a.projectId === effectiveProjectId && a.date === selectedDate),
    [allAdjustments, effectiveProjectId, selectedDate]
  );

  const project = projects.find((p) => p.id === effectiveProjectId);

  return (
    <div className="space-y-4">
      {/* project selector (only in global view) */}
      {!scopedProjectId && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Project:</span>
          <Select value={selectedProjectId} onValueChange={(v) => { setSelectedProjectId(v); setDayIdx(0); }}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Tabs defaultValue="register">
        <TabsList>
          <TabsTrigger value="register">
            <Users className="w-4 h-4 mr-1.5" />
            Register
          </TabsTrigger>
          <TabsTrigger value="catering">
            <UtensilsCrossed className="w-4 h-4 mr-1.5" />
            Catering
          </TabsTrigger>
          <TabsTrigger value="history">
            <CalendarDays className="w-4 h-4 mr-1.5" />
            History
          </TabsTrigger>
        </TabsList>

        {/* ── REGISTER TAB ──────────────────────────────────────────── */}
        <TabsContent value="register" className="space-y-4 mt-4">
          {/* shoot day navigation */}
          <Card>
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDayIdx((i) => Math.max(0, i - 1))}
                  disabled={dayIdx === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <div className="text-center">
                  <p className="font-semibold text-sm">
                    {selectedDay
                      ? new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", {
                          weekday: "long",
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })
                      : "No shoot days"}
                  </p>
                  {selectedDay && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Shoot Day {selectedDay.shootDayNumber ?? dayIdx + 1} ·{" "}
                      {selectedDay.location ?? "Location TBD"} ·{" "}
                      {dayIdx + 1}/{projectShootDays.length}
                    </p>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDayIdx((i) => Math.min(projectShootDays.length - 1, i + 1))}
                  disabled={dayIdx >= projectShootDays.length - 1}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Present", value: stats.present, color: "text-emerald-600 dark:text-emerald-400" },
              { label: "Half Day", value: stats.halfDay, color: "text-amber-600 dark:text-amber-400" },
              { label: "Absent", value: stats.absent, color: "text-red-600 dark:text-red-400" },
              { label: "On Leave", value: stats.onLeave, color: "text-blue-600 dark:text-blue-400" },
              { label: "Unconfirmed", value: stats.unconfirmed, color: "text-muted-foreground" },
            ].map(({ label, value, color }) => (
              <Card key={label}>
                <CardContent className="py-3 text-center">
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* bulk actions */}
          {stats.unconfirmed > 0 && (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={bulkMarkPresent}>
                <CheckCircle className="w-4 h-4 mr-1.5 text-emerald-500" />
                Mark {stats.unconfirmed} unconfirmed as Present
              </Button>
            </div>
          )}

          {/* roster table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                Attendance Register — {project?.title ?? ""}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {roster.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">
                  No shoot day selected or no cast/crew assigned to this day.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Dept</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Change</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roster.map((row) => (
                      <TableRow key={row.personId}>
                        <TableCell className="font-medium text-sm">{row.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{row.role}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{row.department}</TableCell>
                        <TableCell>
                          <StatusBadge status={row.record?.status ?? "unconfirmed"} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Select
                            value={row.record?.status ?? "unconfirmed"}
                            onValueChange={(v) => setStatus(row, v as AttendanceStatus)}
                          >
                            <SelectTrigger className="h-7 w-36 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="present">Present</SelectItem>
                              <SelectItem value="half-day">Half Day</SelectItem>
                              <SelectItem value="absent">Absent</SelectItem>
                              <SelectItem value="on-leave">On Leave</SelectItem>
                              <SelectItem value="not-required">Not Required</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── CATERING TAB ──────────────────────────────────────────── */}
        <TabsContent value="catering" className="space-y-4 mt-4">
          {/* shoot day context */}
          <Card>
            <CardContent className="py-3 px-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  {selectedDate
                    ? new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", {
                        weekday: "long",
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })
                    : "—"}
                </p>
                <p className="text-xs text-muted-foreground">{project?.title}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setDayIdx((i) => Math.max(0, i - 1))} disabled={dayIdx === 0}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setDayIdx((i) => Math.min(projectShootDays.length - 1, i + 1))} disabled={dayIdx >= projectShootDays.length - 1}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* catering breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Cast Meals", value: catering.castCount, color: "text-violet-600 dark:text-violet-400" },
              { label: "Crew Meals", value: catering.crewCount, color: "text-indigo-600 dark:text-indigo-400" },
              { label: "Visitors", value: catering.visitorCount, color: "text-sky-600 dark:text-sky-400" },
              { label: "Total Sets", value: catering.total, color: "text-emerald-600 dark:text-emerald-400" },
            ].map(({ label, value, color }) => (
              <Card key={label}>
                <CardContent className="py-4 text-center">
                  <p className={`text-3xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* adjustments */}
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Manual Adjustments</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setShowCateringDialog(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Add Adjustment
              </Button>
            </CardHeader>
            <CardContent>
              {todayAdjustments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No adjustments for this day.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reason</TableHead>
                      <TableHead>Adjusted By</TableHead>
                      <TableHead className="text-right">Delta</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todayAdjustments.map((adj) => (
                      <TableRow key={adj.id}>
                        <TableCell className="text-sm">{adj.reason}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{adj.adjustedBy}</TableCell>
                        <TableCell className={`text-right font-semibold ${adj.delta > 0 ? "text-emerald-600" : "text-red-600"}`}>
                          {adj.delta > 0 ? "+" : ""}{adj.delta}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => { deleteCateringAdjustment(adj.id); toast.success("Adjustment removed"); }}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {catering.adjustmentDelta !== 0 && (
                <div className="mt-3 pt-3 border-t flex justify-between text-sm">
                  <span className="text-muted-foreground">Net adjustment</span>
                  <span className={`font-semibold ${catering.adjustmentDelta > 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {catering.adjustmentDelta > 0 ? "+" : ""}{catering.adjustmentDelta}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* summary note */}
          <p className="text-xs text-muted-foreground">
            Half-day / partial attendance counts as 0.5 meal. Catering total = Cast + Crew + Visitors + Adjustments.
          </p>
        </TabsContent>

        {/* ── HISTORY TAB ──────────────────────────────────────────── */}
        <TabsContent value="history" className="space-y-4 mt-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, date, department…"
                className="pl-8"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
              />
            </div>
            <span className="text-sm text-muted-foreground">{historyRecords.length} records</span>
          </div>

          {/* overview by date */}
          <HistoryOverview records={historyRecords} projectId={effectiveProjectId} shootDays={projectShootDays} />
        </TabsContent>
      </Tabs>

      {/* catering adjustment dialog */}
      <Dialog open={showCateringDialog} onOpenChange={setShowCateringDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Catering Adjustment</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Delta (positive = add, negative = remove)</label>
              <Input
                type="number"
                placeholder="e.g. +5 or -2"
                value={cateringDelta}
                onChange={(e) => setCateringDelta(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Reason</label>
              <Input
                placeholder="e.g. Extra VFX team on set"
                value={cateringReason}
                onChange={(e) => setCateringReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCateringDialog(false)}>Cancel</Button>
            <Button onClick={submitCateringAdjustment}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── history overview sub-component ───────────────────────────────────────────

function HistoryOverview({
  records,
  projectId,
  shootDays,
}: {
  records: AttendanceRecord[];
  projectId: string;
  shootDays: Array<{ date: string; shootDayNumber?: number }>;
}) {
  // group by date
  const byDate = useMemo(() => {
    const map = new Map<string, AttendanceRecord[]>();
    for (const r of records) {
      if (!map.has(r.date)) map.set(r.date, []);
      map.get(r.date)!.push(r);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [records]);

  if (byDate.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No records found.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {byDate.slice(0, 30).map(([date, recs]) => {
        const present = recs.filter((r) => r.status === "present").length;
        const halfDay = recs.filter((r) => r.status === "half-day" || r.status === "partial").length;
        const absent = recs.filter((r) => r.status === "absent").length;
        const shootDay = shootDays.find((sd) => sd.date === date);
        const attendancePct = recs.length > 0 ? Math.round(((present + halfDay * 0.5) / recs.length) * 100) : 0;

        return (
          <Card key={date}>
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                    {shootDay && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        Day {shootDay.shootDayNumber}
                      </span>
                    )}
                  </p>
                  <div className="flex gap-3 mt-1">
                    <span className="text-xs text-emerald-600 dark:text-emerald-400">{present} present</span>
                    {halfDay > 0 && <span className="text-xs text-amber-600 dark:text-amber-400">{halfDay} half-day</span>}
                    {absent > 0 && <span className="text-xs text-red-600 dark:text-red-400">{absent} absent</span>}
                    <span className="text-xs text-muted-foreground">{recs.length} total</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{attendancePct}%</p>
                  <p className="text-xs text-muted-foreground">attendance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      {byDate.length > 30 && (
        <p className="text-xs text-muted-foreground text-center">Showing 30 of {byDate.length} dates</p>
      )}
    </div>
  );
}
