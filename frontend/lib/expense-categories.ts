export const PRODUCTION_OFFICE_CATEGORIES = [
  { key: "office-rent", label: "Office Rent" },
  { key: "office-maintenance", label: "Office Maintenance" },
  { key: "electricity", label: "Electricity" },
  { key: "internet-telephone", label: "Internet & Telephone" },
  { key: "office-supplies", label: "Office Supplies" },
  { key: "printing-stationery", label: "Printing & Stationery" },
  { key: "furniture-equipment", label: "Furniture & Equipment" },
  { key: "cleaning-housekeeping", label: "Cleaning & Housekeeping" },
  { key: "repairs", label: "Repairs" },
  { key: "office-misc", label: "Miscellaneous" },
] as const;

export const PRODUCTION_EXPENSE_CATEGORIES = [
  { key: "daily-production", label: "Daily Production Expenses" },
  { key: "catering-food", label: "Catering & Food" },
  { key: "local-transportation", label: "Local Transportation" },
  { key: "fuel", label: "Fuel" },
  { key: "parking-tolls", label: "Parking & Tolls" },
  { key: "location-expenses", label: "Location Expenses" },
  { key: "accommodation", label: "Accommodation" },
  { key: "travel", label: "Travel" },
  { key: "art-props", label: "Art & Props" },
  { key: "costume-makeup", label: "Costume & Makeup" },
  { key: "camera-lighting", label: "Camera & Lighting" },
  { key: "production-staff", label: "Production Staff Expenses" },
  { key: "permissions-licenses", label: "Permissions & Licenses" },
  { key: "emergency", label: "Emergency Expenses" },
  { key: "production-misc", label: "Miscellaneous" },
] as const;

export const ALL_EXPENSE_CATEGORIES = [
  ...PRODUCTION_OFFICE_CATEGORIES,
  ...PRODUCTION_EXPENSE_CATEGORIES,
];

export const MAINTENANCE_CATEGORIES = [
  { key: "electrical", label: "Electrical" },
  { key: "plumbing", label: "Plumbing" },
  { key: "air-conditioning", label: "Air Conditioning" },
  { key: "furniture", label: "Furniture" },
  { key: "office-equipment", label: "Office Equipment" },
  { key: "networking-internet", label: "Networking & Internet" },
  { key: "cleaning", label: "Cleaning" },
  { key: "repairs", label: "Repairs" },
  { key: "other", label: "Other" },
] as const;

export const EXPENSE_STATUS_FLOW: Record<string, string[]> = {
  draft: ["pending-approval", "cancelled"],
  "pending-approval": ["approved", "rejected", "cancelled"],
  approved: ["partially-paid", "paid", "cancelled"],
  "partially-paid": ["paid"],
  paid: [],
  rejected: [],
  cancelled: [],
};

export const MAINTENANCE_STATUS_FLOW: Record<string, string[]> = {
  reported: ["assigned", "cancelled"],
  assigned: ["in-progress", "on-hold", "cancelled"],
  "in-progress": ["completed", "on-hold", "cancelled"],
  "on-hold": ["in-progress", "cancelled"],
  completed: [],
  cancelled: [],
};
