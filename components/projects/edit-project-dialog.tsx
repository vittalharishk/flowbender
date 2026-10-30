"use client";

import { useState } from "react";
import type { Project } from "@/lib/types";
import { updateProject } from "@/lib/project-store";
import { projectTypeLabels, productionStatusLabels } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ImageUpload } from "@/components/images/image-upload";

export function EditProjectDialog({ project, onClose }: { project: Project; onClose: () => void }) {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [posterImage, setPosterImage] = useState(project.posterImage ?? null);
  const [thumbnailImage, setThumbnailImage] = useState(project.thumbnailImage ?? null);
  const [bannerImage, setBannerImage] = useState(project.bannerImage ?? null);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const data = new FormData(event.currentTarget);
    const text = (key: string) => String(data.get(key) ?? "").trim();
    const totalShootDays = Number(text("totalShootDays"));
    const budget = Number(text("budget"));
    if (["title", "language", "genre", "director", "producer"].some((key) => !text(key))) {
      setError("Title, language, genre, director and producer are required.");
      return;
    }
    if (!text("startDate") || !text("endDate") || text("endDate") <= text("startDate")) {
      setError("Expected release must be after the start date.");
      return;
    }
    if (!Number.isSafeInteger(totalShootDays) || totalShootDays < Math.max(1, project.completedShootDays)) {
      setError(`Planned shoot days must be a whole number of at least ${Math.max(1, project.completedShootDays)}.`);
      return;
    }
    if (!Number.isFinite(budget) || budget <= 0) {
      setError("Budget must be a positive amount in INR.");
      return;
    }
    setSaving(true);
    try {
      const description = text("description");
      const updated = updateProject(project.id, {
        title: text("title"), type: text("type") as Project["type"],
        status: text("status") as Project["status"], language: text("language"),
        genre: text("genre"), productionHouse: text("productionHouse"),
        director: text("director"), producer: text("producer"),
        startDate: text("startDate"), endDate: text("endDate"),
        totalShootDays, budget, description,
        logline: description.slice(0, 120) + (description.length > 120 ? "..." : ""),
        shootProgress: Math.round(project.completedShootDays / totalShootDays * 100),
        posterImage, thumbnailImage, bannerImage,
      });
      if (!updated) throw new Error("This project no longer exists.");
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save the project. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !saving) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>Update this workspace&apos;s details. This does not change verified public film records.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-5">
          {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {([
              ["title", "Project Title", project.title],
              ["language", "Language", project.language],
              ["genre", "Genre", project.genre],
              ["productionHouse", "Production House", project.productionHouse],
              ["director", "Director", project.director],
              ["producer", "Producer", project.producer],
            ] as const).map(([name, label, value]) => (
              <div key={name} className="space-y-1.5">
                <Label htmlFor={`project-edit-${name}`}>{label}{name !== "productionHouse" && " *"}</Label>
                <Input id={`project-edit-${name}`} name={name} defaultValue={value} required={name !== "productionHouse"} />
              </div>
            ))}
            <div className="space-y-1.5">
              <Label htmlFor="project-edit-type">Project Type</Label>
              <select id="project-edit-type" name="type" defaultValue={project.type} className="h-10 w-full rounded-md border bg-background px-3">
                {Object.entries(projectTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="project-edit-status">Production Status</Label>
              <select id="project-edit-status" name="status" defaultValue={project.status} className="h-10 w-full rounded-md border bg-background px-3">
                {Object.entries(productionStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="project-edit-start">Start Date *</Label>
              <Input id="project-edit-start" name="startDate" type="date" defaultValue={project.startDate} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="project-edit-end">Expected Release Date *</Label>
              <Input id="project-edit-end" name="endDate" type="date" defaultValue={project.endDate} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="project-edit-days">Planned Shoot Days *</Label>
              <Input id="project-edit-days" name="totalShootDays" type="number" min={Math.max(1, project.completedShootDays)} step={1} defaultValue={project.totalShootDays} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="project-edit-budget">Budget (INR) *</Label>
              <Input id="project-edit-budget" name="budget" type="number" min={0.01} step="0.01" defaultValue={project.budget} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="project-edit-description">Description</Label>
            <Textarea id="project-edit-description" name="description" defaultValue={project.description ?? project.logline} rows={4} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ImageUpload value={posterImage} onChange={setPosterImage} label="Project Poster" aspect="portrait" />
            <ImageUpload value={thumbnailImage} onChange={setThumbnailImage} label="Project Thumbnail" aspect="video" />
            <ImageUpload value={bannerImage} onChange={setBannerImage} label="Project Banner" aspect="video" />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
