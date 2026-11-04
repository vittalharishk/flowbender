"use client";

import { useState, useMemo } from "react";
import {
  Music,
  Video,
  ImageIcon,
  Users,
  MapPin,
  Package,
  Plus,
  Pencil,
  Trash2,
  Search,
  Tag,
  ExternalLink,
  Eye,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addReference, updateReference, removeReference } from "@/lib/script-store";
import type { Script, ScriptReference, ReferenceCategory } from "@/lib/types";

interface Props {
  scriptId: string;
  script: Script;
}

const categories: { key: ReferenceCategory | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "audio", label: "Audio" },
  { key: "video", label: "Video" },
  { key: "image", label: "Image" },
  { key: "character", label: "Character" },
  { key: "location", label: "Location" },
  { key: "prop", label: "Prop" },
];

const categoryIcons: Record<ReferenceCategory, typeof Music> = {
  audio: Music,
  video: Video,
  image: ImageIcon,
  character: Users,
  location: MapPin,
  prop: Package,
};

const categoryColors: Record<ReferenceCategory, string> = {
  audio: "bg-violet-500/15 text-violet-400 border-violet-500/20",
  video: "bg-red-500/15 text-red-400 border-red-500/20",
  image: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  character: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  location: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  prop: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
};

const categoryDotColors: Record<ReferenceCategory, string> = {
  audio: "bg-violet-400",
  video: "bg-red-400",
  image: "bg-blue-400",
  character: "bg-amber-400",
  location: "bg-emerald-400",
  prop: "bg-cyan-400",
};

interface FormState {
  category: ReferenceCategory;
  title: string;
  description: string;
  url: string;
  linkedSceneNumbers: string;
  linkedCharacters: string;
  tags: string;
  notes: string;
}

const emptyForm: FormState = {
  category: "image",
  title: "",
  description: "",
  url: "",
  linkedSceneNumbers: "",
  linkedCharacters: "",
  tags: "",
  notes: "",
};

export function ReferencesTab({ scriptId, script }: Props) {
  const refs = script.references ?? [];
  const [activeCategory, setActiveCategory] = useState<ReferenceCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [sceneFilter, setSceneFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingRef, setEditingRef] = useState<ScriptReference | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const filtered = useMemo(() => {
    let results = refs;
    if (activeCategory !== "all") {
      results = results.filter((r) => r.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (sceneFilter !== "all") {
      results = results.filter((r) => r.linkedSceneIds.includes(sceneFilter));
    }
    return results;
  }, [refs, activeCategory, search, sceneFilter]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: refs.length };
    for (const cat of categories) {
      if (cat.key !== "all") {
        counts[cat.key] = refs.filter((r) => r.category === cat.key).length;
      }
    }
    return counts;
  }, [refs]);

  function sceneNumbersToIds(numbers: string): string[] {
    return numbers
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean)
      .map((num) => {
        const scene = script.scenes.find((s) => s.number === num);
        return scene?.id;
      })
      .filter(Boolean) as string[];
  }

  function sceneIdsToNumbers(ids: string[]): string {
    return ids
      .map((id) => {
        const scene = script.scenes.find((s) => s.id === id);
        return scene?.number;
      })
      .filter(Boolean)
      .join(", ");
  }

  function openAddDialog() {
    setForm(emptyForm);
    setEditingRef(null);
    setShowAddDialog(true);
  }

  function openEditDialog(ref: ScriptReference) {
    setForm({
      category: ref.category,
      title: ref.title,
      description: ref.description,
      url: ref.url,
      linkedSceneNumbers: sceneIdsToNumbers(ref.linkedSceneIds),
      linkedCharacters: ref.linkedCharacters.join(", "),
      tags: ref.tags.join(", "),
      notes: ref.notes,
    });
    setEditingRef(ref);
    setShowAddDialog(true);
  }

  function handleSave() {
    if (!form.title.trim()) return;

    const payload = {
      category: form.category,
      title: form.title.trim(),
      description: form.description.trim(),
      url: form.url.trim(),
      linkedSceneIds: sceneNumbersToIds(form.linkedSceneNumbers),
      linkedCharacters: form.linkedCharacters
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      notes: form.notes.trim(),
    };

    if (editingRef) {
      updateReference(scriptId, editingRef.id, payload);
    } else {
      addReference(scriptId, payload);
    }

    setShowAddDialog(false);
    setEditingRef(null);
    setForm(emptyForm);
  }

  function handleDelete(refId: string) {
    if (window.confirm("Delete this reference?")) {
      removeReference(scriptId, refId);
      if (expandedId === refId) setExpandedId(null);
    }
  }

  function getSceneHeading(sceneId: string) {
    const scene = script.scenes.find((s) => s.id === sceneId);
    return scene ? `Sc. ${scene.number} — ${scene.heading}` : sceneId;
  }

  return (
    <section className="space-y-5">
      {/* Category sub-tabs */}
      <div className="flex gap-1 overflow-auto border-b pb-px">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`whitespace-nowrap border-b-2 px-3 py-2 text-xs font-medium transition-colors ${
              activeCategory === cat.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat.label}
            <span className="ml-1.5 text-[10px] opacity-60">
              {categoryCounts[cat.key] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search references..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted/40 h-9 text-xs"
          />
        </div>
        <Select value={sceneFilter} onValueChange={setSceneFilter}>
          <SelectTrigger className="w-[200px] h-9 text-xs">
            <SelectValue placeholder="Filter by scene" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Scenes</SelectItem>
            {script.scenes.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                Sc. {s.number} — {s.heading.slice(0, 30)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
          onClick={openAddDialog}
        >
          <Plus className="w-4 h-4" /> Add Reference
        </Button>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState category={activeCategory} onAdd={openAddDialog} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((ref) => {
            const Icon = categoryIcons[ref.category];
            const isExpanded = expandedId === ref.id;
            return (
              <div
                key={ref.id}
                className="rounded-xl border bg-card overflow-hidden"
              >
                <RefImage key={ref.thumbnail || ref.url} src={ref.thumbnail || ref.url} title={ref.title} />
                <div className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${categoryColors[ref.category]}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {ref.title}
                        </p>
                        <Badge
                          variant="outline"
                          className={`text-[10px] mt-0.5 ${categoryColors[ref.category]}`}
                        >
                          {ref.category}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : ref.id)
                        }
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => openEditDialog(ref)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={() => handleDelete(ref.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Description */}
                  {ref.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {ref.description}
                    </p>
                  )}

                  {/* URL */}
                  {ref.url && (
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline truncate max-w-full"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span className="truncate">
                        {ref.url.length > 40
                          ? ref.url.slice(0, 40) + "..."
                          : ref.url}
                      </span>
                    </a>
                  )}

                  {/* Linked scenes */}
                  {ref.linkedSceneIds.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {ref.linkedSceneIds.map((sid) => {
                        const scene = script.scenes.find(
                          (s) => s.id === sid
                        );
                        return scene ? (
                          <span
                            key={sid}
                            className="px-1.5 py-0.5 rounded text-[10px] bg-muted/60 text-muted-foreground"
                          >
                            Sc. {scene.number}
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}

                  {/* Tags */}
                  {ref.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {ref.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-500"
                        >
                          <Tag className="w-2.5 h-2.5" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="pt-3 border-t space-y-2 text-xs">
                      {ref.linkedCharacters.length > 0 && (
                        <div>
                          <span className="text-muted-foreground">
                            Characters:{" "}
                          </span>
                          <span className="font-medium">
                            {ref.linkedCharacters.join(", ")}
                          </span>
                        </div>
                      )}
                      {ref.linkedSceneIds.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-muted-foreground">
                            Linked Scenes:
                          </span>
                          {ref.linkedSceneIds.map((sid) => (
                            <p
                              key={sid}
                              className="pl-2 text-foreground/80"
                            >
                              {getSceneHeading(sid)}
                            </p>
                          ))}
                        </div>
                      )}
                      {ref.notes && (
                        <div>
                          <span className="text-muted-foreground">
                            Notes:{" "}
                          </span>
                          <span className="text-foreground/80">
                            {ref.notes}
                          </span>
                        </div>
                      )}
                      <div className="text-muted-foreground">
                        Added{" "}
                        {new Date(ref.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        {filtered.length} of {refs.length} reference
        {refs.length !== 1 ? "s" : ""}
      </p>

      {/* Add / Edit Dialog */}
      <Dialog
        open={showAddDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false);
            setEditingRef(null);
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRef ? "Edit Reference" : "Add Reference"}
            </DialogTitle>
            <DialogDescription>
              {editingRef
                ? "Update reference details."
                : "Add a reference to this script."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) =>
                  setForm({ ...form, category: v as ReferenceCategory })
                }
              >
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter((c) => c.key !== "all")
                    .map((c) => (
                      <SelectItem key={c.key} value={c.key}>
                        {c.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm({ ...form, title: e.target.value })
                }
                placeholder="Reference title"
                className="text-xs"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Brief description"
                rows={2}
                className="text-xs"
              />
            </div>

            <div>
              <Label>URL</Label>
              <Input
                value={form.url}
                onChange={(e) =>
                  setForm({ ...form, url: e.target.value })
                }
                placeholder="https://..."
                className="text-xs"
              />
            </div>

            <div>
              <Label>Linked Scenes (comma-separated scene numbers)</Label>
              <Input
                value={form.linkedSceneNumbers}
                onChange={(e) =>
                  setForm({
                    ...form,
                    linkedSceneNumbers: e.target.value,
                  })
                }
                placeholder="e.g. 1, 3, 15"
                className="text-xs"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Available: {script.scenes.map((s) => s.number).join(", ")}
              </p>
            </div>

            <div>
              <Label>Linked Characters (comma-separated)</Label>
              <Input
                value={form.linkedCharacters}
                onChange={(e) =>
                  setForm({
                    ...form,
                    linkedCharacters: e.target.value,
                  })
                }
                placeholder="e.g. PUSHPA, SRIVALLI"
                className="text-xs"
              />
            </div>

            <div>
              <Label>Tags (comma-separated)</Label>
              <Input
                value={form.tags}
                onChange={(e) =>
                  setForm({ ...form, tags: e.target.value })
                }
                placeholder="e.g. costume, forest, action"
                className="text-xs"
              />
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) =>
                  setForm({ ...form, notes: e.target.value })
                }
                placeholder="Additional notes"
                rows={2}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setEditingRef(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!form.title.trim()}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {editingRef ? "Update" : "Add"} Reference
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

// Reference photo at the top of a card; hides itself if the image fails to load
function RefImage({ src, title }: { src?: string; title: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return null;
  return (
    <div className="aspect-video bg-muted border-b">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={title}
        loading="lazy"
        onError={() => setFailed(true)}
        className="w-full h-full object-cover"
      />
    </div>
  );
}

function EmptyState({
  category,
  onAdd,
}: {
  category: ReferenceCategory | "all";
  onAdd: () => void;
}) {
  const Icon =
    category !== "all" ? categoryIcons[category] : ImageIcon;
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-muted-foreground" />
      </div>
      <h3 className="font-semibold mb-1">No references</h3>
      <p className="text-sm text-muted-foreground mb-4">
        {category !== "all"
          ? `No ${category} references added yet.`
          : "Add your first reference to start building the library."}
      </p>
      <Button size="sm" onClick={onAdd}>
        <Plus className="mr-2 h-4 w-4" /> Add Reference
      </Button>
    </div>
  );
}
