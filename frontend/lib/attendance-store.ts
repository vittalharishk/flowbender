"use client";

import { useMemo } from "react";
import { getAppDataSlice, updateAppDataSlice, useAppDataSlice } from "./app-data-store";
import type { AttendanceRecord, AttendanceStatus, CateringAdjustment } from "./types";

// ── raw getters (store functions only — not in render paths) ──────────────────

export function getAttendanceRecords(): AttendanceRecord[] {
  return getAppDataSlice("attendanceRecords");
}

export function getAttendanceByProjectDate(projectId: string, date: string): AttendanceRecord[] {
  return getAttendanceRecords().filter(r => r.projectId === projectId && r.date === date);
}

export function getCateringAdjustments(): CateringAdjustment[] {
  return getAppDataSlice("cateringAdjustments");
}

// ── hooks ─────────────────────────────────────────────────────────────────────

export function useAttendanceRecords(): AttendanceRecord[] {
  return useAppDataSlice("attendanceRecords");
}

export function useAttendanceByProjectDate(projectId: string, date: string): AttendanceRecord[] {
  const all = useAttendanceRecords();
  return useMemo(() => all.filter(r => r.projectId === projectId && r.date === date), [all, projectId, date]);
}

export function useCateringAdjustments(): CateringAdjustment[] {
  return useAppDataSlice("cateringAdjustments");
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

export function upsertAttendance(record: Omit<AttendanceRecord, "id"> & { id?: string }): void {
  const all = getAttendanceRecords();
  const existing = all.find(
    r => r.projectId === record.projectId && r.date === record.date && r.personId === record.personId
  );
  if (existing) {
    updateAppDataSlice("attendanceRecords", () =>
      getAttendanceRecords().map(r => r.id === existing.id ? { ...r, ...record, id: existing.id } : r)
    );
  } else {
    const nums = all
      .map(r => r.id)
      .filter(id => id.startsWith("att-"))
      .map(id => parseInt(id.slice(4)))
      .filter(n => !isNaN(n));
    const newId = `att-${nums.length ? Math.max(...nums) + 1 : 1}`;
    updateAppDataSlice("attendanceRecords", () => [...getAttendanceRecords(), { ...record, id: newId }]);
  }
}

export function bulkUpsertStatus(
  entries: Array<{ projectId: string; date: string; personId: string; status: AttendanceStatus }>
): void {
  for (const entry of entries) {
    const all = getAttendanceRecords();
    const existing = all.find(
      r => r.projectId === entry.projectId && r.date === entry.date && r.personId === entry.personId
    );
    if (existing) {
      updateAppDataSlice("attendanceRecords", () =>
        getAttendanceRecords().map(r => r.id === existing.id ? { ...r, status: entry.status } : r)
      );
    }
    // unconfirmed people without records stay unconfirmed — no auto-create on bulk
  }
}

export function addCateringAdjustment(input: Omit<CateringAdjustment, "id" | "createdAt">): void {
  const all = getCateringAdjustments();
  const nums = all.map(a => parseInt(a.id.replace("cadj-", ""))).filter(n => !isNaN(n));
  const newId = `cadj-${nums.length ? Math.max(...nums) + 1 : 1}`;
  const entry: CateringAdjustment = { ...input, id: newId, createdAt: new Date().toISOString() };
  updateAppDataSlice("cateringAdjustments", () => [...getCateringAdjustments(), entry]);
}

export function deleteCateringAdjustment(id: string): void {
  updateAppDataSlice("cateringAdjustments", () => getCateringAdjustments().filter(a => a.id !== id));
}

// ── catering calculation ──────────────────────────────────────────────────────

export function calcCateringCount(
  records: AttendanceRecord[],
  adjustments: CateringAdjustment[],
  projectId: string,
  date: string
): { castCount: number; crewCount: number; visitorCount: number; adjustmentDelta: number; total: number } {
  const dayRecs = records.filter(r => r.projectId === projectId && r.date === date);

  const mealWeight = (r: AttendanceRecord) =>
    r.status === "present" ? 1 : (r.status === "half-day" || r.status === "partial") ? 0.5 : 0;

  const castRecs = dayRecs.filter(r => r.department === "Cast");
  const visitorRecs = dayRecs.filter(r => r.department === "Visitors");
  const crewRecs = dayRecs.filter(r => r.department !== "Cast" && r.department !== "Visitors");

  const castCount = Math.ceil(castRecs.reduce((s, r) => s + mealWeight(r), 0));
  const crewCount = Math.ceil(crewRecs.reduce((s, r) => s + mealWeight(r), 0));
  const visitorCount = Math.ceil(visitorRecs.reduce((s, r) => s + mealWeight(r), 0));
  const adjustmentDelta = adjustments
    .filter(a => a.projectId === projectId && a.date === date)
    .reduce((s, a) => s + a.delta, 0);
  const total = castCount + crewCount + visitorCount + adjustmentDelta;

  return { castCount, crewCount, visitorCount, adjustmentDelta, total };
}
