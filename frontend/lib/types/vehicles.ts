// ─── Phase 6: Vehicles, Caravans, Drivers, Action & Stunts ───────────────────

// ── Vehicles ──────────────────────────────────────────────────────────────────

export type VehicleCategory =
  | "car" | "suv" | "van" | "bus" | "truck" | "cargo"
  | "special-purpose" | "other";

export type VehicleOwnership = "owned" | "rented";
export type VehicleStatus = "available" | "allocated" | "maintenance" | "unavailable";

export interface ProductionVehicle {
  id: string;
  registrationNumber: string;
  name: string;
  category: VehicleCategory;
  ownership: VehicleOwnership;
  vendorId?: string;
  rentalRecordId?: string;
  seatingCapacity: number;
  status: VehicleStatus;
  currentLocation?: string;
  projectId?: string;
  insuranceExpiry?: string;
  permitExpiry?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type AllocationStatus = "scheduled" | "active" | "completed" | "cancelled";

export interface VehicleAllocation {
  id: string;
  vehicleId: string;
  projectId: string;
  shootDayId?: string;
  tripId?: string;
  driverCrewId?: string;
  startDate: string;
  endDate: string;
  pickupLocation?: string;
  dropLocation?: string;
  passengerCrewIds: string[];
  passengerCastIds: string[];
  passengerCount: number;
  status: AllocationStatus;
  notes?: string;
  createdAt: string;
}

// ── Caravans ──────────────────────────────────────────────────────────────────

export type CaravanCategory =
  | "artist" | "director" | "vanity-van" | "production" | "support" | "other";

export type CaravanStatus = "available" | "allocated" | "maintenance" | "returned";

export interface Caravan {
  id: string;
  identificationNumber: string;
  name: string;
  category: CaravanCategory;
  capacity: number;
  ownership: VehicleOwnership;
  vendorId?: string;
  rentalRecordId?: string;
  projectId?: string;
  rentalStartDate?: string;
  rentalEndDate?: string;
  rentalAgreementRef?: string;
  depositPaid: number;
  rentalCostPerDay: number;
  totalRentalCost: number;
  status: CaravanStatus;
  parkingLocation?: string;
  maintenanceStatus?: string;
  returnCondition?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CaravanAllocation {
  id: string;
  caravanId: string;
  projectId: string;
  shootDayId?: string;
  assignedTo: string;
  crewMemberId?: string;
  castMemberId?: string;
  startDate: string;
  endDate: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: AllocationStatus;
  notes?: string;
  createdAt: string;
}

// ── Driver Profiles ────────────────────────────────────────────────────────────

export interface DriverProfile {
  id: string;
  crewMemberId: string;
  licenseNumber: string;
  licenseExpiry: string;
  licenseType: string;
  vehicleIds: string[];
  available: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DriverAssignment {
  id: string;
  driverProfileId: string;
  vehicleId: string;
  projectId: string;
  shootDayId?: string;
  tripId?: string;
  dutyStart: string;
  dutyEnd: string;
  status: AllocationStatus;
  notes?: string;
  createdAt: string;
}

// ── Stunts ─────────────────────────────────────────────────────────────────────

export type StuntStatus =
  | "planned" | "risk-assessment" | "rehearsal" | "safety-review"
  | "approved" | "scheduled" | "completed" | "blocked" | "cancelled";

export type RiskLevel = "low" | "medium" | "high" | "extreme";

export interface StuntPlan {
  id: string;
  projectId: string;
  sceneId?: string;
  shootDayId?: string;
  locationId?: string;
  title: string;
  description: string;
  actionDirector: string;
  actionDirectorCrewId?: string;
  assignedStuntCrewIds: string[];
  riskLevel: RiskLevel;
  vehicleIds: string[];
  equipmentIds: string[];
  plannedDate?: string;
  rehearsalDate?: string;
  completedDate?: string;
  status: StuntStatus;
  safetySignedOff: boolean;
  approvedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StuntSafetyChecklist {
  id: string;
  stuntPlanId: string;
  riskAssessmentDone: boolean;
  safetyBriefingDone: boolean;
  rehearsalDone: boolean;
  ppeRequired: string[];
  medicalContactRef?: string;
  locationPermissionRef?: string;
  safetyOfficerSignOff: boolean;
  safetyOfficerName?: string;
  incidentPlaceholder?: string;
  approvalNotes?: string;
  updatedAt: string;
}

// ── Stunt Equipment ────────────────────────────────────────────────────────────

export type StuntEquipmentCategory =
  | "crash-mat" | "wire-rig" | "air-bag" | "protective-gear"
  | "fire-safety" | "stunt-vehicle-mod" | "underwater-gear"
  | "rigging" | "pyrotechnics" | "other";

export interface StuntEquipment {
  id: string;
  name: string;
  category: StuntEquipmentCategory;
  description?: string;
  quantityTotal: number;
  quantityAvailable: number;
  condition: "excellent" | "good" | "fair" | "damaged" | "under-repair";
  ownership: "owned" | "rented" | "borrowed";
  vendorId?: string;
  rentalRecordId?: string;
  purchaseCost: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StuntEquipmentTransaction {
  id: string;
  equipmentId: string;
  stuntPlanId?: string;
  projectId: string;
  quantity: number;
  type: "checkout" | "checkin" | "damage-report";
  checkedOutBy: string;
  checkoutDate: string;
  expectedReturnDate?: string;
  actualReturnDate?: string;
  conditionOnReturn?: "excellent" | "good" | "fair" | "damaged";
  status: "active" | "returned" | "damaged";
  notes?: string;
  createdAt: string;
}
