# ERP Cross-Module Integration Audit

**Audit Date:** 2026-11-02 | **Auditor:** Claude Opus 4.6 (A10)

## 1. Project-Scoping Integration

All stores reference `projectId` for filtering (409 references across stores). The `useSelectedProjectId()` / `getSelectedProjectId()` pattern provides global project context.

| Integration Point | Status | Notes |
|---|---|---|
| Project → Cast | ✅ WORKING | `getCastByProject(projectId)` |
| Project → Crew | ✅ WORKING | `useCrewMembers(projectId)` |
| Project → Schedule | ✅ WORKING | `getShootDaysByProject(projectId)` |
| Project → Scenes | ✅ WORKING | `getScenesByProject(projectId)` |
| Project → Call Sheets | ✅ WORKING | Filtered by project in workspace |
| Project → Attendance | ✅ WORKING | `getAttendanceByProjectDate(projectId, date)` |
| Project → Budgets | ✅ WORKING | `projectBudgets` keyed by projectId |
| Project → DPR | ✅ WORKING | `useDPRReports(projectId)` |
| Project → Pre-Prod | ✅ WORKING | `usePreProdChecklist(projectId)` |
| Project → Post-Prod | ✅ WORKING | `usePostProdItems(projectId)` |
| Project → Calendar | ✅ WORKING | `useCalendarEvents(projectId)` |
| Project → Equipment | ✅ WORKING | A11: `useEquipmentInventory(projectId)`, allocations, maintenance |
| Project → Media | ✅ WORKING | A11: `useCameraCards(projectId)`, storage, footage, media assets |
| Project → VFX | ✅ WORKING | A11: VFX shots filtered by projectId, versions, reviews |
| Project → Reports | ✅ WORKING | A12: All 11 reports support project filtering via global filter bar |
| Project → Distribution | ✅ WORKING | `useRightsDeals(projectId)`, `useDistributionAgreements(projectId)`, `useDistributionReleases(projectId)`, `useDistributionRevenue(projectId)`, `useDistributionSettlements(projectId)` — full CRUD with 67 tests |

## 2. Financial Integration (Accounts Aggregation Layer)

The Accounts module is a **read-only aggregation layer** pulling from 13 source collections:

| Source Department | Commitment Source | Payment Source | Status |
|---|---|---|---|
| Cast Contracts | `castContracts.amount` | `milestones[paid]` | ✅ VERIFIED (A9) |
| Crew Remuneration | `remunerationAgreements.totalPayable` | `crewPaymentRecords.amount` | ✅ VERIFIED (A9) |
| Rentals | `rentalRecords.totalRentalCost` | `rentalPayments.amount` | ✅ VERIFIED (A9) |
| Expenses | `productionExpenses.finalAmount` | `expensePayments.amount` | ✅ VERIFIED (A9) |
| Office Rentals | `officeRentals.monthlyRent × 12` | `officeRentPayments.amount` | ✅ VERIFIED (A9) |
| Maintenance | `maintenanceRecords.estimatedCost` | `actualCost` | ✅ VERIFIED (A9) |
| Locations | `locationAgreements.agreedAmount` | `locationPayments.amount` | ✅ VERIFIED (A9) |
| Hotels | `hotelBookings.totalAmount` | `hotelPayments.amount` | ✅ VERIFIED (A9) |
| Travel | `trips.totalCost` | `travelPayments.amount` | ✅ VERIFIED (A9) |
| Props | `propItems.purchaseCost` | — | ✅ VERIFIED (A9) |
| Sets (Option B) | Via `linkedExpenseIds` | — | ✅ VERIFIED (A9) |
| Caravans | `caravans.totalRentalCost` | `depositPaid` | ✅ VERIFIED (A9) |
| Stunt Equipment | `stuntEquipment.purchaseCost` | — | ✅ VERIFIED (A9) |

**Financial Baseline:** Committed ₹277.60 Cr (full seed), Paid ~₹140.0 Cr, PO Commitment ₹2.33 Cr

## 3. Schedule ↔ Production Integration

| Integration | Status | Notes |
|---|---|---|
| ShootDays → DPR | ✅ WORKING | `useDPRByShootDay(shootDayId)` |
| ShootDays → Call Sheets | ✅ WORKING | Call sheets linked to shoot days |
| ShootDays → Attendance | ✅ WORKING | Attendance by project+date |
| Schedule → Scenes | ✅ WORKING | Scene stripboard in schedule components |
| Schedule → Gantt | ✅ WORKING | Gantt chart view in schedule |
| Pre-Prod → Production | ✅ WORKING | Shared page with tabs |
| Post-Prod → Pipeline | ✅ WORKING | Pipeline view with status workflow |

## 4. Script ↔ Scene Integration

| Integration | Status | Notes |
|---|---|---|
| Scripts → Scenes | ✅ WORKING | `addScriptScene`, scene breakdown |
| Scripts → Shots | ✅ WORKING | `addShot` per scene |
| Scripts → Versions | ✅ WORKING | Version history, restore, compare |
| Scripts → References | ✅ WORKING | Reference attachments per script |
| Scene Store ↔ Script Store | ⚠️ DUAL | Two scene systems (scene-store.ts + script-store.ts scenes). Scene-store is project-scoped; script-store scenes are script-scoped. May cause confusion but both function independently. |

## 5. Crew Department Sub-Modules

| Sub-Module | Store | Integration to Accounts | Status |
|---|---|---|---|
| Rentals | rental-store.ts (113L, 13 exports) | ✅ Feeds expense aggregation | COMPLETE |
| Expenses | expense-store.ts (140L, 16 exports) | ✅ Primary expense source | COMPLETE |
| Locations | location-store.ts (97L, 13 exports) | ✅ Location agreements | COMPLETE |
| Hotels | hotel-store.ts (83L, 10 exports) | ✅ Hotel bookings | COMPLETE |
| Travel | travel-store.ts (58L, 6 exports) | ✅ Trip costs | PARTIAL |
| Art/Props/Sets | art-store.ts (194L, 19 exports) | ✅ Props + sets costs | COMPLETE |
| Vehicles/Stunts | vehicle-stunt-store.ts (331L, 29 exports) | ✅ Fleet + stunt costs | COMPLETE |

## 6. Navigation Integration

18 nav items across 5 groups (Overview, Talent, Production, Business, Insights). All routes resolve to functional pages. No broken navigation links detected.

## 7. Gaps and Risks

| # | Gap | Severity | Impact |
|---|---|---|---|
| 1 | ~~Equipment/Media/VFX have no persistent stores~~ | ~~MEDIUM~~ | ✅ RESOLVED (A11) |
| 2 | ~~Distribution is a placeholder~~ | ~~LOW~~ | **RESOLVED in A13** — full store, UI, tests, seed data |
| 3 | ~~Reports is a stub~~ | ~~MEDIUM~~ | ✅ RESOLVED (A12): 11 report categories with cross-module integration |
| 4 | Dual scene systems | LOW | Functional but could cause data model confusion |
| 5 | Finance (legacy) overlaps with Accounts | LOW | Planned migration per roadmap |
| 6 | No notification system | LOW | No push/email/in-app alerts |
| 7 | No audit trail / activity log | MEDIUM | No tracking of who changed what |
