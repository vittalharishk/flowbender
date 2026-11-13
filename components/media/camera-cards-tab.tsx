"use client";

import { Edit2, Plus, Trash2, Zap } from "lucide-react";
import type { CameraCard, Project } from "@/lib/types";
import { StatusBadge } from "@/components/app/status-badge";
import { EmptyState } from "@/components/app/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMediaStatus, mediaStatusTone } from "./media-status";

interface CameraCardsTabProps {
  cameraCards: CameraCard[];
  projects: Project[];
  scopedProjectId?: string;
  onEdit: (card: CameraCard) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

export function CameraCardsTab({
  cameraCards,
  projects,
  scopedProjectId,
  onEdit,
  onDelete,
  onAdd,
}: CameraCardsTabProps) {
  if (cameraCards.length === 0) {
    return (
      <EmptyState
        icon={Zap}
        title="No camera cards registered"
        description="Register a camera card to track offload status, capacity and vault location."
        action={
          <Button onClick={onAdd} variant="primary" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Register Card
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {cameraCards.map((card) => {
        const proj = projects.find((p) => p.id === card.projectId);
        return (
          <div key={card.id} className="rounded-lg border p-4 transition-colors hover:border-primary/40">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold">{card.cardId}</h3>
                  {proj && !scopedProjectId && (
                    <Badge variant="outline" className="text-xs">
                      {proj.title}
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {card.format} Format · Offload Date: {card.shootDate}
                </p>
              </div>
              <StatusBadge
                status={card.status}
                tone={mediaStatusTone(card.status)}
                label={formatMediaStatus(card.status)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/30 p-3 text-xs sm:grid-cols-5">
              <div>
                <span className="block text-muted-foreground">Capacity</span>
                <span className="text-sm font-bold text-foreground">{card.capacity} GB</span>
              </div>
              <div>
                <span className="block text-muted-foreground">Available</span>
                <span className="text-sm font-bold text-foreground">{card.available} GB</span>
              </div>
              <div>
                <span className="block text-muted-foreground">Takes Logged</span>
                <span className="text-sm font-bold text-foreground">{card.shootCount}</span>
              </div>
              <div>
                <span className="block text-muted-foreground">Backup Status</span>
                <StatusBadge
                  className="mt-0.5"
                  status={card.backupStatus}
                  tone={mediaStatusTone(card.backupStatus)}
                  label={formatMediaStatus(card.backupStatus)}
                />
              </div>
              <div>
                <span className="block text-muted-foreground">Vault Location</span>
                <span className="block truncate font-medium text-foreground">{card.location}</span>
              </div>
            </div>

            {card.notes && <p className="mt-2.5 text-xs text-muted-foreground">Note: {card.notes}</p>}

            <div className="mt-3 flex justify-end gap-2 border-t pt-2">
              <Button size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={() => onEdit(card)}>
                <Edit2 className="h-3 w-3" aria-hidden="true" /> Edit Card
              </Button>
              <Button
                size="sm"
                variant="ghost"
                aria-label={`Delete card ${card.cardId}`}
                className="h-8 text-xs text-destructive hover:bg-destructive/10"
                onClick={() => onDelete(card.id)}
              >
                <Trash2 className="h-3 w-3" aria-hidden="true" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
