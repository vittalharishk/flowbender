# ERP Technical Debt Register

**Audit Date:** 2026-11-02 | **Auditor:** Claude Opus 4.6 (A10)

## Summary

- **TypeScript Errors:** 0
- **Production Build:** PASSES
- **Total Store Files:** 26
- **Total Route Pages:** 56
- **Total Component Directories:** 24
- **Types File:** 2,179 lines (lib/types.ts)
- **Data Records (JSON cache):** 925 | **With Seed:** 6,721
- **Empty Collections in Cache:** 48 of 82 (populated from seed on version mismatch)

---

## Technical Debt Items

### TD-01: Monolithic Types File
- **File:** lib/types.ts (2,179 lines)
- **Severity:** MEDIUM
- **Impact:** Difficult to navigate; all 82+ types in one file
- **Recommendation:** Split into domain-specific type files (cast-types.ts, schedule-types.ts, etc.)
- **Effort:** LOW (refactor, no logic changes)

### TD-02: Equipment/Media/VFX — No Persistent Stores ✅ RESOLVED (A11)
- **Files:** lib/equipment-store.ts, lib/media-store.ts, lib/vfx-store.ts
- **Severity:** ~~MEDIUM~~ RESOLVED
- **Resolution:** A11 created persistent stores with full CRUD, validation, allocations, versioning, and 90 tests.

### TD-03: Dual Scene Data Model
- **Files:** lib/scene-store.ts (13 exports), lib/script-store.ts (scenes within scripts)
- **Severity:** LOW
- **Impact:** Two parallel scene representations — project-scoped scenes vs script-scoped scenes. Could diverge.
- **Recommendation:** Evaluate whether to unify or clearly document the boundary
- **Effort:** LOW (documentation) to HIGH (unification)

### TD-04: Thin Stores (DPR, Pre-Prod, Calendar)
- **Files:** lib/dpr-store.ts (34L, 6 exports), lib/pre-prod-store.ts (30L, 5 exports), lib/calendar-store.ts (34L, 5 exports)
- **Severity:** LOW
- **Impact:** Minimal CRUD; may not cover all production needs
- **Recommendation:** Extend as features require; current implementations are correct but minimal
- **Effort:** LOW per store

### TD-05: 48 Empty Collections in JSON Cache
- **File:** data/flowbender-demo-data.json
- **Severity:** LOW
- **Impact:** Browser must trigger seed population on version mismatch. Headless testing shows different data than browser with populated seed.
- **Recommendation:** Pre-populate key collections in JSON cache, or document the two-tier data strategy
- **Effort:** LOW

### TD-06: Legacy Finance Module Overlap
- **Files:** components/finance/finance-workspace.tsx (657L), app/dashboard/finance/page.tsx
- **Severity:** LOW
- **Impact:** Overlaps with Accounts module; users may see conflicting financial views
- **Recommendation:** Planned for A11 (Legacy Migration & Polish) per BUDGETS_ACCOUNTS_PLAN.md
- **Effort:** MEDIUM

### TD-07: No Authentication/Authorization Layer
- **Severity:** LOW (demo app)
- **Impact:** Local demo token only (`local-demo-token:1`). No real auth, no role-based access control enforcement.
- **Recommendation:** Acceptable for demo; would need full implementation for production deployment
- **Effort:** HIGH

### TD-08: No Automated Test Suite (beyond insurance-store.test.ts)
- **Files:** lib/insurance-store.test.ts (66 tests)
- **Severity:** MEDIUM
- **Impact:** Only insurance store has tests. No integration tests, no component tests, no E2E tests.
- **Recommendation:** Add store-level unit tests for critical paths (cast contracts, schedule, accounts aggregation)
- **Effort:** HIGH

### TD-09: Reports Module — Stub Only ✅ RESOLVED (A12)
- **File:** components/reports/ (11 report components + workspace + filters + export)
- **Severity:** ~~MEDIUM~~ RESOLVED
- **Resolution:** A12 built full Reports & Analytics module with 11 report categories, recharts charts, CSV export, 5-dimension filtering, 49 report-specific tests. Uses useAccountsDashboard for financials (never recalculates).

### TD-10: Distribution Module — Placeholder
- **Severity:** ~~LOW~~ RESOLVED
- **Resolution:** A13 built full Distribution Management: distribution-store.ts (526L), distribution-workspace.tsx (463L, 6 tabs), distribution-report.tsx (164L), 67 tests, seed data (5 agreements, 4 releases, 6 revenue, 3 settlements). Rights deals, agreements with status transitions, releases, revenue/collections, settlements with auto-calculated netPayable, analytics.

### TD-11: No Notification/Alert System
- **Severity:** LOW
- **Impact:** Settings page has notification toggles (deadline alerts, call sheet reminders) but no backend implementation
- **Recommendation:** Implement in-app notification store with toast/badge system
- **Effort:** MEDIUM

---

## Debt by Priority

| Priority | Items | Est. Total Effort |
|---|---|---|
| MEDIUM | TD-08 (Tests — improved, gaps remain), TD-01 (Types split), TD-06 (Finance migration) | 1–2 weeks |
| LOW | TD-03, TD-04, TD-05, TD-07, TD-11 | As-needed |
| RESOLVED | TD-02 (A11), TD-09 (A12), TD-10 (A13) | — |

---

## UI/UX Readiness Classification

Each remaining debt item classified for the upcoming UI/UX improvement phase:

| Item | Classification | Rationale |
|---|---|---|
| TD-01 (Monolithic types) | **Can fix during UI/UX** | Refactor is safe and improves DX; no visual impact |
| TD-03 (Dual scenes) | **Deferred** | Functional, low risk; unification is architectural, not UI |
| TD-04 (Thin stores) | **Can fix during UI/UX** | UI improvements to DPR/PreProd/Calendar may require store extensions |
| TD-05 (Empty cache collections) | **Deferred** | Demo concern only; no user-facing impact |
| TD-06 (Legacy Finance) | **Must fix before UI/UX** | Duplicate finance views confuse users; remove or redirect before polishing |
| TD-07 (No auth) | **Deferred** | Demo app; auth is Phase 4 |
| TD-08 (Test gaps) | **Can fix during UI/UX** | Add tests for components being redesigned |
| TD-11 (No notifications) | **Can fix during UI/UX** | Notification UX is part of the design system |
