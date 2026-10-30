"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createShootDay } from "@/lib/schedule-store";
import { useProjects } from "@/lib/project-store";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projectId?: string;
  projectTitle?: string;
  onCreated: () => void;
}

interface FormErrors { [k: string]: string; }

export function AddShootDayDialog({ open, onOpenChange, projectId, projectTitle, onCreated }: Props) {
  const projects = useProjects();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [selectedProjectId, setSelectedProjectId] = useState(projectId ?? "");
  const [date, setDate] = useState("");
  const [shootDayNumber, setShootDayNumber] = useState("");
  const [callTime, setCallTime] = useState("06:00");
  const [wrapTime, setWrapTime] = useState("18:00");
  const [location, setLocation] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [notes, setNotes] = useState("");

  function reset() {
    setSelectedProjectId(projectId ?? ""); setDate(""); setShootDayNumber("");
    setCallTime("06:00"); setWrapTime("18:00"); setLocation(""); setLocationAddress("");
    setNotes(""); setErrors({});
  }

  function validate(): boolean {
    const e: FormErrors = {};
    if (!projects.some((project) => project.id === (projectId ?? selectedProjectId))) e.project = "Select an existing project";
    if (!date) e.date = "Required";
    if (!location.trim()) e.location = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const proj = projects.find((p) => p.id === selectedProjectId);
    try {
      createShootDay({
        projectId: projectId ?? selectedProjectId,
        projectTitle: proj?.title ?? projectTitle ?? "",
        date,
        shootDayNumber: Number(shootDayNumber) || 0,
        totalShootDays: proj?.totalShootDays ?? 0,
        callTime, wrapTime,
        location: location.trim(),
        locationAddress: locationAddress.trim() || undefined,
        notes: notes.trim(),
      });
      reset(); onOpenChange(false); onCreated();
    } finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Add Shoot Day</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Project *</Label>
              {projectId ? (
                <Input value={projectTitle ?? ""} disabled className="mt-1" />
              ) : (
                <>
                  <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select project" /></SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.project && <p className="text-xs text-red-400 mt-1">{errors.project}</p>}
                </>
              )}
            </div>
            <div>
              <Label>Date *</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
              {errors.date && <p className="text-xs text-red-400 mt-1">{errors.date}</p>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Shoot Day #</Label>
              <Input type="number" min={0} value={shootDayNumber} onChange={(e) => setShootDayNumber(e.target.value)} placeholder="35" className="mt-1" />
            </div>
            <div>
              <Label>Call Time</Label>
              <Input type="time" required value={callTime} onChange={(e) => setCallTime(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Wrap Time</Label>
              <Input type="time" required value={wrapTime} onChange={(e) => setWrapTime(e.target.value)} className="mt-1" />
            </div>
          </div>
          <div>
            <Label>Location *</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Stage 4 — Spacecraft Interior" className="mt-1" />
            {errors.location && <p className="text-xs text-red-400 mt-1">{errors.location}</p>}
          </div>
          <div>
            <Label>Location Address</Label>
            <Input value={locationAddress} onChange={(e) => setLocationAddress(e.target.value)} placeholder="1200 Studio Drive, Burbank" className="mt-1" />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Special considerations, weather contingencies..." className="mt-1 min-h-[60px]" />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button type="button" variant="outline" onClick={() => { reset(); onOpenChange(false); }}>Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white">
              {saving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              {saving ? "Adding..." : "Add Shoot Day"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
