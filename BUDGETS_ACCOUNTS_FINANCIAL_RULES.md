# Budgets & Accounts — Financial Calculation Rules

## Core Formulas

```
Available Budget = Approved Budget − Total Committed

Total Committed = Σ castContracts.amount
               + Σ remunerationAgreements.totalPayable (active)
               + Σ rentalRecords.totalRentalCost (non-cancelled)
               + Σ productionExpenses.finalAmount (non-cancelled, non-rejected)
               + Σ locationAgreements.agreedAmount
               + Σ hotelBookings.totalAmount
               + Σ trips.totalCost
               + Σ caravans.totalRentalCost
               + Σ propItems.purchaseCost
               + Σ productionSets.actualCost (Option B: excluded when linkedExpenseIds exist)
               + Σ stuntEquipment.purchaseCost
               + Σ officeRentals.monthlyRent × 12
               + Σ maintenanceRecords.estimatedCost

Total Paid = Σ castContracts.milestones[status=paid].amount
           + Σ crewPaymentRecords.amount
           + Σ rentalPayments.amount (isDeposit=false)
           + Σ expensePayments.amount
           + Σ officeRentPayments.amount
           + Σ locationPayments.amount (isDeposit=false)
           + Σ hotelPayments.amount (isDeposit=false)
           + Σ travelPayments.amount
           + Σ maintenanceRecords.actualCost (where status=completed and actualCost>0)

Total Deposits = Σ rentalPayments.amount (isDeposit=true)
               + Σ locationPayments.amount (isDeposit=true)
               + Σ hotelPayments.amount (isDeposit=true)
               + Σ caravans.depositPaid
               + Σ officeRentals.securityDeposit (where depositPaid=true)

Outstanding = Total Committed − Total Paid − Total Deposits

Budget Variance = Approved Budget − Total Committed

Department Variance = Department Allocated − Department Committed
```

## Option B — Production Set Accounting Exception

When a production set has valid `linkedExpenseIds` and those expenses exist in `productionExpenses` (non-cancelled, non-rejected), the set's `actualCost` is **excluded** from committed totals. The linked expense records are the financial source of truth.

This rule is applied consistently across:
- Global summary aggregation
- Per-project financial breakdowns
- Per-department financial breakdowns

| Set | LinkedExpenseIds | Treatment |
|---|---|---|
| set1 | exp7 | actualCost excluded; exp7.finalAmount counted |
| set3 | exp8, exp10 | actualCost excluded; exp8 + exp10 counted |
| set4 | exp9 | actualCost excluded; exp9.finalAmount counted |
| Others | none | actualCost counted normally |

## Office Security Deposits

Refundable office rental security deposits (`officeRentals.securityDeposit` where `depositPaid=true`) are tracked in `Total Deposits`, separate from ordinary rental expenses. They are not double-counted with office rent payments.

## Special Cases

| Case | Rule |
|---|---|
| Cancelled expense | Excluded from committed (paymentStatus = cancelled/rejected) |
| Deposit | Tracked separately; counts toward total outflow but NOT as ordinary payment |
| Legacy spent | `project.spent` preserved as-is; never mixed with calculated actuals |
| Company overhead | Records without projectId classified as company; excluded from production project totals |
| Shared assets | Props/equipment without projectId = company assets; cost stays company-level |

## Currency Rules

- Base currency: INR
- All existing records: INR (verified)
- New records support: INR, USD, EUR, GBP
- Exchange rate: manual entry only (no external API)
- Aggregation: always in base currency (INR)

## Budget Revision Chain Rules

- Each project maintains a sequential chain of budget revisions
- First revision `previousAmount` must equal `originalApprovedAmount`
- Subsequent revision `previousAmount` must equal the preceding approved revision's `revisedAmount`
- Pending/submitted revisions do NOT alter the current approved budget
- Only producer-approved revisions update `projectBudget.approvedAmount`
- Rejected/returned revisions do NOT alter the current approved budget
- `changeAmount = revisedAmount − previousAmount`
- `changePercentage = (changeAmount / previousAmount) × 100`

## Approval Workflow

```
Draft → Submitted → Dept-Approved → Finance-Approved → Producer-Approved
                 ↘ Rejected
                 ↘ Returned → (resubmit) → Draft → ...
```

### Store-Level Guards (A3.1)

| Function | Valid Source Statuses | Additional Requirements |
|---|---|---|
| submitBudgetForApproval | draft only | — |
| approveBudget | submitted, dept-approved, finance-approved | Sequential advancement only |
| rejectBudget | submitted, dept-approved, finance-approved | Non-empty comments required |
| returnBudget | submitted, dept-approved, finance-approved | Non-empty comments required |
| resubmitReturnedBudget | returned only | Resets to draft; history preserved |
| createBudgetRevision | n/a (new record) | Valid budget ref, unique ID, unique revisionNumber per budget, draft/submitted status only, positive revisedAmount, non-negative previousAmount, consistent changeAmount, non-empty reason and requestedBy. Returns false and leaves state unchanged on any violation. |
| approveBudgetRevision | submitted only | Producer approval updates project budget |
| updateDepartmentAllocation | draft only | Non-draft allocations are locked |

## Budget Alerts (6 types)

| Alert | Trigger | Severity |
|---|---|---|
| Utilization warning | committed/approved ≥ 80% | warning |
| Utilization critical | committed/approved ≥ 100% | critical |
| Unapproved allocations | Draft department allocations exist | info |
| Expense exceeds budget | paid > approved budget | critical |
| Exposure exceeds budget | paid + outstanding > approved budget | critical |
| Dept allocation overrun | Approved dept allocations > project budget | critical |

## Consolidated Expense Register (A4)

The expense register derives 286 individual line items from 13 source collections without creating duplicate records. Each item preserves its source reference (`sourceType + sourceId`) for traceability.

Summary cards exclude cancelled/rejected items from committed totals, matching the dashboard eligibility rules. Cancelled/rejected records remain visible in the register table for transparency.

Maintenance `actualCost` is treated as paid for completed records with `actualCost > 0` and invoice references. This is consistent across dashboard and register.

| Source Module | Collection | Items | Committed Field | Payment Tracking |
|---|---|---|---|---|
| Cast Talent | castContracts | 23 | amount | milestones[status=paid].amount |
| Crew Remuneration | remunerationAgreements | 36 | totalPayable | crewPaymentRecords |
| Rentals | rentalRecords | 35 | totalRentalCost | rentalPayments (isDeposit split) |
| Production Expenses | productionExpenses | 40 | finalAmount | expensePayments |
| Locations | locationAgreements | 15 | agreedAmount | locationPayments (isDeposit split) |
| Hotels | hotelBookings | 25 | totalAmount | hotelPayments (isDeposit split) |
| Travel | trips | 20 | totalCost | travelPayments |
| Office | officeRentals | 5 | monthlyRent × 12 | officeRentPayments + securityDeposit |
| Maintenance | maintenanceRecords | 20 | estimatedCost | actualCost (completed records only) |
| Caravans | caravans | 15 | totalRentalCost | depositPaid (inline) |
| Props | propItems | 30 | purchaseCost | — |
| Production Sets | productionSets | 12 | actualCost (Option B) | — |
| Stunt Equipment | stuntEquipment | 10 | purchaseCost | — |

Option B sets with linked expenses show `inrAmount = 0` and `paymentStatus = "linked"` to indicate cost is tracked via the linked expense records.

## A5 — Purchase Order Commitment (SEPARATE METRIC)

```
PO Commitment = Σ purchaseOrders.inrTotal WHERE status IN (producer-approved, partially-fulfilled, fulfilled)
```

PO Commitment is tracked as a **SEPARATE** metric in the dashboard, labelled "PO Commitment".
It is NOT added to "Total Committed" (₹277.6 Cr) because:
1. POs may overlap with existing expense commitments (e.g. a PO for equipment that also has a rental record)
2. Until PO-to-expense reconciliation is implemented (A6 Invoices), combining would risk double-counting

### PO Financial Treatment
| Status | Counts toward PO Commitment? | Notes |
|--------|------------------------------|-------|
| draft | No | Not yet submitted |
| submitted | No | Pending approval |
| dept-approved | No | Still in approval chain |
| finance-approved | No | Still in approval chain |
| producer-approved | **Yes** | Fully approved, commitment active |
| partially-fulfilled | **Yes** | Delivery in progress |
| fulfilled | **Yes** | Delivery complete |
| rejected | No | PO rejected |
| returned | No | Sent back for revision |
| cancelled | No | PO cancelled |

### PO Currency Handling
- All POs have `currency` (INR, USD, EUR, GBP) and `exchangeRate`
- `grandTotal` is in the PO's currency; `inrTotal = grandTotal × exchangeRate`
- PO Commitment uses `inrTotal` for consistent INR reporting

### PO Collection Stats (seed data)
- 15 POs across 6 projects
- Total PO value: ~₹5.7 Cr
- PO Committed: ~₹2.3 Cr (producer-approved + fulfilling + fulfilled)
- 1 USD PO (DNEG London mocap, exchangeRate: 84.5)

### PO Line Item Calculation (A5.1)
```
Gross Amount     = quantity × unitPrice
Discount Amount  = Gross Amount × (discount / 100)    // discount is a percentage (0–100)
Line Subtotal    = Gross Amount − Discount Amount
Line Tax         = Line Subtotal × (taxPercent / 100)
Line Total       = Line Subtotal + Line Tax            // rounded to 2 decimal places
```

All monetary values rounded to 2 decimal places via `Math.round(value × 100) / 100`.

### PO Input Validation Guards (A5.1)
| Field | Constraint |
|-------|-----------|
| quantity | positive, Number.isFinite() |
| unitPrice | non-negative, Number.isFinite() |
| discount | 0–100, Number.isFinite() |
| taxPercent | non-negative, Number.isFinite() |
| exchangeRate | positive, Number.isFinite() |

Invalid line items cause `computeLineItem()` to return null. `createPurchaseOrder()` returns null if any line item fails validation. Invalid operations leave data unchanged.

## A6 — Vendor Management & Reconciliation

### Vendor Financial Summary

Per-vendor aggregation from authoritative source records:

```
PO Commitment = Σ purchaseOrders.inrTotal WHERE vendorId = V AND status IN (producer-approved, partially-fulfilled, fulfilled)
Expense Committed = Σ rentalRecords.totalRentalCost (non-cancelled) + Σ propItems.purchaseCost + Σ caravans.totalRentalCost + Σ stuntEquipment.purchaseCost WHERE vendorId = V
Total Paid = Σ rentalPayments.amount (non-deposit, linked to vendor's rentals) + Σ caravans.depositPaid
Outstanding = max(0, Expense Committed − Total Paid)
```

PO Commitment remains **SEPARATE** from expense committed — not summed together to avoid double-counting.

### Vendor Transaction Sources

| Source | Collection | Amount Field | Date Field |
|--------|-----------|-------------|-----------|
| Purchase Orders | purchaseOrders | inrTotal | poDate |
| Rentals | rentalRecords | totalRentalCost | startDate |
| Props | propItems | purchaseCost | purchaseDate |
| Caravans | caravans | totalRentalCost | startDate |
| Stunt Equipment | stuntEquipment | purchaseCost | purchaseDate |

### Reconciliation Exception Rules

| Category | Severity | Trigger | Notes |
|----------|----------|---------|-------|
| po-without-expense | info | Approved PO has no matching expense records for same vendor+project | May be awaiting fulfilment — not an error |
| expense-without-po | info | Expense record has no matching PO for same vendor+project | Direct expenses are legitimate |
| payment-exceeds-committed | warning | Total rental payments exceed totalRentalCost by >1% | Potential overpayment |
| inactive-vendor-active-transaction | warning | Inactive vendor has non-terminal PO | Requires review |

Reconciliation is **read-only by default**. Manual resolution requires an explicit user action with a mandatory reason and creates an audit trail. Resolved/dismissed exceptions retain their full resolution history.

### Known Limitations (A6)

1. Vendor financial summary covers POs, rentals, props, caravans, and stunt equipment — not cast contracts, crew, hotels, travel, offices, or maintenance (these collections do not have vendor ID references, or use free-text payee names instead)
2. Payment tracking is limited to rental payments and caravan deposits — other payment collections reference different entity types
3. Reconciliation exception detection is dynamic (computed at render time), not persisted until manually resolved
4. No automatic financial mutation occurs during reconciliation

## A7 — Insurance Register

### Insurance Policy Types

| Type | Description |
|------|-------------|
| production | Comprehensive production coverage (cast illness, set damage, weather, force majeure) |
| equipment | Camera, lighting, grip, VFX hardware |
| vehicle | Production vehicle fleet (caravans, picture cars, transport) |
| location | Location damage liability and restoration |
| liability | Third-party liability (stunts, public shoots, extras) |
| cast-talent | Key person insurance (leads, director) |
| weather | Parametric weather delay coverage |
| errors-omissions | E&O for distribution clearance (script, title, music rights, IP) |

### Insurance Financial Treatment

```
Insurance Premium = premiumAmount (per policy, frequency varies)
Premium Paid = totalPremiumPaid (actual payments made)
Premium Outstanding = premiumAmount − totalPremiumPaid

Total Coverage = Σ insurancePolicies.coverageAmount
Total Claims Filed = Σ claims.claimedAmount
Total Claims Settled = Σ claims.settledAmount
```

Insurance premiums are tracked **SEPARATELY** from the main committed/paid totals. They are not added to "Total Committed" (₹277.6 Cr) because:
1. Insurance is a risk management cost, not a production expense
2. Coverage amounts represent maximum liability, not actual cost
3. Premium amounts are typically small relative to production budgets

### Insurance Claim Lifecycle

```
Filed → Under Review → Approved → Settled
                    ↘ Denied
Filed → Withdrawn
```

### Policy Status Rules

| Status | Meaning |
|--------|---------|
| active | Policy in force, claims can be filed |
| expired | End date passed, no renewal |
| cancelled | Policy terminated early |
| pending | Quote received, not yet bound |
| renewed | Previous term expired, new term active |

### Expiry Tracking

Policies with `status = "active"` and `endDate` within 30 days of current date are flagged as "expiring soon" in the dashboard alert.

### Seed Data Summary (A7)

- 16 policies across 6 projects (p1, p2, p3, p4, p5, p7)
- 6 claims (3 settled, 1 under-review, 1 filed, 1 settled-minor)
- 5 providers: New India Assurance, ICICI Lombard, Bajaj Allianz, Oriental Insurance, National Insurance, HDFC Ergo
- All 8 policy types represented
- Total coverage: ~₹43.1 Bn (across all projects)
- Total premiums paid: ~₹15.5 Cr
- 1 expired policy (p5), 1 pending policy (p5)

---

## A8 — Insurance Validation & Hardening Rules

### Policy Validation

All store operations (create, update) now return `string | null` (null = success, string = error message).

- **Required fields**: id, policyNumber, provider, projectId
- **Uniqueness**: policyNumber is unique per-provider (not globally — different providers may reuse numbers)
- **Project reference**: validated against live `projects` collection
- **Type/Status/Frequency**: validated against const Set enumerations
- **Numeric fields**: `Number.isFinite()` required + non-negative for coverageAmount, premiumAmount, deductible, totalPremiumPaid
- **Date validation**: start/end dates must be parseable; endDate >= startDate

### Claim Validation

- **Required fields**: id, claimNumber, description
- **Uniqueness**: claim ID globally unique across all policies
- **Numeric fields**: `Number.isFinite()` + non-negative for claimedAmount, settledAmount
- **Amount invariant**: settledAmount <= claimedAmount
- **Filing restriction**: claims can only be filed on policies with `status = "active"`
- **Initial status**: new claims must have `status = "filed"`

### Claim Status Transitions

Strict state machine enforced by `VALID_CLAIM_TRANSITIONS`:

| From          | Allowed To                        |
|---------------|-----------------------------------|
| filed         | under-review, withdrawn           |
| under-review  | approved, denied, withdrawn       |
| approved      | settled, withdrawn                |
| denied        | (terminal)                        |
| settled       | (terminal)                        |
| withdrawn     | (terminal)                        |

Additional rules for `settled` status:
- Must have `settledAmount > 0`
- Must have non-empty `resolutionDate`

### Expiry Alert Tiers

| Tier       | Window    | Urgency |
|------------|-----------|---------|
| Urgent     | ≤ 7 days  | Red     |
| Warning    | ≤ 30 days | Amber   |
| Info       | ≤ 60 days | Muted   |

Date comparison uses `setHours(0,0,0,0)` to normalize to midnight, avoiding timezone off-by-one errors.

---

## A9 — Integration Audit: Authoritative Calculation Paths

### Single Source of Truth

All Accounts financial aggregation flows through `useAccountsDashboard()` in `lib/accounts-store.ts`. No component performs its own financial totals — display-only calculations (e.g., percentage bars, filtered subtotals) are acceptable.

### Source Collection Inventory (13 expense sources)

| Source | Collection | Committed Formula | Paid Source |
|--------|-----------|-------------------|-------------|
| Cast | castContracts | totalFee | milestones where status="paid" |
| Crew | crewMembers | salary × contractMonths | crewPayments |
| Rentals | rentalRecords | totalCost | rentalPayments |
| Expenses | productionExpenses | amount (excl cancelled/rejected) | expensePayments |
| Locations | filmLocations | totalCost | locationPayments |
| Hotels | hotelBookings | totalCost | hotelPayments |
| Travel | travelItineraries | estimatedCost | travelPayments |
| Office | officeRentals | monthlyRent × 12 | officeRentPayments |
| Maintenance | maintenanceRecords | estimatedCost | actualCost (completed only) |
| Caravans | caravans + caravanAllocations | dailyRate × days | — |
| Props | propItems | purchasePrice or rentalCost | — |
| Sets | productionSets | actualCost (0 if linkedExpenseIds) | — |
| Stunt | stuntEquipment | purchasePrice or dailyRate × days | — |

### Separation Rules (verified in A9)

1. **PO Commitment** — separate metric, never merged into committed totals
2. **Insurance** — coverage, premiums, and claims all separate from expenditure
3. **Company-level transactions** — never auto-allocated to projects
4. **Cancelled/rejected** — visible in registers, excluded from active totals

### Global Reconciliation (A9 verified)

Global totals = Σ(project totals) + company-level items. Zero unexplained differences across all 6 financial metrics (budget, committed, paid, deposits, outstanding, PO commitment).
