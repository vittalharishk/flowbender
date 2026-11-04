"use client";

import { useMemo } from "react";
import { X, Plus, Minus, ArrowLeftRight, GitCompare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ScriptDraftVersion, ScriptScene } from "@/lib/types";

interface Props {
  versionA: ScriptDraftVersion;
  versionB: ScriptDraftVersion;
  onClose: () => void;
}

type SceneDiffStatus = "added" | "removed" | "changed" | "unchanged";

interface SceneDiff {
  number: string;
  status: SceneDiffStatus;
  sceneA?: ScriptScene;
  sceneB?: ScriptScene;
  changes?: string[];
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const statusBg: Record<SceneDiffStatus, string> = {
  added: "bg-emerald-500/10 border-emerald-500/30",
  removed: "bg-red-500/10 border-red-500/30",
  changed: "bg-amber-500/10 border-amber-500/30",
  unchanged: "bg-card border-border",
};

const statusLabel: Record<SceneDiffStatus, { text: string; color: string }> = {
  added: { text: "Added", color: "text-emerald-400" },
  removed: { text: "Removed", color: "text-red-400" },
  changed: { text: "Changed", color: "text-amber-400" },
  unchanged: { text: "Unchanged", color: "text-muted-foreground" },
};

export function VersionCompare({ versionA, versionB, onClose }: Props) {
  const diff = useMemo(() => {
    const mapA = new Map<string, ScriptScene>();
    const mapB = new Map<string, ScriptScene>();
    versionA.scenes.forEach((s) => mapA.set(s.number, s));
    versionB.scenes.forEach((s) => mapB.set(s.number, s));

    const allNumbers = new Set([...mapA.keys(), ...mapB.keys()]);
    const sorted = Array.from(allNumbers).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
    );

    const diffs: SceneDiff[] = [];
    let added = 0, removed = 0, changed = 0, unchanged = 0;

    for (const num of sorted) {
      const sA = mapA.get(num);
      const sB = mapB.get(num);

      if (!sA && sB) {
        diffs.push({ number: num, status: "added", sceneB: sB });
        added++;
      } else if (sA && !sB) {
        diffs.push({ number: num, status: "removed", sceneA: sA });
        removed++;
      } else if (sA && sB) {
        const changes: string[] = [];
        if (sA.heading !== sB.heading) changes.push("heading");
        if (sA.location !== sB.location) changes.push("location");
        if (sA.intExt !== sB.intExt) changes.push("INT/EXT");
        if (sA.timeOfDay !== sB.timeOfDay) changes.push("time of day");
        if (sA.pages !== sB.pages) changes.push("pages");
        if (sA.status !== sB.status) changes.push("status");
        if (sA.description !== sB.description) changes.push("description");
        if (sA.blockIds.length !== sB.blockIds.length) changes.push("block count");

        if (changes.length > 0) {
          diffs.push({ number: num, status: "changed", sceneA: sA, sceneB: sB, changes });
          changed++;
        } else {
          diffs.push({ number: num, status: "unchanged", sceneA: sA, sceneB: sB });
          unchanged++;
        }
      }
    }

    const blocksA = versionA.blocks.length;
    const blocksB = versionB.blocks.length;
    const blockDelta = blocksB - blocksA;

    return { diffs, added, removed, changed, unchanged, blocksA, blocksB, blockDelta };
  }, [versionA, versionB]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GitCompare className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-bold">Version Comparison</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Version labels */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30 text-xs">A</Badge>
            <span className="font-semibold text-sm">V{versionA.number} — {versionA.name}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{fmtDate(versionA.revisionDate)} · {versionA.status}</p>
        </div>
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">B</Badge>
            <span className="font-semibold text-sm">V{versionB.number} — {versionB.name}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{fmtDate(versionB.revisionDate)} · {versionB.status}</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="flex flex-wrap gap-3">
        <StatPill icon={Plus} label="Added" value={diff.added} color="text-emerald-400" />
        <StatPill icon={Minus} label="Removed" value={diff.removed} color="text-red-400" />
        <StatPill icon={ArrowLeftRight} label="Changed" value={diff.changed} color="text-amber-400" />
        <div className="rounded-lg border bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground">
          {diff.unchanged} unchanged
        </div>
        <div className="rounded-lg border bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground">
          Blocks: {diff.blocksA} → {diff.blocksB}
          {diff.blockDelta !== 0 && (
            <span className={diff.blockDelta > 0 ? "text-emerald-400 ml-1" : "text-red-400 ml-1"}>
              ({diff.blockDelta > 0 ? "+" : ""}{diff.blockDelta})
            </span>
          )}
        </div>
      </div>

      {/* Scene-by-scene diff */}
      <ScrollArea className="h-[450px] rounded-xl border">
        <div className="p-3 space-y-2">
          {diff.diffs.map((d) => (
            <div key={d.number} className={`rounded-lg border p-3 ${statusBg[d.status]}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm">Sc. {d.number}</span>
                  <span className={`text-xs font-medium ${statusLabel[d.status].color}`}>
                    {statusLabel[d.status].text}
                  </span>
                </div>
                {d.changes && d.changes.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {d.changes.map((c) => (
                      <Badge key={c} variant="outline" className="text-[10px] bg-amber-500/5 text-amber-400 border-amber-500/20">
                        {c}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {d.status === "unchanged" && d.sceneA && (
                <p className="text-xs text-muted-foreground">
                  {d.sceneA.intExt}. {d.sceneA.heading} — {d.sceneA.timeOfDay} · {d.sceneA.pages} pg
                </p>
              )}

              {d.status === "added" && d.sceneB && (
                <p className="text-xs text-emerald-400">
                  {d.sceneB.intExt}. {d.sceneB.heading} — {d.sceneB.timeOfDay} · {d.sceneB.pages} pg · {d.sceneB.blockIds.length} blocks
                </p>
              )}

              {d.status === "removed" && d.sceneA && (
                <p className="text-xs text-red-400">
                  {d.sceneA.intExt}. {d.sceneA.heading} — {d.sceneA.timeOfDay} · {d.sceneA.pages} pg · {d.sceneA.blockIds.length} blocks
                </p>
              )}

              {d.status === "changed" && d.sceneA && d.sceneB && (
                <div className="grid grid-cols-2 gap-3 mt-2 text-xs">
                  <div className="space-y-0.5 text-muted-foreground">
                    <p><span className="text-red-400 font-medium">A:</span> {d.sceneA.intExt}. {d.sceneA.heading}</p>
                    <p>{d.sceneA.location} · {d.sceneA.timeOfDay} · {d.sceneA.pages} pg · {d.sceneA.blockIds.length} blocks</p>
                  </div>
                  <div className="space-y-0.5 text-muted-foreground">
                    <p><span className="text-emerald-400 font-medium">B:</span> {d.sceneB.intExt}. {d.sceneB.heading}</p>
                    <p>{d.sceneB.location} · {d.sceneB.timeOfDay} · {d.sceneB.pages} pg · {d.sceneB.blockIds.length} blocks</p>
                  </div>
                </div>
              )}
            </div>
          ))}

          {diff.diffs.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">Both versions have no scenes.</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function StatPill({ icon: Icon, label, value, color }: { icon: typeof Plus; label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border bg-muted/30 px-3 py-1.5">
      <Icon className={`h-3.5 w-3.5 ${color}`} />
      <span className="text-xs text-muted-foreground">{label}:</span>
      <span className={`text-xs font-bold ${color}`}>{value}</span>
    </div>
  );
}
