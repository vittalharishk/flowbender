"use client";

import { useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { IntExt, TimeOfDay } from "@/lib/types";
import { createScene, useScenesByProject } from "@/lib/scene-store";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projectId: string;
  onCreated: () => void;
}

interface FormErrors { [k: string]: string; }

export function AddSceneDialog({ open, onOpenChange, projectId, onCreated }: Props) {
  const existingScenes = useScenesByProject(projectId);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [sceneNumber, setSceneNumber] = useState("");
  const [heading, setHeading] = useState("");
  const [intExt, setIntExt] = useState<IntExt>("INT");
  const [location, setLocation] = useState("");
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("DAY");
  const [characters, setCharacters] = useState<string[]>([]);
  const [charInput, setCharInput] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [pages, setPages] = useState("");
  const [notes, setNotes] = useState("");
  const [vfxRequired, setVfxRequired] = useState(false);
  const [vfxNotes, setVfxNotes] = useState("");

  function reset() {
    setSceneNumber(""); setHeading(""); setIntExt("INT"); setLocation("");
    setTimeOfDay("DAY"); setCharacters([]); setCharInput(""); setSynopsis("");
    setEstimatedDuration(""); setPages(""); setNotes(""); setVfxRequired(false);
    setVfxNotes(""); setErrors({});
  }

  function addChar(c: string) {
    const trimmed = c.trim();
    if (trimmed && !characters.includes(trimmed)) setCharacters([...characters, trimmed]);
    setCharInput("");
  }

  function validate(): boolean {
    const e: FormErrors = {};
    if (!sceneNumber.trim()) e.sceneNumber = "Required";
    else if (existingScenes.some((scene) => scene.sceneNumber.toLowerCase() === sceneNumber.trim().toLowerCase())) e.sceneNumber = "Scene number already exists";
    if (!heading.trim()) e.heading = "Required";
    if (!location.trim()) e.location = "Required";
    if (!Number.isFinite(Number(pages)) || Number(pages) < 0) e.pages = "Pages must be a non-negative number";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      createScene({
        projectId,
        sceneNumber: sceneNumber.trim(),
        heading: heading.trim(),
        intExt, location: location.trim(), timeOfDay, characters: [...new Set([...characters, charInput.trim()].filter(Boolean))],
        synopsis: synopsis.trim(), estimatedDuration: estimatedDuration.trim() || "TBD",
        pages: Number(pages) || 0, notes: notes.trim(),
        vfxRequired, vfxNotes: vfxNotes.trim(),
      });
      setSaving(false);
      reset();
      onOpenChange(false);
      onCreated();
    } finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Add Scene</DialogTitle></DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {/* Scene header */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Scene Header</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <Label>Scene # *</Label>
                <Input value={sceneNumber} onChange={(e) => setSceneNumber(e.target.value)} placeholder="42" className="mt-1" />
                {errors.sceneNumber && <p className="text-xs text-red-400 mt-1">{errors.sceneNumber}</p>}
              </div>
              <div>
                <Label>INT / EXT</Label>
                <Select value={intExt} onValueChange={(v) => setIntExt(v as IntExt)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INT">INT</SelectItem>
                    <SelectItem value="EXT">EXT</SelectItem>
                    <SelectItem value="INT/EXT">INT/EXT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Time of Day</Label>
                <Select value={timeOfDay} onValueChange={(v) => setTimeOfDay(v as TimeOfDay)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAY">Day</SelectItem>
                    <SelectItem value="NIGHT">Night</SelectItem>
                    <SelectItem value="DAWN">Dawn</SelectItem>
                    <SelectItem value="DUSK">Dusk</SelectItem>
                    <SelectItem value="CONTINUOUS">Continuous</SelectItem>
                    <SelectItem value="MAGIC HOUR">Magic Hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Pages</Label>
                <Input type="number" step="0.125" min={0} value={pages} onChange={(e) => setPages(e.target.value)} placeholder="2.5" className="mt-1" />
                {errors.pages && <p className="mt-1 text-xs text-red-400">{errors.pages}</p>}
              </div>
            </div>
            <div>
              <Label>Scene Heading *</Label>
              <Input value={heading} onChange={(e) => setHeading(e.target.value)} placeholder="SPACECRAFT — BRIDGE" className="mt-1" />
              {errors.heading && <p className="text-xs text-red-400 mt-1">{errors.heading}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Location *</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Stage 4 — Spacecraft Interior" className="mt-1" />
                {errors.location && <p className="text-xs text-red-400 mt-1">{errors.location}</p>}
              </div>
              <div>
                <Label>Est. Duration</Label>
                <Input value={estimatedDuration} onChange={(e) => setEstimatedDuration(e.target.value)} placeholder="3 min" className="mt-1" />
              </div>
            </div>
          </div>

          {/* Characters */}
          <div className="space-y-2">
            <Label>Characters</Label>
            <div className="flex flex-wrap gap-1.5">
              {characters.map((c) => (
                <span key={c} className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-md">
                  {c}
                  <button type="button" onClick={() => setCharacters(characters.filter((x) => x !== c))} className="text-muted-foreground hover:text-foreground"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-1">
              <Input value={charInput} onChange={(e) => setCharInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addChar(charInput); } }} placeholder="Type character name and press Enter..." className="h-9 text-xs" />
              <Button type="button" variant="outline" size="sm" className="h-9 px-2" onClick={() => addChar(charInput)}><Plus className="w-3.5 h-3.5" /></Button>
            </div>
          </div>

          {/* Synopsis */}
          <div>
            <Label>Synopsis</Label>
            <Textarea value={synopsis} onChange={(e) => setSynopsis(e.target.value)} placeholder="Brief description of what happens in this scene..." className="mt-1 min-h-[70px]" />
          </div>

          {/* VFX */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Switch checked={vfxRequired} onCheckedChange={setVfxRequired} />
              <Label>VFX Required</Label>
            </div>
            {vfxRequired && (
              <Textarea value={vfxNotes} onChange={(e) => setVfxNotes(e.target.value)} placeholder="Describe VFX requirements..." className="min-h-[60px]" />
            )}
          </div>

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Production notes, special considerations..." className="mt-1 min-h-[60px]" />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button type="button" variant="outline" onClick={() => { reset(); onOpenChange(false); }}>Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white">
              {saving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              {saving ? "Adding..." : "Add Scene"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
