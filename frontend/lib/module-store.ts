"use client";

import { useSyncExternalStore, useMemo } from "react";
import { getAppDataSlice, useAppDataSlice } from "./app-data-store";
import { getCurrentOwnerTag, isOwnedRecordVisible, stampOwner } from "./auth-client";

// Module slices (BGM, dubbing, editing, invoices, business, teams, ...) are stored
// in PostgreSQL through /api/demo-data (one "mod:<key>" row per slice).
// localStorage keeps a copy as a fast-start cache; the database copy wins on load.

const STORE_PREFIX = "flowbender.module.";
const SAVE_DELAY_MS = 300;

type Listener = () => void;

const listenerMap = new Map<string, Set<Listener>>();
const cacheMap = new Map<string, unknown[]>();
const pendingSaves = new Map<string, ReturnType<typeof setTimeout>>();
let hydrationStarted = false;

function getListeners(key: string): Set<Listener> {
  let s = listenerMap.get(key);
  if (!s) { s = new Set(); listenerMap.set(key, s); }
  return s;
}

function notify(key: string) {
  getListeners(key).forEach((l) => l());
}

function canUseStorage() {
  return typeof window !== "undefined";
}

function writeLocal(key: string, data: unknown[]) {
  try {
    localStorage.setItem(STORE_PREFIX + key, JSON.stringify(data));
  } catch { /* quota exceeded or storage blocked: the database copy is still saved */ }
}

function readRaw<T>(key: string): T[] {
  if (!canUseStorage()) return [];
  hydrateFromDatabase();
  const cached = cacheMap.get(key);
  if (cached) return cached as T[];
  let arr: unknown[] = [];
  try {
    const raw = localStorage.getItem(STORE_PREFIX + key);
    const parsed = raw ? JSON.parse(raw) : [];
    arr = Array.isArray(parsed) ? parsed : [];
  } catch { /* unreadable cache: start empty */ }
  cacheMap.set(key, arr);
  return arr as T[];
}

function saveToDatabase(key: string) {
  const existing = pendingSaves.get(key);
  if (existing) clearTimeout(existing);
  pendingSaves.set(key, setTimeout(() => {
    pendingSaves.delete(key);
    void fetch("/api/demo-data?slice=module", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, data: cacheMap.get(key) ?? [] }),
    }).catch((error) => console.error(`Unable to save "${key}" to the database.`, error));
  }, SAVE_DELAY_MS));
}

function writeRaw<T>(key: string, data: T[]) {
  if (!canUseStorage()) return;
  cacheMap.set(key, data);
  writeLocal(key, data);
  notify(key);
  saveToDatabase(key);
}

// Load every module slice from the database once per page load. Slices that
// exist only in this browser's cache are pushed up so nothing is lost.
function hydrateFromDatabase() {
  if (hydrationStarted || !canUseStorage()) return;
  hydrationStarted = true;
  void fetch("/api/demo-data?slice=modules", { cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) return;
      const payload = (await response.json()) as { modules?: Record<string, unknown> };
      const modules = payload.modules ?? {};
      for (const [key, data] of Object.entries(modules)) {
        if (!Array.isArray(data) || pendingSaves.has(key)) continue;
        cacheMap.set(key, data);
        writeLocal(key, data);
        notify(key);
      }
      for (let i = 0; i < localStorage.length; i++) {
        const storageKey = localStorage.key(i);
        if (!storageKey?.startsWith(STORE_PREFIX)) continue;
        const key = storageKey.slice(STORE_PREFIX.length);
        if (key in modules) continue;
        const local = readRaw(key);
        if (local.length > 0) saveToDatabase(key);
      }
    })
    .catch((error) => console.error("Unable to load module data from the database.", error));
}

// Hide records that belong to projects the signed-in user may not see
// (another account's private projects). Records without a projectId stay visible.
function useVisibleProjectFilter() {
  const visibleProjects = useAppDataSlice("projects");
  return useMemo(() => {
    const visible = new Set(visibleProjects.map((p) => p.id));
    const hidden = new Set(getAppDataSlice("projects").map((p) => p.id).filter((id) => !visible.has(id)));
    const owner = getCurrentOwnerTag();
    return <T,>(items: T[]): T[] =>
      items.filter((item) => {
        const projectId = (item as { projectId?: unknown }).projectId;
        if (typeof projectId === "string" && projectId) return !hidden.has(projectId);
        return isOwnedRecordVisible(item, owner);
      });
  }, [visibleProjects]);
}

export function useModuleSlice<T>(key: string): T[] {
  const subscribe = useMemo(() => (cb: Listener) => {
    const s = getListeners(key);
    s.add(cb);
    return () => { s.delete(cb); };
  }, [key]);
  const all = useSyncExternalStore(subscribe, () => readRaw<T>(key), () => [] as T[]);
  const filterVisible = useVisibleProjectFilter();
  return useMemo(() => filterVisible(all), [filterVisible, all]);
}

export function getModuleSlice<T>(key: string): T[] {
  return readRaw<T>(key);
}

export function updateModuleSlice<T>(key: string, updater: (items: T[]) => T[]) {
  const current = readRaw<T>(key);
  writeRaw(key, stampOwner(current, updater(current)));
}

export function seedModuleSlice<T extends { id: string }>(key: string, seedData: T[]) {
  if (!canUseStorage()) return;
  const existing = readRaw<T>(key);
  if (existing.length > 0) return;
  writeRaw(key, seedData);
}
