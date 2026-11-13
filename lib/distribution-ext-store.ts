"use client";

import { useMemo } from "react";
import { useModuleSlice, updateModuleSlice, seedModuleSlice } from "./module-store";

export interface DistributionTerritory {
  id: string;
  projectId: string;
  territory: string;
  region: "domestic" | "overseas";
  distributor?: string;
  dealType: "outright" | "minimum-guarantee" | "commission" | "revenue-share";
  dealAmount?: number;
  advanceReceived?: number;
  commissionPercent?: number;
  releaseDate?: string;
  status: "negotiation" | "signed" | "released" | "settled" | "cancelled";
  notes?: string;
}

export interface DigitalDistribution {
  id: string;
  projectId: string;
  platform: string;
  dealType: "exclusive" | "non-exclusive";
  territory: string;
  windowStart?: string;
  windowEnd?: string;
  dealAmount?: number;
  revenueSharePercent?: number;
  status: "negotiation" | "signed" | "live" | "expired" | "cancelled";
  streamCount?: number;
  revenueEarned?: number;
}

export interface SatelliteDistribution {
  id: string;
  projectId: string;
  channel: string;
  language: string;
  territory: string;
  dealAmount: number;
  advancePaid: number;
  premiereDate?: string;
  numberOfRuns?: number;
  windowYears?: number;
  status: "negotiation" | "signed" | "premiered" | "completed" | "cancelled";
}

export interface AudioDistribution {
  id: string;
  projectId: string;
  label: string;
  dealType: "outright" | "revenue-share" | "minimum-guarantee";
  dealAmount?: number;
  revenueSharePercent?: number;
  platforms?: string[];
  totalStreams?: number;
  revenueEarned?: number;
  status: "negotiation" | "signed" | "released" | "settled";
}

const SEED_TERRITORIES: DistributionTerritory[] = [
  { id: "dt-1", projectId: "p1", territory: "Andhra Pradesh", region: "domestic", distributor: "Mythri Movie Makers", dealType: "minimum-guarantee", dealAmount: 50000000, advanceReceived: 30000000, status: "signed" },
  { id: "dt-2", projectId: "p1", territory: "Karnataka", region: "domestic", distributor: "KRG Studios", dealType: "minimum-guarantee", dealAmount: 15000000, advanceReceived: 10000000, status: "signed" },
  { id: "dt-3", projectId: "p1", territory: "North America", region: "overseas", distributor: "Prathyangira Cinemas", dealType: "commission", commissionPercent: 25, status: "negotiation" },
  { id: "dt-4", projectId: "p2", territory: "Hindi Belt", region: "domestic", distributor: "AA Films", dealType: "outright", dealAmount: 80000000, advanceReceived: 80000000, status: "settled" },
];

const SEED_DIGITAL: DigitalDistribution[] = [
  { id: "dd-1", projectId: "p1", platform: "Amazon Prime", dealType: "exclusive", territory: "India", dealAmount: 40000000, status: "signed", windowStart: "2027-08-01", windowEnd: "2029-08-01" },
  { id: "dd-2", projectId: "p2", platform: "Netflix", dealType: "exclusive", territory: "Worldwide", dealAmount: 60000000, status: "live", streamCount: 25000000, revenueEarned: 60000000 },
];

const SEED_SATELLITE: SatelliteDistribution[] = [
  { id: "sat-1", projectId: "p1", channel: "Zee Telugu", language: "Telugu", territory: "India", dealAmount: 25000000, advancePaid: 0, numberOfRuns: 15, windowYears: 5, status: "signed" },
  { id: "sat-2", projectId: "p2", channel: "Star Gold", language: "Hindi", territory: "India", dealAmount: 35000000, advancePaid: 35000000, premiereDate: "2027-03-15", numberOfRuns: 25, windowYears: 5, status: "premiered" },
];

const SEED_AUDIO: AudioDistribution[] = [
  { id: "aud-1", projectId: "p1", label: "Aditya Music", dealType: "revenue-share", revenueSharePercent: 70, platforms: ["Spotify", "JioSaavn", "YouTube Music"], totalStreams: 50000000, revenueEarned: 8000000, status: "released" },
  { id: "aud-2", projectId: "p2", label: "T-Series", dealType: "outright", dealAmount: 15000000, platforms: ["All"], totalStreams: 200000000, revenueEarned: 15000000, status: "settled" },
];

export function initDistributionExtSeedData() {
  seedModuleSlice("distributionTerritories", SEED_TERRITORIES);
  seedModuleSlice("digitalDistribution", SEED_DIGITAL);
  seedModuleSlice("satelliteDistribution", SEED_SATELLITE);
  seedModuleSlice("audioDistribution", SEED_AUDIO);
}

export function useDistributionTerritories(projectId?: string): DistributionTerritory[] {
  const all = useModuleSlice<DistributionTerritory>("distributionTerritories");
  return useMemo(() => !projectId ? all : all.filter((t) => t.projectId === projectId), [all, projectId]);
}

export function useDigitalDistribution(projectId?: string): DigitalDistribution[] {
  const all = useModuleSlice<DigitalDistribution>("digitalDistribution");
  return useMemo(() => !projectId ? all : all.filter((d) => d.projectId === projectId), [all, projectId]);
}

export function useSatelliteDistribution(projectId?: string): SatelliteDistribution[] {
  const all = useModuleSlice<SatelliteDistribution>("satelliteDistribution");
  return useMemo(() => !projectId ? all : all.filter((s) => s.projectId === projectId), [all, projectId]);
}

export function useAudioDistribution(projectId?: string): AudioDistribution[] {
  const all = useModuleSlice<AudioDistribution>("audioDistribution");
  return useMemo(() => !projectId ? all : all.filter((a) => a.projectId === projectId), [all, projectId]);
}

export function useDistributionOverview(projectId?: string) {
  const territories = useDistributionTerritories(projectId);
  const digital = useDigitalDistribution(projectId);
  const satellite = useSatelliteDistribution(projectId);
  const audio = useAudioDistribution(projectId);

  return useMemo(() => {
    const territoryRevenue = territories.reduce((s, t) => s + (t.dealAmount || 0), 0);
    const digitalRevenue = digital.reduce((s, d) => s + (d.dealAmount || d.revenueEarned || 0), 0);
    const satelliteRevenue = satellite.reduce((s, s2) => s + s2.dealAmount, 0);
    const audioRevenue = audio.reduce((s, a) => s + (a.dealAmount || a.revenueEarned || 0), 0);
    return {
      totalRevenue: territoryRevenue + digitalRevenue + satelliteRevenue + audioRevenue,
      territoryRevenue, digitalRevenue, satelliteRevenue, audioRevenue,
      territoryCount: territories.length, digitalCount: digital.length, satelliteCount: satellite.length, audioCount: audio.length,
    };
  }, [territories, digital, satellite, audio]);
}

export function createDistributionTerritory(input: Omit<DistributionTerritory, "id">): DistributionTerritory {
  const item: DistributionTerritory = { id: `dt-${crypto.randomUUID().slice(0, 8)}`, ...input };
  updateModuleSlice<DistributionTerritory>("distributionTerritories", (items) => [...items, item]);
  return item;
}

export function createDigitalDistribution(input: Omit<DigitalDistribution, "id">): DigitalDistribution {
  const item: DigitalDistribution = { id: `dd-${crypto.randomUUID().slice(0, 8)}`, ...input };
  updateModuleSlice<DigitalDistribution>("digitalDistribution", (items) => [...items, item]);
  return item;
}

export function createSatelliteDistribution(input: Omit<SatelliteDistribution, "id">): SatelliteDistribution {
  const item: SatelliteDistribution = { id: `sat-${crypto.randomUUID().slice(0, 8)}`, ...input };
  updateModuleSlice<SatelliteDistribution>("satelliteDistribution", (items) => [...items, item]);
  return item;
}

export function createAudioDistribution(input: Omit<AudioDistribution, "id">): AudioDistribution {
  const item: AudioDistribution = { id: `aud-${crypto.randomUUID().slice(0, 8)}`, ...input };
  updateModuleSlice<AudioDistribution>("audioDistribution", (items) => [...items, item]);
  return item;
}
