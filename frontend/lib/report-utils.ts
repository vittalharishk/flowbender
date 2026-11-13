"use client";

// Pure aggregation utilities for Reports module.
// Financial calculations are NOT here — use useAccountsDashboard() from accounts-store.

export interface DateRange {
  from?: string;
  to?: string;
}

export function filterByDateRange<T>(
  items: T[],
  dateField: (item: T) => string | undefined,
  range: DateRange
): T[] {
  return items.filter((item) => {
    const d = dateField(item);
    if (!d) return true;
    if (range.from && d < range.from) return false;
    if (range.to && d > range.to) return false;
    return true;
  });
}

export function filterByProject<T extends { projectId: string }>(
  items: T[],
  projectId?: string
): T[] {
  if (!projectId || projectId === "all") return items;
  return items.filter((item) => item.projectId === projectId);
}

export function filterByOptionalProject<T extends { projectId?: string }>(
  items: T[],
  projectId?: string
): T[] {
  if (!projectId || projectId === "all") return items;
  return items.filter((item) => item.projectId === projectId);
}

export function countByStatus<T>(items: T[], statusFn: (item: T) => string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const s = statusFn(item);
    counts[s] = (counts[s] || 0) + 1;
  }
  return counts;
}

export function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  for (const item of items) {
    const k = keyFn(item);
    if (!groups[k]) groups[k] = [];
    groups[k].push(item);
  }
  return groups;
}

export function safeNumber(val: unknown): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

export function formatCrore(val: number): string {
  if (val === 0) return "₹0";
  const cr = val / 1e7;
  if (cr >= 1) return `₹${cr.toFixed(2)} Cr`;
  const lakh = val / 1e5;
  if (lakh >= 1) return `₹${lakh.toFixed(2)} L`;
  return `₹${val.toLocaleString("en-IN")}`;
}

export function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

// Scene progress aggregation
export interface SceneProgress {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  completionPct: number;
}

export function calcSceneProgress(scenes: Array<{ status: string }>): SceneProgress {
  const total = scenes.length;
  const completed = scenes.filter((s) => s.status === "completed" || s.status === "shot").length;
  const inProgress = scenes.filter((s) => s.status === "in-progress" || s.status === "shooting").length;
  const pending = total - completed - inProgress;
  return { total, completed, inProgress, pending, completionPct: pct(completed, total) };
}

// Schedule variance calculation
export interface VarianceItem {
  id: string;
  label: string;
  plannedDate?: string;
  actualDate?: string;
  varianceDays: number;
  status: "on-time" | "delayed" | "ahead" | "pending";
}

export function calcVarianceDays(planned?: string, actual?: string): number {
  if (!planned || !actual) return 0;
  const p = new Date(planned).getTime();
  const a = new Date(actual).getTime();
  if (isNaN(p) || isNaN(a)) return 0;
  return Math.round((a - p) / (1000 * 60 * 60 * 24));
}

export function varianceStatus(planned?: string, actual?: string): VarianceItem["status"] {
  if (!planned) return "pending";
  if (!actual) {
    const now = new Date().toISOString().slice(0, 10);
    return planned < now ? "delayed" : "pending";
  }
  const days = calcVarianceDays(planned, actual);
  if (days > 0) return "delayed";
  if (days < 0) return "ahead";
  return "on-time";
}
