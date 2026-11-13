"use client";
import { useAppDataSlice, updateAppDataSlice } from "@/lib/app-data-store";
import type {
  PropItem,
  PropTransaction,
  ProductionSet,
  SetTask,
  AISetExtensionTask,
  AISetExtensionVersion,
  PropCondition,
  SetStatus,
  AISetExtensionStatus,
} from "@/lib/types";

const fmt = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
export const formatINR = (n: number) => fmt.format(n);

// ─── Props ─────────────────────────────────────────────────────────────────────

export function usePropItems(projectId?: string): PropItem[] {
  const all = useAppDataSlice("propItems") ?? [];
  if (!projectId) return all;
  return all.filter((p) => p.projectId === projectId || !p.projectId);
}

export function addPropItem(p: Omit<PropItem, "id" | "createdAt" | "updatedAt">) {
  const now = new Date().toISOString();
  const newP: PropItem = { ...p, id: `prop-${Date.now()}`, createdAt: now, updatedAt: now };
  updateAppDataSlice("propItems", (list) => [...list, newP]);
  return newP;
}

export function updatePropItem(id: string, updates: Partial<PropItem>) {
  const now = new Date().toISOString();
  updateAppDataSlice("propItems", (list) =>
    list.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: now } : p))
  );
}

export function usePropTransactions(propItemId?: string): PropTransaction[] {
  const all = useAppDataSlice("propTransactions") ?? [];
  return propItemId ? all.filter((t) => t.propItemId === propItemId) : all;
}

export function checkoutProp(
  propItem: PropItem,
  transaction: Omit<PropTransaction, "id" | "createdAt" | "status">
): { ok: boolean; error?: string } {
  if (transaction.quantity > propItem.quantityAvailable) {
    return { ok: false, error: `Only ${propItem.quantityAvailable} available` };
  }
  const now = new Date().toISOString();
  const newT: PropTransaction = { ...transaction, id: `pt-${Date.now()}`, status: "active", createdAt: now };
  updateAppDataSlice("propTransactions", (list) => [...list, newT]);
  updatePropItem(propItem.id, { quantityAvailable: propItem.quantityAvailable - transaction.quantity });
  return { ok: true };
}

export function checkinProp(
  propItem: PropItem,
  transactionId: string,
  quantity: number,
  condition: PropCondition,
  notes?: string
) {
  const now = new Date().toISOString();
  updateAppDataSlice("propTransactions", (list) =>
    list.map((t) =>
      t.id === transactionId
        ? { ...t, actualReturnDate: now.slice(0, 10), conditionOnReturn: condition, status: "returned" as const, notes: notes || t.notes }
        : t
    )
  );
  updatePropItem(propItem.id, {
    quantityAvailable: propItem.quantityAvailable + quantity,
    condition: condition === "damaged" ? "damaged" : propItem.condition,
  });
}

// ─── Sets ─────────────────────────────────────────────────────────────────────

export function useProductionSets(projectId?: string): ProductionSet[] {
  const all = useAppDataSlice("productionSets") ?? [];
  return projectId ? all.filter((s) => s.projectId === projectId) : all;
}

export function addProductionSet(s: Omit<ProductionSet, "id" | "createdAt" | "updatedAt">) {
  const now = new Date().toISOString();
  const newS: ProductionSet = { ...s, id: `set-${Date.now()}`, createdAt: now, updatedAt: now };
  updateAppDataSlice("productionSets", (list) => [...list, newS]);
  return newS;
}

export function updateProductionSet(id: string, updates: Partial<ProductionSet>) {
  const now = new Date().toISOString();
  updateAppDataSlice("productionSets", (list) =>
    list.map((s) => (s.id === id ? { ...s, ...updates, updatedAt: now } : s))
  );
}

export function updateSetStatus(id: string, status: SetStatus) {
  updateProductionSet(id, { status });
}

export function useSetTasks(setId?: string): SetTask[] {
  const all = useAppDataSlice("setTasks") ?? [];
  return setId ? all.filter((t) => t.setId === setId) : all;
}

export function addSetTask(t: Omit<SetTask, "id" | "createdAt">) {
  const now = new Date().toISOString();
  const newT: SetTask = { ...t, id: `st-${Date.now()}`, createdAt: now };
  updateAppDataSlice("setTasks", (list) => [...list, newT]);
  return newT;
}

export function updateSetTask(id: string, updates: Partial<SetTask>) {
  updateAppDataSlice("setTasks", (list) =>
    list.map((t) => (t.id === id ? { ...t, ...updates } : t))
  );
}

// ─── AI Set Extensions ─────────────────────────────────────────────────────────

export function useAISetExtensionTasks(projectId?: string): AISetExtensionTask[] {
  const all = useAppDataSlice("aiSetExtensionTasks") ?? [];
  return projectId ? all.filter((t) => t.projectId === projectId) : all;
}

export function addAISetExtensionTask(t: Omit<AISetExtensionTask, "id" | "createdAt" | "updatedAt">) {
  const now = new Date().toISOString();
  const newT: AISetExtensionTask = { ...t, id: `aise-${Date.now()}`, createdAt: now, updatedAt: now };
  updateAppDataSlice("aiSetExtensionTasks", (list) => [...list, newT]);
  return newT;
}

export function updateAISetExtensionTask(id: string, updates: Partial<AISetExtensionTask>) {
  const now = new Date().toISOString();
  updateAppDataSlice("aiSetExtensionTasks", (list) =>
    list.map((t) => (t.id === id ? { ...t, ...updates, updatedAt: now } : t))
  );
}

export function useAISetExtensionVersions(taskId?: string): AISetExtensionVersion[] {
  const all = useAppDataSlice("aiSetExtensionVersions") ?? [];
  return taskId ? all.filter((v) => v.taskId === taskId) : all;
}

export function addAISetExtensionVersion(
  taskId: string,
  versionNumber: number,
  status: AISetExtensionStatus,
  notes: string,
  reviewedBy: string
): AISetExtensionVersion {
  const now = new Date().toISOString();
  const newV: AISetExtensionVersion = {
    id: `aisev-${Date.now()}`,
    taskId,
    versionNumber,
    status,
    notes,
    reviewedBy,
    createdAt: now,
  };
  updateAppDataSlice("aiSetExtensionVersions", (list) => [...list, newV]);
  updateAISetExtensionTask(taskId, { status });
  return newV;
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────

export function calcArtDashboard(
  props: PropItem[],
  sets: ProductionSet[],
  tasks: AISetExtensionTask[]
) {
  return {
    totalProps: props.length,
    totalPropQty: props.reduce((s, p) => s + p.quantityTotal, 0),
    availableQty: props.reduce((s, p) => s + p.quantityAvailable, 0),
    allocatedQty: props.reduce((s, p) => s + (p.quantityTotal - p.quantityAvailable), 0),
    damagedProps: props.filter((p) => p.condition === "damaged").length,
    lostProps: props.filter((p) => p.condition === "lost").length,
    activeSets: sets.filter((s) => !["dismantled", "completed"].includes(s.status)).length,
    readyForShoot: sets.filter((s) => s.status === "ready-for-shoot").length,
    underConstruction: sets.filter((s) => s.status === "construction").length,
    totalSetBudget: sets.reduce((s, st) => s + st.estimatedBudget, 0),
    totalSetActual: sets.reduce((s, st) => s + st.actualCost, 0),
    aiTasksTotal: tasks.length,
    aiPendingApproval: tasks.filter((t) => t.status === "in-review").length,
    aiDelivered: tasks.filter((t) => t.status === "delivered").length,
  };
}
