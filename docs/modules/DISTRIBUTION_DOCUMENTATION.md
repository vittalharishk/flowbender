# Distribution Module Documentation (A13)

## Overview
The Distribution module manages rights deals, agreements, releases, revenue/collections, settlements, deliverables, and analytics across all projects in the Movie Production Management ERP.

## Data Collections (localStorage via AppDataStore)

| Collection | Key | Description |
|---|---|---|
| Rights Deals | `rightsDeals` | Territory-level rights deals with distributors |
| Agreements | `distributionAgreements` | Formal distribution agreements |
| Releases | `distributionReleases` | Release plans per channel/territory |
| Revenue | `distributionRevenue` | Revenue records and collections |
| Settlements | `distributionSettlements` | Settlement calculations between producer/distributor |

## Store: `lib/distribution-store.ts`

### Rights Deals
- `useRightsDeals(projectId?)` — reactive hook, filters by project
- `getRightsDealById(id)` — non-reactive lookup
- `createRightsDeal(input)` — validates, prevents duplicate territory+rightsType per project
- `updateRightsDeal(id, updates)` — partial update
- `deleteRightsDeal(id)` — blocks deletion of signed deals

### Agreements
- `useDistributionAgreements(projectId?)` — reactive hook
- `createAgreement(input)` / `updateAgreement(id, updates)`
- `changeAgreementStatus(id, newStatus)` — enforces `VALID_AGREEMENT_TRANSITIONS`
- `deleteAgreement(id)` — blocks deletion of active agreements

**Status transitions:**
- draft → negotiating, cancelled
- negotiating → pending-approval, draft, cancelled
- pending-approval → active, negotiating, cancelled
- active → expired, terminated
- expired, terminated, cancelled → (terminal)

### Releases
- `useDistributionReleases(projectId?)` — reactive hook
- `createRelease(input)` / `updateRelease(id, updates)`
- `changeReleaseStatus(id, newStatus)` — enforces `VALID_RELEASE_TRANSITIONS`, sets actualDate on release

**Status transitions:**
- planned → confirmed, postponed, cancelled
- confirmed → released, postponed, cancelled
- released → (terminal)
- postponed → planned, confirmed, cancelled
- cancelled → (terminal)

### Revenue
- `useDistributionRevenue(projectId?)` — reactive hook
- `createRevenue(input)` / `updateRevenue(id, updates)`
- `updateCollectionStatus(id, status)` — update collection tracking

### Settlements
- `useDistributionSettlements(projectId?)` — reactive hook
- `createSettlement(input)` — auto-calculates netPayable = gross - commission - deductions
- `updateSettlement(id, updates)`

### Deliverables
- `useDeliverables(projectId?)` — reactive hook
- `getDeliverableById(id)` / `updateDeliverableStatus(id, status)`

### Analytics
- `calcDistributionStats(deals, agreements, revenue)` returns:
  - totalDeals, signedDeals, openDeals
  - totalMG, totalAdvance, totalReceivable
  - byTerritory, byChannel (aggregated MG/advance/count)
  - expiringAgreements (within 30 days)
  - overdueCollections

## UI Components

### `components/distribution/distribution-workspace.tsx`
Main dashboard with project filter and 6 tabs:
1. **Overview** — KPI cards, channel pie chart, territory bar chart, alert cards for expiring/overdue
2. **Rights & Deals** — Filterable table of all rights deals
3. **Agreements** — Table of distribution agreements with status badges
4. **Releases** — Release schedule with planned/actual dates and windows
5. **Revenue** — Collection records with status tracking
6. **Deliverables** — Deliverable items with format and status

### `components/distribution/project-distribution-workspace.tsx`
Per-project rights deal CRUD (pre-existing, used in project detail pages).

### `components/reports/distribution-report.tsx`
Distribution report in the Reports module (A12 integration) with:
- KPI summary cards
- Channel distribution pie chart
- Territory MG bar chart
- Deals detail table with CSV export

## Financial Rules
- Distribution revenue is SEPARATE from Accounts expense commitments
- Agreement value ≠ collected revenue
- An approved agreement ≠ a payment
- Collections counted only when backed by actual collection records
- No duplicate financial entries when linking distribution with Accounts
- All financial display uses `formatINR()` from `lib/utils.ts`

## Pages
| Route | Component |
|---|---|
| `/dashboard/distribution` | `DistributionWorkspace` |
| `/dashboard/projects/[id]/distribution` | `ProjectDistributionWorkspace` |
| `/dashboard/reports` (Distribution tab) | `DistributionReport` |

## Demo Data
Seed data in `lib/flowbender-demo-seed.ts` covers projects p1, p2, p3 with:
- 5 distribution agreements (various channels, statuses)
- 4 release plans (theatrical, digital)
- 6 revenue records (advances, royalties, commissions)
- 3 settlements (partial, pending)

## Types (lib/types.ts)
- `AgreementStatus`: draft | negotiating | pending-approval | active | expired | terminated | cancelled
- `DistributionChannel`: theatrical | satellite | digital-ott | television | audio | dubbed | remake | broadcast | ancillary | other
- `ReleaseStatus`: planned | confirmed | released | postponed | cancelled
- `RevenueType`: advance | minimum-guarantee | royalty | commission | settlement | other
- `CollectionStatus`: pending | partial | collected | overdue | disputed | written-off
