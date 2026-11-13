"use client";

import { useMemo } from "react";
import { useModuleSlice, updateModuleSlice, seedModuleSlice } from "./module-store";

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";

export interface Invoice {
  id: string;
  projectId: string;
  invoiceNumber: string;
  vendorId?: string;
  vendorName: string;
  description: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  invoiceDate: string;
  dueDate: string;
  paidDate?: string;
  status: InvoiceStatus;
  department?: string;
  poReference?: string;
  notes?: string;
}

const SEED_INVOICES: Invoice[] = [
  { id: "inv-001", projectId: "p1", invoiceNumber: "INV-2027-001", vendorName: "Arri Rental India", description: "Camera package rental — Alexa Mini LF", amount: 450000, taxAmount: 81000, totalAmount: 531000, invoiceDate: "2027-01-15", dueDate: "2027-02-14", paidDate: "2027-02-10", status: "paid", department: "camera" },
  { id: "inv-002", projectId: "p1", invoiceNumber: "INV-2027-002", vendorName: "Red Chillies VFX", description: "VFX shots batch 1 — 35 shots", amount: 2500000, taxAmount: 450000, totalAmount: 2950000, invoiceDate: "2027-02-01", dueDate: "2027-03-02", status: "sent", department: "vfx" },
  { id: "inv-003", projectId: "p1", invoiceNumber: "INV-2027-003", vendorName: "Soundworks Studio", description: "Dubbing studio — 15 sessions", amount: 300000, taxAmount: 54000, totalAmount: 354000, invoiceDate: "2027-02-15", dueDate: "2027-03-17", status: "overdue", department: "sound" },
  { id: "inv-004", projectId: "p2", invoiceNumber: "INV-2027-004", vendorName: "Prime Focus", description: "DI and color grading", amount: 800000, taxAmount: 144000, totalAmount: 944000, invoiceDate: "2027-01-20", dueDate: "2027-02-19", paidDate: "2027-02-18", status: "paid", department: "editing" },
  { id: "inv-005", projectId: "p1", invoiceNumber: "INV-2027-005", vendorName: "Catering Solutions", description: "Unit catering — January", amount: 180000, taxAmount: 9000, totalAmount: 189000, invoiceDate: "2027-02-01", dueDate: "2027-02-28", status: "draft", department: "production" },
];

export function initInvoiceSeedData() {
  seedModuleSlice("invoices", SEED_INVOICES);
}

export function useInvoices(projectId?: string): Invoice[] {
  const all = useModuleSlice<Invoice>("invoices");
  return useMemo(() => (!projectId ? all : all.filter((i) => i.projectId === projectId)), [all, projectId]);
}

export function useInvoiceDashboard(projectId?: string) {
  const invoices = useInvoices(projectId);
  return useMemo(() => ({
    total: invoices.length,
    totalAmount: invoices.reduce((s, i) => s + i.totalAmount, 0),
    paidAmount: invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.totalAmount, 0),
    pendingAmount: invoices.filter((i) => i.status === "sent" || i.status === "overdue").reduce((s, i) => s + i.totalAmount, 0),
    overdueCount: invoices.filter((i) => i.status === "overdue").length,
    draftCount: invoices.filter((i) => i.status === "draft").length,
  }), [invoices]);
}

export function createInvoice(input: Omit<Invoice, "id">): Invoice {
  const item: Invoice = { id: `inv-${crypto.randomUUID().slice(0, 8)}`, ...input };
  updateModuleSlice<Invoice>("invoices", (items) => [...items, item]);
  return item;
}

export function updateInvoice(id: string, updates: Partial<Omit<Invoice, "id">>): boolean {
  let found = false;
  updateModuleSlice<Invoice>("invoices", (items) =>
    items.map((inv) => {
      if (inv.id === id) { found = true; return { ...inv, ...updates }; }
      return inv;
    })
  );
  return found;
}
