"use client";

import { useMemo } from "react";
import { useModuleSlice, updateModuleSlice } from "./module-store";

export interface SavedReportConfig {
  id: string;
  name: string;
  category: "financial" | "production" | "crew" | "distribution";
  projectIds: string[];
  dateFrom?: string;
  dateTo?: string;
  columns: string[];
  description?: string;
  createdAt: string;
  updatedAt: string;
}

const STORE_KEY = "report-configs";

export function useSavedReportConfigs(): SavedReportConfig[] {
  return useModuleSlice<SavedReportConfig>(STORE_KEY);
}

export function addReportConfig(
  input: Omit<SavedReportConfig, "id" | "createdAt" | "updatedAt">
): SavedReportConfig {
  const now = new Date().toISOString();
  const config: SavedReportConfig = {
    ...input,
    id: `rpt-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };
  updateModuleSlice<SavedReportConfig>(STORE_KEY, (prev) => [...prev, config]);
  return config;
}

export function deleteReportConfig(id: string) {
  updateModuleSlice<SavedReportConfig>(STORE_KEY, (prev) => prev.filter((c) => c.id !== id));
}
