import type { CurrencyCode } from "./accounts";
import type { PaymentStatus } from "./core";

export interface VendorRecord {
  id: string;
  name: string;
  category: string;
  contactName: string;
  phone: string;
  city: string;
  activeProjects: string[];
  paymentStatus: PaymentStatus;
}

export interface BudgetLineItem {
  id: string;
  projectId: string;
  category: string;
  allocated: number;
  committed: number;
  spent: number;
  notes: string;
}

export interface ExpenseItem {
  id: string;
  projectId: string;
  date: string;
  category: string;
  description: string;
  vendorId?: string;
  amount: number;
  status: "draft" | "approved" | "paid";
}

export interface PayrollEntry {
  id: string;
  projectId: string;
  payeeName: string;
  department: string;
  period: string;
  grossAmount: number;
  paidAmount: number;
  status: PaymentStatus;
  dueDate: string;
}

// ─── Purchase Orders (A5) ─────────────────────────────────────────────────

export type POStatus =
  | "draft"
  | "submitted"
  | "dept-approved"
  | "finance-approved"
  | "producer-approved"
  | "rejected"
  | "returned"
  | "partially-fulfilled"
  | "fulfilled"
  | "cancelled";

export interface POLineItem {
  id: string;
  itemName: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  taxPercent: number;
  lineSubtotal: number;
  lineTax: number;
  lineTotal: number;
  fulfilledQty: number;
}

export interface POApprovalRecord {
  level: string;
  approverName: string;
  decision: "approved" | "rejected" | "returned";
  comments: string;
  decisionDate: string;
  previousStatus: POStatus;
  newStatus: POStatus;
}

export interface POAmendment {
  id: string;
  reason: string;
  originalAmount: number;
  revisedAmount: number;
  difference: number;
  requestedBy: string;
  status: "draft" | "submitted" | "approved" | "rejected";
  approvalHistory: POApprovalRecord[];
  createdAt: string;
}

export interface POFulfilment {
  id: string;
  lineItemId: string;
  quantity: number;
  deliveryDate: string;
  receivedBy: string;
  deliveryReference: string;
  notes: string;
  createdAt: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  title: string;
  vendorId: string;
  projectId: string;
  department: string;
  poDate: string;
  expectedDeliveryDate: string;
  currency: CurrencyCode;
  exchangeRate: number;
  paymentTerms: string;
  deliveryAddress: string;
  billingAddress: string;
  contactPerson: string;
  notes: string;
  termsAndConditions: string;
  lineItems: POLineItem[];
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  grandTotal: number;
  inrTotal: number;
  status: POStatus;
  approvalHistory: POApprovalRecord[];
  amendments: POAmendment[];
  fulfilments: POFulfilment[];
  linkedSourceType?: string;
  linkedSourceId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
