"use client";

import { useState, useMemo } from "react";
import { Search, Plus, Layers, SlidersHorizontal, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Scene, SceneStatus } from "@/lib/types";
import { sceneStatusLabels, sceneStatusDot } from "@/lib/scene-store";
import { SceneStrip } from "./scene-strip";
import { AddSceneDialog } from "./add-scene-dialog";

interface Props {
  scenes: Scene[];
  projectId: string;
  basePath: string;
  onSceneAdded?: () => void;
}

type SortOption = "number" | "status" | "pages-desc" | "location";

export function SceneListView({ scenes, projectId, basePath, onSceneAdded }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [intExtFilter, setIntExtFilter] = useState<string>("all");
  const [todFilter, setTodFilter] = useState<string>("all");
  const [charFilter, setCharFilter] = useState<string>("all");
  const [vfxFilter, setVfxFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortOption>("number");
  const [showAdd, setShowAdd] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const allCharacters = useMemo(() => {
    const set = new Set<string>();
    scenes.forEach((s) => s.characters.forEach((c) => set.add(c)));
    return Array.from(set).sort();
  }, [scenes]);

  const allLocations = useMemo(() => {
    const set = new Set<string>();
    scenes.forEach((s) => set.add(s.location));
    return Array.from(set).sort();
  }, [scenes]);

  const filtered = useMemo(() => {
    let results = scenes;
    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(
        (s) =>
          s.sceneNumber.toLowerCase().includes(q) ||
          s.heading.toLowerCase().includes(q) ||
          s.location.toLowerCase().includes(q) ||
          s.characters.some((c) => c.toLowerCase().includes(q))
      );
    }
    if (statusFilter !== "all") results = results.filter((s) => s.status === statusFilter);
    if (intExtFilter !== "all") results = results.filter((s) => s.intExt === intExtFilter);
    if (todFilter !== "all") results = results.filter((s) => s.timeOfDay === todFilter);
    if (charFilter !== "all") results = results.filter((s) => s.characters.includes(charFilter));
    if (vfxFilter !== "all") {
      results = results.filter((s) => (vfxFilter === "yes" ? s.vfxRequired : !s.vfxRequired));
    }
    if (locationFilter !== "all") results = results.filter((s) => s.location === locationFilter);

    results = [...results].sort((a, b) => {
      switch (sort) {
        case "number": return a.sceneNumber.localeCompare(b.sceneNumber, undefined, { numeric: true, sensitivity: "base" });
        case "status": {
          const order: SceneStatus[] = ["reshoot-required", "partially-shot", "scheduled", "not-scheduled", "shot"];
          return order.indexOf(a.status) - order.indexOf(b.status);
        }
        case "pages-desc": return b.pages - a.pages;
        case "location": return a.location.localeCompare(b.location);
        default: return 0;
      }
    });
    return results;
  }, [scenes, search, statusFilter, intExtFilter, todFilter, charFilter, vfxFilter, locationFilter, sort]);

  const stats = useMemo(() => {
    const counts: Record<SceneStatus, number> = {
      "not-scheduled": 0, scheduled: 0, shot: 0, "partially-shot": 0, "reshoot-required": 0,
    };
    scenes.forEach((s) => counts[s.status]++);
    const totalPages = scenes.reduce((sum, s) => sum + s.pages, 0);
    const vfxCount = scenes.filter((s) => s.vfxRequired).length;
    return { counts, total: scenes.length, totalPages, vfxCount };
  }, [scenes]);

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {(Object.entries(sceneStatusLabels) as [SceneStatus, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(statusFilter === key ? "all" : key)}
            className={`rounded-lg border p-3 text-center transition-all ${statusFilter === key ? "border-amber-500/50 bg-amber-500/5" : "bg-card hover:border-muted-foreground/30"}`}
          >
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className={`w-2 h-2 rounded-full ${sceneStatusDot[key]}`} />
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
            </div>
            <p className="text-xl font-bold">{stats.counts[key]}</p>
          </button>
        ))}
        <div className="rounded-lg border bg-card p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Total Pages</p>
          <p className="text-xl font-bold">{stats.totalPages}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search scenes, locations, characters..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted/40"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filters</span>
          </Button>
          <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
            <SelectTrigger className="w-[150px] h-9 text-xs"><SelectValue placeholder="Sort" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="number">Scene Number</SelectItem>
              <SelectItem value="status">Status Priority</SelectItem>
              <SelectItem value="pages-desc">Pages (Longest)</SelectItem>
              <SelectItem value="location">Location</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white gap-1.5" onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4" /> Add Scene
          </Button>
        </div>
      </div>

      {/* Filter row */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 p-3 rounded-lg border bg-muted/20">
          <Select value={intExtFilter} onValueChange={setIntExtFilter}>
            <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue placeholder="INT/EXT" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="INT">INT</SelectItem>
              <SelectItem value="EXT">EXT</SelectItem>
              <SelectItem value="INT/EXT">INT/EXT</SelectItem>
            </SelectContent>
          </Select>
          <Select value={todFilter} onValueChange={setTodFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Time of Day" /></SelectTrigger>
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
          <Select value={charFilter} onValueChange={setCharFilter}>
            <SelectTrigger className="w-[180px] h-8 text-xs"><SelectValue placeholder="Character" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Characters</SelectItem>
              {allCharacters.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-[200px] h-8 text-xs"><SelectValue placeholder="Location" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {allLocations.map((l) => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={vfxFilter} onValueChange={setVfxFilter}>
            <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue placeholder="VFX" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="yes">VFX Required</SelectItem>
              <SelectItem value="no">No VFX</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setIntExtFilter("all"); setTodFilter("all"); setCharFilter("all"); setVfxFilter("all"); setLocationFilter("all"); setStatusFilter("all"); }}>
            Clear All
          </Button>
        </div>
      )}

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Layers className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-1">No scenes found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {search || statusFilter !== "all" ? "Try adjusting your search or filters." : "Add your first scene to begin the breakdown."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => (
            <SceneStrip key={s.id} scene={s} basePath={basePath} />
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center pt-2">
        Showing {filtered.length} of {scenes.length} scene{scenes.length !== 1 ? "s" : ""}
      </p>

      <AddSceneDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        projectId={projectId}
        onCreated={() => { setShowAdd(false); onSceneAdded?.(); }}
      />
    </div>
  );
}
