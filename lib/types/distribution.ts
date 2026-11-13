export interface DeliverableItem {
  id: string;
  projectId: string;
  name: string;
  format: string;
  territory: string;
  status: "pending" | "in-progress" | "ready" | "delivered";
  dueDate: string;
}

export interface RightsDeal {
  id: string;
  projectId: string;
  territory: string;
  distributor: string;
  rightsType: "theatrical" | "satellite" | "digital" | "audio" | "dubbed" | "remake" | "broadcast" | "ancillary";
  status: "open" | "negotiating" | "signed" | "closed";
  minimumGuarantee: number;
  advanceReceived: number;
  deliveryStatus: "pending" | "partial" | "complete";
}

// ── Distribution A13 Types ──────────────────────────────────────────────────

export type AgreementStatus = "draft" | "negotiating" | "pending-approval" | "active" | "expired" | "terminated" | "cancelled";
export type DistributionChannel = "theatrical" | "satellite" | "digital-ott" | "television" | "audio" | "dubbed" | "remake" | "broadcast" | "ancillary" | "other";
export type ReleaseStatus = "planned" | "confirmed" | "released" | "postponed" | "cancelled";
export type RevenueType = "advance" | "minimum-guarantee" | "royalty" | "commission" | "settlement" | "other";
export type CollectionStatus = "pending" | "partial" | "collected" | "overdue" | "disputed" | "written-off";

export interface DistributionAgreement {
  id: string;
  projectId: string;
  rightsDealId?: string;
  distributorName: string;
  distributorContact?: string;
  channel: DistributionChannel;
  territories: string[];
  agreementValue: number;
  advancePaid: number;
  paymentTerms?: string;
  startDate: string;
  endDate: string;
  status: AgreementStatus;
  documentReference?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DistributionRelease {
  id: string;
  projectId: string;
  agreementId?: string;
  title: string;
  channel: DistributionChannel;
  territory: string;
  plannedDate: string;
  actualDate?: string;
  windowStart?: string;
  windowEnd?: string;
  status: ReleaseStatus;
  notes?: string;
  createdAt: string;
}

export interface DistributionRevenue {
  id: string;
  projectId: string;
  agreementId?: string;
  rightsDealId?: string;
  revenueType: RevenueType;
  amount: number;
  currency?: string;
  territory?: string;
  channel?: DistributionChannel;
  receivedDate?: string;
  dueDate?: string;
  status: CollectionStatus;
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface DistributionSettlement {
  id: string;
  projectId: string;
  agreementId: string;
  grossRevenue: number;
  distributorCommission: number;
  deductions: number;
  netPayable: number;
  settledAmount: number;
  settlementDate?: string;
  status: "pending" | "partial" | "settled" | "disputed";
  notes?: string;
  createdAt: string;
}

export interface MarketingItem {
  id: string;
  projectId: string;
  campaign: string;
  channel: string;
  owner: string;
  launchDate: string;
  status: "planning" | "live" | "completed";
  notes: string;
}

export type AttendanceStatus =
  | "present"
  | "absent"
  | "partial"   // kept for backward compat (legacy = half-day)
  | "half-day"
  | "leave"
  | "on-leave"  // alias
  | "not-required"
  | "unconfirmed";

export interface AttendanceRecord {
  id: string;
  projectId: string;
  personId?: string;
  name: string;
  role: string;
  department: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: AttendanceStatus;
  hoursWorked: number;
  notes?: string;
}

export interface CateringAdjustment {
  id: string;
  projectId: string;
  date: string;
  delta: number;       // positive or negative integer
  reason: string;
  adjustedBy: string;
  createdAt: string;
}

export interface CameraCard {
  id: string;
  projectId: string;
  cardId: string;
  capacity: number;
  available: number;
  format: "RAW" | "ProRes" | "DNxHR" | "H.264";
  shootDate: string;
  status: "active" | "archived" | "corrupted" | "verified";
  shootCount: number;
  backupStatus: "pending" | "in-progress" | "verified" | "failed";
  location: string;
  notes?: string;
}

export interface StorageDevice {
  id: string;
  projectId: string;
  deviceId: string;
  type: "HDD" | "SSD" | "NAS" | "LTO-Tape";
  capacity: number;
  used: number;
  status: "active" | "backup" | "archive" | "failed";
  location: string;
  content: string[];
  lastVerified: string;
  redundancy: boolean;
  temperature?: number;
}

export interface FootageMetadata {
  id: string;
  projectId: string;
  sceneId: string;
  takeNumber: number;
  duration: number;
  format: string;
  resolution: string;
  fps: number;
  codecs: string;
  storedOn: string[];
  status: "raw" | "proxies-ready" | "synced" | "archived";
  notes?: string;
  shootDate: string;
}

export interface SubtitleLanguage {
  id: string;
  projectId: string;
  language: string;
  languageCode: string;
  nativeName: string;
  totalLines: number;
  completedLines: number;
  inProgressLines: number;
  qcStatus: "pending" | "in-progress" | "complete" | "approved";
  translator: string;
  startDate: string;
  deliveryDate: string;
  notes?: string;
  fileSize?: string;
}
