export const VENDOR_CATEGORIES = [
  { key: "camera-equipment", label: "Camera Equipment" },
  { key: "lighting-equipment", label: "Lighting Equipment" },
  { key: "generator-electrical", label: "Generator & Electrical" },
  { key: "art-set-suppliers", label: "Art & Set Suppliers" },
  { key: "props-suppliers", label: "Props Suppliers" },
  { key: "costume-suppliers", label: "Costume Suppliers" },
  { key: "makeup-prosthetics", label: "Makeup & Prosthetics" },
  { key: "location-services", label: "Location Services" },
  { key: "hotel-accommodation", label: "Hotel & Accommodation" },
  { key: "travel-transport", label: "Travel & Transport" },
  { key: "vehicle-caravan", label: "Vehicle & Caravan" },
  { key: "catering", label: "Catering" },
  { key: "general-rental", label: "General Rental" },
  { key: "other", label: "Other" },
] as const;

export const RENTAL_CATEGORIES = [
  { key: "camera-equipment", label: "Camera Equipment" },
  { key: "lenses-accessories", label: "Lenses & Accessories" },
  { key: "lighting-equipment", label: "Lighting Equipment" },
  { key: "generators-electrical", label: "Generators & Electrical" },
  { key: "grip-equipment", label: "Grip Equipment" },
  { key: "art-set-equipment", label: "Art & Set Equipment" },
  { key: "props-furniture", label: "Props & Furniture" },
  { key: "costumes", label: "Costumes" },
  { key: "makeup-prosthetics-equipment", label: "Makeup & Prosthetics" },
  { key: "location-equipment", label: "Location Equipment" },
  { key: "production-office-equipment", label: "Production Office" },
  { key: "other", label: "Other" },
] as const;

export const RENTAL_STATUS_FLOW: Record<string, string[]> = {
  requested: ["approved", "cancelled"],
  approved: ["booked", "cancelled"],
  booked: ["issued", "cancelled"],
  issued: ["partially-returned", "returned", "overdue"],
  "partially-returned": ["returned", "overdue"],
  overdue: ["returned"],
  returned: [],
  cancelled: [],
};

export const RENTAL_STATUS_LABELS: Record<string, string> = {
  requested: "Requested",
  approved: "Approved",
  booked: "Booked",
  issued: "Issued",
  "partially-returned": "Partial Return",
  returned: "Returned",
  overdue: "Overdue",
  cancelled: "Cancelled",
};
