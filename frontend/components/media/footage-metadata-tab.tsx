"use client";

import { Edit2, Plus, Trash2, Video } from "lucide-react";
import type { FootageMetadata } from "@/lib/types";
import { StatusBadge } from "@/components/app/status-badge";
import { EmptyState } from "@/components/app/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMediaStatus, mediaStatusTone } from "./media-status";

interface FootageMetadataTabProps {
  footageMetadata: FootageMetadata[];
  onEdit: (footage: FootageMetadata) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

export function FootageMetadataTab({ footageMetadata, onEdit, onDelete, onAdd }: FootageMetadataTabProps) {
  if (footageMetadata.length === 0) {
    return (
      <EmptyState
        icon={Video}
        title="No footage recorded yet"
        description="Log a take to register format, resolution and storage locations in the media vault."
        action={
          <Button onClick={onAdd} variant="primary" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Log First Take
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {footageMetadata.map((footage) => (
        <div key={footage.id} className="rounded-lg border p-4 transition-colors hover:border-primary/40">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-base font-bold">
                Scene {footage.sceneId} · Take {footage.takeNumber}
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Shot on {footage.shootDate} · Duration: {Math.round(footage.duration / 60)} min
              </p>
            </div>
            <StatusBadge
              status={footage.status}
              tone={mediaStatusTone(footage.status)}
              label={formatMediaStatus(footage.status)}
            />
          </div>

          <div className="mb-3 grid grid-cols-2 gap-3 rounded-lg bg-muted/30 p-3 text-xs sm:grid-cols-4">
            <div>
              <span className="block text-muted-foreground">Format</span>
              <span className="text-sm font-bold text-foreground">{footage.format}</span>
            </div>
            <div>
              <span className="block text-muted-foreground">Resolution</span>
              <span className="text-sm font-bold text-foreground">{footage.resolution}</span>
            </div>
            <div>
              <span className="block text-muted-foreground">Frame Rate</span>
              <span className="text-sm font-bold text-foreground">{footage.fps} FPS</span>
            </div>
            <div>
              <span className="block text-muted-foreground">Codec</span>
              <span className="font-medium text-foreground">{footage.codecs}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-2.5">
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <span>Stored on:</span>
              <div className="flex flex-wrap gap-1">
                {footage.storedOn.map((dev, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {dev}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={() => onEdit(footage)}>
                <Edit2 className="h-3 w-3" aria-hidden="true" /> Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                aria-label={`Delete take ${footage.sceneId}-${footage.takeNumber}`}
                className="h-8 text-xs text-destructive hover:bg-destructive/10"
                onClick={() => onDelete(footage.id)}
              >
                <Trash2 className="h-3 w-3" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
