"use client";

import { useMemo } from "react";
import { useAppDataSlice, updateAppDataSlice, getAppDataSlice } from "./app-data-store";
import { normalizeDepartment, getDepartmentDisplay, ACCOUNTS_DEPARTMENTS } from "./accounts-departments";
import type {
  ProjectBudget,
  DepartmentBudget,
  BudgetRevision,
  ApprovalLevel,
  ApprovalRecord,
  ApprovalStatus,
  CurrencyCode,
  Project,
  CastContract,
  CastMember,
  PaymentMilestone,
} from "./types";

// ─── CRUD Hooks ──────────────────────────────────────────────────────────────

export function useProjectBudgets(projectId?: string): ProjectBudget[] {
  const all = useAppDataSlice("projectBudgets");
  return useMemo(
    () => (projectId ? all.filter((b) => b.projectId === projectId) : all),
    [all, projectId],
  );
}

export function useDepartmentBudgets(projectId?: string): DepartmentBudget[] {
  const all = useAppDataSlice("departmentBudgets");
  return useMemo(
    () => (projectId ? all.filter((b) => b.projectId === projectId) : all),
    [all, projectId],
  );
}

export function addProjectBudget(budget: ProjectBudget) {
  updateAppDataSlice("projectBudgets", (prev) => [...prev, budget]);
}

export function addDepartmentBudget(budget: DepartmentBudget) {
  updateAppDataSlice("departmentBudgets", (prev) => [...prev, budget]);
}

export function useBudgetRevisions(projectId?: string): BudgetRevision[] {
  const all = useAppDataSlice("budgetRevisions");
  return useMemo(
    () => (projectId ? all.filter((r) => r.projectId === projectId) : all),
    [all, projectId],
  );
}

// ─── Budget CRUD ────────────────────────────────────────────────────────────

export function updateDraftBudget(budgetId: string, updates: Partial<Pick<ProjectBudget, "approvedAmount" | "notes" | "currency">>) {
  const now = new Date().toISOString();
  updateAppDataSlice("projectBudgets", (prev) =>
    prev.map((b) => b.id === budgetId && b.budgetStatus === "draft"
      ? { ...b, ...updates, updatedAt: now }
      : b
    ),
  );
}

export function updateDepartmentAllocation(deptBudgetId: string, updates: Partial<Pick<DepartmentBudget, "allocatedBudget" | "revisedBudget" | "notes">>) {
  const now = new Date().toISOString();
  updateAppDataSlice("departmentBudgets", (prev) =>
    prev.map((b) => b.id === deptBudgetId && b.approvalStatus === "draft"
      ? { ...b, ...updates, updatedAt: now }
      : b
    ),
  );
}

// ─── Approval Workflow ──────────────────────────────────────────────────────

const APPROVAL_FLOW: ApprovalStatus[] = ["draft", "submitted", "dept-approved", "finance-approved", "producer-approved"];

function nextApprovalStatus(current: ApprovalStatus): ApprovalStatus {
  const idx = APPROVAL_FLOW.indexOf(current);
  return idx >= 0 && idx < APPROVAL_FLOW.length - 1 ? APPROVAL_FLOW[idx + 1] : current;
}

function levelForStatus(status: ApprovalStatus): ApprovalLevel {
  if (status === "submitted") return "department-head";
  if (status === "dept-approved") return "finance";
  return "producer";
}

export function submitBudgetForApproval(budgetId: string) {
  const now = new Date().toISOString();
  updateAppDataSlice("projectBudgets", (prev) =>
    prev.map((b) => b.id === budgetId && b.approvalStatus === "draft"
      ? { ...b, approvalStatus: "submitted" as ApprovalStatus, updatedAt: now }
      : b
    ),
  );
}

const APPROVABLE_STATUSES: ApprovalStatus[] = ["submitted", "dept-approved", "finance-approved"];

export function approveBudget(budgetId: string, approverName: string, comments: string) {
  const now = new Date().toISOString();
  updateAppDataSlice("projectBudgets", (prev) =>
    prev.map((b) => {
      if (b.id !== budgetId || !APPROVABLE_STATUSES.includes(b.approvalStatus)) return b;
      const level = levelForStatus(b.approvalStatus);
      const record: ApprovalRecord = { level, approverName, decision: "approved", comments, decisionDate: now };
      const nextStatus = nextApprovalStatus(b.approvalStatus);
      const budgetStatus = nextStatus === "producer-approved" ? "approved" as const : b.budgetStatus;
      return { ...b, approvalStatus: nextStatus, budgetStatus, approvalHistory: [...b.approvalHistory, record], updatedAt: now };
    }),
  );
}

export function rejectBudget(budgetId: string, approverName: string, comments: string) {
  if (!comments.trim()) return;
  const now = new Date().toISOString();
  updateAppDataSlice("projectBudgets", (prev) =>
    prev.map((b) => {
      if (b.id !== budgetId || !APPROVABLE_STATUSES.includes(b.approvalStatus)) return b;
      const level = levelForStatus(b.approvalStatus);
      const record: ApprovalRecord = { level, approverName, decision: "rejected", comments, decisionDate: now };
      return { ...b, approvalStatus: "rejected" as ApprovalStatus, approvalHistory: [...b.approvalHistory, record], updatedAt: now };
    }),
  );
}

export function returnBudget(budgetId: string, approverName: string, comments: string) {
  if (!comments.trim()) return;
  const now = new Date().toISOString();
  updateAppDataSlice("projectBudgets", (prev) =>
    prev.map((b) => {
      if (b.id !== budgetId || !APPROVABLE_STATUSES.includes(b.approvalStatus)) return b;
      const level = levelForStatus(b.approvalStatus);
      const record: ApprovalRecord = { level, approverName, decision: "returned", comments, decisionDate: now };
      return { ...b, approvalStatus: "returned" as ApprovalStatus, approvalHistory: [...b.approvalHistory, record], updatedAt: now };
    }),
  );
}

export function resubmitReturnedBudget(budgetId: string) {
  const now = new Date().toISOString();
  updateAppDataSlice("projectBudgets", (prev) =>
    prev.map((b) => {
      if (b.id !== budgetId || b.approvalStatus !== "returned") return b;
      return { ...b, approvalStatus: "draft" as ApprovalStatus, budgetStatus: "draft" as const, updatedAt: now };
    }),
  );
}

// ─── Budget Revisions ───────────────────────────────────────────────────────

export function createBudgetRevision(revision: BudgetRevision): boolean {
  const projectBudgets = getAppDataSlice("projectBudgets");
  const existingRevisions = getAppDataSlice("budgetRevisions");

  const pb = projectBudgets.find((b: ProjectBudget) => b.id === revision.projectBudgetId);
  if (!pb) return false;
  if (pb.projectId !== revision.projectId) return false;
  if (existingRevisions.some((r) => r.id === revision.id)) return false;
  if (typeof revision.revisionNumber !== "number" || revision.revisionNumber < 1 || !Number.isInteger(revision.revisionNumber)) return false;
  if (existingRevisions.some((r) => r.projectBudgetId === revision.projectBudgetId && r.revisionNumber === revision.revisionNumber)) return false;
  const validStatuses: string[] = ["draft", "submitted"];
  if (!validStatuses.includes(revision.status)) return false;
  if (typeof revision.revisedAmount !== "number" || !Number.isFinite(revision.revisedAmount) || revision.revisedAmount <= 0) return false;
  if (typeof revision.previousAmount !== "number" || !Number.isFinite(revision.previousAmount) || revision.previousAmount < 0) return false;
  if (typeof revision.changeAmount !== "number" || !Number.isFinite(revision.changeAmount)) return false;
  const expectedChange = revision.revisedAmount - revision.previousAmount;
  if (Math.abs(revision.changeAmount - expectedChange) > 1) return false;
  if (!revision.reason || !revision.reason.trim()) return false;
  if (!revision.requestedBy || !revision.requestedBy.trim()) return false;

  updateAppDataSlice("budgetRevisions", (prev) => [...prev, revision]);
  return true;
}

export function approveBudgetRevision(revisionId: string, approverName: string, comments: string) {
  const now = new Date().toISOString();
  let revData: BudgetRevision | undefined;

  updateAppDataSlice("budgetRevisions", (prev) =>
    prev.map((r) => {
      if (r.id !== revisionId || r.status !== "submitted") return r;
      const record: ApprovalRecord = { level: "producer", approverName, decision: "approved", comments, decisionDate: now };
      revData = { ...r, status: "approved", approvalHistory: [...r.approvalHistory, record], updatedAt: now };
      return revData;
    }),
  );

  if (revData) {
    const rev = revData;
    updateAppDataSlice("projectBudgets", (prev) =>
      prev.map((b) => b.id === rev.projectBudgetId
        ? { ...b, approvedAmount: rev.revisedAmount, budgetStatus: "revised" as const, updatedAt: now }
        : b
      ),
    );
    rev.departmentChanges.forEach((dc) => {
      updateAppDataSlice("departmentBudgets", (prev) =>
        prev.map((db) =>
          db.projectId === rev.projectId && db.departmentKey === dc.departmentKey
            ? { ...db, revisedBudget: dc.revisedAmount, updatedAt: now }
            : db
        ),
      );
    });
  }
}

// ─── Budget Alerts ──────────────────────────────────────────────────────────

export interface BudgetAlert {
  id: string;
  type: "warning" | "critical" | "info";
  projectId: string;
  projectName: string;
  message: string;
  metric: string;
  value: number;
  threshold: number;
}

export function useBudgetAlerts(projectId?: string): BudgetAlert[] {
  const dashboard = useAccountsDashboard(projectId);
  const projectBudgets = useAppDataSlice("projectBudgets");
  const departmentBudgets = useAppDataSlice("departmentBudgets");
  const projects = useAppDataSlice("projects");

  return useMemo(() => {
    const alerts: BudgetAlert[] = [];

    dashboard.byProject.forEach((pf) => {
      const pb = projectBudgets.find((b) => b.projectId === pf.projectId);
      if (!pb || pb.approvedAmount <= 0) return;

      if (pf.utilization >= 100) {
        alerts.push({
          id: `alert-over-${pf.projectId}`,
          type: "critical",
          projectId: pf.projectId,
          projectName: pf.projectName,
          message: `${pf.projectName} has exceeded its approved budget`,
          metric: "utilization",
          value: pf.utilization,
          threshold: 100,
        });
      } else if (pf.utilization >= 80) {
        alerts.push({
          id: `alert-warn-${pf.projectId}`,
          type: "warning",
          projectId: pf.projectId,
          projectName: pf.projectName,
          message: `${pf.projectName} is at ${pf.utilization.toFixed(1)}% of its budget`,
          metric: "utilization",
          value: pf.utilization,
          threshold: 80,
        });
      }
    });

    const deptByProject = new Map<string, DepartmentBudget[]>();
    const filteredDB = projectId ? departmentBudgets.filter((b) => b.projectId === projectId) : departmentBudgets;
    filteredDB.forEach((db) => {
      const list = deptByProject.get(db.projectId) || [];
      list.push(db);
      deptByProject.set(db.projectId, list);
    });

    deptByProject.forEach((dbs, pid) => {
      const unapproved = dbs.filter((db) => db.approvalStatus === "draft");
      if (unapproved.length > 0) {
        const proj = projects.find((p) => p.id === pid);
        alerts.push({
          id: `alert-unapproved-${pid}`,
          type: "info",
          projectId: pid,
          projectName: proj?.title ?? pid,
          message: `${unapproved.length} department allocation(s) still in draft`,
          metric: "unapproved-allocations",
          value: unapproved.length,
          threshold: 0,
        });
      }

      const approvedDeptTotal = dbs
        .filter((db) => db.approvalStatus !== "draft")
        .reduce((s, db) => s + db.allocatedBudget, 0);
      const pb2 = projectBudgets.find((b) => b.projectId === pid);
      if (pb2 && approvedDeptTotal > pb2.approvedAmount) {
        const proj = projects.find((p) => p.id === pid);
        alerts.push({
          id: `alert-dept-over-${pid}`,
          type: "critical",
          projectId: pid,
          projectName: proj?.title ?? pid,
          message: `Approved department allocations exceed project budget by ${((approvedDeptTotal - pb2.approvedAmount) / 10000000).toFixed(1)} Cr`,
          metric: "dept-over-budget",
          value: approvedDeptTotal,
          threshold: pb2.approvedAmount,
        });
      }
    });

    dashboard.byProject.forEach((pf) => {
      const pb = projectBudgets.find((b) => b.projectId === pf.projectId);
      if (!pb || pb.approvedAmount <= 0) return;

      if (pf.paid > pb.approvedAmount) {
        alerts.push({
          id: `alert-expense-over-${pf.projectId}`,
          type: "critical",
          projectId: pf.projectId,
          projectName: pf.projectName,
          message: `Actual expense (${(pf.paid / 10000000).toFixed(1)} Cr) exceeds approved budget (${(pb.approvedAmount / 10000000).toFixed(1)} Cr)`,
          metric: "expense-exceeds-budget",
          value: pf.paid,
          threshold: pb.approvedAmount,
        });
      }

      const totalExposure = pf.paid + pf.outstanding;
      if (totalExposure > pb.approvedAmount) {
        alerts.push({
          id: `alert-exposure-over-${pf.projectId}`,
          type: "critical",
          projectId: pf.projectId,
          projectName: pf.projectName,
          message: `Actual expense + outstanding commitments (${(totalExposure / 10000000).toFixed(1)} Cr) exceeds approved budget (${(pb.approvedAmount / 10000000).toFixed(1)} Cr)`,
          metric: "exposure-exceeds-budget",
          value: totalExposure,
          threshold: pb.approvedAmount,
        });
      }
    });

    return alerts;
  }, [dashboard, projectBudgets, departmentBudgets, projects, projectId]);
}

// ─── Financial Aggregation Types ─────────────────────────────────────────────

export interface CategoryFinancials {
  category: string;
  sourceType: string;
  committed: number;
  paid: number;
  deposits: number;
  outstanding: number;
}

export interface ProjectFinancials {
  projectId: string;
  projectName: string;
  approvedBudget: number;
  legacySpent: number;
  committed: number;
  paid: number;
  deposits: number;
  outstanding: number;
  available: number;
  utilization: number;
}

export interface DepartmentFinancials {
  departmentKey: string;
  display: string;
  allocated: number;
  committed: number;
  paid: number;
  outstanding: number;
  available: number;
  variance: number;
}

export interface PendingApproval {
  id: string;
  type: string;
  requestor: string;
  amount: number;
  level: string;
  submittedDate: string;
}

export interface AccountsDashboard {
  summary: {
    totalApprovedBudget: number;
    totalCommitted: number;
    totalPaid: number;
    totalDeposits: number;
    totalOutstanding: number;
    availableBudget: number;
    legacySpentEstimate: number;
    poCommitment: number;
  };
  byProject: ProjectFinancials[];
  byDepartment: DepartmentFinancials[];
  byCategory: CategoryFinancials[];
  pendingApprovals: PendingApproval[];
  currencySummary: {
    baseCurrency: CurrencyCode;
    totals: Record<string, number>;
    unconverted: number;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function byPid<T extends { projectId: string }>(arr: T[], pid?: string): T[] {
  return pid ? arr.filter((r) => r.projectId === pid) : arr;
}

function byOptPid<T extends { projectId?: string }>(arr: T[], pid?: string): T[] {
  return pid ? arr.filter((r) => r.projectId === pid) : arr;
}

function sumField<T>(arr: T[], fn: (r: T) => number): number {
  return arr.reduce((s, r) => s + (fn(r) || 0), 0);
}

// ─── Dashboard Aggregation Hook ──────────────────────────────────────────────

export function useAccountsDashboard(projectId?: string): AccountsDashboard {
  const projects = useAppDataSlice("projects");
  const remunerationAgreements = useAppDataSlice("remunerationAgreements");
  const crewPaymentRecords = useAppDataSlice("crewPaymentRecords");
  const rentalRecords = useAppDataSlice("rentalRecords");
  const rentalPayments = useAppDataSlice("rentalPayments");
  const productionExpenses = useAppDataSlice("productionExpenses");
  const expensePayments = useAppDataSlice("expensePayments");
  const officeRentals = useAppDataSlice("officeRentals");
  const officeRentPayments = useAppDataSlice("officeRentPayments");
  const maintenanceRecords = useAppDataSlice("maintenanceRecords");
  const locationAgreements = useAppDataSlice("locationAgreements");
  const locationPayments = useAppDataSlice("locationPayments");
  const hotelBookings = useAppDataSlice("hotelBookings");
  const hotelPayments = useAppDataSlice("hotelPayments");
  const trips = useAppDataSlice("trips");
  const travelPayments = useAppDataSlice("travelPayments");
  const propItems = useAppDataSlice("propItems");
  const productionSets = useAppDataSlice("productionSets");
  const caravans = useAppDataSlice("caravans");
  const stuntEquipment = useAppDataSlice("stuntEquipment");
  const projectBudgets = useAppDataSlice("projectBudgets");
  const departmentBudgets = useAppDataSlice("departmentBudgets");
  const castContracts = useAppDataSlice("castContracts");
  const purchaseOrders = useAppDataSlice("purchaseOrders");

  return useMemo(() => {
    // ── Committed amounts ───────────────────────────────
    const crewCommitted = sumField(byPid(remunerationAgreements, projectId), (r) => r.totalPayable);
    const castCommitted = sumField(byPid(castContracts, projectId), (r) => r.amount);
    const castPaid = sumField(byPid(castContracts, projectId), (r) =>
      (r.milestones || []).filter((m: PaymentMilestone) => m.status === "paid").reduce((s: number, m: PaymentMilestone) => s + m.amount, 0),
    );
    const rentalCommitted = sumField(byPid(rentalRecords, projectId), (r) => r.totalRentalCost);
    const expenseCommitted = sumField(
      byPid(productionExpenses, projectId).filter((e) => !["cancelled", "rejected"].includes(e.paymentStatus)),
      (e) => e.finalAmount,
    );
    const locationCommitted = sumField(byPid(locationAgreements, projectId), (r) => r.agreedAmount);
    const hotelCommitted = sumField(byPid(hotelBookings, projectId), (r) => r.totalAmount);
    const travelCommitted = sumField(byPid(trips, projectId), (r) => r.totalCost);
    const caravanCommitted = sumField(byOptPid(caravans, projectId), (r) => r.totalRentalCost);
    const propCost = sumField(byOptPid(propItems, projectId), (r) => r.purchaseCost);
    const expenseIds = new Set(
      byPid(productionExpenses, projectId)
        .filter((e) => !["cancelled", "rejected"].includes(e.paymentStatus))
        .map((e) => e.id),
    );
    const setCost = sumField(byPid(productionSets, projectId), (r) => {
      const hasLinkedExpenses = (r.linkedExpenseIds || []).some((eid: string) => expenseIds.has(eid));
      return hasLinkedExpenses ? 0 : r.actualCost;
    });
    const stuntCost = sumField(projectId ? [] : stuntEquipment, (r) => r.purchaseCost);
    const officeCommitted = sumField(byOptPid(officeRentals, projectId), (r) => r.monthlyRent) * 12;
    const maintenanceCommitted = sumField(byOptPid(maintenanceRecords, projectId), (r) => r.estimatedCost);

    const totalCommitted =
      crewCommitted + castCommitted + rentalCommitted + expenseCommitted + locationCommitted +
      hotelCommitted + travelCommitted + caravanCommitted + propCost + setCost +
      stuntCost + officeCommitted + maintenanceCommitted;

    // ── Paid amounts ────────────────────────────────────
    const crewPaid = sumField(byPid(crewPaymentRecords, projectId), (r) => r.amount);
    const fRentalPay = byPid(rentalPayments, projectId);
    const rentalPaid = sumField(fRentalPay.filter((p) => !p.isDeposit), (p) => p.amount);
    const rentalDeposits = sumField(fRentalPay.filter((p) => p.isDeposit), (p) => p.amount);
    const expensePaid = sumField(byPid(expensePayments, projectId), (r) => r.amount);
    const officePaid = sumField(byOptPid(officeRentPayments, projectId), (r) => r.amount);
    const fLocPay = byPid(locationPayments, projectId);
    const locationPaid = sumField(fLocPay.filter((p) => !p.isDeposit), (p) => p.amount);
    const locationDeposits = sumField(fLocPay.filter((p) => p.isDeposit), (p) => p.amount);
    const fHotelPay = byPid(hotelPayments, projectId);
    const hotelPaid = sumField(fHotelPay.filter((p) => !p.isDeposit), (p) => p.amount);
    const hotelDeposits = sumField(fHotelPay.filter((p) => p.isDeposit), (p) => p.amount);
    const travelPaid = sumField(byPid(travelPayments, projectId), (r) => r.amount);
    const caravanDeposits = sumField(byOptPid(caravans, projectId), (r) => r.depositPaid);

    const officeDeposits = sumField(
      byOptPid(officeRentals, projectId).filter((or) => or.securityDeposit && or.depositPaid),
      (or) => or.securityDeposit,
    );

    const maintenancePaid = sumField(byOptPid(maintenanceRecords, projectId).filter((r) => r.status === "completed" && r.actualCost > 0), (r) => r.actualCost);
    const totalPaid = crewPaid + castPaid + rentalPaid + expensePaid + officePaid + locationPaid + hotelPaid + travelPaid + maintenancePaid;
    const totalDeposits = rentalDeposits + locationDeposits + hotelDeposits + caravanDeposits + officeDeposits;
    const totalOutstanding = totalCommitted - totalPaid - totalDeposits;

    // ── Budget ──────────────────────────────────────────
    const filteredBudgets = byPid(projectBudgets, projectId);
    const totalApprovedBudget = sumField(filteredBudgets, (b) => b.approvedAmount);
    const filteredProjects = projectId ? projects.filter((p) => p.id === projectId) : projects;
    const legacySpentEstimate = sumField(
      filteredProjects,
      (p) => (p as unknown as Record<string, number>).spent ?? 0,
    );
    const availableBudget = totalApprovedBudget - totalCommitted;

    // ── By Project ──────────────────────────────────────
    const targetProjects = projectId ? projects.filter((p) => p.id === projectId) : projects;
    const byProject: ProjectFinancials[] = targetProjects.map((p) => {
      const pid = p.id;
      const pb = projectBudgets.find((b) => b.projectId === pid);
      const approved = pb?.approvedAmount ?? (p as unknown as Record<string, number>).budget ?? 0;
      const legacy = (p as unknown as Record<string, number>).spent ?? 0;

      const pidExpenseIds = new Set(
        productionExpenses.filter((e) => e.projectId === pid && !["cancelled", "rejected"].includes(e.paymentStatus)).map((e) => e.id),
      );
      const pidCastCommitted = sumField(castContracts.filter((r) => r.projectId === pid), (r) => r.amount);
      const pidCastPaid = sumField(castContracts.filter((r) => r.projectId === pid), (r) =>
        (r.milestones || []).filter((m: PaymentMilestone) => m.status === "paid").reduce((s: number, m: PaymentMilestone) => s + m.amount, 0),
      );

      const committed =
        sumField(remunerationAgreements.filter((r) => r.projectId === pid), (r) => r.totalPayable) +
        pidCastCommitted +
        sumField(rentalRecords.filter((r) => r.projectId === pid), (r) => r.totalRentalCost) +
        sumField(productionExpenses.filter((e) => e.projectId === pid && !["cancelled", "rejected"].includes(e.paymentStatus)), (e) => e.finalAmount) +
        sumField(locationAgreements.filter((r) => r.projectId === pid), (r) => r.agreedAmount) +
        sumField(hotelBookings.filter((r) => r.projectId === pid), (r) => r.totalAmount) +
        sumField(trips.filter((r) => r.projectId === pid), (r) => r.totalCost) +
        sumField(caravans.filter((r) => r.projectId === pid), (r) => r.totalRentalCost) +
        sumField(propItems.filter((r) => r.projectId === pid), (r) => r.purchaseCost) +
        sumField(productionSets.filter((r) => r.projectId === pid), (r) => {
          const hasLinked = (r.linkedExpenseIds || []).some((eid: string) => pidExpenseIds.has(eid));
          return hasLinked ? 0 : r.actualCost;
        });

      const pidMaintenancePaid = sumField(maintenanceRecords.filter((r) => r.projectId === pid && r.status === "completed" && r.actualCost > 0), (r) => r.actualCost);
      const paid =
        sumField(crewPaymentRecords.filter((r) => r.projectId === pid), (r) => r.amount) +
        pidCastPaid +
        sumField(rentalPayments.filter((r) => r.projectId === pid && !r.isDeposit), (r) => r.amount) +
        sumField(expensePayments.filter((r) => r.projectId === pid), (r) => r.amount) +
        sumField(officeRentPayments.filter((r) => r.projectId === pid), (r) => r.amount) +
        sumField(locationPayments.filter((r) => r.projectId === pid && !r.isDeposit), (r) => r.amount) +
        sumField(hotelPayments.filter((r) => r.projectId === pid && !r.isDeposit), (r) => r.amount) +
        sumField(travelPayments.filter((r) => r.projectId === pid), (r) => r.amount) +
        pidMaintenancePaid;

      const deps =
        sumField(rentalPayments.filter((r) => r.projectId === pid && r.isDeposit), (r) => r.amount) +
        sumField(locationPayments.filter((r) => r.projectId === pid && r.isDeposit), (r) => r.amount) +
        sumField(hotelPayments.filter((r) => r.projectId === pid && r.isDeposit), (r) => r.amount) +
        sumField(caravans.filter((r) => r.projectId === pid), (r) => r.depositPaid) +
        sumField(officeRentals.filter((r) => r.projectId === pid && r.securityDeposit && r.depositPaid), (r) => r.securityDeposit);

      const outstanding = committed - paid - deps;
      const available = approved - committed;
      const utilization = approved > 0 ? ((committed / approved) * 100) : 0;

      return { projectId: pid, projectName: p.title, approvedBudget: approved, legacySpent: legacy, committed, paid, deposits: deps, outstanding, available, utilization };
    });

    // ── By Department ───────────────────────────────────
    const deptBudgetMap = new Map<string, number>();
    const filteredDeptBudgets = byPid(departmentBudgets, projectId);
    filteredDeptBudgets.forEach((db) => {
      deptBudgetMap.set(db.departmentKey, (deptBudgetMap.get(db.departmentKey) ?? 0) + db.allocatedBudget);
    });

    const deptExpenseMap = new Map<string, number>();
    const deptPaidMap = new Map<string, number>();

    const addToDept = (dept: string, cmt: number, pd: number) => {
      deptExpenseMap.set(dept, (deptExpenseMap.get(dept) ?? 0) + cmt);
      deptPaidMap.set(dept, (deptPaidMap.get(dept) ?? 0) + pd);
    };

    byPid(remunerationAgreements, projectId).forEach((r) => {
      addToDept(normalizeDepartment(r.department), r.totalPayable, 0);
    });
    byPid(crewPaymentRecords, projectId).forEach((r) => {
      const ra = remunerationAgreements.find((a) => a.projectId === r.projectId && a.crewMemberId === r.crewMemberId);
      addToDept(normalizeDepartment(ra?.department), 0, r.amount);
    });
    byPid(castContracts, projectId).forEach((r) => {
      const castPaidAmt = (r.milestones || []).filter((m: PaymentMilestone) => m.status === "paid").reduce((s: number, m: PaymentMilestone) => s + m.amount, 0);
      addToDept("cast-talent", r.amount, castPaidAmt);
    });
    byPid(productionExpenses, projectId).forEach((e) => {
      if (!["cancelled", "rejected"].includes(e.paymentStatus)) {
        addToDept(normalizeDepartment(e.department || e.category), e.finalAmount, e.totalPaid);
      }
    });
    byPid(locationAgreements, projectId).forEach((r) => addToDept("locations", r.agreedAmount, 0));
    byPid(locationPayments, projectId).filter((p) => !p.isDeposit).forEach((p) => addToDept("locations", 0, p.amount));
    byPid(hotelBookings, projectId).forEach((r) => addToDept("locations", r.totalAmount, 0));
    byPid(hotelPayments, projectId).filter((p) => !p.isDeposit).forEach((p) => addToDept("locations", 0, p.amount));
    byPid(trips, projectId).forEach((r) => addToDept("vehicles-transport", r.totalCost, 0));
    byPid(travelPayments, projectId).forEach((p) => addToDept("vehicles-transport", 0, p.amount));
    byPid(rentalRecords, projectId).forEach((r) => {
      addToDept(normalizeDepartment(r.category), r.totalRentalCost, 0);
    });
    byPid(rentalPayments, projectId).filter((p) => !p.isDeposit).forEach((p) => {
      const sourceRecord = rentalRecords.find((r) => r.id === p.rentalId);
      addToDept(normalizeDepartment(sourceRecord?.category), 0, p.amount);
    });
    byOptPid(caravans, projectId).forEach((r) => addToDept("vehicles-transport", r.totalRentalCost, 0));
    byOptPid(propItems, projectId).forEach((r) => addToDept("art-props", r.purchaseCost, 0));
    byPid(productionSets, projectId).forEach((r) => {
      const hasLinked = (r.linkedExpenseIds || []).some((eid: string) => expenseIds.has(eid));
      addToDept("art-props", hasLinked ? 0 : r.actualCost, 0);
    });
    byOptPid(maintenanceRecords, projectId).forEach((r) => {
      const dept = r.projectId ? "production-office" : "company-overhead";
      const mPaid = r.status === "completed" && r.actualCost > 0 ? r.actualCost : 0;
      addToDept(dept, r.estimatedCost, mPaid);
    });
    if (!projectId) {
      stuntEquipment.forEach((r) => addToDept("action-stunts", r.purchaseCost, 0));
      officeRentals.filter((r) => !r.projectId).forEach((r) => addToDept("company-overhead", r.monthlyRent * 12, 0));
      officeRentPayments.filter((r) => !r.projectId).forEach((r) => addToDept("company-overhead", 0, r.amount));
    }

    const byDepartment: DepartmentFinancials[] = ACCOUNTS_DEPARTMENTS.map((d) => {
      const allocated = deptBudgetMap.get(d.key) ?? 0;
      const cmt = deptExpenseMap.get(d.key) ?? 0;
      const pd = deptPaidMap.get(d.key) ?? 0;
      const outstanding = cmt - pd;
      const available = allocated - cmt;
      const variance = allocated - cmt;
      return { departmentKey: d.key, display: d.display, allocated, committed: cmt, paid: pd, outstanding, available, variance };
    }).filter((d) => d.allocated > 0 || d.committed > 0 || d.paid > 0);

    // ── By Category ─────────────────────────────────────
    const byCategory: CategoryFinancials[] = [
      { category: "Cast Talent", sourceType: "cast", committed: castCommitted, paid: castPaid, deposits: 0, outstanding: castCommitted - castPaid },
      { category: "Crew Remuneration", sourceType: "crew", committed: crewCommitted, paid: crewPaid, deposits: 0, outstanding: crewCommitted - crewPaid },
      { category: "Rentals", sourceType: "rental", committed: rentalCommitted, paid: rentalPaid, deposits: rentalDeposits, outstanding: rentalCommitted - rentalPaid - rentalDeposits },
      { category: "Production Expenses", sourceType: "expense", committed: expenseCommitted, paid: expensePaid, deposits: 0, outstanding: expenseCommitted - expensePaid },
      { category: "Locations", sourceType: "location", committed: locationCommitted, paid: locationPaid, deposits: locationDeposits, outstanding: locationCommitted - locationPaid - locationDeposits },
      { category: "Hotels", sourceType: "hotel", committed: hotelCommitted, paid: hotelPaid, deposits: hotelDeposits, outstanding: hotelCommitted - hotelPaid - hotelDeposits },
      { category: "Travel", sourceType: "travel", committed: travelCommitted, paid: travelPaid, deposits: 0, outstanding: travelCommitted - travelPaid },
      { category: "Caravans", sourceType: "caravan", committed: caravanCommitted, paid: 0, deposits: caravanDeposits, outstanding: caravanCommitted - caravanDeposits },
      { category: "Props & Art", sourceType: "props", committed: propCost + setCost, paid: 0, deposits: 0, outstanding: propCost + setCost },
      { category: "Stunt Equipment", sourceType: "stunt", committed: stuntCost, paid: 0, deposits: 0, outstanding: stuntCost },
      { category: "Office & Maintenance", sourceType: "office", committed: officeCommitted + maintenanceCommitted, paid: officePaid + maintenancePaid, deposits: 0, outstanding: officeCommitted + maintenanceCommitted - officePaid - maintenancePaid },
    ].filter((c) => c.committed > 0 || c.paid > 0);

    // ── Pending Approvals ───────────────────────────────
    const pendingApprovals: PendingApproval[] = filteredBudgets
      .filter((b) => b.approvalStatus === "submitted" || b.approvalStatus === "dept-approved" || b.approvalStatus === "finance-approved")
      .map((b) => ({
        id: b.id,
        type: "Budget Approval",
        requestor: "Budget Team",
        amount: b.approvedAmount,
        level: b.approvalStatus === "submitted" ? "Department Head" : b.approvalStatus === "dept-approved" ? "Finance" : "Producer",
        submittedDate: b.createdAt,
      }));

    filteredDeptBudgets
      .filter((b) => b.approvalStatus === "submitted" || b.approvalStatus === "dept-approved")
      .forEach((b) => {
        pendingApprovals.push({
          id: b.id,
          type: "Department Budget",
          requestor: getDepartmentDisplay(b.departmentKey),
          amount: b.allocatedBudget,
          level: b.approvalStatus === "submitted" ? "Department Head" : "Finance",
          submittedDate: b.createdAt,
        });
      });

    const poCommittedStatuses = ["producer-approved", "partially-fulfilled", "fulfilled"];
    const poCommitment = sumField(
      byPid(purchaseOrders, projectId).filter((po) => poCommittedStatuses.includes(po.status)),
      (po) => po.inrTotal,
    );

    return {
      summary: { totalApprovedBudget, totalCommitted, totalPaid, totalDeposits, totalOutstanding, availableBudget, legacySpentEstimate, poCommitment },
      byProject,
      byDepartment,
      byCategory,
      pendingApprovals,
      currencySummary: { baseCurrency: "INR" as CurrencyCode, totals: { INR: totalPaid + totalDeposits }, unconverted: 0 },
    };
  }, [
    projects, remunerationAgreements, crewPaymentRecords, castContracts,
    rentalRecords, rentalPayments,
    productionExpenses, expensePayments, officeRentals, officeRentPayments, maintenanceRecords,
    locationAgreements, locationPayments, hotelBookings, hotelPayments, trips, travelPayments,
    propItems, productionSets, caravans, stuntEquipment, projectBudgets, departmentBudgets, purchaseOrders, projectId,
  ]);
}

// ─── A4: Consolidated Expense Register ─────────────────────────────────────

export interface ConsolidatedExpenseItem {
  id: string;
  sourceType: string;
  sourceModule: string;
  sourceId: string;
  title: string;
  description: string;
  projectId: string;
  projectName: string;
  department: string;
  departmentDisplay: string;
  category: string;
  vendorPayee: string;
  originalAmount: number;
  currency: CurrencyCode;
  inrAmount: number;
  paidAmount: number;
  depositAmount: number;
  outstandingAmount: number;
  paymentStatus: string;
  approvalStatus: string;
  transactionDate: string;
  payments: ExpensePaymentDetail[];
}

export interface ExpensePaymentDetail {
  id: string;
  amount: number;
  date: string;
  reference: string;
  isDeposit: boolean;
  recordedBy: string;
}

export function useConsolidatedExpenses(projectId?: string): ConsolidatedExpenseItem[] {
  const projects = useAppDataSlice("projects");
  const crewMembers = useAppDataSlice("crewMembers");
  const remunerationAgreements = useAppDataSlice("remunerationAgreements");
  const crewPaymentRecords = useAppDataSlice("crewPaymentRecords");
  const rentalRecords = useAppDataSlice("rentalRecords");
  const rentalVendors = useAppDataSlice("rentalVendors");
  const rentalPayments = useAppDataSlice("rentalPayments");
  const productionExpenses = useAppDataSlice("productionExpenses");
  const expensePayments = useAppDataSlice("expensePayments");
  const officeRentals = useAppDataSlice("officeRentals");
  const officeRentPayments = useAppDataSlice("officeRentPayments");
  const maintenanceRecords = useAppDataSlice("maintenanceRecords");
  const locationAgreements = useAppDataSlice("locationAgreements");
  const locations = useAppDataSlice("locations");
  const locationPayments = useAppDataSlice("locationPayments");
  const hotelBookings = useAppDataSlice("hotelBookings");
  const hotels = useAppDataSlice("hotels");
  const hotelPayments = useAppDataSlice("hotelPayments");
  const trips = useAppDataSlice("trips");
  const travelPayments = useAppDataSlice("travelPayments");
  const propItems = useAppDataSlice("propItems");
  const productionSets = useAppDataSlice("productionSets");
  const caravans = useAppDataSlice("caravans");
  const stuntEquipment = useAppDataSlice("stuntEquipment");
  const castContracts = useAppDataSlice("castContracts");
  const castMembers = useAppDataSlice("castMembers");

  return useMemo(() => {
    const projMap = new Map(projects.map((p) => [p.id, p.title]));
    const crewMap = new Map(crewMembers.map((c) => [c.id, (c as any).name || c.id]));
    const castMap = new Map(castMembers.map((c) => [c.id, c.name]));
    const vendorMap = new Map(rentalVendors.map((v: any) => [v.id, v.name]));
    const locMap = new Map(locations.map((l: any) => [l.id, l.name]));
    const hotelMap = new Map(hotels.map((h: any) => [h.id, h.name]));
    const pName = (pid: string) => projMap.get(pid) ?? (pid ? pid : "Company");

    const items: ConsolidatedExpenseItem[] = [];

    // 1. Crew Remuneration
    byPid(remunerationAgreements, projectId).forEach((r) => {
      const payments = crewPaymentRecords
        .filter((p) => p.agreementId === r.id || (p.crewMemberId === r.crewMemberId && p.projectId === r.projectId));
      const paid = payments.reduce((s, p) => s + (p.amount || 0), 0);
      items.push({
        id: `exp-crew-${r.id}`,
        sourceType: "crew",
        sourceModule: "Crew Remuneration",
        sourceId: r.id,
        title: `${crewMap.get(r.crewMemberId) ?? r.crewMemberId} — ${(r as any).designation ?? "Crew"}`,
        description: `Period: ${r.period || "—"}`,
        projectId: r.projectId,
        projectName: pName(r.projectId),
        department: normalizeDepartment(r.department),
        departmentDisplay: getDepartmentDisplay(normalizeDepartment(r.department)),
        category: r.department || "Crew",
        vendorPayee: crewMap.get(r.crewMemberId) ?? r.crewMemberId,
        originalAmount: r.totalPayable,
        currency: "INR",
        inrAmount: r.totalPayable,
        paidAmount: paid,
        depositAmount: 0,
        outstandingAmount: r.totalPayable - paid,
        paymentStatus: paid >= r.totalPayable ? "paid" : paid > 0 ? "partial" : "pending",
        approvalStatus: r.status || "active",
        transactionDate: r.workStartDate || r.createdAt,
        payments: payments.map((p) => ({
          id: p.id, amount: p.amount, date: p.paymentDate, reference: p.paymentReference || "", isDeposit: false, recordedBy: p.recordedBy || "",
        })),
      });
    });

    // 2. Rentals
    byPid(rentalRecords, projectId).forEach((r) => {
      const payments = rentalPayments.filter((p) => p.rentalId === r.id);
      const paid = payments.filter((p) => !p.isDeposit).reduce((s, p) => s + (p.amount || 0), 0);
      const dep = payments.filter((p) => p.isDeposit).reduce((s, p) => s + (p.amount || 0), 0);
      items.push({
        id: `exp-rental-${r.id}`,
        sourceType: "rental",
        sourceModule: "Rentals",
        sourceId: r.id,
        title: r.itemName || `Rental ${r.id}`,
        description: `${r.quantity || 1}× ${r.ratePeriod || "day"} @ ₹${(r.rateAmount || 0).toLocaleString("en-IN")}`,
        projectId: r.projectId,
        projectName: pName(r.projectId),
        department: normalizeDepartment(r.category),
        departmentDisplay: getDepartmentDisplay(normalizeDepartment(r.category)),
        category: r.category || "Rental",
        vendorPayee: vendorMap.get(r.vendorId) ?? r.vendorId ?? "—",
        originalAmount: r.totalRentalCost,
        currency: "INR",
        inrAmount: r.totalRentalCost,
        paidAmount: paid,
        depositAmount: dep,
        outstandingAmount: r.totalRentalCost - paid - dep,
        paymentStatus: r.status === "cancelled" ? "cancelled" : (paid + dep >= r.totalRentalCost ? "paid" : paid > 0 || dep > 0 ? "partial" : "pending"),
        approvalStatus: r.status || "active",
        transactionDate: r.rentalStartDate || r.createdAt,
        payments: payments.map((p) => ({
          id: p.id, amount: p.amount, date: p.paymentDate, reference: p.paymentReference || "", isDeposit: p.isDeposit, recordedBy: p.recordedBy || "",
        })),
      });
    });

    // 3. Production Expenses
    byPid(productionExpenses, projectId).forEach((e) => {
      const payments = expensePayments.filter((p) => p.expenseId === e.id);
      const paid = payments.reduce((s, p) => s + (p.amount || 0), 0);
      items.push({
        id: `exp-expense-${e.id}`,
        sourceType: "expense",
        sourceModule: "Production Expenses",
        sourceId: e.id,
        title: e.title || `Expense ${e.id}`,
        description: e.description || "",
        projectId: e.projectId,
        projectName: pName(e.projectId),
        department: normalizeDepartment(e.department || e.category),
        departmentDisplay: getDepartmentDisplay(normalizeDepartment(e.department || e.category)),
        category: e.category || e.section || "Expense",
        vendorPayee: e.vendorPayee || "—",
        originalAmount: e.finalAmount,
        currency: "INR",
        inrAmount: e.finalAmount,
        paidAmount: paid,
        depositAmount: 0,
        outstandingAmount: e.finalAmount - paid,
        paymentStatus: e.paymentStatus || (paid >= e.finalAmount ? "paid" : paid > 0 ? "partial" : "pending"),
        approvalStatus: e.paymentStatus === "cancelled" || e.paymentStatus === "rejected" ? e.paymentStatus : "approved",
        transactionDate: e.expenseDate || e.createdAt,
        payments: payments.map((p) => ({
          id: p.id, amount: p.amount, date: p.paymentDate, reference: p.referenceNumber || "", isDeposit: false, recordedBy: p.recordedBy || "",
        })),
      });
    });

    // 4. Location Agreements
    byPid(locationAgreements, projectId).forEach((r) => {
      const payments = locationPayments.filter((p) => p.agreementId === r.id);
      const paid = payments.filter((p) => !p.isDeposit).reduce((s, p) => s + (p.amount || 0), 0);
      const dep = payments.filter((p) => p.isDeposit).reduce((s, p) => s + (p.amount || 0), 0);
      items.push({
        id: `exp-loc-${r.id}`,
        sourceType: "location",
        sourceModule: "Locations",
        sourceId: r.id,
        title: locMap.get(r.locationId) ?? `Location ${r.locationId}`,
        description: `${r.usageStartDate?.split("T")[0] ?? ""} to ${r.usageEndDate?.split("T")[0] ?? ""}`,
        projectId: r.projectId,
        projectName: pName(r.projectId),
        department: "locations",
        departmentDisplay: getDepartmentDisplay("locations"),
        category: "Location Fee",
        vendorPayee: locMap.get(r.locationId) ?? r.locationId ?? "—",
        originalAmount: r.agreedAmount,
        currency: "INR",
        inrAmount: r.agreedAmount,
        paidAmount: paid,
        depositAmount: dep,
        outstandingAmount: r.agreedAmount - paid - dep,
        paymentStatus: paid + dep >= r.agreedAmount ? "paid" : paid > 0 || dep > 0 ? "partial" : "pending",
        approvalStatus: r.status || "active",
        transactionDate: r.usageStartDate || r.createdAt,
        payments: payments.map((p) => ({
          id: p.id, amount: p.amount, date: p.paymentDate, reference: p.referenceNumber || "", isDeposit: p.isDeposit, recordedBy: p.recordedBy || "",
        })),
      });
    });

    // 5. Hotel Bookings
    byPid(hotelBookings, projectId).forEach((r) => {
      const payments = hotelPayments.filter((p) => p.bookingId === r.id);
      const paid = payments.filter((p) => !p.isDeposit).reduce((s, p) => s + (p.amount || 0), 0);
      const dep = payments.filter((p) => p.isDeposit).reduce((s, p) => s + (p.amount || 0), 0);
      items.push({
        id: `exp-hotel-${r.id}`,
        sourceType: "hotel",
        sourceModule: "Hotels",
        sourceId: r.id,
        title: `${hotelMap.get(r.hotelId) ?? r.hotelId} — ${r.guestName}`,
        description: `${r.roomType || "Room"}, ${r.nights} night(s)`,
        projectId: r.projectId,
        projectName: pName(r.projectId),
        department: "locations",
        departmentDisplay: getDepartmentDisplay("locations"),
        category: "Hotel Booking",
        vendorPayee: hotelMap.get(r.hotelId) ?? r.hotelId ?? "—",
        originalAmount: r.totalAmount,
        currency: "INR",
        inrAmount: r.totalAmount,
        paidAmount: paid,
        depositAmount: dep,
        outstandingAmount: r.totalAmount - paid - dep,
        paymentStatus: r.status === "cancelled" ? "cancelled" : (paid + dep >= r.totalAmount ? "paid" : paid > 0 || dep > 0 ? "partial" : "pending"),
        approvalStatus: r.status || "active",
        transactionDate: r.checkInDate || r.createdAt,
        payments: payments.map((p) => ({
          id: p.id, amount: p.amount, date: p.paymentDate, reference: p.referenceNumber || "", isDeposit: p.isDeposit, recordedBy: p.recordedBy || "",
        })),
      });
    });

    // 6. Travel
    byPid(trips, projectId).forEach((r) => {
      const payments = travelPayments.filter((p) => p.tripId === r.id);
      const paid = payments.reduce((s, p) => s + (p.amount || 0), 0);
      items.push({
        id: `exp-travel-${r.id}`,
        sourceType: "travel",
        sourceModule: "Travel",
        sourceId: r.id,
        title: r.title || `${r.origin} → ${r.destination}`,
        description: `${r.category || "Travel"} — ${r.passengers || 1} pax`,
        projectId: r.projectId,
        projectName: pName(r.projectId),
        department: "vehicles-transport",
        departmentDisplay: getDepartmentDisplay("vehicles-transport"),
        category: r.category || "Travel",
        vendorPayee: r.vendorProvider || "—",
        originalAmount: r.totalCost,
        currency: "INR",
        inrAmount: r.totalCost,
        paidAmount: paid,
        depositAmount: 0,
        outstandingAmount: r.totalCost - paid,
        paymentStatus: r.status === "cancelled" ? "cancelled" : (paid >= r.totalCost ? "paid" : paid > 0 ? "partial" : "pending"),
        approvalStatus: r.status || "active",
        transactionDate: r.departureDateTime || r.createdAt,
        payments: payments.map((p) => ({
          id: p.id, amount: p.amount, date: p.paymentDate, reference: p.referenceNumber || "", isDeposit: false, recordedBy: p.recordedBy || "",
        })),
      });
    });

    // 7. Office Rentals
    byOptPid(officeRentals, projectId).forEach((r) => {
      const payments = officeRentPayments.filter((p) => p.officeRentalId === r.id);
      const paid = payments.reduce((s, p) => s + (p.amount || 0), 0);
      const dep = r.securityDeposit && r.depositPaid ? r.securityDeposit : 0;
      const annualRent = (r.monthlyRent || 0) * 12;
      items.push({
        id: `exp-office-${r.id}`,
        sourceType: "office",
        sourceModule: "Office & Maintenance",
        sourceId: r.id,
        title: r.propertyName || `Office ${r.id}`,
        description: `Monthly: ₹${(r.monthlyRent || 0).toLocaleString("en-IN")} | ${r.address || ""}`,
        projectId: r.projectId || "",
        projectName: r.projectId ? pName(r.projectId) : "Company",
        department: r.projectId ? "production-office" : "company-overhead",
        departmentDisplay: getDepartmentDisplay(r.projectId ? "production-office" : "company-overhead"),
        category: "Office Rental",
        vendorPayee: r.landlordPayee || "—",
        originalAmount: annualRent,
        currency: "INR",
        inrAmount: annualRent,
        paidAmount: paid,
        depositAmount: dep,
        outstandingAmount: annualRent - paid - dep,
        paymentStatus: paid + dep >= annualRent ? "paid" : paid > 0 ? "partial" : "pending",
        approvalStatus: r.status || "active",
        transactionDate: r.leaseStartDate || r.createdAt,
        payments: payments.map((p) => ({
          id: p.id, amount: p.amount, date: p.paymentDate, reference: p.referenceNumber || "", isDeposit: false, recordedBy: p.recordedBy || "",
        })),
      });
    });

    // 8. Maintenance
    byOptPid(maintenanceRecords, projectId).forEach((r) => {
      items.push({
        id: `exp-maint-${r.id}`,
        sourceType: "maintenance",
        sourceModule: "Office & Maintenance",
        sourceId: r.id,
        title: r.title || `Maintenance ${r.id}`,
        description: `Priority: ${r.priority || "—"} | Assigned: ${r.assignedTo || "—"}`,
        projectId: r.projectId || "",
        projectName: r.projectId ? pName(r.projectId) : "Company",
        department: r.projectId ? "production-office" : "company-overhead",
        departmentDisplay: getDepartmentDisplay(r.projectId ? "production-office" : "company-overhead"),
        category: r.category || "Maintenance",
        vendorPayee: r.assignedTo || "—",
        originalAmount: r.estimatedCost,
        currency: "INR",
        inrAmount: r.estimatedCost,
        paidAmount: r.actualCost || 0,
        depositAmount: 0,
        outstandingAmount: r.estimatedCost - (r.actualCost || 0),
        paymentStatus: r.status === "completed" ? "paid" : r.actualCost > 0 ? "partial" : "pending",
        approvalStatus: r.status || "pending",
        transactionDate: r.reportedDate || r.createdAt,
        payments: r.actualCost > 0 ? [{
          id: `${r.id}-pay`, amount: r.actualCost, date: r.actualCompletion || r.createdAt, reference: r.invoiceReference || "", isDeposit: false, recordedBy: "",
        }] : [],
      });
    });

    // 9. Caravans
    byOptPid(caravans, projectId).forEach((r) => {
      items.push({
        id: `exp-caravan-${r.id}`,
        sourceType: "caravan",
        sourceModule: "Caravans",
        sourceId: r.id,
        title: r.name || `Caravan ${r.identificationNumber || r.id}`,
        description: `${r.category || "Caravan"} — Capacity: ${r.capacity || "—"}`,
        projectId: r.projectId || "",
        projectName: r.projectId ? pName(r.projectId) : "Company",
        department: "vehicles-transport",
        departmentDisplay: getDepartmentDisplay("vehicles-transport"),
        category: r.category || "Caravan",
        vendorPayee: vendorMap.get(r.vendorId) ?? r.vendorId ?? "—",
        originalAmount: r.totalRentalCost,
        currency: "INR",
        inrAmount: r.totalRentalCost,
        paidAmount: 0,
        depositAmount: r.depositPaid || 0,
        outstandingAmount: r.totalRentalCost - (r.depositPaid || 0),
        paymentStatus: r.depositPaid >= r.totalRentalCost ? "paid" : r.depositPaid > 0 ? "partial" : "pending",
        approvalStatus: r.status || "available",
        transactionDate: r.rentalStartDate || r.createdAt,
        payments: r.depositPaid > 0 ? [{
          id: `${r.id}-dep`, amount: r.depositPaid, date: r.rentalStartDate || r.createdAt, reference: "", isDeposit: true, recordedBy: "",
        }] : [],
      });
    });

    // 10. Props
    const filteredProps = projectId ? propItems.filter((r: any) => r.projectId === projectId) : propItems;
    filteredProps.forEach((r: any) => {
      items.push({
        id: `exp-prop-${r.id}`,
        sourceType: "props",
        sourceModule: "Props & Art",
        sourceId: r.id,
        title: r.name || `Prop ${r.id}`,
        description: `${r.category || "Prop"} — ${r.ownership || "owned"}`,
        projectId: r.projectId || "",
        projectName: r.projectId ? pName(r.projectId) : "Company",
        department: "art-props",
        departmentDisplay: getDepartmentDisplay("art-props"),
        category: r.category || "Props",
        vendorPayee: "—",
        originalAmount: r.purchaseCost || 0,
        currency: "INR",
        inrAmount: r.purchaseCost || 0,
        paidAmount: 0,
        depositAmount: 0,
        outstandingAmount: r.purchaseCost || 0,
        paymentStatus: "pending",
        approvalStatus: "active",
        transactionDate: r.createdAt,
        payments: [],
      });
    });

    // 11. Production Sets (respect Option B)
    const activeExpenseIds = new Set(
      productionExpenses
        .filter((e) => !["cancelled", "rejected"].includes(e.paymentStatus))
        .map((e) => e.id),
    );
    byPid(productionSets, projectId).forEach((r) => {
      const hasLinked = (r.linkedExpenseIds || []).some((eid: string) => activeExpenseIds.has(eid));
      items.push({
        id: `exp-set-${r.id}`,
        sourceType: "set",
        sourceModule: "Production Sets",
        sourceId: r.id,
        title: r.name || `Set ${r.id}`,
        description: hasLinked ? `Linked to expenses (Option B: cost tracked via expenses)` : `${r.category || "Set"} — Art Director: ${r.artDirector || "—"}`,
        projectId: r.projectId,
        projectName: pName(r.projectId),
        department: "art-props",
        departmentDisplay: getDepartmentDisplay("art-props"),
        category: r.category || "Production Set",
        vendorPayee: r.artDirector || "—",
        originalAmount: r.actualCost,
        currency: "INR",
        inrAmount: hasLinked ? 0 : r.actualCost,
        paidAmount: 0,
        depositAmount: 0,
        outstandingAmount: hasLinked ? 0 : r.actualCost,
        paymentStatus: hasLinked ? "linked" : "pending",
        approvalStatus: r.status || "active",
        transactionDate: r.constructionStartDate || r.createdAt,
        payments: [],
      });
    });

    // 12. Stunt Equipment (company-level only)
    if (!projectId) {
      stuntEquipment.forEach((r: any) => {
        items.push({
          id: `exp-stunt-${r.id}`,
          sourceType: "stunt",
          sourceModule: "Stunt Equipment",
          sourceId: r.id,
          title: r.name || `Stunt Equipment ${r.id}`,
          description: `${r.category || "Equipment"} — ${r.ownership || "owned"}`,
          projectId: "",
          projectName: "Company",
          department: "action-stunts",
          departmentDisplay: getDepartmentDisplay("action-stunts"),
          category: r.category || "Stunt Equipment",
          vendorPayee: vendorMap.get(r.vendorId) ?? "—",
          originalAmount: r.purchaseCost || 0,
          currency: "INR",
          inrAmount: r.purchaseCost || 0,
          paidAmount: 0,
          depositAmount: 0,
          outstandingAmount: r.purchaseCost || 0,
          paymentStatus: "pending",
          approvalStatus: "active",
          transactionDate: r.createdAt,
          payments: [],
        });
      });
    }

    // 13. Cast Contracts
    byPid(castContracts, projectId).forEach((r) => {
      const paidMilestones = (r.milestones || []).filter((m: PaymentMilestone) => m.status === "paid");
      const paid = paidMilestones.reduce((s: number, m: PaymentMilestone) => s + m.amount, 0);
      const castName = castMap.get(r.castId) ?? r.castId;
      items.push({
        id: `exp-cast-${r.id}`,
        sourceType: "cast",
        sourceModule: "Cast Talent",
        sourceId: r.id,
        title: `${castName} — ${r.contractRef}`,
        description: `Contract: ${r.contractRef} | ${r.startDate?.split("T")[0] ?? ""} to ${r.endDate?.split("T")[0] ?? ""}`,
        projectId: r.projectId,
        projectName: pName(r.projectId),
        department: "cast-talent",
        departmentDisplay: getDepartmentDisplay("cast-talent"),
        category: "Cast Contract",
        vendorPayee: castName,
        originalAmount: r.amount,
        currency: "INR",
        inrAmount: r.amount,
        paidAmount: paid,
        depositAmount: 0,
        outstandingAmount: r.amount - paid,
        paymentStatus: paid >= r.amount ? "paid" : paid > 0 ? "partial" : "pending",
        approvalStatus: r.contractStage || "draft",
        transactionDate: r.startDate || r.createdAt,
        payments: paidMilestones.map((m: PaymentMilestone) => ({
          id: m.id, amount: m.amount, date: m.paymentDate || m.dueDate, reference: m.paymentRef || "", isDeposit: false, recordedBy: m.notes || "",
        })),
      });
    });

    return items.sort((a, b) => b.transactionDate.localeCompare(a.transactionDate));
  }, [
    projects, crewMembers, remunerationAgreements, crewPaymentRecords,
    rentalRecords, rentalVendors, rentalPayments, productionExpenses, expensePayments,
    officeRentals, officeRentPayments, maintenanceRecords,
    locationAgreements, locations, locationPayments,
    hotelBookings, hotels, hotelPayments, trips, travelPayments,
    propItems, productionSets, caravans, stuntEquipment,
    castContracts, castMembers, projectId,
  ]);
}
