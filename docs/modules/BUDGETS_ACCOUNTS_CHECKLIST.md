# Budgets & Accounts — Implementation Checklist

## A2 — Overview Dashboard (COMPLETED — CLOSED)

### Types & Data Foundation
- [x] Add CurrencyCode, BudgetStatus, ApprovalStatus, ApprovalLevel types
- [x] Add ApprovalRecord, ProjectBudget, DepartmentBudget interfaces
- [x] Add projectBudgets and departmentBudgets to AppDataCollections
- [x] Add to collectionKeys array
- [x] Add to emptyCollections()
- [x] Add to flowbender-demo-seed.ts fallbacks
- [x] Bump APP_DATA_VERSION to 19

### Department Mapping
- [x] Create lib/accounts-departments.ts
- [x] 12-department taxonomy with source pattern mapping
- [x] normalizeDepartment() function
- [x] formatCurrency() with INR/USD/EUR/GBP support
- [x] formatCompactINR() for dashboard display

### Store & Aggregation
- [x] Create lib/accounts-store.ts
- [x] useProjectBudgets() hook
- [x] useDepartmentBudgets() hook
- [x] useAccountsDashboard() aggregation hook
- [x] Reads from ALL existing financial collections
- [x] No duplicate records created

### Seed Data
- [x] 7 projectBudgets (one per project)
- [x] 84 departmentBudgets (12 per project)
- [x] Department allocations sum to project budget

### Workspace Component
- [x] components/accounts/accounts-workspace.tsx
- [x] 7 tabs: Overview, Budgets, Expenses, PO, Invoices, Insurance, Reports
- [x] Overview: summary cards + project table + dept table + expense breakdown
- [x] Budgets: project cards + department allocations table
- [x] Expenses: consolidated read-only aggregation
- [x] PO/Invoices/Insurance: placeholder with phase reference
- [x] Reports: basic summary

### Routes
- [x] /dashboard/accounts (global)
- [x] /dashboard/projects/[id]/accounts (project-scoped)

### Navigation
- [x] Sidebar: "Budgets & Accounts" with Calculator icon
- [x] Workspace title mapping for project routes

---

## A3 — Budget Management (COMPLETED — PASSED AUDIT)

### Types
- [x] Add RevisionStatus, BudgetRevision interfaces to lib/types.ts
- [x] Add budgetRevisions to AppDataCollections
- [x] Bump APP_DATA_VERSION to 20

### Budget Management Functions
- [x] updateDraftBudget() — edit draft budgets only
- [x] updateDepartmentAllocation() — edit department allocations
- [x] submitBudgetForApproval() — draft → submitted
- [x] approveBudget() — sequential Dept Head → Finance → Producer
- [x] rejectBudget() — reject with reason
- [x] returnBudget() — return for revision
- [x] resubmitReturnedBudget() — returned → draft recovery

### Budget Revisions
- [x] createBudgetRevision() — create revision request
- [x] approveBudgetRevision() — producer approval updates project budget
- [x] Revision chain validation (previousAmount chains correctly)

### Budget Alerts
- [x] useBudgetAlerts() hook
- [x] 80% utilization warning
- [x] 100% utilization critical
- [x] Unapproved department allocation info alerts

### UI Component
- [x] components/accounts/budget-management.tsx
- [x] 5 sub-tabs: Project Budgets, Dept Allocations, Revision History, Approval Queue, Budget Comparison
- [x] Edit/Submit/Approve/Reject/Return/Resubmit dialogs

### Seed Data
- [x] 6 budgetRevisions (5 approved, 1 pending)
- [x] Revision chain previousAmount matches originalApprovedAmount
- [x] Department allocations scaled to match revised budgets

---

## A3.1 — Final Hardening (COMPLETED)

### Fix 1 — Option B Consistency
- [x] Apply set double-counting fix to byProject aggregation
- [x] Apply set double-counting fix to byDepartment aggregation
- [x] Verify global, project, and department totals reconcile

### Fix 2 — Store-Level Approval Guards
- [x] approveBudget() — only operates on submitted/dept-approved/finance-approved
- [x] rejectBudget() — only operates on approvable statuses + requires non-empty comments
- [x] returnBudget() — only operates on approvable statuses + requires non-empty comments
- [x] approveBudgetRevision() — only operates on submitted revisions
- [x] updateDepartmentAllocation() — only operates on draft allocations

### Fix 3 — Missing Budget Alerts
- [x] Actual expense exceeds budget (critical)
- [x] Actual expense + outstanding commitments exceeds budget (critical)
- [x] Approved department allocations exceed project budget (critical)

### Fix 4 — Department Allocation Edit Restrictions
- [x] Store: updateDepartmentAllocation() guards approvalStatus === "draft"
- [x] UI: Edit button hidden for non-draft allocations, Lock icon shown instead

### Fix 5 — Documentation Updates
- [x] BUDGETS_ACCOUNTS_PLAN.md — updated roadmap, added budgetRevisions, Option B
- [x] BUDGETS_ACCOUNTS_CHECKLIST.md — added A3 and A3.1 sections
- [x] BUDGETS_ACCOUNTS_FINANCIAL_RULES.md — Option B, office deposits, revision rules, approval guards

### Verification
- [x] APP_DATA_VERSION = 20 (unchanged)
- [x] 79 collections, 6,690 records (unchanged)
- [x] TypeScript: zero errors
- [x] Next.js production build: success

---

## A3.2 — Revision Validation Hardening (COMPLETED — FIXED)

### createBudgetRevision() Store-Level Guards
- [x] Valid budget reference (projectBudgetId exists in projectBudgets)
- [x] ProjectId matches the referenced budget's projectId
- [x] Unique revision ID (no duplicates)
- [x] Valid revision number (positive integer)
- [x] Unique revision number per budget (no duplicate sequence)
- [x] Status restricted to draft or submitted (cannot create as approved/rejected)
- [x] Positive revised amount — **Number.isFinite() rejects NaN/Infinity**
- [x] Non-negative previous amount — **Number.isFinite() rejects NaN/Infinity**
- [x] changeAmount must be finite number — **Number.isFinite() guard added**
- [x] Consistent changeAmount (revisedAmount - previousAmount within ±1)
- [x] Non-empty reason required
- [x] Non-empty requestedBy required
- [x] Returns boolean (true=accepted, false=rejected)
- [x] Invalid operations leave state unchanged
- [x] Existing 6 seed revisions pass all validations

### Caller Return-Value Handling (FIXED)
- [x] handleCreateRevision() checks createBudgetRevision() return value
- [x] On rejection: dialog stays open, alert shown to user
- [x] On success: dialog closes, fields clear

### Verification
- [x] TypeScript: zero errors
- [x] NaN, Infinity, -Infinity all rejected by Number.isFinite()
- [x] No data changes (APP_DATA_VERSION = 20, 79 collections, 6,690 records)

---

## A4 — Consolidated Expenses (COMPLETED — CORRECTED)

### Store: useConsolidatedExpenses() Hook
- [x] Derives 286 expense items from 13 source collections
- [x] Source mappings: cast (23), crew (36), rental (35), expense (40), location (15), hotel (25), travel (20), office (5), maintenance (20), caravan (15), props (30), sets (12), stunt (10)
- [x] Each item has: sourceType, sourceModule, sourceId, title, projectId, department, category, vendor/payee, amounts, payment status, approval status, transaction date, payment history
- [x] Option B: Production sets with linked expenses have inrAmount=0 (cost tracked via expenses)
- [x] Company vs project separation preserved (office rentals, props, stunt equipment, maintenance)
- [x] No duplicate records created — pure derivation from source collections

### Cast Contract Integration (NEW)
- [x] 23 castContracts aggregated (₹238.50 Cr committed, ₹118.45 Cr paid)
- [x] Milestones with status="paid" counted as paid; all others excluded
- [x] Cast member name resolved from castMembers collection
- [x] Contract reference, dates, and milestone payment history included
- [x] Department: cast-talent (existing ACCOUNTS_DEPARTMENTS entry)
- [x] Source filter: "Cast Talent" added to SOURCE_MODULES
- [x] No overlap with crew IDs (cast c* vs crew cr*)
- [x] Per-project attribution from castContracts.projectId

### Maintenance Payment Consistency (FIXED)
- [x] actualCost treated as paid for completed records with actualCost > 0
- [x] Consistent across: dashboard totalPaid, byProject paid, byDepartment paid, byCategory paid
- [x] Non-completed records: actualCost = 0, not counted as paid
- [x] Company vs project attribution preserved
- [x] ₹1,96,200 discrepancy eliminated

### Cancelled/Rejected Summary Fix
- [x] Summary cards exclude cancelled/rejected items from committed totals
- [x] Cancelled/rejected records remain visible in the register table
- [x] Matches dashboard eligibility rules (non-cancelled, non-rejected)

### UI: ExpensesRegister Component
- [x] Summary cards: committed, paid, deposits, outstanding (active items only)
- [x] Full expense register table with 10 columns
- [x] Sortable columns: title, amount, paid, outstanding, date
- [x] Search: title, vendor, source ID, category, description
- [x] Filters: project, department, source module (13 modules incl. Cast), payment status, category, date range
- [x] Clear filters / reset functionality
- [x] Pagination (25 per page)
- [x] Empty states for no data and no filter matches
- [x] Detail drawer with: source info, amount breakdown, payment history, deposit tracking
- [x] Project-scoped view (filters to selected project)
- [x] Global view (shows all records including company-level)

### Financial Reconciliation (Post-Correction)
- [x] Committed: ₹277.60 Cr (₹39.10 Cr existing + ₹238.50 Cr cast)
- [x] Paid: ₹139.95 Cr (₹21.48 Cr existing + ₹118.45 Cr cast + ₹0.02 Cr maintenance)
- [x] Deposits: ₹1.25 Cr — unchanged
- [x] Option B setCost: ₹59,70,000 — unchanged
- [x] 3 Option B sets correctly excluded (inrAmount=0)
- [x] No double-counting across any source
- [x] Dashboard and register use identical eligibility rules

### Verification
- [x] TypeScript: zero errors
- [x] Next.js production build: success
- [x] No data changes (APP_DATA_VERSION = 20, 79 collections, 6,690 records)

## A5 — Purchase Order Management (COMPLETED)

### Types & Data Foundation
- [x] POStatus, POLineItem, POApprovalRecord, POAmendment, POFulfilment, PurchaseOrder types in lib/types.ts
- [x] "purchaseOrders" added to collectionKeys, AppDataCollections, emptyCollections() in app-data-store.ts

### Store (lib/purchase-order-store.ts — 498 lines)
- [x] PO approval workflow: draft → submitted → dept-approved → finance-approved → producer-approved
- [x] Terminal statuses: rejected, returned, partially-fulfilled, fulfilled, cancelled
- [x] CRUD: createPurchaseOrder, updateDraftPO, updatePOLineItems, deletePO
- [x] Approval: submitPO, approvePO, rejectPO, returnPO, resubmitPO, cancelPO
- [x] Amendments: createPOAmendment, approveAmendment
- [x] Fulfilment: recordFulfilment with quantity guards and auto-status
- [x] Hooks: usePurchaseOrders(projectId?), usePODashboard(projectId?)
- [x] SEPARATE poCommitment metric — NOT merged with existing ₹277.6 Cr committed

### Seed Data (15 POs, ~₹5.7 Cr total, ~₹2.3 Cr committed)
- [x] All 10 statuses represented across 6 projects
- [x] Fulfilment records, amendment, USD foreign currency PO
- [x] data/flowbender-demo-data.json patched, buildSeedPurchaseOrders() in seed file

### UI (components/accounts/purchase-orders-workspace.tsx — 866 lines)
- [x] Summary cards, PO register table, search, status/dept filters, pagination
- [x] Create PO dialog, detail sheet, approval/cancel/fulfilment actions
- [x] Wired into accounts-workspace.tsx (replaces PlaceholderTab)

### Verification
- [x] TypeScript: zero new errors
- [x] Production build: success
- [x] Browser: global PO tab shows 15 POs, project p1 shows PO Commitment ₹1.4 Cr
- [x] Existing baseline preserved: Committed ₹277.6 Cr, Paid ₹140.0 Cr unchanged
- [x] APP_DATA_VERSION = 21, 80 collections, 6705 records

---

## A5.1 — Purchase Order Discount Formula Hardening (COMPLETED)

### computeLineItem() Formula Alignment
- [x] Confirmed percentage-based discount: gross × (discount / 100)
- [x] Calculation: gross → discountAmount → lineSubtotal → lineTax → lineTotal
- [x] Monetary rounding: Math.round(value × 100) / 100 on subtotal, tax, total

### Input Validation Guards (validateLineItemInputs)
- [x] Quantity: positive, Number.isFinite()
- [x] Unit price: non-negative, Number.isFinite()
- [x] Discount: 0–100 range, Number.isFinite()
- [x] Tax percent: non-negative, Number.isFinite()
- [x] Exchange rate: positive, Number.isFinite() (in createPurchaseOrder)
- [x] computeLineItem returns null on invalid input; createPurchaseOrder returns null if any line fails
- [x] Invalid operations leave data unchanged

### totalDiscount Fix
- [x] createPurchaseOrder: totalDiscount = Σ(gross − lineSubtotal) — actual discount amount
- [x] updatePOLineItems: same formula — actual discount amount
- [x] Seed data totalDiscount values already correct (verified: 4 POs with discounts)

### UI Improvements
- [x] Create PO dialog: discount % input column added (7-column grid)
- [x] Detail drawer: line items show "(X% off)" when discount > 0
- [x] Detail drawer: totalDiscount displayed as currency amount

### Test Results
- [x] 0% discount: correct (no discount applied)
- [x] 10% discount: correct (gross × 0.10 deducted)
- [x] 50% discount: correct (half price)
- [x] 100% discount: correct (zero total)
- [x] Negative discount: REJECTED
- [x] Discount > 100%: REJECTED
- [x] NaN/Infinity: REJECTED on all numeric fields
- [x] Negative/zero quantity: REJECTED
- [x] Fractional quantities: supported
- [x] GST calculation: tax on post-discount subtotal
- [x] USD PO INR conversion: 64,500 × 84.5 = ₹54,50,250
- [x] Multi-line item aggregation: correct

### Verification
- [x] TypeScript: zero errors
- [x] Production build: success
- [x] All 15 POs intact (IDs, approvals, amendments, fulfilments preserved)
- [x] APP_DATA_VERSION = 21 (unchanged)
- [x] 82 collection keys (unchanged)
- [x] PO Commitment: ₹2.33 Cr (unchanged)
- [x] No seed data modifications

---

## A6 — Vendor Management & Reconciliation (COMPLETED)

### Data Foundation
- [x] reconciliationExceptions collection added to AppDataCollections
- [x] Added to collectionKeys, emptyCollections(), seed fallback
- [x] APP_DATA_VERSION bumped to 22

### Vendor Store (lib/vendor-store.ts)
- [x] deactivateVendor() / activateVendor() — status toggle with guard
- [x] hasVendorTransactions() — prevents deletion of vendors with history
- [x] useVendorFinancials(projectId?) — per-vendor PO commitment, expense committed, paid, outstanding
- [x] useVendorTransactions(vendorId?, projectId?) — unified transaction ledger from POs, rentals, props, caravans, stunt
- [x] useVendorReconciliation(projectId?) — dynamic exception detection
- [x] resolveException() / dismissException() — manual resolution with audit trail
- [x] useVendorDashboard(projectId?) — aggregated summary

### Reconciliation Exception Categories
- [x] po-without-expense: Approved PO with no matching expense records (info)
- [x] expense-without-po: Expense with no matching PO (info)
- [x] payment-exceeds-committed: Overpayment on rental records (warning)
- [x] inactive-vendor-active-transaction: Inactive vendor with active POs (warning)

### UI (components/accounts/vendors-workspace.tsx)
- [x] Dashboard summary cards (7 metrics)
- [x] Vendor Directory: table, search, status/category filters, pagination, create/edit dialogs
- [x] Vendor Detail Sheet: contact info, financial summary, transaction history, activate/deactivate
- [x] Transaction Ledger: search, type/status/project filters, pagination
- [x] Reconciliation: exception cards with resolve/dismiss actions, severity/status badges, filter by category/severity/status
- [x] Wired into accounts-workspace.tsx as "Vendors" tab (replaces A6 placeholder)

### Vendor Validation
- [x] Vendor name mandatory
- [x] Duplicate GSTIN prevention
- [x] Email format validation
- [x] Phone format validation (10-15 digits)
- [x] GSTIN length validation (15 chars)
- [x] Vendors with transactions cannot be deleted (inactivation only)
- [x] Existing vendor IDs preserved (rv1–rv20)

### Verification
- [x] TypeScript: zero new errors (1 pre-existing in vehicle-stunt-store.ts)
- [x] Production build: success
- [x] Browser: Vendors tab loads, directory shows 20 vendors, search works, detail sheet opens
- [x] Transaction ledger shows PO and rental transactions
- [x] Reconciliation detects 73 exceptions (4 PO-only, 57 expense-only, 12 overpayments)
- [x] Project p1 scoping works correctly
- [x] Financial baseline preserved: Committed ₹277.60 Cr, PO Commitment ₹2.33 Cr
- [x] APP_DATA_VERSION = 22, 83 collection keys, 6705 records (0 new data records)
- [x] Zero duplicate IDs, zero invalid vendor references

---

## A7 — Insurance Register (COMPLETED)

### Types & Data Foundation
- [x] InsurancePolicyType (8 types: production, equipment, vehicle, location, liability, cast-talent, weather, errors-omissions)
- [x] InsurancePolicyStatus (5 states: active, expired, cancelled, pending, renewed)
- [x] InsuranceClaimStatus (6 states: filed, under-review, approved, denied, settled, withdrawn)
- [x] InsuranceClaim interface (id, claimNumber, dates, amounts, status, adjuster, resolution)
- [x] InsurancePolicy interface (id, policyNumber, type, provider, project, coverage, premium, deductible, dates, claims, status)
- [x] "insurancePolicies" added to collectionKeys, AppDataCollections (typed as InsurancePolicy[]), emptyCollections()
- [x] APP_DATA_VERSION bumped to 23

### Store (lib/insurance-store.ts)
- [x] useInsurancePolicies(projectId?) — reactive hook with project filtering
- [x] useInsuranceDashboard(projectId?) — aggregated metrics: policies, coverage, premiums, claims, expiry alerts
- [x] createInsurancePolicy() — validation: unique id/policyNumber, positive coverage, non-negative premium/deductible
- [x] updateInsurancePolicy() — partial updates with policyNumber uniqueness check
- [x] fileClaim() — validates policy exists, unique claim id, positive claimed amount
- [x] updateClaim() — partial updates to existing claims
- [x] POLICY_TYPE_LABELS, POLICY_STATUS_LABELS, CLAIM_STATUS_LABELS — display mappings

### Seed Data (16 policies, 6 claims)
- [x] 5 policies for p1 (Pushpa 2): production, equipment, vehicle, location, cast-talent
- [x] 3 policies for p2 (Kalki 2): production, equipment, liability
- [x] 2 policies for p3 (Devara): production, weather
- [x] 2 policies for p4 (Game Changer): production, errors-omissions
- [x] 2 policies for p5 (Salaar 2): production (expired), cast-talent (pending)
- [x] 2 policies for p7 (Spirit): production, liability
- [x] 6 claims: 3 settled, 1 under-review, 1 filed, 1 settled-minor
- [x] 6 Indian insurance providers represented
- [x] All 8 policy types covered

### UI (components/accounts/insurance-workspace.tsx)
- [x] Dashboard summary cards (8 metrics: policies, active, coverage, premiums, claims, settled, open, expiring)
- [x] Expiry alert banner for policies ending within 30 days
- [x] 3 sub-tabs: All Policies, Claims, Coverage by Type
- [x] Policy register: table with search, type/status filters, pagination (15/page)
- [x] Policy detail sheet: financial summary, insured items, claims list, file claim action
- [x] Claims overview: all claims across policies with status filter
- [x] Coverage by type: breakdown table with coverage ratios
- [x] Create policy dialog: full form with validation
- [x] File claim dialog: incident date, amount, description
- [x] Wired into accounts-workspace.tsx (replaces PlaceholderTab)

### Financial Rules
- [x] Insurance premiums tracked SEPARATELY from main committed/paid totals
- [x] Coverage amounts represent maximum liability, not production cost
- [x] Claims tracked per-policy with full lifecycle (filed → settled/denied)

### Verification
- [x] TypeScript: zero new errors (1 pre-existing in vehicle-stunt-store.ts)
- [x] Production build: success
- [x] APP_DATA_VERSION = 23, 84 collection keys
- [x] Financial baseline preserved: Committed ₹277.60 Cr, PO Commitment ₹2.33 Cr (unchanged)
- [x] No duplicate IDs across insurance policies or claims

---

## A8 — Insurance Register Hardening & Verification (COMPLETED)

### Data Model Audit
- [x] Reviewed 10 store-level issues, 4 UI-level issues from A7 implementation
- [x] No schema changes required — APP_DATA_VERSION remains 23

### Policy Validation Hardening (lib/insurance-store.ts)
- [x] validatePolicyInputs() — comprehensive validation: ID, policyNumber, provider, projectId required fields
- [x] Per-provider policyNumber uniqueness (not global — same number allowed for different providers)
- [x] Project reference validated against live projects collection
- [x] Policy type, status, premium frequency validated against Set constants
- [x] Number.isFinite() guards on coverageAmount, premiumAmount, deductible, totalPremiumPaid (rejects NaN/Infinity)
- [x] Non-negative numeric validation on all financial fields
- [x] Date validation: isValidDateString() helper, endDate >= startDate check
- [x] Return type changed from boolean to string | null (null=success, string=error)

### Claims Validation Hardening (lib/insurance-store.ts)
- [x] validateClaimInputs() — required fields: id, claimNumber, description
- [x] Duplicate claim ID check across all policies (global uniqueness)
- [x] Number.isFinite() guards on claimedAmount, settledAmount
- [x] settledAmount <= claimedAmount invariant
- [x] VALID_CLAIM_TRANSITIONS map: strict status transition enforcement
  - filed → under-review, withdrawn only
  - under-review → approved, denied, withdrawn only
  - approved → settled, withdrawn only
  - denied, settled, withdrawn → terminal (no transitions)
- [x] fileClaim() enforces policy.status === "active" before allowing claims
- [x] fileClaim() enforces claim.status === "filed" for new claims
- [x] updateClaim() enforces settled claims need positive settlement + resolution date
- [x] Return types: string | null across all CRUD operations

### Premium/Coverage Calculation Audit
- [x] totalPremiumsDue = Σ(premiumAmount - totalPremiumPaid) for positive deltas only
- [x] totalCoverage = Σ(coverageAmount) across all policies
- [x] Open claims count: filed + under-review + approved statuses
- [x] Insurance premiums tracked SEPARATELY from committed/paid totals (confirmed)

### Expiry Alert Improvements
- [x] Tiered alerts: 7-day (urgent/red), 30-day (warning/amber), 60-day (info/muted)
- [x] Date-only comparison: today.setHours(0,0,0,0) eliminates timezone off-by-one
- [x] Dashboard interface extended: expiringWithin7Days, expiringWithin60Days, cancelledPolicies, renewedPolicies

### UI Audit & Fixes (components/accounts/insurance-workspace.tsx)
- [x] CreatePolicyDialog: error state + error banner, form reset on close, store error display
- [x] FileClaimDialog: error state + error banner, form reset on close, store error display
- [x] Expiry banner: tiered 7/30/60 day display with urgency coloring and days-left calculation

### Automated Tests (lib/insurance-store.test.ts)
- [x] 66 test assertions — ALL PASS
- [x] Policy: required fields (6), duplicates (3), type (2), status (2), numeric (11), date (4), frequency (2)
- [x] Claim: required fields (4), duplicates (1), amounts (6), status (2), dates (2)
- [x] Status transitions: 19 transition pairs tested (all correct)
- [x] Pure validation testing — no React/store mocking needed

### Browser Verification (Puppeteer, headless)
- [x] 24/24 checks PASS
- [x] Global insurance tab: loads, dashboard cards, policy table (15 rows), search, detail sheet, provider info
- [x] Financial baseline: Committed ₹277.6 Cr, PO Commitment ₹2.3 Cr, Paid ₹140.0 Cr — unchanged
- [x] Project-scoped (p1): 5 policies correctly filtered, Insurance Register loads
- [x] Zero JS console errors

### Data Integrity
- [x] 16 policies (ins1–ins16), 6 claims (cl1–cl6) — no duplicates
- [x] All projectId references valid (p1, p2, p3, p4, p5, p7)
- [x] Seed data in flowbender-demo-seed.ts, cache patched in flowbender-demo-data.json
- [x] APP_DATA_VERSION = 23, 84 collection keys — unchanged

### Financial Regression
- [x] Committed ₹277.6 Cr — UNCHANGED
- [x] PO Commitment ₹2.3 Cr — UNCHANGED
- [x] Paid ₹140.0 Cr — UNCHANGED
- [x] Insurance premiums NOT added to committed totals — CONFIRMED

### Build Verification
- [x] TypeScript: 1 pre-existing error (vehicle-stunt-store.ts:264), zero new errors
- [x] Production build: SUCCESS
- [x] APP_DATA_VERSION = 23 (unchanged)

---

## A9 — Accounts Module Final Integration Audit & Hardening (COMPLETED)

### Phase 1 — Architecture Inventory
- [x] 11 store files audited (accounts, PO, vendor, insurance, expense, rental, hotel, location, art, vehicle-stunt)
- [x] 84 collection keys verified
- [x] 48+ hooks, 80+ CRUD functions inventoried
- [x] Zero duplicate calculations across stores
- [x] All components use useAppDataSlice() — zero getAppDataSlice() in renders

### Phase 2 — Financial Calculation Integrity
- [x] Single authoritative calculation path: useAccountsDashboard() in accounts-store.ts
- [x] 13 source collections correctly aggregated for expenses
- [x] Option B set-cost deduplication verified (linkedExpenseIds → actualCost excluded)
- [x] PO commitment correctly separate from committed totals
- [x] Insurance premiums correctly separate from committed/paid totals
- [x] Currency formatting uses Intl.NumberFormat("en-IN") with INR throughout

### Phase 3 — Global/Project Reconciliation
- [x] Global totals reconcile exactly with sum of project-level totals
- [x] Approved Budget: ₹2,330.0 Cr — reconciles
- [x] Committed: reconciles (₹277.6 Cr with full seed, ₹238.5 Cr in cache-only mode)
- [x] Paid: reconciles
- [x] PO Commitment: ₹2.33 Cr — reconciles (p1: ₹1.44 Cr, p2: ₹0.89 Cr)
- [x] Zero unexplained differences

### Phase 4 — Department Reconciliation
- [x] 12 department categories verified with normalizeDepartment()
- [x] Case-insensitive pattern matching with "production-office" fallback
- [x] Department budget allocations per project verified
- [x] No double-counting across departments

### Phase 5 — Budget & Approval Workflow Audit
- [x] Budget: draft → submitted → dept-approved → finance-approved → producer-approved
- [x] Reject/Return require non-empty comments (store-level guard)
- [x] Resubmit only from "returned" status
- [x] Department allocation edit restricted to draft only
- [x] createBudgetRevision: Number.isFinite, unique ID, valid budget ref, consistency check
- [x] approveBudgetRevision: submitted-only guard, updates projectBudget.approvedAmount
- [x] NaN/Infinity rejected on all numeric inputs

### Phase 6 — Expense & PO Integration Audit
- [x] Consolidated Expenses: 13 source collections, paginated 25/page
- [x] Cancelled/rejected records excluded from active committed totals
- [x] 15 POs preserved, all 10 statuses supported
- [x] PO approval: 3-tier chain (dept → finance → producer)
- [x] PO amendments: only on producer-approved POs
- [x] PO fulfilment: per-line-item tracking, auto-status transition
- [x] Discount: percentage-based, GST calculated after discount
- [x] Exchange rates validated with Number.isFinite

### Phase 7 — Vendor & Reconciliation Audit
- [x] 20 vendors preserved
- [x] Duplicate GSTIN prevention, email/phone format validation
- [x] Vendor inactivation (cannot delete vendors with transactions)
- [x] Transaction ledger: POs, rentals, props, caravans, stunt equipment
- [x] 5 reconciliation exception types, mandatory reason for resolution
- [x] Reconciliation never mutates source financial records

### Phase 8 — Insurance Audit
- [x] 16 policies preserved (ins1–ins16), 6 claims preserved (cl1–cl6)
- [x] 8 policy types, strict claim status transitions
- [x] Expiry alerts: 7/30/60 day tiers
- [x] Coverage separate from premiums; premiums separate from committed expenses
- [x] Settled claims require positive settlement + resolution date

### Phase 9 — Data Integrity & Persistence
- [x] APP_DATA_VERSION = 23, 84 collection keys, 6,721 total records
- [x] Zero duplicate IDs across all 82 collections
- [x] Zero invalid project references
- [x] Zero invalid vendor references in POs
- [x] Zero invalid financial numbers (NaN/Infinity)
- [x] stuntEquipmentTransactions/productionSets: 12/12 unique each (prior 12-dupe report resolved)
- [x] Seed TS and JSON cache consistent for populated collections

### Phase 10 — Security & Permissions Audit
- [x] Navigation gated by permission: "finance.view"
- [x] Store mutations use updateAppDataSlice(key, updaterFn) correctly
- [x] No getAppDataSlice() in component renders
- [x] No XSS vectors (React JSX escaping)
- [x] No backend/database — local demo mode only
- [x] Limitation documented: no role-based authorization beyond UI visibility

### Phase 11 — UI & Navigation Audit
- [x] 7 tabs functional: Overview, Budgets, Expenses, Purchase Orders, Vendors, Insurance, Reports
- [x] Global route: /dashboard/accounts
- [x] Project route: /dashboard/projects/[id]/accounts
- [x] Sidebar: "Budgets & Accounts" with Calculator icon
- [x] Search, filters, sorting, pagination verified across all tabs
- [x] Currency formatting consistent (INR, compact notation)
- [x] Zero JS console errors

### Phase 12 — Tests
- [x] Insurance store unit tests: 66/66 PASS
- [x] A8 browser verification: 24/24 PASS
- [x] A9 browser audit: all tabs load, project isolation verified, zero console errors

### Phase 13 — TypeScript Error Fix
- [x] vehicle-stunt-store.ts:264 — fixed with `as const` assertion
- [x] TypeScript: zero errors (npx tsc --noEmit)

### Phase 14 — Build & Performance
- [x] TypeScript: PASS (0 errors)
- [x] Production build: PASS
- [x] No unbounded data loops or excessive re-renders identified
- [x] Pagination on all large tables (15–25 per page)

### Phase 15 — Documentation
- [x] BUDGETS_ACCOUNTS_CHECKLIST.md — A9 section added
- [x] BUDGETS_ACCOUNTS_PLAN.md — A9 status updated
- [x] BUDGETS_ACCOUNTS_FINANCIAL_RULES.md — A9 audit rules added

### Closure Criteria
- [x] 1. Zero new TypeScript errors
- [x] 2. Production build succeeds
- [x] 3. Critical financial calculations tested
- [x] 4. Global/project totals reconciled — zero unexplained differences
- [x] 5. No new duplicate financial transactions
- [x] 6. No new broken references
- [x] 7. PO commitment separate
- [x] 8. Insurance separate
- [x] 9. Vendor totals source-traceable
- [x] 10. Budget approval workflows work
- [x] 11. Reconciliation does not mutate source records
- [x] 12. Project isolation passes
- [x] 13. Historical data preserved
- [x] 14. Browser verification passes

### Known Limitations
- reconciliationExceptions typed as `any[]` in AppDataCollections (tech debt)
- No role-based authorization — UI visibility gates only
- 48 collections empty in JSON cache (populated from seed on version mismatch in browser)
- Cast/crew use different reference patterns than vendor system
- Hotels, travel, office, maintenance use free-text payees (no vendor ID linkage)
