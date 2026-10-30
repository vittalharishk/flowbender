"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft, MapPin, Clock, Users, Film, Sparkles, Package,
  Shirt, Car, AlertTriangle, StickyNote, Pencil, CalendarDays,
  FileText, CheckCircle2, MapPinned, Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Scene, SceneBreakdownItem, SceneStatus } from "@/lib/types";
import { sceneStatusLabels, sceneStatusColors, sceneStatusDot, updateScene, useScenesByProject } from "@/lib/scene-store";
import { useAppDataSelector } from "@/lib/app-data-store";

const intExtColors: Record<string, string> = {
  INT: "bg-sky-500/15 text-sky-400",
  EXT: "bg-amber-500/15 text-amber-400",
  "INT/EXT": "bg-cyan-500/15 text-cyan-400",
};

const todColors: Record<string, string> = {
  DAY: "bg-yellow-500/15 text-yellow-400",
  NIGHT: "bg-indigo-500/15 text-indigo-300",
  DAWN: "bg-orange-500/15 text-orange-400",
  DUSK: "bg-rose-500/15 text-rose-400",
  CONTINUOUS: "bg-zinc-500/15 text-zinc-400",
  "MAGIC HOUR": "bg-pink-500/15 text-pink-400",
};

interface Props {
  scene: Scene;
  backHref: string;
  backLabel: string;
  onUpdate?: () => void;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function SceneDetail({ scene, backHref, backLabel, onUpdate }: Props) {
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const status = scene.status;
  const shootDay = useAppDataSelector((data) => data.shootDays.find((day) => day.projectId === scene.projectId && day.scenes.some((item) => item.sceneNumber === scene.sceneNumber)));
  const projectScenes = useScenesByProject(scene.projectId);
  const relatedScenes = projectScenes
    .filter((item) => item.id !== scene.id && item.location === scene.location)
    .slice(0, 4);
  const relatedLocations = useAppDataSelector((data) =>
    data.locations.filter((location) => location.projectId === scene.projectId).slice(0, 3),
  );

  function handleStatusChange(newStatus: SceneStatus) {
    updateScene(scene.id, { status: newStatus });
    onUpdate?.();
  }

  const totalBreakdown = scene.props.length + scene.costumes.length + scene.vehicles.length + scene.specialRequirements.length;

  return (
    <div className="space-y-6">
      <Link href={backHref} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> {backLabel}
      </Link>
      <div className="flex flex-wrap items-center gap-4 text-sm"><Button variant="outline" onClick={() => setEditing(!editing)}><Pencil className="mr-2 h-4 w-4" />{editing ? "Cancel editing" : "Edit scene"}</Button><Link className="text-primary underline" href={shootDay ? `/dashboard/projects/${scene.projectId}/schedule/${shootDay.id}` : `/dashboard/projects/${scene.projectId}/schedule`}>{shootDay ? `View shoot day ${shootDay.shootDayNumber}` : "Project schedule"}</Link><Link className="text-primary underline" href={`/dashboard/projects/${scene.projectId}/script`}>Project script</Link></div>
      {message && <p role="status" className="text-sm">{message}</p>}
      {editing && <form key={scene.id} className="grid gap-4 rounded-xl border bg-card p-5 sm:grid-cols-2" onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const heading = String(form.get("heading") ?? "").trim();
        const location = String(form.get("location") ?? "").trim();
        const pages = Number(form.get("pages"));
        if (!heading || !location || !Number.isFinite(pages) || pages < 0) { setMessage("Heading, location, and non-negative pages are required."); return; }
        updateScene(scene.id, { heading, location, pages, estimatedDuration: String(form.get("duration") ?? ""), synopsis: String(form.get("synopsis") ?? ""), notes: String(form.get("notes") ?? "") });
        setEditing(false); setMessage("Scene saved. Review existing schedules and call sheets for changes."); onUpdate?.();
      }}>
        <div><Label htmlFor="scene-heading">Heading</Label><Input id="scene-heading" name="heading" required defaultValue={scene.heading} /></div><div><Label htmlFor="scene-location">Location</Label><Input id="scene-location" name="location" required defaultValue={scene.location} /></div>
        <div><Label htmlFor="scene-pages">Pages</Label><Input id="scene-pages" name="pages" type="number" min="0" step="0.125" required defaultValue={scene.pages} /></div><div><Label htmlFor="scene-duration">Estimated duration</Label><Input id="scene-duration" name="duration" defaultValue={scene.estimatedDuration} /></div>
        <div className="sm:col-span-2"><Label htmlFor="scene-synopsis">Synopsis</Label><Textarea id="scene-synopsis" name="synopsis" defaultValue={scene.synopsis} /></div><div className="sm:col-span-2"><Label htmlFor="scene-notes">Notes</Label><Textarea id="scene-notes" name="notes" defaultValue={scene.notes} /></div><Button type="submit">Save scene</Button>
      </form>}

      {/* Hero */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="flex items-stretch">
          <div className={cn("w-2 shrink-0", sceneStatusDot[status])} />
          <div className="p-5 sm:p-6 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-3xl font-bold">Sc. {scene.sceneNumber}</span>
                  <span className={cn("text-xs font-semibold px-2 py-0.5 rounded", intExtColors[scene.intExt])}>
                    {scene.intExt}
                  </span>
                  <span className={cn("text-xs font-semibold px-2 py-0.5 rounded", todColors[scene.timeOfDay])}>
                    {scene.timeOfDay}
                  </span>
                </div>
                <h1 className="text-lg font-semibold">{scene.heading}</h1>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium", sceneStatusColors[status])}>
                    <span className={cn("w-1.5 h-1.5 rounded-full", sceneStatusDot[status])} /> {sceneStatusLabels[status]}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2.5 py-1 text-xs text-muted-foreground">
                    <Tag className="w-3 h-3" /> {scene.characters.length} characters
                  </span>
                  {scene.vfxRequired && <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2.5 py-1 text-xs text-violet-400"><Sparkles className="w-3 h-3" /> VFX</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 self-start">
                <Select value={status} onValueChange={(v) => handleStatusChange(v as SceneStatus)}>
                  <SelectTrigger className="w-[170px] h-9 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className={cn("w-2 h-2 rounded-full shrink-0", sceneStatusDot[status])} />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(sceneStatusLabels) as [SceneStatus, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        <div className="flex items-center gap-1.5">
                          <span className={cn("w-2 h-2 rounded-full", sceneStatusDot[k])} /> {v}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {scene.location}</span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {scene.estimatedDuration}</span>
              <span className="flex items-center gap-1.5"><FileText className="w-4 h-4" /> {scene.pages} pages</span>
              <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {scene.characters.length} characters</span>
              {scene.vfxRequired && <span className="flex items-center gap-1.5 text-violet-400"><Sparkles className="w-4 h-4" /> VFX Required</span>}
              {scene.shootDate && <span className="flex items-center gap-1.5"><CalendarDays className="w-4 h-4" /> Day {scene.shootDay} — {fmtDate(scene.shootDate)}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Synopsis */}
          <Section title="Synopsis">
            <p className="text-sm text-muted-foreground leading-relaxed">{scene.synopsis || "No synopsis provided."}</p>
          </Section>

          {/* Characters */}
          <Section title="Characters">
            {scene.characters.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-3">No characters assigned.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {scene.characters.map((c) => (
                  <span key={c} className="inline-flex items-center gap-1.5 text-sm bg-muted/60 px-3 py-1.5 rounded-lg">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    {c}
                  </span>
                ))}
              </div>
            )}
          </Section>

          {/* Breakdown */}
          <Section title="Scene Breakdown">
            {totalBreakdown === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No breakdown items added yet.</p>
            ) : (
              <div className="space-y-5">
                {scene.props.length > 0 && <BreakdownGroup icon={Package} label="Props" items={scene.props} color="text-blue-400" />}
                {scene.costumes.length > 0 && <BreakdownGroup icon={Shirt} label="Costumes" items={scene.costumes} color="text-pink-400" />}
                {scene.vehicles.length > 0 && <BreakdownGroup icon={Car} label="Vehicles" items={scene.vehicles} color="text-cyan-400" />}
                {scene.specialRequirements.length > 0 && <BreakdownGroup icon={AlertTriangle} label="Special Requirements" items={scene.specialRequirements} color="text-amber-400" />}
              </div>
            )}
          </Section>

          {/* VFX */}
          {scene.vfxRequired && (
            <Section title="VFX Requirements">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-violet-500/5 border border-violet-500/20">
                <Sparkles className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground leading-relaxed">{scene.vfxNotes || "VFX required — details to be confirmed."}</p>
              </div>
            </Section>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Scene Info */}
          <Section title="Scene Info">
            <div className="space-y-3">
              <InfoRow label="Scene Number" value={scene.sceneNumber} />
              <InfoRow label="INT / EXT" value={scene.intExt} />
              <InfoRow label="Time of Day" value={scene.timeOfDay} />
              <InfoRow label="Location" value={scene.location} />
              <InfoRow label="Est. Duration" value={scene.estimatedDuration} />
              <InfoRow label="Pages" value={String(scene.pages)} />
              <InfoRow label="Status" value={sceneStatusLabels[status]} />
              {scene.shootDate && <InfoRow label="Shoot Date" value={fmtDate(scene.shootDate)} />}
              {scene.shootDay && <InfoRow label="Shoot Day" value={`Day ${scene.shootDay}`} />}
            </div>
          </Section>

          {/* Quick counts */}
          <Section title="Breakdown Summary">
            <div className="grid grid-cols-2 gap-2">
              <CountBox label="Props" count={scene.props.length} icon={Package} color="text-blue-400" />
              <CountBox label="Costumes" count={scene.costumes.length} icon={Shirt} color="text-pink-400" />
              <CountBox label="Vehicles" count={scene.vehicles.length} icon={Car} color="text-cyan-400" />
              <CountBox label="Special" count={scene.specialRequirements.length} icon={AlertTriangle} color="text-amber-400" />
            </div>
          </Section>

          {/* Notes */}
          {scene.notes && (
            <Section title="Notes">
              <div className="flex gap-2">
                <StickyNote className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground leading-relaxed">{scene.notes}</p>
              </div>
            </Section>
          )}

          <Section title="Related scenes">
            {relatedScenes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No other scenes are assigned to this location yet.</p>
            ) : (
              <div className="space-y-2">
                {relatedScenes.map((item) => (
                  <Link key={item.id} href={`/dashboard/projects/${scene.projectId}/scenes/${item.id}`} className="flex items-center gap-3 rounded-lg bg-muted/30 p-3 hover:bg-muted/60 transition-colors">
                    <span className="text-xs font-semibold text-amber-400">Sc. {item.sceneNumber}</span>
                    <span className="min-w-0 flex-1 truncate text-sm">{item.heading}</span>
                    <span className="text-xs text-muted-foreground">{item.pages} pg</span>
                  </Link>
                ))}
              </div>
            )}
          </Section>

          <Section title="Related locations">
            {relatedLocations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No locations have been added to this project.</p>
            ) : (
              <div className="space-y-2">
                {relatedLocations.map((location) => (
                  <div key={location.id} className="flex items-start gap-3 rounded-lg bg-muted/30 p-3">
                    <MapPinned className="w-4 h-4 mt-0.5 text-amber-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{location.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{location.city} · {location.status.replace("-", " ")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <h3 className="font-semibold mb-4">{title}</h3>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

function CountBox({ label, count, icon: Icon, color }: { label: string; count: number; icon: typeof Package; color: string }) {
  return (
    <div className="rounded-lg bg-muted/40 p-3 text-center">
      <Icon className={cn("w-4 h-4 mx-auto mb-1", color)} />
      <p className="text-lg font-bold">{count}</p>
      <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
    </div>
  );
}

function BreakdownGroup({ icon: Icon, label, items, color }: { icon: typeof Package; label: string; items: SceneBreakdownItem[]; color: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn("w-4 h-4", color)} />
        <h4 className="text-sm font-medium">{label}</h4>
        <span className="text-xs text-muted-foreground">({items.length})</span>
      </div>
      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/30 text-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="min-w-0">
              <span className="font-medium">{item.name}</span>
              {item.notes && <p className="text-xs text-muted-foreground mt-0.5">{item.notes}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
