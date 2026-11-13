"use client";

import { useAppDataSlice, updateAppDataSlice, getAppDataSlice } from "./app-data-store";
import type { CameraCard, StorageDevice, FootageMetadata } from "./types";

export type MediaAssetType = "video" | "audio" | "image" | "document" | "other";
export type MediaAssetStatus = "draft" | "registered" | "in-review" | "approved" | "rejected" | "archived";

export interface MediaAsset {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  mediaType: MediaAssetType;
  fileReference?: string;
  shootDayId?: string;
  sceneId?: string;
  locationId?: string;
  castId?: string;
  recordedDate?: string;
  uploadedAt: string;
  status: MediaAssetStatus;
  currentVersion: number;
  tags: string[];
  notes?: string;
  createdBy?: string;
  updatedAt: string;
}

export interface MediaVersion {
  id: string;
  assetId: string;
  versionNumber: number;
  fileReference?: string;
  notes?: string;
  createdAt: string;
  createdBy?: string;
  status: "active" | "superseded" | "rejected";
  reviewStatus?: "pending" | "approved" | "rejected";
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

function validateCameraCardInput(input: Partial<CameraCard>): string | null {
  if (!input.cardId?.trim()) return "Card ID is required";
  if (!input.projectId?.trim()) return "Project reference is required";
  if (input.capacity !== undefined && (!Number.isFinite(input.capacity) || input.capacity <= 0)) {
    return "Capacity must be a positive number";
  }
  if (input.available !== undefined && (!Number.isFinite(input.available) || input.available < 0)) {
    return "Available space must be non-negative";
  }
  if (input.shootCount !== undefined && (!Number.isFinite(input.shootCount) || input.shootCount < 0)) {
    return "Shoot count must be non-negative";
  }
  return null;
}

function validateStorageInput(input: Partial<StorageDevice>): string | null {
  if (!input.deviceId?.trim()) return "Device ID is required";
  if (!input.projectId?.trim()) return "Project reference is required";
  if (input.capacity !== undefined && (!Number.isFinite(input.capacity) || input.capacity <= 0)) {
    return "Capacity must be a positive number";
  }
  if (input.used !== undefined && (!Number.isFinite(input.used) || input.used < 0)) {
    return "Used space must be non-negative";
  }
  if (input.temperature !== undefined && (!Number.isFinite(input.temperature))) {
    return "Temperature must be a valid number";
  }
  return null;
}

function validateFootageInput(input: Partial<FootageMetadata>): string | null {
  if (!input.sceneId?.trim()) return "Scene ID is required";
  if (!input.projectId?.trim()) return "Project reference is required";
  if (input.takeNumber !== undefined && (!Number.isFinite(input.takeNumber) || input.takeNumber < 1)) {
    return "Take number must be a positive integer";
  }
  if (input.duration !== undefined && (!Number.isFinite(input.duration) || input.duration <= 0)) {
    return "Duration must be a positive number";
  }
  if (input.fps !== undefined && (!Number.isFinite(input.fps) || input.fps <= 0)) {
    return "FPS must be a positive number";
  }
  return null;
}

function validateMediaAssetInput(input: Partial<MediaAsset>): string | null {
  if (!input.title?.trim()) return "Title is required";
  if (!input.projectId?.trim()) return "Project reference is required";
  if (!input.mediaType) return "Media type is required";
  return null;
}

export function useCameraCards(projectId?: string): CameraCard[] {
  const all = useAppDataSlice("cameraCards");
  if (!projectId || projectId === "all") return all;
  return all.filter((c) => c.projectId === projectId);
}

export function getCameraCardById(id: string): CameraCard | undefined {
  return getAppDataSlice("cameraCards").find((c) => c.id === id);
}

export function createCameraCard(
  input: Omit<CameraCard, "id">
): { success: true; card: CameraCard } | { success: false; error: string } {
  const error = validateCameraCardInput(input);
  if (error) return { success: false, error };

  const card: CameraCard = {
    id: `card-${Date.now()}`,
    projectId: input.projectId,
    cardId: input.cardId.trim(),
    capacity: input.capacity,
    available: input.available,
    format: input.format,
    shootDate: input.shootDate,
    status: input.status ?? "active",
    shootCount: input.shootCount ?? 0,
    backupStatus: input.backupStatus ?? "pending",
    location: input.location?.trim() || "On Set",
    notes: input.notes?.trim(),
  };

  updateAppDataSlice("cameraCards", (items) => [...items, card]);
  return { success: true, card };
}

export function updateCameraCard(
  id: string,
  updates: Partial<Omit<CameraCard, "id">>
): { success: true; card: CameraCard } | { success: false; error: string } {
  const existing = getCameraCardById(id);
  if (!existing) return { success: false, error: "Camera card not found" };

  const merged = { ...existing, ...updates };
  const error = validateCameraCardInput(merged);
  if (error) return { success: false, error };

  let updatedCard: CameraCard = existing;

  updateAppDataSlice("cameraCards", (items) =>
    items.map((c) => {
      if (c.id === id) {
        updatedCard = { ...c, ...updates };
        return updatedCard;
      }
      return c;
    })
  );

  return { success: true, card: updatedCard };
}

export function deleteCameraCard(id: string): { success: true } | { success: false; error: string } {
  const existing = getCameraCardById(id);
  if (!existing) return { success: false, error: "Camera card not found" };

  updateAppDataSlice("cameraCards", (items) => items.filter((c) => c.id !== id));
  return { success: true };
}

export function useStorageDevices(projectId?: string): StorageDevice[] {
  const all = useAppDataSlice("storageDevices");
  if (!projectId || projectId === "all") return all;
  return all.filter((d) => d.projectId === projectId);
}

export function getStorageDeviceById(id: string): StorageDevice | undefined {
  return getAppDataSlice("storageDevices").find((d) => d.id === id);
}

export function createStorageDevice(
  input: Omit<StorageDevice, "id">
): { success: true; device: StorageDevice } | { success: false; error: string } {
  const error = validateStorageInput(input);
  if (error) return { success: false, error };

  const device: StorageDevice = {
    id: `stor-${Date.now()}`,
    projectId: input.projectId,
    deviceId: input.deviceId.trim(),
    type: input.type,
    capacity: input.capacity,
    used: input.used,
    status: input.status ?? "active",
    location: input.location?.trim() || "Edit Suite",
    content: input.content ?? [],
    lastVerified: input.lastVerified || new Date().toISOString().slice(0, 10),
    redundancy: input.redundancy ?? false,
    temperature: input.temperature,
  };

  updateAppDataSlice("storageDevices", (items) => [...items, device]);
  return { success: true, device };
}

export function updateStorageDevice(
  id: string,
  updates: Partial<Omit<StorageDevice, "id">>
): { success: true; device: StorageDevice } | { success: false; error: string } {
  const existing = getStorageDeviceById(id);
  if (!existing) return { success: false, error: "Storage device not found" };

  const merged = { ...existing, ...updates };
  const error = validateStorageInput(merged);
  if (error) return { success: false, error };

  let updatedDevice: StorageDevice = existing;

  updateAppDataSlice("storageDevices", (items) =>
    items.map((d) => {
      if (d.id === id) {
        updatedDevice = { ...d, ...updates };
        return updatedDevice;
      }
      return d;
    })
  );

  return { success: true, device: updatedDevice };
}

export function deleteStorageDevice(id: string): { success: true } | { success: false; error: string } {
  const existing = getStorageDeviceById(id);
  if (!existing) return { success: false, error: "Storage device not found" };

  updateAppDataSlice("storageDevices", (items) => items.filter((d) => d.id !== id));
  return { success: true };
}

export function useFootageMetadata(projectId?: string): FootageMetadata[] {
  const all = useAppDataSlice("footageMetadata");
  if (!projectId || projectId === "all") return all;
  return all.filter((f) => f.projectId === projectId);
}

export function getFootageById(id: string): FootageMetadata | undefined {
  return getAppDataSlice("footageMetadata").find((f) => f.id === id);
}

export function createFootage(
  input: Omit<FootageMetadata, "id">
): { success: true; footage: FootageMetadata } | { success: false; error: string } {
  const error = validateFootageInput(input);
  if (error) return { success: false, error };

  const footage: FootageMetadata = {
    id: `ft-${Date.now()}`,
    projectId: input.projectId,
    sceneId: input.sceneId.trim(),
    takeNumber: input.takeNumber ?? 1,
    duration: input.duration,
    format: input.format?.trim() || "ProRes",
    resolution: input.resolution?.trim() || "4K",
    fps: input.fps ?? 24,
    codecs: input.codecs?.trim() || "ProRes 422 HQ",
    storedOn: input.storedOn ?? [],
    status: input.status ?? "raw",
    notes: input.notes?.trim(),
    shootDate: input.shootDate || new Date().toISOString().slice(0, 10),
  };

  updateAppDataSlice("footageMetadata", (items) => [...items, footage]);
  return { success: true, footage };
}

export function updateFootage(
  id: string,
  updates: Partial<Omit<FootageMetadata, "id">>
): { success: true; footage: FootageMetadata } | { success: false; error: string } {
  const existing = getFootageById(id);
  if (!existing) return { success: false, error: "Footage record not found" };

  const merged = { ...existing, ...updates };
  const error = validateFootageInput(merged);
  if (error) return { success: false, error };

  let updatedFootage: FootageMetadata = existing;

  updateAppDataSlice("footageMetadata", (items) =>
    items.map((f) => {
      if (f.id === id) {
        updatedFootage = { ...f, ...updates };
        return updatedFootage;
      }
      return f;
    })
  );

  return { success: true, footage: updatedFootage };
}

export function deleteFootage(id: string): { success: true } | { success: false; error: string } {
  const existing = getFootageById(id);
  if (!existing) return { success: false, error: "Footage record not found" };

  updateAppDataSlice("footageMetadata", (items) => items.filter((f) => f.id !== id));
  return { success: true };
}

export function useMediaAssets(projectId?: string): MediaAsset[] {
  const all = useAppDataSlice("mediaAssets");
  if (!projectId || projectId === "all") return all;
  return all.filter((a) => a.projectId === projectId);
}

export function getMediaAssetById(id: string): MediaAsset | undefined {
  return getAppDataSlice("mediaAssets").find((a) => a.id === id);
}

export function createMediaAsset(
  input: Omit<MediaAsset, "id" | "uploadedAt" | "updatedAt" | "currentVersion">
): { success: true; asset: MediaAsset } | { success: false; error: string } {
  const error = validateMediaAssetInput(input);
  if (error) return { success: false, error };

  const now = new Date().toISOString();
  const asset: MediaAsset = {
    id: `media-${crypto.randomUUID()}`,
    projectId: input.projectId,
    title: input.title.trim(),
    description: input.description?.trim(),
    mediaType: input.mediaType,
    fileReference: input.fileReference?.trim(),
    shootDayId: input.shootDayId,
    sceneId: input.sceneId,
    locationId: input.locationId,
    castId: input.castId,
    recordedDate: input.recordedDate,
    uploadedAt: now,
    status: input.status ?? "registered",
    currentVersion: 1,
    tags: input.tags ?? [],
    notes: input.notes?.trim(),
    createdBy: input.createdBy,
    updatedAt: now,
  };

  updateAppDataSlice("mediaAssets", (items) => [...items, asset]);

  const version: MediaVersion = {
    id: `mediaver-${crypto.randomUUID()}`,
    assetId: asset.id,
    versionNumber: 1,
    fileReference: asset.fileReference,
    notes: "Initial version",
    createdAt: now,
    createdBy: input.createdBy,
    status: "active",
    reviewStatus: "pending",
  };

  updateAppDataSlice("mediaVersions", (items) => [...items, version]);

  return { success: true, asset };
}

export function updateMediaAsset(
  id: string,
  updates: Partial<Omit<MediaAsset, "id" | "uploadedAt" | "currentVersion">>
): { success: true; asset: MediaAsset } | { success: false; error: string } {
  const existing = getMediaAssetById(id);
  if (!existing) return { success: false, error: "Media asset not found" };

  const merged = { ...existing, ...updates };
  const error = validateMediaAssetInput(merged);
  if (error) return { success: false, error };

  let updatedAsset: MediaAsset = existing;

  updateAppDataSlice("mediaAssets", (items) =>
    items.map((a) => {
      if (a.id === id) {
        updatedAsset = {
          ...a,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        return updatedAsset;
      }
      return a;
    })
  );

  return { success: true, asset: updatedAsset };
}

export function useMediaVersions(assetId: string): MediaVersion[] {
  return useAppDataSlice("mediaVersions").filter((v) => v.assetId === assetId);
}

export function createMediaVersion(
  assetId: string,
  input: { fileReference?: string; notes?: string; createdBy?: string }
): { success: true; version: MediaVersion } | { success: false; error: string } {
  const asset = getMediaAssetById(assetId);
  if (!asset) return { success: false, error: "Media asset not found" };

  const versions = getAppDataSlice("mediaVersions").filter((v) => v.assetId === assetId);
  const currentMax = versions.reduce((max, v) => Math.max(max, v.versionNumber), 0);
  const newVersionNumber = currentMax + 1;

  const now = new Date().toISOString();
  const version: MediaVersion = {
    id: `mediaver-${crypto.randomUUID()}`,
    assetId,
    versionNumber: newVersionNumber,
    fileReference: input.fileReference?.trim(),
    notes: input.notes?.trim(),
    createdAt: now,
    createdBy: input.createdBy,
    status: "active",
    reviewStatus: "pending",
  };

  updateAppDataSlice("mediaVersions", (items) =>
    items.map((v) =>
      v.assetId === assetId && v.status === "active"
        ? { ...v, status: "superseded" as const }
        : v
    ).concat(version)
  );

  updateAppDataSlice("mediaAssets", (items) =>
    items.map((a) =>
      a.id === assetId
        ? { ...a, currentVersion: newVersionNumber, fileReference: input.fileReference?.trim() ?? a.fileReference, updatedAt: now }
        : a
    )
  );

  return { success: true, version };
}

export function reviewMediaVersion(
  versionId: string,
  decision: "approved" | "rejected",
  reviewedBy?: string,
  notes?: string
): { success: true } | { success: false; error: string } {
  const versions = getAppDataSlice("mediaVersions");
  const version = versions.find((v) => v.id === versionId);
  if (!version) return { success: false, error: "Version not found" };

  if (version.status !== "active") {
    return { success: false, error: `Cannot review version with status "${version.status}"` };
  }

  const now = new Date().toISOString();

  updateAppDataSlice("mediaVersions", (items) =>
    items.map((v) =>
      v.id === versionId
        ? {
            ...v,
            reviewStatus: decision,
            reviewedBy,
            reviewedAt: now,
            reviewNotes: notes?.trim(),
            status: decision === "rejected" ? "rejected" as const : v.status,
          }
        : v
    )
  );

  if (decision === "approved") {
    updateAppDataSlice("mediaAssets", (items) =>
      items.map((a) =>
        a.id === version.assetId
          ? { ...a, status: "approved" as const, updatedAt: now }
          : a
      )
    );
  }

  return { success: true };
}

export function archiveMediaAsset(id: string): { success: true } | { success: false; error: string } {
  return updateMediaAsset(id, { status: "archived" });
}

export function calcMediaStats(
  cards: CameraCard[],
  storage: StorageDevice[],
  footage: FootageMetadata[]
) {
  const activeCards = cards.filter((c) => c.status === "active").length;
  const verifiedCards = cards.filter((c) => c.status === "verified").length;
  const totalCapacity = storage.reduce((sum, d) => sum + d.capacity, 0);
  const totalUsed = storage.reduce((sum, d) => sum + d.used, 0);
  const usagePercent = totalCapacity > 0 ? Math.round((totalUsed / totalCapacity) * 100) : 0;
  const syncedFootage = footage.filter((f) => f.status === "synced").length;

  return {
    cards: { total: cards.length, active: activeCards, verified: verifiedCards },
    storage: { devices: storage.length, capacityGB: totalCapacity, usedGB: totalUsed, usagePercent },
    footage: { total: footage.length, synced: syncedFootage },
  };
}
