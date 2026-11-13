import type { StatusTone } from "@/components/app/status-badge";

/** Shared status tone mapping for every media entity (cards, storage, footage). */
export const mediaStatusTones: Record<string, StatusTone> = {
  verified: "success",
  synced: "success",
  active: "info",
  "proxies-ready": "info",
  archived: "neutral",
  pending: "warning",
  "in-progress": "warning",
  raw: "warning",
  backup: "info",
  corrupted: "error",
  failed: "error",
};

export function mediaStatusTone(status: string): StatusTone {
  return mediaStatusTones[status] ?? "neutral";
}

export function formatMediaStatus(status: string): string {
  return status.replace(/-/g, " ");
}
