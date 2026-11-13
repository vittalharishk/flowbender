"use client";

import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { BackupStrategyConfig } from "./backup-strategy-tab";

interface BackupStrategyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: BackupStrategyConfig;
  onChange: (form: BackupStrategyConfig) => void;
  onSubmit: (event: React.FormEvent) => void;
}

export function BackupStrategyDialog({ open, onOpenChange, form, onChange, onSubmit }: BackupStrategyDialogProps) {
  const set = <K extends keyof BackupStrategyConfig>(key: K, value: BackupStrategyConfig[K]) =>
    onChange({ ...form, [key]: value });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" aria-hidden="true" />
            Edit Production Backup Strategy &amp; Policies
          </DialogTitle>
          <DialogDescription>
            Configure media redundancy tiers, checksum hash algorithms, sync frequencies, and physical vault locations.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-3.5 pt-2">
          <div>
            <Label htmlFor="bs-standard">Standard policy title *</Label>
            <Input
              id="bs-standard"
              required
              value={form.standardName}
              onChange={(e) => set("standardName", e.target.value)}
              className="mt-1 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="bs-rule">Backup rule standard</Label>
              <Select
                value={form.ruleCode}
                onValueChange={(val) =>
                  onChange({
                    ...form,
                    ruleCode: val,
                    standardName:
                      val === "3-2-1"
                        ? "Active 3-2-1 Production Backup Standard"
                        : val === "3-2-2"
                          ? "Enhanced 3-2-2 Extended Archival Standard"
                          : "Custom Production Backup Policy",
                  })
                }
              >
                <SelectTrigger id="bs-rule" className="mt-1 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3-2-1">3-2-1 Standard (3 Copies, 2 Media, 1 Offsite)</SelectItem>
                  <SelectItem value="3-2-2">3-2-2 Extended (3 Copies, 2 Media, 2 Offsites)</SelectItem>
                  <SelectItem value="custom">Custom Studio Rule</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="bs-hash">Checksum hash algorithm</Label>
              <Select value={form.hashAlgorithm} onValueChange={(val) => set("hashAlgorithm", val)}>
                <SelectTrigger id="bs-hash" className="mt-1 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="xxHash64 & MD5">xxHash64 &amp; MD5 (Industry Standard)</SelectItem>
                  <SelectItem value="SHA-256">SHA-256 (High Security Enterprise)</SelectItem>
                  <SelectItem value="xxHash64">xxHash64 (Ultra Fast Ingest)</SelectItem>
                  <SelectItem value="Blake3">Blake3 (Multi-Threaded)</SelectItem>
                  <SelectItem value="MD5">MD5 Only (Legacy Delivery)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="bs-t1">Tier 1: on-set ingest target</Label>
            <Input
              id="bs-t1"
              value={form.primaryTarget}
              onChange={(e) => set("primaryTarget", e.target.value)}
              placeholder="e.g. SanDisk PRO-BLADE 8TB NVMe RAID-0"
              className="mt-1 text-xs"
            />
          </div>

          <div>
            <Label htmlFor="bs-t2">Tier 2: nearline NAS mirror</Label>
            <Input
              id="bs-t2"
              value={form.secondaryTarget}
              onChange={(e) => set("secondaryTarget", e.target.value)}
              placeholder="e.g. QNAP 16-Bay Thunderbolt NAS"
              className="mt-1 text-xs"
            />
          </div>

          <div>
            <Label htmlFor="bs-t3">Tier 3: off-site archive target</Label>
            <Input
              id="bs-t3"
              value={form.tertiaryTarget}
              onChange={(e) => set("tertiaryTarget", e.target.value)}
              placeholder="e.g. Quantum LTO-9 Linear Tape & AWS Glacier"
              className="mt-1 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="bs-nas">Nearline sync frequency</Label>
              <Select value={form.nasSyncFrequency} onValueChange={(val) => set("nasSyncFrequency", val)}>
                <SelectTrigger id="bs-nas" className="mt-1 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hourly Real-Time">Hourly Real-Time</SelectItem>
                  <SelectItem value="Continuous Real-Time">Continuous Real-Time</SelectItem>
                  <SelectItem value="Wrap-of-Day Batch">Wrap-of-Day Batch</SelectItem>
                  <SelectItem value="Every 4 Hours">Every 4 Hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="bs-lto">Cold archive schedule</Label>
              <Select value={form.ltoSyncFrequency} onValueChange={(val) => set("ltoSyncFrequency", val)}>
                <SelectTrigger id="bs-lto" className="mt-1 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Nightly Differential">Nightly Differential</SelectItem>
                  <SelectItem value="Weekly Wrap">Weekly Wrap</SelectItem>
                  <SelectItem value="End of Shooting Block">End of Shooting Block</SelectItem>
                  <SelectItem value="Continuous Replication">Continuous Replication</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="bs-vault">Physical vault location</Label>
              <Input
                id="bs-vault"
                value={form.vaultLocation}
                onChange={(e) => set("vaultLocation", e.target.value)}
                placeholder="e.g. Hyderabad Studio Main Safe & Mumbai Cloud Tier"
                className="mt-1 text-xs"
              />
            </div>

            <div>
              <Label htmlFor="bs-retention">Retention period</Label>
              <Input
                id="bs-retention"
                value={form.retentionPeriod}
                onChange={(e) => set("retentionPeriod", e.target.value)}
                placeholder="e.g. 3 Years / Post-Production Master Wrap"
                className="mt-1 text-xs"
              />
            </div>
          </div>

          <div className="space-y-2 border-t pt-1">
            <label className="flex cursor-pointer items-center gap-2 text-xs">
              <Checkbox
                checked={form.autoMhlGeneration}
                onCheckedChange={(checked) => set("autoMhlGeneration", checked === true)}
              />
              <span>Automated MHL (Media Hash List) manifest generation on offload</span>
            </label>

            <label className="flex cursor-pointer items-center gap-2 text-xs">
              <Checkbox
                checked={form.bitRotDetection}
                onCheckedChange={(checked) => set("bitRotDetection", checked === true)}
              />
              <span>Background parity checks and bit-rot detection sweeps</span>
            </label>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save &amp; Apply Strategy
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
