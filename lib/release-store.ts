"use client";

import { useMemo } from "react";
import { useModuleSlice, updateModuleSlice, seedModuleSlice } from "./module-store";

export type ReleaseChannel = "theatrical" | "ott" | "satellite-tv" | "music" | "other";
export type ReleaseStatus = "planned" | "confirmed" | "released" | "postponed" | "cancelled";

export interface Release {
  id: string;
  projectId: string;
  title: string;
  channel: ReleaseChannel;
  territory: string;
  partner?: string;
  releaseDate?: string;
  confirmedDate?: string;
  status: ReleaseStatus;
  format?: string;
  screens?: number;
  notes?: string;
}

const SEED_RELEASES: Release[] = [
  { id: "rel-1", projectId: "p1", title: "AP/TG Theatrical Release", channel: "theatrical", territory: "Andhra Pradesh & Telangana", partner: "Mythri Movie Makers", releaseDate: "2027-08-15", status: "planned", screens: 2500 },
  { id: "rel-2", projectId: "p1", title: "Amazon Prime OTT", channel: "ott", territory: "India", partner: "Amazon Prime Video", releaseDate: "2027-10-15", status: "confirmed" },
  { id: "rel-3", projectId: "p1", title: "Zee Telugu Satellite Premiere", channel: "satellite-tv", territory: "India", partner: "Zee Telugu", status: "planned" },
  { id: "rel-4", projectId: "p1", title: "Music Launch", channel: "music", territory: "Worldwide", partner: "Aditya Music", releaseDate: "2027-07-01", status: "confirmed" },
  { id: "rel-5", projectId: "p2", title: "Hindi Belt Theatrical", channel: "theatrical", territory: "Hindi Belt", partner: "AA Films", releaseDate: "2027-03-01", confirmedDate: "2027-03-01", status: "released", screens: 4000 },
  { id: "rel-6", projectId: "p2", title: "Netflix Worldwide", channel: "ott", territory: "Worldwide", partner: "Netflix", releaseDate: "2027-05-01", confirmedDate: "2027-05-01", status: "released" },
];

export function initReleaseSeedData() {
  seedModuleSlice("releases", SEED_RELEASES);
}

export function useReleases(projectId?: string): Release[] {
  const all = useModuleSlice<Release>("releases");
  return useMemo(() => (!projectId ? all : all.filter((r) => r.projectId === projectId)), [all, projectId]);
}

export function useReleaseDashboard(projectId?: string) {
  const releases = useReleases(projectId);
  return useMemo(() => ({
    total: releases.length,
    planned: releases.filter((r) => r.status === "planned").length,
    confirmed: releases.filter((r) => r.status === "confirmed").length,
    released: releases.filter((r) => r.status === "released").length,
    postponed: releases.filter((r) => r.status === "postponed").length,
    byChannel: {
      theatrical: releases.filter((r) => r.channel === "theatrical"),
      ott: releases.filter((r) => r.channel === "ott"),
      satelliteTv: releases.filter((r) => r.channel === "satellite-tv"),
      music: releases.filter((r) => r.channel === "music"),
    },
  }), [releases]);
}

export function createRelease(input: Omit<Release, "id">): Release {
  const item: Release = { id: `rel-${crypto.randomUUID().slice(0, 8)}`, ...input };
  updateModuleSlice<Release>("releases", (items) => [...items, item]);
  return item;
}

export function updateRelease(id: string, updates: Partial<Omit<Release, "id">>): boolean {
  let found = false;
  updateModuleSlice<Release>("releases", (items) =>
    items.map((r) => {
      if (r.id === id) { found = true; return { ...r, ...updates }; }
      return r;
    })
  );
  return found;
}
