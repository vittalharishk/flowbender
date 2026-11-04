import { useMemo } from "react";
import { useAppDataSlice, updateAppDataSlice, getAppDataSlice } from "./app-data-store";
import type { InsurancePolicy, InsuranceClaim, InsurancePolicyType, InsurancePolicyStatus, InsuranceClaimStatus } from "./types";

// ── Constants ────────────────────────────────────────────────────────────────

export const POLICY_TYPE_LABELS: Record<InsurancePolicyType, string> = {
  "production": "Production",
  "equipment": "Equipment",
  "vehicle": "Vehicle",
  "location": "Location",
  "liability": "Liability",
  "cast-talent": "Cast & Talent",
  "weather": "Weather",
  "errors-omissions": "Errors & Omissions",
};

export const POLICY_STATUS_LABELS: Record<InsurancePolicyStatus, string> = {
  "active": "Active",
  "expired": "Expired",
  "cancelled": "Cancelled",
  "pending": "Pending",
  "renewed": "Renewed",
};

export const CLAIM_STATUS_LABELS: Record<InsuranceClaimStatus, string> = {
  "filed": "Filed",
  "under-review": "Under Review",
  "approved": "Approved",
  "denied": "Denied",
  "settled": "Settled",
  "withdrawn": "Withdrawn",
};

const VALID_POLICY_TYPES = new Set<string>(Object.keys(POLICY_TYPE_LABELS));
const VALID_POLICY_STATUSES = new Set<string>(Object.keys(POLICY_STATUS_LABELS));
const VALID_CLAIM_STATUSES = new Set<string>(Object.keys(CLAIM_STATUS_LABELS));

const VALID_CLAIM_TRANSITIONS: Record<InsuranceClaimStatus, InsuranceClaimStatus[]> = {
  "filed": ["under-review", "withdrawn"],
  "under-review": ["approved", "denied", "withdrawn"],
  "approved": ["settled", "withdrawn"],
  "denied": [],
  "settled": [],
  "withdrawn": [],
};

const VALID_PREMIUM_FREQUENCIES = new Set(["annual", "semi-annual", "quarterly", "monthly", "one-time"]);

// ── Helpers ──────────────────────────────────────────────────────────────────

function isValidDateString(s: string): boolean {
  if (!s || typeof s !== "string") return false;
  const d = new Date(s);
  return !isNaN(d.getTime());
}

function toDateOnly(s: string): string {
  return s.split("T")[0];
}

// ── Hooks ────────────────────────────────────────────────────────────────────

export function useInsurancePolicies(projectId?: string) {
  const policies = useAppDataSlice("insurancePolicies");
  return useMemo(() => {
    if (!projectId) return policies;
    return policies.filter((p) => p.projectId === projectId);
  }, [policies, projectId]);
}

export interface InsuranceDashboard {
  totalPolicies: number;
  activePolicies: number;
  expiredPolicies: number;
  pendingPolicies: number;
  cancelledPolicies: number;
  renewedPolicies: number;
  totalCoverage: number;
  totalPremiumsPaid: number;
  totalPremiumsDue: number;
  totalClaimed: number;
  totalSettled: number;
  openClaims: number;
  expiringWithin7Days: InsurancePolicy[];
  expiringWithin30Days: InsurancePolicy[];
  expiringWithin60Days: InsurancePolicy[];
  byType: Record<string, { count: number; coverage: number; premiumPaid: number }>;
  byProject: Record<string, { count: number; coverage: number; premiumPaid: number; claims: number }>;
}

export function useInsuranceDashboard(projectId?: string): InsuranceDashboard {
  const policies = useInsurancePolicies(projectId);
  const projects = useAppDataSlice("projects");

  return useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d7 = new Date(today.getTime() + 7 * 86400000);
    const d30 = new Date(today.getTime() + 30 * 86400000);
    const d60 = new Date(today.getTime() + 60 * 86400000);

    let totalCoverage = 0;
    let totalPremiumsPaid = 0;
    let totalPremiumsDue = 0;
    let totalClaimed = 0;
    let totalSettled = 0;
    let openClaims = 0;
    let activePolicies = 0;
    let expiredPolicies = 0;
    let pendingPolicies = 0;
    let cancelledPolicies = 0;
    let renewedPolicies = 0;
    const expiringWithin7Days: InsurancePolicy[] = [];
    const expiringWithin30Days: InsurancePolicy[] = [];
    const expiringWithin60Days: InsurancePolicy[] = [];
    const byType: Record<string, { count: number; coverage: number; premiumPaid: number }> = {};
    const byProject: Record<string, { count: number; coverage: number; premiumPaid: number; claims: number }> = {};

    for (const p of policies) {
      if (p.status === "active") activePolicies++;
      else if (p.status === "expired") expiredPolicies++;
      else if (p.status === "pending") pendingPolicies++;
      else if (p.status === "cancelled") cancelledPolicies++;
      else if (p.status === "renewed") renewedPolicies++;

      totalCoverage += p.coverageAmount;
      totalPremiumsPaid += p.totalPremiumPaid;
      const due = p.premiumAmount - p.totalPremiumPaid;
      if (due > 0) totalPremiumsDue += due;

      for (const c of p.claims) {
        totalClaimed += c.claimedAmount;
        totalSettled += c.settledAmount;
        if (["filed", "under-review", "approved"].includes(c.status)) openClaims++;
      }

      if (p.status === "active" && p.endDate && isValidDateString(p.endDate)) {
        const end = new Date(p.endDate);
        end.setHours(0, 0, 0, 0);
        if (end >= today) {
          if (end <= d7) expiringWithin7Days.push(p);
          if (end <= d30) expiringWithin30Days.push(p);
          if (end <= d60) expiringWithin60Days.push(p);
        }
      }

      if (!byType[p.policyType]) byType[p.policyType] = { count: 0, coverage: 0, premiumPaid: 0 };
      byType[p.policyType].count++;
      byType[p.policyType].coverage += p.coverageAmount;
      byType[p.policyType].premiumPaid += p.totalPremiumPaid;

      if (!byProject[p.projectId]) byProject[p.projectId] = { count: 0, coverage: 0, premiumPaid: 0, claims: 0 };
      byProject[p.projectId].count++;
      byProject[p.projectId].coverage += p.coverageAmount;
      byProject[p.projectId].premiumPaid += p.totalPremiumPaid;
      byProject[p.projectId].claims += p.claims.length;
    }

    return {
      totalPolicies: policies.length,
      activePolicies,
      expiredPolicies,
      pendingPolicies,
      cancelledPolicies,
      renewedPolicies,
      totalCoverage,
      totalPremiumsPaid,
      totalPremiumsDue,
      totalClaimed,
      totalSettled,
      openClaims,
      expiringWithin7Days,
      expiringWithin30Days,
      expiringWithin60Days,
      byType,
      byProject,
    };
  }, [policies, projects]);
}

// ── Validation ───────────────────────────────────────────────────────────────

export function validatePolicyInputs(policy: InsurancePolicy, existing: InsurancePolicy[]): string | null {
  if (!policy.id || typeof policy.id !== "string") return "Policy ID is required";
  if (existing.some((p) => p.id === policy.id)) return "Duplicate policy ID";

  if (!policy.policyNumber || typeof policy.policyNumber !== "string" || !policy.policyNumber.trim())
    return "Policy number is required";

  if (existing.some((p) => p.policyNumber === policy.policyNumber && p.provider === policy.provider))
    return "Duplicate policy number for this provider";

  if (!policy.provider || typeof policy.provider !== "string" || !policy.provider.trim())
    return "Insurance provider is required";

  if (!policy.projectId || typeof policy.projectId !== "string")
    return "Project reference is required";

  const projects = getAppDataSlice("projects");
  if (!projects.some((pr) => pr.id === policy.projectId))
    return "Invalid project reference";

  if (!VALID_POLICY_TYPES.has(policy.policyType))
    return "Invalid policy type";

  if (!VALID_POLICY_STATUSES.has(policy.status))
    return "Invalid policy status";

  if (!VALID_PREMIUM_FREQUENCIES.has(policy.premiumFrequency))
    return "Invalid premium frequency";

  if (!Number.isFinite(policy.coverageAmount) || policy.coverageAmount < 0)
    return "Coverage amount must be finite and non-negative";

  if (!Number.isFinite(policy.premiumAmount) || policy.premiumAmount < 0)
    return "Premium amount must be finite and non-negative";

  if (!Number.isFinite(policy.deductible) || policy.deductible < 0)
    return "Deductible must be finite and non-negative";

  if (!Number.isFinite(policy.totalPremiumPaid) || policy.totalPremiumPaid < 0)
    return "Total premium paid must be finite and non-negative";

  if (policy.startDate && !isValidDateString(policy.startDate))
    return "Invalid start date";

  if (policy.endDate && !isValidDateString(policy.endDate))
    return "Invalid end date";

  if (policy.startDate && policy.endDate && isValidDateString(policy.startDate) && isValidDateString(policy.endDate)) {
    if (new Date(policy.endDate) < new Date(policy.startDate))
      return "End date must not precede start date";
  }

  if (policy.renewalDate && policy.renewalDate.trim() && !isValidDateString(policy.renewalDate))
    return "Invalid renewal date";

  return null;
}

export function validateClaimInputs(claim: InsuranceClaim, existingClaims: InsuranceClaim[]): string | null {
  if (!claim.id || typeof claim.id !== "string") return "Claim ID is required";
  if (existingClaims.some((c) => c.id === claim.id)) return "Duplicate claim ID";

  if (!claim.claimNumber || typeof claim.claimNumber !== "string" || !claim.claimNumber.trim())
    return "Claim number is required";

  if (!claim.description || typeof claim.description !== "string" || !claim.description.trim())
    return "Claim description is required";

  if (!Number.isFinite(claim.claimedAmount) || claim.claimedAmount < 0)
    return "Claimed amount must be finite and non-negative";

  if (!Number.isFinite(claim.settledAmount) || claim.settledAmount < 0)
    return "Settled amount must be finite and non-negative";

  if (claim.settledAmount > claim.claimedAmount)
    return "Settled amount must not exceed claimed amount";

  if (!VALID_CLAIM_STATUSES.has(claim.status))
    return "Invalid claim status";

  if (claim.claimDate && !isValidDateString(claim.claimDate))
    return "Invalid claim date";

  if (claim.incidentDate && !isValidDateString(claim.incidentDate))
    return "Invalid incident date";

  return null;
}

// ── CRUD Operations ──────────────────────────────────────────────────────────

export function createInsurancePolicy(policy: InsurancePolicy): string | null {
  const existing = getAppDataSlice("insurancePolicies");
  const error = validatePolicyInputs(policy, existing);
  if (error) return error;

  updateAppDataSlice("insurancePolicies", (prev) => [...prev, policy]);
  return null;
}

export function updateInsurancePolicy(id: string, updates: Partial<InsurancePolicy>): string | null {
  const existing = getAppDataSlice("insurancePolicies");
  const idx = existing.findIndex((p) => p.id === id);
  if (idx === -1) return "Policy not found";

  if (updates.policyNumber !== undefined) {
    if (!updates.policyNumber || !updates.policyNumber.trim()) return "Policy number is required";
    const provider = updates.provider || existing[idx].provider;
    if (existing.some((p) => p.id !== id && p.policyNumber === updates.policyNumber && p.provider === provider))
      return "Duplicate policy number for this provider";
  }

  if (updates.provider !== undefined && (!updates.provider || !updates.provider.trim()))
    return "Insurance provider is required";

  if (updates.projectId !== undefined) {
    const projects = getAppDataSlice("projects");
    if (!projects.some((pr) => pr.id === updates.projectId)) return "Invalid project reference";
  }

  if (updates.policyType !== undefined && !VALID_POLICY_TYPES.has(updates.policyType))
    return "Invalid policy type";

  if (updates.status !== undefined && !VALID_POLICY_STATUSES.has(updates.status))
    return "Invalid policy status";

  if (updates.premiumFrequency !== undefined && !VALID_PREMIUM_FREQUENCIES.has(updates.premiumFrequency))
    return "Invalid premium frequency";

  if (updates.coverageAmount !== undefined && (!Number.isFinite(updates.coverageAmount) || updates.coverageAmount < 0))
    return "Coverage amount must be finite and non-negative";

  if (updates.premiumAmount !== undefined && (!Number.isFinite(updates.premiumAmount) || updates.premiumAmount < 0))
    return "Premium amount must be finite and non-negative";

  if (updates.deductible !== undefined && (!Number.isFinite(updates.deductible) || updates.deductible < 0))
    return "Deductible must be finite and non-negative";

  if (updates.totalPremiumPaid !== undefined && (!Number.isFinite(updates.totalPremiumPaid) || updates.totalPremiumPaid < 0))
    return "Total premium paid must be finite and non-negative";

  const mergedStart = updates.startDate || existing[idx].startDate;
  const mergedEnd = updates.endDate || existing[idx].endDate;
  if (mergedStart && mergedEnd && isValidDateString(mergedStart) && isValidDateString(mergedEnd)) {
    if (new Date(mergedEnd) < new Date(mergedStart))
      return "End date must not precede start date";
  }

  if (updates.startDate !== undefined && updates.startDate && !isValidDateString(updates.startDate))
    return "Invalid start date";

  if (updates.endDate !== undefined && updates.endDate && !isValidDateString(updates.endDate))
    return "Invalid end date";

  updateAppDataSlice("insurancePolicies", (prev) =>
    prev.map((p) => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p)
  );
  return null;
}

export function fileClaim(policyId: string, claim: InsuranceClaim): string | null {
  const existing = getAppDataSlice("insurancePolicies");
  const policy = existing.find((p) => p.id === policyId);
  if (!policy) return "Policy not found";

  if (policy.status !== "active") return "Claims can only be filed on active policies";

  const allClaims = existing.flatMap((p) => p.claims);
  const error = validateClaimInputs(claim, allClaims);
  if (error) return error;

  if (claim.status !== "filed") return "New claims must have status 'filed'";

  updateAppDataSlice("insurancePolicies", (prev) =>
    prev.map((p) => p.id === policyId
      ? { ...p, claims: [...p.claims, claim], updatedAt: new Date().toISOString() }
      : p
    )
  );
  return null;
}

export function updateClaim(policyId: string, claimId: string, updates: Partial<InsuranceClaim>): string | null {
  const existing = getAppDataSlice("insurancePolicies");
  const policy = existing.find((p) => p.id === policyId);
  if (!policy) return "Policy not found";

  const claim = policy.claims.find((c) => c.id === claimId);
  if (!claim) return "Claim not found";

  if (updates.status !== undefined) {
    if (!VALID_CLAIM_STATUSES.has(updates.status)) return "Invalid claim status";
    const allowed = VALID_CLAIM_TRANSITIONS[claim.status];
    if (!allowed.includes(updates.status as InsuranceClaimStatus))
      return `Cannot transition from '${claim.status}' to '${updates.status}'`;
  }

  if (updates.claimedAmount !== undefined) {
    if (!Number.isFinite(updates.claimedAmount) || updates.claimedAmount < 0)
      return "Claimed amount must be finite and non-negative";
  }

  if (updates.settledAmount !== undefined) {
    if (!Number.isFinite(updates.settledAmount) || updates.settledAmount < 0)
      return "Settled amount must be finite and non-negative";
    const effectiveClaimed = updates.claimedAmount ?? claim.claimedAmount;
    if (updates.settledAmount > effectiveClaimed)
      return "Settled amount must not exceed claimed amount";
  }

  const effectiveStatus = updates.status ?? claim.status;
  if (effectiveStatus === "settled") {
    const effectiveSettled = updates.settledAmount ?? claim.settledAmount;
    if (effectiveSettled <= 0) return "Settled claims must have a positive settlement amount";
    const effectiveResDate = updates.resolutionDate ?? claim.resolutionDate;
    if (!effectiveResDate || !effectiveResDate.trim()) return "Settled claims must have a resolution date";
  }

  updateAppDataSlice("insurancePolicies", (prev) =>
    prev.map((p) => p.id === policyId
      ? {
          ...p,
          claims: p.claims.map((c) => c.id === claimId ? { ...c, ...updates } : c),
          updatedAt: new Date().toISOString(),
        }
      : p
    )
  );
  return null;
}
