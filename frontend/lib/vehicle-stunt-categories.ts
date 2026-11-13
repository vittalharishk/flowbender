import type { VehicleStatus, CaravanStatus, AllocationStatus, StuntStatus, RiskLevel, StuntEquipmentCategory, VehicleCategory, CaravanCategory } from "./types";

export const VEHICLE_CATEGORIES: { value: VehicleCategory; label: string }[] = [
  { value: "car", label: "Car" },
  { value: "suv", label: "SUV" },
  { value: "van", label: "Van" },
  { value: "bus", label: "Bus" },
  { value: "truck", label: "Truck" },
  { value: "cargo", label: "Cargo" },
  { value: "special-purpose", label: "Special Purpose" },
  { value: "other", label: "Other" },
];

export const CARAVAN_CATEGORIES: { value: CaravanCategory; label: string }[] = [
  { value: "artist", label: "Artist Caravan" },
  { value: "director", label: "Director Caravan" },
  { value: "vanity-van", label: "Vanity Van" },
  { value: "production", label: "Production Office" },
  { value: "support", label: "Support Caravan" },
  { value: "other", label: "Other" },
];

export const STUNT_EQUIPMENT_CATEGORIES: { value: StuntEquipmentCategory; label: string }[] = [
  { value: "crash-mat", label: "Crash Mat" },
  { value: "wire-rig", label: "Wire Rig" },
  { value: "air-bag", label: "Air Bag" },
  { value: "protective-gear", label: "Protective Gear" },
  { value: "fire-safety", label: "Fire Safety" },
  { value: "stunt-vehicle-mod", label: "Vehicle Modification" },
  { value: "underwater-gear", label: "Underwater Gear" },
  { value: "rigging", label: "Rigging" },
  { value: "pyrotechnics", label: "Pyrotechnics" },
  { value: "other", label: "Other" },
];

export const STUNT_STATUS_FLOW: StuntStatus[] = [
  "planned",
  "risk-assessment",
  "rehearsal",
  "safety-review",
  "approved",
  "scheduled",
  "completed",
];

export const RISK_LEVEL_COLORS: Record<RiskLevel, string> = {
  low: "bg-green-100 text-green-800 border-green-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  extreme: "bg-red-100 text-red-800 border-red-200",
};

export const STUNT_STATUS_COLORS: Record<StuntStatus, string> = {
  planned: "bg-slate-100 text-slate-700",
  "risk-assessment": "bg-orange-100 text-orange-700",
  rehearsal: "bg-blue-100 text-blue-700",
  "safety-review": "bg-purple-100 text-purple-700",
  approved: "bg-emerald-100 text-emerald-700",
  scheduled: "bg-cyan-100 text-cyan-700",
  completed: "bg-green-100 text-green-700",
  blocked: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-500",
};

export const VEHICLE_STATUS_COLORS: Record<VehicleStatus, string> = {
  available: "bg-green-100 text-green-700",
  allocated: "bg-blue-100 text-blue-700",
  maintenance: "bg-yellow-100 text-yellow-700",
  unavailable: "bg-red-100 text-red-700",
};

export const CARAVAN_STATUS_COLORS: Record<CaravanStatus, string> = {
  available: "bg-green-100 text-green-700",
  allocated: "bg-blue-100 text-blue-700",
  maintenance: "bg-yellow-100 text-yellow-700",
  returned: "bg-gray-100 text-gray-600",
};

export const ALLOCATION_STATUS_COLORS: Record<AllocationStatus, string> = {
  scheduled: "bg-cyan-100 text-cyan-700",
  active: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
};
