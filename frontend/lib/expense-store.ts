"use client";
import { useAppDataSlice, updateAppDataSlice } from "@/lib/app-data-store";
import type {
  ProductionExpense,
  ExpensePayment,
  OfficeRental,
  OfficeRentPayment,
  MaintenanceRecord,
  ExpensePaymentStatus,
} from "@/lib/types";

const fmt = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
export const formatINR = (n: number) => fmt.format(n);

// ─── Production Expenses ──────────────────────────────────────────────────────

export function useProductionExpenses(projectId?: string): ProductionExpense[] {
  const all = useAppDataSlice("productionExpenses") ?? [];
  return projectId ? all.filter(e => e.projectId === projectId) : all;
}

export function addExpense(e: Omit<ProductionExpense, "id" | "createdAt" | "updatedAt">) {
  const now = new Date().toISOString();
  const newE: ProductionExpense = { ...e, id: `exp-${Date.now()}`, createdAt: now, updatedAt: now };
  updateAppDataSlice("productionExpenses", list => [...list, newE]);
  return newE;
}

export function updateExpense(id: string, updates: Partial<ProductionExpense>) {
  const now = new Date().toISOString();
  updateAppDataSlice("productionExpenses", list =>
    list.map(e => e.id === id ? { ...e, ...updates, updatedAt: now } : e)
  );
}

export function approveExpense(id: string, approvedBy: string) {
  updateExpense(id, { paymentStatus: "approved", approvedBy, approvedAt: new Date().toISOString() });
}

export function rejectExpense(id: string, rejectedBy: string, reason: string) {
  updateExpense(id, { paymentStatus: "rejected", rejectedBy, rejectedReason: reason });
}

// ─── Expense Payments ─────────────────────────────────────────────────────────

export function useExpensePayments(expenseId?: string): ExpensePayment[] {
  const all = useAppDataSlice("expensePayments") ?? [];
  return expenseId ? all.filter(p => p.expenseId === expenseId) : all;
}

export function recordExpensePayment(
  expense: ProductionExpense,
  payment: Omit<ExpensePayment, "id" | "expenseId" | "createdAt">
): { ok: boolean; error?: string } {
  const outstanding = expense.finalAmount - expense.totalPaid;
  if (payment.amount > outstanding + 0.01) return { ok: false, error: "Payment exceeds outstanding amount" };
  if (payment.amount <= 0) return { ok: false, error: "Amount must be positive" };

  const now = new Date().toISOString();
  const newP: ExpensePayment = { ...payment, expenseId: expense.id, id: `ep-${Date.now()}`, createdAt: now };
  updateAppDataSlice("expensePayments", list => [...list, newP]);

  const newTotalPaid = expense.totalPaid + payment.amount;
  const newStatus: ExpensePaymentStatus = newTotalPaid >= expense.finalAmount - 0.01 ? "paid" : "partially-paid";
  updateExpense(expense.id, { totalPaid: newTotalPaid, paymentStatus: newStatus });
  return { ok: true };
}

// ─── Office Rentals ───────────────────────────────────────────────────────────

export function useOfficeRentals(projectId?: string): OfficeRental[] {
  const all = useAppDataSlice("officeRentals") ?? [];
  if (!projectId) return all;
  return all.filter(r => r.projectId === projectId || !r.projectId);
}

export function addOfficeRental(r: Omit<OfficeRental, "id" | "createdAt">) {
  const now = new Date().toISOString();
  const newR: OfficeRental = { ...r, id: `or-${Date.now()}`, createdAt: now };
  updateAppDataSlice("officeRentals", list => [...list, newR]);
  return newR;
}

export function updateOfficeRental(id: string, updates: Partial<OfficeRental>) {
  updateAppDataSlice("officeRentals", list => list.map(r => r.id === id ? { ...r, ...updates } : r));
}

export function useOfficeRentPayments(officeRentalId?: string): OfficeRentPayment[] {
  const all = useAppDataSlice("officeRentPayments") ?? [];
  return officeRentalId ? all.filter(p => p.officeRentalId === officeRentalId) : all;
}

export function recordRentPayment(p: Omit<OfficeRentPayment, "id" | "createdAt">) {
  const now = new Date().toISOString();
  const newP: OfficeRentPayment = { ...p, id: `orp-${Date.now()}`, createdAt: now };
  updateAppDataSlice("officeRentPayments", list => [...list, newP]);
  return newP;
}

// ─── Maintenance ──────────────────────────────────────────────────────────────

export function useMaintenanceRecords(projectId?: string): MaintenanceRecord[] {
  const all = useAppDataSlice("maintenanceRecords") ?? [];
  if (!projectId) return all;
  return all.filter(r => r.projectId === projectId || !r.projectId);
}

export function addMaintenanceRecord(r: Omit<MaintenanceRecord, "id" | "createdAt" | "updatedAt">) {
  const now = new Date().toISOString();
  const newR: MaintenanceRecord = { ...r, id: `mnt-${Date.now()}`, createdAt: now, updatedAt: now };
  updateAppDataSlice("maintenanceRecords", list => [...list, newR]);
  return newR;
}

export function updateMaintenanceRecord(id: string, updates: Partial<MaintenanceRecord>) {
  const now = new Date().toISOString();
  updateAppDataSlice("maintenanceRecords", list =>
    list.map(r => r.id === id ? { ...r, ...updates, updatedAt: now } : r)
  );
}

// ─── Dashboard Calculations ───────────────────────────────────────────────────

export function calcExpenseDashboard(
  expenses: ProductionExpense[],
  rentals: OfficeRental[],
  maintenance: MaintenanceRecord[]
) {
  const active = expenses.filter(e => !["cancelled", "rejected"].includes(e.paymentStatus));
  return {
    totalExpenses: active.length,
    totalAmount: active.reduce((s, e) => s + e.finalAmount, 0),
    approved: active.filter(e => ["approved", "partially-paid", "paid"].includes(e.paymentStatus)).length,
    pendingApproval: active.filter(e => e.paymentStatus === "pending-approval").length,
    totalPaid: active.reduce((s, e) => s + e.totalPaid, 0),
    totalOutstanding: active.reduce((s, e) => s + Math.max(0, e.finalAmount - e.totalPaid), 0),
    totalOfficeRent: rentals.filter(r => r.status === "active").reduce((s, r) => s + r.monthlyRent, 0),
    totalMaintenance: maintenance.reduce((s, m) => s + m.actualCost, 0),
  };
}
