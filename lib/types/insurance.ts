import type { ApprovalRecord } from "./accounts";

// ── A7: Insurance Register ──────────────────────────────────────────────────

export type InsurancePolicyType =
  | "production"
  | "equipment"
  | "vehicle"
  | "location"
  | "liability"
  | "cast-talent"
  | "weather"
  | "errors-omissions";

export type InsurancePolicyStatus = "active" | "expired" | "cancelled" | "pending" | "renewed";

export type InsuranceClaimStatus = "filed" | "under-review" | "approved" | "denied" | "settled" | "withdrawn";

export interface InsuranceClaim {
  id: string;
  claimNumber: string;
  claimDate: string;
  incidentDate: string;
  description: string;
  claimedAmount: number;
  settledAmount: number;
  status: InsuranceClaimStatus;
  adjusterName: string;
  adjusterContact: string;
  resolutionDate: string;
  resolutionNotes: string;
}

export interface InsurancePolicy {
  id: string;
  policyNumber: string;
  policyType: InsurancePolicyType;
  provider: string;
  providerContact: string;
  projectId: string;
  description: string;
  insuredItems: string[];
  coverageAmount: number;
  deductible: number;
  premiumAmount: number;
  premiumFrequency: "annual" | "semi-annual" | "quarterly" | "monthly" | "one-time";
  totalPremiumPaid: number;
  startDate: string;
  endDate: string;
  renewalDate: string;
  status: InsurancePolicyStatus;
  claims: InsuranceClaim[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type RevisionStatus = "draft" | "submitted" | "approved" | "rejected";

export interface BudgetRevision {
  id: string;
  projectBudgetId: string;
  projectId: string;
  revisionNumber: number;
  previousAmount: number;
  revisedAmount: number;
  changeAmount: number;
  changePercentage: number;
  reason: string;
  requestedBy: string;
  status: RevisionStatus;
  approvalHistory: ApprovalRecord[];
  departmentChanges: {
    departmentKey: string;
    previousAmount: number;
    revisedAmount: number;
  }[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}
