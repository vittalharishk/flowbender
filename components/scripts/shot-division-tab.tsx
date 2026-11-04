"use client";

import { useState, useMemo } from "react";
import {
  Camera, Plus, Pencil, Trash2, Video, Sparkles,
  ChevronDown, ChevronRight, Search, Target, X,
} from "lucide-react";
import { addShot, updateShot, removeShot } from "@/lib/script-store";
import type { Script, Shot, ShotType, ShotMovement, ShotStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

// ── Constants ──

const SHOT_TYPES: ShotType[] = [
  "wide", "medium", "medium-close", "close-up", "extreme-close",
  "over-shoulder", "pov", "insert", "establishing", "aerial", "two-shot", "group",
];

const SHOT_TYPE_LABELS: Record<ShotType, string> = {
  wide: "WS", medium: "MS", "medium-close": "MCU", "close-up": "CU",
  "extreme-close": "ECU", "over-shoulder": "OTS", pov: "POV", insert: "INSERT",
  establishing: "EST", aerial: "AERIAL", "two-shot": "2S", group: "GROUP",
};

const MOVEMENTS: ShotMovement[] = [
  "static", "pan", "tilt", "dolly", "track", "steadicam",
  "handheld", "crane", "drone", "zoom", "whip-pan", "arc",
];

const STATUSES: ShotStatus[] = ["planned", "storyboarded", "approved", "shot", "pickup"];

const STATUS_COLORS: Record<ShotStatus, string> = {
  planned: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  storyboarded: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  approved: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  shot: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  pickup: "bg-red-500/10 text-red-400 border-red-500/20",
};

const ANGLES = ["eye-level", "low", "high", "dutch", "bird's-eye", "worm's-eye"];

interface Props {
  scriptId: string;
  script: Script;
}

type FormShot = {
  sceneId: string;
  shotNumber: string;
  type: ShotType;
  movement: ShotMovement;
  lens: string;
  angle: string;
  description: string;
  duration: string;
  characters: string;
  equipment: string;
  vfx: boolean;
  vfxNotes: string;
  status: ShotStatus;
  notes: string;
  imageUrl: string;
};

const emptyForm = (sceneId: string): FormShot => ({
  sceneId, shotNumber: "", type: "wide", movement: "static", lens: "",
  angle: "eye-level", description: "", duration: "", characters: "",
  equipment: "", vfx: false, vfxNotes: "", status: "planned", notes: "", imageUrl: "",
});

// Shows the shot's reference image, or a placeholder if there is none or it fails to load
function ShotThumb({ src, className }: { src?: string; className: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`${className} flex items-center justify-center rounded-md border bg-muted text-muted-foreground`}>
        <Camera className="w-4 h-4" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Shot reference"
      loading="lazy"
      onError={() => setFailed(true)}
      className={`${className} object-cover rounded-md border`}
    />
  );
}

function suggestNextShotNumber(shots: Shot[], sceneId: string): string {
  const sceneShots = shots.filter((s) => s.sceneId === sceneId);
  if (sceneShots.length === 0) return "1A";
  const last = sceneShots[sceneShots.length - 1].shotNumber;
  const match = last.match(/^(\d+)([A-Z]?)$/i);
  if (!match) return `${sceneShots.length + 1}A`;
  const num = match[1];
  const letter = match[2] || "@";
  const next = String.fromCharCode(letter.toUpperCase().charCodeAt(0) + 1);
  return next > "Z" ? `${Number(num) + 1}A` : `${num}${next}`;
}

export function ShotDivisionTab({ scriptId, script }: Props) {
  const shots = script.shots ?? [];
  const scenes = script.scenes;

  const [search, setSearch] = useState("");
  const [sceneFilter, setSceneFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [vfxFilter, setVfxFilter] = useState("all");
  const [expandedScenes, setExpandedScenes] = useState<Set<string>>(new Set(scenes.map((s) => s.id)));
  const [expandedShot, setExpandedShot] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingShotId, setEditingShotId] = useState<string | null>(null);
  const [form, setForm] = useState<FormShot>(emptyForm(""));

  // ── KPIs ──
  const kpis = useMemo(() => {
    const byStatus: Record<ShotStatus, number> = { planned: 0, storyboarded: 0, approved: 0, shot: 0, pickup: 0 };
    let vfxCount = 0;
    shots.forEach((s) => { byStatus[s.status]++; if (s.vfx) vfxCount++; });
    return { total: shots.length, byStatus, vfxCount };
  }, [shots]);

  // ── Filtered shots ──
  const filteredShots = useMemo(() => {
    let result = shots;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((s) => {
        const scene = scenes.find((sc) => sc.id === s.sceneId);
        return s.shotNumber.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          (scene?.heading.toLowerCase().includes(q) ?? false);
      });
    }
    if (sceneFilter !== "all") result = result.filter((s) => s.sceneId === sceneFilter);
    if (typeFilter !== "all") result = result.filter((s) => s.type === typeFilter);
    if (statusFilter !== "all") result = result.filter((s) => s.status === statusFilter);
    if (vfxFilter !== "all") result = result.filter((s) => vfxFilter === "yes" ? s.vfx : !s.vfx);
    return result;
  }, [shots, scenes, search, sceneFilter, typeFilter, statusFilter, vfxFilter]);

  const filteredShotsByScene = useMemo(() => {
    const map = new Map<string, Shot[]>();
    filteredShots.forEach((s) => {
      const list = map.get(s.sceneId) ?? [];
      list.push(s);
      map.set(s.sceneId, list);
    });
    return map;
  }, [filteredShots]);

  const visibleScenes = useMemo(() => {
    if (sceneFilter !== "all") return scenes.filter((s) => s.id === sceneFilter);
    if (search.trim() || typeFilter !== "all" || statusFilter !== "all" || vfxFilter !== "all") {
      return scenes.filter((s) => filteredShotsByScene.has(s.id));
    }
    return scenes;
  }, [scenes, sceneFilter, search, typeFilter, statusFilter, vfxFilter, filteredShotsByScene]);

  function toggleScene(id: string) {
    setExpandedScenes((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function openAddDialog(sceneId: string) {
    const f = emptyForm(sceneId);
    f.shotNumber = suggestNextShotNumber(shots, sceneId);
    setForm(f);
    setEditingShotId(null);
    setDialogOpen(true);
  }

  function openEditDialog(shot: Shot) {
    setForm({
      sceneId: shot.sceneId,
      shotNumber: shot.shotNumber,
      type: shot.type,
      movement: shot.movement,
      lens: shot.lens,
      angle: shot.angle,
      description: shot.description,
      duration: shot.duration,
      characters: shot.characters.join(", "),
      equipment: shot.equipment.join(", "),
      vfx: shot.vfx,
      vfxNotes: shot.vfxNotes,
      status: shot.status,
      notes: shot.notes,
      imageUrl: shot.imageUrl ?? "",
    });
    setEditingShotId(shot.id);
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.shotNumber.trim() || !form.description.trim()) return;
    const payload = {
      sceneId: form.sceneId,
      shotNumber: form.shotNumber.trim(),
      type: form.type,
      movement: form.movement,
      lens: form.lens.trim(),
      angle: form.angle,
      description: form.description.trim(),
      duration: form.duration.trim(),
      characters: form.characters.split(",").map((c) => c.trim()).filter(Boolean),
      equipment: form.equipment.split(",").map((e) => e.trim()).filter(Boolean),
      vfx: form.vfx,
      vfxNotes: form.vfxNotes.trim(),
      status: form.status,
      notes: form.notes.trim(),
      imageUrl: form.imageUrl.trim() || undefined,
    };
    if (editingShotId) {
      updateShot(scriptId, editingShotId, payload);
    } else {
      addShot(scriptId, form.sceneId, payload as Omit<Shot, "id">);
    }
    setDialogOpen(false);
  }

  function handleDelete(shotId: string) {
    if (window.confirm("Delete this shot?")) {
      removeShot(scriptId, shotId);
      if (expandedShot === shotId) setExpandedShot(null);
    }
  }

  const setField = <K extends keyof FormShot>(key: K, value: FormShot[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <section className="space-y-5">
      {/* KPI Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="rounded-xl border bg-card p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Shots</p>
          <p className="text-2xl font-bold">{kpis.total}</p>
        </div>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
            className={`rounded-xl border p-3 text-center transition-all ${
              statusFilter === s ? "border-amber-500/50 bg-amber-500/5" : "bg-card hover:border-muted-foreground/30"
            }`}
          >
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground capitalize">{s}</p>
            <p className="text-xl font-bold">{kpis.byStatus[s]}</p>
          </button>
        ))}
        <div className="rounded-xl border bg-card p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-violet-400">VFX Shots</p>
          <p className="text-2xl font-bold text-violet-400">{kpis.vfxCount}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search shots, descriptions, scenes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted/40"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={sceneFilter} onValueChange={setSceneFilter}>
            <SelectTrigger className="w-[180px] h-9 text-xs"><SelectValue placeholder="Scene" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Scenes</SelectItem>
              {scenes.map((s) => (
                <SelectItem key={s.id} value={s.id}>Sc. {s.number} — {s.heading.slice(0, 30)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[130px] h-9 text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {SHOT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{SHOT_TYPE_LABELS[t]} — {t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={vfxFilter} onValueChange={setVfxFilter}>
            <SelectTrigger className="w-[110px] h-9 text-xs"><SelectValue placeholder="VFX" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="yes">VFX</SelectItem>
              <SelectItem value="no">No VFX</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Scene Accordions */}
      {visibleScenes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Camera className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            {scenes.length === 0 ? "Add scenes to the script first, then plan shots." : "No shots match your filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {visibleScenes.map((scene) => {
            const sceneShots = filteredShotsByScene.get(scene.id) ?? [];
            const allSceneShots = shots.filter((s) => s.sceneId === scene.id);
            const isExpanded = expandedScenes.has(scene.id);

            return (
              <div key={scene.id} className="rounded-xl border bg-card overflow-hidden">
                {/* Scene Header */}
                <button
                  onClick={() => toggleScene(scene.id)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                  <span className="font-mono font-bold text-amber-500 text-sm shrink-0">Sc. {scene.number}</span>
                  <span className="font-semibold text-sm uppercase truncate flex-1">
                    {scene.intExt}. {scene.heading} — {scene.timeOfDay}
                  </span>
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    {allSceneShots.length} shot{allSceneShots.length !== 1 ? "s" : ""}
                  </Badge>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t px-4 pb-4 space-y-3">
                    <div className="flex items-center justify-between pt-3">
                      <p className="text-xs text-muted-foreground">
                        {scene.location} · {scene.pages} pages
                      </p>
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => openAddDialog(scene.id)}>
                        <Plus className="w-3.5 h-3.5" /> Add Shot
                      </Button>
                    </div>

                    {sceneShots.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        No shots planned for this scene yet.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {sceneShots.map((shot) => {
                          const isDetail = expandedShot === shot.id;
                          return (
                            <div key={shot.id} className="rounded-lg border bg-background/60">
                              {/* Shot Summary Row */}
                              <div
                                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/20 transition-colors"
                                onClick={() => setExpandedShot(isDetail ? null : shot.id)}
                              >
                                <ShotThumb key={shot.imageUrl ?? "none"} src={shot.imageUrl} className="w-14 h-9 shrink-0" />
                                <span className="font-mono font-bold text-xs text-primary w-10 shrink-0">{shot.shotNumber}</span>
                                <Badge variant="outline" className="text-[10px] font-mono shrink-0">{SHOT_TYPE_LABELS[shot.type]}</Badge>
                                <span className="text-xs text-muted-foreground capitalize shrink-0">{shot.movement}</span>
                                {shot.lens && <span className="text-xs text-muted-foreground shrink-0">{shot.lens}</span>}
                                <span className="text-xs truncate flex-1 min-w-0">{shot.description}</span>
                                {shot.vfx && <Sparkles className="w-3.5 h-3.5 text-violet-400 shrink-0" />}
                                <Badge variant="secondary" className={`text-[10px] border shrink-0 ${STATUS_COLORS[shot.status]}`}>
                                  {shot.status}
                                </Badge>
                                <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditDialog(shot)}>
                                    <Pencil className="w-3 h-3" />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(shot.id)}>
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>

                              {/* Shot Detail (Expanded) */}
                              {isDetail && (
                                <div className="border-t p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-xs">
                                  {shot.imageUrl && (
                                    <div className="sm:col-span-2 lg:col-span-3">
                                      <ShotThumb key={shot.imageUrl} src={shot.imageUrl} className="w-full h-56" />
                                    </div>
                                  )}
                                  <DetailField label="Shot Number" value={shot.shotNumber} />
                                  <DetailField label="Type" value={`${SHOT_TYPE_LABELS[shot.type]} (${shot.type})`} />
                                  <DetailField label="Movement" value={shot.movement} />
                                  <DetailField label="Lens" value={shot.lens || "—"} />
                                  <DetailField label="Angle" value={shot.angle || "—"} />
                                  <DetailField label="Duration" value={shot.duration || "—"} />
                                  <DetailField label="Status" value={shot.status} />
                                  <div className="sm:col-span-2 lg:col-span-3">
                                    <DetailField label="Description" value={shot.description} />
                                  </div>
                                  {shot.characters.length > 0 && (
                                    <div className="sm:col-span-2 lg:col-span-3">
                                      <p className="text-[10px] uppercase text-muted-foreground mb-1">Characters</p>
                                      <div className="flex flex-wrap gap-1">
                                        {shot.characters.map((c) => (
                                          <span key={c} className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px]">{c}</span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {shot.equipment.length > 0 && (
                                    <div className="sm:col-span-2 lg:col-span-3">
                                      <p className="text-[10px] uppercase text-muted-foreground mb-1">Equipment</p>
                                      <div className="flex flex-wrap gap-1">
                                        {shot.equipment.map((e) => (
                                          <span key={e} className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px]">{e}</span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {shot.vfx && (
                                    <div className="sm:col-span-2 lg:col-span-3">
                                      <div className="flex items-start gap-2 p-2.5 rounded-lg bg-violet-500/5 border border-violet-500/20">
                                        <Sparkles className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                                        <p className="text-muted-foreground">{shot.vfxNotes || "VFX required — details TBC"}</p>
                                      </div>
                                    </div>
                                  )}
                                  {shot.notes && (
                                    <div className="sm:col-span-2 lg:col-span-3">
                                      <DetailField label="Notes" value={shot.notes} />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center pt-2">
        Showing {filteredShots.length} of {shots.length} shot{shots.length !== 1 ? "s" : ""} across {visibleScenes.length} scene{visibleScenes.length !== 1 ? "s" : ""}
      </p>

      {/* Add / Edit Shot Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-amber-500" />
              {editingShotId ? "Edit Shot" : "Add Shot"}
            </DialogTitle>
            <DialogDescription>
              {editingShotId ? "Update shot details." : "Add a new camera shot to this scene."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Scene</Label>
              <Select value={form.sceneId} onValueChange={(v) => setField("sceneId", v)}>
                <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {scenes.map((s) => (
                    <SelectItem key={s.id} value={s.id}>Sc. {s.number} — {s.heading}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Shot Number *</Label>
              <Input value={form.shotNumber} onChange={(e) => setField("shotNumber", e.target.value)} placeholder="1A" />
            </div>
            <div>
              <Label>Duration</Label>
              <Input value={form.duration} onChange={(e) => setField("duration", e.target.value)} placeholder="8s" />
            </div>

            <div>
              <Label>Shot Type</Label>
              <Select value={form.type} onValueChange={(v) => setField("type", v as ShotType)}>
                <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SHOT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{SHOT_TYPE_LABELS[t]} — {t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Camera Movement</Label>
              <Select value={form.movement} onValueChange={(v) => setField("movement", v as ShotMovement)}>
                <SelectTrigger className="text-xs capitalize"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MOVEMENTS.map((m) => (
                    <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Lens</Label>
              <Input value={form.lens} onChange={(e) => setField("lens", e.target.value)} placeholder="50mm" />
            </div>
            <div>
              <Label>Camera Angle</Label>
              <Select value={form.angle} onValueChange={(v) => setField("angle", v)}>
                <SelectTrigger className="text-xs capitalize"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ANGLES.map((a) => (
                    <SelectItem key={a} value={a} className="capitalize">{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setField("status", v as ShotStatus)}>
                <SelectTrigger className="text-xs capitalize"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2">
              <Label>Reference Image URL</Label>
              <div className="flex items-center gap-3">
                <ShotThumb key={form.imageUrl} src={form.imageUrl.trim() || undefined} className="w-24 h-14 shrink-0" />
                <Input value={form.imageUrl} onChange={(e) => setField("imageUrl", e.target.value)} placeholder="https://..." className="text-xs" />
              </div>
            </div>

            <div className="sm:col-span-2">
              <Label>Description *</Label>
              <Textarea value={form.description} onChange={(e) => setField("description", e.target.value)} placeholder="Describe what happens in this shot..." rows={2} className="text-xs" />
            </div>
            <div>
              <Label>Characters (comma-separated)</Label>
              <Input value={form.characters} onChange={(e) => setField("characters", e.target.value)} placeholder="Pushpa, Srivalli" className="text-xs" />
            </div>
            <div>
              <Label>Equipment (comma-separated)</Label>
              <Input value={form.equipment} onChange={(e) => setField("equipment", e.target.value)} placeholder="Jib arm, steadicam" className="text-xs" />
            </div>

            <div className="sm:col-span-2 flex items-center gap-3">
              <Checkbox
                id="shot-vfx"
                checked={form.vfx}
                onCheckedChange={(v) => setField("vfx", v === true)}
              />
              <Label htmlFor="shot-vfx" className="cursor-pointer flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" /> VFX Required
              </Label>
            </div>
            {form.vfx && (
              <div className="sm:col-span-2">
                <Label>VFX Notes</Label>
                <Textarea value={form.vfxNotes} onChange={(e) => setField("vfxNotes", e.target.value)} placeholder="Describe VFX requirements..." rows={2} className="text-xs" />
              </div>
            )}

            <div className="sm:col-span-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setField("notes", e.target.value)} placeholder="Additional notes..." rows={2} className="text-xs" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.shotNumber.trim() || !form.description.trim()}>
              {editingShotId ? "Save Changes" : "Add Shot"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase text-muted-foreground mb-0.5">{label}</p>
      <p className="text-foreground">{value}</p>
    </div>
  );
}
