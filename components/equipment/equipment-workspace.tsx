"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  Package,
  Search,
  ShoppingCart,
  Wrench,
  Camera,
  Mic2,
  Lightbulb,
  Boxes,
  Monitor,
  Radio,
  Sparkles,
  Shirt,
  Scissors,
  LayoutGrid,
  List,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  X,
  Phone,
  Building2,
  Check,
  Calendar,
  Layers,
  Pencil,
  Trash2,
} from "lucide-react";
import { updateAppDataSlice, useAppDataSlice } from "@/lib/app-data-store";
import { useProjects } from "@/lib/project-store";
import type { EquipmentItem } from "@/lib/types";
import { ProjectContextSelector } from "@/components/app/project-context-selector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  getEquipmentImage,
  getEquipmentFallback,
} from "@/lib/equipment-image-references";

const statusLabels: Record<string, string> = {
  available: "Available",
  reserved: "Reserved",
  "in-use": "In use",
  maintenance: "Maintenance",
};

const statusBadgeVariants: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  available: {
    bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-500/20",
  },
  reserved: {
    bg: "bg-blue-500/10 dark:bg-blue-500/20",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-500/20",
  },
  "in-use": {
    bg: "bg-violet-500/10 dark:bg-violet-500/20",
    text: "text-violet-700 dark:text-violet-300",
    border: "border-violet-500/20",
  },
  maintenance: {
    bg: "bg-amber-500/10 dark:bg-amber-500/20",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-500/20",
  },
};

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  camera: Camera,
  lighting: Lightbulb,
  sound: Mic2,
  grip: Boxes,
  props: Sparkles,
  art: Sparkles,
  costume: Shirt,
  makeup: Scissors,
  monitoring: Monitor,
  communication: Radio,
  power: Wrench,
  default: Package,
};

export function EquipmentWorkspace({ projectId: scopedProjectId }: { projectId?: string }) {
  const projects = useProjects();
  const equipment = useAppDataSlice("equipmentInventory");
  const vendors = useAppDataSlice("vendors");

  const [projectFilter, setProjectId] = useState("all");
  const projectId = scopedProjectId ?? projectFilter;
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [mode, setMode] = useState<"inventory" | "requirements">("inventory");
  const [viewLayout, setViewLayout] = useState<"grid" | "table">("grid");
  const [pageSize, setPageSize] = useState<number | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isGlanceOpen, setIsGlanceOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    category: "camera",
    quantity: "1",
    projectId: scopedProjectId ?? "shared",
    notes: "",
    imageUrl: "",
  });

  const scopedEquipment = useMemo(() => equipment.filter((item) => projectId === "all" || (projectId === "shared" ? !item.projectId : item.projectId === projectId)), [equipment, projectId]);
  const filteredEquipment = useMemo(() => {
    return scopedEquipment.filter((item) => {
      const categoryMatch =
        category === "all"
          ? true
          : category === "other"
            ? !["camera", "lighting", "sound", "grip", "props", "art", "monitoring", "costume"].includes(
                item.category.toLowerCase()
              )
            : item.category.toLowerCase() === category.toLowerCase();

      const searchTerms = `${item.name} ${item.category} ${item.notes ?? ""}`.toLowerCase();
      const queryMatch = searchTerms.includes(query.toLowerCase());

      return categoryMatch && queryMatch && (mode === "inventory" || item.status !== "available");
    });
  }, [scopedEquipment, category, query, mode]);

  // Pagination calculation
  const totalItems = filteredEquipment.length;
  const effectivePageSize = pageSize === "all" ? totalItems : pageSize;
  const totalPages = Math.max(1, Math.ceil(totalItems / (effectivePageSize || 1)));
  const pageIndex = Math.min(currentPage, totalPages);
  const startIndex = pageSize === "all" ? 0 : (pageIndex - 1) * effectivePageSize;
  const visible =
    pageSize === "all"
      ? filteredEquipment
      : filteredEquipment.slice(startIndex, startIndex + effectivePageSize);

  const selectedItem =
    visible.find((item) => item.id === selectedId) ??
    visible[0];

  // Count each inventory record once. Quantity remains visible on each card.
  const stats = useMemo(() => {
    let totalItems = 0;
    let availableItems = 0;
    let bookedItems = 0;
    let maintenanceItems = 0;

    for (const item of filteredEquipment) {
      totalItems += 1;
      if (item.status === "available") {
        availableItems += 1;
      } else if (item.status === "reserved" || item.status === "in-use") {
        bookedItems += 1;
      } else if (item.status === "maintenance") {
        maintenanceItems += 1;
      }
    }

    return {
      totalItems,
      availableItems,
      bookedItems,
      maintenanceItems,
    };
  }, [filteredEquipment]);

  // Unique categories list with item counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    scopedEquipment.forEach((item) => {
      const cat = item.category.toLowerCase();
      counts[cat] = (counts[cat] ?? 0) + 1;
    });
    return counts;
  }, [scopedEquipment]);

  const openGlance = (itemId: string) => {
    setSelectedId(itemId);
    setIsGlanceOpen(true);
  };

  const handleStartEdit = (item: EquipmentItem) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      category: item.category,
      quantity: String(item.quantity),
      projectId: item.projectId ?? (scopedProjectId ? scopedProjectId : "shared"),
      notes: item.notes ?? "",
      imageUrl: item.imageUrl ?? "",
    });
    setFormError("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteItem = (item: EquipmentItem) => {
    if (window.confirm(`Delete "${item.name}" from equipment inventory?`)) {
      updateAppDataSlice("equipmentInventory", (items) =>
        items.filter((curr) => curr.id !== item.id)
      );
      if (editingId === item.id) {
        setShowForm(false);
        setEditingId(null);
      }
      if (isGlanceOpen && selectedId === item.id) {
        setIsGlanceOpen(false);
      }
      setMessage(`Equipment "${item.name}" was removed.`);
    }
  };

  if (scopedProjectId && !projects.some((project) => project.id === scopedProjectId)) return <p>Project not found.</p>;

  return (
    <div className="min-w-0 space-y-6">
      {scopedProjectId && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"><p className="text-sm font-medium">Equipment project context</p><ProjectContextSelector projectId={scopedProjectId} /></div>}
      <p className="text-sm text-muted-foreground">Seeded inventory and assignments are fictional demo data. Images are illustrative references, not verified asset photographs. Status changes are local records, not rental orders.</p>
      {message && <p role="status" className="text-sm text-emerald-600">{message}</p>}
      {/* Top Banner */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Production Equipment Inventory & Requirements
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Equipment Packages & Gear Register
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Complete visual register of all camera, lighting, sound, grip, props, and field gear across active productions.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectedItem && (
            <button
              onClick={() => setIsGlanceOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border bg-background px-3.5 py-2 text-sm font-semibold shadow-xs hover:bg-muted transition-all"
            >
              <Eye className="h-4 w-4 text-primary" /> View at a glance
            </button>
          )}
          {selectedItem && <button className="rounded-lg border px-3 py-2 text-sm" onClick={() => { setEditingId(selectedItem.id); setForm({ name: selectedItem.name, category: selectedItem.category, quantity: String(selectedItem.quantity), projectId: selectedItem.projectId ?? "shared", notes: selectedItem.notes ?? "", imageUrl: selectedItem.imageUrl ?? "" }); setFormError(""); setShowForm(true); }}>Edit equipment</button>}
          <button
            onClick={() => { setEditingId(null); setFormError(""); setForm({ name: "", category: "camera", quantity: "1", projectId: projectId === "all" ? "shared" : projectId, notes: "", imageUrl: "" }); setShowForm(true); }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all"
          >
            <ShoppingCart className="h-4 w-4" /> Add requirement
          </button>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <Card className="border-primary/40 shadow-lg bg-card/95 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" /> {editingId ? "Edit Equipment" : "Add Equipment Requirement"}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Add a camera body, lighting kit, audio package, or custom gear needed for upcoming shoot blocks.
            </p>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                const name = form.name.trim();
                const quantity = Number(form.quantity);
                if (!name || !Number.isSafeInteger(quantity) || quantity < 1) { setFormError("Enter an equipment name and a positive whole-number quantity."); return; }
                if (form.projectId !== "shared" && !projects.some((project) => project.id === form.projectId)) { setFormError("Choose an existing production assignment."); return; }

                const customImageUrl = form.imageUrl.trim() || undefined;
                if (customImageUrl) {
                  try { const url = new URL(customImageUrl); if (!["https:", "http:"].includes(url.protocol)) throw new Error(); }
                  catch { setFormError("Image URL must be a valid HTTP or HTTPS address."); return; }
                }
                const previous = equipment.find((item) => item.id === editingId);
                if (editingId && !previous) { setFormError("This equipment was removed. Add a new requirement instead."); return; }

                const record = {
                    ...previous,
                    id: editingId ?? `equipment-${crypto.randomUUID()}`,
                    name,
                    category: form.category,
                    quantity,
                    status: previous?.status ?? "reserved" as const,
                    projectId:
                      form.projectId === "shared" ? undefined : form.projectId,
                    notes:
                      form.notes.trim() || "Added as a production requirement.",
                    imageUrl:
                      customImageUrl ??
                      getEquipmentImage({ name, category: form.category }),
                  };
                updateAppDataSlice("equipmentInventory", (items) => editingId ? items.map((item) => item.id === editingId ? record : item) : [...items, record]);

                setForm({
                  name: "",
                  category: "camera",
                  quantity: "1",
                  projectId: scopedProjectId ?? "shared",
                  notes: "",
                  imageUrl: "",
                });
                setShowForm(false);
                setEditingId(null);
                setMessage("Equipment saved locally. No rental or purchase order was placed.");
                if (!scopedProjectId) setProjectId(form.projectId);
                setCategory("all"); setQuery(""); setCurrentPage(1);
                setSelectedId(record.id);
                setMode(record.status === "available" ? "inventory" : "requirements");
              }}
            >
              <label className="space-y-1 text-sm font-medium">
                Equipment name
                <Input
                  required
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  placeholder="e.g. Sony FX3 B-Cam, Astera Titan Tube 8-Kit"
                />
              </label>

              <label className="space-y-1 text-sm font-medium">
                Category
                <select
                  value={form.category}
                  onChange={(event) =>
                    setForm({ ...form, category: event.target.value })
                  }
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="camera">camera</option>
                  <option value="lighting">lighting</option>
                  <option value="sound">sound</option>
                  <option value="grip">grip</option>
                  <option value="props">props</option>
                  <option value="art">art</option>
                  <option value="costume">costume</option>
                  <option value="makeup">makeup</option>
                  <option value="monitoring">monitoring</option>
                  <option value="communication">communication</option>
                  <option value="power">power</option>
                  <option value="protection">protection</option>
                  <option value="special effects">special effects</option>
                  <option value="other">other</option>
                </select>
              </label>

              <label className="space-y-1 text-sm font-medium">
                Quantity
                <Input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={form.quantity}
                  onChange={(event) =>
                    setForm({ ...form, quantity: event.target.value })
                  }
                />
              </label>

              <label className="space-y-1 text-sm font-medium">
                Production assignment
                <select
                  value={form.projectId}
                  disabled={!!scopedProjectId}
                  onChange={(event) =>
                    setForm({ ...form, projectId: event.target.value })
                  }
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="shared">Shared inventory (Across productions)</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1 text-sm font-medium sm:col-span-2">
                Image reference URL (Optional)
                <Input
                  value={form.imageUrl}
                  onChange={(event) =>
                    setForm({ ...form, imageUrl: event.target.value })
                  }
                  type="url"
                  placeholder="https://example.com/reference.jpg (optional)"
                />
                {form.imageUrl && (
                  <div className="mt-2 flex items-center gap-3 rounded-lg border p-2 bg-muted/30">
                    <img
                      src={form.imageUrl}
                      alt="Preview"
                      className="h-12 w-16 object-cover rounded"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <span className="text-xs text-muted-foreground">
                      Live image preview
                    </span>
                  </div>
                )}
              </label>

              <label className="space-y-1 text-sm font-medium sm:col-span-2">
                Notes & sourcing specs
                <Input
                  value={form.notes}
                  onChange={(event) =>
                    setForm({ ...form, notes: event.target.value })
                  }
                  placeholder="Vendor contact, scene number, shoot day, or technical requirements"
                />
              </label>

              {formError && <p role="alert" className="text-sm text-red-500 sm:col-span-2">{formError}</p>}
              <div className="flex flex-wrap justify-end gap-2 sm:col-span-2 pt-2">
                {editingId && <button type="button" className="rounded-lg border px-4 py-2 text-sm text-red-500" onClick={() => { if (window.confirm("Delete this local equipment record?")) { updateAppDataSlice("equipmentInventory", (items) => items.filter((item) => item.id !== editingId)); setShowForm(false); setEditingId(null); setMessage("Equipment record deleted locally."); } }}>Delete equipment</button>}
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow"
                >
                  {editingId ? "Save equipment" : "Save requirement"}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Summary Header using the actual physical equipment quantities */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Inventory Totals & Readiness
          </p>
        </div>

        {/* Summary KPI cards count each equipment record once. */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            icon={Package}
            label="Equipment present"
            mainValue={stats.totalItems}
            unitSuffix="items"
            subtext="One count per equipment record"
          />
          <SummaryCard
            icon={CheckCircle2}
            label="Available now"
            mainValue={stats.availableItems}
            unitSuffix="items"
            subtext="Ready to use"
            tone="text-emerald-600 dark:text-emerald-400"
          />
          <SummaryCard
            icon={ClipboardList}
            label="Booked / In use"
            mainValue={stats.bookedItems}
            unitSuffix="items"
            subtext="Reserved or assigned"
            tone="text-blue-600 dark:text-blue-400"
          />
          <SummaryCard
            icon={Wrench}
            label="Needs maintenance"
            mainValue={stats.maintenanceItems}
            unitSuffix="items"
            subtext="Under repair or servicing"
            tone="text-amber-600 dark:text-amber-400"
          />
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex flex-wrap items-center gap-2 border-b pb-3 text-sm font-medium overflow-x-auto">
        <button
          onClick={() => {
            setCategory("all");
            setCurrentPage(1);
          }}
          className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            category === "all"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          <Filter className="h-3 w-3" />
          All gear ({scopedEquipment.length})
        </button>

        {[
          "camera",
          "lighting",
          "sound",
          "grip",
          "props",
          "art",
          "monitoring",
          "costume",
          "other",
        ].map((tabCategory) => {
          const count =
            tabCategory === "other"
              ? scopedEquipment.filter(
                  (item) =>
                    ![
                      "camera",
                      "lighting",
                      "sound",
                      "grip",
                      "props",
                      "art",
                      "monitoring",
                      "costume",
                    ].includes(item.category.toLowerCase())
                ).length
              : categoryCounts[tabCategory] ?? 0;

          const Icon = categoryIcons[tabCategory] ?? categoryIcons.default;

          return (
            <button
              key={tabCategory}
              onClick={() => {
                setCategory(tabCategory);
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                category === tabCategory
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3 w-3" />
              {tabCategory} ({count})
            </button>
          );
        })}
      </div>

      {/* Controls Bar: Inventory/Requirements, Project filter, Search, Layout toggle, Page Size */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1 rounded-lg bg-muted p-1">
              <button
                onClick={() => { setMode("inventory"); setCurrentPage(1); }}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  mode === "inventory"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                What we have
              </button>
              <button
                onClick={() => { setMode("requirements"); setCurrentPage(1); }}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  mode === "requirements"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                What we need
              </button>
            </div>

            {/* View layout toggle */}
            <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
              <button
                onClick={() => setViewLayout("grid")}
                title="Grid view with glance preview"
                className={`rounded-md p-1.5 transition-colors ${
                  viewLayout === "grid"
                    ? "bg-background shadow-sm text-foreground font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewLayout("table")}
                title="Table view with side glance inspector"
                className={`rounded-md p-1.5 transition-colors ${
                  viewLayout === "table"
                    ? "bg-background shadow-sm text-foreground font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              value={projectId}
              aria-label="Filter equipment by production"
              disabled={!!scopedProjectId}
              onChange={(event) => {
                setProjectId(event.target.value);
                setCurrentPage(1);
              }}
              className="h-9 min-w-0 max-w-full rounded-md border bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All productions</option>
              <option value="shared">Shared inventory</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search equipment by name, category, notes..."
                className="h-9 pl-9 text-xs sm:w-64"
              />
            </div>

            {/* Items per view selector - Accurate dynamically computed labels */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground pl-1">
              <span>View:</span>
              <div className="flex items-center rounded-md border bg-muted/40 p-0.5">
                {[20, 40, "all" as const].map((size) => (
                  <button
                    key={String(size)}
                    onClick={() => {
                      setPageSize(size);
                      setCurrentPage(1);
                    }}
                    className={`rounded px-2 py-1 font-semibold uppercase text-[10px] transition-colors ${
                      pageSize === size
                        ? "bg-background shadow-xs text-foreground font-bold"
                        : "hover:text-foreground"
                    }`}
                  >
                    {size === "all" ? `All (${filteredEquipment.length})` : size}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mode notice */}
      {mode === "requirements" && (
        <Card className="border-primary/20 bg-primary/[.03]">
          <CardContent className="flex items-start gap-3 p-4">
            <ClipboardList className="mt-0.5 h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="font-semibold text-sm">Requirements view</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Reserved, in-use, and maintenance items are active requirements for current productions. Click any item card to inspect its full glance.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Record count and pagination bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/20 px-4 py-2.5 text-xs">
        <span className="text-muted-foreground font-medium">
          Showing <span className="font-bold text-foreground">{visible.length}</span> of{" "}
          <span className="font-bold text-foreground">{filteredEquipment.length}</span> items
          {category !== "all" && ` (filtered by ${category})`}
        </span>

        {pageSize !== "all" && totalPages > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              Page {pageIndex} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={pageIndex <= 1}
                className="rounded p-1 border bg-background hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={pageIndex >= totalPages}
                className="rounded p-1 border bg-background hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main View: Grid View or Table View */}
      {viewLayout === "grid" ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {visible.map((item) => {
              const imageUrl = getEquipmentImage(item);
              const fallbackUrl = getEquipmentFallback(item.category);
              const projectTitle =
                projects.find((p) => p.id === item.projectId)?.title ??
                "Shared inventory";
              const badgeStyle =
                statusBadgeVariants[item.status] ?? statusBadgeVariants.available;
              const isSelected = selectedItem?.id === item.id;

              return (
                <Card
                  key={item.id}
                  onClick={() => openGlance(item.id)}
                  className={`group relative overflow-hidden flex flex-col justify-between border rounded-xl transition-all duration-200 cursor-pointer bg-card hover:shadow-xl hover:border-primary/60 ${
                    isSelected ? "ring-2 ring-primary/60 border-primary shadow-md" : ""
                  }`}
                >
                  <div>
                    {/* Item Image with Fallback, Badges, and Hover Glance Action */}
                    <div className="relative h-44 w-full bg-muted overflow-hidden">
                      <img
                        src={imageUrl}
                        alt={`Authentic image for ${item.name}`}
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = fallbackUrl;
                        }}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/30 group-hover:via-black/30 transition-colors" />

                      {/* Hover Overlay: Glance Prompter */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-[2px]">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-lg transform translate-y-1 group-hover:translate-y-0 transition-all">
                          <Eye className="h-3.5 w-3.5" /> View at a glance
                        </span>
                      </div>

                      {/* Status Badge */}
                      <div className="absolute top-2.5 right-2.5 z-10">
                        <span
                          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold backdrop-blur-sm shadow-sm ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
                        >
                          {statusLabels[item.status]}
                        </span>
                      </div>

                      {/* Category Pill */}
                      <div className="absolute top-2.5 left-2.5 z-10">
                        <span className="inline-flex items-center rounded-md bg-black/70 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium text-white capitalize border border-white/10">
                          {item.category}
                        </span>
                      </div>

                      {/* Quantity Tag */}
                      <div className="absolute bottom-2.5 left-2.5 text-white z-10">
                        <span className="font-semibold text-xs drop-shadow-sm bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm">
                          {item.quantity} {item.quantity === 1 ? "unit" : "units"}
                        </span>
                      </div>

                      {/* Open Full Image in New Tab */}
                      <a
                        href={imageUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title="Open photo full size"
                        className="absolute bottom-2.5 right-2.5 z-10 rounded-full bg-black/60 p-1.5 text-white/80 hover:text-white backdrop-blur-sm hover:bg-black/80 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>

                    {/* Card Content */}
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-1">
                        <h3 className="font-semibold text-sm leading-tight text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                          {item.name}
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {projectTitle}
                      </p>
                      {item.notes && (
                        <p className="text-xs text-muted-foreground/80 line-clamp-2 italic bg-muted/30 p-2 rounded border border-border/40">
                          {item.notes}
                        </p>
                      )}
                    </CardContent>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="p-3 pt-0 flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openGlance(item.id);
                      }}
                      className="flex-1 min-w-[70px] inline-flex items-center justify-center gap-1 rounded-md border border-border/70 bg-muted/30 hover:bg-muted py-1.5 text-xs font-semibold text-foreground transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5 text-primary" /> Glance
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEdit(item);
                      }}
                      className="inline-flex items-center justify-center gap-1 rounded-md border border-border/70 bg-muted/30 hover:bg-muted px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors"
                      title="Edit equipment details"
                    >
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" /> Edit
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteItem(item);
                      }}
                      className="inline-flex items-center justify-center rounded-md border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 p-1.5 text-xs text-red-600 dark:text-red-400 transition-colors"
                      title="Delete equipment"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>

                    {item.status !== "reserved" ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateAppDataSlice("equipmentInventory", (items) =>
                            items.map((curr) =>
                              curr.id === item.id
                                ? { ...curr, status: "reserved" as const }
                                : curr
                            )
                          );
                        }}
                        className="rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        Reserve
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateAppDataSlice("equipmentInventory", (items) =>
                            items.map((curr) =>
                              curr.id === item.id
                                ? { ...curr, status: "available" as const }
                                : curr
                            )
                          );
                        }}
                        className="rounded-md border px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors"
                      >
                        Available
                      </button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {!visible.length && (
            <Card>
              <CardContent className="p-12 text-center text-sm text-muted-foreground">
                No equipment items match the current search or filters.
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        /* Table / List View with Detail Sidebar (Previous classic split view) */
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="min-w-0 overflow-hidden">
            <CardHeader className="border-b pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Equipment Register</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Select a row to inspect its locally recorded details.
                </p>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {visible.length} items
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="hidden grid-cols-[36px_2fr_1fr_1.2fr_1fr_110px] gap-3 border-b bg-muted/40 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:grid">
                <span>#</span>
                <span>Equipment & Image</span>
                <span>Category</span>
                <span>Production</span>
                <span>Status</span>
                <span className="text-right">Actions</span>
              </div>

              <div className="divide-y">
                {visible.map((item, index) => {
                  const imageUrl = getEquipmentImage(item);
                  const fallbackUrl = getEquipmentFallback(item.category);
                  const isSelected = selectedItem?.id === item.id;
                  const badgeStyle =
                    statusBadgeVariants[item.status] ??
                    statusBadgeVariants.available;

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                      className={`grid w-full grid-cols-[36px_1fr] gap-3 px-4 py-3 text-left transition-colors cursor-pointer hover:bg-muted/40 sm:grid-cols-[36px_2fr_1fr_1.2fr_1fr_110px] ${
                        isSelected ? "bg-primary/[.08] border-l-2 border-primary" : ""
                      }`}
                    >
                      <span className="self-center text-xs text-muted-foreground font-mono">
                        {startIndex + index + 1}
                      </span>
                      <span className="flex min-w-0 items-center gap-3">
                        <img
                          src={imageUrl}
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = fallbackUrl;
                          }}
                          alt={`Illustrative equipment reference for ${item.name}`}
                          className="h-10 w-14 rounded object-cover border shrink-0"
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold">
                            {item.name}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {item.quantity}{" "}
                            {item.quantity === 1 ? "unit" : "units"}
                          </span>
                        </span>
                      </span>
                      <span className="hidden self-center text-xs capitalize text-muted-foreground sm:block">
                        {item.category}
                      </span>
                      <span className="hidden self-center truncate text-xs text-muted-foreground sm:block">
                        {projects.find((project) => project.id === item.projectId)
                          ?.title ?? "Shared inventory"}
                      </span>
                      <span className="hidden self-center sm:block">
                        <span
                          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
                        >
                          {statusLabels[item.status]}
                        </span>
                      </span>
                      <span className="hidden self-center text-right sm:block">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openGlance(item.id);
                            }}
                            className="rounded p-1 text-muted-foreground hover:text-primary hover:bg-muted"
                            title="Open full glance drawer"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEdit(item);
                            }}
                            className="rounded p-1 text-muted-foreground hover:text-primary hover:bg-muted"
                            title="Edit equipment"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteItem(item);
                            }}
                            className="rounded p-1 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                            title="Delete equipment"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Right Sidebar: Equipment Detail ("At a glance" panel) & Quick Categories */}
          <div className="space-y-4">
            {selectedItem ? (
              <EquipmentDetailCard
                key={selectedItem.id}
                item={selectedItem}
                projectTitle={
                  projects.find((project) => project.id === selectedItem.projectId)
                    ?.title
                }
                vendor={vendors.find((v) => v.id === selectedItem.vendorId)}
                onOpenFullGlance={() => setIsGlanceOpen(true)}
                onEdit={() => handleStartEdit(selectedItem)}
                onDelete={() => handleDeleteItem(selectedItem)}
              />
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-sm text-muted-foreground">
                  Select an equipment item to view at a glance.
                </CardContent>
              </Card>
            )}
            <QuickCategories equipment={scopedEquipment} />
          </div>

          {!visible.length && (
            <Card className="md:col-span-2 xl:col-span-3">
              <CardContent className="p-10 text-center text-sm text-muted-foreground">
                No equipment matches this filter.
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Slide-over "Equipment at a Glance" Sheet / Drawer */}
      <Sheet open={isGlanceOpen} onOpenChange={setIsGlanceOpen}>
        <SheetContent className="w-full sm:max-w-lg md:max-w-xl overflow-y-auto p-0 border-l bg-background">
          <SheetHeader className="sr-only"><SheetTitle>Equipment details</SheetTitle><SheetDescription>Inspect the selected local inventory record and update its status or notes.</SheetDescription></SheetHeader>
          {selectedItem && (
            <EquipmentGlanceDrawer
              key={selectedItem.id}
              item={selectedItem}
              projectTitle={
                projects.find((p) => p.id === selectedItem.projectId)?.title
              }
              vendor={vendors.find((v) => v.id === selectedItem.vendorId)}
              allVisible={visible}
              onSelect={(nextId) => setSelectedId(nextId)}
              onClose={() => setIsGlanceOpen(false)}
              onEdit={() => handleStartEdit(selectedItem)}
              onDelete={() => handleDeleteItem(selectedItem)}
            />
          )}
          {!selectedItem && <p className="p-6 text-sm text-muted-foreground">No equipment matches the current filters. Close this drawer to change them.</p>}
        </SheetContent>
      </Sheet>
    </div>
  );
}

{/* Rich Equipment at a Glance Slide-Over Drawer */}
function EquipmentGlanceDrawer({
  item,
  projectTitle,
  vendor,
  allVisible,
  onSelect,
  onClose,
  onEdit,
  onDelete,
}: {
  item: ReturnType<typeof useAppDataSlice<"equipmentInventory">>[number];
  projectTitle?: string;
  vendor?: ReturnType<typeof useAppDataSlice<"vendors">>[number];
  allVisible: ReturnType<typeof useAppDataSlice<"equipmentInventory">>;
  onSelect: (id: string) => void;
  onClose: () => void;
  onEdit?: (item: EquipmentItem) => void;
  onDelete?: (item: EquipmentItem) => void;
}) {
  const imageUrl = getEquipmentImage(item);
  const fallbackUrl = getEquipmentFallback(item.category);
  const badgeStyle =
    statusBadgeVariants[item.status] ?? statusBadgeVariants.available;

  const currentIndex = allVisible.findIndex((x) => x.id === item.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < allVisible.length - 1;

  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(item.notes ?? "");

  const handleStatusChange = (newStatus: "available" | "reserved" | "in-use" | "maintenance") => {
    updateAppDataSlice("equipmentInventory", (items) =>
      items.map((curr) =>
        curr.id === item.id ? { ...curr, status: newStatus } : curr
      )
    );
  };

  const saveNotes = () => {
    updateAppDataSlice("equipmentInventory", (items) =>
      items.map((curr) =>
        curr.id === item.id ? { ...curr, notes: notesValue.trim() } : curr
      )
    );
    setEditingNotes(false);
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Top Navigation & Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3.5 bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-primary/10 p-1.5 text-primary">
            <Eye className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold leading-tight">Equipment at a Glance</h2>
            <p className="text-[11px] font-mono text-muted-foreground">
              Asset ID: {item.id}
            </p>
          </div>
        </div>

        {/* Carousel Prev/Next Item Navigator */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={!hasPrev}
            onClick={() => onSelect(allVisible[currentIndex - 1].id)}
            className="rounded border p-1 text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
            title="Previous gear item"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="text-[11px] text-muted-foreground font-mono px-1">
            {currentIndex >= 0 ? currentIndex + 1 : 1} of {allVisible.length}
          </span>
          <button
            type="button"
            disabled={!hasNext}
            onClick={() => onSelect(allVisible[currentIndex + 1].id)}
            className="rounded border p-1 text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
            title="Next gear item"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Hero Photo Showcase */}
      <div className="relative h-60 sm:h-72 w-full bg-black/90 overflow-hidden">
        <img
          src={imageUrl}
          alt={`Illustrative equipment reference for ${item.name}`}
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = fallbackUrl;
          }}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

        {/* Floating Badges */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold backdrop-blur-md shadow-md ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
          >
            {statusLabels[item.status]}
          </span>
        </div>

        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3 text-white">
          <div>
            <span className="inline-block rounded bg-black/70 px-2 py-0.5 text-[11px] font-medium backdrop-blur-md uppercase tracking-wider mb-1.5 border border-white/10">
              {item.category}
            </span>
            <h3 className="text-xl font-bold leading-snug drop-shadow-md">
              {item.name}
            </h3>
          </div>

          <a
            href={imageUrl}
            target="_blank"
            rel="noreferrer"
            title="Open illustrative reference image"
            className="rounded-full bg-black/70 p-2 text-white/90 hover:text-white backdrop-blur-md hover:bg-black transition-colors shrink-0"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Glance Body & Specifications */}
      <div className="p-5 space-y-5 flex-1">
        {/* Status Switcher Bar */}
        <div className="rounded-xl border bg-muted/20 p-3 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Update Equipment Status
          </p>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {(["available", "reserved", "in-use", "maintenance"] as const).map(
              (st) => {
                const isActive = item.status === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleStatusChange(st)}
                    className={`rounded-lg py-1.5 text-xs font-semibold capitalize transition-all border ${
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-background/80 hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    {statusLabels[st]}
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* Detailed Metadata Grid */}
        <div className="rounded-xl border divide-y text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 p-3">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-primary" /> Inventory Quantity
            </span>
            <span className="font-semibold text-sm">
              {item.quantity} {item.quantity === 1 ? "unit" : "units"}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 p-3">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-primary" /> Production Project
            </span>
            <span className="font-semibold text-right max-w-[240px] truncate">
              {projectTitle ?? "Shared inventory (All active projects)"}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 p-3">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-primary" /> Department Category
            </span>
            <span className="font-semibold capitalize">{item.category}</span>
          </div>

          {vendor && (
            <div className="p-3 space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-primary" /> Rental / Supply Vendor
                </span>
                <span className="font-semibold">{vendor.name}</span>
              </div>
              <p className="text-[11px] text-muted-foreground pl-5">
                Contact: {vendor.contactName} · {vendor.city} · {vendor.phone}
              </p>
            </div>
          )}
        </div>

        {/* Sourcing Notes & Technical Specs */}
        <div className="rounded-xl border p-3.5 bg-muted/10 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Production Notes & Technical Specs
            </p>
            {!editingNotes && (
              <button
                type="button"
                onClick={() => {
                  setNotesValue(item.notes ?? "");
                  setEditingNotes(true);
                }}
                className="text-[11px] text-primary hover:underline font-medium"
              >
                Edit notes
              </button>
            )}
          </div>

          {editingNotes ? (
            <div className="space-y-2">
              <Input
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                placeholder="Add vendor, scene, or shoot requirements..."
                className="text-xs"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingNotes(false)}
                  className="rounded border px-2.5 py-1 text-xs hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveNotes}
                  className="rounded bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-foreground/90 italic">
              {item.notes ? item.notes : "No specific notes provided for this gear package."}
            </p>
          )}
        </div>
      </div>

      {/* Drawer Action Footer */}
      <div className="border-t p-4 bg-muted/20 flex flex-wrap items-center gap-2">
        {item.status !== "available" ? (
          <button
            type="button"
            onClick={() => handleStatusChange("available")}
            className="flex-1 min-w-[140px] rounded-lg border border-border bg-background py-2 text-xs font-semibold hover:bg-muted transition-colors flex items-center justify-center gap-1.5"
          >
            <Check className="h-4 w-4 text-emerald-500" /> Mark Available
          </button>
        ) : (
          <button
            type="button"
            onClick={() => handleStatusChange("reserved")}
            className="flex-1 min-w-[140px] rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5"
          >
            <ShoppingCart className="h-4 w-4" /> Reserve for Production
          </button>
        )}
        {onEdit && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit(item);
            }}
            className="rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-muted transition-colors flex items-center justify-center gap-1.5"
            title="Edit details"
          >
            <Pencil className="h-3.5 w-3.5 text-primary" /> Edit
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(item)}
            className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-1.5"
            title="Delete equipment"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border px-4 py-2 text-xs font-semibold hover:bg-muted transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

{/* Classic Table Side-Inspector Card ("Equipment at a Glance") */}
function EquipmentDetailCard({
  item,
  projectTitle,
  vendor,
  onOpenFullGlance,
  onEdit,
  onDelete,
}: {
  item: ReturnType<typeof useAppDataSlice<"equipmentInventory">>[number];
  projectTitle?: string;
  vendor?: ReturnType<typeof useAppDataSlice<"vendors">>[number];
  onOpenFullGlance: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const imageUrl = getEquipmentImage(item);
  const fallbackUrl = getEquipmentFallback(item.category);
  const badgeStyle =
    statusBadgeVariants[item.status] ?? statusBadgeVariants.available;

  const isReserved = item.status === "reserved" || item.status === "in-use";

  return (
    <Card className="overflow-hidden border shadow-sm">
      <div className="relative h-48 bg-muted">
        <img
          src={imageUrl}
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = fallbackUrl;
          }}
          alt={`Illustrative equipment reference for ${item.name}`}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
        <div className="absolute top-3 right-3">
          <span
            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold backdrop-blur-sm shadow-sm ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
          >
            {statusLabels[item.status]}
          </span>
        </div>
        <div className="absolute bottom-3 left-3 text-white">
          <span className="rounded bg-black/60 px-2 py-0.5 text-[11px] font-medium backdrop-blur-sm uppercase tracking-wider">
            {item.category}
          </span>
        </div>
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenFullGlance}
            title="Expand at a glance"
            className="rounded-full bg-black/60 p-1.5 text-white/80 hover:text-white backdrop-blur-sm hover:bg-black/80 transition-colors"
          >
            <Eye className="h-4 w-4" />
          </button>
          <a
            href={imageUrl}
            target="_blank"
            rel="noreferrer"
            title="Open illustrative reference image"
            className="rounded-full bg-black/60 p-1.5 text-white/80 hover:text-white backdrop-blur-sm hover:bg-black/80 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 text-primary text-xs font-semibold">
              <Eye className="h-3.5 w-3.5" /> Equipment at a glance
            </div>
            <CardTitle className="mt-1 text-base leading-snug">{item.name}</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground font-mono">
              Item ID: {item.id}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 text-sm">
        <DetailRow label="Category" value={item.category} />
        <DetailRow label="Quantity" value={`${item.quantity} ${item.quantity === 1 ? 'unit' : 'units'}`} />
        <DetailRow label="Production" value={projectTitle ?? "Shared inventory"} />
        {vendor && (
          <DetailRow label="Vendor" value={`${vendor.name} (${vendor.city})`} />
        )}
        <DetailRow label="Notes" value={item.notes ?? "No notes added"} />

        <div className="pt-1 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              const nextStatus: EquipmentItem["status"] = isReserved ? "available" : "reserved";
              updateAppDataSlice("equipmentInventory", (items) =>
                items.map((current) =>
                  current.id === item.id
                    ? { ...current, status: nextStatus }
                    : current
                )
              );
            }}
            className={`w-full rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
              isReserved
                ? "border border-border bg-background hover:bg-muted text-foreground"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {isReserved ? "Mark as available in storage" : "Reserve equipment for production"}
          </button>

          <div className="grid grid-cols-2 gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="w-full rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-muted transition-colors flex items-center justify-center gap-1.5"
              >
                <Pencil className="h-3.5 w-3.5 text-primary" /> Edit
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="w-full rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenFullGlance}
            className="w-full rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center gap-1.5"
          >
            <Eye className="h-3.5 w-3.5" /> Open full glance drawer
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b pb-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium capitalize max-w-[200px] truncate">
        {value}
      </span>
    </div>
  );
}

function QuickCategories({
  equipment,
}: {
  equipment: ReturnType<typeof useAppDataSlice<"equipmentInventory">>;
}) {
  const counts = equipment.reduce<Record<string, number>>((result, item) => {
    result[item.category] = (result[item.category] ?? 0) + item.quantity;
    return result;
  }, {});

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Equipment by Category</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2">
        {Object.entries(counts)
          .slice(0, 6)
          .map(([category, count]) => {
            const Icon = categoryIcons[category] ?? categoryIcons.default;
            return (
              <div
                key={category}
                className="rounded-lg border bg-muted/20 p-2.5 flex items-center gap-2.5"
              >
                <div className="rounded-md bg-primary/10 p-2 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] capitalize text-muted-foreground truncate">
                    {category}
                  </p>
                  <p className="text-base font-bold leading-tight">{count}</p>
                </div>
              </div>
            );
          })}
      </CardContent>
    </Card>
  );
}

{/* Detailed KPI Card showing both primary count and secondary unit breakdown */}
function SummaryCard({
  icon: Icon,
  label,
  mainValue,
  unitSuffix,
  subtext,
  tone = "text-foreground",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  mainValue: number;
  unitSuffix: string;
  subtext: string;
  tone?: string;
}) {
  return (
    <Card className="hover:border-primary/30 transition-all">
      <CardContent className="p-4 flex flex-col justify-between h-full">
        <div>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Icon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className={`text-2xl font-bold tracking-tight ${tone}`}>
              {mainValue}
            </span>
            <span className="text-xs font-medium text-muted-foreground lowercase">
              {unitSuffix}
            </span>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground/80 leading-tight border-t pt-2 border-border/40">
          {subtext}
        </p>
      </CardContent>
    </Card>
  );
}
