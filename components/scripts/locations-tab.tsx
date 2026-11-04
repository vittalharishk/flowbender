"use client";

import { useState, useMemo } from "react";
import {
  MapPin,
  Search,
  Eye,
  Phone,
  User,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Building2,
  Sun,
  Moon,
} from "lucide-react";
import type { Script, ProjectLocation } from "@/lib/types";
import { useAppDataSelector } from "@/lib/app-data-store";
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
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

interface Props {
  scriptId: string;
  script: Script;
}

interface DerivedLocation {
  name: string;
  sceneCount: number;
  totalPages: number;
  intCount: number;
  extCount: number;
  dayCount: number;
  nightCount: number;
  sceneNumbers: string[];
  scenes: { id: string; number: string; heading: string; intExt: string; timeOfDay: string; pages: number; status: string }[];
  linked: ProjectLocation | undefined;
}

type ScoutingFilter = "all" | "locked" | "scouting" | "permit-pending" | "unlinked";
type SortOption = "name" | "scenes" | "pages";

const scoutingBadge: Record<string, { bg: string; text: string; label: string }> = {
  locked: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Locked" },
  scouting: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Scouting" },
  "permit-pending": { bg: "bg-blue-500/10", text: "text-blue-400", label: "Permit Pending" },
  unlinked: { bg: "bg-zinc-500/10", text: "text-zinc-400", label: "Unlinked" },
};

export function LocationsTab({ scriptId, script }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ScoutingFilter>("all");
  const [sort, setSort] = useState<SortOption>("scenes");
  const [expandedLocation, setExpandedLocation] = useState<string | null>(null);

  const projectLocations = useAppDataSelector((data) =>
    data.locations.filter((l) => l.projectId === script.projectId)
  );

  const derivedLocations = useMemo(() => {
    const map = new Map<string, DerivedLocation>();

    for (const scene of script.scenes) {
      const locName = scene.location || "Unknown Location";
      let entry = map.get(locName);
      if (!entry) {
        const linked = projectLocations.find(
          (pl) =>
            pl.name.toLowerCase().includes(locName.toLowerCase()) ||
            locName.toLowerCase().includes(pl.name.toLowerCase())
        );
        entry = {
          name: locName,
          sceneCount: 0,
          totalPages: 0,
          intCount: 0,
          extCount: 0,
          dayCount: 0,
          nightCount: 0,
          sceneNumbers: [],
          scenes: [],
          linked,
        };
        map.set(locName, entry);
      }
      entry.sceneCount++;
      entry.totalPages += scene.pages;
      if (scene.intExt === "INT" || scene.intExt === "INT/EXT") entry.intCount++;
      if (scene.intExt === "EXT" || scene.intExt === "INT/EXT") entry.extCount++;
      if (scene.timeOfDay === "DAY" || scene.timeOfDay === "DAWN" || scene.timeOfDay === "MAGIC HOUR") entry.dayCount++;
      if (scene.timeOfDay === "NIGHT" || scene.timeOfDay === "DUSK") entry.nightCount++;
      entry.sceneNumbers.push(scene.number);
      entry.scenes.push({
        id: scene.id,
        number: scene.number,
        heading: scene.heading,
        intExt: scene.intExt,
        timeOfDay: scene.timeOfDay,
        pages: scene.pages,
        status: scene.status,
      });
    }

    return Array.from(map.values());
  }, [script.scenes, projectLocations]);

  const filtered = useMemo(() => {
    let list = derivedLocations;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((l) => l.name.toLowerCase().includes(q));
    }

    if (statusFilter !== "all") {
      list = list.filter((l) => {
        const status = l.linked?.status ?? "unlinked";
        return status === statusFilter || (!l.linked && statusFilter === "unlinked");
      });
    }

    list = [...list].sort((a, b) => {
      switch (sort) {
        case "name":
          return a.name.localeCompare(b.name);
        case "scenes":
          return b.sceneCount - a.sceneCount;
        case "pages":
          return b.totalPages - a.totalPages;
        default:
          return 0;
      }
    });

    return list;
  }, [derivedLocations, search, statusFilter, sort]);

  const stats = useMemo(() => {
    const total = derivedLocations.length;
    const intLocs = derivedLocations.filter((l) => l.intCount > 0).length;
    const extLocs = derivedLocations.filter((l) => l.extCount > 0).length;
    const scoutedCount = derivedLocations.filter((l) => l.linked).length;
    return { total, intLocs, extLocs, scoutedCount };
  }, [derivedLocations]);

  function getStatusKey(loc: DerivedLocation): string {
    return loc.linked?.status ?? "unlinked";
  }

  return (
    <section className="space-y-5">
      {/* KPI Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-card p-4 text-center">
          <MapPin className="w-5 h-5 mx-auto mb-1 text-amber-500" />
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Unique Locations</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <Building2 className="w-5 h-5 mx-auto mb-1 text-sky-400" />
          <p className="text-2xl font-bold">{stats.intLocs}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Interior</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <Sun className="w-5 h-5 mx-auto mb-1 text-amber-400" />
          <p className="text-2xl font-bold">{stats.extLocs}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Exterior</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
          <p className="text-2xl font-bold">{stats.scoutedCount}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Scouted</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search locations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted/40 h-9 text-xs"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ScoutingFilter)}>
            <SelectTrigger className="w-[160px] h-9 text-xs">
              <SelectValue placeholder="Scouting Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="locked">Locked</SelectItem>
              <SelectItem value="scouting">Scouting</SelectItem>
              <SelectItem value="permit-pending">Permit Pending</SelectItem>
              <SelectItem value="unlinked">Unlinked</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scenes">Most Scenes</SelectItem>
              <SelectItem value="pages">Most Pages</SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <MapPin className="w-10 h-10 text-muted-foreground mb-3" />
          <h3 className="font-semibold mb-1">No locations found</h3>
          <p className="text-sm text-muted-foreground">
            {search || statusFilter !== "all"
              ? "Try adjusting your search or filters."
              : "Add scenes with locations to see them here."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-xs">Location</TableHead>
                <TableHead className="text-xs text-center">Scenes</TableHead>
                <TableHead className="text-xs text-center">Pages</TableHead>
                <TableHead className="text-xs text-center hidden sm:table-cell">INT / EXT</TableHead>
                <TableHead className="text-xs text-center hidden md:table-cell">Day / Night</TableHead>
                <TableHead className="text-xs text-center">Status</TableHead>
                <TableHead className="text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((loc) => {
                const statusKey = getStatusKey(loc);
                const badge = scoutingBadge[statusKey] ?? scoutingBadge.unlinked;
                const isExpanded = expandedLocation === loc.name;

                return (
                  <React.Fragment key={loc.name}>
                    <TableRow className={isExpanded ? "bg-muted/30" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{loc.name}</p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              Sc. {loc.sceneNumbers.join(", ")}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm font-bold">{loc.sceneCount}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm font-medium">{loc.totalPages}</span>
                      </TableCell>
                      <TableCell className="text-center hidden sm:table-cell">
                        <div className="flex items-center justify-center gap-1 text-xs">
                          <span className="text-sky-400">{loc.intCount}</span>
                          <span className="text-muted-foreground">/</span>
                          <span className="text-amber-400">{loc.extCount}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center hidden md:table-cell">
                        <div className="flex items-center justify-center gap-1 text-xs">
                          <Sun className="w-3 h-3 text-yellow-400" />
                          <span>{loc.dayCount}</span>
                          <span className="text-muted-foreground mx-0.5">/</span>
                          <Moon className="w-3 h-3 text-indigo-400" />
                          <span>{loc.nightCount}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${badge.bg} ${badge.text} border-0`}
                        >
                          {badge.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() =>
                            setExpandedLocation(isExpanded ? null : loc.name)
                          }
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>

                    {/* Expanded detail row */}
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={7} className="p-0">
                          <LocationDetailPanel loc={loc} />
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center pt-1">
        Showing {filtered.length} of {derivedLocations.length} location{derivedLocations.length !== 1 ? "s" : ""}
      </p>
    </section>
  );
}

import React from "react";

function LocationDetailPanel({ loc }: { loc: DerivedLocation }) {
  return (
    <div className="border-t bg-muted/10 p-5 space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Scenes at this location */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Scenes at this Location ({loc.sceneCount})
          </h4>
          <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
            {loc.scenes.map((scene) => (
              <div
                key={scene.id}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-background/60 border text-sm"
              >
                <span className="font-mono font-bold text-xs text-amber-500 w-12 shrink-0">
                  Sc. {scene.number}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium text-xs">{scene.heading}</p>
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0">
                  {scene.intExt}
                </Badge>
                <Badge variant="outline" className="text-[10px] shrink-0">
                  {scene.timeOfDay}
                </Badge>
                <span className="text-xs text-muted-foreground shrink-0">
                  {scene.pages} pg
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Production Location Info */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Production Location
          </h4>
          {loc.linked ? (
            <div className="rounded-xl border bg-background/60 p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-sm">{loc.linked.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {loc.linked.city} · {loc.linked.type}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[10px] ${
                    scoutingBadge[loc.linked.status]?.bg ?? ""
                  } ${scoutingBadge[loc.linked.status]?.text ?? ""} border-0`}
                >
                  {scoutingBadge[loc.linked.status]?.label ?? loc.linked.status}
                </Badge>
              </div>

              {loc.linked.address && (
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{loc.linked.address}</span>
                </div>
              )}

              {loc.linked.notes && (
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{loc.linked.notes}</span>
                </div>
              )}

              {loc.linked.coverImage && (
                <div className="rounded-lg bg-muted/40 border p-3 text-center text-xs text-muted-foreground">
                  <Eye className="w-5 h-5 mx-auto mb-1" />
                  Cover image available
                </div>
              )}

              {loc.linked.gallery && loc.linked.gallery.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Gallery: {loc.linked.gallery.length} photo{loc.linked.gallery.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed bg-background/40 p-6 text-center space-y-2">
              <MapPin className="w-8 h-8 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">
                No production location linked
              </p>
              <p className="text-xs text-muted-foreground">
                Create a production location matching &quot;{loc.name}&quot; to track scouting, permits and contacts.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Summary bar */}
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground pt-2 border-t">
        <span className="flex items-center gap-1">
          <Building2 className="w-3.5 h-3.5" />
          INT: {loc.intCount} · EXT: {loc.extCount}
        </span>
        <span className="flex items-center gap-1">
          <Sun className="w-3.5 h-3.5" />
          Day: {loc.dayCount} · Night: {loc.nightCount}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {loc.totalPages} total pages
        </span>
      </div>
    </div>
  );
}
