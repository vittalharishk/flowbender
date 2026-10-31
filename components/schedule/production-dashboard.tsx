"use client";

import { useState } from "react";
import {
  Clapperboard, Calendar, MapPin, Clock, Plus, Pencil, FileText, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useAppDataSlice } from "@/lib/app-data-store";
import { useDPRReports, createDPR, updateDPR, submitDPR, deleteDPR } from "@/lib/dpr-store";
import { useAttendanceRecords, calcCateringCount, useCateringAdjustments } from "@/lib/attendance-store";
import type { ShootDay, DPRReport, DPRStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

// ── helpers ──────────────────────────────────────────────────────────────────

const SHOOT_STATUS_COLOR: Record<string, string> = {
  planned: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  confirmed: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "in-progress": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  completed: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  cancelled: "bg-red-500/20 text-red-300 border-red-500/30",
};
const DPR_STATUS_COLOR: Record<DPRStatus, string> = {
  draft: "bg-amber-500/20 text-amber-400",
  submitted: "bg-blue-500/20 text-blue-300",
  approved: "bg-emerald-500/20 text-emerald-300",
};

const dateLabel = (d: string) =>
  new Date(`${d}T12:00:00`).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" });

// ── component ─────────────────────────────────────────────────────────────────

export function ProductionDashboard({ projectId }: { projectId?: string }) {
  const allShootDays = (useAppDataSlice("shootDays") ?? []) as ShootDay[];
  const projects = useAppDataSlice("projects") ?? [];
  const attendanceRecords = useAttendanceRecords();
  const cateringAdjustments = useCateringAdjustments();
  const dprReports = useDPRReports(projectId);

  const [selectedProject, setSelectedProject] = useState<string>(projectId ?? "all");
  const [dprDialog, setDprDialog] = useState<DPRReport | "create" | null>(null);
  const [selectedShootDay, setSelectedShootDay] = useState<ShootDay | null>(null);
  const [sceneDay, setSceneDayId] = useState<string>("");
  const [dprFilterStatus, setDprFilterStatus] = useState<string>("all");

  const shootDays = allShootDays.filter((d) =>
    selectedProject === "all" ? true : d.projectId === selectedProject
  );

  const total = shootDays.length;
  const completed = shootDays.filter((d) => d.status === "completed").length;
  const inProgress = shootDays.filter((d) => d.status === "in-progress").length;
  const planned = shootDays.filter((d) => d.status === "planned").length;
  const confirmed = shootDays.filter((d) => d.status === "confirmed").length;

  const totalScenes = shootDays.reduce((a, d) => a + (d.scenes?.length ?? 0), 0);
  const completedScenes = shootDays
    .filter((d) => d.status === "completed")
    .reduce((a, d) => a + (d.scenes?.length ?? 0), 0);

  const filteredDprs = dprReports.filter((r) =>
    dprFilterStatus === "all" ? true : r.status === dprFilterStatus
  );

  const sceneDayObj = shootDays.find((d) => d.id === sceneDay) ?? shootDays[0] ?? null;

  return (
    <div className="space-y-4">
      {/* Project filter */}
      {!projectId && (
        <div className="flex items-center gap-3">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-56 h-8 text-xs">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Tabs defaultValue="dashboard">
        <TabsList className="h-9 text-xs">
          <TabsTrigger value="dashboard" className="text-xs">Dashboard</TabsTrigger>
          <TabsTrigger value="shootdays" className="text-xs">Shoot Days</TabsTrigger>
          <TabsTrigger value="scenes" className="text-xs">Scene Progress</TabsTrigger>
          <TabsTrigger value="dpr" className="text-xs">DPR Reports</TabsTrigger>
        </TabsList>

        {/* ── DASHBOARD ─────────────────────────────────────── */}
        <TabsContent value="dashboard" className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { label: "Total Shoot Days", value: total, color: "text-foreground" },
              { label: "Completed", value: completed, color: "text-emerald-400" },
              { label: "In Progress", value: inProgress, color: "text-amber-400" },
              { label: "Confirmed", value: confirmed, color: "text-blue-400" },
              { label: "Planned", value: planned, color: "text-slate-400" },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="p-3">
                  <p className="text-[11px] text-muted-foreground">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Scene Completion</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{completedScenes} / {totalScenes} scenes</span>
                  <span>{totalScenes ? Math.round((completedScenes / totalScenes) * 100) : 0}%</span>
                </div>
                <Progress value={totalScenes ? (completedScenes / totalScenes) * 100 : 0} className="h-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">DPR Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-xs">
                {(["draft", "submitted", "approved"] as DPRStatus[]).map((s) => {
                  const count = dprReports.filter((r) => r.status === s).length;
                  return (
                    <div key={s} className="flex justify-between">
                      <span className="text-muted-foreground capitalize">{s}</span>
                      <Badge className={`text-[10px] ${DPR_STATUS_COLOR[s]}`}>{count}</Badge>
                    </div>
                  );
                })}
                <p className="text-muted-foreground pt-1">Total DPRs: {dprReports.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Project-wise progress */}
          {selectedProject === "all" && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Project-wise Production Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {projects.map((p) => {
                  const pDays = allShootDays.filter((d) => d.projectId === p.id);
                  const pDone = pDays.filter((d) => d.status === "completed").length;
                  const pct = pDays.length ? Math.round((pDone / pDays.length) * 100) : 0;
                  if (!pDays.length) return null;
                  return (
                    <div key={p.id} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground truncate max-w-[240px]">{p.title}</span>
                        <span className="text-foreground font-medium ml-2">{pDone}/{pDays.length} days</span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── SHOOT DAYS ────────────────────────────────────── */}
        <TabsContent value="shootdays" className="pt-4">
          <div className="space-y-2">
            {shootDays.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-10 border border-dashed rounded-lg">No shoot days found.</p>
            )}
            {shootDays.map((day) => {
              const dpr = dprReports.find((r) => r.shootDayId === day.id);
              const catering = calcCateringCount(attendanceRecords, cateringAdjustments, day.projectId, day.date);
              return (
                <Card
                  key={day.id}
                  className="border hover:border-primary/40 transition-colors cursor-pointer"
                  onClick={() => setSelectedShootDay(day)}
                >
                  <CardContent className="p-3 flex items-center gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold">Day {day.shootDayNumber}</span>
                        <Badge className={`text-[10px] ${SHOOT_STATUS_COLOR[day.status] ?? "bg-slate-500/20 text-slate-300"}`}>
                          {day.status}
                        </Badge>
                        {dpr && (
                          <Badge className={`text-[10px] ${DPR_STATUS_COLOR[dpr.status]}`}>
                            DPR {dpr.status}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {dateLabel(day.date)}
                        <span className="mx-1">·</span>
                        <MapPin className="w-3 h-3" /> {day.location}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                      <span>{day.scenes?.length ?? 0} scenes</span>
                      <span>{day.castRequired?.length ?? 0} cast</span>
                      {catering.total > 0 && <span>{catering.total} meals</span>}
                      {!dpr && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[10px] px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDprDialog("create");
                            setSelectedShootDay(day);
                          }}
                        >
                          + DPR
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ── SCENE PROGRESS ────────────────────────────────── */}
        <TabsContent value="scenes" className="pt-4">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <Label className="text-xs shrink-0">Shoot Day:</Label>
            <Select
              value={sceneDayObj?.id ?? ""}
              onValueChange={setSceneDayId}
            >
              <SelectTrigger className="w-72 h-8 text-xs">
                <SelectValue placeholder="Select shoot day" />
              </SelectTrigger>
              <SelectContent>
                {shootDays.map((d) => (
                  <SelectItem key={d.id} value={d.id} className="text-xs">
                    Day {d.shootDayNumber} · {dateLabel(d.date)} · {d.location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {sceneDayObj ? (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-3 mb-4">
                <Card>
                  <CardContent className="p-3">
                    <p className="text-[11px] text-muted-foreground">Scenes Planned</p>
                    <p className="text-xl font-bold">{sceneDayObj.scenes?.length ?? 0}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <p className="text-[11px] text-muted-foreground">Total Pages</p>
                    <p className="text-xl font-bold text-amber-400">{sceneDayObj.totalPages ?? 0}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <p className="text-[11px] text-muted-foreground">Status</p>
                    <Badge className={`text-[11px] ${SHOOT_STATUS_COLOR[sceneDayObj.status] ?? "bg-slate-500/20 text-slate-300"}`}>
                      {sceneDayObj.status}
                    </Badge>
                  </CardContent>
                </Card>
              </div>
              {(sceneDayObj.scenes ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8 border border-dashed rounded-lg">No scenes assigned to this shoot day.</p>
              )}
              {(sceneDayObj.scenes ?? []).map((scene) => (
                <Card key={scene.sceneNumber} className="border">
                  <CardContent className="p-3 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">Sc. {scene.sceneNumber} · {scene.heading}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {scene.intExt} · {scene.pages} pages
                        {scene.characters?.length ? ` · ${scene.characters.join(", ")}` : ""}
                      </p>
                    </div>
                    <Badge
                      className={`text-[10px] shrink-0 ${
                        sceneDayObj.status === "completed"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {sceneDayObj.status === "completed" ? "Completed" : "Planned"}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-10 border border-dashed rounded-lg">Select a shoot day to see scene progress.</p>
          )}
        </TabsContent>

        {/* ── DPR REPORTS ───────────────────────────────────── */}
        <TabsContent value="dpr" className="pt-4">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <Select value={dprFilterStatus} onValueChange={setDprFilterStatus}>
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => { setSelectedShootDay(null); setDprDialog("create"); }}>
              <Plus className="w-3.5 h-3.5" /> New DPR
            </Button>
          </div>
          <div className="space-y-2">
            {filteredDprs.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-10 border border-dashed rounded-lg">No DPR reports found.</p>
            )}
            {filteredDprs.map((dpr) => (
              <Card key={dpr.id} className="border hover:border-primary/40 cursor-pointer transition-colors" onClick={() => setDprDialog(dpr)}>
                <CardContent className="p-3 flex items-center gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold">Day {dpr.shootDayNumber}</span>
                      <Badge className={`text-[10px] ${DPR_STATUS_COLOR[dpr.status]}`}>{dpr.status}</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {dateLabel(dpr.date)} · {dpr.location}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground flex gap-3 shrink-0">
                    <span>{dpr.scenesCompleted}/{dpr.scenesPlanned} scenes</span>
                    <span>{dpr.pagesCompleted}/{dpr.pagesPlanned} pages</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* ── SHOOT DAY DETAIL DIALOG ────────────────────────── */}
      {selectedShootDay && dprDialog === null && (
        <ShootDayDetailDialog
          day={selectedShootDay}
          dpr={dprReports.find((r) => r.shootDayId === selectedShootDay.id) ?? null}
          attendanceRecords={attendanceRecords}
          cateringAdjustments={cateringAdjustments}
          onClose={() => setSelectedShootDay(null)}
          onCreateDPR={() => setDprDialog("create")}
          onEditDPR={(dpr) => setDprDialog(dpr)}
        />
      )}

      {/* ── DPR DIALOG ────────────────────────────────────── */}
      {dprDialog !== null && (
        <DPRDialog
          dpr={dprDialog !== "create" ? dprDialog : null}
          shootDay={selectedShootDay}
          projectId={projectId ?? (selectedProject !== "all" ? selectedProject : "p1")}
          projects={projects}
          shootDays={shootDays}
          onSave={(form) => {
            if (form.id) {
              updateDPR(form.id, form);
            } else {
              createDPR(form as Omit<DPRReport, "id" | "createdAt" | "updatedAt">);
            }
            setDprDialog(null);
          }}
          onSubmit={(id) => { submitDPR(id); setDprDialog(null); }}
          onDelete={(id) => { deleteDPR(id); setDprDialog(null); }}
          onClose={() => setDprDialog(null)}
        />
      )}
    </div>
  );
}

// ── ShootDayDetailDialog ──────────────────────────────────────────────────────

function ShootDayDetailDialog({
  day, dpr, attendanceRecords, cateringAdjustments, onClose, onCreateDPR, onEditDPR,
}: {
  day: ShootDay;
  dpr: DPRReport | null;
  attendanceRecords: ReturnType<typeof useAttendanceRecords>;
  cateringAdjustments: ReturnType<typeof useCateringAdjustments>;
  onClose: () => void;
  onCreateDPR: () => void;
  onEditDPR: (dpr: DPRReport) => void;
}) {
  const catering = calcCateringCount(attendanceRecords, cateringAdjustments, day.projectId, day.date);
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <Clapperboard className="w-4 h-4 text-amber-500" />
            Day {day.shootDayNumber} · {dateLabel(day.date)}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <InfoCard label="Status"><Badge className={`text-[10px] ${SHOOT_STATUS_COLOR[day.status] ?? ""}`}>{day.status}</Badge></InfoCard>
            <InfoCard label="Location">{day.location}</InfoCard>
            <InfoCard label="Call Time">{day.callTime} – {day.wrapTime}</InfoCard>
            <InfoCard label="Cast Required">{day.castRequired?.length ?? 0} artists</InfoCard>
            <InfoCard label="Crew Assigned">{day.crewRequired?.length ?? 0} crew</InfoCard>
            <InfoCard label="Catering">{catering.total > 0 ? `${catering.total} meals` : "—"}</InfoCard>
          </div>

          {/* Scenes */}
          {(day.scenes ?? []).length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2">Scenes</p>
              <div className="space-y-1">
                {day.scenes.map((s) => (
                  <div key={s.sceneNumber} className="flex items-center gap-2 text-xs border rounded-lg px-3 py-2">
                    <span className="font-medium">Sc. {s.sceneNumber}</span>
                    <span className="flex-1 text-muted-foreground truncate">{s.heading}</span>
                    <Badge variant="outline" className="text-[10px]">{s.intExt}</Badge>
                    <span className="text-muted-foreground">{s.pages}pg</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cast */}
          {(day.castRequired ?? []).length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2">Cast Required</p>
              <div className="flex flex-wrap gap-1.5">
                {day.castRequired.map((name) => (
                  <Badge key={name} variant="secondary" className="text-[10px]">{name}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* DPR */}
          <div className="border-t pt-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold">Daily Production Report</p>
              {dpr ? (
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => onEditDPR(dpr)}>
                  <Pencil className="w-3 h-3" /> Edit DPR
                </Button>
              ) : (
                <Button size="sm" className="h-7 text-xs gap-1" onClick={onCreateDPR}>
                  <Plus className="w-3 h-3" /> Create DPR
                </Button>
              )}
            </div>
            {dpr ? (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <InfoCard label="DPR Status"><Badge className={`text-[10px] ${DPR_STATUS_COLOR[dpr.status]}`}>{dpr.status}</Badge></InfoCard>
                <InfoCard label="Scenes">{dpr.scenesCompleted}/{dpr.scenesPlanned} completed</InfoCard>
                <InfoCard label="Pages">{dpr.pagesCompleted}/{dpr.pagesPlanned} shot</InfoCard>
                <InfoCard label="Cast Present">{dpr.castPresent}</InfoCard>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No DPR filed for this shoot day.</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InfoCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border px-3 py-2">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <div className="text-xs font-medium mt-0.5">{children}</div>
    </div>
  );
}

// ── DPRDialog ─────────────────────────────────────────────────────────────────

function DPRDialog({
  dpr, shootDay, projectId, projects, shootDays, onSave, onSubmit, onDelete, onClose,
}: {
  dpr: DPRReport | null;
  shootDay: ShootDay | null;
  projectId: string;
  projects: { id: string; title: string }[];
  shootDays: ShootDay[];
  onSave: (form: Partial<DPRReport> & { id?: string }) => void;
  onSubmit: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const initialShootDay = shootDay ?? (dpr ? shootDays.find((d) => d.id === dpr.shootDayId) ?? null : null);
  const [form, setForm] = useState<Partial<DPRReport>>(dpr ?? {
    projectId,
    shootDayId: initialShootDay?.id ?? "",
    date: initialShootDay?.date ?? "",
    shootDayNumber: initialShootDay?.shootDayNumber ?? 1,
    location: initialShootDay?.location ?? "",
    callTime: initialShootDay?.callTime ?? "05:30",
    wrapTime: initialShootDay?.wrapTime ?? "20:00",
    actualCallTime: "",
    actualWrapTime: "",
    castPresent: initialShootDay?.castRequired?.length ?? 0,
    crewPresent: 30,
    cateringCount: 45,
    scenesPlanned: initialShootDay?.scenes?.length ?? 0,
    scenesCompleted: 0,
    pagesPlanned: initialShootDay?.totalPages ?? 0,
    pagesCompleted: 0,
    scenes: [],
    issues: "",
    tomorrowLocation: "",
    tomorrowScenes: "",
    status: "draft",
    submittedBy: "",
  });
  const patch = (u: Partial<DPRReport>) => setForm((f) => ({ ...f, ...u }));

  const selectedShootDayObj = shootDays.find((d) => d.id === form.shootDayId) ?? null;

  function handleShootDayChange(sdId: string) {
    const sd = shootDays.find((d) => d.id === sdId);
    if (sd) {
      patch({
        shootDayId: sd.id,
        date: sd.date,
        shootDayNumber: sd.shootDayNumber,
        location: sd.location,
        callTime: sd.callTime,
        wrapTime: sd.wrapTime,
        castPresent: sd.castRequired?.length ?? 0,
        scenesPlanned: sd.scenes?.length ?? 0,
        pagesPlanned: sd.totalPages ?? 0,
      });
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-500" />
            {dpr ? `DPR — Day ${dpr.shootDayNumber}` : "New Daily Production Report"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Shoot day selector (new DPR only) */}
          {!dpr && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Project</Label>
                <Select value={form.projectId ?? projectId} onValueChange={(v) => patch({ projectId: v })}>
                  <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id} className="text-xs">{p.title}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Shoot Day</Label>
                <Select value={form.shootDayId ?? ""} onValueChange={handleShootDayChange}>
                  <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue placeholder="Select shoot day" /></SelectTrigger>
                  <SelectContent>
                    {shootDays.filter((d) => !form.projectId || d.projectId === form.projectId).map((d) => (
                      <SelectItem key={d.id} value={d.id} className="text-xs">Day {d.shootDayNumber} · {d.date}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <Label className="text-xs">Director</Label>
              <Input value={form.director ?? ""} onChange={(e) => patch({ director: e.target.value })} className="mt-1 h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">AD</Label>
              <Input value={form.adName ?? ""} onChange={(e) => patch({ adName: e.target.value })} className="mt-1 h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Call Time</Label>
              <Input type="time" value={form.callTime ?? ""} onChange={(e) => patch({ callTime: e.target.value })} className="mt-1 h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Actual Call</Label>
              <Input type="time" value={form.actualCallTime ?? ""} onChange={(e) => patch({ actualCallTime: e.target.value })} className="mt-1 h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Wrap Time</Label>
              <Input type="time" value={form.wrapTime ?? ""} onChange={(e) => patch({ wrapTime: e.target.value })} className="mt-1 h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Actual Wrap</Label>
              <Input type="time" value={form.actualWrapTime ?? ""} onChange={(e) => patch({ actualWrapTime: e.target.value })} className="mt-1 h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Cast Present</Label>
              <Input type="number" value={form.castPresent ?? 0} onChange={(e) => patch({ castPresent: Number(e.target.value) })} className="mt-1 h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Crew Present</Label>
              <Input type="number" value={form.crewPresent ?? 0} onChange={(e) => patch({ crewPresent: Number(e.target.value) })} className="mt-1 h-8 text-xs" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <Label className="text-xs">Scenes Planned</Label>
              <Input type="number" value={form.scenesPlanned ?? 0} onChange={(e) => patch({ scenesPlanned: Number(e.target.value) })} className="mt-1 h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Scenes Completed</Label>
              <Input type="number" value={form.scenesCompleted ?? 0} onChange={(e) => patch({ scenesCompleted: Number(e.target.value) })} className="mt-1 h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Pages Planned</Label>
              <Input type="number" step="0.25" value={form.pagesPlanned ?? 0} onChange={(e) => patch({ pagesPlanned: Number(e.target.value) })} className="mt-1 h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Pages Completed</Label>
              <Input type="number" step="0.25" value={form.pagesCompleted ?? 0} onChange={(e) => patch({ pagesCompleted: Number(e.target.value) })} className="mt-1 h-8 text-xs" />
            </div>
          </div>

          <div>
            <Label className="text-xs">Issues / Delays</Label>
            <Textarea value={form.issues ?? ""} onChange={(e) => patch({ issues: e.target.value })} rows={2} className="mt-1 text-xs" placeholder="Weather delays, equipment issues, etc." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Tomorrow Location</Label>
              <Input value={form.tomorrowLocation ?? ""} onChange={(e) => patch({ tomorrowLocation: e.target.value })} className="mt-1 h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Tomorrow Scenes</Label>
              <Input value={form.tomorrowScenes ?? ""} onChange={(e) => patch({ tomorrowScenes: e.target.value })} className="mt-1 h-8 text-xs" placeholder="e.g. Sc. 15, 16, 17" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Submitted By</Label>
              <Input value={form.submittedBy ?? ""} onChange={(e) => patch({ submittedBy: e.target.value })} className="mt-1 h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={form.status ?? "draft"} onValueChange={(v) => patch({ status: v as DPRStatus })}>
                <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft" className="text-xs">Draft</SelectItem>
                  <SelectItem value="submitted" className="text-xs">Submitted</SelectItem>
                  <SelectItem value="approved" className="text-xs">Approved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 flex-wrap">
          {dpr && (
            <Button
              variant="destructive"
              size="sm"
              className="mr-auto"
              onClick={() => { if (window.confirm("Delete this DPR?")) onDelete(dpr.id); }}
            >
              Delete
            </Button>
          )}
          {dpr && dpr.status === "draft" && (
            <Button variant="outline" size="sm" onClick={() => onSubmit(dpr.id)}>Submit DPR</Button>
          )}
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={() => onSave({ id: dpr?.id, ...form })}>
            {dpr ? "Save Changes" : "Create DPR"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
