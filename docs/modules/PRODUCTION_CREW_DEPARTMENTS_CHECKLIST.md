# Production Crew Departments — Implementation Checklist

## Phase 1 — Crew Departments & Remuneration ✅ AUDITED (2026-10-31)

- [x] P1-A1. Add `CrewDepartmentKey`, `CrewDepartment`, `CrewAssignment`, `RemunerationAgreement`, `PaymentRecord` types to `lib/types.ts`
- [x] P1-A2. Add collections to `lib/app-data-store.ts`: `crewAssignments`, `remunerationAgreements`, `crewPaymentRecords`
- [x] P1-B1. Create `lib/crew-departments.ts` — 9 department definitions with designations
- [x] P1-B2. Extend `lib/crew-store.ts` — CRUD for assignments, agreements, payments; `calcRemunerationSummary`; `recordPaymentAndUpdateAgreement`
- [x] P1-C1. Seed 36 crew assignments (one per crew member, across 9 departments, all 7 projects)
- [x] P1-C2. Seed 36 remuneration agreements with varied periods (daily/weekly/monthly/fixed/per-project)
- [x] P1-C3. Seed 36 payment records under `crewPaymentRecords`
- [x] P1-D1. Create `components/crew/crew-departments-workspace.tsx` — 4-tab workspace (Dashboard, Departments, Crew, Remuneration)
- [x] P1-D2. Update `app/dashboard/crew/page.tsx` — renders `<CrewDepartmentsWorkspace />`
- [x] P1-D3. Update `app/dashboard/projects/[id]/crew/page.tsx` — renders `<CrewDepartmentsWorkspace projectId={id} />`
- [x] P1-E1. TypeScript zero errors
- [x] P1-E2. No duplicate IDs in any seeded collection
- [x] P1-E3. All 36 crewMembers preserved

**Audit results:** All 36 crew | 36 assignments | 36 agreements | 36 payments — PASS

---

## Phase 2 — Rentals & Vendor Management ✅ AUDITED (2026-10-31)

- [x] P2-A1. Add `VendorCategory`, `Vendor`, `RentalCategory`, `RentalStatus`, `RentalRatePeriod`, `RentalRecord`, `RentalPayment` types to `lib/types.ts`
- [x] P2-A2. Add collections to `lib/app-data-store.ts`: `rentalVendors`, `rentalRecords`, `rentalPayments`
- [x] P2-B1. Create `lib/rental-store.ts` — vendor CRUD, rental CRUD, payment recording with overpayment guard, calculation functions
- [x] P2-B2. Create `lib/rental-categories.ts` — `VENDOR_CATEGORIES` (14), `RENTAL_CATEGORIES` (12), `RENTAL_STATUS_FLOW`
- [x] P2-C1. Seed 20 rental vendors across 13 of 14 categories (no "other" vendor in seed)
- [x] P2-C2. Seed 35 rental records across all 7 projects — statuses: returned:17, issued:6, booked:3, approved:2, requested:3, overdue:2, partially-returned:2
- [x] P2-C3. Seed 45 rental payments (18 deposit, 27 rental) — all link to valid rental IDs
- [x] P2-D1. Create `components/crew/rentals-workspace.tsx` — 5-tab workspace (Dashboard, Rental Register, Vendors, Payments, Returns & Overdue)
- [x] P2-D2. Update `app/dashboard/crew/page.tsx` — "Rentals & Vendors" tab alongside Crew & Departments
- [x] P2-D3. Update `app/dashboard/projects/[id]/crew/page.tsx` — "Rentals & Vendors" tab with `projectId` prop
- [x] P2-E1. TypeScript zero errors
- [x] P2-E2. Financial formulas verified: Subtotal = Qty × Rate × Days (fixed = rate only); Total = Subtotal + Additional + Late Fees; Outstanding = max(0, Total - Paid)
- [x] P2-E3. Deposits tracked separately (`isDeposit` flag on payments); NOT included in `totalRentalCost`
- [x] P2-E4. `depositForfeited` field on all records with deposit > 0
- [x] P2-E5. Overpayment guard: `if (!isDeposit && amount > outstanding) → error`
- [x] P2-E6. Status workflow buttons in Rental Register and Returns & Overdue tabs
- [x] P2-E7. No overlap with `crewPaymentRecords` (uses `rentalPayments`) or legacy `vendors` (uses `rentalVendors`)
- [x] P2-E8. Regression: all Phase 1 + Master Schedule + Cast/Script counts unchanged

**Audit results:**
- Vendors: 20/20 ✓ | Rentals: 35/35 ✓ | Payments: 45/45 ✓
- Total Rental Cost: ₹7.62 Cr | Paid: ₹5.27 Cr | Outstanding: ₹2.35 Cr | Deposits: ₹10.85L
- Calculation errors: NONE
- TypeScript: PASS (0 errors)

**Known limitations:**
- 1 of 14 vendor categories ("other") has no seeded vendor
- Dashboard does not show a dedicated "Deposits Held" summary card (accessible via Payments tab)

---

## Phase 3 — Expenses & Production Office ✅ IMPLEMENTED & AUDITED (2026-10-31)

- [x] Types: `ProductionExpense`, `ExpensePayment`, `OfficeRental`, `OfficeRentPayment`, `MaintenanceRecord` added to `lib/types.ts`
- [x] Store: `lib/expense-store.ts` — full CRUD for all 5 collections + `calcExpenseDashboard` + `formatINR`
- [x] Categories: `lib/expense-categories.ts` — 25 expense categories (10 office + 15 production), 9 maintenance categories
- [x] App data store: 5 new collections registered in `AppDataCollections`, `emptyCollections()`, `collectionKeys`
- [x] Seed: 40 expenses, 28 payments, 5 office rentals, 22 rent payments, 20 maintenance records across all 7 projects
- [x] Component: `components/crew/expenses-workspace.tsx` — 6 tabs (Dashboard, Expense Register, Office Rent, Maintenance, Payments, Reports)
- [x] Pages updated: global `/dashboard/crew` + project `/dashboard/projects/[id]/crew` — "Expenses & Office" tab added
- [x] Approval workflow: draft → pending-approval → approved → partially-paid → paid
- [x] Overpayment guard: `recordExpensePayment` validates amount ≤ outstanding
- [x] Financial separation: expensePayments ≠ crewPaymentRecords ≠ rentalPayments ≠ officeRentPayments
- [x] Deposits: office security deposits tracked via `depositPaid` boolean, NOT added to payment records
- [x] TypeScript: 0 errors
- [x] Regression: all Phase 1, Phase 2, Master Schedule, Cast, Script counts unchanged

### Phase 3 Audit Results (2026-10-31)
| Collection | Count | Status |
|---|---|---|
| productionExpenses | 40 | ✅ |
| expensePayments | 28 | ✅ |
| officeRentals | 5 | ✅ |
| officeRentPayments | 22 | ✅ |
| maintenanceRecords | 20 | ✅ |

Financial: ₹1.19 Cr expenses | ₹1.08 Cr paid | ₹10.84L outstanding | ₹32.85L rent paid | ₹1.96L maintenance

---

## Phase 4 — Locations, Boarding & Travel ✅ IMPLEMENTED (2026-10-31)

- [x] Types: `FilmLocation`, `LocationScouting`, `LocationAgreement`, `LocationPayment`, `Hotel`, `HotelBooking`, `HotelPayment`, `Trip`, `TravelPayment` + all associated type aliases added to `lib/types.ts`
- [x] Store: `lib/location-store.ts` — CRUD for FilmLocation, LocationScouting, LocationAgreement, LocationPayment + formatINR
- [x] Store: `lib/hotel-store.ts` — CRUD for Hotel, HotelBooking, HotelPayment with payment tracking
- [x] Store: `lib/travel-store.ts` — CRUD for Trip, TravelPayment with payment tracking
- [x] App data store: 9 new collections registered in `AppDataCollections`, `emptyCollections()`, `collectionKeys` — `filmLocations`, `locationScouting`, `locationAgreements`, `locationPayments`, `hotels`, `hotelBookings`, `hotelPayments`, `trips`, `travelPayments`
- [x] Seed: 18 film locations, 12 scouting records, 15 agreements, 22 location payments, 8 hotels, 25 bookings, 30 hotel payments, 20 trips, 20 travel payments
- [x] Component: `components/crew/locations-workspace.tsx` — 6 tabs (Dashboard, Locations, Scouting & Permissions, Boarding/Hotels, Travel/Trips, Payments & Reports)
- [x] Pages updated: global `/dashboard/crew` + project `/dashboard/projects/[id]/crew` — "Locations & Travel" 4th tab added
- [x] Seed fallback: `lib/flowbender-demo-seed.ts` updated with all 9 empty arrays
- [x] Financial separation: locationPayments ≠ hotelPayments ≠ travelPayments ≠ crewPaymentRecords ≠ rentalPayments ≠ expensePayments ≠ officeRentPayments
- [x] Deposits tracked separately (isDeposit boolean) for location agreements and hotel bookings
- [x] Existing `locations` collection (12 old ProjectLocation records) preserved — new data in `filmLocations` key
- [x] TypeScript: 0 errors (APP_DATA_VERSION remains 18)
- [x] Regression: all prior phase collections unchanged

### Phase 4 Audit Results (2026-10-31)
| Collection | Count | Status |
|---|---|---|
| filmLocations | 18 | ✅ |
| locationScouting | 12 | ✅ |
| locationAgreements | 15 | ✅ |
| locationPayments | 22 | ✅ |
| hotels | 8 | ✅ |
| hotelBookings | 25 | ✅ |
| hotelPayments | 30 | ✅ |
| trips | 20 | ✅ |
| travelPayments | 20 | ✅ |

Financial (corrected after audit): Location ₹9.80 Cr agreed / ₹9.06 Cr paid / ₹74.5 L outstanding | Hotel ₹1.61 Cr cost / ₹1.43 Cr paid | Travel ₹37.4L cost / ₹36.6L paid

**Audit findings fixed:**
- 11 `locationAgreements` had `totalPaid` incorrectly including security deposit — corrected to non-deposit payments only
- 11 `hotelBookings` had same deposit-inclusion bug — corrected
- `lp21` (la11 payment) was ₹4,00,000 against ₹3,75,000 agreed — corrected to ₹3,75,000
- TypeScript: 0 errors | Regression: ALL PASS

## Phase 5 — Art, Props, Sets & AI Set Extensions (PENDING — not started)
## Phase 6 — Vehicles, Caravans, Drivers, Action & Stunts (PENDING — not started)
## Phase 7 — Final Integration Audit (PENDING — not started)
