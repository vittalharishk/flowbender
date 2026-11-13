import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { differenceInDays, differenceInMonths, differenceInYears, isValid, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeDate(value: string): string {
  const date = parseISO(value);
  if (!isValid(date)) return "Date unavailable";
  const days = Math.max(0, differenceInDays(new Date(), date));
  if (days === 0) return "Today";
  if (days < 30) return `${days}d ago`;
  const months = Math.max(1, differenceInMonths(new Date(), date));
  if (months < 12) return `${months}mo ago`;
  return `${Math.max(1, differenceInYears(new Date(), date))}y ago`;
}

export function formatINR(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(amount % 10000000 === 0 ? 0 : 2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(amount % 100000 === 0 ? 0 : 2)} L`;
  }
  return `₹${amount.toLocaleString("en-IN")}`;
}
