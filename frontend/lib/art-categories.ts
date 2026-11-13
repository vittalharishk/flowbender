export const PROP_CATEGORIES = [
  { key: "furniture", label: "Furniture" },
  { key: "decor", label: "Décor" },
  { key: "weapons-armory", label: "Weapons & Armory" },
  { key: "vehicles-miniatures", label: "Vehicles & Miniatures" },
  { key: "electronic-gadgets", label: "Electronic Gadgets" },
  { key: "books-documents", label: "Books & Documents" },
  { key: "clothing-accessories", label: "Clothing & Accessories" },
  { key: "food-consumables", label: "Food & Consumables" },
  { key: "tools-equipment", label: "Tools & Equipment" },
  { key: "art-craft-supplies", label: "Art & Craft Supplies" },
  { key: "period-props", label: "Period Props" },
  { key: "action-props", label: "Action Props" },
  { key: "signage-graphics", label: "Signage & Graphics" },
  { key: "other", label: "Other" },
] as const;

export const SET_CATEGORIES = [
  { key: "interior", label: "Interior" },
  { key: "exterior", label: "Exterior" },
  { key: "underwater", label: "Underwater" },
  { key: "period", label: "Period" },
  { key: "contemporary", label: "Contemporary" },
  { key: "sci-fi-futuristic", label: "Sci-Fi / Futuristic" },
  { key: "action-stunt", label: "Action / Stunt" },
  { key: "miniature", label: "Miniature" },
  { key: "green-screen", label: "Green Screen" },
  { key: "other", label: "Other" },
] as const;

export const SET_STATUS_FLOW: Record<string, string[]> = {
  planned: ["design", "approved"],
  design: ["approved", "planned"],
  approved: ["construction"],
  construction: ["ready-for-shoot", "design"],
  "ready-for-shoot": ["completed", "construction"],
  completed: ["dismantled"],
  dismantled: [],
};

export const AI_STATUS_FLOW: Record<string, string[]> = {
  planned: ["reference-collection"],
  "reference-collection": ["concept"],
  concept: ["in-review"],
  "in-review": ["approved", "revision"],
  revision: ["in-review"],
  approved: ["delivered"],
  delivered: [],
};

export const PROP_CONDITION_COLORS: Record<string, string> = {
  excellent: "bg-emerald-500/20 text-emerald-300",
  good: "bg-blue-500/20 text-blue-300",
  fair: "bg-amber-500/20 text-amber-400",
  damaged: "bg-red-500/20 text-red-300",
  lost: "bg-gray-500/20 text-gray-400",
  "under-repair": "bg-orange-500/20 text-orange-300",
};

export const SET_STATUS_COLORS: Record<string, string> = {
  planned: "bg-slate-500/20 text-slate-300",
  design: "bg-violet-500/20 text-violet-300",
  approved: "bg-blue-500/20 text-blue-300",
  construction: "bg-amber-500/20 text-amber-400",
  "ready-for-shoot": "bg-emerald-500/20 text-emerald-300",
  completed: "bg-teal-500/20 text-teal-300",
  dismantled: "bg-gray-500/20 text-gray-400",
};

export const AI_STATUS_COLORS: Record<string, string> = {
  planned: "bg-slate-500/20 text-slate-300",
  "reference-collection": "bg-blue-500/20 text-blue-300",
  concept: "bg-violet-500/20 text-violet-300",
  "in-review": "bg-amber-500/20 text-amber-400",
  revision: "bg-orange-500/20 text-orange-300",
  approved: "bg-teal-500/20 text-teal-300",
  delivered: "bg-emerald-500/20 text-emerald-300",
};

export const SET_STATUS_LABELS: Record<string, string> = {
  planned: "Planned",
  design: "Design",
  approved: "Approved",
  construction: "Construction",
  "ready-for-shoot": "Ready for Shoot",
  completed: "Completed",
  dismantled: "Dismantled",
};

export const AI_STATUS_LABELS: Record<string, string> = {
  planned: "Planned",
  "reference-collection": "Reference Collection",
  concept: "Concept",
  "in-review": "In Review",
  revision: "Revision",
  approved: "Approved",
  delivered: "Delivered",
};

export const PROP_CONDITION_LABELS: Record<string, string> = {
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
  damaged: "Damaged",
  lost: "Lost",
  "under-repair": "Under Repair",
};
