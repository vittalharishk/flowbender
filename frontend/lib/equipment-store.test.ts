import { describe, it, expect, beforeEach, vi } from "vitest";

const mockUpdateAppDataSlice = vi.fn();
const mockGetAppDataSlice = vi.fn();
const mockUseAppDataSlice = vi.fn();

vi.mock("./app-data-store", () => ({
  updateAppDataSlice: (...args: unknown[]) => mockUpdateAppDataSlice(...args),
  getAppDataSlice: (key: string) => mockGetAppDataSlice(key),
  useAppDataSlice: (key: string) => mockUseAppDataSlice(key),
}));

import type { EquipmentItem } from "./types";
import {
  createEquipment,
  updateEquipment,
  deleteEquipment,
  updateEquipmentStatus,
  createAllocation,
  returnAllocation,
  createMaintenance,
  completeMaintenance,
  calcEquipmentStats,
  getEquipmentById,
  getActiveAllocationsCount,
} from "./equipment-store";

function makeEquipment(overrides: Partial<EquipmentItem> = {}): EquipmentItem {
  return {
    id: "equip-1",
    name: "ARRI Alexa Mini",
    category: "camera",
    quantity: 2,
    status: "available",
    projectId: "p1",
    ...overrides,
  };
}

describe("equipment-store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createEquipment", () => {
    it("creates equipment with valid input", () => {
      mockGetAppDataSlice.mockReturnValue([]);

      const result = createEquipment({
        name: "Sony FX3",
        category: "camera",
        quantity: 1,
        status: "available",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.item.name).toBe("Sony FX3");
        expect(result.item.category).toBe("camera");
        expect(result.item.id).toMatch(/^equipment-/);
      }
      expect(mockUpdateAppDataSlice).toHaveBeenCalledWith("equipmentInventory", expect.any(Function));
    });

    it("rejects empty name", () => {
      const result = createEquipment({
        name: "   ",
        category: "camera",
        quantity: 1,
        status: "available",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("name is required");
      }
    });

    it("rejects negative quantity", () => {
      const result = createEquipment({
        name: "Test Equipment",
        category: "camera",
        quantity: -1,
        status: "available",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("non-negative");
      }
    });

    it("rejects NaN quantity", () => {
      const result = createEquipment({
        name: "Test Equipment",
        category: "camera",
        quantity: NaN,
        status: "available",
      });

      expect(result.success).toBe(false);
    });

    it("rejects Infinity quantity", () => {
      const result = createEquipment({
        name: "Test Equipment",
        category: "camera",
        quantity: Infinity,
        status: "available",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("updateEquipment", () => {
    it("updates equipment successfully", () => {
      const existing = makeEquipment();
      mockGetAppDataSlice.mockImplementation((key) => {
        if (key === "equipmentInventory") return [existing];
        return [];
      });

      const result = updateEquipment("equip-1", { name: "ARRI Alexa LF" });

      expect(result.success).toBe(true);
      expect(mockUpdateAppDataSlice).toHaveBeenCalled();
    });

    it("returns error for non-existent equipment", () => {
      mockGetAppDataSlice.mockReturnValue([]);

      const result = updateEquipment("non-existent", { name: "Test" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("not found");
      }
    });
  });

  describe("deleteEquipment", () => {
    it("deletes equipment without active allocations", () => {
      const existing = makeEquipment();
      mockGetAppDataSlice.mockImplementation((key) => {
        if (key === "equipmentInventory") return [existing];
        if (key === "equipmentAllocations") return [];
        return [];
      });

      const result = deleteEquipment("equip-1");

      expect(result.success).toBe(true);
      expect(mockUpdateAppDataSlice).toHaveBeenCalledWith("equipmentInventory", expect.any(Function));
    });

    it("rejects deletion with active allocations", () => {
      const existing = makeEquipment();
      const allocation = {
        id: "alloc-1",
        equipmentId: "equip-1",
        status: "active",
        quantity: 1,
        returnedQuantity: 0,
      };
      mockGetAppDataSlice.mockImplementation((key) => {
        if (key === "equipmentInventory") return [existing];
        if (key === "equipmentAllocations") return [allocation];
        return [];
      });

      const result = deleteEquipment("equip-1");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("active allocations");
      }
    });
  });

  describe("updateEquipmentStatus", () => {
    it("updates status successfully", () => {
      const existing = makeEquipment();
      mockGetAppDataSlice.mockReturnValue([existing]);

      const result = updateEquipmentStatus("equip-1", "maintenance");

      expect(result.success).toBe(true);
      expect(mockUpdateAppDataSlice).toHaveBeenCalled();
    });

    it("returns error for non-existent equipment", () => {
      mockGetAppDataSlice.mockReturnValue([]);

      const result = updateEquipmentStatus("non-existent", "available");

      expect(result.success).toBe(false);
    });
  });

  describe("createAllocation", () => {
    it("creates allocation with valid input", () => {
      const equipment = makeEquipment({ quantity: 5 });
      mockGetAppDataSlice.mockImplementation((key) => {
        if (key === "equipmentInventory") return [equipment];
        if (key === "equipmentAllocations") return [];
        return [];
      });

      const result = createAllocation({
        equipmentId: "equip-1",
        projectId: "p1",
        quantity: 2,
        startDate: "2026-11-01",
        status: "pending",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.allocation.quantity).toBe(2);
        expect(result.allocation.returnedQuantity).toBe(0);
      }
    });

    it("rejects over-allocation", () => {
      const equipment = makeEquipment({ quantity: 2 });
      const existingAllocation = {
        id: "alloc-1",
        equipmentId: "equip-1",
        status: "active",
        quantity: 2,
        returnedQuantity: 0,
      };
      mockGetAppDataSlice.mockImplementation((key) => {
        if (key === "equipmentInventory") return [equipment];
        if (key === "equipmentAllocations") return [existingAllocation];
        return [];
      });

      const result = createAllocation({
        equipmentId: "equip-1",
        projectId: "p1",
        quantity: 1,
        startDate: "2026-11-01",
        status: "pending",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("available");
      }
    });

    it("rejects allocation of equipment under maintenance", () => {
      const equipment = makeEquipment({ status: "maintenance" });
      mockGetAppDataSlice.mockImplementation((key) => {
        if (key === "equipmentInventory") return [equipment];
        if (key === "equipmentAllocations") return [];
        return [];
      });

      const result = createAllocation({
        equipmentId: "equip-1",
        projectId: "p1",
        quantity: 1,
        startDate: "2026-11-01",
        status: "pending",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("maintenance");
      }
    });

    it("rejects invalid quantity", () => {
      const equipment = makeEquipment();
      mockGetAppDataSlice.mockImplementation((key) => {
        if (key === "equipmentInventory") return [equipment];
        if (key === "equipmentAllocations") return [];
        return [];
      });

      const result = createAllocation({
        equipmentId: "equip-1",
        projectId: "p1",
        quantity: 0,
        startDate: "2026-11-01",
        status: "pending",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("positive");
      }
    });

    it("rejects missing project reference", () => {
      const result = createAllocation({
        equipmentId: "equip-1",
        projectId: "",
        quantity: 1,
        startDate: "2026-11-01",
        status: "pending",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Project");
      }
    });
  });

  describe("returnAllocation", () => {
    it("returns full allocation", () => {
      const allocation = {
        id: "alloc-1",
        equipmentId: "equip-1",
        projectId: "p1",
        quantity: 2,
        returnedQuantity: 0,
        status: "active" as const,
      };
      const equipment = makeEquipment();
      mockGetAppDataSlice.mockImplementation((key) => {
        if (key === "equipmentAllocations") return [allocation];
        if (key === "equipmentInventory") return [equipment];
        return [];
      });

      const result = returnAllocation("alloc-1");

      expect(result.success).toBe(true);
      expect(mockUpdateAppDataSlice).toHaveBeenCalledWith("equipmentAllocations", expect.any(Function));
    });

    it("returns partial allocation", () => {
      const allocation = {
        id: "alloc-1",
        equipmentId: "equip-1",
        projectId: "p1",
        quantity: 5,
        returnedQuantity: 0,
        status: "active" as const,
      };
      const equipment = makeEquipment({ quantity: 5 });
      mockGetAppDataSlice.mockImplementation((key) => {
        if (key === "equipmentAllocations") return [allocation];
        if (key === "equipmentInventory") return [equipment];
        return [];
      });

      const result = returnAllocation("alloc-1", 2);

      expect(result.success).toBe(true);
    });

    it("rejects return of already-returned allocation", () => {
      const allocation = {
        id: "alloc-1",
        equipmentId: "equip-1",
        quantity: 2,
        returnedQuantity: 2,
        status: "returned" as const,
      };
      mockGetAppDataSlice.mockReturnValue([allocation]);

      const result = returnAllocation("alloc-1");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("already");
      }
    });

    it("rejects invalid return quantity", () => {
      const allocation = {
        id: "alloc-1",
        equipmentId: "equip-1",
        quantity: 2,
        returnedQuantity: 1,
        status: "active" as const,
      };
      mockGetAppDataSlice.mockReturnValue([allocation]);

      const result = returnAllocation("alloc-1", 5);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("between");
      }
    });
  });

  describe("createMaintenance", () => {
    it("creates maintenance record with valid input", () => {
      const equipment = makeEquipment();
      mockGetAppDataSlice.mockReturnValue([equipment]);

      const result = createMaintenance({
        equipmentId: "equip-1",
        maintenanceType: "repair",
        description: "Sensor cleaning",
        scheduledDate: "2026-11-15",
        status: "scheduled",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.maintenance.maintenanceType).toBe("repair");
        expect(result.maintenance.status).toBe("scheduled");
      }
    });

    it("rejects invalid estimated cost", () => {
      const equipment = makeEquipment();
      mockGetAppDataSlice.mockReturnValue([equipment]);

      const result = createMaintenance({
        equipmentId: "equip-1",
        maintenanceType: "repair",
        description: "Test",
        scheduledDate: "2026-11-15",
        status: "scheduled",
        estimatedCost: -100,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("non-negative");
      }
    });

    it("rejects NaN estimated cost", () => {
      const equipment = makeEquipment();
      mockGetAppDataSlice.mockReturnValue([equipment]);

      const result = createMaintenance({
        equipmentId: "equip-1",
        maintenanceType: "repair",
        description: "Test",
        scheduledDate: "2026-11-15",
        status: "scheduled",
        estimatedCost: NaN,
      });

      expect(result.success).toBe(false);
    });
  });

  describe("completeMaintenance", () => {
    it("completes maintenance with actual cost", () => {
      const maintenance = {
        id: "maint-1",
        equipmentId: "equip-1",
        status: "in-progress",
        scheduledDate: "2026-11-15",
        description: "Repair",
        maintenanceType: "repair",
      };
      mockGetAppDataSlice.mockReturnValue([maintenance]);

      const result = completeMaintenance("maint-1", 5000);

      expect(result.success).toBe(true);
      expect(mockUpdateAppDataSlice).toHaveBeenCalledWith("equipmentMaintenance", expect.any(Function));
    });
  });

  describe("calcEquipmentStats", () => {
    it("calculates statistics correctly", () => {
      const items: EquipmentItem[] = [
        makeEquipment({ id: "1", status: "available", category: "camera" }),
        makeEquipment({ id: "2", status: "available", category: "camera" }),
        makeEquipment({ id: "3", status: "reserved", category: "lighting" }),
        makeEquipment({ id: "4", status: "in-use", category: "sound" }),
        makeEquipment({ id: "5", status: "maintenance", category: "camera" }),
      ];

      const stats = calcEquipmentStats(items);

      expect(stats.total).toBe(5);
      expect(stats.available).toBe(2);
      expect(stats.reserved).toBe(1);
      expect(stats.inUse).toBe(1);
      expect(stats.maintenance).toBe(1);
      expect(stats.byCategory.camera).toBe(3);
      expect(stats.byCategory.lighting).toBe(1);
      expect(stats.byCategory.sound).toBe(1);
    });
  });

  describe("getActiveAllocationsCount", () => {
    it("counts only active and pending allocations", () => {
      const allocations = [
        { id: "1", equipmentId: "equip-1", status: "active", quantity: 2, returnedQuantity: 0 },
        { id: "2", equipmentId: "equip-1", status: "pending", quantity: 1, returnedQuantity: 0 },
        { id: "3", equipmentId: "equip-1", status: "returned", quantity: 3, returnedQuantity: 3 },
        { id: "4", equipmentId: "other", status: "active", quantity: 5, returnedQuantity: 0 },
      ];
      mockGetAppDataSlice.mockReturnValue(allocations);

      const count = getActiveAllocationsCount("equip-1");

      expect(count).toBe(3); // 2 + 1 from active and pending, not 5 from other equipment
    });

    it("accounts for partial returns", () => {
      const allocations = [
        { id: "1", equipmentId: "equip-1", status: "active", quantity: 5, returnedQuantity: 2 },
      ];
      mockGetAppDataSlice.mockReturnValue(allocations);

      const count = getActiveAllocationsCount("equip-1");

      expect(count).toBe(3); // 5 - 2 = 3
    });
  });
});
