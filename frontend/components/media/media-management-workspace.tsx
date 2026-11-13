"use client";

import { useConfirm } from "@/components/app/confirm-dialog";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, HardDrive, Video, Shield, Database } from "lucide-react";
import { useProjects, useProject } from "@/lib/project-store";
import { useAppDataSlice, updateAppDataSlice } from "@/lib/app-data-store";
import type { CameraCard, StorageDevice, FootageMetadata } from "@/lib/types";
import { toast } from "sonner";

import { CameraCardsTab } from "./camera-cards-tab";
import { StorageDevicesTab } from "./storage-devices-tab";
import { FootageMetadataTab } from "./footage-metadata-tab";
import { BackupStrategyTab } from "./backup-strategy-tab";
import {
  CardDialog,
  StorageDialog,
  FootageDialog,
  type CardFormState,
  type StorageFormState,
  type FootageFormState,
} from "./media-entity-dialogs";

interface MediaManagementWorkspaceProps {
  projectId?: string;
}

export function MediaManagementWorkspace({ projectId: scopedProjectId }: MediaManagementWorkspaceProps) {
  const confirm = useConfirm();
  const projects = useProjects();
  const scopedProject = useProject(scopedProjectId || "");

  const allCards = useAppDataSlice("cameraCards");
  const allStorage = useAppDataSlice("storageDevices");
  const allFootage = useAppDataSlice("footageMetadata");

  const [selectedProjectId, setSelectedProjectId] = useState<string>(scopedProjectId || "all");
  const effectiveProjectId = scopedProjectId || selectedProjectId;

  const cameraCards = allCards.filter(
    (c) => !effectiveProjectId || effectiveProjectId === "all" || c.projectId === effectiveProjectId
  );
  const storageDevices = allStorage.filter(
    (d) => !effectiveProjectId || effectiveProjectId === "all" || d.projectId === effectiveProjectId
  );
  const footageMetadata = allFootage.filter(
    (f) => !effectiveProjectId || effectiveProjectId === "all" || f.projectId === effectiveProjectId
  );

  const [activeTab, setActiveTab] = useState("cards");

  // KPI calcs
  const storageHealth = storageDevices.filter((d) => d.status === "active").length;
  const totalCapacity = storageDevices.reduce((sum, d) => sum + d.capacity, 0);
  const totalUsed = storageDevices.reduce((sum, d) => sum + d.used, 0);
  const usagePercent = totalCapacity > 0 ? Math.round((totalUsed / totalCapacity) * 100) : 0;

  // --- Card state ---
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CameraCard | null>(null);
  const [cardForm, setCardForm] = useState<CardFormState>({
    cardId: "",
    capacity: 256,
    available: 32,
    format: "RAW",
    shootDate: new Date().toISOString().slice(0, 10),
    status: "active",
    shootCount: 40,
    backupStatus: "in-progress",
    location: "DIT Unit Safe",
    notes: "",
    projectId: effectiveProjectId || projects[0]?.id || "",
  });

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

  const handleDeleteCard = async (id: string) => {
    if (
      await confirm({
        title: "Delete camera card record?",
        description: "This camera card record will be permanently removed.",
        confirmLabel: "Delete",
      })
    ) {
      updateAppDataSlice("cameraCards", (cur) => cur.filter((c) => c.id !== id));
      toast.info("Card record deleted.");
      setCardModalOpen(false);
    }
  };

  // --- Storage state ---
  const [storageModalOpen, setStorageModalOpen] = useState(false);
  const [editingStorage, setEditingStorage] = useState<StorageDevice | null>(null);
  const [storageForm, setStorageForm] = useState<StorageFormState>({
    deviceId: "",
    type: "SSD",
    capacity: 4000,
    used: 2400,
    status: "active",
    location: "Edit Suite A",
    content: "Raw Footage, Proxies",
    redundancy: true,
    temperature: 35,
    projectId: effectiveProjectId || projects[0]?.id || "",
  });

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

  const handleDeleteStorage = async (id: string) => {
    if (
      await confirm({
        title: "Delete storage unit record?",
        description: "This storage unit record will be permanently removed.",
        confirmLabel: "Delete",
      })
    ) {
      updateAppDataSlice("storageDevices", (cur) => cur.filter((d) => d.id !== id));
      toast.info("Storage unit removed.");
      setStorageModalOpen(false);
    }
  };

  // --- Footage state ---
  const [footageModalOpen, setFootageModalOpen] = useState(false);
  const [editingFootage, setEditingFootage] = useState<FootageMetadata | null>(null);
  const [footageForm, setFootageForm] = useState<FootageFormState>({
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
    projectId: effectiveProjectId || projects[0]?.id || "",
  });

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

  const handleDeleteFootage = async (id: string) => {
    if (
      await confirm({
        title: "Delete footage metadata record?",
        description: "This footage metadata record will be permanently removed.",
        confirmLabel: "Delete",
      })
    ) {
      updateAppDataSlice("footageMetadata", (cur) => cur.filter((f) => f.id !== id));
      toast.info("Footage record deleted.");
      setFootageModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        as="h1"
        icon={Video}
        title={scopedProject ? `${scopedProject.title} · Media Vault` : "Media Management"}
        description={
          scopedProject
            ? `Camera cards, NAS storage, and raw footage intake for ${scopedProject.title}`
            : "Camera cards, on-set DIT offloads, volume storage, and verified backups"
        }
        actions={
          <div className="flex items-center gap-2">
            {!scopedProjectId && (
              <div className="flex items-center gap-2">
                <Label htmlFor="media-project-select" className="text-xs font-semibold sr-only">
                  Project
                </Label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger id="media-project-select" className="w-[180px] h-9 text-xs">
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
            {activeTab === "cards" && (
              <Button size="sm" variant="primary" onClick={handleOpenAddCard} className="gap-1.5 font-semibold">
                <Plus className="w-4 h-4" /> Add Card
              </Button>
            )}
            {activeTab === "storage" && (
              <Button size="sm" variant="primary" onClick={handleOpenAddStorage} className="gap-1.5 font-semibold">
                <Plus className="w-4 h-4" /> Mount Storage
              </Button>
            )}
            {activeTab === "footage" && (
              <Button size="sm" variant="primary" onClick={handleOpenAddFootage} className="gap-1.5 font-semibold">
                <Plus className="w-4 h-4" /> Log Footage
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={HardDrive}
          label="Active Camera Cards"
          value={cameraCards.filter((c) => c.status === "active").length}
          hint={`${cameraCards.reduce((sum, c) => sum + c.shootCount, 0)} total takes`}
        />
        <StatCard
          icon={Database}
          label="Storage Health"
          value={`${storageHealth} Active`}
          hint={`${usagePercent}% capacity used`}
        />
        <StatCard
          icon={Video}
          label="Footage Logged"
          value={footageMetadata.length}
          hint={`${footageMetadata.filter((f) => f.status === "synced").length} synced`}
        />
        <StatCard
          icon={Shield}
          label="Storage Volumes"
          value={storageDevices.length}
          hint={totalCapacity > 0 ? `${Math.round(totalCapacity / 1000)}TB total capacity` : "No devices"}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="cards">Camera Cards</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
          <TabsTrigger value="footage">Footage</TabsTrigger>
          <TabsTrigger value="backup">Backup Strategy</TabsTrigger>
        </TabsList>

        <TabsContent value="cards" className="mt-4">
          <CameraCardsTab
            cameraCards={cameraCards}
            projects={projects}
            scopedProjectId={scopedProjectId}
            onEdit={handleOpenEditCard}
            onDelete={handleDeleteCard}
            onAdd={handleOpenAddCard}
          />
        </TabsContent>

        <TabsContent value="storage" className="mt-4">
          <StorageDevicesTab
            storageDevices={storageDevices}
            onEdit={handleOpenEditStorage}
            onDelete={handleDeleteStorage}
            onAdd={handleOpenAddStorage}
          />
        </TabsContent>

        <TabsContent value="footage" className="mt-4">
          <FootageMetadataTab
            footageMetadata={footageMetadata}
            onEdit={handleOpenEditFootage}
            onDelete={handleDeleteFootage}
            onAdd={handleOpenAddFootage}
          />
        </TabsContent>

        <TabsContent value="backup" className="mt-4">
          <BackupStrategyTab projectTitle={scopedProject?.title} />
        </TabsContent>
      </Tabs>

      <CardDialog
        open={cardModalOpen}
        onOpenChange={setCardModalOpen}
        editing={editingCard}
        form={cardForm}
        onChange={setCardForm}
        onSubmit={handleSaveCard}
      />

      <StorageDialog
        open={storageModalOpen}
        onOpenChange={setStorageModalOpen}
        editing={editingStorage}
        form={storageForm}
        onChange={setStorageForm}
        onSubmit={handleSaveStorage}
      />

      <FootageDialog
        open={footageModalOpen}
        onOpenChange={setFootageModalOpen}
        editing={editingFootage}
        form={footageForm}
        onChange={setFootageForm}
        onSubmit={handleSaveFootage}
      />
    </div>
  );
}
