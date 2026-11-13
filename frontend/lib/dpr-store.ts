"use client";
import { useAppDataSlice, updateAppDataSlice } from "@/lib/app-data-store";
import type { DPRReport } from "@/lib/types";

export function useDPRReports(projectId?: string): DPRReport[] {
  const reports = useAppDataSlice("richDprReports") ?? [];
  return projectId ? reports.filter((r) => r.projectId === projectId) : reports;
}

export function useDPRByShootDay(shootDayId: string): DPRReport | null {
  const reports = useAppDataSlice("richDprReports") ?? [];
  return reports.find((r) => r.shootDayId === shootDayId) ?? null;
}

export function createDPR(report: Omit<DPRReport, "id" | "createdAt" | "updatedAt">): DPRReport {
  const now = new Date().toISOString();
  const newReport: DPRReport = { ...report, id: `rdpr-${Date.now()}`, createdAt: now, updatedAt: now };
  updateAppDataSlice("richDprReports", (reports) => [...reports, newReport]);
  return newReport;
}

export function updateDPR(id: string, updates: Partial<DPRReport>) {
  updateAppDataSlice("richDprReports", (reports) =>
    reports.map((r) => (r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r))
  );
}

export function submitDPR(id: string) {
  updateDPR(id, { status: "submitted" });
}

export function deleteDPR(id: string) {
  updateAppDataSlice("richDprReports", (reports) => reports.filter((r) => r.id !== id));
}
