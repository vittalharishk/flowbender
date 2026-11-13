"use client";

import { useMemo } from "react";
import { useModuleSlice, updateModuleSlice, seedModuleSlice } from "./module-store";

export interface BgmCue {
  id: string;
  projectId: string;
  cueIdCode: string;
  sceneReference?: string;
  description?: string;
  composer?: string;
  durationSeconds?: number;
  status: "pending" | "composing" | "recorded" | "mixing" | "approved" | "final";
  version: number;
  approved: boolean;
  finalDeliveryDate?: string;
  rightsReference?: string;
  notes?: string;
}

const SEED: BgmCue[] = [
  { id: "bgm-1", projectId: "p1", cueIdCode: "BGM-001", sceneReference: "Sc-1", description: "Opening theme — heroic entrance", composer: "A.R. Rehman", durationSeconds: 180, status: "approved", version: 3, approved: true },
  { id: "bgm-2", projectId: "p1", cueIdCode: "BGM-002", sceneReference: "Sc-5", description: "Romantic melody — park scene", composer: "A.R. Rehman", durationSeconds: 240, status: "composing", version: 1, approved: false },
  { id: "bgm-3", projectId: "p2", cueIdCode: "BGM-001", sceneReference: "Sc-1", description: "Suspense theme", composer: "Thaman S", durationSeconds: 120, status: "recorded", version: 2, approved: false },
];

export function initBgmSeedData() { seedModuleSlice("bgmCues", SEED); }

export function useBgmCues(projectId?: string): BgmCue[] {
  const all = useModuleSlice<BgmCue>("bgmCues");
  return useMemo(() => !projectId ? all : all.filter((c) => c.projectId === projectId), [all, projectId]);
}

export function createBgmCue(input: Omit<BgmCue, "id">): BgmCue {
  const item: BgmCue = { id: `bgm-${crypto.randomUUID().slice(0, 8)}`, ...input };
  updateModuleSlice<BgmCue>("bgmCues", (items) => [...items, item]);
  return item;
}

export function updateBgmCue(id: string, updates: Partial<BgmCue>): BgmCue | null {
  let found: BgmCue | null = null;
  updateModuleSlice<BgmCue>("bgmCues", (items) =>
    items.map((c) => { if (c.id === id) { found = { ...c, ...updates }; return found; } return c; })
  );
  return found;
}
