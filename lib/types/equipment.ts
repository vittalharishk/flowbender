export interface EquipmentItem {
  id: string;
  projectId?: string;
  name: string;
  category: string;
  vendorId?: string;
  quantity: number;
  status: "available" | "reserved" | "in-use" | "maintenance";
  notes?: string;
  imageUrl?: string;
}

export type EquipmentAllocationStatus = "pending" | "active" | "returned" | "partial-return";

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
  status: EquipmentAllocationStatus;
  returnedQuantity: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type EquipmentMaintenanceType = "preventive" | "repair" | "inspection" | "calibration";
export type EquipmentMaintenanceStatus = "scheduled" | "in-progress" | "completed" | "cancelled";

export interface EquipmentMaintenance {
  id: string;
  equipmentId: string;
  projectId?: string;
  maintenanceType: EquipmentMaintenanceType;
  description: string;
  vendorId?: string;
  estimatedCost?: number;
  actualCost?: number;
  scheduledDate: string;
  completedDate?: string;
  status: EquipmentMaintenanceStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
