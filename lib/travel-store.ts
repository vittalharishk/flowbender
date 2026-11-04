import { useAppDataSlice, updateAppDataSlice } from "./app-data-store";
import type { Trip, TravelPayment } from "./types";

// ─── Trips ───────────────────────────────────────────────────────────────────

export function useTrips(): Trip[] {
  return useAppDataSlice("trips") as Trip[];
}

export function addTrip(trip: Omit<Trip, "id" | "createdAt" | "updatedAt">) {
  const now = new Date().toISOString();
  updateAppDataSlice("trips", (prev: Trip[]) => [
    ...prev,
    { ...trip, id: "tr" + Date.now(), createdAt: now, updatedAt: now },
  ]);
}

export function updateTrip(id: string, patch: Partial<Trip>) {
  updateAppDataSlice("trips", (prev: Trip[]) =>
    prev.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t))
  );
}

export function deleteTrip(id: string) {
  updateAppDataSlice("trips", (prev: Trip[]) => prev.filter((t) => t.id !== id));
}

// ─── Travel Payments ─────────────────────────────────────────────────────────

export function useTravelPayments(): TravelPayment[] {
  return useAppDataSlice("travelPayments") as TravelPayment[];
}

export function recordTravelPayment(
  trip: Trip,
  payment: Omit<TravelPayment, "id" | "createdAt">
) {
  updateAppDataSlice("travelPayments", (prev: TravelPayment[]) => [
    ...prev,
    { ...payment, id: "tp" + Date.now(), createdAt: new Date().toISOString() },
  ]);
  updateAppDataSlice("trips", (prev: Trip[]) =>
    prev.map((t) =>
      t.id === trip.id
        ? { ...t, totalPaid: t.totalPaid + payment.amount, updatedAt: new Date().toISOString() }
        : t
    )
  );
}

// ─── Helper ──────────────────────────────────────────────────────────────────

export const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
