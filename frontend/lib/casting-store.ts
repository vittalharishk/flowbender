"use client";

import { useMemo } from "react";
import { getAppDataSlice, updateAppDataSlice, useAppDataSlice } from "./app-data-store";
import { getProjectById } from "./project-store";
import { getCastMembers, getCastById, createCast } from "./cast-store";
import { getCharacterById, updateCharacter } from "./character-store";
import type {
  CastCandidate,
  CastCandidateStatus,
  CastDecisionLogEntry,
  ArtistAvailability,
  ArtistAvailabilityState,
  CastContract,
  ContractStage,
  PaymentMilestone,
} from "./types";

// ── helpers ──────────────────────────────────────────────────────────────────

function now() {
  return new Date().toISOString();
}

function nextId(prefix: string, existing: string[]): string {
  const nums = existing
    .filter((id) => id.startsWith(prefix))
    .map((id) => parseInt(id.slice(prefix.length), 10))
    .filter((n) => !isNaN(n));
  return `${prefix}${nums.length > 0 ? Math.max(...nums) + 1 : 1}`;
}

// ── raw getters ───────────────────────────────────────────────────────────────

export function getCastCandidates(): CastCandidate[] {
  return getAppDataSlice("castCandidates");
}

export function getCandidatesByRole(roleId: string): CastCandidate[] {
  return getCastCandidates().filter((c) => c.roleId === roleId);
}

export function getCandidatesByProject(projectId: string): CastCandidate[] {
  return getCastCandidates().filter((c) => c.projectId === projectId);
}

export function getCandidateById(id: string): CastCandidate | undefined {
  return getCastCandidates().find((c) => c.id === id);
}

export function getCastDecisionLog(): CastDecisionLogEntry[] {
  return getAppDataSlice("castDecisionLog");
}

export function getDecisionLogByCandidate(candidateId: string): CastDecisionLogEntry[] {
  return getCastDecisionLog().filter((e) => e.candidateId === candidateId);
}

export function getArtistAvailability(): ArtistAvailability[] {
  return getAppDataSlice("artistAvailability");
}

export function getAvailabilityByCast(castId: string): ArtistAvailability[] {
  return getArtistAvailability().filter((a) => a.castId === castId);
}

export function getCastContracts(): CastContract[] {
  return getAppDataSlice("castContracts");
}

export function getContractByCast(castId: string): CastContract | undefined {
  return getCastContracts().find((c) => c.castId === castId);
}

// ── candidate CRUD ────────────────────────────────────────────────────────────

export type CreateCandidateInput = Omit<CastCandidate, "id" | "createdAt" | "updatedAt">;

export function createCandidate(input: CreateCandidateInput): CastCandidate {
  const candidates = getCastCandidates();
  const id = nextId("cnd", candidates.map((c) => c.id));
  const entry: CastCandidate = {
    ...input,
    id,
    createdAt: now(),
    updatedAt: now(),
  };
  updateAppDataSlice("castCandidates", () => [...candidates, entry]);
  return entry;
}

export function updateCandidate(id: string, updates: Partial<Omit<CastCandidate, "id" | "createdAt">>): void {
  const candidates = getCastCandidates();
  updateAppDataSlice(
    "castCandidates",
    () => candidates.map((c) => (c.id === id ? { ...c, ...updates, updatedAt: now() } : c))
  );
}

export function deleteCandidate(id: string): void {
  updateAppDataSlice(
    "castCandidates",
    () => getCastCandidates().filter((c) => c.id !== id)
  );
}

// ── status transition + decision log ─────────────────────────────────────────

export function changeCandidateStatus(
  candidateId: string,
  toStatus: CastCandidateStatus,
  note = "",
  changedBy = "Production Team"
): void {
  const candidate = getCandidateById(candidateId);
  if (!candidate) return;
  const fromStatus = candidate.status;
  updateCandidate(candidateId, { status: toStatus });
  // log the transition
  const log = getCastDecisionLog();
  const entry: CastDecisionLogEntry = {
    id: nextId("dl", log.map((e) => e.id)),
    candidateId,
    roleId: candidate.roleId,
    projectId: candidate.projectId,
    fromStatus,
    toStatus,
    note,
    createdAt: now(),
    createdBy: changedBy,
  };
  updateAppDataSlice("castDecisionLog", () => [...log, entry]);
}

// ── Phase 2: Final selection ──────────────────────────────────────────────────

export interface SelectCandidateResult {
  success: boolean;
  error?: string;
  castMemberId?: string;
}

export function selectCandidate(
  candidateId: string,
  opts: { agreedFee?: number; changedBy?: string } = {}
): SelectCandidateResult {
  const candidate = getCandidateById(candidateId);
  if (!candidate) return { success: false, error: "Candidate not found." };

  const character = getCharacterById(candidate.roleId);
  if (!character) return { success: false, error: "Character / role not found." };

  // Guard: single-artist role already has a different selected candidate
  if (!character.multiArtist) {
    const blocking = getCandidatesByRole(candidate.roleId).find(
      (c) => c.status === "selected" && c.id !== candidateId
    );
    if (blocking) {
      return {
        success: false,
        error: `${blocking.name} is already selected for this role. Replace them first.`,
      };
    }
  }

  // Find or create the CastMember
  let castMember = candidate.linkedCastId ? getCastById(candidate.linkedCastId) : undefined;
  if (!castMember) {
    // Avoid duplicates: look for an existing member with same name + project
    castMember = getCastMembers().find(
      (m) => m.projectId === candidate.projectId && m.name.trim() === candidate.name.trim()
    );
  }
  if (!castMember) {
    const project = getProjectById(candidate.projectId);
    castMember = createCast({
      name: candidate.name,
      character: character.name,
      characterDescription: character.arc || character.description,
      category: candidate.category,
      projectId: candidate.projectId,
      projectTitle: project?.title ?? "",
      email: candidate.email,
      phone: candidate.phone,
      agency: candidate.agency,
      languages: candidate.languages,
      totalFee: opts.agreedFee ?? candidate.proposedFee,
      notes: candidate.notes,
    });
  }

  const castMemberId = castMember.id;

  // Update candidate status + link (only update status if not already selected)
  if (candidate.status !== "selected") {
    changeCandidateStatus(candidateId, "selected", "Final artist selection confirmed", opts.changedBy ?? "Production Team");
  }
  updateCandidate(candidateId, { linkedCastId: castMemberId });

  // Update CharacterProfile.linkedCastIds
  const updatedIds = character.multiArtist
    ? [...new Set([...character.linkedCastIds, castMemberId])]
    : [castMemberId];
  updateCharacter(character.id, { linkedCastIds: updatedIds });

  return { success: true, castMemberId };
}

export function replaceSelectedArtist(
  newCandidateId: string,
  opts: { agreedFee?: number; reason?: string; changedBy?: string } = {}
): SelectCandidateResult {
  const candidate = getCandidateById(newCandidateId);
  if (!candidate) return { success: false, error: "Candidate not found." };

  // Move every currently-selected candidate for this role to on-hold
  const prevSelected = getCandidatesByRole(candidate.roleId).filter(
    (c) => c.status === "selected" && c.id !== newCandidateId
  );
  for (const old of prevSelected) {
    changeCandidateStatus(
      old.id,
      "on-hold",
      opts.reason ?? "Artist replaced by a new selection",
      opts.changedBy ?? "Production Team"
    );
  }

  return selectCandidate(newCandidateId, opts);
}

// ── availability CRUD ─────────────────────────────────────────────────────────

export function setArtistAvailability(castId: string, date: string, state: ArtistAvailabilityState, note = ""): void {
  const all = getArtistAvailability();
  const existing = all.find((a) => a.castId === castId && a.date === date);
  if (existing) {
    updateAppDataSlice("artistAvailability", () => all.map((a) => a.id === existing.id ? { ...a, state, note } : a));
  } else {
    const id = nextId("av", all.map((a) => a.id));
    updateAppDataSlice("artistAvailability", () => [...all, { id, castId, date, state, note }]);
  }
}

// ── contract CRUD ─────────────────────────────────────────────────────────────

export type CreateContractInput = Omit<CastContract, "id" | "createdAt" | "updatedAt">;

export function createContract(input: CreateContractInput): CastContract {
  const contracts = getCastContracts();
  const id = nextId("cc", contracts.map((c) => c.id));
  const entry: CastContract = { ...input, id, createdAt: now(), updatedAt: now() };
  updateAppDataSlice("castContracts", () => [...contracts, entry]);
  return entry;
}

export function updateContract(id: string, updates: Partial<Omit<CastContract, "id" | "createdAt">>): void {
  const contracts = getCastContracts();
  updateAppDataSlice("castContracts", () => contracts.map((c) => c.id === id ? { ...c, ...updates, updatedAt: now() } : c));
}

export function deleteContract(id: string): void {
  updateAppDataSlice("castContracts", () => getCastContracts().filter((c) => c.id !== id));
}

export function getContractsByProject(projectId: string): CastContract[] {
  return getCastContracts().filter((c) => c.projectId === projectId);
}

export function getContractByCastAndRole(castId: string, roleId: string): CastContract | undefined {
  return getCastContracts().find((c) => c.castId === castId && c.roleId === roleId);
}

export function changeContractStage(contractId: string, stage: ContractStage): void {
  updateContract(contractId, { contractStage: stage });
}

// ── milestone CRUD (within a contract) ───────────────────────────────────────

export type MilestoneInput = Omit<PaymentMilestone, "id">;

export function addMilestone(contractId: string, input: MilestoneInput): void {
  const contracts = getCastContracts();
  const contract = contracts.find((c) => c.id === contractId);
  if (!contract) return;
  const existingIds = contract.milestones.map((m) => m.id);
  const id = nextId("ms", existingIds);
  const milestone: PaymentMilestone = { ...input, id };
  updateContract(contractId, { milestones: [...contract.milestones, milestone] });
}

export function updateMilestone(contractId: string, milestoneId: string, updates: Partial<Omit<PaymentMilestone, "id">>): void {
  const contracts = getCastContracts();
  const contract = contracts.find((c) => c.id === contractId);
  if (!contract) return;
  const milestones = contract.milestones.map((m) =>
    m.id === milestoneId ? { ...m, ...updates } : m
  );
  updateContract(contractId, { milestones });
}

export function deleteMilestone(contractId: string, milestoneId: string): void {
  const contracts = getCastContracts();
  const contract = contracts.find((c) => c.id === contractId);
  if (!contract) return;
  updateContract(contractId, {
    milestones: contract.milestones.filter((m) => m.id !== milestoneId),
  });
}

// ── contract financial helpers ────────────────────────────────────────────────

export function calcContractTotals(contract: CastContract) {
  const totalPaid = contract.milestones.filter((m) => m.status === "paid").reduce((s, m) => s + m.amount, 0);
  const outstanding = contract.amount - totalPaid;
  const milestonesTotalScheduled = contract.milestones.reduce((s, m) => s + m.amount, 0);
  return { totalPaid, outstanding, milestonesTotalScheduled };
}

// ── hooks ─────────────────────────────────────────────────────────────────────

export function useContractsByProject(projectId: string): CastContract[] {
  const all = useCastContracts();
  return useMemo(() => all.filter((c) => c.projectId === projectId), [all, projectId]);
}

// ── hooks ─────────────────────────────────────────────────────────────────────

export function useCastCandidates(): CastCandidate[] {
  return useAppDataSlice("castCandidates");
}

export function useCandidatesByRole(roleId: string): CastCandidate[] {
  const all = useCastCandidates();
  return useMemo(() => all.filter((c) => c.roleId === roleId), [all, roleId]);
}

export function useCandidatesByProject(projectId: string): CastCandidate[] {
  const all = useCastCandidates();
  return useMemo(() => all.filter((c) => c.projectId === projectId), [all, projectId]);
}

export function useCastDecisionLog(): CastDecisionLogEntry[] {
  return useAppDataSlice("castDecisionLog");
}

export function useDecisionLogByCandidate(candidateId: string): CastDecisionLogEntry[] {
  const all = useCastDecisionLog();
  return useMemo(() => all.filter((e) => e.candidateId === candidateId), [all, candidateId]);
}

export function useCastContracts(): CastContract[] {
  return useAppDataSlice("castContracts");
}

export function useArtistAvailability(): ArtistAvailability[] {
  return useAppDataSlice("artistAvailability");
}

// ── label / color maps ────────────────────────────────────────────────────────

export const candidateStatusLabels: Record<CastCandidateStatus, string> = {
  "proposed": "Proposed",
  "under-discussion": "Under Discussion",
  "shortlisted": "Shortlisted",
  "negotiation": "Negotiation",
  "on-hold": "On Hold",
  "rejected": "Rejected",
  "selected": "Selected",
};

export const candidateStatusColors: Record<CastCandidateStatus, string> = {
  "proposed": "bg-slate-500/10 text-slate-400",
  "under-discussion": "bg-blue-500/10 text-blue-400",
  "shortlisted": "bg-violet-500/10 text-violet-400",
  "negotiation": "bg-amber-500/10 text-amber-400",
  "on-hold": "bg-orange-500/10 text-orange-400",
  "rejected": "bg-red-500/10 text-red-400",
  "selected": "bg-emerald-500/10 text-emerald-400",
};

export const contractStageLabels: Record<ContractStage, string> = {
  "draft": "Draft",
  "under-review": "Under Review",
  "approved": "Approved",
  "signed": "Signed",
  "completed": "Completed",
};
