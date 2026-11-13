"use client";

import { useMemo } from "react";
import { useModuleSlice, updateModuleSlice, seedModuleSlice } from "./module-store";

export interface DubbingSession {
  id: string;
  projectId: string;
  sceneReference?: string;
  character: string;
  language: string;
  dubbingArtist?: string;
  recordingStudio?: string;
  scheduledDate?: string;
  status: "scheduled" | "in-progress" | "completed" | "retake" | "approved";
  retakes: number;
  approved: boolean;
  finalDeliveryDate?: string;
  version: number;
  notes?: string;
}

const SEED: DubbingSession[] = [
  { id: "dub-1", projectId: "p1", sceneReference: "Sc-1", character: "Arjun", language: "Telugu", dubbingArtist: "Vijay Kumar", recordingStudio: "Prasad Studios", scheduledDate: "2027-03-15", status: "completed", retakes: 1, approved: true, version: 2 },
  { id: "dub-2", projectId: "p1", sceneReference: "Sc-1", character: "Arjun", language: "Hindi", dubbingArtist: "Amit Sharma", recordingStudio: "Film City Studios", scheduledDate: "2027-03-20", status: "scheduled", retakes: 0, approved: false, version: 1 },
  { id: "dub-3", projectId: "p2", sceneReference: "Sc-3", character: "Priya", language: "Tamil", dubbingArtist: "Lakshmi R", scheduledDate: "2027-04-01", status: "in-progress", retakes: 0, approved: false, version: 1 },
];

export function initDubbingSeedData() { seedModuleSlice("dubbingSessions", SEED); }

export function useDubbingSessions(projectId?: string): DubbingSession[] {
  const all = useModuleSlice<DubbingSession>("dubbingSessions");
  return useMemo(() => !projectId ? all : all.filter((d) => d.projectId === projectId), [all, projectId]);
}

export function createDubbingSession(input: Omit<DubbingSession, "id">): DubbingSession {
  const item: DubbingSession = { id: `dub-${crypto.randomUUID().slice(0, 8)}`, ...input };
  updateModuleSlice<DubbingSession>("dubbingSessions", (items) => [...items, item]);
  return item;
}

export function updateDubbingSession(id: string, updates: Partial<DubbingSession>): DubbingSession | null {
  let found: DubbingSession | null = null;
  updateModuleSlice<DubbingSession>("dubbingSessions", (items) =>
    items.map((s) => { if (s.id === id) { found = { ...s, ...updates }; return found; } return s; })
  );
  return found;
}
