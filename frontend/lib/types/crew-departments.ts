// ─── Crew Departments (Production Crew Module) ─────────────────────────────

export type CrewDeptKey =
  | "writing-direction"
  | "daily-production"
  | "camera-lights"
  | "locations"
  | "art-props"
  | "costume-makeup"
  | "vehicles"
  | "action-stunts"
  | "production-office";

export interface CrewDeptInfo {
  key: CrewDeptKey;
  name: string;
  designations: string[];
}

export interface CrewAssignment {
  id: string;
  crewMemberId: string;
  projectId: string;
  department: string;
  designation: string;
  startDate: string;
  endDate?: string;
  status: "active" | "completed" | "on-hold";
  notes?: string;
}

export type RemunerationPeriod = "daily" | "weekly" | "monthly" | "fixed" | "per-project";
export type RemunerationPaymentStatus = "pending" | "partially-paid" | "paid" | "on-hold";

export interface RemunerationAgreement {
  id: string;
  crewMemberId: string;
  projectId: string;
  department: string;
  designation: string;
  period: RemunerationPeriod;
  agreedAmount: number;
  workStartDate: string;
  workEndDate?: string;
  totalPayable: number;
  advancePaid: number;
  notes?: string;
  status: RemunerationPaymentStatus;
  createdAt: string;
}

export interface CrewPaymentRecord {
  id: string;
  agreementId: string;
  crewMemberId: string;
  projectId: string;
  amount: number;
  paymentDate: string;
  paymentReference?: string;
  type: "advance" | "partial" | "full" | "final";
  notes?: string;
  recordedBy: string;
  createdAt: string;
}

// ─── Vendor Management (Rentals Module) ──────────────────────────────────────

export type VendorCategory =
  | "camera-equipment" | "lighting-equipment" | "generator-electrical"
  | "art-set-suppliers" | "props-suppliers" | "costume-suppliers"
  | "makeup-prosthetics" | "location-services" | "hotel-accommodation"
  | "travel-transport" | "vehicle-caravan" | "catering"
  | "general-rental" | "other";

export interface Vendor {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  gstin?: string;
  category: VendorCategory;
  services: string;
  paymentTerms: string;
  bankDetails?: string;
  notes?: string;
  status: "active" | "inactive";
  createdAt: string;
}

// ─── Rental Management ────────────────────────────────────────────────────────

export type RentalCategory =
  | "camera-equipment" | "lenses-accessories" | "lighting-equipment"
  | "generators-electrical" | "grip-equipment" | "art-set-equipment"
  | "props-furniture" | "costumes" | "makeup-prosthetics-equipment"
  | "location-equipment" | "production-office-equipment" | "other";

export type RentalStatus =
  | "requested" | "approved" | "booked" | "issued"
  | "partially-returned" | "returned" | "overdue" | "cancelled";

export type RentalRatePeriod = "daily" | "weekly" | "monthly" | "fixed";

export interface RentalRecord {
  id: string;
  projectId: string;
  vendorId: string;
  category: RentalCategory;
  itemName: string;
  description?: string;
  quantity: number;
  ratePeriod: RentalRatePeriod;
  rateAmount: number;
  rentalStartDate: string;
  expectedReturnDate: string;
  actualReturnDate?: string;
  rentalDays: number;
  subtotal: number;
  deposit: number;
  additionalCharges: number;
  lateFees: number;
  totalRentalCost: number;
  depositForfeited: boolean;
  totalPaid: number;
  status: RentalStatus;
  invoicePlaceholder?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RentalPayment {
  id: string;
  rentalId: string;
  projectId: string;
  vendorId: string;
  amount: number;
  isDeposit: boolean;
  paymentDate: string;
  paymentReference?: string;
  notes?: string;
  recordedBy: string;
  createdAt: string;
}
