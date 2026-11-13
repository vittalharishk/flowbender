// ── Production Schedule ──

export type ShootDayStatus = "planned" | "confirmed" | "in-progress" | "completed" | "cancelled";

export interface ShootDayScene {
  sceneNumber: string;
  heading: string;
  pages: number;
  intExt: string;
  characters: string[];
  timeOfDay?: string;
  location?: string;
  estimatedDuration?: string;
  synopsis?: string;
  status?: string;
}

export interface ShootDayCrewReq {
  department: string;
  role: string;
  name: string;
}

export interface ShootDayEquipment {
  id: string;
  name: string;
  category?: string;
  notes?: string;
  imageUrl?: string;
}

export interface ScheduleConflict {
  type: "cast-overlap" | "location-overlap" | "crew-unavailable" | "permit-expiry";
  message: string;
  severity: "warning" | "critical";
}

export interface ShootDay {
  id: string;
  projectId: string;
  projectTitle: string;
  date: string;
  shootDayNumber: number;
  totalShootDays: number;
  callTime: string;
  wrapTime: string;
  location: string;
  locationAddress?: string;
  scenes: ShootDayScene[];
  castRequired: string[];
  crewRequired: ShootDayCrewReq[];
  equipment: ShootDayEquipment[];
  status: ShootDayStatus;
  callSheetStatus: "published" | "draft" | "pending";
  totalPages: number;
  notes: string;
  conflicts: ScheduleConflict[];
}
