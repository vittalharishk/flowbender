"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { CameraCard, StorageDevice, FootageMetadata } from "@/lib/types";

// --- Camera Card Dialog ---

export interface CardFormState {
  cardId: string;
  capacity: number;
  available: number;
  format: CameraCard["format"];
  shootDate: string;
  status: CameraCard["status"];
  shootCount: number;
  backupStatus: CameraCard["backupStatus"];
  location: string;
  notes: string;
  projectId: string;
}

interface CardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: CameraCard | null;
  form: CardFormState;
  onChange: (form: CardFormState) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function CardDialog({ open, onOpenChange, editing, form, onChange, onSubmit }: CardDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Camera Card" : "Register Camera Card"}</DialogTitle>
          <DialogDescription>Track offload status, capacity, and physical vault storage.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="card-cardId" className="text-xs font-semibold">Card ID *</Label>
              <Input id="card-cardId" required value={form.cardId} onChange={(e) => onChange({ ...form, cardId: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="card-format" className="text-xs font-semibold">Format</Label>
              <Select value={form.format} onValueChange={(val: CameraCard["format"]) => onChange({ ...form, format: val })}>
                <SelectTrigger id="card-format"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="RAW">RAW</SelectItem>
                  <SelectItem value="ProRes">ProRes</SelectItem>
                  <SelectItem value="DNxHR">DNxHR</SelectItem>
                  <SelectItem value="H.264">H.264</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="card-capacity" className="text-xs font-semibold">Capacity (GB)</Label>
              <Input id="card-capacity" type="number" value={form.capacity} onChange={(e) => onChange({ ...form, capacity: Number(e.target.value) })} />
            </div>
            <div>
              <Label htmlFor="card-available" className="text-xs font-semibold">Available (GB)</Label>
              <Input id="card-available" type="number" value={form.available} onChange={(e) => onChange({ ...form, available: Number(e.target.value) })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="card-status" className="text-xs font-semibold">Card Status</Label>
              <Select value={form.status} onValueChange={(val: CameraCard["status"]) => onChange({ ...form, status: val })}>
                <SelectTrigger id="card-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                  <SelectItem value="corrupted">Corrupted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="card-backupStatus" className="text-xs font-semibold">Backup Status</Label>
              <Select value={form.backupStatus} onValueChange={(val: CameraCard["backupStatus"]) => onChange({ ...form, backupStatus: val })}>
                <SelectTrigger id="card-backupStatus"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="card-location" className="text-xs font-semibold">Physical Location</Label>
            <Input id="card-location" value={form.location} onChange={(e) => onChange({ ...form, location: e.target.value })} />
          </div>

          <div>
            <Label htmlFor="card-notes" className="text-xs font-semibold">Notes</Label>
            <Textarea id="card-notes" rows={2} value={form.notes} onChange={(e) => onChange({ ...form, notes: e.target.value })} />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save Card</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- Storage Device Dialog ---

export interface StorageFormState {
  deviceId: string;
  type: StorageDevice["type"];
  capacity: number;
  used: number;
  status: StorageDevice["status"];
  location: string;
  content: string;
  redundancy: boolean;
  temperature: number;
  projectId: string;
}

interface StorageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: StorageDevice | null;
  form: StorageFormState;
  onChange: (form: StorageFormState) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function StorageDialog({ open, onOpenChange, editing, form, onChange, onSubmit }: StorageDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Storage Device" : "Mount Storage Device"}</DialogTitle>
          <DialogDescription>Register high-capacity drives, RAID arrays, or NAS pools.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="stor-deviceId" className="text-xs font-semibold">Device ID *</Label>
              <Input id="stor-deviceId" required value={form.deviceId} onChange={(e) => onChange({ ...form, deviceId: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="stor-type" className="text-xs font-semibold">Drive Type</Label>
              <Select value={form.type} onValueChange={(val: StorageDevice["type"]) => onChange({ ...form, type: val })}>
                <SelectTrigger id="stor-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SSD">SSD</SelectItem>
                  <SelectItem value="HDD">HDD</SelectItem>
                  <SelectItem value="NAS">NAS</SelectItem>
                  <SelectItem value="LTO-Tape">LTO-Tape</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="stor-capacity" className="text-xs font-semibold">Capacity (GB)</Label>
              <Input id="stor-capacity" type="number" value={form.capacity} onChange={(e) => onChange({ ...form, capacity: Number(e.target.value) })} />
            </div>
            <div>
              <Label htmlFor="stor-used" className="text-xs font-semibold">Used (GB)</Label>
              <Input id="stor-used" type="number" value={form.used} onChange={(e) => onChange({ ...form, used: Number(e.target.value) })} />
            </div>
          </div>

          <div>
            <Label htmlFor="stor-location" className="text-xs font-semibold">Location / Suite</Label>
            <Input id="stor-location" value={form.location} onChange={(e) => onChange({ ...form, location: e.target.value })} />
          </div>

          <div>
            <Label htmlFor="stor-content" className="text-xs font-semibold">Content Tags (comma separated)</Label>
            <Input id="stor-content" value={form.content} onChange={(e) => onChange({ ...form, content: e.target.value })} />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save Storage Device</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- Footage Metadata Dialog ---

export interface FootageFormState {
  sceneId: string;
  takeNumber: number;
  duration: number;
  format: string;
  resolution: string;
  fps: number;
  codecs: string;
  storedOn: string;
  status: FootageMetadata["status"];
  notes: string;
  shootDate: string;
  projectId: string;
}

interface FootageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: FootageMetadata | null;
  form: FootageFormState;
  onChange: (form: FootageFormState) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function FootageDialog({ open, onOpenChange, editing, form, onChange, onSubmit }: FootageDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Footage Metadata" : "Log Ingested Footage"}</DialogTitle>
          <DialogDescription>Track scene takes, resolutions, and master storage locations.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="ft-sceneId" className="text-xs font-semibold">Scene ID *</Label>
              <Input id="ft-sceneId" required value={form.sceneId} onChange={(e) => onChange({ ...form, sceneId: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="ft-takeNumber" className="text-xs font-semibold">Take Number</Label>
              <Input id="ft-takeNumber" type="number" value={form.takeNumber} onChange={(e) => onChange({ ...form, takeNumber: Number(e.target.value) })} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="ft-resolution" className="text-xs font-semibold">Resolution</Label>
              <Input id="ft-resolution" value={form.resolution} onChange={(e) => onChange({ ...form, resolution: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="ft-fps" className="text-xs font-semibold">FPS</Label>
              <Input id="ft-fps" type="number" value={form.fps} onChange={(e) => onChange({ ...form, fps: Number(e.target.value) })} />
            </div>
            <div>
              <Label htmlFor="ft-duration" className="text-xs font-semibold">Duration (s)</Label>
              <Input id="ft-duration" type="number" value={form.duration} onChange={(e) => onChange({ ...form, duration: Number(e.target.value) })} />
            </div>
          </div>

          <div>
            <Label htmlFor="ft-storedOn" className="text-xs font-semibold">Storage Units</Label>
            <Input id="ft-storedOn" value={form.storedOn} onChange={(e) => onChange({ ...form, storedOn: e.target.value })} />
          </div>

          <div>
            <Label htmlFor="ft-notes" className="text-xs font-semibold">Notes / Director Feedback</Label>
            <Textarea id="ft-notes" rows={2} value={form.notes} onChange={(e) => onChange({ ...form, notes: e.target.value })} />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save Take</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
