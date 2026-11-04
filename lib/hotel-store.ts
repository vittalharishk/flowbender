import { useAppDataSlice, updateAppDataSlice } from "./app-data-store";
import type { Hotel, HotelBooking, HotelPayment } from "./types";

// ─── Hotels ──────────────────────────────────────────────────────────────────

export function useHotels(): Hotel[] {
  return useAppDataSlice("hotels") as Hotel[];
}

export function addHotel(hotel: Omit<Hotel, "id" | "createdAt">) {
  updateAppDataSlice("hotels", (prev: Hotel[]) => [
    ...prev,
    { ...hotel, id: "h" + Date.now(), createdAt: new Date().toISOString() },
  ]);
}

export function updateHotel(id: string, patch: Partial<Hotel>) {
  updateAppDataSlice("hotels", (prev: Hotel[]) =>
    prev.map((h) => (h.id === id ? { ...h, ...patch } : h))
  );
}

export function deleteHotel(id: string) {
  updateAppDataSlice("hotels", (prev: Hotel[]) => prev.filter((h) => h.id !== id));
}

// ─── Hotel Bookings ──────────────────────────────────────────────────────────

export function useHotelBookings(): HotelBooking[] {
  return useAppDataSlice("hotelBookings") as HotelBooking[];
}

export function addHotelBooking(booking: Omit<HotelBooking, "id" | "createdAt" | "updatedAt">) {
  const now = new Date().toISOString();
  updateAppDataSlice("hotelBookings", (prev: HotelBooking[]) => [
    ...prev,
    { ...booking, id: "hb" + Date.now(), createdAt: now, updatedAt: now },
  ]);
}

export function updateHotelBooking(id: string, patch: Partial<HotelBooking>) {
  updateAppDataSlice("hotelBookings", (prev: HotelBooking[]) =>
    prev.map((b) => (b.id === id ? { ...b, ...patch, updatedAt: new Date().toISOString() } : b))
  );
}

export function deleteHotelBooking(id: string) {
  updateAppDataSlice("hotelBookings", (prev: HotelBooking[]) =>
    prev.filter((b) => b.id !== id)
  );
}

// ─── Hotel Payments ───────────────────────────────────────────────────────────

export function useHotelPayments(): HotelPayment[] {
  return useAppDataSlice("hotelPayments") as HotelPayment[];
}

export function recordHotelPayment(
  booking: HotelBooking,
  payment: Omit<HotelPayment, "id" | "createdAt">
) {
  updateAppDataSlice("hotelPayments", (prev: HotelPayment[]) => [
    ...prev,
    { ...payment, id: "hp" + Date.now(), createdAt: new Date().toISOString() },
  ]);
  updateAppDataSlice("hotelBookings", (prev: HotelBooking[]) =>
    prev.map((b) =>
      b.id === booking.id
        ? { ...b, totalPaid: b.totalPaid + payment.amount, updatedAt: new Date().toISOString() }
        : b
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
