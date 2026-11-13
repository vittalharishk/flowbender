export type VfxShotStatus = "briefed" | "in-progress" | "client-review" | "final";

export interface VfxShot {
  id: string;
  projectId: string;
  shotCode: string;
  sequence: string;
  description: string;
  vendorId?: string;
  status: VfxShotStatus;
  priority: "low" | "medium" | "high";
  dueDate: string;
}

export type VfxVersionStatus = "submitted" | "in-review" | "approved" | "rejected" | "superseded";

export interface VfxVersion {
  id: string;
  shotId: string;
  versionNumber: number;
  submittedAt: string;
  submittedBy?: string;
  assetReference?: string;
  notes?: string;
  status: VfxVersionStatus;
  reviewStatus?: "pending" | "approved" | "rejected" | "revision-required";
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  revisionReason?: string;
}

export interface VfxReview {
  id: string;
  shotId: string;
  versionId: string;
  reviewerId?: string;
  reviewerRole?: string;
  decision: "approved" | "rejected" | "revision-required";
  comments?: string;
  createdAt: string;
}
