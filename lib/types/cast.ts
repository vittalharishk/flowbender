import type { CastCategory } from "./core";

// ── Cast: roles (CharacterProfile), probable candidates, decisions, availability, contracts ──

export type CastCandidateStatus =
  | "proposed"
  | "under-discussion"
  | "shortlisted"
  | "negotiation"
  | "on-hold"
  | "rejected"
  | "selected";

export interface CastCandidate {
  id: string;
  roleId: string; // CharacterProfile.id
  projectId: string;
  name: string;
  category: CastCategory;
  agency: string;
  email: string;
  phone: string;
  languages: string[];
  proposedFee: number;
  availabilityNote: string;
  status: CastCandidateStatus;
  notes: string; // audition / meeting notes
  negotiationNotes: string;
  linkedCastId: string | null; // CastMember.id once selected
  isDemo: boolean; // fictional sample artist with demo contact details
  createdAt: string;
  updatedAt: string;
}

export interface CastDecisionLogEntry {
  id: string;
  candidateId: string;
  roleId: string;
  projectId: string;
  fromStatus: CastCandidateStatus | null;
  toStatus: CastCandidateStatus;
  note: string;
  createdAt: string;
  createdBy: string;
}

export type ArtistAvailabilityState = "available" | "unavailable" | "tentative" | "confirmed";

export interface ArtistAvailability {
  id: string;
  castId: string; // CastMember.id
  date: string; // YYYY-MM-DD
  state: ArtistAvailabilityState;
  note: string;
  endDate?: string;
  reason?: string;
}
