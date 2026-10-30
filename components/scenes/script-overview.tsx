"use client";

import { useMemo } from "react";
import { FileText, Clock, Layers, Sparkles, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Scene, ScriptVersion, SceneStatus } from "@/lib/types";
import { sceneStatusLabels, sceneStatusDot } from "@/lib/scene-store";

interface Props {
  scenes: Scene[];
  versions: ScriptVersion[];
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function ScriptOverview({ scenes, versions }: Props) {
  const stats = useMemo(() => {
    const totalPages = scenes.reduce((s, sc) => s + sc.pages, 0);
    const vfxScenes = scenes.filter((s) => s.vfxRequired).length;
    const locations = new Set(scenes.map((s) => s.location)).size;
    const characters = new Set(scenes.flatMap((s) => s.characters)).size;
    const counts: Record<SceneStatus, number> = {
      "not-scheduled": 0, scheduled: 0, shot: 0, "partially-shot": 0, "reshoot-required": 0,
    };
    scenes.forEach((s) => counts[s.status]++);
    return { totalPages, vfxScenes, locations, characters, counts, total: scenes.length };
  }, [scenes]);

  const currentVersion = versions.find((v) => v.isCurrent);

  return (
    <div className="space-y-6">
      {/* Current Script */}
      {currentVersion && (
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-600/10 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold">Current Script</h3>
                <span className={cn("text-xs font-bold px-2.5 py-0.5 rounded", currentVersion.color)}>
                  {currentVersion.label}
                </span>
                <span className="text-xs text-muted-foreground">v{currentVersion.version}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{currentVersion.notes}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                <span>{currentVersion.pageCount} pages</span>
                <span>{currentVersion.sceneCount} scenes</span>
                <span>by {currentVersion.author}</span>
                <span>{fmtDate(currentVersion.date)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatBox label="Total Scenes" value={String(stats.total)} icon={Layers} />
        <StatBox label="Total Pages" value={String(stats.totalPages)} icon={FileText} />
        <StatBox label="VFX Scenes" value={String(stats.vfxScenes)} icon={Sparkles} color="text-violet-400" />
        <StatBox label="Locations" value={String(stats.locations)} />
        <StatBox label="Characters" value={String(stats.characters)} />
        <StatBox label="Shot" value={String(stats.counts.shot)} icon={CheckCircle2} color="text-emerald-400" />
      </div>

      {/* Progress breakdown */}
      <div className="rounded-xl border bg-card p-5">
        <h3 className="font-semibold mb-4">Scene Progress</h3>
        <div className="space-y-3">
          {(Object.entries(sceneStatusLabels) as [SceneStatus, string][]).map(([key, label]) => {
            const count = stats.counts[key];
            const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
            return (
              <div key={key} className="flex items-center gap-3">
                <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", sceneStatusDot[key])} />
                <span className="text-sm w-32 shrink-0">{label}</span>
                <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all duration-500", sceneStatusDot[key])} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-sm font-medium w-8 text-right">{count}</span>
                <span className="text-xs text-muted-foreground w-10 text-right">{pct.toFixed(0)}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Version history */}
      <div className="rounded-xl border bg-card p-5">
        <h3 className="font-semibold mb-4">Script Versions</h3>
        {versions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No script versions recorded.</p>
        ) : (
          <div className="space-y-3">
            {[...versions].reverse().map((v) => (
              <div key={v.id} className={cn("flex items-center gap-3 p-3 rounded-lg", v.isCurrent ? "bg-amber-500/5 border border-amber-500/20" : "bg-muted/30")}>
                <span className={cn("text-xs font-bold px-2.5 py-1 rounded shrink-0 w-28 text-center", v.color)}>
                  {v.label}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">v{v.version}</span>
                    {v.isCurrent && <span className="text-[10px] text-amber-400 font-semibold uppercase">Current</span>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{v.notes}</p>
                </div>
                <div className="text-right shrink-0 hidden sm:block">
                  <p className="text-xs">{v.pageCount} pg / {v.sceneCount} sc</p>
                  <p className="text-[11px] text-muted-foreground">{fmtDate(v.date)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, icon: Icon, color }: { label: string; value: string; icon?: typeof FileText; color?: string }) {
  return (
    <div className="rounded-lg border bg-card p-3 text-center">
      {Icon && <Icon className={cn("w-4 h-4 mx-auto mb-1", color ?? "text-muted-foreground")} />}
      <p className="text-xl font-bold">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}
