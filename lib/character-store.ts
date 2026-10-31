"use client";

import { useMemo } from "react";
import { getAppDataSlice, updateAppDataSlice, useAppDataSlice } from "./app-data-store";
import type { CharacterProfile } from "./types";

export function getCharacters(): CharacterProfile[] {
  return getAppDataSlice("characters");
}

export function getCharactersByProject(projectId: string): CharacterProfile[] {
  return getCharacters().filter((c) => c.projectId === projectId);
}

export function getCharacterById(id: string): CharacterProfile | undefined {
  return getCharacters().find((c) => c.id === id);
}

export function updateCharacter(id: string, updates: Partial<Omit<CharacterProfile, "id">>): void {
  updateAppDataSlice("characters", () =>
    getCharacters().map((c) => (c.id === id ? { ...c, ...updates } : c))
  );
}

export function useCharacters(): CharacterProfile[] {
  return useAppDataSlice("characters");
}

export function useCharactersByProject(projectId: string): CharacterProfile[] {
  const all = useCharacters();
  return useMemo(() => all.filter((c) => c.projectId === projectId), [all, projectId]);
}

export function useCharacter(id: string): CharacterProfile | undefined {
  const all = useCharacters();
  return useMemo(() => all.find((c) => c.id === id), [all, id]);
}
