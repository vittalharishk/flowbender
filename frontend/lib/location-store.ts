import { useAppDataSlice, updateAppDataSlice } from "./app-data-store";
import type {
  FilmLocation, LocationScouting, LocationAgreement, LocationPayment,
} from "./types";

// ─── Film Locations ───────────────────────────────────────────────────────────

export function useFilmLocations(): FilmLocation[] {
  return useAppDataSlice("filmLocations") as FilmLocation[];
}

export function addFilmLocation(location: Omit<FilmLocation, "id" | "createdAt">) {
  updateAppDataSlice("filmLocations", (prev: FilmLocation[]) => [
    ...prev,
    { ...location, id: "f-loc" + (Date.now()), createdAt: new Date().toISOString() },
  ]);
}

export function updateFilmLocation(id: string, patch: Partial<FilmLocation>) {
  updateAppDataSlice("filmLocations", (prev: FilmLocation[]) =>
    prev.map((l) => (l.id === id ? { ...l, ...patch } : l))
  );
}

export function deleteFilmLocation(id: string) {
  updateAppDataSlice("filmLocations", (prev: FilmLocation[]) =>
    prev.filter((l) => l.id !== id)
  );
}

// ─── Location Scouting ────────────────────────────────────────────────────────

export function useLocationScouting(): LocationScouting[] {
  return useAppDataSlice("locationScouting") as LocationScouting[];
}

export function addLocationScouting(record: Omit<LocationScouting, "id" | "createdAt" | "updatedAt">) {
  const now = new Date().toISOString();
  updateAppDataSlice("locationScouting", (prev: LocationScouting[]) => [
    ...prev,
    { ...record, id: "sc" + Date.now(), createdAt: now, updatedAt: now },
  ]);
}

export function updateLocationScouting(id: string, patch: Partial<LocationScouting>) {
  updateAppDataSlice("locationScouting", (prev: LocationScouting[]) =>
    prev.map((s) => (s.id === id ? { ...s, ...patch, updatedAt: new Date().toISOString() } : s))
  );
}

export function deleteLocationScouting(id: string) {
  updateAppDataSlice("locationScouting", (prev: LocationScouting[]) =>
    prev.filter((s) => s.id !== id)
  );
}

// ─── Location Agreements ─────────────────────────────────────────────────────

export function useLocationAgreements(): LocationAgreement[] {
  return useAppDataSlice("locationAgreements") as LocationAgreement[];
}

export function addLocationAgreement(agreement: Omit<LocationAgreement, "id" | "createdAt" | "updatedAt">) {
  const now = new Date().toISOString();
  updateAppDataSlice("locationAgreements", (prev: LocationAgreement[]) => [
    ...prev,
    { ...agreement, id: "la" + Date.now(), createdAt: now, updatedAt: now },
  ]);
}

export function updateLocationAgreement(id: string, patch: Partial<LocationAgreement>) {
  updateAppDataSlice("locationAgreements", (prev: LocationAgreement[]) =>
    prev.map((a) => (a.id === id ? { ...a, ...patch, updatedAt: new Date().toISOString() } : a))
  );
}

// ─── Location Payments ───────────────────────────────────────────────────────

export function useLocationPayments(): LocationPayment[] {
  return useAppDataSlice("locationPayments") as LocationPayment[];
}

export function recordLocationPayment(payment: Omit<LocationPayment, "id" | "createdAt">) {
  updateAppDataSlice("locationPayments", (prev: LocationPayment[]) => [
    ...prev,
    { ...payment, id: "lp" + Date.now(), createdAt: new Date().toISOString() },
  ]);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
