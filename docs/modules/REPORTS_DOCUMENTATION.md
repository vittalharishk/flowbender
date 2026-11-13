# Reports & Analytics — A12 Documentation

## Report Categories

| # | Category | Description |
|---|----------|-------------|
| A | Project Performance | Budget, progress, risk indicators per project |
| B | Production Progress | Scene completion, shoot days, schedule status |
| C | Daily Production (DPR) | Shoot-day reports, attendance, production notes |
| D | Schedule Variance | Planned vs actual dates, milestone delays |
| E | Cast & Crew | Assignments, contracts, attendance |
| F | Equipment Utilization | Inventory, allocations, maintenance |
| G | Media & Footage | Assets, versions, reviews, storage |
| H | VFX Progress | Shot status, versions, reviews, overdue |
| I | Budget & Expenses | Committed, paid, outstanding, variance |
| J | Department Summary | Department activities, expenses, utilization |
| K | Insurance Summary | Policies, coverage, premiums, claims |

## Source Collections

| Report | Primary Sources |
|--------|----------------|
| A | `useAccountsDashboard`, `useProjects`, scenes |
| B | scenes, shootDays, scheduleEntries |
| C | DPR reports, callSheets, shootDays, attendance |
| D | scheduleEntries, shootDays, milestones, preProdChecklist |
| E | castMembers, castContracts, crewMembers, remunerationAgreements, attendance |
| F | equipmentInventory, equipmentAllocations, equipmentMaintenance |
| G | cameraCards, storageDevices, footageMetadata, mediaAssets, mediaVersions |
| H | vfxShots, vfxVersions, vfxReviews |
| I | `useAccountsDashboard`, `useConsolidatedExpenses`, purchaseOrders |
| J | `useAccountsDashboard` (byDepartment), scenes, scheduleEntries |
| K | insurancePolicies, `useInsuranceDashboard`, insuranceClaims |

## Calculation Definitions

- **Scene progress**: completed = status "completed" or "shot"; in-progress = "in-progress" or "shooting"; pending = all others
- **Budget utilization**: (committed / approved budget) × 100
- **Schedule variance**: actual date − planned date, in days (positive = delayed)
- **Equipment utilization**: (total − available) / total × 100; active allocation quantity = quantity − returnedQuantity
- **VFX shot counts**: version records do not inflate shot counts (versions are per-shot)
- **Media current assets**: superseded versions excluded from current-asset totals
- **Cast financials**: `castContracts.amount` is authoritative, NOT `castMembers.totalFee`
- **Financial totals**: always from `useAccountsDashboard`, never recalculated in report components

## Financial Rules

1. All financial aggregations use `useAccountsDashboard` from accounts-store
2. PO commitment kept separate from expense committed totals
3. Insurance premiums/coverage separate from ordinary expense totals
4. Option B set-cost double-counting rule applied via `linkedExpenseIds`
5. Cancelled/rejected expenses excluded from active committed totals
6. Deposits, outstanding balances, and payment evidence distinctions preserved
7. A2–A9 Accounts implementation not modified

## Filter Behavior

- **Project**: filters all data to selected project; "All projects" shows cross-project aggregations
- **Date range**: filters records by date fields; items without dates pass through; invalid ranges prevented (from > to blocked)
- **Department**: shown for department, budget, and production reports; uses existing department taxonomy
- **Status**: context-specific options per report category
- **Clear**: resets all filters to defaults
- **Active filter context**: displayed in CSV exports

## Export Capabilities

- **CSV**: supported for all report tables; includes title, timestamp, filter context, and proper escaping
- **Excel**: NOT supported — would require xlsx dependency
- **PDF**: NOT supported — would require jspdf dependency
- Exports contain currently filtered data with meaningful filenames

## Known Limitations

1. Browser testing via Playwright not available (no playwright dependency); pages verified via HTTP 200 and TypeScript compilation
2. DPR data may be sparse in demo dataset; empty states shown clearly
3. Insurance premiums/coverage intentionally separate from Budget & Expense report
4. Excel and PDF export not implemented (would require additional dependencies)
5. Charts use recharts (already installed); no additional charting libraries added
6. tsconfig.json excludes `**/*.test.ts` and `**/*.test.tsx` (pre-existing from A11)

## Test Coverage

| Suite | Tests |
|-------|-------|
| Report utilities (report-utils.test.ts) | 42 |
| Report export (report-export.test.ts) | 7 |
| Equipment store (A11) | 30 |
| Media store (A11) | 30 |
| VFX store (A11) | 30 |
| Insurance validation (standalone) | 66 |
| **Total** | **205** |
