"use client";

import { Edit2, HardDrive, Plus, Trash2 } from "lucide-react";
import type { StorageDevice } from "@/lib/types";
import { StatusBadge } from "@/components/app/status-badge";
import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";
import { formatMediaStatus, mediaStatusTone } from "./media-status";

interface StorageDevicesTabProps {
  storageDevices: StorageDevice[];
  onEdit: (device: StorageDevice) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

export function StorageDevicesTab({ storageDevices, onEdit, onDelete, onAdd }: StorageDevicesTabProps) {
  if (storageDevices.length === 0) {
    return (
      <EmptyState
        icon={HardDrive}
        title="No storage devices mounted"
        description="Mount a drive, RAID array or NAS pool to track capacity and verification."
        action={
          <Button onClick={onAdd} variant="primary" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Mount Storage Unit
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {storageDevices.map((device) => {
        const usedPercent = device.capacity > 0 ? Math.round((device.used / device.capacity) * 100) : 0;
        return (
          <div key={device.id} className="rounded-lg border p-4 transition-colors hover:border-primary/40">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="flex items-center gap-2 text-base font-bold">
                  <HardDrive className="h-4 w-4 text-primary" aria-hidden="true" />
                  {device.deviceId} ({device.type})
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {device.location} · Last Verified: {device.lastVerified}
                </p>
              </div>
              <StatusBadge
                status={device.status}
                tone={mediaStatusTone(device.status)}
                label={formatMediaStatus(device.status)}
              />
            </div>

            <div className="mb-3 grid grid-cols-2 gap-3 rounded-lg bg-muted/30 p-3 text-xs sm:grid-cols-4">
              <div>
                <span className="block text-muted-foreground">Capacity</span>
                <span className="text-sm font-bold text-foreground">{Math.round(device.capacity / 1000)} TB</span>
              </div>
              <div>
                <span className="block text-muted-foreground">Volume Used</span>
                <span className="text-sm font-bold text-foreground">{usedPercent}%</span>
              </div>
              <div>
                <span className="block text-muted-foreground">Redundancy</span>
                <span className="font-medium text-foreground">
                  {device.redundancy ? "RAID Mirrored" : "Single Unit"}
                </span>
              </div>
              {device.temperature && (
                <div>
                  <span className="block text-muted-foreground">Drive Temp</span>
                  <span className="font-medium text-foreground">{device.temperature}&deg;C</span>
                </div>
              )}
            </div>

            <div
              className="h-2 w-full rounded-full bg-muted"
              role="img"
              aria-label={`${device.deviceId} volume used: ${usedPercent} percent`}
            >
              <div
                className={`h-2 rounded-full transition-all ${
                  usedPercent > 90 ? "bg-red-500" : usedPercent > 75 ? "bg-amber-500" : "bg-primary"
                }`}
                style={{ width: `${usedPercent}%` }}
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-2">
              <p className="text-xs text-muted-foreground">
                Content: <span className="font-medium text-foreground">{device.content.join(", ")}</span>
              </p>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={() => onEdit(device)}>
                  <Edit2 className="h-3 w-3" aria-hidden="true" /> Edit Device
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={`Delete device ${device.deviceId}`}
                  className="h-8 text-xs text-destructive hover:bg-destructive/10"
                  onClick={() => onDelete(device.id)}
                >
                  <Trash2 className="h-3 w-3" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
