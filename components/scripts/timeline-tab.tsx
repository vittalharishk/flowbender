"use client";

import { useState, useMemo } from "react";
import {
  Clock,
  MapPin,
  Film,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Layers,
  Search,
  Wand2,
  Sun,
  Moon,
  FileText,
} from "lucide-react";
import type { Script, ScriptScene, SceneStatus } from "@/lib/types";
import { reorderScriptScenes, updateScriptScene } from "@/lib/script-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statusColors: Record<SceneStatus, string> = {
  "not-scheduled": "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  scheduled: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  shot: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "partially-shot": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "reshoot-required": "bg-red-500/10 text-red-400 border-red-500/20",
};

const statusLabels: Record<SceneStatus, string> = {
  "not-scheduled": "Not Scheduled",
  scheduled: "Scheduled",
  shot: "Shot",
  "partially-shot": "Partially Shot",
  "reshoot-required": "Reshoot Required",
};

const statusDot: Record<SceneStatus, string> = {
  "not-scheduled": "bg-zinc-400",
  scheduled: "bg-amber-400",
  shot: "bg-emerald-400",
  "partially-shot": "bg-blue-400",
  "reshoot-required": "bg-red-400",
};

const intExtBadge: Record<string, string> = {
  INT: "bg-sky-500/15 text-sky-400",
  EXT: "bg-amber-500/15 text-amber-400",
  "INT/EXT": "bg-cyan-500/15 text-cyan-400",
};

const todBadge: Record<string, string> = {
  DAY: "bg-yellow-500/15 text-yellow-400",
  NIGHT: "bg-indigo-500/15 text-indigo-300",
  DAWN: "bg-orange-500/15 text-orange-400",
  DUSK: "bg-rose-500/15 text-rose-400",
  CONTINUOUS: "bg-zinc-500/15 text-zinc-400",
  "MAGIC HOUR": "bg-pink-500/15 text-pink-400",
};

interface Props {
  scriptId: string;
  script: Script;
}

export function TimelineTab({ scriptId, script }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [intExtFilter, setIntExtFilter] = useState("all");
  const [todFilter, setTodFilter] = useState("all");
  const [groupBy, setGroupBy] = useState<"all" | "day">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const scenes = script.scenes;

  const stats = useMemo(() => {
    const totalPages = scenes.reduce((s, sc) => s + sc.pages, 0);
    const dayCount = scenes.filter((s) => s.timeOfDay === "DAY" || s.timeOfDay === "DAWN").length;
    const nightCount = scenes.filter((s) => s.timeOfDay === "NIGHT" || s.timeOfDay === "DUSK").length;
    return { total: scenes.length, totalPages, dayCount, nightCount };
  }, [scenes]);

  const filtered = useMemo(() => {
    let results = scenes;
    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(
        (s) =>
          s.heading.toLowerCase().includes(q) ||
          s.location.toLowerCase().includes(q) ||
          s.number.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") results = results.filter((s) => s.status === statusFilter);
    if (intExtFilter !== "all") results = results.filter((s) => s.intExt === intExtFilter);
    if (todFilter !== "all") results = results.filter((s) => s.timeOfDay === todFilter);
    return results;
  }, [scenes, search, statusFilter, intExtFilter, todFilter]);

  const grouped = useMemo(() => {
    if (groupBy === "all") return [{ day: "", scenes: filtered }];
    const map = new Map<string, ScriptScene[]>();
    for (const sc of filtered) {
      const key = sc.scriptDay || "Unassigned";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(sc);
    }
    return Array.from(map.entries()).map(([day, scenes]) => ({ day, scenes }));
  }, [filtered, groupBy]);

  function moveScene(idx: number, direction: -1 | 1) {
    const target = idx + direction;
    if (target < 0 || target >= scenes.length) return;
    const ids = scenes.map((s) => s.id);
    [ids[idx], ids[target]] = [ids[target], ids[idx]];
    reorderScriptScenes(scriptId, ids);
  }

  function autoAssignDays() {
    scenes.forEach((sc, i) => {
      updateScriptScene(scriptId, sc.id, { scriptDay: String(i + 1) });
    });
  }

  return (
    <section className="space-y-5">
      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiTile icon={Layers} label="Total Scenes" value={stats.total} />
        <KpiTile icon={FileText} label="Total Pages" value={stats.totalPages} />
        <KpiTile icon={Sun} label="Day Scenes" value={stats.dayCount} color="text-yellow-400" />
        <KpiTile icon={Moon} label="Night Scenes" value={stats.nightCount} color="text-indigo-400" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search scenes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted/40 h-9 text-xs"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {(Object.entries(statusLabels) as [SceneStatus, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={intExtFilter} onValueChange={setIntExtFilter}>
            <SelectTrigger className="w-[110px] h-9 text-xs"><SelectValue placeholder="INT/EXT" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="INT">INT</SelectItem>
              <SelectItem value="EXT">EXT</SelectItem>
              <SelectItem value="INT/EXT">INT/EXT</SelectItem>
            </SelectContent>
          </Select>
          <Select value={todFilter} onValueChange={setTodFilter}>
            <SelectTrigger className="w-[130px] h-9 text-xs"><SelectValue placeholder="Time" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Times</SelectItem>
              <SelectItem value="DAY">Day</SelectItem>
              <SelectItem value="NIGHT">Night</SelectItem>
              <SelectItem value="DAWN">Dawn</SelectItem>
              <SelectItem value="DUSK">Dusk</SelectItem>
              <SelectItem value="CONTINUOUS">Continuous</SelectItem>
              <SelectItem value="MAGIC HOUR">Magic Hour</SelectItem>
            </SelectContent>
          </Select>
          <Select value={groupBy} onValueChange={(v) => setGroupBy(v as "all" | "day")}>
            <SelectTrigger className="w-[130px] h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Scenes</SelectItem>
              <SelectItem value="day">By Script Day</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-9 text-xs gap-1.5" onClick={autoAssignDays}>
            <Wand2 className="w-3.5 h-3.5" /> Auto-Assign Days
          </Button>
        </div>
      </div>

      {/* Timeline */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Layers className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No scenes match your criteria.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.day || "__all"}>
              {group.day && groupBy === "day" && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center">
                    <Film className="w-4 h-4 text-amber-400" />
                  </div>
                  <h3 className="font-semibold text-sm">
                    {group.day === "Unassigned" ? "Unassigned" : `Script Day ${group.day}`}
                  </h3>
                  <Badge variant="secondary" className="text-[10px]">{group.scenes.length} scenes</Badge>
                </div>
              )}

              <div className="relative ml-5">
                {/* Vertical timeline line */}
                <div className="absolute left-[19px] top-5 bottom-5 w-0.5 bg-border" />

                <div className="space-y-3">
                  {group.scenes.map((scene, idx) => {
                    const globalIdx = scenes.findIndex((s) => s.id === scene.id);
                    const isExpanded = expandedId === scene.id;

                    return (
                      <div key={scene.id} className="relative flex gap-4">
                        {/* Circle */}
                        <div className="relative z-10 shrink-0">
                          <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-xs bg-background ${
                            scene.status === "shot"
                              ? "border-emerald-500 text-emerald-400"
                              : scene.status === "scheduled"
                              ? "border-amber-500 text-amber-400"
                              : "border-muted-foreground/30 text-muted-foreground"
                          }`}>
                            {scene.number}
                          </div>
                        </div>

                        {/* Card */}
                        <div
                          className="flex-1 rounded-xl border bg-card p-4 cursor-pointer hover:border-muted-foreground/30 transition-colors"
                          onClick={() => setExpandedId(isExpanded ? null : scene.id)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h4 className="font-semibold text-sm">{scene.heading}</h4>
                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${intExtBadge[scene.intExt] ?? ""}`}>
                                  {scene.intExt}
                                </span>
                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${todBadge[scene.timeOfDay] ?? ""}`}>
                                  {scene.timeOfDay}
                                </span>
                              </div>

                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {scene.location || "No location"}</span>
                                <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {scene.pages} pg</span>
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Day {scene.scriptDay || "—"}</span>
                              </div>

                              <div className="flex items-center gap-2 mt-2">
                                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusColors[scene.status]}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${statusDot[scene.status]}`} />
                                  {statusLabels[scene.status]}
                                </span>
                                {scene.blockIds.length > 0 && (
                                  <span className="text-[10px] text-muted-foreground">{scene.blockIds.length} blocks</span>
                                )}
                                {scene.breakdown.length > 0 && (
                                  <span className="text-[10px] text-muted-foreground">{scene.breakdown.length} breakdown items</span>
                                )}
                              </div>

                              {!isExpanded && scene.description && (
                                <p className="text-xs text-muted-foreground mt-2 line-clamp-1">{scene.description}</p>
                              )}
                            </div>

                            <div className="flex flex-col gap-0.5 shrink-0">
                              <Button
                                variant="ghost" size="icon" className="h-6 w-6"
                                onClick={(e) => { e.stopPropagation(); moveScene(globalIdx, -1); }}
                                disabled={globalIdx === 0}
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost" size="icon" className="h-6 w-6"
                                onClick={(e) => { e.stopPropagation(); moveScene(globalIdx, 1); }}
                                disabled={globalIdx === scenes.length - 1}
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>

                          {/* Expanded detail */}
                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t space-y-3">
                              {scene.description && (
                                <div>
                                  <p className="text-[10px] uppercase text-muted-foreground font-semibold mb-1">Description</p>
                                  <p className="text-xs text-foreground/80 leading-relaxed">{scene.description}</p>
                                </div>
                              )}

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                <div className="p-2 rounded-lg bg-muted/40">
                                  <span className="text-[10px] text-muted-foreground">Pages</span>
                                  <p className="font-bold">{scene.pages}</p>
                                </div>
                                <div className="p-2 rounded-lg bg-muted/40">
                                  <span className="text-[10px] text-muted-foreground">Eighths</span>
                                  <p className="font-bold">{scene.eighths}/8</p>
                                </div>
                                <div className="p-2 rounded-lg bg-muted/40">
                                  <span className="text-[10px] text-muted-foreground">Script Day</span>
                                  <p className="font-bold">{scene.scriptDay || "—"}</p>
                                </div>
                                <div className="p-2 rounded-lg bg-muted/40">
                                  <span className="text-[10px] text-muted-foreground">Blocks</span>
                                  <p className="font-bold">{scene.blockIds.length}</p>
                                </div>
                              </div>

                              {scene.breakdown.length > 0 && (
                                <div>
                                  <p className="text-[10px] uppercase text-muted-foreground font-semibold mb-1">Breakdown</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {scene.breakdown.map((item) => (
                                      <span key={item.id} className="text-[10px] px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground">
                                        {item.name}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center pt-2">
        Showing {filtered.length} of {scenes.length} scenes
      </p>
    </section>
  );
}

function KpiTile({ icon: Icon, label, value, color }: { icon: typeof Layers; label: string; value: number; color?: string }) {
  return (
    <div className="rounded-xl border bg-card p-3 text-center">
      <Icon className={`w-4 h-4 mx-auto mb-1 ${color ?? "text-muted-foreground"}`} />
      <p className="text-xl font-bold">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}
