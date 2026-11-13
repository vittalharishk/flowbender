// ─── Phase 4: Locations, Boarding & Travel ───────────────────────────────────

export type LocationCategory =
  | "film-set" | "studio" | "outdoor" | "indoor" | "residential"
  | "commercial" | "road-public" | "hotel-resort" | "village-rural" | "other";

export type PermissionStatus =
  | "not-requested" | "requested" | "under-review" | "approved" | "rejected" | "expired";

export interface FilmLocation {
  id: string;
  name: string;
  category: LocationCategory;
  address: string;
  city: string;
  state: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  locationOwner?: string;
  locationManager?: string;
  permissionStatus: PermissionStatus;
  ratePerDay: number;
  deposit: number;
  accessTimings?: string;
  parking?: string;
  facilities?: string;
  restrictions?: string;
  notes?: string;
  imagePlaceholder?: string;
  status: "available" | "booked" | "unavailable";
  createdAt: string;
}

export type ScoutingStatus =
  | "planned" | "scheduled" | "visited" | "under-review" | "shortlisted" | "approved" | "rejected";

export interface LocationScouting {
  id: string;
  projectId: string;
  locationId?: string;
  locationName: string;
  scoutingDate: string;
  scoutingTeam: string[];
  assignedManager: string;
  requirements?: string;
  observations?: string;
  estimatedCost: number;
  suitabilityRating: number;
  status: ScoutingStatus;
  decision?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type LocationAgreementStatus =
  | "pending" | "active" | "completed" | "cancelled" | "disputed";

export interface LocationAgreement {
  id: string;
  projectId: string;
  locationId: string;
  usageStartDate: string;
  usageEndDate: string;
  agreedAmount: number;
  deposit: number;
  depositPaid: boolean;
  totalPaid: number;
  agreementReference?: string;
  permissionStatus: PermissionStatus;
  status: LocationAgreementStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocationPayment {
  id: string;
  agreementId: string;
  projectId: string;
  locationId: string;
  amount: number;
  isDeposit: boolean;
  paymentDate: string;
  referenceNumber?: string;
  notes?: string;
  recordedBy: string;
  createdAt: string;
}

// ─── Boarding / Hotel ─────────────────────────────────────────────────────────

export type HotelAccommodationType =
  | "hotel" | "resort" | "guest-house" | "serviced-apartment"
  | "production-accommodation" | "other";

export interface Hotel {
  id: string;
  name: string;
  accommodationType: HotelAccommodationType;
  address: string;
  city: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  facilities?: string;
  notes?: string;
  vendorId?: string;
  createdAt: string;
}

export type RoomBookingStatus =
  | "requested" | "confirmed" | "checked-in" | "checked-out" | "cancelled" | "no-show";

export type GuestType = "cast" | "crew" | "production" | "other";

export interface HotelBooking {
  id: string;
  projectId: string;
  hotelId: string;
  guestName: string;
  guestType: GuestType;
  castMemberId?: string;
  crewMemberId?: string;
  roomNumber?: string;
  roomType: string;
  occupants: number;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  ratePerNight: number;
  additionalCharges: number;
  discount: number;
  totalAmount: number;
  deposit: number;
  depositPaid: boolean;
  totalPaid: number;
  status: RoomBookingStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HotelPayment {
  id: string;
  bookingId: string;
  projectId: string;
  hotelId: string;
  amount: number;
  isDeposit: boolean;
  paymentDate: string;
  referenceNumber?: string;
  notes?: string;
  recordedBy: string;
  createdAt: string;
}

// ─── Travel / Trips ──────────────────────────────────────────────────────────

export type TravelCategory =
  | "flight" | "train" | "bus" | "car" | "taxi"
  | "production-vehicle" | "rental-vehicle" | "other";

export type TripStatus =
  | "planned" | "requested" | "booked" | "confirmed" | "in-transit" | "completed" | "cancelled";

export interface TripPassenger {
  name: string;
  guestType: GuestType;
  castMemberId?: string;
  crewMemberId?: string;
  seatDetails?: string;
}

export interface Trip {
  id: string;
  projectId: string;
  title: string;
  category: TravelCategory;
  vendorProvider?: string;
  bookingReference?: string;
  origin: string;
  destination: string;
  departureDateTime: string;
  arrivalDateTime?: string;
  passengers: TripPassenger[];
  vehicleDetails?: string;
  driverName?: string;
  ticketCost: number;
  additionalCharges: number;
  totalCost: number;
  totalPaid: number;
  status: TripStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TravelPayment {
  id: string;
  tripId: string;
  projectId: string;
  amount: number;
  paymentDate: string;
  referenceNumber?: string;
  notes?: string;
  recordedBy: string;
  createdAt: string;
}
