import { useAppDataSlice, updateAppDataSlice } from "./app-data-store";
import type {
  ProductionVehicle, VehicleAllocation, Caravan, CaravanAllocation,
  DriverProfile, DriverAssignment, StuntPlan, StuntSafetyChecklist,
  StuntEquipment, StuntEquipmentTransaction, VehicleStatus, StuntStatus,
} from "./types";

// ── Formatters ──────────────────────────────────────────────────────────────

export const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

// ── Production Vehicles ──────────────────────────────────────────────────────

export function useProductionVehicles(projectId?: string) {
  const all = useAppDataSlice("productionVehicles") as ProductionVehicle[];
  if (!projectId) return all;
  return all.filter((v) => !v.projectId || v.projectId === projectId);
}

export function addProductionVehicle(vehicle: Omit<ProductionVehicle, "id" | "createdAt" | "updatedAt">) {
  updateAppDataSlice("productionVehicles", (prev: ProductionVehicle[]) => {
    const id = "veh" + (Date.now() % 1_000_000);
    const now = new Date().toISOString();
    return [...prev, { ...vehicle, id, createdAt: now, updatedAt: now }];
  });
}

export function updateProductionVehicle(id: string, updates: Partial<ProductionVehicle>) {
  updateAppDataSlice("productionVehicles", (prev: ProductionVehicle[]) =>
    prev.map((v) => (v.id === id ? { ...v, ...updates, updatedAt: new Date().toISOString() } : v))
  );
}

export function updateVehicleStatus(id: string, status: VehicleStatus) {
  updateProductionVehicle(id, { status });
}

export function addVehicleAllocation(
  vehicle: ProductionVehicle,
  alloc: Omit<VehicleAllocation, "id" | "createdAt">
) {
  if (alloc.passengerCount > vehicle.seatingCapacity) {
    throw new Error(`Passenger count (${alloc.passengerCount}) exceeds vehicle capacity (${vehicle.seatingCapacity})`);
  }
  updateAppDataSlice("vehicleAllocations", (prev: VehicleAllocation[]) => {
    const id = "va" + (Date.now() % 1_000_000);
    return [...prev, { ...alloc, id, createdAt: new Date().toISOString() }];
  });
  updateVehicleStatus(vehicle.id, "allocated");
}

export function useVehicleAllocations(projectId?: string) {
  const all = useAppDataSlice("vehicleAllocations") as VehicleAllocation[];
  if (!projectId) return all;
  return all.filter((a) => a.projectId === projectId);
}

// ── Caravans ─────────────────────────────────────────────────────────────────

export function useCaravans(projectId?: string) {
  const all = useAppDataSlice("caravans") as Caravan[];
  if (!projectId) return all;
  return all.filter((c) => !c.projectId || c.projectId === projectId);
}

export function addCaravan(caravan: Omit<Caravan, "id" | "createdAt" | "updatedAt">) {
  updateAppDataSlice("caravans", (prev: Caravan[]) => {
    const id = "cv" + (Date.now() % 1_000_000);
    const now = new Date().toISOString();
    return [...prev, { ...caravan, id, createdAt: now, updatedAt: now }];
  });
}

export function updateCaravan(id: string, updates: Partial<Caravan>) {
  updateAppDataSlice("caravans", (prev: Caravan[]) =>
    prev.map((c) => (c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c))
  );
}

export function addCaravanAllocation(
  caravan: Caravan,
  alloc: Omit<CaravanAllocation, "id" | "createdAt">
) {
  if (caravan.status === "allocated") {
    throw new Error(`Caravan "${caravan.name}" is already allocated`);
  }
  updateAppDataSlice("caravanAllocations", (prev: CaravanAllocation[]) => {
    const id = "ca" + (Date.now() % 1_000_000);
    return [...prev, { ...alloc, id, createdAt: new Date().toISOString() }];
  });
  updateCaravan(caravan.id, { status: "allocated" });
}

export function useCaravanAllocations(projectId?: string) {
  const all = useAppDataSlice("caravanAllocations") as CaravanAllocation[];
  if (!projectId) return all;
  return all.filter((a) => a.projectId === projectId);
}

// ── Driver Profiles ───────────────────────────────────────────────────────────

export function useDriverProfiles() {
  return useAppDataSlice("driverProfiles") as DriverProfile[];
}

export function isLicenseExpired(profile: DriverProfile) {
  return new Date(profile.licenseExpiry) < new Date();
}

export function isLicenseExpiring(profile: DriverProfile) {
  const expiry = new Date(profile.licenseExpiry);
  const threshold = new Date();
  threshold.setDate(threshold.getDate() + 30);
  return expiry > new Date() && expiry <= threshold;
}

export function addDriverProfile(profile: Omit<DriverProfile, "id" | "createdAt" | "updatedAt">) {
  updateAppDataSlice("driverProfiles", (prev: DriverProfile[]) => {
    const id = "dp" + (Date.now() % 1_000_000);
    const now = new Date().toISOString();
    return [...prev, { ...profile, id, createdAt: now, updatedAt: now }];
  });
}

export function updateDriverProfile(id: string, updates: Partial<DriverProfile>) {
  updateAppDataSlice("driverProfiles", (prev: DriverProfile[]) =>
    prev.map((d) => (d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d))
  );
}

export function addDriverAssignment(
  profile: DriverProfile,
  assignment: Omit<DriverAssignment, "id" | "createdAt">
) {
  if (!profile.available) {
    throw new Error(`Driver is not available`);
  }
  if (isLicenseExpired(profile)) {
    throw new Error(`Driver license has expired (${profile.licenseExpiry})`);
  }
  updateAppDataSlice("driverAssignments", (prev: DriverAssignment[]) => {
    const id = "da" + (Date.now() % 1_000_000);
    return [...prev, { ...assignment, id, createdAt: new Date().toISOString() }];
  });
}

export function useDriverAssignments(projectId?: string) {
  const all = useAppDataSlice("driverAssignments") as DriverAssignment[];
  if (!projectId) return all;
  return all.filter((a) => a.projectId === projectId);
}

// ── Stunt Plans ───────────────────────────────────────────────────────────────

export function useStuntPlans(projectId?: string) {
  const all = useAppDataSlice("stuntPlans") as StuntPlan[];
  if (!projectId) return all;
  return all.filter((s) => s.projectId === projectId);
}

export function addStuntPlan(plan: Omit<StuntPlan, "id" | "createdAt" | "updatedAt">) {
  updateAppDataSlice("stuntPlans", (prev: StuntPlan[]) => {
    const id = "sp" + (Date.now() % 1_000_000);
    const now = new Date().toISOString();
    return [...prev, { ...plan, id, createdAt: now, updatedAt: now }];
  });
}

export function updateStuntPlan(id: string, updates: Partial<StuntPlan>) {
  updateAppDataSlice("stuntPlans", (prev: StuntPlan[]) =>
    prev.map((s) => (s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s))
  );
}

export function updateStuntStatus(
  id: string,
  status: StuntStatus,
  checklist?: StuntSafetyChecklist
) {
  if (status === "approved") {
    if (!checklist) throw new Error("Safety checklist required for approval");
    if (!checklist.safetyOfficerSignOff) throw new Error("Safety officer sign-off required");
    if (!checklist.riskAssessmentDone) throw new Error("Risk assessment must be completed");
    if (!checklist.safetyBriefingDone) throw new Error("Safety briefing must be completed");
    if (!checklist.rehearsalDone) throw new Error("Rehearsal must be completed");
  }
  updateStuntPlan(id, { status, safetySignedOff: checklist?.safetyOfficerSignOff ?? false });
}

export function useStuntSafetyChecklists() {
  return useAppDataSlice("stuntSafetyChecklists") as StuntSafetyChecklist[];
}

export function updateStuntSafetyChecklist(stuntPlanId: string, updates: Partial<StuntSafetyChecklist>) {
  updateAppDataSlice("stuntSafetyChecklists", (prev: StuntSafetyChecklist[]) => {
    const now = new Date().toISOString();
    const existing = prev.find((c) => c.stuntPlanId === stuntPlanId);
    if (existing) {
      return prev.map((c) =>
        c.stuntPlanId === stuntPlanId ? { ...c, ...updates, updatedAt: now } : c
      );
    }
    const id = "ssc" + (Date.now() % 1_000_000);
    return [
      ...prev,
      {
        id,
        stuntPlanId,
        riskAssessmentDone: false,
        safetyBriefingDone: false,
        rehearsalDone: false,
        ppeRequired: [],
        safetyOfficerSignOff: false,
        updatedAt: now,
        ...updates,
      } as StuntSafetyChecklist,
    ];
  });
}

// ── Stunt Equipment ───────────────────────────────────────────────────────────

export function useStuntEquipment() {
  return useAppDataSlice("stuntEquipment") as StuntEquipment[];
}

export function useStuntEquipmentTransactions(projectId?: string) {
  const all = useAppDataSlice("stuntEquipmentTransactions") as StuntEquipmentTransaction[];
  if (!projectId) return all;
  return all.filter((t) => t.projectId === projectId);
}

export function checkoutStuntEquipment(
  equipment: StuntEquipment,
  tx: Omit<StuntEquipmentTransaction, "id" | "createdAt" | "status">
) {
  if (tx.quantity > equipment.quantityAvailable) {
    throw new Error(
      `Requested quantity (${tx.quantity}) exceeds available (${equipment.quantityAvailable})`
    );
  }
  const id = "set" + (Date.now() % 1_000_000);
  updateAppDataSlice("stuntEquipmentTransactions", (prev: StuntEquipmentTransaction[]) => [
    ...prev,
    { ...tx, id, status: "active", createdAt: new Date().toISOString() } as StuntEquipmentTransaction,
  ]);
  updateAppDataSlice("stuntEquipment", (prev: StuntEquipment[]) =>
    prev.map((e) =>
      e.id === equipment.id
        ? { ...e, quantityAvailable: e.quantityAvailable - tx.quantity, updatedAt: new Date().toISOString() }
        : e
    )
  );
}

export function checkinStuntEquipment(
  equipment: StuntEquipment,
  txId: string,
  quantity: number,
  condition: StuntEquipmentTransaction["conditionOnReturn"]
) {
  const now = new Date().toISOString();
  updateAppDataSlice("stuntEquipmentTransactions", (prev: StuntEquipmentTransaction[]) =>
    prev.map((t) =>
      t.id === txId
        ? { ...t, actualReturnDate: now.slice(0, 10), conditionOnReturn: condition, status: "returned" as const }
        : t
    )
  );
  updateAppDataSlice("stuntEquipment", (prev: StuntEquipment[]) =>
    prev.map((e) =>
      e.id === equipment.id
        ? { ...e, quantityAvailable: Math.min(e.quantityTotal, e.quantityAvailable + quantity), updatedAt: now }
        : e
    )
  );
}

// ── Dashboard Calc ────────────────────────────────────────────────────────────

export interface VehicleStuntDashboard {
  totalVehicles: number;
  availableVehicles: number;
  allocatedVehicles: number;
  maintenanceVehicles: number;
  totalCaravans: number;
  activeCaravanAllocations: number;
  totalDrivers: number;
  availableDrivers: number;
  expiringLicenses: number;
  totalStunts: number;
  completedStunts: number;
  pendingApproval: number;
  highRiskStunts: number;
  totalEquipment: number;
  equipmentAvailable: number;
  equipmentCheckedOut: number;
}

export function calcVehicleStuntDashboard(
  vehicles: ProductionVehicle[],
  _allocations: VehicleAllocation[],
  caravans: Caravan[],
  caravanAllocations: CaravanAllocation[],
  driverProfiles: DriverProfile[],
  stuntPlans: StuntPlan[],
  stuntEquipment: StuntEquipment[]
): VehicleStuntDashboard {
  return {
    totalVehicles: vehicles.length,
    availableVehicles: vehicles.filter((v) => v.status === "available").length,
    allocatedVehicles: vehicles.filter((v) => v.status === "allocated").length,
    maintenanceVehicles: vehicles.filter((v) => v.status === "maintenance").length,
    totalCaravans: caravans.length,
    activeCaravanAllocations: caravanAllocations.filter((a) => a.status === "active").length,
    totalDrivers: driverProfiles.length,
    availableDrivers: driverProfiles.filter((d) => d.available && !isLicenseExpired(d)).length,
    expiringLicenses: driverProfiles.filter((d) => isLicenseExpiring(d)).length,
    totalStunts: stuntPlans.length,
    completedStunts: stuntPlans.filter((s) => s.status === "completed").length,
    pendingApproval: stuntPlans.filter((s) => s.status === "safety-review").length,
    highRiskStunts: stuntPlans.filter((s) => s.riskLevel === "high" || s.riskLevel === "extreme").length,
    totalEquipment: stuntEquipment.reduce((sum, e) => sum + e.quantityTotal, 0),
    equipmentAvailable: stuntEquipment.reduce((sum, e) => sum + e.quantityAvailable, 0),
    equipmentCheckedOut: stuntEquipment.reduce(
      (sum, e) => sum + (e.quantityTotal - e.quantityAvailable),
      0
    ),
  };
}
