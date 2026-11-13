"use client";

import { useMemo } from "react";
import { useModuleSlice, updateModuleSlice, seedModuleSlice } from "./module-store";

export interface TrailerTeaser {
  id: string;
  projectId: string;
  promoType: "teaser" | "trailer" | "character-teaser" | "promotional-clip";
  title: string;
  runtimeSeconds?: number;
  editor?: string;
  version: number;
  directorApproved: boolean;
  producerApproved: boolean;
  releaseDate?: string;
  platform?: string;
  fileReference?: string;
  status: "in-progress" | "review" | "approved" | "released";
  reviewComments?: string;
  notes?: string;
}

const SEED: TrailerTeaser[] = [
  { id: "trailer-1", projectId: "p1", promoType: "teaser", title: "Game Changer — First Look Teaser", runtimeSeconds: 45, editor: "Ravi Shankar", version: 2, directorApproved: true, producerApproved: true, releaseDate: "2027-04-01", platform: "YouTube", status: "released" },
  { id: "trailer-2", projectId: "p1", promoType: "trailer", title: "Game Changer — Official Trailer", runtimeSeconds: 150, editor: "Ravi Shankar", version: 1, directorApproved: false, producerApproved: false, status: "in-progress" },
  { id: "trailer-3", projectId: "p2", promoType: "character-teaser", title: "Pushpa 2 — Pushpa Raj Intro", runtimeSeconds: 30, version: 1, directorApproved: true, producerApproved: false, platform: "Instagram", status: "review" },
];

export function initTrailerSeedData() { seedModuleSlice("trailersTeasers", SEED); }

export function useTrailers(projectId?: string): TrailerTeaser[] {
  const all = useModuleSlice<TrailerTeaser>("trailersTeasers");
  return useMemo(() => !projectId ? all : all.filter((t) => t.projectId === projectId), [all, projectId]);
}

export function createTrailer(input: Omit<TrailerTeaser, "id">): TrailerTeaser {
  const item: TrailerTeaser = { id: `trailer-${crypto.randomUUID().slice(0, 8)}`, ...input };
  updateModuleSlice<TrailerTeaser>("trailersTeasers", (items) => [...items, item]);
  return item;
}

export function updateTrailer(id: string, updates: Partial<TrailerTeaser>): TrailerTeaser | null {
  let found: TrailerTeaser | null = null;
  updateModuleSlice<TrailerTeaser>("trailersTeasers", (items) =>
    items.map((t) => { if (t.id === id) { found = { ...t, ...updates }; return found; } return t; })
  );
  return found;
}
