"use client";
import { useAppDataSlice, updateAppDataSlice } from "@/lib/app-data-store";
import type { PreProdChecklistItem, ChecklistStatus } from "@/lib/types";

export function usePreProdChecklist(projectId?: string): PreProdChecklistItem[] {
  const items = useAppDataSlice("preProdChecklist") ?? [];
  return projectId ? items.filter((i) => i.projectId === projectId) : items;
}

export function toggleChecklistItem(id: string, status: ChecklistStatus) {
  updateAppDataSlice("preProdChecklist", (items) =>
    items.map((i) => (i.id === id ? { ...i, status } : i))
  );
}

export function addChecklistItem(item: Omit<PreProdChecklistItem, "id">) {
  const newItem: PreProdChecklistItem = { ...item, id: `chk-${Date.now()}` };
  updateAppDataSlice("preProdChecklist", (items) => [...items, newItem]);
  return newItem;
}

export function updateChecklistItem(id: string, updates: Partial<PreProdChecklistItem>) {
  updateAppDataSlice("preProdChecklist", (items) =>
    items.map((i) => (i.id === id ? { ...i, ...updates } : i))
  );
}

export function deleteChecklistItem(id: string) {
  updateAppDataSlice("preProdChecklist", (items) => items.filter((i) => i.id !== id));
}
