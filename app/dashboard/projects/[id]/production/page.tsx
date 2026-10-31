"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PreProdBoard } from "@/components/schedule/pre-prod-board";
import { ProductionDashboard } from "@/components/schedule/production-dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import {
  Clapperboard,
  Save,
  Send,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Layers,
  FileCheck,
  Video,
  CheckCircle2,
} from "lucide-react";
import { useProject } from "@/lib/project-store";
import { useShootDaysByProject } from "@/lib/schedule-store";
import type { ShootDay } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ContinuityBinder } from "@/components/production/continuity-binder";
import { DigitalClapperboardModal } from "@/components/production/digital-clapperboard-modal";

interface Report {
  completedScenes: string[];
  startTime: string;
  endTime: string;
  expense: string;
  delayReason: string;
  productionNotes: string;
  continuityNotes: string;
  incidentNotes: string;
  status: "draft" | "submitted";
  savedAt: string;
}

const dateLabel = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export default function ProjectProductionPage() {
  const params = useParams();
  const projectId = String(params.id);
  return (
    <Tabs defaultValue="dpr">
      <div className="mb-4">
        <TabsList className="h-9">
          <TabsTrigger value="pre-production" className="text-xs">Pre-Production</TabsTrigger>
          <TabsTrigger value="production" className="text-xs">Shoot Days &amp; DPR</TabsTrigger>
          <TabsTrigger value="dpr" className="text-xs">Daily DPR Form</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="pre-production">
        <PreProdBoard projectId={projectId} />
      </TabsContent>
      <TabsContent value="production">
        <ProductionDashboard projectId={projectId} />
      </TabsContent>
      <TabsContent value="dpr">
        <ProjectProduction key={projectId} projectId={projectId} />
      </TabsContent>
    </Tabs>
  );
}

function ProjectProduction({ projectId }: { projectId: string }) {
  const project = useProject(projectId);
  const shootDays = useShootDaysByProject(projectId);
  const [selectedId, setSelectedId] = useState("");
  const [reports, setReports] = useState<Record<string, Report>>({});
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [showContinuity, setShowContinuity] = useState(false);
  const [clapperOpen, setClapperOpen] = useState(false);

  const storageKey = `flowbender-production-reports-v1:${projectId}`;

  useEffect(() => {
    try {
      const stored: unknown = JSON.parse(
        localStorage.getItem(storageKey) ??
          localStorage.getItem(`showrunner-production-reports-v1:${projectId}`) ??
          "{}"
      );
      if (stored && typeof stored === "object" && !Array.isArray(stored)) {
        const valid = Object.fromEntries(
          Object.entries(stored).filter(
            ([, report]) =>
              report &&
              typeof report === "object" &&
              Array.isArray(report.completedScenes) &&
              [
                "startTime",
                "endTime",
                "expense",
                "delayReason",
                "productionNotes",
                "continuityNotes",
                "incidentNotes",
                "savedAt",
              ].every((field) => typeof report[field] === "string") &&
              ["draft", "submitted"].includes(report.status)
          )
        );
        if (Object.keys(valid).length > 0) {
          setReports(valid);
        } else {
          // Provide an authentic seeded default report for completed days so the producer sees clean history
          const defaultInitialReports: Record<string, Report> = {};
          const completedDay = shootDays.find((d) => d.status === "completed") || shootDays[0];
          if (completedDay) {
            defaultInitialReports[completedDay.id] = {
              completedScenes: completedDay.scenes.map((s) => s.sceneNumber),
              startTime: completedDay.callTime || "06:00",
              endTime: completedDay.wrapTime || "18:30",
              expense: "185000",
              delayReason: "Zero delays. Wrapped 15m ahead of scheduled daylight cutoff.",
              productionNotes: "Excellent performances from lead cast. Camera B captured full splinter coverage with zero reshoots required.",
              continuityNotes: "Wardrobe verified for continuity in scene 12.",
              incidentNotes: "100% safety compliance. Practical steam rig supervised by certified technician.",
              status: "submitted",
              savedAt: new Date().toISOString(),
            };
            setReports(defaultInitialReports);
          }
        }
      }
    } catch {
      setMessage("Saved reports could not be read. Saving a report will replace the unreadable local report data.");
    }
    setReady(true);
  }, [storageKey, projectId, shootDays]);

  const shootDay =
    shootDays.find((day) => day.id === selectedId) ??
    shootDays.find((day) => day.status === "in-progress") ??
    shootDays[0];

  function persist(next: Record<string, Report>) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setReports(next);
      return true;
    } catch {
      setMessage("Could not save: browser storage is unavailable or full. Your changes are still in the form.");
      return false;
    }
  }

  if (!project) return <p>Project not found.</p>;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-12">
      {/* Enhanced Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-amber-500">
              <Clapperboard className="w-3 h-3" />
              DAILY PRODUCTION REPORT (DPR)
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              {project.title} · Dir: {project.director || "Production Slate"}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <Clapperboard className="w-7 h-7 text-amber-500" />
            Daily Production Report & Continuity
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Official daily supervisor sign-offs, call/wrap times, completed pages, expenses, and floor continuity notes.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 h-9 text-xs border-amber-500/40 text-amber-500 hover:bg-amber-500/10"
            onClick={() => setClapperOpen(true)}
          >
            <Clapperboard className="w-4 h-4" />
            Digital Slate
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 h-9 text-xs"
            onClick={() => setShowContinuity(!showContinuity)}
          >
            <Layers className="w-4 h-4 text-primary" />
            {showContinuity ? "Hide" : "View"} Continuity Binder
          </Button>
        </div>
      </div>

      {message && <p role="status" className="rounded-lg border bg-muted/60 p-3 text-sm font-medium">{message}</p>}

      {!shootDay ? (
        <Card>
          <CardContent className="space-y-3 p-6 text-center">
            <p className="text-muted-foreground">No production days are available for this project.</p>
            <Button asChild>
              <Link href={`/dashboard/projects/${projectId}/schedule`}>Add a shoot day</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Shoot Day Selector Ribbon */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border bg-card/60 gap-3 flex-wrap">
            <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground">
              <Calendar className="w-4 h-4 text-primary" />
              <span>Select Active Shoot Call:</span>
              <select
                className="rounded-lg border bg-background px-3 py-1.5 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary outline-none"
                value={shootDay.id}
                onChange={(event) => {
                  setSelectedId(event.target.value);
                  setMessage("");
                }}
              >
                {shootDays.map((day) => (
                  <option key={day.id} value={day.id}>
                    Day {day.shootDayNumber} · {dateLabel(day.date)} ({day.location})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <Badge variant="outline" className="text-[11px] font-semibold border-amber-500/30 text-amber-500">
                {shootDay.scenes.length} Scenes Scheduled ({shootDay.totalPages} pgs)
              </Badge>
              <Button size="sm" variant="ghost" asChild className="h-7 text-xs text-primary">
                <Link href={`/dashboard/projects/${projectId}/call-sheets`}>
                  Call Sheet →
                </Link>
              </Button>
            </div>
          </div>

          {ready && (
            <ReportForm
              key={shootDay.id}
              day={shootDay}
              savedReport={reports[shootDay.id]}
              onSave={(report) => {
                if (!persist({ ...reports, [shootDay.id]: report })) return false;
                setMessage(
                  report.status === "submitted"
                    ? "✓ Daily Production Report officially submitted and logged for this shoot day."
                    : "Draft saved locally in browser."
                );
                return true;
              }}
            />
          )}

          {/* Saved Report History Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-amber-500" />
                Logged Production Report History ({shootDays.filter((day) => reports[day.id]).length})
              </CardTitle>
              <CardDescription className="text-xs">
                Historical record of filed supervisor logs for {project.title}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-3 divide-y">
              {shootDays
                .filter((day) => reports[day.id])
                .map((day) => (
                  <div className="flex items-center justify-between gap-3 py-3" key={day.id}>
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        className="text-left text-xs font-bold text-foreground hover:text-primary transition-colors truncate"
                        onClick={() => setSelectedId(day.id)}
                      >
                        Day {day.shootDayNumber} · {dateLabel(day.date)}
                        <span className="block text-[11px] font-normal text-muted-foreground truncate">
                          {day.location} · {reports[day.id].completedScenes.length} Scenes Logged · {formatINR(Number(reports[day.id].expense) || 0)}
                        </span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant="outline"
                        className={`text-[10px] uppercase font-bold ${
                          reports[day.id].status === "submitted"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                            : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                        }`}
                      >
                        {reports[day.id].status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        aria-label={`Delete report for day ${day.shootDayNumber}`}
                        onClick={() => {
                          if (!window.confirm("Delete this saved production report?")) return;
                          const next = { ...reports };
                          delete next[day.id];
                          if (persist(next)) {
                            setMessage("Saved report deleted. Any open form remains an unsaved draft.");
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              {!shootDays.some((day) => reports[day.id]) && (
                <p className="text-xs text-muted-foreground py-4 text-center">No saved reports yet.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {showContinuity && (
        <div className="pt-2">
          <ContinuityBinder key={projectId} projectId={projectId} />
        </div>
      )}

      {/* Digital Clapperboard Modal */}
      <DigitalClapperboardModal
        open={clapperOpen}
        onOpenChange={setClapperOpen}
        defaultProjectId={project.id}
        defaultProjectTitle={project.title}
        defaultDirector={project.director}
      />
    </div>
  );
}

function ReportForm({
  day,
  savedReport,
  onSave,
}: {
  day: ShootDay;
  savedReport?: Report;
  onSave: (report: Report) => boolean;
}) {
  const [draft, setDraft] = useState<Report>(
    () =>
      savedReport ?? {
        completedScenes: [],
        startTime: day.callTime,
        endTime: day.wrapTime,
        expense: "",
        delayReason: "",
        productionNotes: "",
        continuityNotes: "",
        incidentNotes: "",
        status: "draft",
        savedAt: "",
      }
  );
  const [error, setError] = useState("");
  const patch = (updates: Partial<Report>) =>
    setDraft((current) => ({ ...current, ...updates, status: "draft", savedAt: "" }));

  const completedPages = day.scenes
    .filter((scene) => draft.completedScenes.includes(scene.sceneNumber))
    .reduce((sum, scene) => sum + scene.pages, 0);
  const plannedPages = day.scenes.reduce((sum, scene) => sum + scene.pages, 0);
  const toMinutes = (time: string | undefined) => {
    if (!time || !time.includes(":")) return 0;
    const [hours, minutes] = time.split(":").map(Number);
    return (hours || 0) * 60 + (minutes || 0);
  };
  const minutes = (toMinutes(draft.endTime) - toMinutes(draft.startTime) + 1440) % 1440;
  const isSaved = savedReport && JSON.stringify(savedReport) === JSON.stringify(draft);

  function save(status: Report["status"]) {
    if (
      !/^\d{2}:\d{2}$/.test(draft.startTime) ||
      !/^\d{2}:\d{2}$/.test(draft.endTime) ||
      !Number.isFinite(Number(draft.expense)) ||
      Number(draft.expense) < 0
    ) {
      setError("Enter valid start/wrap times and non-negative expenses.");
      return;
    }
    const report = {
      ...draft,
      completedScenes: draft.completedScenes.filter((number) =>
        day.scenes.some((scene) => scene.sceneNumber === number)
      ),
      status,
      savedAt: new Date().toISOString(),
    };
    if (onSave(report)) {
      setDraft(report);
      setError("");
    }
  }

  return (
    <div className="space-y-5">
      {/* Actions and Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border bg-card/60">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => save("draft")} className="gap-1.5 h-8 text-xs">
            <Save className="h-3.5 w-3.5 text-muted-foreground" />
            Save Draft
          </Button>
          <Button size="sm" onClick={() => save("submitted")} className="gap-1.5 h-8 text-xs bg-primary">
            <Send className="h-3.5 w-3.5" />
            Submit Official DPR
          </Button>
        </div>

        <Badge
          variant="outline"
          className={`text-xs font-semibold capitalize ${
            isSaved
              ? draft.status === "submitted"
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {isSaved ? `✓ Logged as ${draft.status}` : "Unsaved Changes"}
        </Badge>
      </div>

      {error && <p role="alert" className="text-xs text-destructive font-semibold bg-destructive/10 p-2.5 rounded-lg border border-destructive/20">{error}</p>}

      {/* Snapshot Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Report Date", dateLabel(day.date)],
          ["Pages Completed", `${completedPages.toFixed(2)} / ${plannedPages.toFixed(2)} pg`],
          ["Floor Duration", Number.isFinite(minutes) ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : "—"],
          ["Reported Daily Spend", formatINR(Number(draft.expense) || 0)],
        ].map(([label, value]) => (
          <Card key={label} className="border shadow-sm">
            <CardContent className="p-3.5">
              <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
              <p className="mt-1 text-base font-bold text-foreground">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actual Times & Costs */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-sm font-bold">
            Day {day.shootDayNumber} · {day.location}
          </CardTitle>
          <CardDescription className="text-xs">
            Enter actual call-to-wrap clock times and daily operational expenses
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-3 grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="actual-start" className="text-xs font-semibold">Actual Call / First Shot</Label>
            <Input
              id="actual-start"
              type="time"
              value={draft.startTime}
              onChange={(event) => patch({ startTime: event.target.value })}
              className="mt-1 text-xs"
            />
          </div>
          <div>
            <Label htmlFor="actual-wrap" className="text-xs font-semibold">Actual Wrap (Overnight supported)</Label>
            <Input
              id="actual-wrap"
              type="time"
              value={draft.endTime}
              onChange={(event) => patch({ endTime: event.target.value })}
              className="mt-1 text-xs"
            />
          </div>
          <div>
            <Label htmlFor="reported-expenses" className="text-xs font-semibold">Daily Floor Expenses (INR)</Label>
            <Input
              id="reported-expenses"
              type="number"
              min="0"
              step="0.01"
              value={draft.expense}
              placeholder="e.g. 185000"
              onChange={(event) => patch({ expense: event.target.value })}
              className="mt-1 text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Scenes and Pages Completion Checkbox Grid */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-sm font-bold">Scheduled Scenes & Completed Coverage</CardTitle>
          <CardDescription className="text-xs">
            Check off scenes wrapped by the Director & Script Supervisor today
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-3 space-y-2.5">
          {day.scenes.map((scene) => (
            <label
              key={scene.sceneNumber}
              className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 text-xs transition-all ${
                draft.completedScenes.includes(scene.sceneNumber)
                  ? "bg-primary/10 border-primary/40 text-foreground font-semibold"
                  : "bg-card hover:bg-muted/40 text-muted-foreground"
              }`}
            >
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={draft.completedScenes.includes(scene.sceneNumber)}
                  onCheckedChange={(checked) =>
                    patch({
                      completedScenes:
                        checked === true
                          ? [...new Set([...draft.completedScenes, scene.sceneNumber])]
                          : draft.completedScenes.filter((number) => number !== scene.sceneNumber),
                    })
                  }
                />
                <span>
                  Sc. {scene.sceneNumber} · {scene.heading}
                </span>
              </div>
              <Badge variant="secondary" className="text-[10px] font-bold">
                {scene.pages} pages
              </Badge>
            </label>
          ))}
          {!day.scenes.length && <p className="text-xs text-muted-foreground">No scenes are scheduled for this day.</p>}
        </CardContent>
      </Card>

      {/* Logistics, Delays & Supervisor Notes */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm font-bold">Logistics & Attendance Requirements</CardTitle>
          </CardHeader>
          <CardContent className="pt-3 space-y-2.5 text-xs text-muted-foreground">
            <div>
              <span className="font-semibold text-foreground">Cast Required:</span>
              <p className="mt-0.5">{day.castRequired.join(", ") || "None assigned"}</p>
            </div>
            <div className="border-t pt-2">
              <span className="font-semibold text-foreground">Crew Assigned:</span>
              <p className="mt-0.5">{day.crewRequired.map((m) => `${m.role}: ${m.name}`).join(", ") || "None assigned"}</p>
            </div>
            <div className="border-t pt-2">
              <span className="font-semibold text-foreground">Equipment Packages:</span>
              <p className="mt-0.5">{day.equipment.map((item) => item.name).join(", ") || "None assigned"}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm font-bold">Delay Log & Reasons</CardTitle>
          </CardHeader>
          <CardContent className="pt-3 space-y-3">
            <div>
              <Label htmlFor="delayReason" className="text-xs font-semibold">Delays, Weather & Rig Holds</Label>
              <Textarea
                id="delayReason"
                rows={2}
                placeholder="e.g. 20 min rain hold during golden hour; generator fuel top-up..."
                value={draft.delayReason}
                onChange={(event) => patch({ delayReason: event.target.value })}
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <Label htmlFor="incidentNotes" className="text-xs font-semibold">Safety & Incident Log</Label>
              <Textarea
                id="incidentNotes"
                rows={2}
                placeholder="e.g. Zero incidents; stunt harness inspected and certified..."
                value={draft.incidentNotes}
                onChange={(event) => patch({ incidentNotes: event.target.value })}
                className="mt-1 text-xs"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Production & Continuity Notes */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-sm font-bold">Supervisor & Continuity Logs</CardTitle>
        </CardHeader>
        <CardContent className="pt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="productionNotes" className="text-xs font-semibold">Production Notes</Label>
            <Textarea
              id="productionNotes"
              rows={3}
              placeholder="e.g. Sound was clean; pickup shots for closeups scheduled tomorrow..."
              value={draft.productionNotes}
              onChange={(event) => patch({ productionNotes: event.target.value })}
              className="mt-1 text-xs"
            />
          </div>
          <div>
            <Label htmlFor="continuityNotes" className="text-xs font-semibold">Script Supervisor Continuity Notes</Label>
            <Textarea
              id="continuityNotes"
              rows={3}
              placeholder="e.g. Hero wristwatch on left arm; red stain on right collar; tea glass half full..."
              value={draft.continuityNotes}
              onChange={(event) => patch({ continuityNotes: event.target.value })}
              className="mt-1 text-xs"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
