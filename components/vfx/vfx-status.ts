import type { VfxShotStatus } from "@/lib/types";
import type { StatusTone } from "@/components/app/status-badge";

export const vfxStatusTones: Record<VfxShotStatus, StatusTone> = {
  briefed: "neutral",
  "in-progress": "warning",
  "client-review": "info",
  final: "success",
};

export const vfxStatusLabels: Record<VfxShotStatus, string> = {
  briefed: "Briefed",
  "in-progress": "In Progress",
  "client-review": "Client Review",
  final: "Final",
};

export const vfxPriorityTones: Record<"low" | "medium" | "high", StatusTone> = {
  low: "neutral",
  medium: "warning",
  high: "error",
};

export const vfxVersionTones: Record<string, StatusTone> = {
  submitted: "info",
  "in-review": "warning",
  approved: "success",
  rejected: "error",
  superseded: "neutral",
  pending: "warning",
  "revision-required": "warning",
};

export const vfxStatusOrder: VfxShotStatus[] = ["briefed", "in-progress", "client-review", "final"];

export function isOverdue(dueDate: string, status: VfxShotStatus): boolean {
  return status !== "final" && dueDate < new Date().toISOString().slice(0, 10);
}
