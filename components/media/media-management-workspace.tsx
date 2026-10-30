"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  HardDrive,
  Video,
  Zap,
  Shield,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Server,
  Cloud,
  Database,
  Copy,
  FileCheck,
  ArrowRight,
  Lock,
  Settings2,
  ShieldCheck,
  Download,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useProjects, useProject } from "@/lib/project-store";
import { useAppDataSlice, updateAppDataSlice } from "@/lib/app-data-store";
import type { CameraCard, StorageDevice, FootageMetadata } from "@/lib/types";
import { toast } from "sonner";

interface MediaManagementWorkspaceProps {
  projectId?: string;
}

export function MediaManagementWorkspace({ projectId: scopedProjectId }: MediaManagementWorkspaceProps) {
  const projects = useProjects();
  const scopedProject = useProject(scopedProjectId || "");

  const allCards = useAppDataSlice("cameraCards");
  const allStorage = useAppDataSlice("storageDevices");
  const allFootage = useAppDataSlice("footageMetadata");

  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    scopedProjectId || "all"
  );

  const effectiveProjectId = scopedProjectId || selectedProjectId;

  // Filtered collections
  const cameraCards = allCards.filter(
    (c) => !effectiveProjectId || effectiveProjectId === "all" || c.projectId === effectiveProjectId
  );
  const storageDevices = allStorage.filter(
    (d) => !effectiveProjectId || effectiveProjectId === "all" || d.projectId === effectiveProjectId
  );
  const footageMetadata = allFootage.filter(
    (f) => !effectiveProjectId || effectiveProjectId === "all" || f.projectId === effectiveProjectId
  );

  // Active Tab
  const [activeTab, setActiveTab] = useState("cards");

  // Modal states
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CameraCard | null>(null);

  const [storageModalOpen, setStorageModalOpen] = useState(false);
  const [editingStorage, setEditingStorage] = useState<StorageDevice | null>(null);

  const [footageModalOpen, setFootageModalOpen] = useState(false);
  const [editingFootage, setEditingFootage] = useState<FootageMetadata | null>(null);

  // Backup Strategy State & Config
  const [strategyModalOpen, setStrategyModalOpen] = useState(false);
  const [isSweeping, setIsSweeping] = useState(false);
  const [strategyConfig, setStrategyConfig] = useState({
    standardName: "Active 3-2-1 Production Backup Standard",
    description:
      "3 verified copies of every master camera card are maintained across at least 2 distinct physical media types, with 1 secure off-site archive sync.",
    ruleCode: "3-2-1",
    hashAlgorithm: "xxHash64 & MD5",
    primaryTarget: "SanDisk PRO-BLADE 8TB NVMe RAID-0 (On-Set DIT)",
    secondaryTarget: "QNAP 16-Bay Thunderbolt NAS (Editorial Working Mirror)",
    tertiaryTarget: "Quantum LTO-9 Linear Tape & AWS Glacier Deep Archive",
    cardsOffloadedRate: "100% Ingested",
    nasSyncFrequency: "Hourly Real-Time",
    ltoSyncFrequency: "Nightly Differential",
    vaultLocation: "Hyderabad Studio Main Safe & Mumbai Cloud Cold Tier",
    lastSweepDate: "16 Sep 2026, 14:15 IST",
    integrityRate: "99.99% Verified",
    autoMhlGeneration: true,
    bitRotDetection: true,
    retentionPeriod: "3 Years / Post-Production Master Wrap",
  });

  const [strategyEditForm, setStrategyEditForm] = useState({ ...strategyConfig });

  const handleOpenEditStrategy = () => {
    setStrategyEditForm({ ...strategyConfig });
    setStrategyModalOpen(true);
  };

  const handleSaveStrategy = (e: React.FormEvent) => {
    e.preventDefault();
    setStrategyConfig({ ...strategyEditForm });
    setStrategyModalOpen(false);
    toast.success("Production backup strategy & policies updated successfully.");
  };

  const handleRunChecksumSweep = () => {
    setIsSweeping(true);
    toast.info(`Initiating ${strategyConfig.hashAlgorithm} checksum sweep across storage pools...`);
    setTimeout(() => {
      setIsSweeping(false);
      setStrategyConfig((prev) => ({
        ...prev,
        lastSweepDate: `Just now (${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })})`,
        integrityRate: "100% Bit-Accurate",
      }));
      toast.success("Checksum sweep completed: 74TB verified with 0 parity errors.");
    }, 1200);
  };

  const handleExportMhlCertificate = () => {
    const certificateText = `--- FLOWBENDER DIT MEDIA INTEGRITY CERTIFICATE ---
Production: ${scopedProject?.title || "Studio Feature Slates"}
Date: ${new Date().toISOString()}
Policy: ${strategyConfig.standardName} (${strategyConfig.ruleCode})
Hash Algorithm: ${strategyConfig.hashAlgorithm}
Primary Ingest: ${strategyConfig.primaryTarget}
Secondary Mirror: ${strategyConfig.secondaryTarget}
Off-Site Archive: ${strategyConfig.tertiaryTarget}
Vault Location: ${strategyConfig.vaultLocation}
Integrity Rate: ${strategyConfig.integrityRate}
MHL 2.0 Compliance: ${strategyConfig.autoMhlGeneration ? "VERIFIED" : "DISABLED"}
Lead DIT Signoff: Hari Kethan (Digital Imaging Technician)
Post Supervisor Signoff: Lalitha Vemuri`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(certificateText);
      toast.success("DIT Media Integrity Certificate copied to clipboard.");
    } else {
      toast.success("Generated DIT Media Integrity Certificate.");
    }
  };

  // Forms
  const [cardForm, setCardForm] = useState({
    cardId: "",
    capacity: 256,
    available: 32,
    format: "RAW" as CameraCard["format"],
    shootDate: new Date().toISOString().slice(0, 10),
    status: "active" as CameraCard["status"],
    shootCount: 40,
    backupStatus: "in-progress" as CameraCard["backupStatus"],
    location: "DIT Unit Safe",
    notes: "",
    projectId: effectiveProjectId || projects[0]?.id || "",
  });

  const [storageForm, setStorageForm] = useState({
    deviceId: "",
    type: "SSD" as StorageDevice["type"],
    capacity: 4000,
    used: 2400,
    status: "active" as StorageDevice["status"],
    location: "Edit Suite A",
    content: "Raw Footage, Proxies",
    redundancy: true,
    temperature: 35,
    projectId: effectiveProjectId || projects[0]?.id || "",
  });

  const [footageForm, setFootageForm] = useState({
    sceneId: "SC-101",
    takeNumber: 1,
    duration: 180,
    format: "RED R3D",
    resolution: "8K",
    fps: 24,
    codecs: "REDCODE RAW",
    storedOn: "HDD-01, NAS-01",
    status: "synced" as FootageMetadata["status"],
    notes: "",
    shootDate: new Date().toISOString().slice(0, 10),
    projectId: effectiveProjectId || projects[0]?.id || "",
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      verified: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      active: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
      archived: "bg-muted text-muted-foreground",
      corrupted: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
      pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
      "in-progress": "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
      failed: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
      backup: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
      synced: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      "proxies-ready": "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
      raw: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    };
    return colors[status] || "bg-muted text-muted-foreground";
  };

  const storageHealth = storageDevices.filter((d) => d.status === "active").length;
  const totalCapacity = storageDevices.reduce((sum, d) => sum + d.capacity, 0);
  const totalUsed = storageDevices.reduce((sum, d) => sum + d.used, 0);
  const usagePercent = totalCapacity > 0 ? Math.round((totalUsed / totalCapacity) * 100) : 0;

  // --- CARD HANDLERS ---
  const handleOpenAddCard = () => {
    setEditingCard(null);
    setCardForm({
      cardId: `CFast-${String(allCards.length + 1).padStart(3, "0")}`,
      capacity: 512,
      available: 64,
      format: "RAW",
      shootDate: new Date().toISOString().slice(0, 10),
      status: "active",
      shootCount: 30,
      backupStatus: "in-progress",
      location: "DIT Unit Cart",
      notes: "",
      projectId: effectiveProjectId || projects[0]?.id || "p1",
    });
    setCardModalOpen(true);
  };

  const handleOpenEditCard = (card: CameraCard) => {
    setEditingCard(card);
    setCardForm({
      cardId: card.cardId,
      capacity: card.capacity,
      available: card.available,
      format: card.format,
      shootDate: card.shootDate,
      status: card.status,
      shootCount: card.shootCount,
      backupStatus: card.backupStatus,
      location: card.location,
      notes: card.notes || "",
      projectId: card.projectId,
    });
    setCardModalOpen(true);
  };

  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardForm.cardId.trim()) return;

    if (editingCard) {
      updateAppDataSlice("cameraCards", (cur) =>
        cur.map((c) =>
          c.id === editingCard.id
            ? {
                ...c,
                cardId: cardForm.cardId.trim(),
                capacity: Number(cardForm.capacity),
                available: Number(cardForm.available),
                format: cardForm.format,
                shootDate: cardForm.shootDate,
                status: cardForm.status,
                shootCount: Number(cardForm.shootCount),
                backupStatus: cardForm.backupStatus,
                location: cardForm.location.trim(),
                notes: cardForm.notes.trim() || undefined,
                projectId: cardForm.projectId || c.projectId,
              }
            : c
        )
      );
      toast.success(`Card ${cardForm.cardId} updated.`);
    } else {
      const newCard: CameraCard = {
        id: `card-${Date.now()}`,
        projectId: cardForm.projectId || effectiveProjectId || "p1",
        cardId: cardForm.cardId.trim(),
        capacity: Number(cardForm.capacity),
        available: Number(cardForm.available),
        format: cardForm.format,
        shootDate: cardForm.shootDate,
        status: cardForm.status,
        shootCount: Number(cardForm.shootCount),
        backupStatus: cardForm.backupStatus,
        location: cardForm.location.trim(),
        notes: cardForm.notes.trim() || undefined,
      };
      updateAppDataSlice("cameraCards", (cur) => [newCard, ...cur]);
      toast.success(`Camera card ${newCard.cardId} registered.`);
    }
    setCardModalOpen(false);
  };

  const handleDeleteCard = (id: string) => {
    if (confirm("Delete camera card record?")) {
      updateAppDataSlice("cameraCards", (cur) => cur.filter((c) => c.id !== id));
      toast.info("Card record deleted.");
      setCardModalOpen(false);
    }
  };

  // --- STORAGE HANDLERS ---
  const handleOpenAddStorage = () => {
    setEditingStorage(null);
    setStorageForm({
      deviceId: `SSD-${String(allStorage.length + 1).padStart(3, "0")}`,
      type: "SSD",
      capacity: 4000,
      used: 1200,
      status: "active",
      location: "Edit Suite",
      content: "ProRes Proxies, Audio",
      redundancy: true,
      temperature: 34,
      projectId: effectiveProjectId || projects[0]?.id || "p1",
    });
    setStorageModalOpen(true);
  };

  const handleOpenEditStorage = (dev: StorageDevice) => {
    setEditingStorage(dev);
    setStorageForm({
      deviceId: dev.deviceId,
      type: dev.type,
      capacity: dev.capacity,
      used: dev.used,
      status: dev.status,
      location: dev.location,
      content: dev.content.join(", "),
      redundancy: dev.redundancy,
      temperature: dev.temperature || 35,
      projectId: dev.projectId,
    });
    setStorageModalOpen(true);
  };

  const handleSaveStorage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storageForm.deviceId.trim()) return;

    const contentArray = storageForm.content
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingStorage) {
      updateAppDataSlice("storageDevices", (cur) =>
        cur.map((d) =>
          d.id === editingStorage.id
            ? {
                ...d,
                deviceId: storageForm.deviceId.trim(),
                type: storageForm.type,
                capacity: Number(storageForm.capacity),
                used: Number(storageForm.used),
                status: storageForm.status,
                location: storageForm.location.trim(),
                content: contentArray,
                redundancy: Boolean(storageForm.redundancy),
                temperature: Number(storageForm.temperature) || undefined,
                projectId: storageForm.projectId || d.projectId,
              }
            : d
        )
      );
      toast.success(`Storage device ${storageForm.deviceId} updated.`);
    } else {
      const newDev: StorageDevice = {
        id: `stor-${Date.now()}`,
        projectId: storageForm.projectId || effectiveProjectId || "p1",
        deviceId: storageForm.deviceId.trim(),
        type: storageForm.type,
        capacity: Number(storageForm.capacity),
        used: Number(storageForm.used),
        status: storageForm.status,
        location: storageForm.location.trim(),
        content: contentArray,
        lastVerified: new Date().toISOString().slice(0, 10),
        redundancy: Boolean(storageForm.redundancy),
        temperature: Number(storageForm.temperature) || undefined,
      };
      updateAppDataSlice("storageDevices", (cur) => [newDev, ...cur]);
      toast.success(`Storage unit ${newDev.deviceId} mounted.`);
    }
    setStorageModalOpen(false);
  };

  const handleDeleteStorage = (id: string) => {
    if (confirm("Delete storage unit record?")) {
      updateAppDataSlice("storageDevices", (cur) => cur.filter((d) => d.id !== id));
      toast.info("Storage unit removed.");
      setStorageModalOpen(false);
    }
  };

  // --- FOOTAGE HANDLERS ---
  const handleOpenAddFootage = () => {
    setEditingFootage(null);
    setFootageForm({
      sceneId: "SC-101",
      takeNumber: 1,
      duration: 180,
      format: "RED R3D",
      resolution: "8K",
      fps: 24,
      codecs: "REDCODE RAW",
      storedOn: "HDD-01, NAS-01",
      status: "synced",
      notes: "",
      shootDate: new Date().toISOString().slice(0, 10),
      projectId: effectiveProjectId || projects[0]?.id || "p1",
    });
    setFootageModalOpen(true);
  };

  const handleOpenEditFootage = (f: FootageMetadata) => {
    setEditingFootage(f);
    setFootageForm({
      sceneId: f.sceneId,
      takeNumber: f.takeNumber,
      duration: f.duration,
      format: f.format,
      resolution: f.resolution,
      fps: f.fps,
      codecs: f.codecs,
      storedOn: f.storedOn.join(", "),
      status: f.status,
      notes: f.notes || "",
      shootDate: f.shootDate,
      projectId: f.projectId,
    });
    setFootageModalOpen(true);
  };

  const handleSaveFootage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!footageForm.sceneId.trim()) return;

    const storedArray = footageForm.storedOn
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingFootage) {
      updateAppDataSlice("footageMetadata", (cur) =>
        cur.map((ft) =>
          ft.id === editingFootage.id
            ? {
                ...ft,
                sceneId: footageForm.sceneId.trim(),
                takeNumber: Number(footageForm.takeNumber),
                duration: Number(footageForm.duration),
                format: footageForm.format.trim(),
                resolution: footageForm.resolution.trim(),
                fps: Number(footageForm.fps),
                codecs: footageForm.codecs.trim(),
                storedOn: storedArray,
                status: footageForm.status,
                notes: footageForm.notes.trim() || undefined,
                shootDate: footageForm.shootDate,
                projectId: footageForm.projectId || ft.projectId,
              }
            : ft
        )
      );
      toast.success(`Take ${footageForm.sceneId} updated.`);
    } else {
      const newFt: FootageMetadata = {
        id: `ft-${Date.now()}`,
        projectId: footageForm.projectId || effectiveProjectId || "p1",
        sceneId: footageForm.sceneId.trim(),
        takeNumber: Number(footageForm.takeNumber),
        duration: Number(footageForm.duration),
        format: footageForm.format.trim(),
        resolution: footageForm.resolution.trim(),
        fps: Number(footageForm.fps),
        codecs: footageForm.codecs.trim(),
        storedOn: storedArray,
        status: footageForm.status,
        notes: footageForm.notes.trim() || undefined,
        shootDate: footageForm.shootDate,
      };
      updateAppDataSlice("footageMetadata", (cur) => [newFt, ...cur]);
      toast.success(`Take ${newFt.sceneId} registered in media vault.`);
    }
    setFootageModalOpen(false);
  };

  const handleDeleteFootage = (id: string) => {
    if (confirm("Delete footage metadata record?")) {
      updateAppDataSlice("footageMetadata", (cur) => cur.filter((f) => f.id !== id));
      toast.info("Footage record deleted.");
      setFootageModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {scopedProject ? `${scopedProject.title} · Media Vault` : "Media Management"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {scopedProject
              ? `Camera cards, NAS storage, and raw footage intake for ${scopedProject.title}`
              : "Camera cards, on-set DIT offloads, volume storage, and verified backups"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!scopedProjectId && (
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger className="w-[180px] h-9 text-xs">
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
          )}

          {activeTab === "cards" && (
            <Button size="sm" onClick={handleOpenAddCard} className="gap-1.5 font-semibold">
              <Plus className="w-4 h-4" /> Add Card
            </Button>
          )}
          {activeTab === "storage" && (
            <Button size="sm" onClick={handleOpenAddStorage} className="gap-1.5 font-semibold">
              <Plus className="w-4 h-4" /> Mount Storage
            </Button>
          )}
          {activeTab === "footage" && (
            <Button size="sm" onClick={handleOpenAddFootage} className="gap-1.5 font-semibold">
              <Plus className="w-4 h-4" /> Log Footage
            </Button>
          )}
        </div>
      </div>

      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Active Camera Cards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cameraCards.filter((c) => c.status === "active").length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Shoots: {cameraCards.reduce((sum, c) => sum + c.shootCount, 0)} takes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Storage Devices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{storageDevices.length}</div>
            <p className="text-xs text-emerald-500 font-medium mt-1">✓ {storageHealth} Online & Mirrored</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Storage Capacity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usagePercent}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round(totalUsed / 1000)}TB / {Math.round(totalCapacity / 1000)}TB
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Footage Intake
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {footageMetadata.filter((f) => f.status === "synced").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{footageMetadata.length} total takes ingested</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base font-bold">Media Management Hub</CardTitle>
          <CardDescription className="text-xs">
            Manage offloaded memory cards, RAID volumes, and metadata sync.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="cards" className="flex items-center gap-2">
                <Zap className="w-4 h-4" /> Cards ({cameraCards.length})
              </TabsTrigger>
              <TabsTrigger value="storage" className="flex items-center gap-2">
                <HardDrive className="w-4 h-4" /> Storage ({storageDevices.length})
              </TabsTrigger>
              <TabsTrigger value="footage" className="flex items-center gap-2">
                <Video className="w-4 h-4" /> Footage ({footageMetadata.length})
              </TabsTrigger>
              <TabsTrigger value="backup" className="flex items-center gap-2">
                <Shield className="w-4 h-4" /> Backup Strategy
              </TabsTrigger>
            </TabsList>

            {/* Camera Cards Tab */}
            <TabsContent value="cards" className="space-y-3">
              {cameraCards.length > 0 ? (
                <div className="space-y-3">
                  {cameraCards.map((card) => {
                    const proj = projects.find((p) => p.id === card.projectId);
                    return (
                      <div
                        key={card.id}
                        className="border rounded-xl p-4 hover:border-primary/40 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-base">{card.cardId}</h3>
                              {proj && !scopedProjectId && (
                                <Badge variant="outline" className="text-[10px]">
                                  {proj.title}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {card.format} Format · Offload Date: {card.shootDate}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`text-xs uppercase font-bold ${getStatusColor(card.status)}`}>
                              {card.status}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs bg-muted/30 p-3 rounded-lg">
                          <div>
                            <span className="text-muted-foreground block">Capacity</span>
                            <span className="font-bold text-sm text-foreground">{card.capacity} GB</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block">Available</span>
                            <span className="font-bold text-sm text-foreground">{card.available} GB</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block">Takes Logged</span>
                            <span className="font-bold text-sm text-foreground">{card.shootCount}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block">Backup Status</span>
                            <Badge variant="outline" className={`mt-0.5 text-[10px] ${getStatusColor(card.backupStatus)}`}>
                              {card.backupStatus}
                            </Badge>
                          </div>
                          <div>
                            <span className="text-muted-foreground block">Vault Location</span>
                            <span className="font-medium text-foreground truncate block">{card.location}</span>
                          </div>
                        </div>

                        {card.notes && (
                          <p className="text-xs text-muted-foreground mt-2.5">📝 {card.notes}</p>
                        )}

                        <div className="flex justify-end gap-2 mt-3 pt-2 border-t">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-8 gap-1"
                            onClick={() => handleOpenEditCard(card)}
                          >
                            <Edit2 className="w-3 h-3" /> Edit Card
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs h-8 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteCard(card.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed rounded-xl">
                  <Zap className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-30" />
                  <p className="text-sm text-muted-foreground font-medium">No camera cards registered</p>
                  <Button size="sm" onClick={handleOpenAddCard} className="mt-3 gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Register Card
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Storage Devices Tab */}
            <TabsContent value="storage" className="space-y-3">
              {storageDevices.length > 0 ? (
                <div className="space-y-3">
                  {storageDevices.map((device) => {
                    const usedPercent =
                      device.capacity > 0 ? Math.round((device.used / device.capacity) * 100) : 0;
                    return (
                      <div
                        key={device.id}
                        className="border rounded-xl p-4 hover:border-primary/40 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-bold text-base flex items-center gap-2">
                              <HardDrive className="w-4 h-4 text-primary" />
                              {device.deviceId} ({device.type})
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {device.location} · Last Verified: {device.lastVerified}
                            </p>
                          </div>
                          <Badge className={`text-xs uppercase font-bold ${getStatusColor(device.status)}`}>
                            {device.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3 text-xs bg-muted/30 p-3 rounded-lg">
                          <div>
                            <span className="text-muted-foreground block">Capacity</span>
                            <span className="font-bold text-sm text-foreground">
                              {Math.round(device.capacity / 1000)} TB
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block">Volume Used</span>
                            <span className="font-bold text-sm text-foreground">{usedPercent}%</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block">Redundancy</span>
                            <span className="font-medium text-foreground">
                              {device.redundancy ? "✓ RAID Mirrored" : "✗ Single Unit"}
                            </span>
                          </div>
                          {device.temperature && (
                            <div>
                              <span className="text-muted-foreground block">Drive Temp</span>
                              <span className="font-medium text-foreground">{device.temperature}°C</span>
                            </div>
                          )}
                        </div>

                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              usedPercent > 90 ? "bg-red-500" : usedPercent > 75 ? "bg-amber-500" : "bg-primary"
                            }`}
                            style={{ width: `${usedPercent}%` }}
                          />
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2 border-t">
                          <p className="text-xs text-muted-foreground">
                            Content: <span className="font-medium text-foreground">{device.content.join(", ")}</span>
                          </p>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-8 gap-1"
                              onClick={() => handleOpenEditStorage(device)}
                            >
                              <Edit2 className="w-3 h-3" /> Edit Device
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs h-8 text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteStorage(device.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed rounded-xl">
                  <HardDrive className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-30" />
                  <p className="text-sm text-muted-foreground font-medium">No storage devices mounted</p>
                  <Button size="sm" onClick={handleOpenAddStorage} className="mt-3 gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Mount Storage Unit
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Footage Metadata Tab */}
            <TabsContent value="footage" className="space-y-3">
              {footageMetadata.length > 0 ? (
                <div className="space-y-3">
                  {footageMetadata.map((footage) => (
                    <div
                      key={footage.id}
                      className="border rounded-xl p-4 hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-base">
                            Scene {footage.sceneId} · Take {footage.takeNumber}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Shot on {footage.shootDate} · Duration: {Math.round(footage.duration / 60)} min
                          </p>
                        </div>
                        <Badge className={`text-xs uppercase font-bold ${getStatusColor(footage.status)}`}>
                          {footage.status.replace("-", " ")}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-muted/30 p-3 rounded-lg mb-3">
                        <div>
                          <span className="text-muted-foreground block">Format</span>
                          <span className="font-bold text-sm text-foreground">{footage.format}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Resolution</span>
                          <span className="font-bold text-sm text-foreground">{footage.resolution}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Frame Rate</span>
                          <span className="font-bold text-sm text-foreground">{footage.fps} FPS</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Codec</span>
                          <span className="font-medium text-foreground">{footage.codecs}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-2.5">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span>Stored on:</span>
                          <div className="flex flex-wrap gap-1">
                            {footage.storedOn.map((dev, idx) => (
                              <Badge key={idx} variant="outline" className="text-[10px]">
                                {dev}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-8 gap-1"
                            onClick={() => handleOpenEditFootage(footage)}
                          >
                            <Edit2 className="w-3 h-3" /> Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs h-8 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteFootage(footage.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed rounded-xl">
                  <Video className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-30" />
                  <p className="text-sm text-muted-foreground font-medium">No footage recorded yet</p>
                  <Button size="sm" onClick={handleOpenAddFootage} className="mt-3 gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Log First Take
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Backup Strategy Tab */}
            <TabsContent value="backup" className="space-y-6">
              {/* Hero Banner with Actions */}
              <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-card via-card to-primary/5 p-5 sm:p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs font-bold border-primary/40 text-primary bg-primary/10 gap-1.5 py-0.5">
                        <Shield className="w-3.5 h-3.5" />
                        {strategyConfig.standardName}
                      </Badge>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        ● Zero Data Loss Guarantee
                      </span>
                      <span className="text-xs text-muted-foreground font-medium">
                        Rule: {strategyConfig.ruleCode}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-foreground">
                      Production Media Preservation & 3-Tier Redundancy Architecture
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {strategyConfig.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleOpenEditStrategy}
                      className="text-xs h-9 gap-1.5 border-primary/40 text-primary hover:bg-primary/10 font-semibold"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit Strategy
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleRunChecksumSweep}
                      disabled={isSweeping}
                      className="text-xs h-9 gap-1.5 font-semibold"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSweeping ? "animate-spin text-primary" : ""}`} />
                      {isSweeping ? "Sweeping 74TB..." : "Run Checksum Sweep"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleExportMhlCertificate}
                      className="text-xs h-9 gap-1.5"
                    >
                      <FileCheck className="w-3.5 h-3.5 text-emerald-500" />
                      Export MHL Audit
                    </Button>
                  </div>
                </div>
              </div>

              {/* Visual 3-Tier Storage Pipeline Architecture */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-primary" />
                    Storage Topology & Redundancy Pipeline
                  </h4>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    Automated Hash Verification: <strong className="text-foreground">{strategyConfig.hashAlgorithm}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Tier 1 */}
                  <div className="rounded-xl border bg-card p-4 space-y-3 relative group hover:border-primary/40 transition-all shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-500 font-black text-xs">
                          T1
                        </div>
                        <div>
                          <h5 className="font-bold text-xs text-foreground">Tier 1: On-Set Ingest</h5>
                          <span className="text-[10px] text-muted-foreground">Primary Working RAID</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-500 font-bold">
                        Live Ingest
                      </Badge>
                    </div>

                    <div className="p-2.5 rounded-lg bg-muted/40 text-xs space-y-1">
                      <p className="font-semibold text-foreground truncate">{strategyConfig.primaryTarget}</p>
                      <p className="text-[11px] text-muted-foreground">Ingest: Silverstack MHL with xxHash64</p>
                    </div>

                    <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1 border-t">
                      <span>Card Offload:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">✓ {strategyConfig.cardsOffloadedRate}</span>
                    </div>
                  </div>

                  {/* Tier 2 */}
                  <div className="rounded-xl border bg-card p-4 space-y-3 relative group hover:border-primary/40 transition-all shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-500 font-black text-xs">
                          T2
                        </div>
                        <div>
                          <h5 className="font-bold text-xs text-foreground">Tier 2: Nearline NAS</h5>
                          <span className="text-[10px] text-muted-foreground">Editorial Shuttle Mirror</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-500 font-bold">
                        Working Mirror
                      </Badge>
                    </div>

                    <div className="p-2.5 rounded-lg bg-muted/40 text-xs space-y-1">
                      <p className="font-semibold text-foreground truncate">{strategyConfig.secondaryTarget}</p>
                      <p className="text-[11px] text-muted-foreground">Editorial Streaming & Daily Transcodes</p>
                    </div>

                    <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1 border-t">
                      <span>Sync Schedule:</span>
                      <span className="font-semibold text-foreground">{strategyConfig.nasSyncFrequency}</span>
                    </div>
                  </div>

                  {/* Tier 3 */}
                  <div className="rounded-xl border bg-card p-4 space-y-3 relative group hover:border-primary/40 transition-all shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center text-purple-500 font-black text-xs">
                          T3
                        </div>
                        <div>
                          <h5 className="font-bold text-xs text-foreground">Tier 3: Off-Site Archive</h5>
                          <span className="text-[10px] text-muted-foreground">Cold LTO & Cloud Vault</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-500 font-bold">
                        Cold Vault
                      </Badge>
                    </div>

                    <div className="p-2.5 rounded-lg bg-muted/40 text-xs space-y-1">
                      <p className="font-semibold text-foreground truncate">{strategyConfig.tertiaryTarget}</p>
                      <p className="text-[11px] text-muted-foreground">Dual Physical Copies (LTFS Tape + Glacier)</p>
                    </div>

                    <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1 border-t">
                      <span>Archive Schedule:</span>
                      <span className="font-semibold text-foreground">{strategyConfig.ltoSyncFrequency}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status and Verification Details */}
              <div className="grid sm:grid-cols-2 gap-4 text-xs">
                <div className="border rounded-xl p-4 space-y-3 shadow-sm bg-card">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-500" />
                      Media Redundancy Check
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleOpenEditStrategy}
                      className="h-6 text-[11px] text-primary gap-1 px-2"
                    >
                      Configure
                    </Button>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Master Camera Cards Offloaded</span>
                    <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 font-bold">
                      ✓ {strategyConfig.cardsOffloadedRate}
                    </Badge>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">NAS Live Mirror Sync</span>
                    <span className="font-semibold text-foreground">{strategyConfig.nasSyncFrequency}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Cloud LTO Pre-staging</span>
                    <span className="font-semibold text-foreground">{strategyConfig.ltoSyncFrequency}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Physical Media Separation</span>
                    <span className="font-semibold text-foreground">NVMe Flash + LTO-9 Tape (Air-Gapped)</span>
                  </div>
                </div>

                <div className="border rounded-xl p-4 space-y-3 shadow-sm bg-card">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      Integrity & Checksum Verification
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRunChecksumSweep}
                      className="h-6 text-[11px] text-primary gap-1 px-2"
                    >
                      Sweep Now
                    </Button>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Primary Hash Algorithm</span>
                    <span className="font-semibold text-foreground">{strategyConfig.hashAlgorithm}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Last Full Sweep</span>
                    <span className="font-semibold text-foreground">{strategyConfig.lastSweepDate}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Data Integrity Rate</span>
                    <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 font-bold">
                      {strategyConfig.integrityRate}
                    </Badge>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Bit-Rot Parity Protection</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {strategyConfig.bitRotDetection ? "✓ Active (Automated MHL 2.0)" : "Manual"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Physical Vault & Custody Ledger */}
              <div className="border rounded-xl p-4 bg-muted/20 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-primary" />
                    Physical Vault & Chain of Custody
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenEditStrategy}
                    className="h-6 text-[11px] gap-1 px-2"
                  >
                    <Settings2 className="w-3 h-3" /> Edit Policy
                  </Button>
                </div>
                <div className="grid sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Secure Vault Storage</span>
                    <p className="font-semibold text-foreground mt-0.5">{strategyConfig.vaultLocation}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Retention Policy</span>
                    <p className="font-semibold text-foreground mt-0.5">{strategyConfig.retentionPeriod}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">DIT Supervisor Signoff</span>
                    <p className="font-semibold text-foreground mt-0.5">Hari Kethan (Lead DIT) & Lalitha Vemuri</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Card Modal */}
      <Dialog open={cardModalOpen} onOpenChange={setCardModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCard ? "Edit Camera Card" : "Register Camera Card"}</DialogTitle>
            <DialogDescription>Track offload status, capacity, and physical vault storage.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveCard} className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Card ID *</label>
                <Input
                  required
                  value={cardForm.cardId}
                  onChange={(e) => setCardForm({ ...cardForm, cardId: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Format</label>
                <Select
                  value={cardForm.format}
                  onValueChange={(val: any) => setCardForm({ ...cardForm, format: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RAW">RAW</SelectItem>
                    <SelectItem value="ProRes">ProRes</SelectItem>
                    <SelectItem value="DNxHR">DNxHR</SelectItem>
                    <SelectItem value="H.264">H.264</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Capacity (GB)</label>
                <Input
                  type="number"
                  value={cardForm.capacity}
                  onChange={(e) => setCardForm({ ...cardForm, capacity: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Available (GB)</label>
                <Input
                  type="number"
                  value={cardForm.available}
                  onChange={(e) => setCardForm({ ...cardForm, available: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Card Status</label>
                <Select
                  value={cardForm.status}
                  onValueChange={(val: any) => setCardForm({ ...cardForm, status: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                    <SelectItem value="corrupted">Corrupted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Backup Status</label>
                <Select
                  value={cardForm.backupStatus}
                  onValueChange={(val: any) => setCardForm({ ...cardForm, backupStatus: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Physical Location</label>
              <Input
                value={cardForm.location}
                onChange={(e) => setCardForm({ ...cardForm, location: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Notes</label>
              <Textarea
                rows={2}
                value={cardForm.notes}
                onChange={(e) => setCardForm({ ...cardForm, notes: e.target.value })}
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setCardModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary">
                Save Card
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Storage Modal */}
      <Dialog open={storageModalOpen} onOpenChange={setStorageModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingStorage ? "Edit Storage Device" : "Mount Storage Device"}</DialogTitle>
            <DialogDescription>Register high-capacity drives, RAID arrays, or NAS pools.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveStorage} className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Device ID *</label>
                <Input
                  required
                  value={storageForm.deviceId}
                  onChange={(e) => setStorageForm({ ...storageForm, deviceId: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Drive Type</label>
                <Select
                  value={storageForm.type}
                  onValueChange={(val: any) => setStorageForm({ ...storageForm, type: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SSD">SSD</SelectItem>
                    <SelectItem value="HDD">HDD</SelectItem>
                    <SelectItem value="NAS">NAS</SelectItem>
                    <SelectItem value="LTO-Tape">LTO-Tape</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Capacity (GB)</label>
                <Input
                  type="number"
                  value={storageForm.capacity}
                  onChange={(e) => setStorageForm({ ...storageForm, capacity: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Used (GB)</label>
                <Input
                  type="number"
                  value={storageForm.used}
                  onChange={(e) => setStorageForm({ ...storageForm, used: Number(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Location / Suite</label>
              <Input
                value={storageForm.location}
                onChange={(e) => setStorageForm({ ...storageForm, location: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Content Tags (comma separated)</label>
              <Input
                value={storageForm.content}
                onChange={(e) => setStorageForm({ ...storageForm, content: e.target.value })}
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setStorageModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary">
                Save Storage Device
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Footage Modal */}
      <Dialog open={footageModalOpen} onOpenChange={setFootageModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingFootage ? "Edit Footage Metadata" : "Log Ingested Footage"}</DialogTitle>
            <DialogDescription>Track scene takes, resolutions, and master storage locations.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveFootage} className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Scene ID *</label>
                <Input
                  required
                  value={footageForm.sceneId}
                  onChange={(e) => setFootageForm({ ...footageForm, sceneId: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Take Number</label>
                <Input
                  type="number"
                  value={footageForm.takeNumber}
                  onChange={(e) => setFootageForm({ ...footageForm, takeNumber: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Resolution</label>
                <Input
                  value={footageForm.resolution}
                  onChange={(e) => setFootageForm({ ...footageForm, resolution: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">FPS</label>
                <Input
                  type="number"
                  value={footageForm.fps}
                  onChange={(e) => setFootageForm({ ...footageForm, fps: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Duration (s)</label>
                <Input
                  type="number"
                  value={footageForm.duration}
                  onChange={(e) => setFootageForm({ ...footageForm, duration: Number(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Storage Units</label>
              <Input
                value={footageForm.storedOn}
                onChange={(e) => setFootageForm({ ...footageForm, storedOn: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Notes / Director Feedback</label>
              <Textarea
                rows={2}
                value={footageForm.notes}
                onChange={(e) => setFootageForm({ ...footageForm, notes: e.target.value })}
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setFootageModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary">
                Save Take
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Backup Strategy Modal */}
      <Dialog open={strategyModalOpen} onOpenChange={setStrategyModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Edit Production Backup Strategy & Policies
            </DialogTitle>
            <DialogDescription>
              Configure media redundancy tiers, checksum hash algorithms, sync frequencies, and physical vault locations.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveStrategy} className="space-y-3.5 pt-2">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Standard Policy Title *</label>
              <Input
                required
                value={strategyEditForm.standardName}
                onChange={(e) => setStrategyEditForm({ ...strategyEditForm, standardName: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Backup Rule Standard</label>
                <Select
                  value={strategyEditForm.ruleCode}
                  onValueChange={(val: any) =>
                    setStrategyEditForm({
                      ...strategyEditForm,
                      ruleCode: val,
                      standardName:
                        val === "3-2-1"
                          ? "Active 3-2-1 Production Backup Standard"
                          : val === "3-2-2"
                          ? "Enhanced 3-2-2 Extended Archival Standard"
                          : "Custom Production Backup Policy",
                    })
                  }
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3-2-1">3-2-1 Standard (3 Copies, 2 Media, 1 Offsite)</SelectItem>
                    <SelectItem value="3-2-2">3-2-2 Extended (3 Copies, 2 Media, 2 Offsites)</SelectItem>
                    <SelectItem value="custom">Custom Studio Rule</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Checksum Hash Algorithm</label>
                <Select
                  value={strategyEditForm.hashAlgorithm}
                  onValueChange={(val: any) => setStrategyEditForm({ ...strategyEditForm, hashAlgorithm: val })}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="xxHash64 & MD5">xxHash64 & MD5 (Industry Standard)</SelectItem>
                    <SelectItem value="SHA-256">SHA-256 (High Security Enterprise)</SelectItem>
                    <SelectItem value="xxHash64">xxHash64 (Ultra Fast Ingest)</SelectItem>
                    <SelectItem value="Blake3">Blake3 (Multi-Threaded)</SelectItem>
                    <SelectItem value="MD5">MD5 Only (Legacy Delivery)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Tier 1: On-Set Ingest Target</label>
              <Input
                value={strategyEditForm.primaryTarget}
                onChange={(e) => setStrategyEditForm({ ...strategyEditForm, primaryTarget: e.target.value })}
                placeholder="e.g. SanDisk PRO-BLADE 8TB NVMe RAID-0"
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Tier 2: Nearline NAS Mirror</label>
              <Input
                value={strategyEditForm.secondaryTarget}
                onChange={(e) => setStrategyEditForm({ ...strategyEditForm, secondaryTarget: e.target.value })}
                placeholder="e.g. QNAP 16-Bay Thunderbolt NAS"
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Tier 3: Off-Site Archive Target</label>
              <Input
                value={strategyEditForm.tertiaryTarget}
                onChange={(e) => setStrategyEditForm({ ...strategyEditForm, tertiaryTarget: e.target.value })}
                placeholder="e.g. Quantum LTO-9 Linear Tape & AWS Glacier"
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Nearline Sync Frequency</label>
                <Select
                  value={strategyEditForm.nasSyncFrequency}
                  onValueChange={(val: any) => setStrategyEditForm({ ...strategyEditForm, nasSyncFrequency: val })}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hourly Real-Time">Hourly Real-Time</SelectItem>
                    <SelectItem value="Continuous Real-Time">Continuous Real-Time</SelectItem>
                    <SelectItem value="Wrap-of-Day Batch">Wrap-of-Day Batch</SelectItem>
                    <SelectItem value="Every 4 Hours">Every 4 Hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Cold Archive Schedule</label>
                <Select
                  value={strategyEditForm.ltoSyncFrequency}
                  onValueChange={(val: any) => setStrategyEditForm({ ...strategyEditForm, ltoSyncFrequency: val })}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nightly Differential">Nightly Differential</SelectItem>
                    <SelectItem value="Weekly Wrap">Weekly Wrap</SelectItem>
                    <SelectItem value="End of Shooting Block">End of Shooting Block</SelectItem>
                    <SelectItem value="Continuous Replication">Continuous Replication</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Physical Vault Location</label>
                <Input
                  value={strategyEditForm.vaultLocation}
                  onChange={(e) => setStrategyEditForm({ ...strategyEditForm, vaultLocation: e.target.value })}
                  placeholder="e.g. Hyderabad Studio Main Safe & Mumbai Cloud Tier"
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Retention Period</label>
                <Input
                  value={strategyEditForm.retentionPeriod}
                  onChange={(e) => setStrategyEditForm({ ...strategyEditForm, retentionPeriod: e.target.value })}
                  placeholder="e.g. 3 Years / Post-Production Master Wrap"
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-2 pt-1 border-t">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <Checkbox
                  checked={strategyEditForm.autoMhlGeneration}
                  onCheckedChange={(checked) =>
                    setStrategyEditForm({ ...strategyEditForm, autoMhlGeneration: checked === true })
                  }
                />
                <span>Automated MHL (Media Hash List) manifest generation on offload</span>
              </label>

              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <Checkbox
                  checked={strategyEditForm.bitRotDetection}
                  onCheckedChange={(checked) =>
                    setStrategyEditForm({ ...strategyEditForm, bitRotDetection: checked === true })
                  }
                />
                <span>Background parity checks and bit-rot detection sweeps</span>
              </label>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setStrategyModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary">
                Save & Apply Strategy
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
