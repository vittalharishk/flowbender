import type { CurrencyCode } from "./types";

export const ACCOUNTS_DEPARTMENTS = [
  { key: "writing-direction", display: "Writing & Direction", sourcePatterns: ["direction", "Direction", "Writing", "Research", "Script"] },
  { key: "cast-talent", display: "Cast & Talent", sourcePatterns: ["Cast", "Casting", "Talent", "Artist", "Cast & Crew"] },
  { key: "camera-lighting", display: "Camera & Lighting", sourcePatterns: ["camera", "Camera", "Camera & Lights", "Lights", "Lighting", "Grip"] },
  { key: "art-props", display: "Art & Props", sourcePatterns: ["art", "Art", "Art Dept", "production-design", "Production Design", "Props", "Set Design"] },
  { key: "costume-makeup", display: "Costume & Makeup", sourcePatterns: ["Costume", "Costume & Makeup", "Makeup", "Wardrobe"] },
  { key: "sound-music", display: "Sound & Music", sourcePatterns: ["sound", "Sound", "Music", "Dubbing", "Audio"] },
  { key: "locations", display: "Locations", sourcePatterns: ["Locations", "Location"] },
  { key: "vehicles-transport", display: "Vehicles & Transport", sourcePatterns: ["Transport", "Vehicles", "Driver"] },
  { key: "action-stunts", display: "Action & Stunts", sourcePatterns: ["Action", "Stunts", "Action & Stunts"] },
  { key: "post-production", display: "Post-Production", sourcePatterns: ["Post", "Post-Production", "Editing", "editing", "VFX", "vfx", "DI", "QC", "Color"] },
  { key: "production-office", display: "Production Office", sourcePatterns: ["Production", "Daily Production", "Production Office", "Publicity", "Admin", "Office"] },
  { key: "company-overhead", display: "Company Overhead", sourcePatterns: [] },
] as const;

export type AccountsDepartmentKey = (typeof ACCOUNTS_DEPARTMENTS)[number]["key"];

export function normalizeDepartment(source: string | undefined): AccountsDepartmentKey {
  if (!source) return "production-office";
  const lower = source.toLowerCase().trim();
  for (const dept of ACCOUNTS_DEPARTMENTS) {
    for (const pattern of dept.sourcePatterns) {
      if (lower === pattern.toLowerCase()) return dept.key;
    }
  }
  return "production-office";
}

export function getDepartmentDisplay(key: string): string {
  return ACCOUNTS_DEPARTMENTS.find((d) => d.key === key)?.display ?? key;
}

export const SUPPORTED_CURRENCIES: { code: CurrencyCode; symbol: string; name: string }[] = [
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
];

export function formatCurrency(amount: number, currency: CurrencyCode = "INR"): string {
  if (currency === "INR") {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export function formatCompactINR(amount: number): string {
  if (amount >= 1e7) return `₹${(amount / 1e7).toFixed(1)} Cr`;
  if (amount >= 1e5) return `₹${(amount / 1e5).toFixed(1)} L`;
  if (amount >= 1e3) return `₹${(amount / 1e3).toFixed(1)}K`;
  return formatCurrency(amount);
}

export const BUDGET_STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-500/20 text-slate-300",
  approved: "bg-emerald-500/20 text-emerald-300",
  revised: "bg-amber-500/20 text-amber-300",
  frozen: "bg-blue-500/20 text-blue-300",
};

export const APPROVAL_STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-500/20 text-slate-300",
  submitted: "bg-blue-500/20 text-blue-300",
  "dept-approved": "bg-cyan-500/20 text-cyan-300",
  "finance-approved": "bg-teal-500/20 text-teal-300",
  "producer-approved": "bg-emerald-500/20 text-emerald-300",
  rejected: "bg-red-500/20 text-red-300",
  returned: "bg-orange-500/20 text-orange-300",
};
