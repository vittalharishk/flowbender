"use client";

import { useAppDataSlice, updateAppDataSlice, getAppDataSlice } from "./app-data-store";
import type { EquipmentItem } from "./types";

export type EquipmentStatus = "available" | "reserved" | "in-use" | "maintenance";

export interface EquipmentAllocation {
  id: string;
  equipmentId: string;
  projectId: string;
  shootDayId?: string;
  departmentId?: string;
  locationId?: string;
  crewMemberId?: string;
  quantity: number;
  startDate: string;
  endDate?: string;
  status: "pending" | "active" | "returned" | "partial-return";
  returnedQuantity: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentMaintenance {
  id: string;
  equipmentId: string;
  projectId?: string;
  maintenanceType: "preventive" | "repair" | "inspection" | "calibration";
  description: string;
  vendorId?: string;
  estimatedCost?: number;
  actualCost?: number;
  scheduledDate: string;
  completedDate?: string;
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const EQUIPMENT_CATEGORIES = [
  "camera", "lighting", "sound", "grip", "props", "art", "costume", "makeup",
  "monitoring", "communication", "power", "protection", "special effects", "other"
] as const;

export type EquipmentCategory = (typeof EQUIPMENT_CATEGORIES)[number];

function validateEquipmentInput(input: Partial<EquipmentItem>): string | null {
  if (!input.name?.trim()) return "Equipment name is required";
  if (input.quantity !== undefined && (!Number.isFinite(input.quantity) || input.quantity < 0)) {
    return "Quantity must be a non-negative number";
  }
  if (input.projectId && typeof input.projectId !== "string") {
    return "Invalid project reference";
  }
  return null;
}

function validateAllocationInput(input: Partial<EquipmentAllocation>): string | null {
  if (!input.equipmentId?.trim()) return "Equipment reference is required";
  if (!input.projectId?.trim()) return "Project reference is required";
  if (!input.quantity || !Number.isFinite(input.quantity) || input.quantity < 1) {
    return "Quantity must be a positive number";
  }
  if (!input.startDate) return "Start date is required";
  if (input.endDate && input.endDate < input.startDate) {
    return "End date cannot be before start date";
  }
  return null;
}

function validateMaintenanceInput(input: Partial<EquipmentMaintenance>): string | null {
  if (!input.equipmentId?.trim()) return "Equipment reference is required";
  if (!input.description?.trim()) return "Description is required";
  if (!input.scheduledDate) return "Scheduled date is required";
  if (input.estimatedCost !== undefined && (!Number.isFinite(input.estimatedCost) || input.estimatedCost < 0)) {
    return "Estimated cost must be a non-negative number";
  }
  if (input.actualCost !== undefined && (!Number.isFinite(input.actualCost) || input.actualCost < 0)) {
    return "Actual cost must be a non-negative number";
  }
  return null;
}

export function useEquipmentInventory(projectId?: string): EquipmentItem[] {
  const all = useAppDataSlice("equipmentInventory");
  if (!projectId || projectId === "all") return all;
  if (projectId === "shared") return all.filter((item) => !item.projectId);
  return all.filter((item) => item.projectId === projectId || !item.projectId);
}

export function useEquipmentItem(id: string): EquipmentItem | undefined {
  return useAppDataSlice("equipmentInventory").find((item) => item.id === id);
}

export function getEquipmentById(id: string): EquipmentItem | undefined {
  return getAppDataSlice("equipmentInventory").find((item) => item.id === id);
}

export function getEquipmentByProject(projectId: string): EquipmentItem[] {
  const all = getAppDataSlice("equipmentInventory");
  if (projectId === "all") return all;
  if (projectId === "shared") return all.filter((item) => !item.projectId);
  return all.filter((item) => item.projectId === projectId || !item.projectId);
}

export function createEquipment(
  input: Omit<EquipmentItem, "id">
): { success: true; item: EquipmentItem } | { success: false; error: string } {
  const error = validateEquipmentInput(input);
  if (error) return { success: false, error };

  const item: EquipmentItem = {
    id: `equipment-${crypto.randomUUID()}`,
    name: input.name.trim(),
    category: input.category || "other",
    quantity: input.quantity ?? 1,
    status: input.status ?? "available",
    projectId: input.projectId || undefined,
    notes: input.notes?.trim() || undefined,
    imageUrl: input.imageUrl || undefined,
    vendorId: input.vendorId || undefined,
  };

  updateAppDataSlice("equipmentInventory", (items) => [...items, item]);
  return { success: true, item };
}

export function updateEquipment(
  id: string,
  updates: Partial<Omit<EquipmentItem, "id">>
): { success: true; item: EquipmentItem } | { success: false; error: string } {
  const existing = getEquipmentById(id);
  if (!existing) return { success: false, error: "Equipment not found" };

  const merged = { ...existing, ...updates };
  const error = validateEquipmentInput(merged);
  if (error) return { success: false, error };

  let updatedItem: EquipmentItem = existing;

  updateAppDataSlice("equipmentInventory", (items) =>
    items.map((item) => {
      if (item.id === id) {
        updatedItem = {
          ...item,
          ...updates,
          name: updates.name?.trim() ?? item.name,
          notes: updates.notes?.trim() ?? item.notes,
        };
        return updatedItem;
      }
      return item;
    })
  );

  return { success: true, item: updatedItem };
}

export function deleteEquipment(id: string): { success: true } | { success: false; error: string } {
  const existing = getEquipmentById(id);
  if (!existing) return { success: false, error: "Equipment not found" };

  const allocations = getAppDataSlice("equipmentAllocations");
  const hasActiveAllocations = allocations.some(
    (a) => a.equipmentId === id && a.status !== "returned"
  );
  if (hasActiveAllocations) {
    return { success: false, error: "Cannot delete equipment with active allocations" };
  }

  updateAppDataSlice("equipmentInventory", (items) => items.filter((item) => item.id !== id));
  return { success: true };
}

export function updateEquipmentStatus(
  id: string,
  status: EquipmentStatus
): { success: true } | { success: false; error: string } {
  const existing = getEquipmentById(id);
  if (!existing) return { success: false, error: "Equipment not found" };

  updateAppDataSlice("equipmentInventory", (items) =>
    items.map((item) => (item.id === id ? { ...item, status } : item))
  );
  return { success: true };
}

export function useEquipmentAllocations(projectId?: string): EquipmentAllocation[] {
  const all = useAppDataSlice("equipmentAllocations");
  if (!projectId || projectId === "all") return all;
  return all.filter((a) => a.projectId === projectId);
}

export function useAllocationsByEquipment(equipmentId: string): EquipmentAllocation[] {
  return useAppDataSlice("equipmentAllocations").filter((a) => a.equipmentId === equipmentId);
}

export function getAllocationsByEquipment(equipmentId: string): EquipmentAllocation[] {
  return getAppDataSlice("equipmentAllocations").filter((a) => a.equipmentId === equipmentId);
}

export function getActiveAllocationsCount(equipmentId: string): number {
  const allocations = getAllocationsByEquipment(equipmentId);
  return allocations
    .filter((a) => a.status === "active" || a.status === "pending")
    .reduce((sum, a) => sum + (a.quantity - a.returnedQuantity), 0);
}

export function createAllocation(
  input: Omit<EquipmentAllocation, "id" | "createdAt" | "updatedAt" | "returnedQuantity">
): { success: true; allocation: EquipmentAllocation } | { success: false; error: string } {
  const error = validateAllocationInput(input);
  if (error) return { success: false, error };

  const equipment = getEquipmentById(input.equipmentId);
  if (!equipment) return { success: false, error: "Equipment not found" };

  if (equipment.status === "maintenance") {
    return { success: false, error: "Cannot allocate equipment under maintenance" };
  }

  const activeCount = getActiveAllocationsCount(input.equipmentId);
  const availableQty = equipment.quantity - activeCount;
  if (input.quantity > availableQty) {
    return { success: false, error: `Only ${availableQty} units available (${activeCount} already allocated)` };
  }

  const now = new Date().toISOString();
  const allocation: EquipmentAllocation = {
    id: `alloc-${crypto.randomUUID()}`,
    equipmentId: input.equipmentId,
    projectId: input.projectId,
    shootDayId: input.shootDayId,
    departmentId: input.departmentId,
    locationId: input.locationId,
    crewMemberId: input.crewMemberId,
    quantity: input.quantity,
    startDate: input.startDate,
    endDate: input.endDate,
    status: input.status ?? "pending",
    returnedQuantity: 0,
    notes: input.notes?.trim(),
    createdAt: now,
    updatedAt: now,
  };

  updateAppDataSlice("equipmentAllocations", (items) => [...items, allocation]);

  if (allocation.status === "active") {
    updateEquipmentStatus(input.equipmentId, activeCount + input.quantity >= equipment.quantity ? "in-use" : "reserved");
  }

  return { success: true, allocation };
}

export function returnAllocation(
  allocationId: string,
  returnedQty?: number
): { success: true } | { success: false; error: string } {
  const allocations = getAppDataSlice("equipmentAllocations");
  const allocation = allocations.find((a) => a.id === allocationId);
  if (!allocation) return { success: false, error: "Allocation not found" };

  if (allocation.status === "returned") {
    return { success: false, error: "Allocation already fully returned" };
  }

  const remainingQty = allocation.quantity - allocation.returnedQuantity;
  const qtyToReturn = returnedQty ?? remainingQty;

  if (!Number.isFinite(qtyToReturn) || qtyToReturn < 1 || qtyToReturn > remainingQty) {
    return { success: false, error: `Return quantity must be between 1 and ${remainingQty}` };
  }

  const newReturnedQty = allocation.returnedQuantity + qtyToReturn;
  const isFullReturn = newReturnedQty >= allocation.quantity;

  updateAppDataSlice("equipmentAllocations", (items) =>
    items.map((a) =>
      a.id === allocationId
        ? {
            ...a,
            returnedQuantity: newReturnedQty,
            status: isFullReturn ? "returned" as const : "partial-return" as const,
            updatedAt: new Date().toISOString(),
          }
        : a
    )
  );

  const equipment = getEquipmentById(allocation.equipmentId);
  if (equipment) {
    const newActiveCount = getActiveAllocationsCount(allocation.equipmentId) - qtyToReturn;
    if (newActiveCount <= 0) {
      updateEquipmentStatus(allocation.equipmentId, "available");
    } else if (newActiveCount < equipment.quantity) {
      updateEquipmentStatus(allocation.equipmentId, "reserved");
    }
  }

  return { success: true };
}

export function useEquipmentMaintenance(equipmentId?: string): EquipmentMaintenance[] {
  const all = useAppDataSlice("equipmentMaintenance");
  if (!equipmentId) return all;
  return all.filter((m) => m.equipmentId === equipmentId);
}

export function createMaintenance(
  input: Omit<EquipmentMaintenance, "id" | "createdAt" | "updatedAt">
): { success: true; maintenance: EquipmentMaintenance } | { success: false; error: string } {
  const error = validateMaintenanceInput(input);
  if (error) return { success: false, error };

  const equipment = getEquipmentById(input.equipmentId);
  if (!equipment) return { success: false, error: "Equipment not found" };

  const now = new Date().toISOString();
  const maintenance: EquipmentMaintenance = {
    id: `maint-${crypto.randomUUID()}`,
    equipmentId: input.equipmentId,
    projectId: input.projectId,
    maintenanceType: input.maintenanceType,
    description: input.description.trim(),
    vendorId: input.vendorId,
    estimatedCost: input.estimatedCost,
    actualCost: input.actualCost,
    scheduledDate: input.scheduledDate,
    completedDate: input.completedDate,
    status: input.status ?? "scheduled",
    notes: input.notes?.trim(),
    createdAt: now,
    updatedAt: now,
  };

  updateAppDataSlice("equipmentMaintenance", (items) => [...items, maintenance]);

  if (maintenance.status === "in-progress") {
    updateEquipmentStatus(input.equipmentId, "maintenance");
  }

  return { success: true, maintenance };
}

export function updateMaintenance(
  id: string,
  updates: Partial<Omit<EquipmentMaintenance, "id" | "createdAt">>
): { success: true } | { success: false; error: string } {
  const all = getAppDataSlice("equipmentMaintenance");
  const existing = all.find((m) => m.id === id);
  if (!existing) return { success: false, error: "Maintenance record not found" };

  const merged = { ...existing, ...updates };
  const error = validateMaintenanceInput(merged);
  if (error) return { success: false, error };

  updateAppDataSlice("equipmentMaintenance", (items) =>
    items.map((m) =>
      m.id === id
        ? { ...m, ...updates, updatedAt: new Date().toISOString() }
        : m
    )
  );

  if (updates.status === "completed" && existing.status !== "completed") {
    const equipment = getEquipmentById(existing.equipmentId);
    if (equipment && equipment.status === "maintenance") {
      const activeMaint = all.filter(
        (m) => m.equipmentId === existing.equipmentId && m.status === "in-progress" && m.id !== id
      );
      if (activeMaint.length === 0) {
        updateEquipmentStatus(existing.equipmentId, "available");
      }
    }
  }

  return { success: true };
}

export function completeMaintenance(
  id: string,
  actualCost?: number
): { success: true } | { success: false; error: string } {
  return updateMaintenance(id, {
    status: "completed",
    completedDate: new Date().toISOString().slice(0, 10),
    actualCost,
  });
}

export function calcEquipmentStats(items: EquipmentItem[]) {
  return {
    total: items.length,
    available: items.filter((i) => i.status === "available").length,
    reserved: items.filter((i) => i.status === "reserved").length,
    inUse: items.filter((i) => i.status === "in-use").length,
    maintenance: items.filter((i) => i.status === "maintenance").length,
    byCategory: items.reduce<Record<string, number>>((acc, i) => {
      acc[i.category] = (acc[i.category] ?? 0) + 1;
      return acc;
    }, {}),
  };
}

export { EQUIPMENT_CATEGORIES };
