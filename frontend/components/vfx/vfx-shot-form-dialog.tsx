"use client";

import type { VfxShotStatus, Project } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export interface VfxShotFormData {
  shotCode: string;
  sequence: string;
  description: string;
  vendorId: string;
  status: VfxShotStatus;
  priority: "low" | "medium" | "high";
  dueDate: string;
  projectId: string;
}

interface VfxShotFormDialogProps {
  open: boolean;
  mode: "add" | "edit";
  formData: VfxShotFormData;
  projects: Project[];
  showProjectPicker: boolean;
  onChange: (data: VfxShotFormData) => void;
  onSubmit: (event: React.FormEvent) => void;
  onOpenChange: (open: boolean) => void;
  onDelete?: () => void;
}

export function VfxShotFormDialog({
  open,
  mode,
  formData,
  projects,
  showProjectPicker,
  onChange,
  onSubmit,
  onOpenChange,
  onDelete,
}: VfxShotFormDialogProps) {
  const set = <K extends keyof VfxShotFormData>(key: K, value: VfxShotFormData[K]) =>
    onChange({ ...formData, [key]: value });
  const prefix = mode === "add" ? "vfx-add" : "vfx-edit";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Add VFX Shot" : "Edit VFX Shot"}</DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Assign a new visual effects plate to studio vendors and track deliverables."
              : "Update turnaround status, assigned vendor, and plate instructions."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 pt-2">
          {showProjectPicker && (
            <div>
              <Label htmlFor={`${prefix}-project`}>Project</Label>
              <Select value={formData.projectId} onValueChange={(v) => set("projectId", v)}>
                <SelectTrigger id={`${prefix}-project`} className="mt-1">
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor={`${prefix}-code`}>Shot code *</Label>
              <Input
                id={`${prefix}-code`}
                className="mt-1"
                required
                placeholder="e.g. VFX-042"
                value={formData.shotCode}
                onChange={(e) => set("shotCode", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor={`${prefix}-sequence`}>Sequence</Label>
              <Input
                id={`${prefix}-sequence`}
                className="mt-1"
                placeholder="e.g. Climax Battle"
                value={formData.sequence}
                onChange={(e) => set("sequence", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor={`${prefix}-description`}>Description *</Label>
            <Textarea
              id={`${prefix}-description`}
              className="mt-1"
              required
              rows={3}
              placeholder="Describe plate cleanup, 3D asset integration, green screen replacement..."
              value={formData.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <Label htmlFor={`${prefix}-status`}>Status</Label>
              <Select value={formData.status} onValueChange={(v: VfxShotStatus) => set("status", v)}>
                <SelectTrigger id={`${prefix}-status`} className="mt-1">
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
              <Label htmlFor={`${prefix}-priority`}>Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(v) => set("priority", v as "low" | "medium" | "high")}
              >
                <SelectTrigger id={`${prefix}-priority`} className="mt-1">
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
              <Label htmlFor={`${prefix}-due`}>Due date</Label>
              <Input
                id={`${prefix}-due`}
                className="mt-1"
                type="date"
                value={formData.dueDate}
                onChange={(e) => set("dueDate", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor={`${prefix}-vendor`}>Assigned VFX vendor</Label>
            <Input
              id={`${prefix}-vendor`}
              className="mt-1"
              placeholder="e.g. DNEG, Makuta VFX, Red Chillies.vfx"
              value={formData.vendorId}
              onChange={(e) => set("vendorId", e.target.value)}
            />
          </div>

          <DialogFooter className="gap-2 pt-2 sm:justify-between">
            {onDelete ? (
              <Button type="button" variant="destructive" size="sm" onClick={onDelete}>
                Delete shot
              </Button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                {mode === "add" ? "Save VFX shot" : "Save changes"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
