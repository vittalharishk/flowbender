"use client";

import { useMemo } from "react";
import { useModuleSlice, updateModuleSlice, seedModuleSlice } from "./module-store";

export interface MarketingCampaign {
  id: string;
  projectId: string;
  name: string;
  platform: string;
  objective?: string;
  startDate?: string;
  endDate?: string;
  campaignBudget: number;
  actualSpend: number;
  reach?: number;
  impressions?: number;
  clicks?: number;
  engagement?: number;
  leads?: number;
  status: "planned" | "active" | "paused" | "completed" | "cancelled";
  campaignOwner?: string;
  creativeAssets?: string[];
  notes?: string;
}

const SEED: MarketingCampaign[] = [
  { id: "mkt-1", projectId: "p1", name: "Game Changer — Teaser Launch", platform: "Instagram", objective: "Awareness", startDate: "2027-04-01", endDate: "2027-04-15", campaignBudget: 500000, actualSpend: 320000, reach: 5000000, impressions: 12000000, clicks: 150000, engagement: 80000, status: "completed", campaignOwner: "Publicity Dept" },
  { id: "mkt-2", projectId: "p1", name: "Game Changer — Trailer Promo", platform: "YouTube", objective: "Views", startDate: "2027-05-01", campaignBudget: 800000, actualSpend: 0, status: "planned", campaignOwner: "Publicity Dept" },
  { id: "mkt-3", projectId: "p2", name: "Pushpa 2 — Social Buzz", platform: "X", objective: "Engagement", startDate: "2027-03-15", endDate: "2027-04-15", campaignBudget: 300000, actualSpend: 280000, reach: 8000000, impressions: 20000000, clicks: 200000, engagement: 150000, status: "completed" },
];

export function initMarketingSeedData() { seedModuleSlice("marketingCampaigns", SEED); }

export function useMarketingCampaigns(projectId?: string): MarketingCampaign[] {
  const all = useModuleSlice<MarketingCampaign>("marketingCampaigns");
  return useMemo(() => !projectId ? all : all.filter((c) => c.projectId === projectId), [all, projectId]);
}

export function createMarketingCampaign(input: Omit<MarketingCampaign, "id">): MarketingCampaign {
  const item: MarketingCampaign = { id: `mkt-${crypto.randomUUID().slice(0, 8)}`, ...input };
  updateModuleSlice<MarketingCampaign>("marketingCampaigns", (items) => [...items, item]);
  return item;
}

export function updateMarketingCampaign(id: string, updates: Partial<MarketingCampaign>): MarketingCampaign | null {
  let found: MarketingCampaign | null = null;
  updateModuleSlice<MarketingCampaign>("marketingCampaigns", (items) =>
    items.map((c) => { if (c.id === id) { found = { ...c, ...updates }; return found; } return c; })
  );
  return found;
}
