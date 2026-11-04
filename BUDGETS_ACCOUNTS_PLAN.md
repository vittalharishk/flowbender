# Budgets & Accounts — Architecture Plan

## Business Decisions (Confirmed)

| Decision | Approach |
|---|---|
| Budget structure | Project-level budgets with department allocations |
| Project spent | Legacy `project.spent` preserved as separate high-level estimate |
| Legacy Finance | Gradually migrate; existing `/dashboard/finance` preserved |
| Payment creation | Each source department retains payment authority |
| Currency | Multi-currency (INR base, USD/EUR/GBP supported) |
| Approval workflow | Department Head → Finance → Producer |

## Financial Source-of-Truth

Accounts is a **read-only aggregation layer** over existing department collections:

| Source | Commitment | Payment |
|---|---|---|
| Cast | castContracts.amount | castContracts.milestones[paid] |
| Crew | remunerationAgreements.totalPayable | crewPaymentRecords.amount |
| Rentals | rentalRecords.totalRentalCost | rentalPayments.amount |
| Expenses | productionExpenses.finalAmount | expensePayments.amount |
| Office | officeRentals.monthlyRent × 12 | officeRentPayments.amount |
| Maintenance | maintenanceRecords.estimatedCost | maintenanceRecords.actualCost |
| Locations | locationAgreements.agreedAmount | locationPayments.amount |
| Hotels | hotelBookings.totalAmount | hotelPayments.amount |
| Travel | trips.totalCost | travelPayments.amount |
| Props | propItems.purchaseCost | — |
| Sets | productionSets.actualCost (Option B) | — (via linkedExpenseIds) |
| Caravans | caravans.totalRentalCost | caravans.depositPaid |
| Stunt Equip | stuntEquipment.purchaseCost | — |

### Option B — Production Set Accounting

When a production set has valid `linkedExpenseIds` pointing to existing `productionExpenses`, the linked expense records are the financial source of truth. The set's `actualCost` is excluded to prevent double-counting. Applied consistently across summary, project-level, and department-level aggregation.

## Collections

- `projectBudgets` (7 records) — one per project
- `departmentBudgets` (84 records) — 12 departments × 7 projects
- `budgetRevisions` (6 records) — revision chain per project

## Implementation Roadmap

| Phase | Scope | Status |
|---|---|---|
| A2 | Overview Dashboard + Budget seed | COMPLETED — CLOSED |
| A3 | Budget Management + Revision workflow | COMPLETED — PASSED AUDIT |
| A3.1 | Final Hardening (5 audit warnings) | COMPLETED |
| A3.2 | Revision Validation Hardening | COMPLETED — NaN/Infinity guards + caller fix |
| A4 | Consolidated Expenses + Cast Integration | COMPLETED — 286 items, 13 sources |
| A5 | Purchase Orders | COMPLETED — 15 POs, ₹2.3 Cr commitment (separate metric) |
| A5.1 | PO Discount Formula Hardening | COMPLETED — percentage discount, validation guards, UI |
| A6 | Vendor Management & Reconciliation | COMPLETED — 20 vendors, 73 exceptions, transaction ledger |
| A7 | Insurance Register | COMPLETED — 16 policies, 6 claims, 8 policy types, expiry tracking |
| A8 | Insurance Register Hardening & Verification | COMPLETED — validation hardening, claim transitions, 66 tests, 24 browser checks |
| A9 | Final Integration Audit & Hardening | COMPLETED — full module audit, financial reconciliation, TS fix, 14/14 closure criteria |
| A10 | Reports & Analytics | NOT STARTED |
| A11 | Legacy Migration & Polish | NOT STARTED |
