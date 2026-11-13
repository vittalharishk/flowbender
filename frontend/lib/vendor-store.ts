"use client";

import { useMemo } from "react";
import { useAppDataSlice, updateAppDataSlice, getAppDataSlice } from "@/lib/app-data-store";
import type { Vendor, PurchaseOrder, CurrencyCode } from "@/lib/types";

// ─── Vendor CRUD Extensions ──────────────────────────────────────────────────

export function deactivateVendor(vendorId: string): boolean {
  const vendors = getAppDataSlice("rentalVendors");
  const v = vendors.find((vr) => vr.id === vendorId);
  if (!v || v.status === "inactive") return false;
  updateAppDataSlice("rentalVendors", (list) =>
    list.map((vr) => (vr.id === vendorId ? { ...vr, status: "inactive" as const } : vr)),
  );
  return true;
}

export function activateVendor(vendorId: string): boolean {
  const vendors = getAppDataSlice("rentalVendors");
  const v = vendors.find((vr) => vr.id === vendorId);
  if (!v || v.status === "active") return false;
  updateAppDataSlice("rentalVendors", (list) =>
    list.map((vr) => (vr.id === vendorId ? { ...vr, status: "active" as const } : vr)),
  );
  return true;
}

export function hasVendorTransactions(vendorId: string): boolean {
  const pos = getAppDataSlice("purchaseOrders");
  const rentals = getAppDataSlice("rentalRecords");
  const props = getAppDataSlice("propItems");
  const caravans = getAppDataSlice("caravans");
  const stunt = getAppDataSlice("stuntEquipment");
  return (
    pos.some((p) => p.vendorId === vendorId) ||
    rentals.some((r) => r.vendorId === vendorId) ||
    props.some((p: any) => p.vendorId === vendorId) ||
    caravans.some((c: any) => c.vendorId === vendorId) ||
    stunt.some((s: any) => s.vendorId === vendorId)
  );
}

// ─── Vendor Financial Summary ────────────────────────────────────────────────

export interface VendorFinancialSummary {
  vendorId: string;
  vendorName: string;
  vendorStatus: string;
  vendorCategory: string;
  poCount: number;
  poCommitment: number;
  expenseCount: number;
  expenseCommitted: number;
  totalPaid: number;
  totalOutstanding: number;
  reconciliationExceptions: number;
}

const PO_COMMITTED_STATUSES = ["producer-approved", "partially-fulfilled", "fulfilled"];

export function useVendorFinancials(projectId?: string): VendorFinancialSummary[] {
  const vendors = useAppDataSlice("rentalVendors");
  const purchaseOrders = useAppDataSlice("purchaseOrders");
  const rentalRecords = useAppDataSlice("rentalRecords");
  const rentalPayments = useAppDataSlice("rentalPayments");
  const propItems = useAppDataSlice("propItems");
  const caravans = useAppDataSlice("caravans");
  const stuntEquipment = useAppDataSlice("stuntEquipment");

  return useMemo(() => {
    const filterPid = <T extends { projectId?: string }>(arr: T[]) =>
      projectId ? arr.filter((r) => r.projectId === projectId) : arr;

    const pos = filterPid(purchaseOrders);
    const rentals = filterPid(rentalRecords);
    const rPayments = rentalPayments;
    const props = filterPid(propItems as any[]);
    const cvns = filterPid(caravans as any[]);
    const stunts = filterPid(stuntEquipment as any[]);

    return vendors.map((v) => {
      const vPos = pos.filter((p) => p.vendorId === v.id);
      const vRentals = rentals.filter((r: any) => r.vendorId === v.id);
      const vProps = props.filter((p: any) => p.vendorId === v.id);
      const vCaravans = cvns.filter((c: any) => c.vendorId === v.id);
      const vStunts = stunts.filter((s: any) => s.vendorId === v.id);

      const poCommitment = vPos
        .filter((p) => PO_COMMITTED_STATUSES.includes(p.status))
        .reduce((s, p) => s + p.inrTotal, 0);

      const rentalCommitted = vRentals
        .filter((r: any) => r.status !== "cancelled")
        .reduce((s: number, r: any) => s + (r.totalRentalCost || 0), 0);
      const propCommitted = vProps.reduce((s: number, p: any) => s + (p.purchaseCost || 0), 0);
      const caravanCommitted = vCaravans.reduce((s: number, c: any) => s + (c.totalRentalCost || 0), 0);
      const stuntCommitted = vStunts.reduce((s: number, se: any) => s + (se.purchaseCost || 0), 0);
      const expenseCommitted = rentalCommitted + propCommitted + caravanCommitted + stuntCommitted;

      const rentalPaid = rPayments
        .filter((rp: any) => vRentals.some((r: any) => r.id === rp.rentalId) && !rp.isDeposit)
        .reduce((s: number, rp: any) => s + (rp.amount || 0), 0);
      const caravanDeposits = vCaravans.reduce((s: number, c: any) => s + (c.depositPaid || 0), 0);
      const totalPaid = rentalPaid + caravanDeposits;

      const totalOutstanding = Math.max(0, expenseCommitted - totalPaid);
      const expenseCount = vRentals.length + vProps.length + vCaravans.length + vStunts.length;

      return {
        vendorId: v.id,
        vendorName: v.name,
        vendorStatus: v.status,
        vendorCategory: v.category,
        poCount: vPos.length,
        poCommitment,
        expenseCount,
        expenseCommitted,
        totalPaid,
        totalOutstanding,
        reconciliationExceptions: 0,
      };
    });
  }, [vendors, purchaseOrders, rentalRecords, rentalPayments, propItems, caravans, stuntEquipment, projectId]);
}

// ─── Vendor Transaction Ledger ───────────────────────────────────────────────

export interface VendorTransaction {
  id: string;
  vendorId: string;
  vendorName: string;
  projectId: string;
  projectName: string;
  department: string;
  transactionType: string;
  poNumber: string;
  reference: string;
  description: string;
  amount: number;
  currency: CurrencyCode;
  inrAmount: number;
  paymentStatus: string;
  transactionDate: string;
  sourceType: string;
  sourceId: string;
}

export function useVendorTransactions(vendorId?: string, projectId?: string): VendorTransaction[] {
  const vendors = useAppDataSlice("rentalVendors");
  const projects = useAppDataSlice("projects");
  const purchaseOrders = useAppDataSlice("purchaseOrders");
  const rentalRecords = useAppDataSlice("rentalRecords");
  const rentalPayments = useAppDataSlice("rentalPayments");
  const propItems = useAppDataSlice("propItems");
  const caravans = useAppDataSlice("caravans");
  const stuntEquipment = useAppDataSlice("stuntEquipment");

  return useMemo(() => {
    const vendorMap = new Map(vendors.map((v) => [v.id, v.name]));
    const projMap = new Map(projects.map((p: any) => [p.id, p.title]));
    const vName = (vid: string) => vendorMap.get(vid) ?? vid;
    const pName = (pid: string) => projMap.get(pid) ?? (pid || "Company");
    const items: VendorTransaction[] = [];

    const filterV = <T extends { vendorId?: string }>(arr: T[]) =>
      vendorId ? arr.filter((r) => r.vendorId === vendorId) : arr;
    const filterP = <T extends { projectId?: string }>(arr: T[]) =>
      projectId ? arr.filter((r) => r.projectId === projectId) : arr;

    // POs
    filterP(filterV(purchaseOrders)).forEach((po) => {
      items.push({
        id: `vt-po-${po.id}`,
        vendorId: po.vendorId,
        vendorName: vName(po.vendorId),
        projectId: po.projectId,
        projectName: pName(po.projectId),
        department: po.department,
        transactionType: "Purchase Order",
        poNumber: po.poNumber,
        reference: po.poNumber,
        description: po.title,
        amount: po.grandTotal,
        currency: po.currency,
        inrAmount: po.inrTotal,
        paymentStatus: po.status,
        transactionDate: po.poDate,
        sourceType: "purchaseOrder",
        sourceId: po.id,
      });
    });

    // Rentals
    filterP(filterV(rentalRecords as any[])).forEach((r: any) => {
      const payments = rentalPayments.filter((rp: any) => rp.rentalId === r.id);
      const paid = payments.filter((p: any) => !p.isDeposit).reduce((s: number, p: any) => s + (p.amount || 0), 0);
      const status = r.status === "cancelled" ? "cancelled" : paid >= r.totalRentalCost ? "paid" : paid > 0 ? "partial" : "pending";
      items.push({
        id: `vt-rental-${r.id}`,
        vendorId: r.vendorId,
        vendorName: vName(r.vendorId),
        projectId: r.projectId,
        projectName: pName(r.projectId),
        department: "equipment-rental",
        transactionType: "Rental",
        poNumber: "",
        reference: r.id,
        description: `${r.equipmentName || r.description || r.id}`,
        amount: r.totalRentalCost || 0,
        currency: "INR" as CurrencyCode,
        inrAmount: r.totalRentalCost || 0,
        paymentStatus: status,
        transactionDate: r.startDate || r.createdAt?.slice(0, 10) || "",
        sourceType: "rental",
        sourceId: r.id,
      });
    });

    // Props
    filterP(filterV(propItems as any[])).forEach((p: any) => {
      items.push({
        id: `vt-prop-${p.id}`,
        vendorId: p.vendorId || "",
        vendorName: p.vendorId ? vName(p.vendorId) : "Unknown",
        projectId: p.projectId || "",
        projectName: pName(p.projectId || ""),
        department: "props",
        transactionType: "Prop Purchase",
        poNumber: "",
        reference: p.id,
        description: p.name || p.id,
        amount: p.purchaseCost || 0,
        currency: "INR" as CurrencyCode,
        inrAmount: p.purchaseCost || 0,
        paymentStatus: "committed",
        transactionDate: p.purchaseDate || p.createdAt?.slice(0, 10) || "",
        sourceType: "prop",
        sourceId: p.id,
      });
    });

    // Caravans
    filterP(filterV(caravans as any[])).forEach((c: any) => {
      const status = c.depositPaid > 0 ? "partial" : "pending";
      items.push({
        id: `vt-caravan-${c.id}`,
        vendorId: c.vendorId || "",
        vendorName: c.vendorId ? vName(c.vendorId) : "Unknown",
        projectId: c.projectId || "",
        projectName: pName(c.projectId || ""),
        department: "vehicle-caravan",
        transactionType: "Caravan Rental",
        poNumber: "",
        reference: c.id,
        description: c.name || c.description || c.id,
        amount: c.totalRentalCost || 0,
        currency: "INR" as CurrencyCode,
        inrAmount: c.totalRentalCost || 0,
        paymentStatus: status,
        transactionDate: c.startDate || c.createdAt?.slice(0, 10) || "",
        sourceType: "caravan",
        sourceId: c.id,
      });
    });

    // Stunt Equipment
    filterP(filterV(stuntEquipment as any[])).forEach((s: any) => {
      items.push({
        id: `vt-stunt-${s.id}`,
        vendorId: s.vendorId || "",
        vendorName: s.vendorId ? vName(s.vendorId) : "Unknown",
        projectId: s.projectId || "",
        projectName: pName(s.projectId || ""),
        department: "stunt-equipment",
        transactionType: "Stunt Equipment",
        poNumber: "",
        reference: s.id,
        description: s.name || s.id,
        amount: s.purchaseCost || 0,
        currency: "INR" as CurrencyCode,
        inrAmount: s.purchaseCost || 0,
        paymentStatus: "committed",
        transactionDate: s.purchaseDate || s.createdAt?.slice(0, 10) || "",
        sourceType: "stuntEquipment",
        sourceId: s.id,
      });
    });

    items.sort((a, b) => (b.transactionDate || "").localeCompare(a.transactionDate || ""));
    return items;
  }, [vendors, projects, purchaseOrders, rentalRecords, rentalPayments, propItems, caravans, stuntEquipment, vendorId, projectId]);
}

// ─── Vendor Reconciliation ───────────────────────────────────────────────────

export type ReconciliationSeverity = "info" | "warning" | "error";
export type ReconciliationStatus = "open" | "resolved" | "dismissed";

export interface ReconciliationException {
  id: string;
  vendorId: string;
  vendorName: string;
  category: string;
  severity: ReconciliationSeverity;
  title: string;
  description: string;
  sourceRecords: { type: string; id: string; reference: string }[];
  amountDiscrepancy?: number;
  projectId: string;
  status: ReconciliationStatus;
  resolutionHistory: ReconciliationResolution[];
  detectedAt: string;
}

export interface ReconciliationResolution {
  action: string;
  reason: string;
  resolvedBy: string;
  resolvedAt: string;
}

export function useVendorReconciliation(projectId?: string): ReconciliationException[] {
  const vendors = useAppDataSlice("rentalVendors");
  const purchaseOrders = useAppDataSlice("purchaseOrders");
  const rentalRecords = useAppDataSlice("rentalRecords");
  const rentalPayments = useAppDataSlice("rentalPayments");
  const propItems = useAppDataSlice("propItems");
  const caravans = useAppDataSlice("caravans");
  const stuntEquipment = useAppDataSlice("stuntEquipment");
  const reconciliationExceptions = useAppDataSlice("reconciliationExceptions") as ReconciliationException[] | undefined;

  return useMemo(() => {
    const stored = reconciliationExceptions ?? [];
    const vendorMap = new Map(vendors.map((v) => [v.id, v]));
    const vName = (vid: string) => vendorMap.get(vid)?.name ?? vid;
    const exceptions: ReconciliationException[] = [...stored];
    const existingIds = new Set(stored.map((e) => e.id));

    const filterP = <T extends { projectId?: string }>(arr: T[]) =>
      projectId ? arr.filter((r) => r.projectId === projectId) : arr;

    const pos = filterP(purchaseOrders);
    const rentals = filterP(rentalRecords as any[]);
    const props = filterP(propItems as any[]);
    const cvns = filterP(caravans as any[]);
    const stunts = filterP(stuntEquipment as any[]);

    // 1. PO without associated expense records for the same vendor
    pos.filter((po) => PO_COMMITTED_STATUSES.includes(po.status)).forEach((po) => {
      const vid = po.vendorId;
      const hasRental = rentals.some((r: any) => r.vendorId === vid && r.projectId === po.projectId);
      const hasProp = props.some((p: any) => p.vendorId === vid && p.projectId === po.projectId);
      const hasCaravan = cvns.some((c: any) => c.vendorId === vid && c.projectId === po.projectId);
      const hasStunt = stunts.some((s: any) => s.vendorId === vid && s.projectId === po.projectId);
      if (!hasRental && !hasProp && !hasCaravan && !hasStunt) {
        const id = `recon-po-no-expense-${po.id}`;
        if (!existingIds.has(id)) {
          exceptions.push({
            id,
            vendorId: vid,
            vendorName: vName(vid),
            category: "po-without-expense",
            severity: "info",
            title: `PO ${po.poNumber} has no linked expense records`,
            description: `Approved PO for vendor ${vName(vid)} in project ${po.projectId} — no matching rental, prop, caravan or stunt records found. May be awaiting fulfilment or invoicing.`,
            sourceRecords: [{ type: "purchaseOrder", id: po.id, reference: po.poNumber }],
            projectId: po.projectId,
            status: "open",
            resolutionHistory: [],
            detectedAt: new Date().toISOString(),
          });
        }
      }
    });

    // 2. Expense without PO for same vendor+project
    [...rentals, ...props, ...cvns, ...stunts].forEach((rec: any) => {
      if (!rec.vendorId) return;
      const vid = rec.vendorId;
      const pid = rec.projectId;
      const hasPO = pos.some((po) => po.vendorId === vid && po.projectId === pid);
      if (!hasPO) {
        const id = `recon-expense-no-po-${rec.id}`;
        if (!existingIds.has(id)) {
          exceptions.push({
            id,
            vendorId: vid,
            vendorName: vName(vid),
            category: "expense-without-po",
            severity: "info",
            title: `Expense ${rec.id} has no matching PO`,
            description: `Record for vendor ${vName(vid)} in project ${pid} has no purchase order. This may be legitimate for direct expenses.`,
            sourceRecords: [{ type: "expense", id: rec.id, reference: rec.id }],
            projectId: pid || "",
            status: "open",
            resolutionHistory: [],
            detectedAt: new Date().toISOString(),
          });
        }
      }
    });

    // 3. Payment exceeding committed amount (rental overpayment)
    rentals.forEach((r: any) => {
      if (!r.vendorId || r.status === "cancelled") return;
      const payments = rentalPayments.filter((rp: any) => rp.rentalId === r.id);
      const totalPaid = payments.reduce((s: number, rp: any) => s + (rp.amount || 0), 0);
      if (totalPaid > (r.totalRentalCost || 0) * 1.01) {
        const id = `recon-overpayment-${r.id}`;
        if (!existingIds.has(id)) {
          exceptions.push({
            id,
            vendorId: r.vendorId,
            vendorName: vName(r.vendorId),
            category: "payment-exceeds-committed",
            severity: "warning",
            title: `Overpayment on rental ${r.id}`,
            description: `Total paid ₹${totalPaid.toLocaleString("en-IN")} exceeds committed ₹${(r.totalRentalCost || 0).toLocaleString("en-IN")} for vendor ${vName(r.vendorId)}.`,
            sourceRecords: [
              { type: "rental", id: r.id, reference: r.id },
              ...payments.map((p: any) => ({ type: "payment", id: p.id, reference: p.id })),
            ],
            amountDiscrepancy: totalPaid - (r.totalRentalCost || 0),
            projectId: r.projectId || "",
            status: "open",
            resolutionHistory: [],
            detectedAt: new Date().toISOString(),
          });
        }
      }
    });

    // 4. Inactive vendor with active POs
    pos.filter((po) => !["cancelled", "rejected", "fulfilled"].includes(po.status)).forEach((po) => {
      const vendor = vendorMap.get(po.vendorId);
      if (vendor && vendor.status === "inactive") {
        const id = `recon-inactive-vendor-${po.id}`;
        if (!existingIds.has(id)) {
          exceptions.push({
            id,
            vendorId: po.vendorId,
            vendorName: vName(po.vendorId),
            category: "inactive-vendor-active-transaction",
            severity: "warning",
            title: `Inactive vendor has active PO ${po.poNumber}`,
            description: `Vendor ${vName(po.vendorId)} is inactive but has PO ${po.poNumber} in status "${po.status}".`,
            sourceRecords: [{ type: "purchaseOrder", id: po.id, reference: po.poNumber }],
            projectId: po.projectId,
            status: "open",
            resolutionHistory: [],
            detectedAt: new Date().toISOString(),
          });
        }
      }
    });

    // 5. Duplicate vendor references (same vendor ID in different source records for same project with similar amounts)
    const vendorProjectPairs = new Map<string, { type: string; id: string; amount: number }[]>();
    [...rentals, ...props, ...cvns, ...stunts].forEach((rec: any) => {
      if (!rec.vendorId) return;
      const key = `${rec.vendorId}:${rec.projectId}`;
      if (!vendorProjectPairs.has(key)) vendorProjectPairs.set(key, []);
      vendorProjectPairs.get(key)!.push({
        type: rec.totalRentalCost !== undefined ? "rental" : rec.purchaseCost !== undefined ? "purchase" : "other",
        id: rec.id,
        amount: rec.totalRentalCost || rec.purchaseCost || 0,
      });
    });

    return exceptions;
  }, [vendors, purchaseOrders, rentalRecords, rentalPayments, propItems, caravans, stuntEquipment, reconciliationExceptions, projectId]);
}

// ─── Reconciliation Actions ──────────────────────────────────────────────────

export function resolveException(exceptionId: string, action: string, reason: string, resolvedBy: string): boolean {
  if (!reason.trim()) return false;
  const exceptions = getAppDataSlice("reconciliationExceptions") as ReconciliationException[] | undefined;
  const list = exceptions ?? [];
  const ex = list.find((e) => e.id === exceptionId);
  if (!ex || ex.status !== "open") return false;

  const resolution: ReconciliationResolution = {
    action,
    reason: reason.trim(),
    resolvedBy,
    resolvedAt: new Date().toISOString(),
  };

  updateAppDataSlice("reconciliationExceptions", (prev: any[]) =>
    prev.map((e: any) =>
      e.id === exceptionId
        ? { ...e, status: "resolved" as ReconciliationStatus, resolutionHistory: [...e.resolutionHistory, resolution] }
        : e,
    ),
  );
  return true;
}

export function dismissException(exceptionId: string, reason: string, dismissedBy: string): boolean {
  if (!reason.trim()) return false;
  const exceptions = getAppDataSlice("reconciliationExceptions") as ReconciliationException[] | undefined;
  const list = exceptions ?? [];
  const ex = list.find((e) => e.id === exceptionId);
  if (!ex || ex.status !== "open") return false;

  const resolution: ReconciliationResolution = {
    action: "dismissed",
    reason: reason.trim(),
    resolvedBy: dismissedBy,
    resolvedAt: new Date().toISOString(),
  };

  updateAppDataSlice("reconciliationExceptions", (prev: any[]) =>
    prev.map((e: any) =>
      e.id === exceptionId
        ? { ...e, status: "dismissed" as ReconciliationStatus, resolutionHistory: [...e.resolutionHistory, resolution] }
        : e,
    ),
  );
  return true;
}

// ─── Vendor Dashboard Aggregation ────────────────────────────────────────────

export interface VendorDashboard {
  totalVendors: number;
  activeVendors: number;
  inactiveVendors: number;
  totalPOCommitment: number;
  totalExpenseCommitted: number;
  totalPaid: number;
  totalOutstanding: number;
  openExceptions: number;
  resolvedExceptions: number;
}

export function useVendorDashboard(projectId?: string): VendorDashboard {
  const financials = useVendorFinancials(projectId);
  const exceptions = useVendorReconciliation(projectId);

  return useMemo(() => {
    const active = financials.filter((f) => f.vendorStatus === "active");
    const inactive = financials.filter((f) => f.vendorStatus === "inactive");
    return {
      totalVendors: financials.length,
      activeVendors: active.length,
      inactiveVendors: inactive.length,
      totalPOCommitment: financials.reduce((s, f) => s + f.poCommitment, 0),
      totalExpenseCommitted: financials.reduce((s, f) => s + f.expenseCommitted, 0),
      totalPaid: financials.reduce((s, f) => s + f.totalPaid, 0),
      totalOutstanding: financials.reduce((s, f) => s + f.totalOutstanding, 0),
      openExceptions: exceptions.filter((e) => e.status === "open").length,
      resolvedExceptions: exceptions.filter((e) => e.status === "resolved" || e.status === "dismissed").length,
    };
  }, [financials, exceptions]);
}
