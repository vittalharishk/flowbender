# ERP Development Roadmap

**Created:** 2026-11-02 | **Based on:** A10 Full ERP Audit

## Current State

- **Overall Completion:** ~85% (22 COMPLETE, 8 PARTIAL, 2 PLACEHOLDER, 0 MISSING)
- **Accounts Module:** Fully hardened through A2–A9 (budgets, expenses, POs, vendors, insurance, reconciliation)
- **TypeScript:** 0 errors | **Build:** Clean
- **Data:** 925 records (cache) / 6,721 records (with seed) across 82 collections

---

## Phase 1: Stabilization & Testing (Priority: HIGH)

### P1.1 — Automated Test Suite
- Add store-level unit tests for: cast-store, schedule-store, call-sheet-store, accounts aggregation
- Target: 80%+ store function coverage
- Effort: 1 week

### P1.2 — Equipment / Media / VFX Store Migration ✅ COMPLETE (A11)
- Created equipment-store.ts, media-store.ts, vfx-store.ts with full CRUD, validation, allocations, versioning
- 6 new collections in app-data-store.ts, 90 vitest tests
- Completed: 2026-11-03

### P1.3 — Types File Refactor
- Split lib/types.ts (2,179L) into domain-specific files
- No logic changes; import path updates only
- Effort: 1 day

---

## Phase 2: Module Completion (Priority: MEDIUM)

### P2.1 — Reports & Analytics Module ✅ COMPLETE (A12)
- 11 report categories: Project Performance, Production Progress, DPR, Schedule Variance, Cast & Crew, Equipment Utilization, Media & Footage, VFX Progress, Budget & Expenses, Department Summary, Insurance Summary
- recharts charts (Bar, Pie, Line), CSV export, 5-dimension filtering
- Uses useAccountsDashboard for financials (never recalculates independently)
- 49 report-specific tests, 139 vitest total + 66 insurance validation = 205 tests
- Completed: 2026-11-03

### P2.2 — DPR / Pre-Prod / Calendar Enhancement
- Expand thin stores (34L, 30L, 34L) with richer CRUD
- Add DPR templates, pre-prod milestones, calendar recurring events
- Effort: 3–4 days

### P2.3 — Distribution Module ✅ COMPLETE (A13)
- Full implementation: rights deals, agreements (5-state transitions), releases (5-state transitions), revenue/collections, settlements, analytics
- Store: distribution-store.ts (526L, 22 exports), 67 tests
- UI: distribution-workspace.tsx (463L, 6 tabs), distribution-report.tsx (164L, integrated in Reports)
- Seed data: 5 agreements, 4 releases, 6 revenue, 3 settlements across p1/p2/p3

### P2.4 — Notification System
- In-app notification store with toast/badge UI
- Wire up settings toggles (deadline alerts, call sheet reminders)
- Effort: 3–4 days

---

## Phase 3: Integration & Polish (Priority: MEDIUM-LOW)

### P3.1 — Legacy Finance Migration (A11)
- Merge /dashboard/finance into Accounts module
- Remove or redirect legacy route
- Per BUDGETS_ACCOUNTS_PLAN.md roadmap
- Effort: 2–3 days

### P3.2 — Scene Model Unification
- Evaluate dual scene systems (scene-store vs script-store scenes)
- Document or unify
- Effort: 2–3 days

### P3.3 — JSON Cache Pre-Population
- Populate key empty collections in flowbender-demo-data.json
- Reduce dependency on seed-based version-mismatch population
- Effort: 1 day

### P3.4 — Audit Trail / Activity Log
- Record create/update/delete actions with timestamps and user context
- Effort: 1 week

---

## Phase 4: Production-Readiness (Priority: LOW — Future)

### P4.1 — Authentication & Authorization
- Replace demo token with proper auth
- Role-based access control per settings page roles
- Effort: 2+ weeks

### P4.2 — Backend Integration
- API layer (FastAPI or similar)
- Database migration from localStorage/JSON to persistent DB
- Multi-user support
- Effort: 4+ weeks

### P4.3 — Mobile Responsiveness Audit
- Ensure all workspaces function on tablet/mobile
- Effort: 1 week

---

## Dependency Graph

```
P1.1 (Tests) ──────────────────┐
P1.2 (Equipment/Media/VFX) ────┤
P1.3 (Types refactor) ─────────┼──→ P2.1 (Reports) ──→ P3.1 (Finance migration)
                                │
P2.2 (DPR/PreProd/Calendar) ───┤
P2.3 (Distribution) ───────────┤──→ P3.4 (Audit trail) ──→ P4.1 (Auth)
P2.4 (Notifications) ──────────┘                           P4.2 (Backend)
```

## Timeline Estimate

| Phase | Duration | Cumulative |
|---|---|---|
| Phase 1 (Stabilization) | 2 weeks | 2 weeks |
| Phase 2 (Module Completion) | 3 weeks | 5 weeks |
| Phase 3 (Integration & Polish) | 2 weeks | 7 weeks |
| Phase 4 (Production-Readiness) | 6+ weeks | 13+ weeks |

**To reach 95% module completion:** Phases 1–2 (~5 weeks)
**To reach production-ready:** All phases (~13+ weeks)
