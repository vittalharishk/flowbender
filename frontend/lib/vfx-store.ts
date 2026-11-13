"use client";

import { useAppDataSlice, updateAppDataSlice, getAppDataSlice } from "./app-data-store";
import type { VfxShot, VfxShotStatus } from "./types";

export type VfxPriority = "low" | "medium" | "high";
export type VfxVersionStatus = "submitted" | "in-review" | "approved" | "rejected" | "superseded";

export interface VfxVersion {
  id: string;
  shotId: string;
  versionNumber: number;
  submittedAt: string;
  submittedBy?: string;
  assetReference?: string;
  notes?: string;
  status: VfxVersionStatus;
  reviewStatus?: "pending" | "approved" | "rejected" | "revision-required";
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  revisionReason?: string;
}

export interface VfxReview {
  id: string;
  shotId: string;
  versionId: string;
  reviewerId?: string;
  reviewerRole?: string;
  decision: "approved" | "rejected" | "revision-required";
  comments?: string;
  createdAt: string;
}

const VFX_STATUS_ORDER: VfxShotStatus[] = ["briefed", "in-progress", "client-review", "final"];

const VALID_STATUS_TRANSITIONS: Record<VfxShotStatus, VfxShotStatus[]> = {
  "briefed": ["in-progress"],
  "in-progress": ["client-review", "briefed"],
  "client-review": ["final", "in-progress"],
  "final": [],
};

function validateVfxShotInput(input: Partial<VfxShot>): string | null {
  if (!input.shotCode?.trim()) return "Shot code is required";
  if (!input.projectId?.trim()) return "Project reference is required";
  if (!input.description?.trim()) return "Description is required";
  if (!input.dueDate) return "Due date is required";
  return null;
}

function validateVfxVersionInput(input: Partial<VfxVersion>): string | null {
  if (!input.shotId?.trim()) return "Shot reference is required";
  return null;
}

export function useVfxShots(projectId?: string): VfxShot[] {
  const all = useAppDataSlice("vfxShots");
  if (!projectId || projectId === "all") return all;
  return all.filter((s) => s.projectId === projectId);
}

export function useVfxShotsByStatus(status: VfxShotStatus, projectId?: string): VfxShot[] {
  const shots = useVfxShots(projectId);
  return shots.filter((s) => s.status === status);
}

export function getVfxShotById(id: string): VfxShot | undefined {
  return getAppDataSlice("vfxShots").find((s) => s.id === id);
}

export function getVfxShotsByProject(projectId: string): VfxShot[] {
  const all = getAppDataSlice("vfxShots");
  if (projectId === "all") return all;
  return all.filter((s) => s.projectId === projectId);
}

export function createVfxShot(
  input: Omit<VfxShot, "id">
): { success: true; shot: VfxShot } | { success: false; error: string } {
  const error = validateVfxShotInput(input);
  if (error) return { success: false, error };

  const existing = getAppDataSlice("vfxShots");
  const duplicate = existing.find(
    (s) => s.projectId === input.projectId && s.shotCode.toLowerCase() === input.shotCode.trim().toLowerCase()
  );
  if (duplicate) {
    return { success: false, error: `Shot code "${input.shotCode}" already exists in this project` };
  }

  const shot: VfxShot = {
    id: `vfx-${Date.now()}`,
    projectId: input.projectId,
    shotCode: input.shotCode.trim(),
    sequence: input.sequence?.trim() || "General",
    description: input.description.trim(),
    vendorId: input.vendorId?.trim() || undefined,
    status: input.status ?? "briefed",
    priority: input.priority ?? "medium",
    dueDate: input.dueDate,
  };

  updateAppDataSlice("vfxShots", (items) => [...items, shot]);
  return { success: true, shot };
}

export function updateVfxShot(
  id: string,
  updates: Partial<Omit<VfxShot, "id">>
): { success: true; shot: VfxShot } | { success: false; error: string } {
  const existing = getVfxShotById(id);
  if (!existing) return { success: false, error: "VFX shot not found" };

  const merged = { ...existing, ...updates };
  const error = validateVfxShotInput(merged);
  if (error) return { success: false, error };

  if (updates.shotCode && updates.shotCode !== existing.shotCode) {
    const all = getAppDataSlice("vfxShots");
    const duplicate = all.find(
      (s) => s.id !== id && s.projectId === merged.projectId && s.shotCode.toLowerCase() === updates.shotCode!.trim().toLowerCase()
    );
    if (duplicate) {
      return { success: false, error: `Shot code "${updates.shotCode}" already exists in this project` };
    }
  }

  let updatedShot: VfxShot = existing;

  updateAppDataSlice("vfxShots", (items) =>
    items.map((s) => {
      if (s.id === id) {
        updatedShot = {
          ...s,
          ...updates,
          shotCode: updates.shotCode?.trim() ?? s.shotCode,
          sequence: updates.sequence?.trim() ?? s.sequence,
          description: updates.description?.trim() ?? s.description,
          vendorId: updates.vendorId?.trim() ?? s.vendorId,
        };
        return updatedShot;
      }
      return s;
    })
  );

  return { success: true, shot: updatedShot };
}

export function deleteVfxShot(id: string): { success: true } | { success: false; error: string } {
  const existing = getVfxShotById(id);
  if (!existing) return { success: false, error: "VFX shot not found" };

  if (existing.status === "final") {
    return { success: false, error: "Cannot delete a finalized VFX shot" };
  }

  updateAppDataSlice("vfxShots", (items) => items.filter((s) => s.id !== id));
  updateAppDataSlice("vfxVersions", (items) => items.filter((v) => v.shotId !== id));
  updateAppDataSlice("vfxReviews", (items) => items.filter((r) => r.shotId !== id));

  return { success: true };
}

export function changeVfxShotStatus(
  id: string,
  newStatus: VfxShotStatus
): { success: true } | { success: false; error: string } {
  const shot = getVfxShotById(id);
  if (!shot) return { success: false, error: "VFX shot not found" };

  if (shot.status === newStatus) return { success: true };

  const allowedTransitions = VALID_STATUS_TRANSITIONS[shot.status];
  if (!allowedTransitions.includes(newStatus)) {
    return { success: false, error: `Cannot transition from "${shot.status}" to "${newStatus}"` };
  }

  updateAppDataSlice("vfxShots", (items) =>
    items.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
  );

  return { success: true };
}

export function advanceVfxShot(id: string): { success: true; newStatus: VfxShotStatus } | { success: false; error: string } {
  const shot = getVfxShotById(id);
  if (!shot) return { success: false, error: "VFX shot not found" };

  const currentIndex = VFX_STATUS_ORDER.indexOf(shot.status);
  if (currentIndex === -1 || currentIndex >= VFX_STATUS_ORDER.length - 1) {
    return { success: false, error: "Shot is already at final status" };
  }

  const newStatus = VFX_STATUS_ORDER[currentIndex + 1];
  const result = changeVfxShotStatus(id, newStatus);
  if (!result.success) return result;

  return { success: true, newStatus };
}

export function assignVfxVendor(
  id: string,
  vendorId: string
): { success: true } | { success: false; error: string } {
  const shot = getVfxShotById(id);
  if (!shot) return { success: false, error: "VFX shot not found" };

  updateAppDataSlice("vfxShots", (items) =>
    items.map((s) => (s.id === id ? { ...s, vendorId: vendorId.trim() || undefined } : s))
  );

  return { success: true };
}

export function useVfxVersions(shotId: string): VfxVersion[] {
  return useAppDataSlice("vfxVersions").filter((v) => v.shotId === shotId);
}

export function getVfxVersions(shotId: string): VfxVersion[] {
  return getAppDataSlice("vfxVersions").filter((v) => v.shotId === shotId);
}

export function getLatestVfxVersion(shotId: string): VfxVersion | undefined {
  const versions = getVfxVersions(shotId);
  if (versions.length === 0) return undefined;
  return versions.reduce((latest, v) =>
    v.versionNumber > latest.versionNumber ? v : latest
  );
}

export function submitVfxVersion(
  shotId: string,
  input: { assetReference?: string; notes?: string; submittedBy?: string }
): { success: true; version: VfxVersion } | { success: false; error: string } {
  const shot = getVfxShotById(shotId);
  if (!shot) return { success: false, error: "VFX shot not found" };

  if (shot.status === "final") {
    return { success: false, error: "Cannot submit version for finalized shot" };
  }

  const existingVersions = getVfxVersions(shotId);
  const currentMax = existingVersions.reduce((max, v) => Math.max(max, v.versionNumber), 0);
  const newVersionNumber = currentMax + 1;

  const now = new Date().toISOString();
  const version: VfxVersion = {
    id: `vfxver-${crypto.randomUUID()}`,
    shotId,
    versionNumber: newVersionNumber,
    submittedAt: now,
    submittedBy: input.submittedBy,
    assetReference: input.assetReference?.trim(),
    notes: input.notes?.trim(),
    status: "submitted",
    reviewStatus: "pending",
  };

  updateAppDataSlice("vfxVersions", (items) =>
    items.map((v) =>
      v.shotId === shotId && v.status === "submitted"
        ? { ...v, status: "superseded" as const }
        : v
    ).concat(version)
  );

  if (shot.status === "briefed") {
    changeVfxShotStatus(shotId, "in-progress");
  }

  return { success: true, version };
}

export function reviewVfxVersion(
  versionId: string,
  decision: "approved" | "rejected" | "revision-required",
  reviewedBy?: string,
  comments?: string
): { success: true } | { success: false; error: string } {
  const versions = getAppDataSlice("vfxVersions");
  const version = versions.find((v) => v.id === versionId);
  if (!version) return { success: false, error: "Version not found" };

  if (version.status !== "submitted" && version.status !== "in-review") {
    return { success: false, error: `Cannot review version with status "${version.status}"` };
  }

  const now = new Date().toISOString();

  updateAppDataSlice("vfxVersions", (items) =>
    items.map((v) =>
      v.id === versionId
        ? {
            ...v,
            status: decision === "approved" ? "approved" as const : decision === "rejected" ? "rejected" as const : "in-review" as const,
            reviewStatus: decision,
            reviewedBy,
            reviewedAt: now,
            reviewNotes: comments?.trim(),
            revisionReason: decision === "revision-required" ? comments?.trim() : undefined,
          }
        : v
    )
  );

  const review: VfxReview = {
    id: `vfxreview-${crypto.randomUUID()}`,
    shotId: version.shotId,
    versionId,
    reviewerId: reviewedBy,
    decision,
    comments: comments?.trim(),
    createdAt: now,
  };

  updateAppDataSlice("vfxReviews", (items) => [...items, review]);

  const shot = getVfxShotById(version.shotId);
  if (shot) {
    if (decision === "approved" && shot.status === "client-review") {
      changeVfxShotStatus(version.shotId, "final");
    } else if (decision === "revision-required" && shot.status === "client-review") {
      changeVfxShotStatus(version.shotId, "in-progress");
    }
  }

  return { success: true };
}

export function useVfxReviews(shotId: string): VfxReview[] {
  return useAppDataSlice("vfxReviews").filter((r) => r.shotId === shotId);
}

export function calcVfxStats(shots: VfxShot[]) {
  const now = new Date().toISOString().slice(0, 10);

  return {
    total: shots.length,
    briefed: shots.filter((s) => s.status === "briefed").length,
    inProgress: shots.filter((s) => s.status === "in-progress").length,
    inReview: shots.filter((s) => s.status === "client-review").length,
    final: shots.filter((s) => s.status === "final").length,
    overdue: shots.filter((s) => s.status !== "final" && s.dueDate < now).length,
    highPriority: shots.filter((s) => s.priority === "high" && s.status !== "final").length,
    byVendor: shots.reduce<Record<string, number>>((acc, s) => {
      const vendor = s.vendorId || "Unassigned";
      acc[vendor] = (acc[vendor] ?? 0) + 1;
      return acc;
    }, {}),
  };
}

export function getOverdueVfxShots(projectId?: string): VfxShot[] {
  const shots = projectId ? getVfxShotsByProject(projectId) : getAppDataSlice("vfxShots");
  const now = new Date().toISOString().slice(0, 10);
  return shots.filter((s) => s.status !== "final" && s.dueDate < now);
}

export { VFX_STATUS_ORDER, VALID_STATUS_TRANSITIONS };
