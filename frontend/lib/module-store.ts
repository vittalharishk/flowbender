"use client";

import { useSyncExternalStore, useMemo } from "react";

const STORE_PREFIX = "flowbender.module.";

type Listener = () => void;

const listenerMap = new Map<string, Set<Listener>>();
const cacheMap = new Map<string, unknown[]>();

function getListeners(key: string): Set<Listener> {
  let s = listenerMap.get(key);
  if (!s) { s = new Set(); listenerMap.set(key, s); }
  return s;
}

function notify(key: string) {
  cacheMap.delete(key);
  getListeners(key).forEach((l) => l());
}

function canUseStorage() {
  return typeof window !== "undefined";
}

function readRaw<T>(key: string): T[] {
  if (!canUseStorage()) return [];
  const cached = cacheMap.get(key);
  if (cached) return cached as T[];
  try {
    const raw = localStorage.getItem(STORE_PREFIX + key);
    const parsed = raw ? JSON.parse(raw) : [];
    const arr = Array.isArray(parsed) ? parsed : [];
    cacheMap.set(key, arr);
    return arr as T[];
  } catch {
    return [];
  }
}

function writeRaw<T>(key: string, data: T[]) {
  if (!canUseStorage()) return;
  try {
    localStorage.setItem(STORE_PREFIX + key, JSON.stringify(data));
  } catch { /* quota exceeded — ignore */ }
  cacheMap.set(key, data);
  notify(key);
}

export function useModuleSlice<T>(key: string): T[] {
  const subscribe = useMemo(() => (cb: Listener) => {
    const s = getListeners(key);
    s.add(cb);
    return () => { s.delete(cb); };
  }, [key]);
  return useSyncExternalStore(subscribe, () => readRaw<T>(key), () => [] as T[]);
}

export function getModuleSlice<T>(key: string): T[] {
  return readRaw<T>(key);
}

export function updateModuleSlice<T>(key: string, updater: (items: T[]) => T[]) {
  const current = readRaw<T>(key);
  writeRaw(key, updater(current));
}

export function seedModuleSlice<T extends { id: string }>(key: string, seedData: T[]) {
  if (!canUseStorage()) return;
  const existing = readRaw<T>(key);
  if (existing.length > 0) return;
  writeRaw(key, seedData);
}
