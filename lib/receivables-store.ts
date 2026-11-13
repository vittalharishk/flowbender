"use client";

import { useMemo } from "react";
import { useModuleSlice, updateModuleSlice, seedModuleSlice } from "./module-store";

export interface Receivable {
  id: string;
  projectId: string;
  source: "theatrical" | "satellite" | "digital" | "audio" | "overseas" | "branding" | "music" | "other";
  party: string;
  description?: string;
  agreedAmount: number;
  receivedAmount: number;
  balanceAmount: number;
  dueDate?: string;
  status: "pending" | "partial" | "received" | "overdue" | "disputed" | "written-off";
  invoiceRef?: string;
  notes?: string;
}

export interface ReceivablePayment {
  id: string;
  receivableId: string;
  amount: number;
  paymentDate: string;
  paymentMode: "bank-transfer" | "cheque" | "cash" | "upi" | "dd";
  reference?: string;
  notes?: string;
}

const SEED_RECEIVABLES: Receivable[] = [
  { id: "rcv-1", projectId: "p1", source: "theatrical", party: "Mythri Movie Makers", agreedAmount: 50000000, receivedAmount: 30000000, balanceAmount: 20000000, dueDate: "2027-06-01", status: "partial", description: "AP theatrical rights" },
  { id: "rcv-2", projectId: "p1", source: "satellite", party: "Zee Telugu", agreedAmount: 25000000, receivedAmount: 0, balanceAmount: 25000000, dueDate: "2027-07-01", status: "pending", description: "Telugu satellite rights" },
  { id: "rcv-3", projectId: "p1", source: "digital", party: "Amazon Prime", agreedAmount: 40000000, receivedAmount: 20000000, balanceAmount: 20000000, dueDate: "2027-06-15", status: "partial", description: "Digital streaming rights" },
  { id: "rcv-4", projectId: "p2", source: "theatrical", party: "AA Films", agreedAmount: 80000000, receivedAmount: 80000000, balanceAmount: 0, status: "received", description: "Hindi theatrical rights" },
  { id: "rcv-5", projectId: "p2", source: "audio", party: "T-Series", agreedAmount: 15000000, receivedAmount: 15000000, balanceAmount: 0, status: "received", description: "Audio rights" },
];

const SEED_PAYMENTS: ReceivablePayment[] = [
  { id: "rpay-1", receivableId: "rcv-1", amount: 15000000, paymentDate: "2027-03-01", paymentMode: "bank-transfer", reference: "TXN-001" },
  { id: "rpay-2", receivableId: "rcv-1", amount: 15000000, paymentDate: "2027-04-01", paymentMode: "bank-transfer", reference: "TXN-002" },
  { id: "rpay-3", receivableId: "rcv-3", amount: 20000000, paymentDate: "2027-03-15", paymentMode: "bank-transfer", reference: "TXN-003" },
  { id: "rpay-4", receivableId: "rcv-4", amount: 80000000, paymentDate: "2027-02-15", paymentMode: "bank-transfer", reference: "TXN-004" },
  { id: "rpay-5", receivableId: "rcv-5", amount: 15000000, paymentDate: "2027-01-20", paymentMode: "bank-transfer", reference: "TXN-005" },
];

export function initReceivablesSeedData() {
  seedModuleSlice("receivables", SEED_RECEIVABLES);
  seedModuleSlice("receivablePayments", SEED_PAYMENTS);
}

export function useReceivables(projectId?: string): Receivable[] {
  const all = useModuleSlice<Receivable>("receivables");
  return useMemo(() => !projectId ? all : all.filter((r) => r.projectId === projectId), [all, projectId]);
}

export function useReceivablePayments(receivableId?: string): ReceivablePayment[] {
  const all = useModuleSlice<ReceivablePayment>("receivablePayments");
  return useMemo(() => !receivableId ? all : all.filter((p) => p.receivableId === receivableId), [all, receivableId]);
}

export function useReceivablesSummary(projectId?: string) {
  const receivables = useReceivables(projectId);
  return useMemo(() => {
    const totalAgreed = receivables.reduce((s, r) => s + r.agreedAmount, 0);
    const totalReceived = receivables.reduce((s, r) => s + r.receivedAmount, 0);
    const totalBalance = receivables.reduce((s, r) => s + r.balanceAmount, 0);
    const overdue = receivables.filter((r) => r.status === "overdue").length;
    const bySource = receivables.reduce<Record<string, { agreed: number; received: number }>>((acc, r) => {
      if (!acc[r.source]) acc[r.source] = { agreed: 0, received: 0 };
      acc[r.source].agreed += r.agreedAmount;
      acc[r.source].received += r.receivedAmount;
      return acc;
    }, {});
    return { totalAgreed, totalReceived, totalBalance, overdue, bySource, count: receivables.length };
  }, [receivables]);
}

export function createReceivable(input: Omit<Receivable, "id">): Receivable {
  const item: Receivable = { id: `rcv-${crypto.randomUUID().slice(0, 8)}`, ...input };
  updateModuleSlice<Receivable>("receivables", (items) => [...items, item]);
  return item;
}

export function recordReceivablePayment(input: Omit<ReceivablePayment, "id">): ReceivablePayment {
  const payment: ReceivablePayment = { id: `rpay-${crypto.randomUUID().slice(0, 8)}`, ...input };
  updateModuleSlice<ReceivablePayment>("receivablePayments", (items) => [...items, payment]);
  updateModuleSlice<Receivable>("receivables", (items) =>
    items.map((r) => {
      if (r.id !== input.receivableId) return r;
      const newReceived = r.receivedAmount + input.amount;
      const newBalance = r.agreedAmount - newReceived;
      return { ...r, receivedAmount: newReceived, balanceAmount: Math.max(0, newBalance), status: newBalance <= 0 ? "received" : "partial" };
    })
  );
  return payment;
}
