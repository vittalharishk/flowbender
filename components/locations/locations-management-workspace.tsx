"use client";

import { useConfirm } from "@/components/app/confirm-dialog";

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
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { StatusBadge } from "@/components/app/status-badge";
import { EmptyState } from "@/components/app/empty-state";
import { LocationPermitDialog } from "./location-permit-dialog";

export function getLocationImage(loc: ProjectLocation): string {
  return loc.coverImage ?? "";
}

interface LocationsManagementWorkspaceProps {
  projectId?: string;
}

export function LocationsManagementWorkspace({ projectId: scopedProjectId }: LocationsManagementWorkspaceProps) {
  const confirm = useConfirm();
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

  const handleDeleteLocation = async (id: string, name?: string) => {
    const displayName = name || "this location";
    if (await confirm({ title: `Remove "${displayName}"?`, description: "This location will be removed from the locations list.", confirmLabel: "Remove" })) {
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
      <PageHeader
        as={scopedProjectId ? "h2" : "h1"}
        icon={MapPin}
        title={scopedProject ? "Locations" : "Location Management"}
        description={
          scopedProject
            ? `Scout, lock, and manage shooting venues for ${scopedProject.title}`
            : "Scout, lock, and manage shooting locations across your productions"
        }
        actions={
          <Button onClick={handleOpenAdd} variant="primary" className="gap-2">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Location
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total Locations" value={stats.total} icon={MapPin} />
        <StatCard label="Locked" value={stats.locked} icon={Lock} hint="Confirmed venues" />
        <StatCard label="Scouting" value={stats.scouting} icon={Eye} hint="Under review" />
        <StatCard label="Permits Pending" value={stats.permitPending} icon={ShieldCheck} hint="Awaiting approval" />
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
                  <div className="relative h-44 overflow-hidden bg-muted">
                    {getLocationImage(location) ? (
                      <img
                        src={getLocationImage(location)}
                        alt={location.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/40">
                        <ImageIcon className="h-10 w-10 text-muted-foreground/40" aria-hidden="true" />
                        <span className="sr-only">No photo for {location.name}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                    <div className="absolute left-2.5 top-2.5">
                      <span className="inline-flex items-center rounded-md border border-white/10 bg-black/70 px-2 py-0.5 text-xs font-medium capitalize text-white backdrop-blur-sm">
                        {location.type}
                      </span>
                    </div>

                    {/* Quick Crop / Change Photo Button */}
                    <div className="absolute right-2.5 top-2.5 z-10">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCropperTargetLocation(location);
                          setCropperOpen(true);
                        }}
                        aria-label={`Upload, change, or crop photo for ${location.name}`}
                        className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-black/70 px-2.5 py-1 text-xs font-semibold text-white/95 backdrop-blur-md transition-colors hover:bg-black/90 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                      >
                        <Crop className="h-3 w-3" aria-hidden="true" /> Crop / Photo
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
                      <button
                        type="button"
                        className="shrink-0 rounded-md transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                        onClick={() => {
                          setPermitTargetLocation(location);
                          setPermitModalOpen(true);
                        }}
                        aria-label={`View permit documentation for ${location.name}. Status: ${location.status.replace(/-/g, " ")}`}
                      >
                        <StatusBadge status={location.status} />
                      </button>
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
          <div className="col-span-full rounded-lg border border-dashed">
            <EmptyState
              icon={MapPin}
              title="No locations found"
              description="Add a scouting or locked location to begin managing shoot sites."
              action={
                <Button onClick={handleOpenAdd} variant="primary" size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add First Location
                </Button>
              }
            />
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
                  <p className="text-xs text-muted-foreground/75 mt-0.5">
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
                  <p className="text-xs text-muted-foreground/75 mt-0.5">
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
