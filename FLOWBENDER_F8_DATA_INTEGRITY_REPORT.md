# Flowbender F8 — Data Integrity Report

**Date**: 2026-11-13

---

## Frontend Data (localStorage)

The frontend uses localStorage via `lib/app-data-store.ts` (APP_DATA_VERSION = 23, key `flow-bender.demo-data.v7`).

### Store Files — No Modifications

The 10 core financial store files were NOT modified during F0-F7:

| Store File | Status |
|------------|--------|
| lib/accounts-store.ts | UNCHANGED |
| lib/insurance-store.ts | UNCHANGED |
| lib/vendor-store.ts | UNCHANGED |
| lib/purchase-order-store.ts | UNCHANGED |
| lib/expense-store.ts | UNCHANGED |
| lib/rental-store.ts | UNCHANGED |
| lib/distribution-store.ts | UNCHANGED |
| lib/project-store.ts | UNCHANGED |
| lib/app-data-store.ts | UNCHANGED |

### New Stores (no existing data affected)

business-store, editing-store, dubbing-store, bgm-store, trailer-store, publicity-store, marketing-store, teams-store, receivables-store, distribution-ext-store, release-store, invoice-store, report-store, settings-store, module-store

### Financial Integrity Rules

| Rule | Status |
|------|--------|
| Approval not treated as payment | PASS |
| Agreement value not treated as collected revenue | PASS |
| Investor commitments separated from received funds | PASS |
| Loan principal and interest separated | PASS |
| No duplicate payments | PASS |
| Insurance coverage not in expense totals | PASS |
| Project IDs p1-p7 preserved | PASS |

---

## Backend Database (SQLite)

- 122 tables, PortableUUID/PortableJSON for dual-DB support
- Demo data: 1 org, 3 users, 12 departments
- Defect fixed: AuditLog.id BigInteger -> Integer for SQLite autoincrement
