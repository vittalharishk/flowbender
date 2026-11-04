"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Eye,
  ChevronUp,
  ChevronDown,
  Layers,
  ArrowUpDown,
  Filter,
  EyeOff,
} from "lucide-react";
import type { Script, ScriptScene, IntExt, TimeOfDay, SceneStatus } from "@/lib/types";
import {
  addScriptScene,
  updateScriptScene,
  removeScriptScene,
  reorderScriptScenes,
} from "@/lib/script-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

const PAGE_SIZE = 10;

const statusLabels: Record<SceneStatus, string> = {
  "not-scheduled": "Not Scheduled",
  scheduled: "Scheduled",
  shot: "Shot",
  "partially-shot": "Partially Shot",
  "reshoot-required": "Reshoot Required",
};

const statusColors: Record<SceneStatus, string> = {
  "not-scheduled": "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  scheduled: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  shot: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "partially-shot": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "reshoot-required": "bg-red-500/10 text-red-400 border-red-500/20",
};

const intExtOptions: IntExt[] = ["INT", "EXT", "INT/EXT"];
const todOptions: TimeOfDay[] = ["DAY", "NIGHT", "DAWN", "DUSK", "CONTINUOUS", "MAGIC HOUR"];
const statusOptions: SceneStatus[] = ["not-scheduled", "scheduled", "shot", "partially-shot", "reshoot-required"];

type SortKey = "number" | "pages-desc" | "location" | "status";

interface FormState {
  number: string;
  heading: string;
  intExt: IntExt;
  timeOfDay: TimeOfDay;
  location: string;
  pages: string;
  description: string;
  scriptDay: string;
}

const emptyForm: FormState = {
  number: "",
  heading: "",
  intExt: "INT",
  timeOfDay: "DAY",
  location: "",
  pages: "1",
  description: "",
  scriptDay: "",
};

interface Props {
  scriptId: string;
  script: Script;
}

export function ScenesTab({ scriptId, script }: Props) {
  const scenes = script.scenes;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [intExtFilter, setIntExtFilter] = useState("all");
  const [todFilter, setTodFilter] = useState("all");
  const [sort, setSort] = useState<SortKey>("number");
  const [page, setPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState("");

  const [expandedId, setExpandedId] = useState<string | null>(null);

  // KPIs
  const kpis = useMemo(() => {
    const totalPages = scenes.reduce((s, sc) => s + sc.pages, 0);
    const intCount = scenes.filter((s) => s.intExt === "INT" || s.intExt === "INT/EXT").length;
    const extCount = scenes.filter((s) => s.intExt === "EXT" || s.intExt === "INT/EXT").length;
    const dayCount = scenes.filter((s) => s.timeOfDay === "DAY" || s.timeOfDay === "DAWN" || s.timeOfDay === "MAGIC HOUR").length;
    const nightCount = scenes.filter((s) => s.timeOfDay === "NIGHT" || s.timeOfDay === "DUSK").length;
    return { total: scenes.length, totalPages, intCount, extCount, dayCount, nightCount };
  }, [scenes]);

  // Filter + sort
  const filtered = useMemo(() => {
    let result = scenes;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.number.toLowerCase().includes(q) ||
          s.heading.toLowerCase().includes(q) ||
          s.location.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") result = result.filter((s) => s.status === statusFilter);
    if (intExtFilter !== "all") result = result.filter((s) => s.intExt === intExtFilter);
    if (todFilter !== "all") result = result.filter((s) => s.timeOfDay === todFilter);

    result = [...result].sort((a, b) => {
      switch (sort) {
        case "number":
          return a.number.localeCompare(b.number, undefined, { numeric: true, sensitivity: "base" });
        case "pages-desc":
          return b.pages - a.pages;
        case "location":
          return a.location.localeCompare(b.location);
        case "status": {
          const order: SceneStatus[] = ["reshoot-required", "partially-shot", "scheduled", "not-scheduled", "shot"];
          return order.indexOf(a.status) - order.indexOf(b.status);
        }
        default:
          return 0;
      }
    });
    return result;
  }, [scenes, search, statusFilter, intExtFilter, todFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const pageScenes = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setDialogOpen(true);
  }

  function openEdit(scene: ScriptScene) {
    setEditingId(scene.id);
    setForm({
      number: scene.number,
      heading: scene.heading,
      intExt: scene.intExt,
      timeOfDay: scene.timeOfDay,
      location: scene.location,
      pages: String(scene.pages),
      description: scene.description,
      scriptDay: scene.scriptDay,
    });
    setFormError("");
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.number.trim() || !form.heading.trim()) {
      setFormError("Scene number and heading are required.");
      return;
    }
    const pages = Number(form.pages) || 1;
    if (pages < 0) {
      setFormError("Pages must be non-negative.");
      return;
    }

    if (editingId) {
      updateScriptScene(scriptId, editingId, {
        number: form.number.trim(),
        heading: form.heading.trim(),
        intExt: form.intExt,
        timeOfDay: form.timeOfDay,
        location: form.location.trim(),
        pages,
        eighths: Math.round(pages * 8),
        description: form.description.trim(),
        scriptDay: form.scriptDay.trim(),
      });
    } else {
      if (scenes.some((s) => s.number.toLowerCase() === form.number.trim().toLowerCase())) {
        setFormError("This scene number already exists.");
        return;
      }
      addScriptScene(scriptId, {
        number: form.number.trim(),
        heading: form.heading.trim(),
        intExt: form.intExt,
        location: form.location.trim(),
        timeOfDay: form.timeOfDay,
        scriptDay: form.scriptDay.trim(),
        pages,
        eighths: Math.round(pages * 8),
        description: form.description.trim(),
      });
    }
    setDialogOpen(false);
  }

  function handleDelete(sceneId: string) {
    if (window.confirm("Delete this scene? This cannot be undone.")) {
      removeScriptScene(scriptId, sceneId);
      if (expandedId === sceneId) setExpandedId(null);
    }
  }

  function moveScene(sceneId: string, direction: -1 | 1) {
    const ids = scenes.map((s) => s.id);
    const idx = ids.indexOf(sceneId);
    if (idx < 0) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= ids.length) return;
    [ids[idx], ids[newIdx]] = [ids[newIdx], ids[idx]];
    reorderScriptScenes(scriptId, ids);
  }

  return (
    <section className="space-y-5">
      {/* KPI Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiTile label="Total Scenes" value={kpis.total} />
        <KpiTile label="Total Pages" value={kpis.totalPages} />
        <KpiTile label="Interior" value={kpis.intCount} accent />
        <KpiTile label="Exterior" value={kpis.extCount} />
        <KpiTile label="Day Scenes" value={kpis.dayCount} />
        <KpiTile label="Night Scenes" value={kpis.nightCount} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search scenes..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-9 bg-muted/40"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-3.5 h-3.5" /> Filters
          </Button>
          <Select value={sort} onValueChange={(v) => { setSort(v as SortKey); setPage(0); }}>
            <SelectTrigger className="w-[150px] h-9 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 mr-1" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="number">Scene Number</SelectItem>
              <SelectItem value="pages-desc">Pages (Longest)</SelectItem>
              <SelectItem value="location">Location</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5" onClick={openAdd}>
            <Plus className="w-4 h-4" /> Add Scene
          </Button>
        </div>
      </div>

      {/* Filter row */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 p-3 rounded-lg border bg-muted/20">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
            <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {statusOptions.map((s) => (
                <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={intExtFilter} onValueChange={(v) => { setIntExtFilter(v); setPage(0); }}>
            <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue placeholder="INT/EXT" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {intExtOptions.map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={todFilter} onValueChange={(v) => { setTodFilter(v); setPage(0); }}>
            <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue placeholder="Time of Day" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Times</SelectItem>
              {todOptions.map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => { setStatusFilter("all"); setIntExtFilter("all"); setTodFilter("all"); setPage(0); }}
          >
            Clear All
          </Button>
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border bg-card">
          <Layers className="w-10 h-10 text-muted-foreground mb-3" />
          <h3 className="font-semibold mb-1">No scenes found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {search || statusFilter !== "all" ? "Try adjusting your search or filters." : "Add your first scene to get started."}
          </p>
          <Button size="sm" onClick={openAdd} className="bg-amber-600 hover:bg-amber-700 text-white">
            <Plus className="w-4 h-4 mr-1.5" /> Add Scene
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-[70px] text-xs">Scene #</TableHead>
                <TableHead className="text-xs">Heading</TableHead>
                <TableHead className="w-[80px] text-xs">INT/EXT</TableHead>
                <TableHead className="w-[90px] text-xs">Day/Night</TableHead>
                <TableHead className="text-xs">Location</TableHead>
                <TableHead className="w-[60px] text-xs text-right">Pages</TableHead>
                <TableHead className="w-[130px] text-xs">Status</TableHead>
                <TableHead className="w-[180px] text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageScenes.map((scene, idx) => {
                const globalIdx = scenes.findIndex((s) => s.id === scene.id);
                const isExpanded = expandedId === scene.id;

                return (
                  <>
                    <TableRow key={scene.id} className={isExpanded ? "border-b-0" : ""}>
                      <TableCell className="font-mono font-bold text-sm text-primary">
                        {scene.number}
                      </TableCell>
                      <TableCell className="font-medium text-sm max-w-[200px] truncate">
                        {scene.heading}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{scene.intExt}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{scene.timeOfDay}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate">
                        {scene.location || "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{scene.pages}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusColors[scene.status]}`}>
                          {statusLabels[scene.status]}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => moveScene(scene.id, -1)}
                            disabled={globalIdx === 0}
                          >
                            <ChevronUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => moveScene(scene.id, 1)}
                            disabled={globalIdx === scenes.length - 1}
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => setExpandedId(isExpanded ? null : scene.id)}
                          >
                            {isExpanded ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(scene)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(scene.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expanded detail row */}
                    {isExpanded && (
                      <TableRow key={`${scene.id}-detail`} className="bg-muted/20">
                        <TableCell colSpan={8} className="p-4">
                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Description</p>
                              <p className="text-sm text-foreground">{scene.description || "No description"}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Script Day</p>
                              <p className="text-sm">{scene.scriptDay || "—"}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Page Eighths</p>
                              <p className="text-sm font-mono">{scene.eighths}/8</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Breakdown Items</p>
                              <p className="text-sm">{scene.breakdown.length} item{scene.breakdown.length !== 1 ? "s" : ""}</p>
                              {scene.breakdown.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {scene.breakdown.map((b) => (
                                    <Badge key={b.id} variant="secondary" className="text-[10px]">{b.name}</Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Script Blocks</p>
                              <p className="text-sm">{scene.blockIds.length} block{scene.blockIds.length !== 1 ? "s" : ""}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Status</p>
                              <Select
                                value={scene.status}
                                onValueChange={(v) => updateScriptScene(scriptId, scene.id, { status: v as SceneStatus })}
                              >
                                <SelectTrigger className="h-8 w-[170px] text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {statusOptions.map((s) => (
                                    <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Page {currentPage + 1} of {totalPages} · {filtered.length} scene{filtered.length !== 1 ? "s" : ""}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 0}
                  onClick={() => setPage(currentPage - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages - 1}
                  onClick={() => setPage(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Scene" : "Add Scene"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Update the scene details below." : "Fill in the scene details to add it to the script."}
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{formError}</p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Scene Number *</Label>
              <Input
                value={form.number}
                onChange={(e) => setForm({ ...form, number: e.target.value })}
                placeholder="e.g. 4A"
              />
            </div>
            <div>
              <Label className="text-xs">INT / EXT</Label>
              <Select value={form.intExt} onValueChange={(v) => setForm({ ...form, intExt: v as IntExt })}>
                <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {intExtOptions.map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">Heading *</Label>
              <Input
                value={form.heading}
                onChange={(e) => setForm({ ...form, heading: e.target.value })}
                placeholder="e.g. OLD HOUSE - NIGHT"
              />
            </div>
            <div>
              <Label className="text-xs">Time of Day</Label>
              <Select value={form.timeOfDay} onValueChange={(v) => setForm({ ...form, timeOfDay: v as TimeOfDay })}>
                <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {todOptions.map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Location</Label>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Studio / Practical"
              />
            </div>
            <div>
              <Label className="text-xs">Pages</Label>
              <Input
                type="number"
                step="0.125"
                min="0"
                value={form.pages}
                onChange={(e) => setForm({ ...form, pages: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Script Day</Label>
              <Input
                value={form.scriptDay}
                onChange={(e) => setForm({ ...form, scriptDay: e.target.value })}
                placeholder="e.g. Day 3"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="Scene synopsis or notes..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={handleSave}>
              {editingId ? "Save Changes" : "Add Scene"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function KpiTile({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-lg border bg-card p-3 text-center">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accent ? "text-amber-500" : ""}`}>{value}</p>
    </div>
  );
}
