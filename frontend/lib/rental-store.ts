"use client";
import { useAppDataSlice, updateAppDataSlice } from "@/lib/app-data-store";
import type { Vendor, RentalRecord, RentalPayment, RentalStatus } from "@/lib/types";

// ─── Vendors ──────────────────────────────────────────────────────────────────

export function useRentalVendors(): Vendor[] {
  return useAppDataSlice("rentalVendors") ?? [];
}

export function addRentalVendor(v: Omit<Vendor, "id" | "createdAt">): Vendor {
  const now = new Date().toISOString();
  const newV: Vendor = { ...v, id: `rv-${Date.now()}`, createdAt: now };
  updateAppDataSlice("rentalVendors", (list) => [...list, newV]);
  return newV;
}

export function updateRentalVendor(id: string, updates: Partial<Vendor>): void {
  updateAppDataSlice("rentalVendors", (list) =>
    list.map((v) => (v.id === id ? { ...v, ...updates } : v))
  );
}

// ─── Rental Records ───────────────────────────────────────────────────────────

export function useRentalRecords(projectId?: string): RentalRecord[] {
  const records = useAppDataSlice("rentalRecords") ?? [];
  return projectId ? records.filter((r) => r.projectId === projectId) : records;
}

export function addRentalRecord(
  record: Omit<RentalRecord, "id" | "createdAt" | "updatedAt">
): RentalRecord {
  const now = new Date().toISOString();
  const newR: RentalRecord = { ...record, id: `rn-${Date.now()}`, createdAt: now, updatedAt: now };
  updateAppDataSlice("rentalRecords", (list) => [...list, newR]);
  return newR;
}

export function updateRentalRecord(id: string, updates: Partial<RentalRecord>): void {
  const now = new Date().toISOString();
  updateAppDataSlice("rentalRecords", (list) =>
    list.map((r) => (r.id === id ? { ...r, ...updates, updatedAt: now } : r))
  );
}

export function updateRentalStatus(id: string, status: RentalStatus): void {
  updateRentalRecord(id, { status });
}

// ─── Rental Payments ──────────────────────────────────────────────────────────

export function useRentalPayments(rentalId?: string): RentalPayment[] {
  const payments = useAppDataSlice("rentalPayments") ?? [];
  return rentalId ? payments.filter((p) => p.rentalId === rentalId) : payments;
}

export function recordRentalPayment(
  rentalId: string,
  payment: Omit<RentalPayment, "id" | "createdAt" | "rentalId">
): RentalPayment {
  const now = new Date().toISOString();
  const newP: RentalPayment = { ...payment, rentalId, id: `rp-${Date.now()}`, createdAt: now };
  updateAppDataSlice("rentalPayments", (list) => [...list, newP]);
  if (!payment.isDeposit) {
    updateAppDataSlice("rentalRecords", (list) =>
      list.map((r) => {
        if (r.id !== rentalId) return r;
        const newTotalPaid = r.totalPaid + payment.amount;
        const outstanding = r.totalRentalCost - newTotalPaid;
        const newStatus: RentalStatus = outstanding <= 0 ? "returned" : r.status;
        return { ...r, totalPaid: newTotalPaid, status: newStatus, updatedAt: now };
      })
    );
  }
  return newP;
}

// ─── Calculations ─────────────────────────────────────────────────────────────

export function calcRentalSubtotal(
  record: Pick<RentalRecord, "ratePeriod" | "rateAmount" | "quantity" | "rentalDays">
): number {
  return record.ratePeriod === "fixed"
    ? record.rateAmount
    : record.quantity * record.rateAmount * record.rentalDays;
}

export function calcRentalCost(
  record: Pick<RentalRecord, "subtotal" | "additionalCharges" | "lateFees">
): number {
  return record.subtotal + record.additionalCharges + record.lateFees;
}

export function calcRentalOutstanding(
  record: Pick<RentalRecord, "totalRentalCost" | "totalPaid">
): number {
  return Math.max(0, record.totalRentalCost - record.totalPaid);
}

export function calcRentalDashboardSummary(records: RentalRecord[]) {
  return {
    total: records.length,
    active: records.filter((r) =>
      ["booked", "issued", "partially-returned"].includes(r.status)
    ).length,
    pendingApproval: records.filter((r) => r.status === "requested").length,
    overdue: records.filter((r) => r.status === "overdue").length,
    totalCost: records.reduce((s, r) => s + r.totalRentalCost, 0),
    totalPaid: records.reduce((s, r) => s + r.totalPaid, 0),
    totalOutstanding: records.reduce((s, r) => s + calcRentalOutstanding(r), 0),
  };
}
