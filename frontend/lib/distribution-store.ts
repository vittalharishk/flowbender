"use client";

import { useAppDataSlice, updateAppDataSlice, getAppDataSlice } from "./app-data-store";
import type {
  RightsDeal,
  DeliverableItem,
  DistributionAgreement,
  DistributionRelease,
  DistributionRevenue,
  DistributionSettlement,
  AgreementStatus,
  DistributionChannel,
  ReleaseStatus,
  CollectionStatus,
} from "./types";

// ── Rights Deals ────────────────────────────────────────────────────────────

export function useRightsDeals(projectId?: string): RightsDeal[] {
  const all = useAppDataSlice("rightsDeals");
  if (!projectId || projectId === "all") return all;
  return all.filter((d) => d.projectId === projectId);
}

export function getRightsDealById(id: string): RightsDeal | undefined {
  return getAppDataSlice("rightsDeals").find((d) => d.id === id);
}

function validateRightsDeal(input: Partial<RightsDeal>): string | null {
  if (!input.projectId?.trim()) return "Project is required";
  if (!input.territory?.trim()) return "Territory is required";
  if (!input.distributor?.trim()) return "Distributor is required";
  if (input.minimumGuarantee !== undefined && (!Number.isFinite(input.minimumGuarantee) || input.minimumGuarantee < 0)) {
    return "Minimum guarantee must be non-negative";
  }
  if (input.advanceReceived !== undefined && (!Number.isFinite(input.advanceReceived) || input.advanceReceived < 0)) {
    return "Advance received must be non-negative";
  }
  if (input.minimumGuarantee !== undefined && input.advanceReceived !== undefined && input.advanceReceived > input.minimumGuarantee) {
    return "Advance cannot exceed minimum guarantee";
  }
  return null;
}

export function createRightsDeal(
  input: Omit<RightsDeal, "id">
): { success: true; deal: RightsDeal } | { success: false; error: string } {
  const error = validateRightsDeal(input);
  if (error) return { success: false, error };

  const existing = getAppDataSlice("rightsDeals");
  const duplicate = existing.find(
    (d) => d.projectId === input.projectId && d.territory === input.territory.trim() && d.rightsType === input.rightsType && d.status !== "closed"
  );
  if (duplicate) return { success: false, error: `Active ${input.rightsType} rights for "${input.territory}" already exist in this project` };

  const deal: RightsDeal = {
    id: `rights-${crypto.randomUUID()}`,
    projectId: input.projectId,
    territory: input.territory.trim(),
    distributor: input.distributor.trim(),
    rightsType: input.rightsType,
    status: input.status ?? "open",
    minimumGuarantee: input.minimumGuarantee ?? 0,
    advanceReceived: input.advanceReceived ?? 0,
    deliveryStatus: input.deliveryStatus ?? "pending",
  };

  updateAppDataSlice("rightsDeals", (items) => [...items, deal]);
  return { success: true, deal };
}

export function updateRightsDeal(
  id: string,
  updates: Partial<Omit<RightsDeal, "id">>
): { success: true; deal: RightsDeal } | { success: false; error: string } {
  const existing = getRightsDealById(id);
  if (!existing) return { success: false, error: "Rights deal not found" };

  const merged = { ...existing, ...updates };
  const error = validateRightsDeal(merged);
  if (error) return { success: false, error };

  let updatedDeal: RightsDeal = existing;
  updateAppDataSlice("rightsDeals", (items) =>
    items.map((d) => {
      if (d.id === id) { updatedDeal = { ...d, ...updates }; return updatedDeal; }
      return d;
    })
  );
  return { success: true, deal: updatedDeal };
}

export function deleteRightsDeal(id: string): { success: true } | { success: false; error: string } {
  const existing = getRightsDealById(id);
  if (!existing) return { success: false, error: "Rights deal not found" };
  if (existing.status === "signed") return { success: false, error: "Cannot delete a signed deal" };

  updateAppDataSlice("rightsDeals", (items) => items.filter((d) => d.id !== id));
  return { success: true };
}

// ── Distribution Agreements ─────────────────────────────────────────────────

export const VALID_AGREEMENT_TRANSITIONS: Record<AgreementStatus, AgreementStatus[]> = {
  "draft": ["negotiating", "cancelled"],
  "negotiating": ["pending-approval", "draft", "cancelled"],
  "pending-approval": ["active", "negotiating", "cancelled"],
  "active": ["expired", "terminated"],
  "expired": [],
  "terminated": [],
  "cancelled": [],
};

export function useDistributionAgreements(projectId?: string): DistributionAgreement[] {
  const all = useAppDataSlice("distributionAgreements");
  if (!projectId || projectId === "all") return all;
  return all.filter((a) => a.projectId === projectId);
}

export function getAgreementById(id: string): DistributionAgreement | undefined {
  return getAppDataSlice("distributionAgreements").find((a) => a.id === id);
}

function validateAgreement(input: Partial<DistributionAgreement>): string | null {
  if (!input.projectId?.trim()) return "Project is required";
  if (!input.distributorName?.trim()) return "Distributor name is required";
  if (!input.channel) return "Distribution channel is required";
  if (!input.territories?.length) return "At least one territory is required";
  if (input.agreementValue !== undefined && (!Number.isFinite(input.agreementValue) || input.agreementValue < 0)) {
    return "Agreement value must be non-negative";
  }
  if (input.advancePaid !== undefined && (!Number.isFinite(input.advancePaid) || input.advancePaid < 0)) {
    return "Advance paid must be non-negative";
  }
  if (input.startDate && input.endDate && input.startDate > input.endDate) {
    return "Start date cannot be after end date";
  }
  return null;
}

export function createAgreement(
  input: Omit<DistributionAgreement, "id" | "createdAt" | "updatedAt">
): { success: true; agreement: DistributionAgreement } | { success: false; error: string } {
  const error = validateAgreement(input);
  if (error) return { success: false, error };

  const now = new Date().toISOString();
  const agreement: DistributionAgreement = {
    id: `dagr-${crypto.randomUUID()}`,
    ...input,
    distributorName: input.distributorName.trim(),
    createdAt: now,
    updatedAt: now,
  };

  updateAppDataSlice("distributionAgreements", (items) => [...items, agreement]);
  return { success: true, agreement };
}

export function updateAgreement(
  id: string,
  updates: Partial<Omit<DistributionAgreement, "id" | "createdAt">>
): { success: true; agreement: DistributionAgreement } | { success: false; error: string } {
  const existing = getAgreementById(id);
  if (!existing) return { success: false, error: "Agreement not found" };

  const merged = { ...existing, ...updates };
  const error = validateAgreement(merged);
  if (error) return { success: false, error };

  let updated: DistributionAgreement = existing;
  updateAppDataSlice("distributionAgreements", (items) =>
    items.map((a) => {
      if (a.id === id) { updated = { ...a, ...updates, updatedAt: new Date().toISOString() }; return updated; }
      return a;
    })
  );
  return { success: true, agreement: updated };
}

export function changeAgreementStatus(
  id: string,
  newStatus: AgreementStatus
): { success: true } | { success: false; error: string } {
  const existing = getAgreementById(id);
  if (!existing) return { success: false, error: "Agreement not found" };
  if (existing.status === newStatus) return { success: true };

  const allowed = VALID_AGREEMENT_TRANSITIONS[existing.status];
  if (!allowed.includes(newStatus)) {
    return { success: false, error: `Cannot transition from "${existing.status}" to "${newStatus}"` };
  }

  updateAppDataSlice("distributionAgreements", (items) =>
    items.map((a) => a.id === id ? { ...a, status: newStatus, updatedAt: new Date().toISOString() } : a)
  );
  return { success: true };
}

export function deleteAgreement(id: string): { success: true } | { success: false; error: string } {
  const existing = getAgreementById(id);
  if (!existing) return { success: false, error: "Agreement not found" };
  if (existing.status === "active") return { success: false, error: "Cannot delete an active agreement" };

  updateAppDataSlice("distributionAgreements", (items) => items.filter((a) => a.id !== id));
  return { success: true };
}

// ── Releases ────────────────────────────────────────────────────────────────

export const VALID_RELEASE_TRANSITIONS: Record<ReleaseStatus, ReleaseStatus[]> = {
  "planned": ["confirmed", "postponed", "cancelled"],
  "confirmed": ["released", "postponed", "cancelled"],
  "released": [],
  "postponed": ["planned", "confirmed", "cancelled"],
  "cancelled": [],
};

export function useDistributionReleases(projectId?: string): DistributionRelease[] {
  const all = useAppDataSlice("distributionReleases");
  if (!projectId || projectId === "all") return all;
  return all.filter((r) => r.projectId === projectId);
}

export function getReleaseById(id: string): DistributionRelease | undefined {
  return getAppDataSlice("distributionReleases").find((r) => r.id === id);
}

function validateRelease(input: Partial<DistributionRelease>): string | null {
  if (!input.projectId?.trim()) return "Project is required";
  if (!input.title?.trim()) return "Release title is required";
  if (!input.channel) return "Distribution channel is required";
  if (!input.territory?.trim()) return "Territory is required";
  if (!input.plannedDate) return "Planned date is required";
  if (input.windowStart && input.windowEnd && input.windowStart > input.windowEnd) {
    return "Window start cannot be after window end";
  }
  return null;
}

export function createRelease(
  input: Omit<DistributionRelease, "id" | "createdAt">
): { success: true; release: DistributionRelease } | { success: false; error: string } {
  const error = validateRelease(input);
  if (error) return { success: false, error };

  const release: DistributionRelease = {
    id: `drel-${crypto.randomUUID()}`,
    ...input,
    title: input.title.trim(),
    territory: input.territory.trim(),
    createdAt: new Date().toISOString(),
  };

  updateAppDataSlice("distributionReleases", (items) => [...items, release]);
  return { success: true, release };
}

export function updateRelease(
  id: string,
  updates: Partial<Omit<DistributionRelease, "id" | "createdAt">>
): { success: true; release: DistributionRelease } | { success: false; error: string } {
  const existing = getReleaseById(id);
  if (!existing) return { success: false, error: "Release not found" };

  const merged = { ...existing, ...updates };
  const error = validateRelease(merged);
  if (error) return { success: false, error };

  let updated: DistributionRelease = existing;
  updateAppDataSlice("distributionReleases", (items) =>
    items.map((r) => {
      if (r.id === id) { updated = { ...r, ...updates }; return updated; }
      return r;
    })
  );
  return { success: true, release: updated };
}

export function changeReleaseStatus(
  id: string,
  newStatus: ReleaseStatus,
  actualDate?: string
): { success: true } | { success: false; error: string } {
  const existing = getReleaseById(id);
  if (!existing) return { success: false, error: "Release not found" };
  if (existing.status === newStatus) return { success: true };

  const allowed = VALID_RELEASE_TRANSITIONS[existing.status];
  if (!allowed.includes(newStatus)) {
    return { success: false, error: `Cannot transition from "${existing.status}" to "${newStatus}"` };
  }

  updateAppDataSlice("distributionReleases", (items) =>
    items.map((r) => r.id === id ? {
      ...r,
      status: newStatus,
      actualDate: newStatus === "released" ? (actualDate || new Date().toISOString().slice(0, 10)) : r.actualDate,
    } : r)
  );
  return { success: true };
}

// ── Revenue & Collections ───────────────────────────────────────────────────

export function useDistributionRevenue(projectId?: string): DistributionRevenue[] {
  const all = useAppDataSlice("distributionRevenue");
  if (!projectId || projectId === "all") return all;
  return all.filter((r) => r.projectId === projectId);
}

export function getRevenueById(id: string): DistributionRevenue | undefined {
  return getAppDataSlice("distributionRevenue").find((r) => r.id === id);
}

function validateRevenue(input: Partial<DistributionRevenue>): string | null {
  if (!input.projectId?.trim()) return "Project is required";
  if (!input.revenueType) return "Revenue type is required";
  if (input.amount !== undefined && (!Number.isFinite(input.amount) || input.amount < 0)) {
    return "Amount must be non-negative";
  }
  return null;
}

export function createRevenue(
  input: Omit<DistributionRevenue, "id" | "createdAt">
): { success: true; revenue: DistributionRevenue } | { success: false; error: string } {
  const error = validateRevenue(input);
  if (error) return { success: false, error };

  const revenue: DistributionRevenue = {
    id: `drev-${crypto.randomUUID()}`,
    ...input,
    createdAt: new Date().toISOString(),
  };

  updateAppDataSlice("distributionRevenue", (items) => [...items, revenue]);
  return { success: true, revenue };
}

export function updateRevenue(
  id: string,
  updates: Partial<Omit<DistributionRevenue, "id" | "createdAt">>
): { success: true; revenue: DistributionRevenue } | { success: false; error: string } {
  const existing = getRevenueById(id);
  if (!existing) return { success: false, error: "Revenue record not found" };

  const merged = { ...existing, ...updates };
  const error = validateRevenue(merged);
  if (error) return { success: false, error };

  let updated: DistributionRevenue = existing;
  updateAppDataSlice("distributionRevenue", (items) =>
    items.map((r) => {
      if (r.id === id) { updated = { ...r, ...updates }; return updated; }
      return r;
    })
  );
  return { success: true, revenue: updated };
}

export function updateCollectionStatus(
  id: string,
  newStatus: CollectionStatus
): { success: true } | { success: false; error: string } {
  const existing = getRevenueById(id);
  if (!existing) return { success: false, error: "Revenue record not found" };

  updateAppDataSlice("distributionRevenue", (items) =>
    items.map((r) => r.id === id ? { ...r, status: newStatus } : r)
  );
  return { success: true };
}

// ── Settlements ─────────────────────────────────────────────────────────────

export function useDistributionSettlements(projectId?: string): DistributionSettlement[] {
  const all = useAppDataSlice("distributionSettlements");
  if (!projectId || projectId === "all") return all;
  return all.filter((s) => s.projectId === projectId);
}

export function getSettlementById(id: string): DistributionSettlement | undefined {
  return getAppDataSlice("distributionSettlements").find((s) => s.id === id);
}

function validateSettlement(input: Partial<DistributionSettlement>): string | null {
  if (!input.projectId?.trim()) return "Project is required";
  if (!input.agreementId?.trim()) return "Agreement is required";
  if (input.grossRevenue !== undefined && (!Number.isFinite(input.grossRevenue) || input.grossRevenue < 0)) {
    return "Gross revenue must be non-negative";
  }
  if (input.distributorCommission !== undefined && (!Number.isFinite(input.distributorCommission) || input.distributorCommission < 0)) {
    return "Commission must be non-negative";
  }
  if (input.deductions !== undefined && (!Number.isFinite(input.deductions) || input.deductions < 0)) {
    return "Deductions must be non-negative";
  }
  if (input.settledAmount !== undefined && (!Number.isFinite(input.settledAmount) || input.settledAmount < 0)) {
    return "Settled amount must be non-negative";
  }
  return null;
}

export function createSettlement(
  input: Omit<DistributionSettlement, "id" | "createdAt">
): { success: true; settlement: DistributionSettlement } | { success: false; error: string } {
  const error = validateSettlement(input);
  if (error) return { success: false, error };

  const settlement: DistributionSettlement = {
    id: `dset-${crypto.randomUUID()}`,
    ...input,
    netPayable: input.grossRevenue - input.distributorCommission - input.deductions,
    createdAt: new Date().toISOString(),
  };

  updateAppDataSlice("distributionSettlements", (items) => [...items, settlement]);
  return { success: true, settlement };
}

export function updateSettlement(
  id: string,
  updates: Partial<Omit<DistributionSettlement, "id" | "createdAt">>
): { success: true; settlement: DistributionSettlement } | { success: false; error: string } {
  const existing = getSettlementById(id);
  if (!existing) return { success: false, error: "Settlement not found" };

  const merged = { ...existing, ...updates };
  const error = validateSettlement(merged);
  if (error) return { success: false, error };

  let updated: DistributionSettlement = existing;
  updateAppDataSlice("distributionSettlements", (items) =>
    items.map((s) => {
      if (s.id === id) {
        const u = { ...s, ...updates };
        if (updates.grossRevenue !== undefined || updates.distributorCommission !== undefined || updates.deductions !== undefined) {
          u.netPayable = u.grossRevenue - u.distributorCommission - u.deductions;
        }
        updated = u;
        return updated;
      }
      return s;
    })
  );
  return { success: true, settlement: updated };
}

// ── Deliverables ────────────────────────────────────────────────────────────

export function useDeliverables(projectId?: string): DeliverableItem[] {
  const all = useAppDataSlice("deliverables");
  if (!projectId || projectId === "all") return all;
  return all.filter((d) => d.projectId === projectId);
}

export function getDeliverableById(id: string): DeliverableItem | undefined {
  return getAppDataSlice("deliverables").find((d) => d.id === id);
}

export function updateDeliverableStatus(
  id: string,
  status: DeliverableItem["status"]
): { success: true } | { success: false; error: string } {
  const existing = getDeliverableById(id);
  if (!existing) return { success: false, error: "Deliverable not found" };

  updateAppDataSlice("deliverables", (items) =>
    items.map((d) => d.id === id ? { ...d, status } : d)
  );
  return { success: true };
}

// ── Analytics Helpers ───────────────────────────────────────────────────────

export interface DistributionStats {
  totalDeals: number;
  signedDeals: number;
  openDeals: number;
  totalMG: number;
  totalAdvance: number;
  totalReceivable: number;
  byTerritory: Record<string, { count: number; mg: number; advance: number }>;
  byChannel: Record<string, { count: number; mg: number }>;
  expiringAgreements: DistributionAgreement[];
  overdueCollections: DistributionRevenue[];
}

export function calcDistributionStats(
  deals: RightsDeal[],
  agreements: DistributionAgreement[],
  revenue: DistributionRevenue[],
): DistributionStats {
  const totalDeals = deals.length;
  const signedDeals = deals.filter((d) => d.status === "signed").length;
  const openDeals = deals.filter((d) => d.status === "open" || d.status === "negotiating").length;
  const totalMG = deals.reduce((s, d) => s + (d.minimumGuarantee || 0), 0);
  const totalAdvance = deals.reduce((s, d) => s + (d.advanceReceived || 0), 0);
  const totalReceivable = totalMG - totalAdvance;

  const byTerritory: Record<string, { count: number; mg: number; advance: number }> = {};
  for (const deal of deals) {
    const t = deal.territory || "Unknown";
    if (!byTerritory[t]) byTerritory[t] = { count: 0, mg: 0, advance: 0 };
    byTerritory[t].count++;
    byTerritory[t].mg += deal.minimumGuarantee || 0;
    byTerritory[t].advance += deal.advanceReceived || 0;
  }

  const byChannel: Record<string, { count: number; mg: number }> = {};
  for (const deal of deals) {
    const c = deal.rightsType || "other";
    if (!byChannel[c]) byChannel[c] = { count: 0, mg: 0 };
    byChannel[c].count++;
    byChannel[c].mg += deal.minimumGuarantee || 0;
  }

  const today = new Date().toISOString().slice(0, 10);
  const thirtyDays = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const expiringAgreements = agreements.filter((a) => a.status === "active" && a.endDate >= today && a.endDate <= thirtyDays);
  const overdueCollections = revenue.filter((r) => r.status === "pending" && r.dueDate && r.dueDate < today);

  return { totalDeals, signedDeals, openDeals, totalMG, totalAdvance, totalReceivable, byTerritory, byChannel, expiringAgreements, overdueCollections };
}
