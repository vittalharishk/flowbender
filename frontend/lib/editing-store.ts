"use client";

import { useMemo } from "react";
import { useModuleSlice, updateModuleSlice, seedModuleSlice } from "./module-store";

export interface EditingTask {
  id: string;
  projectId: string;
  sceneReference?: string;
  editor?: string;
  status: "pending" | "in-progress" | "review" | "approved" | "final";
  footageAvailable: boolean;
  startDate?: string;
  completionDate?: string;
  currentCut: "none" | "rough" | "fine" | "director-review" | "producer-review" | "final";
  approvalStatus: "pending" | "director-approved" | "producer-approved" | "final-approved";
  directorApproved: boolean;
  producerApproved: boolean;
  reviewComments?: string;
  pendingEdits?: string;
  notes?: string;
}

export interface EditingVersion {
  id: string;
  taskId: string;
  versionNumber: number;
  cutType: string;
  fileReference?: string;
  comments?: string;
  reviewedBy?: string;
  reviewDate?: string;
  status: string;
}

const SEED_EDITING: EditingTask[] = [
  { id: "edit-1", projectId: "p1", sceneReference: "Sc-1 to Sc-5", editor: "Ravi Shankar", status: "approved", footageAvailable: true, startDate: "2027-02-01", completionDate: "2027-02-15", currentCut: "final", approvalStatus: "final-approved", directorApproved: true, producerApproved: true },
  { id: "edit-2", projectId: "p1", sceneReference: "Sc-6 to Sc-10", editor: "Ravi Shankar", status: "in-progress", footageAvailable: true, startDate: "2027-02-16", currentCut: "rough", approvalStatus: "pending", directorApproved: false, producerApproved: false },
  { id: "edit-3", projectId: "p2", sceneReference: "Sc-1 to Sc-8", editor: "Meena K", status: "review", footageAvailable: true, startDate: "2027-03-01", currentCut: "fine", approvalStatus: "director-approved", directorApproved: true, producerApproved: false },
];

export function initEditingSeedData() {
  seedModuleSlice("editingTasks", SEED_EDITING);
}

export function useEditingTasks(projectId?: string): EditingTask[] {
  const all = useModuleSlice<EditingTask>("editingTasks");
  return useMemo(() => {
    if (!projectId) return all;
    return all.filter((t) => t.projectId === projectId);
  }, [all, projectId]);
}

export function useEditingProgress(projectId?: string) {
  const tasks = useEditingTasks(projectId);
  return useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "final" || t.status === "approved").length;
    const inProgress = tasks.filter((t) => t.status === "in-progress").length;
    const inReview = tasks.filter((t) => t.status === "review").length;
    const pending = tasks.filter((t) => t.status === "pending").length;
    return { total, completed, inProgress, inReview, pending, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [tasks]);
}

export function createEditingTask(input: Omit<EditingTask, "id">): EditingTask {
  const item: EditingTask = { id: `edit-${crypto.randomUUID().slice(0, 8)}`, ...input };
  updateModuleSlice<EditingTask>("editingTasks", (items) => [...items, item]);
  return item;
}

export function updateEditingTask(id: string, updates: Partial<EditingTask>): EditingTask | null {
  let found: EditingTask | null = null;
  updateModuleSlice<EditingTask>("editingTasks", (items) =>
    items.map((t) => {
      if (t.id === id) { found = { ...t, ...updates }; return found; }
      return t;
    })
  );
  return found;
}
