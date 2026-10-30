"use client";

import { useState } from "react";
import { MapPin, Plus, Lock, AlertCircle, Edit2, Trash2, Building, Eye, CheckCircle2, Crop, ShieldCheck, Upload, Image as ImageIcon } from "lucide-react";
import { useAppDataSlice, updateAppDataSlice } from "@/lib/app-data-store";
import { useProjects, useProject } from "@/lib/project-store";
import type { ProjectLocation } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ImageCropModal } from "@/components/images/image-crop-modal";
import { LocationPermitDialog } from "./location-permit-dialog";

const StatusColors = {
  "locked": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  "scouting": "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
  "permit-pending": "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
};

const DefaultLocationImages: Record<string, string> = {
  "heritage": "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
  "cafe": "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80",
  "transit": "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80",
  "rail": "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80",
  "backlot": "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&w=800&q=80",
  "river": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
  "night": "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=800&q=80",
  "housing": "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
  "classroom": "https://images.unsplash.com/photo-1520523839898-507127054c3f?auto=format&fit=crop&w=800&q=80",
  "music": "https://images.unsplash.com/photo-1520523839898-507127054c3f?auto=format&fit=crop&w=800&q=80",
  "studio": "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80",
  "default": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
};

export function getLocationImage(loc: ProjectLocation): string {
  if (loc.coverImage) return loc.coverImage;
  const searchStr = `${loc.type} ${loc.name} ${loc.city}`.toLowerCase();
  for (const [k, url] of Object.entries(DefaultLocationImages)) {
    if (searchStr.includes(k)) return url;
  }
  return DefaultLocationImages.default;
}

interface LocationsManagementWorkspaceProps {
  projectId?: string;
}

export function LocationsManagementWorkspace({ projectId: scopedProjectId }: LocationsManagementWorkspaceProps) {
  const projects = useProjects();
  const locations = useAppDataSlice("locations");
  const scopedProject = useProject(scopedProjectId || "");

  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    scopedProjectId || "all"
  );
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const effectiveProjectId = scopedProjectId || selectedProjectId;

  // Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<ProjectLocation | null>(null);

  // Cropper & Permit Modal states
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperTargetLocation, setCropperTargetLocation] = useState<ProjectLocation | null>(null);
  const [permitModalOpen, setPermitModalOpen] = useState(false);
  const [permitTargetLocation, setPermitTargetLocation] = useState<ProjectLocation | null>(null);

  const handleApplyCroppedImage = (dataUrl: string) => {
    if (cropperTargetLocation) {
      updateAppDataSlice("locations", (current) =>
        current.map((l) =>
          l.id === cropperTargetLocation.id ? { ...l, coverImage: dataUrl } : l
        )
      );
      toast.success(`Updated framed photo for "${cropperTargetLocation.name}".`);
      setCropperTargetLocation(null);
    } else {
      setFormData((prev) => ({ ...prev, coverImage: dataUrl }));
      toast.success("Image framed and loaded into form.");
    }
  };

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    address: "",
    type: "Studio",
    status: "scouting" as "locked" | "scouting" | "permit-pending",
    notes: "",
    coverImage: "",
    projectId: effectiveProjectId || projects[0]?.id || "",
  });

  const filteredLocations = locations.filter((location) => {
    if (effectiveProjectId && effectiveProjectId !== "all" && location.projectId !== effectiveProjectId) {
      return false;
    }
    if (statusFilter !== "all" && location.status !== statusFilter) {
      return false;
    }
    return true;
  });

  const stats = {
    total: filteredLocations.length,
    locked: filteredLocations.filter((l) => l.status === "locked").length,
    scouting: filteredLocations.filter((l) => l.status === "scouting").length,
    permitPending: filteredLocations.filter((l) => l.status === "permit-pending").length,
  };

  const handleOpenAdd = () => {
    setFormData({
      name: "",
      city: "",
      address: "",
      type: "Studio Set",
      status: "scouting",
      notes: "",
      coverImage: "",
      projectId: effectiveProjectId || projects[0]?.id || "",
    });
    setIsAddOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const newLocation: ProjectLocation = {
      id: `loc-${Date.now()}`,
      projectId: formData.projectId || effectiveProjectId || projects[0]?.id || "p1",
      name: formData.name.trim(),
      city: formData.city.trim() || "Hyderabad",
      address: formData.address.trim() || "Film City Compound",
      type: formData.type || "Studio Set",
      status: formData.status,
      notes: formData.notes.trim(),
      coverImage: formData.coverImage.trim() || null,
      gallery: [],
    };

    updateAppDataSlice("locations", (current) => [newLocation, ...current]);
    toast.success(`Location "${newLocation.name}" recorded.`);
    setIsAddOpen(false);
  };

  const handleOpenEdit = (loc: ProjectLocation) => {
    setEditingLocation(loc);
    setFormData({
      name: loc.name,
      city: loc.city,
      address: loc.address,
      type: loc.type,
      status: loc.status,
      notes: loc.notes || "",
      coverImage: loc.coverImage || "",
      projectId: loc.projectId,
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLocation || !formData.name.trim()) return;

    updateAppDataSlice("locations", (current) =>
      current.map((l) =>
        l.id === editingLocation.id
          ? {
              ...l,
              name: formData.name.trim(),
              city: formData.city.trim(),
              address: formData.address.trim(),
              type: formData.type,
              status: formData.status,
              notes: formData.notes.trim(),
              coverImage: formData.coverImage.trim() || null,
              projectId: formData.projectId || l.projectId,
            }
          : l
      )
    );
    toast.success(`Location "${formData.name.trim()}" updated.`);
    setEditingLocation(null);
  };

  const handleDeleteLocation = (id: string, name?: string) => {
    const displayName = name || "this location";
    if (confirm(`Are you sure you want to remove "${displayName}" from locations?`)) {
      updateAppDataSlice("locations", (current) => current.filter((l) => l.id !== id));
      toast.info(`Location "${displayName}" removed.`);
      if (editingLocation?.id === id) setEditingLocation(null);
    }
  };

  const handleToggleStatus = (loc: ProjectLocation) => {
    const nextStatus: Record<ProjectLocation["status"], ProjectLocation["status"]> = {
      scouting: "permit-pending",
      "permit-pending": "locked",
      locked: "scouting",
    };
    const target = nextStatus[loc.status] ?? "locked";
    updateAppDataSlice("locations", (current) =>
      current.map((l) => (l.id === loc.id ? { ...l, status: target } : l))
    );
    toast.success(`Status for "${loc.name}" updated to ${target.replace(/-/g, " ")}.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {scopedProject ? `${scopedProject.title} · Locations` : "Location Management"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {scopedProject
              ? `Scout, lock, and manage shooting venues for ${scopedProject.title}`
              : "Scout, lock, and manage shooting locations across your feature slates"}
          </p>
        </div>
        <Button onClick={handleOpenAdd} className="gap-2 shrink-0 bg-primary font-semibold">
          <Plus className="w-4 h-4" />
          Add Location
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Total Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Locked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{stats.locked}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Scouting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.scouting}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Permits Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{stats.permitPending}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-col sm:flex-row gap-4">
            {!scopedProjectId && (
              <div className="flex-1">
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Project</label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex-1">
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="locked">Locked</SelectItem>
                  <SelectItem value="scouting">Scouting</SelectItem>
                  <SelectItem value="permit-pending">Permit Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Locations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredLocations.length > 0 ? (
          filteredLocations.map((location) => {
            const projectObj = projects.find((p) => p.id === location.projectId);
            return (
              <Card
                key={location.id}
                className="group border hover:border-primary/50 transition-all shadow-sm overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="h-44 bg-muted overflow-hidden relative">
                    <img
                      src={getLocationImage(location)}
                      alt={location.name}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = DefaultLocationImages.default;
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                    <div className="absolute top-2.5 left-2.5">
                      <span className="inline-flex items-center rounded-md bg-black/70 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium text-white capitalize border border-white/10">
                        {location.type}
                      </span>
                    </div>

                    {/* Quick Crop / Change Photo Button */}
                    <div className="absolute top-2.5 right-2.5 z-10">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCropperTargetLocation(location);
                          setCropperOpen(true);
                        }}
                        title="Upload, change, or crop location photo"
                        className="inline-flex items-center gap-1 rounded-md bg-black/70 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold text-white/95 hover:text-white hover:bg-black/90 border border-white/15 transition-colors shadow-sm"
                      >
                        <Crop className="w-3 h-3 text-primary" /> Crop / Photo
                      </button>
                    </div>
                  </div>

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <CardTitle className="text-lg font-bold truncate">{location.name}</CardTitle>
                        <CardDescription className="text-sm mt-0.5 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>{location.city}</span>
                          {projectObj && !scopedProjectId && (
                            <span className="text-xs text-muted-foreground/80 font-medium">
                              · {projectObj.title}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      <Badge
                        variant="outline"
                        className={`capitalize font-semibold text-xs shrink-0 cursor-pointer hover:opacity-80 transition-opacity ${
                          StatusColors[location.status as keyof typeof StatusColors] || ""
                        }`}
                        onClick={() => {
                          setPermitTargetLocation(location);
                          setPermitModalOpen(true);
                        }}
                        title="Click to view full municipal permit documentation"
                      >
                        {location.status.replace(/-/g, " ")}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <div className="text-xs text-muted-foreground space-y-1.5 border-t pt-2.5">
                      <div className="flex items-start gap-1.5">
                        <span className="font-medium text-foreground">Address:</span>
                        <span>{location.address}</span>
                      </div>
                      {location.notes && (
                        <div className="flex items-start gap-1.5">
                          <span className="font-medium text-foreground">Notes:</span>
                          <span className="italic">{location.notes}</span>
                        </div>
                      )}
                    </div>
                    {location.status === "permit-pending" && (
                      <div
                        onClick={() => {
                          setPermitTargetLocation(location);
                          setPermitModalOpen(true);
                        }}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 text-xs cursor-pointer hover:bg-amber-500/20 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                          <span className="truncate">Permit application under municipal review.</span>
                        </div>
                        <span className="underline font-semibold shrink-0 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> Details
                        </span>
                      </div>
                    )}
                  </CardContent>
                </div>

                <div className="p-4 pt-0 border-t flex flex-wrap items-center justify-between gap-2 bg-muted/10">
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant={location.status === "locked" ? "secondary" : "default"}
                      className="gap-1.5 text-xs h-8 font-semibold"
                      onClick={() => handleToggleStatus(location)}
                    >
                      {location.status === "scouting" && (
                        <>
                          <Building className="w-3 h-3 text-blue-400" />
                          Submit Permit
                        </>
                      )}
                      {location.status === "permit-pending" && (
                        <>
                          <Lock className="w-3 h-3 text-amber-400" />
                          Approve & Lock
                        </>
                      )}
                      {location.status === "locked" && (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          Locked ✓
                        </>
                      )}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-xs h-8"
                      onClick={() => {
                        setPermitTargetLocation(location);
                        setPermitModalOpen(true);
                      }}
                      title="View full municipal and police permit filing"
                    >
                      <ShieldCheck className="w-3 h-3 text-amber-500" />
                      Permit Info
                    </Button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-xs h-8"
                      onClick={() => {
                        setCropperTargetLocation(location);
                        setCropperOpen(true);
                      }}
                      title="Crop or upload location photo"
                    >
                      <Crop className="w-3 h-3" />
                      Crop
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-xs h-8"
                      onClick={() => handleOpenEdit(location)}
                    >
                      <Edit2 className="w-3 h-3" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1 text-xs h-8 text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteLocation(location.id, location.name)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full text-center py-16 rounded-xl border border-dashed">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
            <h3 className="font-semibold text-base mb-1">No locations found</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-4">
              Add a scouting or locked location to begin managing shoot sites.
            </p>
            <Button onClick={handleOpenAdd} size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              Add First Location
            </Button>
          </div>
        )}
      </div>

      {/* Add Location Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Production Location</DialogTitle>
            <DialogDescription>
              Record a new shooting venue, studio floor, or exterior scout location.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveAdd} className="space-y-4 pt-2">
            {!scopedProjectId && (
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Project</label>
                <Select
                  value={formData.projectId}
                  onValueChange={(val) => setFormData({ ...formData, projectId: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Location Name *</label>
                <Input
                  required
                  placeholder="e.g. Ramoji City Temple Set"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">City / Region *</label>
                <Input
                  required
                  placeholder="e.g. Hyderabad"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Venue Type</label>
                <Input
                  placeholder="e.g. Interior Studio, Heritage Fort"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Status</label>
                <Select
                  value={formData.status}
                  onValueChange={(val: any) => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scouting">Scouting</SelectItem>
                    <SelectItem value="permit-pending">Permit Pending</SelectItem>
                    <SelectItem value="locked">Locked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Full Address</label>
              <Input
                placeholder="Street address or landmark coordinates"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">Location Photo & Framing</label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCropperTargetLocation(null);
                    setCropperOpen(true);
                  }}
                  className="h-7 text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
                >
                  <Crop className="w-3.5 h-3.5" />
                  Upload & Crop
                </Button>
              </div>

              {formData.coverImage ? (
                <div className="relative rounded-lg overflow-hidden border border-border/70 h-28 bg-muted group">
                  <img
                    src={formData.coverImage}
                    alt="Location Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="h-7 text-xs gap-1"
                      onClick={() => {
                        setCropperTargetLocation(null);
                        setCropperOpen(true);
                      }}
                    >
                      <Crop className="w-3 h-3" /> Re-crop
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="h-7 text-xs"
                      onClick={() => setFormData((prev) => ({ ...prev, coverImage: "" }))}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => {
                    setCropperTargetLocation(null);
                    setCropperOpen(true);
                  }}
                  className="border-2 border-dashed border-border/70 rounded-lg p-3 text-center cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-all"
                >
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Upload className="w-4 h-4 text-primary" />
                    <span className="font-medium text-foreground">Click to upload file, paste URL or pick preset</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground/75 mt-0.5">
                    Supports 16:9 & 2.39:1 anamorphic crop, zoom & pan framing
                  </p>
                </div>
              )}

              <Input
                placeholder="Or paste direct image URL (https://...)"
                value={formData.coverImage}
                onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                className="text-xs h-8"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Logistics & Power Notes</label>
              <Textarea
                rows={3}
                placeholder="Sound isolation, power generator requirements, parking notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary">
                Save Location
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Location Modal */}
      <Dialog open={!!editingLocation} onOpenChange={(open) => !open && setEditingLocation(null)}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
            <DialogDescription>
              Update location details, permit status, and production notes.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
            {!scopedProjectId && (
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Project</label>
                <Select
                  value={formData.projectId}
                  onValueChange={(val) => setFormData({ ...formData, projectId: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Location Name *</label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">City / Region *</label>
                <Input
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Venue Type</label>
                <Input
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Status</label>
                <Select
                  value={formData.status}
                  onValueChange={(val: any) => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scouting">Scouting</SelectItem>
                    <SelectItem value="permit-pending">Permit Pending</SelectItem>
                    <SelectItem value="locked">Locked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Full Address</label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">Location Photo & Framing</label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCropperTargetLocation(editingLocation);
                    setCropperOpen(true);
                  }}
                  className="h-7 text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
                >
                  <Crop className="w-3.5 h-3.5" />
                  Upload & Crop
                </Button>
              </div>

              {formData.coverImage ? (
                <div className="relative rounded-lg overflow-hidden border border-border/70 h-28 bg-muted group">
                  <img
                    src={formData.coverImage}
                    alt="Location Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="h-7 text-xs gap-1"
                      onClick={() => {
                        setCropperTargetLocation(editingLocation);
                        setCropperOpen(true);
                      }}
                    >
                      <Crop className="w-3 h-3" /> Re-crop
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="h-7 text-xs"
                      onClick={() => setFormData((prev) => ({ ...prev, coverImage: "" }))}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => {
                    setCropperTargetLocation(editingLocation);
                    setCropperOpen(true);
                  }}
                  className="border-2 border-dashed border-border/70 rounded-lg p-3 text-center cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-all"
                >
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Upload className="w-4 h-4 text-primary" />
                    <span className="font-medium text-foreground">Click to upload file, paste URL or pick preset</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground/75 mt-0.5">
                    Supports 16:9 & 2.39:1 anamorphic crop, zoom & pan framing
                  </p>
                </div>
              )}

              <Input
                placeholder="Or paste direct image URL (https://...)"
                value={formData.coverImage}
                onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                className="text-xs h-8"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Logistics & Power Notes</label>
              <Textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <DialogFooter className="gap-2 pt-2 flex items-center justify-between">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => editingLocation && handleDeleteLocation(editingLocation.id, editingLocation.name)}
              >
                Delete Location
              </Button>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingLocation(null)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-primary">
                  Save Changes
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Interactive Canvas Cropper Modal */}
      <ImageCropModal
        open={cropperOpen}
        onOpenChange={(open) => {
          setCropperOpen(open);
          if (!open) setCropperTargetLocation(null);
        }}
        initialImage={cropperTargetLocation?.coverImage || formData.coverImage}
        title={
          cropperTargetLocation
            ? `Photo Framing · ${cropperTargetLocation.name}`
            : "Location Photo Framing"
        }
        onApply={handleApplyCroppedImage}
      />

      {/* Production Permit Clearance Dialog */}
      <LocationPermitDialog
        open={permitModalOpen}
        onOpenChange={(open) => {
          setPermitModalOpen(open);
          if (!open) setPermitTargetLocation(null);
        }}
        location={permitTargetLocation}
      />
    </div>
  );
}
