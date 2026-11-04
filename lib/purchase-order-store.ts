import { useAppDataSlice, getAppDataSlice, updateAppDataSlice } from "./app-data-store";
import type {
  PurchaseOrder,
  POStatus,
  POLineItem,
  POApprovalRecord,
  POAmendment,
  POFulfilment,
  CurrencyCode,
} from "./types";
import { useMemo } from "react";

// ─── Status Workflow ───────────────────────────────────────────────────────

const PO_APPROVAL_FLOW: POStatus[] = [
  "draft",
  "submitted",
  "dept-approved",
  "finance-approved",
  "producer-approved",
];

const PO_APPROVABLE: POStatus[] = ["submitted", "dept-approved", "finance-approved"];

function poNextApprovalStatus(current: POStatus): POStatus {
  const idx = PO_APPROVAL_FLOW.indexOf(current);
  return idx >= 0 && idx < PO_APPROVAL_FLOW.length - 1
    ? PO_APPROVAL_FLOW[idx + 1]
    : current;
}

function poLevelForStatus(status: POStatus): string {
  if (status === "submitted") return "department-head";
  if (status === "dept-approved") return "finance";
  return "producer";
}

// ─── CRUD ──────────────────────────────────────────────────────────────────

export interface CreatePOInput {
  title: string;
  vendorId: string;
  projectId: string;
  department: string;
  expectedDeliveryDate: string;
  currency: CurrencyCode;
  exchangeRate: number;
  paymentTerms: string;
  deliveryAddress: string;
  billingAddress: string;
  contactPerson: string;
  notes: string;
  termsAndConditions: string;
  lineItems: Omit<POLineItem, "id" | "fulfilledQty">[];
  linkedSourceType?: string;
  linkedSourceId?: string;
  createdBy: string;
}

function generatePONumber(projectId: string): string {
  const existing = getAppDataSlice("purchaseOrders");
  const projectPOs = existing.filter((po) => po.projectId === projectId);
  const seq = projectPOs.length + 1;
  return `PO-${projectId.toUpperCase()}-${String(seq).padStart(4, "0")}`;
}

function validateLineItemInputs(item: { quantity: number; unitPrice: number; discount: number; taxPercent: number }): boolean {
  if (!Number.isFinite(item.quantity) || item.quantity <= 0) return false;
  if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0) return false;
  if (!Number.isFinite(item.discount) || item.discount < 0 || item.discount > 100) return false;
  if (!Number.isFinite(item.taxPercent) || item.taxPercent < 0) return false;
  return true;
}

function computeLineItem(
  item: Omit<POLineItem, "id" | "fulfilledQty" | "lineSubtotal" | "lineTax" | "lineTotal">,
  id: string,
): POLineItem | null {
  if (!validateLineItemInputs(item)) return null;
  const gross = item.quantity * item.unitPrice;
  const discountAmount = gross * (item.discount / 100);
  const lineSubtotal = gross - discountAmount;
  const lineTax = lineSubtotal * (item.taxPercent / 100);
  const lineTotal = Math.round((lineSubtotal + lineTax) * 100) / 100;
  return { ...item, id, lineSubtotal: Math.round(lineSubtotal * 100) / 100, lineTax: Math.round(lineTax * 100) / 100, lineTotal, fulfilledQty: 0 };
}

export function createPurchaseOrder(input: CreatePOInput): string | null {
  if (!input.title.trim() || !input.vendorId || !input.projectId || !input.department) return null;
  if (!input.lineItems.length) return null;

  const now = new Date().toISOString();
  const id = `po-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const poNumber = generatePONumber(input.projectId);

  const computed = input.lineItems.map((li, i) =>
    computeLineItem(li as any, `${id}-li-${i + 1}`),
  );
  if (computed.some((c) => c === null)) return null;
  const lineItems = computed as POLineItem[];

  const exchangeRate = Number.isFinite(input.exchangeRate) && input.exchangeRate > 0 ? input.exchangeRate : 1;
  const subtotal = lineItems.reduce((s, li) => s + li.lineSubtotal, 0);
  const totalDiscount = lineItems.reduce((s, li) => s + (li.quantity * li.unitPrice - li.lineSubtotal), 0);
  const totalTax = lineItems.reduce((s, li) => s + li.lineTax, 0);
  const grandTotal = lineItems.reduce((s, li) => s + li.lineTotal, 0);
  const inrTotal = Math.round(grandTotal * exchangeRate * 100) / 100;

  const po: PurchaseOrder = {
    id,
    poNumber,
    title: input.title.trim(),
    vendorId: input.vendorId,
    projectId: input.projectId,
    department: input.department,
    poDate: now.slice(0, 10),
    expectedDeliveryDate: input.expectedDeliveryDate,
    currency: input.currency,
    exchangeRate,
    paymentTerms: input.paymentTerms,
    deliveryAddress: input.deliveryAddress,
    billingAddress: input.billingAddress,
    contactPerson: input.contactPerson,
    notes: input.notes,
    termsAndConditions: input.termsAndConditions,
    lineItems,
    subtotal,
    totalDiscount,
    totalTax,
    grandTotal,
    inrTotal,
    status: "draft",
    approvalHistory: [],
    amendments: [],
    fulfilments: [],
    linkedSourceType: input.linkedSourceType,
    linkedSourceId: input.linkedSourceId,
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
  };

  updateAppDataSlice("purchaseOrders", (prev) => [...prev, po]);
  return id;
}

export function updateDraftPO(
  poId: string,
  updates: Partial<Pick<PurchaseOrder, "title" | "vendorId" | "expectedDeliveryDate" | "paymentTerms" | "deliveryAddress" | "billingAddress" | "contactPerson" | "notes" | "termsAndConditions">>,
) {
  const now = new Date().toISOString();
  updateAppDataSlice("purchaseOrders", (prev) =>
    prev.map((po) =>
      po.id === poId && po.status === "draft"
        ? { ...po, ...updates, updatedAt: now }
        : po,
    ),
  );
}

export function updatePOLineItems(poId: string, lineItems: POLineItem[]) {
  const now = new Date().toISOString();
  updateAppDataSlice("purchaseOrders", (prev) =>
    prev.map((po) => {
      if (po.id !== poId || po.status !== "draft") return po;
      const subtotal = lineItems.reduce((s, li) => s + li.lineSubtotal, 0);
      const totalDiscount = lineItems.reduce((s, li) => s + (li.quantity * li.unitPrice - li.lineSubtotal), 0);
      const totalTax = lineItems.reduce((s, li) => s + li.lineTax, 0);
      const grandTotal = lineItems.reduce((s, li) => s + li.lineTotal, 0);
      const inrTotal = Math.round(grandTotal * po.exchangeRate * 100) / 100;
      return { ...po, lineItems, subtotal, totalDiscount, totalTax, grandTotal, inrTotal, updatedAt: now };
    }),
  );
}

export function deletePO(poId: string): boolean {
  const pos = getAppDataSlice("purchaseOrders");
  const po = pos.find((p) => p.id === poId);
  if (!po || po.status !== "draft") return false;
  updateAppDataSlice("purchaseOrders", (prev) => prev.filter((p) => p.id !== poId));
  return true;
}

// ─── Approval Workflow ─────────────────────────────────────────────────────

export function submitPO(poId: string) {
  const now = new Date().toISOString();
  updateAppDataSlice("purchaseOrders", (prev) =>
    prev.map((po) =>
      po.id === poId && po.status === "draft"
        ? { ...po, status: "submitted" as POStatus, updatedAt: now }
        : po,
    ),
  );
}

export function approvePO(poId: string, approverName: string, comments: string) {
  const now = new Date().toISOString();
  updateAppDataSlice("purchaseOrders", (prev) =>
    prev.map((po) => {
      if (po.id !== poId || !PO_APPROVABLE.includes(po.status)) return po;
      const level = poLevelForStatus(po.status);
      const newStatus = poNextApprovalStatus(po.status);
      const record: POApprovalRecord = {
        level,
        approverName,
        decision: "approved",
        comments,
        decisionDate: now,
        previousStatus: po.status,
        newStatus,
      };
      return {
        ...po,
        status: newStatus,
        approvalHistory: [...po.approvalHistory, record],
        updatedAt: now,
      };
    }),
  );
}

export function rejectPO(poId: string, approverName: string, comments: string) {
  if (!comments.trim()) return;
  const now = new Date().toISOString();
  updateAppDataSlice("purchaseOrders", (prev) =>
    prev.map((po) => {
      if (po.id !== poId || !PO_APPROVABLE.includes(po.status)) return po;
      const level = poLevelForStatus(po.status);
      const record: POApprovalRecord = {
        level,
        approverName,
        decision: "rejected",
        comments,
        decisionDate: now,
        previousStatus: po.status,
        newStatus: "rejected",
      };
      return {
        ...po,
        status: "rejected" as POStatus,
        approvalHistory: [...po.approvalHistory, record],
        updatedAt: now,
      };
    }),
  );
}

export function returnPO(poId: string, approverName: string, comments: string) {
  if (!comments.trim()) return;
  const now = new Date().toISOString();
  updateAppDataSlice("purchaseOrders", (prev) =>
    prev.map((po) => {
      if (po.id !== poId || !PO_APPROVABLE.includes(po.status)) return po;
      const level = poLevelForStatus(po.status);
      const record: POApprovalRecord = {
        level,
        approverName,
        decision: "returned",
        comments,
        decisionDate: now,
        previousStatus: po.status,
        newStatus: "returned",
      };
      return {
        ...po,
        status: "returned" as POStatus,
        approvalHistory: [...po.approvalHistory, record],
        updatedAt: now,
      };
    }),
  );
}

export function resubmitPO(poId: string) {
  const now = new Date().toISOString();
  updateAppDataSlice("purchaseOrders", (prev) =>
    prev.map((po) =>
      po.id === poId && po.status === "returned"
        ? { ...po, status: "draft" as POStatus, updatedAt: now }
        : po,
    ),
  );
}

export function cancelPO(poId: string, reason: string) {
  if (!reason.trim()) return;
  const now = new Date().toISOString();
  const cancelable: POStatus[] = ["draft", "submitted", "dept-approved", "finance-approved", "producer-approved"];
  updateAppDataSlice("purchaseOrders", (prev) =>
    prev.map((po) => {
      if (po.id !== poId || !cancelable.includes(po.status)) return po;
      const record: POApprovalRecord = {
        level: "admin",
        approverName: "System",
        decision: "rejected",
        comments: `Cancelled: ${reason}`,
        decisionDate: now,
        previousStatus: po.status,
        newStatus: "cancelled",
      };
      return {
        ...po,
        status: "cancelled" as POStatus,
        approvalHistory: [...po.approvalHistory, record],
        updatedAt: now,
      };
    }),
  );
}

// ─── Amendments ────────────────────────────────────────────────────────────

export function createPOAmendment(
  poId: string,
  reason: string,
  revisedLineItems: POLineItem[],
  requestedBy: string,
): boolean {
  const pos = getAppDataSlice("purchaseOrders");
  const po = pos.find((p) => p.id === poId);
  if (!po || po.status !== "producer-approved") return false;
  if (!reason.trim()) return false;

  const revisedTotal = revisedLineItems.reduce((s, li) => s + li.lineTotal, 0);
  const originalTotal = po.grandTotal;

  const amendment: POAmendment = {
    id: `amd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    reason: reason.trim(),
    originalAmount: originalTotal,
    revisedAmount: revisedTotal,
    difference: revisedTotal - originalTotal,
    requestedBy,
    status: "draft",
    approvalHistory: [],
    createdAt: new Date().toISOString(),
  };

  const now = new Date().toISOString();
  updateAppDataSlice("purchaseOrders", (prev) =>
    prev.map((p) =>
      p.id === poId
        ? { ...p, amendments: [...p.amendments, amendment], updatedAt: now }
        : p,
    ),
  );
  return true;
}

export function approveAmendment(poId: string, amendmentId: string, approverName: string, comments: string) {
  const now = new Date().toISOString();
  updateAppDataSlice("purchaseOrders", (prev) =>
    prev.map((po) => {
      if (po.id !== poId) return po;
      const amendments = po.amendments.map((amd) => {
        if (amd.id !== amendmentId || amd.status !== "submitted") return amd;
        const record: POApprovalRecord = {
          level: "producer",
          approverName,
          decision: "approved",
          comments,
          decisionDate: now,
          previousStatus: po.status,
          newStatus: po.status,
        };
        return { ...amd, status: "approved" as const, approvalHistory: [...amd.approvalHistory, record] };
      });
      const approved = amendments.find((a) => a.id === amendmentId && a.status === "approved");
      if (!approved) return { ...po, amendments, updatedAt: now };
      const newGrandTotal = approved.revisedAmount;
      const inrTotal = newGrandTotal * po.exchangeRate;
      return { ...po, amendments, grandTotal: newGrandTotal, inrTotal, updatedAt: now };
    }),
  );
}

// ─── Fulfilment ────────────────────────────────────────────────────────────

export function recordFulfilment(
  poId: string,
  lineItemId: string,
  quantity: number,
  receivedBy: string,
  deliveryReference: string,
  notes: string,
): boolean {
  const pos = getAppDataSlice("purchaseOrders");
  const po = pos.find((p) => p.id === poId);
  if (!po) return false;
  const fulfillable: POStatus[] = ["producer-approved", "partially-fulfilled"];
  if (!fulfillable.includes(po.status)) return false;

  const li = po.lineItems.find((l) => l.id === lineItemId);
  if (!li) return false;
  if (!Number.isFinite(quantity) || quantity <= 0) return false;
  if (li.fulfilledQty + quantity > li.quantity) return false;

  const fulfilment: POFulfilment = {
    id: `ful-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    lineItemId,
    quantity,
    deliveryDate: new Date().toISOString().slice(0, 10),
    receivedBy,
    deliveryReference,
    notes,
    createdAt: new Date().toISOString(),
  };

  const now = new Date().toISOString();
  updateAppDataSlice("purchaseOrders", (prev) =>
    prev.map((p) => {
      if (p.id !== poId) return p;
      const updatedItems = p.lineItems.map((item) =>
        item.id === lineItemId
          ? { ...item, fulfilledQty: item.fulfilledQty + quantity }
          : item,
      );
      const allFulfilled = updatedItems.every((item) => item.fulfilledQty >= item.quantity);
      const anyFulfilled = updatedItems.some((item) => item.fulfilledQty > 0);
      let newStatus: POStatus = p.status;
      if (allFulfilled) newStatus = "fulfilled";
      else if (anyFulfilled) newStatus = "partially-fulfilled";
      return {
        ...p,
        lineItems: updatedItems,
        fulfilments: [...p.fulfilments, fulfilment],
        status: newStatus,
        updatedAt: now,
      };
    }),
  );
  return true;
}

// ─── Hooks ─────────────────────────────────────────────────────────────────

export function usePurchaseOrders(projectId?: string) {
  const pos = useAppDataSlice("purchaseOrders");
  return useMemo(() => {
    const filtered = projectId ? pos.filter((po) => po.projectId === projectId) : pos;
    return filtered;
  }, [pos, projectId]);
}

export interface PODashboardSummary {
  total: number;
  totalINR: number;
  byStatus: Record<POStatus, { count: number; inrTotal: number }>;
  byDepartment: { department: string; count: number; inrTotal: number }[];
  byProject: { projectId: string; count: number; inrTotal: number }[];
  pendingApproval: number;
  poCommitment: number;
}

const ALL_PO_STATUSES: POStatus[] = [
  "draft", "submitted", "dept-approved", "finance-approved", "producer-approved",
  "rejected", "returned", "partially-fulfilled", "fulfilled", "cancelled",
];

const COMMITTED_STATUSES: POStatus[] = [
  "producer-approved", "partially-fulfilled", "fulfilled",
];

export function usePODashboard(projectId?: string): PODashboardSummary {
  const allPOs = useAppDataSlice("purchaseOrders");

  return useMemo(() => {
    const pos = projectId ? allPOs.filter((po) => po.projectId === projectId) : allPOs;

    const byStatus = Object.fromEntries(
      ALL_PO_STATUSES.map((s) => [s, { count: 0, inrTotal: 0 }]),
    ) as Record<POStatus, { count: number; inrTotal: number }>;

    let totalINR = 0;
    let pendingApproval = 0;
    let poCommitment = 0;

    for (const po of pos) {
      totalINR += po.inrTotal;
      byStatus[po.status].count++;
      byStatus[po.status].inrTotal += po.inrTotal;
      if (PO_APPROVABLE.includes(po.status)) pendingApproval++;
      if (COMMITTED_STATUSES.includes(po.status)) poCommitment += po.inrTotal;
    }

    const deptMap = new Map<string, { count: number; inrTotal: number }>();
    const projMap = new Map<string, { count: number; inrTotal: number }>();

    for (const po of pos) {
      const d = deptMap.get(po.department) ?? { count: 0, inrTotal: 0 };
      d.count++;
      d.inrTotal += po.inrTotal;
      deptMap.set(po.department, d);

      const p = projMap.get(po.projectId) ?? { count: 0, inrTotal: 0 };
      p.count++;
      p.inrTotal += po.inrTotal;
      projMap.set(po.projectId, p);
    }

    return {
      total: pos.length,
      totalINR,
      byStatus,
      byDepartment: [...deptMap.entries()].map(([department, v]) => ({ department, ...v })),
      byProject: [...projMap.entries()].map(([projectId, v]) => ({ projectId, ...v })),
      pendingApproval,
      poCommitment,
    };
  }, [allPOs, projectId]);
}
