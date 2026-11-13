export type MediaAssetType = "video" | "audio" | "image" | "document" | "other";
export type MediaAssetStatus = "draft" | "registered" | "in-review" | "approved" | "rejected" | "archived";

export interface MediaAsset {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  mediaType: MediaAssetType;
  fileReference?: string;
  shootDayId?: string;
  sceneId?: string;
  locationId?: string;
  castId?: string;
  recordedDate?: string;
  uploadedAt: string;
  status: MediaAssetStatus;
  currentVersion: number;
  tags: string[];
  notes?: string;
  createdBy?: string;
  updatedAt: string;
}

export type MediaVersionStatus = "active" | "superseded" | "rejected";

export interface MediaVersion {
  id: string;
  assetId: string;
  versionNumber: number;
  fileReference?: string;
  notes?: string;
  createdAt: string;
  createdBy?: string;
  status: MediaVersionStatus;
  reviewStatus?: "pending" | "approved" | "rejected";
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}
