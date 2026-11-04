"use client";

import { useState, useMemo } from "react";
import {
  BarChart3,
  Users,
  MapPin,
  MessageSquare,
  Package,
  Download,
  Search,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import type { Script, ScriptScene, ScriptBlock, SceneBreakdownItem } from "@/lib/types";
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

type SubTab = "summary" | "cast" | "locations" | "dialogue" | "props";
type SortDir = "asc" | "desc";

function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const csv = [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

interface CharEntry {
  name: string;
  speeches: number;
  words: number;
  pct: number;
  scenes: Set<string>;
  sceneCount: number;
  tier: string;
  dialogues: { sceneNumber: string; sceneHeading: string; text: string; parenthetical?: string }[];
}

interface LocEntry {
  location: string;
  sceneCount: number;
  totalPages: number;
  intCount: number;
  extCount: number;
  dayCount: number;
  nightCount: number;
}

interface PropEntry {
  name: string;
  category: string;
  sceneAppearances: string[];
  notes: string[];
}

function computeCharacters(script: Script): CharEntry[] {
  const map = new Map<string, CharEntry>();
  let totalWords = 0;
  let currentSceneNum = "1";
  let currentSceneHeading = "";
  let activeChar: string | null = null;
  let activeParen: string | null = null;

  for (const block of script.blocks) {
    if (block.type === "scene_heading") {
      const found = script.scenes.find((s) => s.blockIds.includes(block.id));
      currentSceneNum = found?.number || "?";
      currentSceneHeading = block.text;
      activeChar = null;
      activeParen = null;
    } else if (block.type === "character") {
      activeChar = block.text.replace(/\s*\([^)]*\)/g, "").trim().toUpperCase();
      activeParen = null;
      if (!map.has(activeChar)) {
        map.set(activeChar, { name: activeChar, speeches: 0, words: 0, pct: 0, scenes: new Set(), sceneCount: 0, tier: "Minor", dialogues: [] });
      }
    } else if (block.type === "parenthetical") {
      activeParen = block.text;
    } else if (block.type === "dialogue" && activeChar) {
      const wc = block.text.split(/\s+/).filter(Boolean).length;
      totalWords += wc;
      const e = map.get(activeChar)!;
      e.speeches++;
      e.words += wc;
      e.scenes.add(currentSceneNum);
      e.dialogues.push({ sceneNumber: currentSceneNum, sceneHeading: currentSceneHeading, text: block.text, parenthetical: activeParen || undefined });
      activeParen = null;
    } else {
      activeChar = null;
      activeParen = null;
    }
  }

  const list = Array.from(map.values());
  for (const c of list) {
    c.pct = totalWords > 0 ? Math.round((c.words / totalWords) * 1000) / 10 : 0;
    c.sceneCount = c.scenes.size;
    c.tier =
      c.pct >= 25 || c.speeches >= 10
        ? "Lead"
        : c.pct >= 10 || c.speeches >= 5
        ? "Major Supporting"
        : c.pct >= 3 || c.speeches >= 2
        ? "Supporting"
        : "Minor";
  }
  list.sort((a, b) => b.speeches - a.speeches);
  return list;
}

function computeLocations(scenes: ScriptScene[]): LocEntry[] {
  const map = new Map<string, LocEntry>();
  for (const s of scenes) {
    const loc = s.location || "(unlabeled)";
    if (!map.has(loc)) {
      map.set(loc, { location: loc, sceneCount: 0, totalPages: 0, intCount: 0, extCount: 0, dayCount: 0, nightCount: 0 });
    }
    const e = map.get(loc)!;
    e.sceneCount++;
    e.totalPages += s.pages;
    if (s.intExt === "INT" || s.intExt === "INT/EXT") e.intCount++;
    if (s.intExt === "EXT" || s.intExt === "INT/EXT") e.extCount++;
    if (s.timeOfDay === "DAY" || s.timeOfDay === "DAWN") e.dayCount++;
    if (s.timeOfDay === "NIGHT" || s.timeOfDay === "DUSK") e.nightCount++;
  }
  return Array.from(map.values()).sort((a, b) => b.sceneCount - a.sceneCount);
}

function computeProps(scenes: ScriptScene[]): PropEntry[] {
  const map = new Map<string, PropEntry>();
  for (const s of scenes) {
    for (const item of s.breakdown) {
      const key = `${item.category}::${item.name}`;
      if (!map.has(key)) {
        map.set(key, { name: item.name, category: item.category, sceneAppearances: [], notes: [] });
      }
      const e = map.get(key)!;
      if (!e.sceneAppearances.includes(s.number)) e.sceneAppearances.push(s.number);
      if (item.notes && !e.notes.includes(item.notes)) e.notes.push(item.notes);
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

const subTabs: { key: SubTab; label: string; icon: typeof BarChart3 }[] = [
  { key: "summary", label: "Summary", icon: BarChart3 },
  { key: "cast", label: "Cast", icon: Users },
  { key: "locations", label: "Locations", icon: MapPin },
  { key: "dialogue", label: "Dialogue", icon: MessageSquare },
  { key: "props", label: "Props", icon: Package },
];

const statusColors: Record<string, string> = {
  "not-scheduled": "bg-zinc-500",
  scheduled: "bg-amber-500",
  shot: "bg-emerald-500",
  "partially-shot": "bg-blue-500",
  "reshoot-required": "bg-red-500",
};
const statusLabels: Record<string, string> = {
  "not-scheduled": "Not Scheduled",
  scheduled: "Scheduled",
  shot: "Shot",
  "partially-shot": "Partially Shot",
  "reshoot-required": "Reshoot Required",
};

const tierColors: Record<string, string> = {
  Lead: "bg-amber-500/15 text-amber-500 border-amber-500/20",
  "Major Supporting": "bg-blue-500/15 text-blue-500 border-blue-500/20",
  Supporting: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
  Minor: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
};

export function ReportsTab({ scriptId, script }: Props) {
  const [subTab, setSubTab] = useState<SubTab>("summary");

  const characters = useMemo(() => computeCharacters(script), [script]);
  const locations = useMemo(() => computeLocations(script.scenes), [script.scenes]);
  const props = useMemo(() => computeProps(script.scenes), [script.scenes]);
  const shots = script.shots ?? [];
  const totalPages = script.scenes.reduce((s, sc) => s + sc.pages, 0);
  const totalDialogues = characters.reduce((s, c) => s + c.speeches, 0);
  const uniqueLocations = new Set(script.scenes.map((s) => s.location).filter(Boolean)).size;
  const totalBreakdown = script.scenes.reduce((s, sc) => s + sc.breakdown.length, 0);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center gap-1 border-b pb-1">
        {subTabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setSubTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                subTab === t.key
                  ? "border-amber-500 text-amber-500"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {subTab === "summary" && (
        <SummaryDashboard
          totalPages={totalPages}
          sceneCount={script.scenes.length}
          speakingChars={characters.length}
          totalDialogues={totalDialogues}
          uniqueLocations={uniqueLocations}
          shotCount={shots.length}
          breakdownItems={totalBreakdown}
          scenes={script.scenes}
        />
      )}
      {subTab === "cast" && <CastReport characters={characters} scriptTitle={script.title} />}
      {subTab === "locations" && <LocationReport locations={locations} scriptTitle={script.title} />}
      {subTab === "dialogue" && <DialogueReport characters={characters} scenes={script.scenes} blocks={script.blocks} scriptTitle={script.title} />}
      {subTab === "props" && <PropReport props={props} scriptTitle={script.title} />}
    </section>
  );
}

// ── Summary ──

function SummaryDashboard({
  totalPages,
  sceneCount,
  speakingChars,
  totalDialogues,
  uniqueLocations,
  shotCount,
  breakdownItems,
  scenes,
}: {
  totalPages: number;
  sceneCount: number;
  speakingChars: number;
  totalDialogues: number;
  uniqueLocations: number;
  shotCount: number;
  breakdownItems: number;
  scenes: ScriptScene[];
}) {
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of scenes) counts[s.status] = (counts[s.status] || 0) + 1;
    return counts;
  }, [scenes]);

  const intExtCounts = useMemo(() => {
    const c = { INT: 0, EXT: 0, "INT/EXT": 0 };
    for (const s of scenes) c[s.intExt] = (c[s.intExt] || 0) + 1;
    return c;
  }, [scenes]);

  const todCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const s of scenes) c[s.timeOfDay] = (c[s.timeOfDay] || 0) + 1;
    return c;
  }, [scenes]);

  const kpis = [
    { label: "Total Pages", value: totalPages },
    { label: "Scenes", value: sceneCount },
    { label: "Speaking Characters", value: speakingChars },
    { label: "Total Dialogues", value: totalDialogues },
    { label: "Unique Locations", value: uniqueLocations },
    { label: "Total Shots", value: shotCount },
    { label: "Breakdown Items", value: breakdownItems },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border bg-card p-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{k.label}</p>
            <p className="text-2xl font-bold mt-1">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-4">
          <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Scene Status</h4>
          <div className="space-y-2">
            {Object.entries(statusLabels).map(([key, label]) => {
              const count = statusCounts[key] || 0;
              const pct = sceneCount > 0 ? (count / sceneCount) * 100 : 0;
              return (
                <div key={key} className="flex items-center gap-2 text-xs">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${statusColors[key]}`} />
                  <span className="w-28 truncate text-muted-foreground">{label}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full ${statusColors[key]}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-6 text-right font-mono">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3">INT / EXT Ratio</h4>
          <div className="space-y-2">
            {(["INT", "EXT", "INT/EXT"] as const).map((key) => {
              const count = intExtCounts[key] || 0;
              const pct = sceneCount > 0 ? (count / sceneCount) * 100 : 0;
              const color = key === "INT" ? "bg-sky-500" : key === "EXT" ? "bg-amber-500" : "bg-cyan-500";
              return (
                <div key={key} className="flex items-center gap-2 text-xs">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${color}`} />
                  <span className="w-16 text-muted-foreground">{key}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-6 text-right font-mono">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Time of Day</h4>
          <div className="space-y-2">
            {Object.entries(todCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([key, count]) => {
                const pct = sceneCount > 0 ? (count / sceneCount) * 100 : 0;
                const color =
                  key === "DAY" ? "bg-yellow-500" : key === "NIGHT" ? "bg-indigo-500" : key === "DAWN" ? "bg-orange-500" : key === "DUSK" ? "bg-rose-500" : "bg-zinc-500";
                return (
                  <div key={key} className="flex items-center gap-2 text-xs">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${color}`} />
                    <span className="w-24 truncate text-muted-foreground">{key}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-6 text-right font-mono">{count}</span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Cast Report ──

function CastReport({ characters, scriptTitle }: { characters: CharEntry[]; scriptTitle: string }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"name" | "speeches" | "words" | "pct" | "sceneCount">("speeches");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const sorted = useMemo(() => {
    let list = characters;
    if (search) list = list.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
    return [...list].sort((a, b) => {
      const av = a[sortKey] as number | string;
      const bv = b[sortKey] as number | string;
      const cmp = typeof av === "string" ? (av as string).localeCompare(bv as string) : (av as number) - (bv as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [characters, search, sortKey, sortDir]);

  function exportCast() {
    downloadCSV(
      `${scriptTitle.replace(/\s+/g, "_")}_Cast_Report.csv`,
      ["Character", "Speeches", "Words", "Dialogue %", "Scenes", "Role Tier"],
      sorted.map((c) => [c.name, String(c.speeches), String(c.words), `${c.pct}%`, String(c.sceneCount), c.tier])
    );
  }

  const SortBtn = ({ col, label }: { col: typeof sortKey; label: string }) => (
    <button onClick={() => toggleSort(col)} className="flex items-center gap-1 hover:text-foreground">
      {label}
      <ArrowUpDown className="w-3 h-3" />
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Search character..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-8 text-xs" />
        </div>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={exportCast}>
          <Download className="w-3.5 h-3.5" /> Export CSV
        </Button>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs"><SortBtn col="name" label="Character" /></TableHead>
              <TableHead className="text-xs text-right"><SortBtn col="speeches" label="Speeches" /></TableHead>
              <TableHead className="text-xs text-right"><SortBtn col="words" label="Words" /></TableHead>
              <TableHead className="text-xs text-right"><SortBtn col="pct" label="Dialogue %" /></TableHead>
              <TableHead className="text-xs text-right"><SortBtn col="sceneCount" label="Scenes" /></TableHead>
              <TableHead className="text-xs">Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-sm text-muted-foreground">
                  No characters found.
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((c) => (
                <TableRow key={c.name}>
                  <TableCell className="font-medium text-sm">{c.name}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{c.speeches}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{c.words}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{c.pct}%</TableCell>
                  <TableCell className="text-right font-mono text-sm">{c.sceneCount}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${tierColors[c.tier] || ""}`}>{c.tier}</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ── Location Report ──

function LocationReport({ locations, scriptTitle }: { locations: LocEntry[]; scriptTitle: string }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<keyof LocEntry>("sceneCount");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const toggleSort = (key: keyof LocEntry) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const sorted = useMemo(() => {
    let list = locations;
    if (search) list = list.filter((l) => l.location.toLowerCase().includes(search.toLowerCase()));
    return [...list].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [locations, search, sortKey, sortDir]);

  function exportLoc() {
    downloadCSV(
      `${scriptTitle.replace(/\s+/g, "_")}_Location_Report.csv`,
      ["Location", "Scenes", "Pages", "INT", "EXT", "Day", "Night"],
      sorted.map((l) => [l.location, String(l.sceneCount), String(l.totalPages), String(l.intCount), String(l.extCount), String(l.dayCount), String(l.nightCount)])
    );
  }

  const SortBtn = ({ col, label }: { col: keyof LocEntry; label: string }) => (
    <button onClick={() => toggleSort(col)} className="flex items-center gap-1 hover:text-foreground">
      {label}
      <ArrowUpDown className="w-3 h-3" />
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Search location..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-8 text-xs" />
        </div>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={exportLoc}>
          <Download className="w-3.5 h-3.5" /> Export CSV
        </Button>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs"><SortBtn col="location" label="Location" /></TableHead>
              <TableHead className="text-xs text-right"><SortBtn col="sceneCount" label="Scenes" /></TableHead>
              <TableHead className="text-xs text-right"><SortBtn col="totalPages" label="Pages" /></TableHead>
              <TableHead className="text-xs text-right"><SortBtn col="intCount" label="INT" /></TableHead>
              <TableHead className="text-xs text-right"><SortBtn col="extCount" label="EXT" /></TableHead>
              <TableHead className="text-xs text-right"><SortBtn col="dayCount" label="Day" /></TableHead>
              <TableHead className="text-xs text-right"><SortBtn col="nightCount" label="Night" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">
                  No locations found.
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((l) => (
                <TableRow key={l.location}>
                  <TableCell className="font-medium text-sm">{l.location}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{l.sceneCount}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{l.totalPages}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{l.intCount}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{l.extCount}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{l.dayCount}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{l.nightCount}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ── Dialogue Report ──

function DialogueReport({
  characters,
  scenes,
  blocks,
  scriptTitle,
}: {
  characters: CharEntry[];
  scenes: ScriptScene[];
  blocks: ScriptBlock[];
  scriptTitle: string;
}) {
  const [search, setSearch] = useState("");
  const [charFilter, setCharFilter] = useState("all");
  const [view, setView] = useState<"character" | "scene">("character");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpand = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const filteredChars = useMemo(() => {
    let list = characters;
    if (charFilter !== "all") list = list.filter((c) => c.name === charFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list
        .map((c) => ({
          ...c,
          dialogues: c.dialogues.filter(
            (d) =>
              d.text.toLowerCase().includes(q) ||
              d.sceneNumber.toLowerCase().includes(q) ||
              c.name.toLowerCase().includes(q)
          ),
        }))
        .filter((c) => c.dialogues.length > 0);
    }
    return list;
  }, [characters, charFilter, search]);

  const sceneDialogues = useMemo(() => {
    const result: { sceneNumber: string; heading: string; lines: { character: string; text: string; parenthetical?: string }[] }[] = [];
    let currentScene: (typeof result)[0] | null = null;
    let activeChar: string | null = null;
    let activeParen: string | null = null;

    for (const b of blocks) {
      if (b.type === "scene_heading") {
        const found = scenes.find((s) => s.blockIds.includes(b.id));
        currentScene = { sceneNumber: found?.number || "?", heading: b.text, lines: [] };
        result.push(currentScene);
        activeChar = null;
        activeParen = null;
      } else if (b.type === "character") {
        activeChar = b.text.replace(/\s*\([^)]*\)/g, "").trim().toUpperCase();
        activeParen = null;
      } else if (b.type === "parenthetical") {
        activeParen = b.text;
      } else if (b.type === "dialogue" && activeChar && currentScene) {
        if (charFilter !== "all" && activeChar !== charFilter) { activeParen = null; continue; }
        if (search && !b.text.toLowerCase().includes(search.toLowerCase()) && !activeChar.toLowerCase().includes(search.toLowerCase())) {
          activeParen = null;
          continue;
        }
        currentScene.lines.push({ character: activeChar, text: b.text, parenthetical: activeParen || undefined });
        activeParen = null;
      } else {
        activeChar = null;
        activeParen = null;
      }
    }
    return result.filter((s) => s.lines.length > 0);
  }, [blocks, scenes, charFilter, search]);

  function exportDialogue() {
    const rows: string[][] = [];
    for (const c of filteredChars) {
      for (const d of c.dialogues) {
        rows.push([c.name, `Sc. ${d.sceneNumber}`, d.parenthetical || "", d.text]);
      }
    }
    downloadCSV(
      `${scriptTitle.replace(/\s+/g, "_")}_Dialogue_Report.csv`,
      ["Character", "Scene", "Parenthetical", "Dialogue"],
      rows
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Search dialogue..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-8 text-xs" />
        </div>
        <Select value={charFilter} onValueChange={setCharFilter}>
          <SelectTrigger className="w-[180px] h-8 text-xs"><SelectValue placeholder="Character" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Characters</SelectItem>
            {characters.map((c) => (
              <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          <Button size="sm" variant={view === "character" ? "default" : "outline"} className="text-xs h-8" onClick={() => setView("character")}>
            By Character
          </Button>
          <Button size="sm" variant={view === "scene" ? "default" : "outline"} className="text-xs h-8" onClick={() => setView("scene")}>
            By Scene
          </Button>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8 ml-auto" onClick={exportDialogue}>
          <Download className="w-3.5 h-3.5" /> Export CSV
        </Button>
      </div>

      {view === "character" ? (
        <div className="space-y-2">
          {filteredChars.length === 0 && (
            <p className="text-center py-8 text-sm text-muted-foreground">No dialogues found.</p>
          )}
          {filteredChars.map((c) => {
            const isOpen = expanded.has(c.name);
            return (
              <div key={c.name} className="rounded-xl border bg-card overflow-hidden">
                <button
                  onClick={() => toggleExpand(c.name)}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    <span className="font-semibold text-sm">{c.name}</span>
                    <Badge variant="outline" className={`text-[10px] ${tierColors[c.tier] || ""}`}>{c.tier}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{c.dialogues.length} lines</span>
                </button>
                {isOpen && (
                  <div className="border-t divide-y max-h-[400px] overflow-y-auto">
                    {c.dialogues.map((d, i) => (
                      <div key={i} className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <span className="font-mono font-semibold text-amber-500">Sc. {d.sceneNumber}</span>
                          <span className="truncate">{d.sceneHeading}</span>
                        </div>
                        {d.parenthetical && <p className="text-xs italic text-muted-foreground">{d.parenthetical}</p>}
                        <p className="text-foreground">&ldquo;{d.text}&rdquo;</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {sceneDialogues.length === 0 && (
            <p className="text-center py-8 text-sm text-muted-foreground">No dialogues found.</p>
          )}
          {sceneDialogues.map((s) => {
            const isOpen = expanded.has(`scene-${s.sceneNumber}`);
            return (
              <div key={s.sceneNumber} className="rounded-xl border bg-card overflow-hidden">
                <button
                  onClick={() => toggleExpand(`scene-${s.sceneNumber}`)}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    <span className="font-mono font-semibold text-amber-500 text-sm">Sc. {s.sceneNumber}</span>
                    <span className="text-sm truncate max-w-xs">{s.heading}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{s.lines.length} lines</span>
                </button>
                {isOpen && (
                  <div className="border-t divide-y max-h-[400px] overflow-y-auto">
                    {s.lines.map((l, i) => (
                      <div key={i} className="px-4 py-3 text-sm">
                        <span className="text-xs font-bold uppercase text-foreground">{l.character}</span>
                        {l.parenthetical && <span className="text-xs italic text-muted-foreground ml-2">{l.parenthetical}</span>}
                        <p className="text-foreground mt-0.5">&ldquo;{l.text}&rdquo;</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Prop Report ──

function PropReport({ props, scriptTitle }: { props: PropEntry[]; scriptTitle: string }) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");

  const filtered = useMemo(() => {
    let list = props;
    if (catFilter !== "all") list = list.filter((p) => p.category === catFilter);
    if (search) list = list.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [props, search, catFilter]);

  function exportProps() {
    downloadCSV(
      `${scriptTitle.replace(/\s+/g, "_")}_Prop_Report.csv`,
      ["Item", "Category", "Scene Appearances", "Notes"],
      filtered.map((p) => [p.name, p.category, p.sceneAppearances.join(", "), p.notes.join("; ")])
    );
  }

  const catColors: Record<string, string> = {
    prop: "bg-blue-500/15 text-blue-400",
    costume: "bg-pink-500/15 text-pink-400",
    vehicle: "bg-cyan-500/15 text-cyan-400",
    special: "bg-amber-500/15 text-amber-400",
    vfx: "bg-violet-500/15 text-violet-400",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Search item..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-8 text-xs" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="prop">Props</SelectItem>
            <SelectItem value="costume">Costumes</SelectItem>
            <SelectItem value="vehicle">Vehicles</SelectItem>
            <SelectItem value="special">Special</SelectItem>
            <SelectItem value="vfx">VFX</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8 ml-auto" onClick={exportProps}>
          <Download className="w-3.5 h-3.5" /> Export CSV
        </Button>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Item</TableHead>
              <TableHead className="text-xs">Category</TableHead>
              <TableHead className="text-xs">Scene Appearances</TableHead>
              <TableHead className="text-xs">Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-sm text-muted-foreground">
                  No breakdown items found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p, i) => (
                <TableRow key={`${p.category}-${p.name}-${i}`}>
                  <TableCell className="font-medium text-sm">{p.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] capitalize ${catColors[p.category] || ""}`}>{p.category}</Badge>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {p.sceneAppearances.map((s) => `Sc. ${s}`).join(", ")}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                    {p.notes.join("; ") || "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Showing {filtered.length} of {props.length} item{props.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
