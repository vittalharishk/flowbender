"use client";
import { useAppDataSlice, updateAppDataSlice } from "@/lib/app-data-store";
import type { PostProductionItem, PostProdMilestone, PostProductionStatus } from "@/lib/types";

// ─── PostProductionItems ─────────────────────────────────────────────────────

export function usePostProdItems(projectId?: string): PostProductionItem[] {
  const items = useAppDataSlice("postProductionItems") ?? [];
  return projectId ? items.filter(i => i.projectId === projectId) : items;
}

export function addPostProdItem(item: Omit<PostProductionItem, "id">): PostProductionItem {
  const newItem = { ...item, id: `ppi-${Date.now()}` } as PostProductionItem;
  updateAppDataSlice("postProductionItems", items => [...items, newItem]);
  return newItem;
}

export function updatePostProdItem(id: string, updates: Partial<PostProductionItem>) {
  updateAppDataSlice("postProductionItems", items =>
    items.map(i => i.id === id ? { ...i, ...updates } : i)
  );
}

export function updatePostProdStatus(id: string, status: PostProductionStatus, byName = "User", note = "") {
  updateAppDataSlice("postProductionItems", items =>
    items.map(i => {
      if (i.id !== id) return i;
      const history = [...(i.approvalHistory ?? []), {
        action: status, by: byName, at: new Date().toISOString(), notes: note,
      }];
      return { ...i, status, approvalHistory: history };
    })
  );
}

export function deletePostProdItem(id: string) {
  updateAppDataSlice("postProductionItems", items => items.filter(i => i.id !== id));
}

// ─── Milestones ──────────────────────────────────────────────────────────────

export function useMilestones(projectId?: string): PostProdMilestone[] {
  const items = useAppDataSlice("postProdMilestones") ?? [];
  return projectId ? items.filter(m => m.projectId === projectId) : items;
}

export function updateMilestone(id: string, updates: Partial<PostProdMilestone>) {
  updateAppDataSlice("postProdMilestones", items =>
    items.map(m => m.id === id ? { ...m, ...updates } : m)
  );
}

export function addMilestone(milestone: Omit<PostProdMilestone, "id">): PostProdMilestone {
  const newMs = { ...milestone, id: `mstone-${Date.now()}` } as PostProdMilestone;
  updateAppDataSlice("postProdMilestones", items => [...items, newMs]);
  return newMs;
}
