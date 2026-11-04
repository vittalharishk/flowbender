"use client";

import { useState } from "react";
import {
  Save, Eye, GitCompare, RotateCcw, Trash2, Clock,
  Layers, CheckSquare, ChevronDown, ChevronRight, Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createScriptVersion,
  restoreScriptVersion,
  deleteScriptVersion,
  updateScriptVersion,
} from "@/lib/script-store";
import type { Script, ScriptDraftVersion, ScriptStatus } from "@/lib/types";
import { VersionCompare } from "./version-compare";

interface Props {
  scriptId: string;
  script: Script;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const statusColors: Partial<Record<ScriptStatus, string>> = {
  Concept: "bg-zinc-500/15 text-zinc-400",
  "First Draft": "bg-blue-500/15 text-blue-400",
  "Second Draft": "bg-cyan-500/15 text-cyan-400",
  "Revised Draft": "bg-amber-500/15 text-amber-400",
  "Production Draft": "bg-emerald-500/15 text-emerald-400",
  "Shooting Draft": "bg-green-500/15 text-green-400",
  Locked: "bg-red-500/15 text-red-400",
  Archived: "bg-zinc-500/15 text-zinc-500",
};

export function VersionsTab({ scriptId, script }: Props) {
  const [versionName, setVersionName] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [editingNotesText, setEditingNotesText] = useState("");
  const [selectedForCompare, setSelectedForCompare] = useState<Set<string>>(new Set());
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  const [compareVersions, setCompareVersions] = useState<[ScriptDraftVersion, ScriptDraftVersion] | null>(null);
  const [message, setMessage] = useState("");

  const versions = script.versions ?? [];

  function handleCreate() {
    if (!versionName.trim()) return;
    createScriptVersion(scriptId, {
      name: versionName.trim(),
      notes: "Created from current draft",
      status: script.status,
    });
    setVersionName("");
    setMessage("Version saved successfully.");
    setTimeout(() => setMessage(""), 3000);
  }

  function handleRestore(version: ScriptDraftVersion) {
    if (!window.confirm(`Restore version V${version.number} — ${version.name}?\n\nThe current draft will be saved as a new version before restoring.`)) return;
    restoreScriptVersion(scriptId, version.id);
    setMessage(`Restored V${version.number}. Previous draft saved as a new version.`);
    setTimeout(() => setMessage(""), 4000);
  }

  function handleDelete(version: ScriptDraftVersion) {
    if (!window.confirm(`Delete version V${version.number} — ${version.name}? This cannot be undone.`)) return;
    deleteScriptVersion(scriptId, version.id);
    setSelectedForCompare((prev) => { const next = new Set(prev); next.delete(version.id); return next; });
    setMessage("Version deleted.");
    setTimeout(() => setMessage(""), 3000);
  }

  function handleSaveNotes(versionId: string) {
    updateScriptVersion(scriptId, versionId, { notes: editingNotesText });
    setEditingNotesId(null);
    setMessage("Notes updated.");
    setTimeout(() => setMessage(""), 2000);
  }

  function toggleCompareSelect(id: string) {
    setSelectedForCompare((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= 2) return prev;
        next.add(id);
      }
      return next;
    });
  }

  function openCompare() {
    const ids = Array.from(selectedForCompare);
    if (ids.length !== 2) return;
    const a = versions.find((v) => v.id === ids[0]);
    const b = versions.find((v) => v.id === ids[1]);
    if (!a || !b) return;
    const [older, newer] = a.number < b.number ? [a, b] : [b, a];
    setCompareVersions([older, newer]);
    setCompareDialogOpen(true);
  }

  function openCompareWith(version: ScriptDraftVersion) {
    const currentSnapshot: ScriptDraftVersion = {
      id: "__current__",
      number: Math.max(0, ...versions.map((v) => v.number)) + 1,
      name: "Current Draft",
      revisionDate: script.updatedAt,
      createdBy: "Production Team",
      notes: "",
      status: script.status,
      blocks: script.blocks,
      scenes: script.scenes,
    };
    setCompareVersions([version, currentSnapshot]);
    setCompareDialogOpen(true);
  }

  return (
    <section className="space-y-5">
      {message && (
        <p role="status" className="rounded-md border bg-muted p-3 text-sm">{message}</p>
      )}

      {/* Create Version */}
      <div className="rounded-xl border bg-card p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Save className="h-4 w-4 text-amber-500" />
          Save Current Draft as Version
        </h3>
        <div className="flex gap-2">
          <Input
            value={versionName}
            onChange={(e) => setVersionName(e.target.value)}
            placeholder="Version name, e.g. Locked Shooting Draft Rev 4"
            className="flex-1"
            onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
          />
          <Button onClick={handleCreate} disabled={!versionName.trim()}>
            <Save className="mr-2 h-4 w-4" /> Save Version
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Saves a snapshot of {script.blocks.length} blocks and {script.scenes.length} scenes as version {Math.max(0, ...versions.map((v) => v.number), 0) + 1}.
        </p>
      </div>

      {/* Compare toolbar */}
      {versions.length >= 2 && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-2">
          <p className="text-xs text-muted-foreground">
            <CheckSquare className="h-3.5 w-3.5 inline mr-1" />
            Select two versions to compare ({selectedForCompare.size}/2 selected)
          </p>
          <Button
            size="sm"
            variant="outline"
            disabled={selectedForCompare.size !== 2}
            onClick={openCompare}
            className="gap-1.5"
          >
            <GitCompare className="h-3.5 w-3.5" /> Compare Selected
          </Button>
        </div>
      )}

      {/* Version List */}
      <div className="rounded-xl border bg-card divide-y">
        {versions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Layers className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="font-semibold mb-1">No saved versions yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Save your current draft as a version to track changes over time. You can compare, restore, and manage all versions here.
            </p>
          </div>
        )}

        {versions.map((version) => {
          const isExpanded = expandedId === version.id;
          const isEditingNotes = editingNotesId === version.id;
          const isSelected = selectedForCompare.has(version.id);

          return (
            <div key={version.id} className="p-4">
              <div className="flex items-start gap-3">
                {/* Compare checkbox */}
                {versions.length >= 2 && (
                  <div className="pt-1">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleCompareSelect(version.id)}
                      disabled={!isSelected && selectedForCompare.size >= 2}
                    />
                  </div>
                )}

                {/* Version info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs font-mono bg-amber-500/10 text-amber-500 border-amber-500/30">
                      V{version.number}
                    </Badge>
                    <span className="font-semibold text-sm">{version.name}</span>
                    <Badge variant="secondary" className={`text-[10px] ${statusColors[version.status] ?? "bg-muted text-muted-foreground"}`}>
                      {version.status}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {fmtDate(version.revisionDate)}
                    </span>
                    <span>{version.scenes.length} scenes</span>
                    <span>{version.blocks.length} blocks</span>
                    <span>by {version.createdBy}</span>
                  </div>

                  {/* Notes */}
                  {isEditingNotes ? (
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={editingNotesText}
                        onChange={(e) => setEditingNotesText(e.target.value)}
                        className="text-xs flex-1"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === "Enter") handleSaveNotes(version.id); if (e.key === "Escape") setEditingNotesId(null); }}
                      />
                      <Button size="sm" variant="outline" onClick={() => handleSaveNotes(version.id)}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingNotesId(null)}>Cancel</Button>
                    </div>
                  ) : (
                    <p
                      className="text-xs text-muted-foreground mt-1.5 cursor-pointer hover:text-foreground group"
                      onClick={() => { setEditingNotesId(version.id); setEditingNotesText(version.notes); }}
                    >
                      {version.notes || "No notes — click to add"}
                      <Pencil className="h-3 w-3 inline ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    title="View scenes"
                    onClick={() => setExpandedId(isExpanded ? null : version.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    title="Compare with current"
                    onClick={() => openCompareWith(version)}
                  >
                    <GitCompare className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    title="Restore this version"
                    onClick={() => handleRestore(version)}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive"
                    title="Delete version"
                    onClick={() => handleDelete(version)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Expanded scene list */}
              {isExpanded && (
                <div className="mt-3 ml-8 rounded-lg border bg-muted/20 p-3 space-y-1.5">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Scenes in V{version.number}
                    </span>
                  </div>
                  {version.scenes.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">No scenes in this version.</p>
                  ) : (
                    <div className="space-y-1">
                      {version.scenes.map((scene) => (
                        <div key={scene.id} className="flex items-center gap-3 p-2 rounded-lg bg-background/60 text-xs">
                          <span className="font-mono font-bold text-primary w-10">Sc. {scene.number}</span>
                          <span className="flex-1 truncate">
                            {scene.intExt}. {scene.heading} — {scene.timeOfDay}
                          </span>
                          <span className="text-muted-foreground">{scene.location}</span>
                          <span className="text-muted-foreground">{scene.pages} pg</span>
                          <Badge variant="secondary" className="text-[10px]">{scene.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Compare Dialog */}
      <Dialog open={compareDialogOpen} onOpenChange={setCompareDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">Version Comparison</DialogTitle>
          </DialogHeader>
          {compareVersions && (
            <VersionCompare
              versionA={compareVersions[0]}
              versionB={compareVersions[1]}
              onClose={() => setCompareDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
