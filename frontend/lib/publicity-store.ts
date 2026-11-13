"use client";

import { useMemo } from "react";
import { useModuleSlice, updateModuleSlice, seedModuleSlice } from "./module-store";

export interface PublicityAsset {
  id: string;
  projectId: string;
  assetType: "first-look" | "character-poster" | "motion-poster" | "teaser-poster" | "trailer-thumbnail" | "banner" | "social-media" | "press-kit" | "promo-photo" | "other";
  name: string;
  version: number;
  designer?: string;
  approvalStatus: "draft" | "review" | "approved" | "rejected";
  approvalHistory?: { date: string; action: string; by: string }[];
  fileLocation?: string;
  publishStatus: "unpublished" | "scheduled" | "published";
  releaseDate?: string;
  platform?: string;
  notes?: string;
}

const SEED: PublicityAsset[] = [
  { id: "pub-1", projectId: "p1", assetType: "first-look", name: "Game Changer — First Look Poster", version: 2, designer: "Anand Graphics", approvalStatus: "approved", publishStatus: "published", releaseDate: "2027-03-01", platform: "All platforms" },
  { id: "pub-2", projectId: "p1", assetType: "character-poster", name: "Arjun Character Poster", version: 1, designer: "Anand Graphics", approvalStatus: "review", publishStatus: "unpublished" },
  { id: "pub-3", projectId: "p2", assetType: "motion-poster", name: "Pushpa 2 Motion Poster", version: 3, designer: "Creative Labs", approvalStatus: "approved", publishStatus: "published", platform: "YouTube, Instagram" },
];

export function initPublicitySeedData() { seedModuleSlice("publicityAssets", SEED); }

export function usePublicityAssets(projectId?: string): PublicityAsset[] {
  const all = useModuleSlice<PublicityAsset>("publicityAssets");
  return useMemo(() => !projectId ? all : all.filter((a) => a.projectId === projectId), [all, projectId]);
}

export function createPublicityAsset(input: Omit<PublicityAsset, "id">): PublicityAsset {
  const item: PublicityAsset = { id: `pub-${crypto.randomUUID().slice(0, 8)}`, ...input };
  updateModuleSlice<PublicityAsset>("publicityAssets", (items) => [...items, item]);
  return item;
}

export function updatePublicityAsset(id: string, updates: Partial<PublicityAsset>): PublicityAsset | null {
  let found: PublicityAsset | null = null;
  updateModuleSlice<PublicityAsset>("publicityAssets", (items) =>
    items.map((a) => { if (a.id === id) { found = { ...a, ...updates }; return found; } return a; })
  );
  return found;
}
