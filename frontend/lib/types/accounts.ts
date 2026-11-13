// ═══════════════════════════════════════════════════════════
// Phase A2 — Budgets & Accounts
// ═══════════════════════════════════════════════════════════

export type CurrencyCode = "INR" | "USD" | "EUR" | "GBP";

export type BudgetStatus = "draft" | "approved" | "revised" | "frozen";

export type ApprovalStatus =
  | "draft"
  | "submitted"
  | "dept-approved"
  | "finance-approved"
  | "producer-approved"
  | "rejected"
  | "returned";

export type ApprovalLevel = "department-head" | "finance" | "producer";

export interface ApprovalRecord {
  level: ApprovalLevel;
  approverName: string;
  decision: "approved" | "rejected" | "returned";
  comments: string;
  decisionDate: string;
}

export interface ProjectBudget {
  id: string;
  projectId: string;
  currency: CurrencyCode;
  baseCurrency: CurrencyCode;
  originalApprovedAmount: number;
  approvedAmount: number;
  exchangeRate: number;
  exchangeRateDate: string;
  budgetStatus: BudgetStatus;
  approvalStatus: ApprovalStatus;
  approvalHistory: ApprovalRecord[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentBudget {
  id: string;
  projectBudgetId: string;
  projectId: string;
  departmentKey: string;
  departmentDisplayName: string;
  allocatedBudget: number;
  revisedBudget: number;
  currency: CurrencyCode;
  approvalStatus: ApprovalStatus;
  approvalHistory: ApprovalRecord[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}
