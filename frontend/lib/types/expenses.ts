// ─── Phase 3: Expenses and Production Office ─────────────────────────────────

export type ExpenseCategoryA =
  | "office-rent" | "office-maintenance" | "electricity" | "internet-telephone"
  | "office-supplies" | "printing-stationery" | "furniture-equipment"
  | "cleaning-housekeeping" | "repairs" | "office-misc";

export type ExpenseCategoryB =
  | "daily-production" | "catering-food" | "local-transportation" | "fuel"
  | "parking-tolls" | "location-expenses" | "accommodation" | "travel"
  | "art-props" | "costume-makeup" | "camera-lighting"
  | "production-staff" | "permissions-licenses" | "emergency" | "production-misc";

export type ExpenseCategory = ExpenseCategoryA | ExpenseCategoryB;

export type ExpenseSection = "production-office" | "production";

export type ExpensePaymentStatus =
  | "draft" | "pending-approval" | "approved" | "partially-paid" | "paid"
  | "rejected" | "cancelled";

export type ExpensePaymentMethod =
  | "cash" | "bank-transfer" | "cheque" | "upi" | "card" | "other";

export interface ProductionExpense {
  id: string;
  projectId: string;
  section: ExpenseSection;
  category: ExpenseCategory;
  subcategory?: string;
  department: string;
  title: string;
  description?: string;
  vendorPayee?: string;
  expenseDate: string;
  dueDate?: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
  taxAmount: number;
  discount: number;
  finalAmount: number;
  totalPaid: number;
  paymentStatus: ExpensePaymentStatus;
  paymentMethod?: ExpensePaymentMethod;
  paymentReference?: string;
  invoiceNumber?: string;
  attachmentPlaceholder?: string;
  createdBy: string;
  notes?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpensePayment {
  id: string;
  expenseId: string;
  projectId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: ExpensePaymentMethod;
  referenceNumber?: string;
  notes?: string;
  recordedBy: string;
  createdAt: string;
}

export type OfficeRentPaymentStatus = "upcoming" | "paid" | "overdue" | "partial";

export interface OfficeRental {
  id: string;
  projectId?: string;
  propertyName: string;
  address: string;
  landlordPayee: string;
  landlordPhone?: string;
  monthlyRent: number;
  securityDeposit: number;
  depositPaid: boolean;
  leaseStartDate: string;
  leaseEndDate: string;
  paymentDueDay: number;
  renewalDate?: string;
  agreementNotes?: string;
  status: "active" | "expired" | "terminated";
  createdAt: string;
}

export interface OfficeRentPayment {
  id: string;
  officeRentalId: string;
  projectId?: string;
  month: string;
  amount: number;
  paymentDate: string;
  paymentMethod: ExpensePaymentMethod;
  referenceNumber?: string;
  notes?: string;
  recordedBy: string;
  createdAt: string;
}

export type MaintenanceCategory =
  | "electrical" | "plumbing" | "air-conditioning" | "furniture"
  | "office-equipment" | "networking-internet" | "cleaning" | "repairs" | "other";

export type MaintenanceStatus =
  | "reported" | "assigned" | "in-progress" | "completed" | "on-hold" | "cancelled";

export type MaintenancePriority = "low" | "medium" | "high" | "urgent";

export interface MaintenanceRecord {
  id: string;
  projectId?: string;
  officeRentalId?: string;
  category: MaintenanceCategory;
  title: string;
  description?: string;
  reportedDate: string;
  assignedTo?: string;
  priority: MaintenancePriority;
  expectedCompletion?: string;
  actualCompletion?: string;
  estimatedCost: number;
  actualCost: number;
  linkedExpenseId?: string;
  status: MaintenanceStatus;
  invoiceReference?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
