import type { PaymentMilestone, ProductionStatus } from "./core";

export interface SeriesSeason {
  id: string;
  projectId: string;
  title: string;
  seasonNumber: number;
  episodeCount: number;
  status: ProductionStatus;
  logline: string;
  showrunner: string;
  deliveryWindow: string;
}

export type EpisodeStatus =
  | "concept"
  | "writing"
  | "locked"
  | "scheduled"
  | "shooting"
  | "editing"
  | "delivered";

export interface SeriesEpisode {
  id: string;
  projectId: string;
  seasonId: string;
  episodeNumber: number;
  title: string;
  status: EpisodeStatus;
  synopsis: string;
  scriptVersionId?: string;
  airDate?: string;
  duration?: number;
}

export interface CharacterProfile {
  id: string;
  projectId: string;
  name: string;
  description: string;
  ageBracket: string;
  arc: string;
  languages: string[];
  linkedCastIds: string[];
  multiArtist?: boolean; // explicit opt-in: role may have more than one selected artist
}

export interface ProjectLocation {
  id: string;
  projectId: string;
  name: string;
  city: string;
  type: string;
  status: "locked" | "scouting" | "permit-pending";
  address: string;
  notes: string;
  coverImage?: string | null;
  gallery?: string[];
}

export interface DprReport {
  id: string;
  projectId: string;
  shootDayId: string;
  date: string;
  plannedPages: number;
  shotPages: number;
  completedScenes: string[];
  delays: string[];
  incidents: string[];
  producerNote: string;
}

export type TaskPriority = "low" | "medium" | "high" | "critical";
export type ProductionTaskStatus = "open" | "in-progress" | "blocked" | "done";

export interface ProductionTask {
  id: string;
  projectId: string;
  department: string;
  title: string;
  owner: string;
  dueDate: string;
  status: ProductionTaskStatus;
  priority: TaskPriority;
}

// ─── Pre-Production Checklist ───────────────────────────────────────────────
export type ChecklistStatus = "pending" | "in-progress" | "done" | "blocked";

export interface PreProdChecklistItem {
  id: string;
  projectId: string;
  category: string;
  title: string;
  owner: string;
  dueDate: string;
  status: ChecklistStatus;
  notes: string;
}

// ─── Daily Production Report (rich) ─────────────────────────────────────────
export type DPRStatus = "draft" | "submitted" | "approved";

export interface DPRScene {
  sceneNumber: string;
  heading: string;
  pagesPlanned: number;
  pagesCompleted: number;
  status: "completed" | "partial" | "not-started" | "moved";
  notes: string;
}

export interface DPRReport {
  id: string;
  projectId: string;
  shootDayId: string;
  date: string;
  shootDayNumber: number;
  location: string;
  director: string;
  adName: string;
  callTime: string;
  actualCallTime: string;
  wrapTime: string;
  actualWrapTime: string;
  castPresent: number;
  crewPresent: number;
  cateringCount: number;
  scenesPlanned: number;
  scenesCompleted: number;
  pagesPlanned: number;
  pagesCompleted: number;
  scenes: DPRScene[];
  issues: string;
  tomorrowLocation: string;
  tomorrowScenes: string;
  status: DPRStatus;
  submittedBy: string;
  createdAt: string;
  updatedAt: string;
}

export type ContractStage = "draft" | "under-review" | "approved" | "signed" | "completed";

export interface CastContract {
  id: string;
  castId: string; // CastMember.id (confirmed casting record)
  roleId: string;
  projectId: string;
  contractRef: string; // e.g. "FLW-2027-001"
  amount: number;
  advance: number;
  milestones: PaymentMilestone[];
  startDate: string;
  endDate: string;
  contractStage: ContractStage;
  documentName: string | null; // placeholder until document upload exists
  notes: string;
  createdAt: string;
  updatedAt: string;
}
