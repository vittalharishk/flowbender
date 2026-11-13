# Flowbender — Repository Audit

**Audit Date:** 2026-11-04 | **Auditor:** Claude Opus 4.5 | **Repository:** github.com/vittalharishk/flowbender

---

## 1. Executive Summary

Flowbender is a **well-structured film production ERP** with ~92% module completion for its current scope. However, it is **not designed for the movie distribution business** described in the product vision. The transformation requires:

1. **Backend infrastructure** — currently 100% frontend/localStorage
2. **Multi-tenant architecture** — currently single-user demo mode
3. **Distribution-specific workflows** — theatrical, OTT, settlements
4. **Security and authentication** — currently demo tokens only

**Estimated effort to transform:** 16-20 weeks for a minimum viable distribution platform.

---

## 2. Technology Stack

| Layer | Current | Assessment |
|---|---|---|
| **Framework** | Next.js 13.5.1 | ✅ Good — keep |
| **Frontend** | React 18.2.0, TypeScript 5.2.2 | ✅ Good — keep |
| **Styling** | Tailwind CSS 3.3.3, shadcn/ui | ✅ Good — keep |
| **Data Layer** | localStorage + JSON cache | ❌ Replace with PostgreSQL |
| **State Management** | Custom useSyncExternalStore | ⚠️ Adapt for API layer |
| **Charts** | Recharts 2.12.7 | ✅ Good — keep |
| **Forms** | React Hook Form + Zod | ✅ Good — keep |
| **Authentication** | Demo tokens only | ❌ Implement real auth |
| **Backend** | None | ❌ Build FastAPI backend |
| **Database** | None | ❌ Add PostgreSQL |

---

## 3. Codebase Statistics

| Metric | Count |
|---|---|
| Total source files (lib/components/app) | 294 |
| Store files (*-store.ts) | 30 |
| Route pages | 56 |
| Component directories | 28 |
| Type definitions (lib/types.ts) | 2,366 lines |
| Data collections in app-data-store | 88 keys |
| Seed data records | 6,721 |
| APP_DATA_VERSION | 23 |
| Vitest tests | 272 |
| Insurance validation tests | 66 |
| TypeScript errors | 0 |
| Production build | PASSES |

---

## 4. Module Completion Status

### Complete Modules (26)

| # | Module | Store Lines | Evidence |
|---|---|---|---|
| 1 | Projects | 206L | Full CRUD, 7 seeded projects |
| 2 | Cast & Talent | 120L | List/card views, profiles |
| 3 | Casting Pipeline | 388L | Candidates, contracts, milestones |
| 4 | Crew | 14 exports | Members, assignments, payments |
| 5 | Scripts | 27 exports | Editor, scenes, versions |
| 6 | Scenes | 13 exports | Project-scoped, stripboard |
| 7 | Schedule | 536L | Shoot days, Gantt, calendar |
| 8 | Call Sheets | 328L | CRUD, revisions |
| 9 | Attendance | 113L | Records, catering |
| 10 | Post-Production | 57L | Items, milestones, pipeline |
| 11 | Subtitles | — | CRUD within post-prod |
| 12 | Equipment | ~350L | A11: allocations, maintenance, 30 tests |
| 13 | Media | ~505L | A11: camera cards, footage, 30 tests |
| 14 | VFX | ~320L | A11: shots, versions, 30 tests |
| 15 | Locations | 97L | Agreements, permits, payments |
| 16 | Accounts | 1,213L | Budgets, expenses, POs, vendors |
| 17 | Insurance | 413L | Policies, claims, 66 tests |
| 18 | Reports | 11 components | Charts, CSV export, filters |
| 19 | Distribution | 526L | Rights, agreements, revenue |
| 20 | Settings | — | Preferences, data management |
| 21-26 | Sub-modules | Various | Rentals, Expenses, Hotels, Art, Vehicles |

### Partial Modules (6)

| Module | Issue |
|---|---|
| Production/DPR | Thin store (34L), minimal CRUD |
| Pre-Production | Thin store (30L) |
| Finance (Legacy) | Overlaps with Accounts |
| Travel | Small store (58L) |
| Calendar | Minimal store (34L) |

---

## 5. Data Layer Analysis

### Current Architecture

```
Browser localStorage
       ↓
app-data-store.ts (useSyncExternalStore)
       ↓
30 domain stores (*-store.ts)
       ↓
React components
```

### Collections (88 total)

**Production-focused (existing):**
- projects, castMembers, crewMembers, scripts, scenes, scheduleEntries
- shootDays, callSheets, attendanceRecords, dprReports
- equipmentInventory, vfxShots, postProductionItems
- budgetLineItems, expenseItems, purchaseOrders, vendors

**Distribution-focused (basic):**
- rightsDeals, distributionAgreements, distributionReleases
- distributionRevenue, distributionSettlements

**Missing for distribution business:**
- organizations, users, roles, permissions
- theatres, screens, exhibitors
- boxOfficeCollections, settlements
- ottPlatforms, satelliteChannels
- marketingCampaigns, releaseEvents

---

## 6. Financial System Analysis

### Accounts Module (Hardened in A2-A9)

| Component | Status | Notes |
|---|---|---|
| Project Budgets | ✅ Complete | 7 budgets, revisions |
| Department Budgets | ✅ Complete | 84 budgets |
| Expenses | ✅ Complete | 13-source aggregation |
| Purchase Orders | ✅ Complete | 15 POs, discount formula |
| Vendors | ✅ Complete | 20 vendors, ledger |
| Insurance | ✅ Complete | 16 policies, 6 claims |

**Financial Baseline:**
- Committed: ₹277.60 Cr
- Paid: ~₹140.0 Cr
- PO Commitment: ₹2.33 Cr

### Distribution Revenue (Basic)

| Component | Status | Notes |
|---|---|---|
| Rights Deals | ✅ Working | 6 deals seeded |
| Agreements | ✅ Working | 5 agreements, status transitions |
| Releases | ✅ Working | 4 releases |
| Revenue | ✅ Working | 6 revenue records |
| Settlements | ✅ Working | 3 settlements |

### Missing for Distribution Business

| Component | Current | Required |
|---|---|---|
| Theatre Collections | None | Daily gross/net, GST, shares |
| Revenue Sharing | None | Configurable formulas per deal |
| Distributor/Exhibitor Split | None | Per-territory rules |
| Producer Settlements | None | Advance recoupment, P&L |
| Film-wise Accounting | None | Acquisition cost, marketing, collections |

---

## 7. Security Assessment

### Current State

| Area | Status | Risk |
|---|---|---|
| Authentication | ❌ Demo tokens | CRITICAL |
| Authorization | ❌ No enforcement | CRITICAL |
| Tenant Isolation | ❌ Single-user | CRITICAL |
| API Security | ❌ No API | CRITICAL |
| Data Validation | ✅ Input validation | LOW |
| XSS Prevention | ✅ React escaping | LOW |
| CSRF Protection | N/A | — |
| SQL Injection | N/A | — |
| File Upload | ⚠️ Base64 only | MEDIUM |

### Critical Security Gaps

1. **No multi-tenant isolation** — all data visible to all users
2. **No authentication** — anyone can access everything
3. **No audit trail** — no tracking of who changed what
4. **No API security** — no rate limiting, no request validation
5. **No secrets management** — no encryption at rest

---

## 8. UI/UX Assessment

### Strengths
- Functional completeness (26 modules work)
- Dark/light theme support
- Responsive sidebar
- Command palette (Ctrl+K)
- CSV export in reports

### Weaknesses
- No shared component library
- 3 tab patterns, 4 header patterns
- 18 `window.confirm()` calls
- No semantic landmarks
- StatCard component exists but unused
- Missing font file (woff2 404)

**Rating:** FAIR-TO-GOOD — functionally complete but visually inconsistent

---

## 9. Testing Assessment

| Test Type | Coverage | Notes |
|---|---|---|
| Unit tests (vitest) | 272 tests | Equipment, Media, VFX, Reports, Distribution stores |
| Insurance validation | 66 tests | Comprehensive |
| Integration tests | None | — |
| Component tests | None | — |
| E2E tests | None | — |
| Security tests | None | — |

---

## 10. Technical Debt Summary

| ID | Item | Severity | Impact |
|---|---|---|---|
| TD-01 | Monolithic types file (2,366L) | MEDIUM | DX friction |
| TD-03 | Dual scene data model | LOW | Potential confusion |
| TD-04 | Thin stores (DPR, Pre-Prod, Calendar) | LOW | Limited functionality |
| TD-06 | Legacy Finance overlap | MEDIUM | User confusion |
| TD-07 | No auth/authz | CRITICAL | Blocks multi-tenant |
| TD-08 | Test coverage gaps | MEDIUM | Regression risk |
| TD-11 | No notification system | LOW | Missing alerts |

---

## 11. Documentation Quality

### Existing Documents (Verified)

| Document | Status | Accuracy |
|---|---|---|
| ERP_MODULE_COMPLETION_MATRIX.md | ✅ Current | High |
| ERP_MASTER_AUDIT_REPORT.md | ✅ Current | High |
| ERP_TECHNICAL_DEBT_REGISTER.md | ✅ Current | High |
| MODULE_STATUS.md | ⚠️ Outdated | Medium (pre-A11-A13) |
| FRONTEND_BACKEND_INTEGRATION.md | ⚠️ Outdated | Medium (version mismatch) |
| UI_UX_MASTER_AUDIT.md | ✅ Current | High |

### Documentation Gaps

- No API documentation (no API exists)
- No deployment guide
- No contribution guide
- No security policy
- No architecture decision records

---

## 12. Conclusion

### What Can Be Preserved

1. **Frontend architecture** — Next.js + React + TypeScript
2. **UI components** — shadcn/ui + existing modules
3. **Production workflows** — Cast, Crew, Schedule, Post-Production
4. **Financial framework** — Accounts module structure
5. **Distribution foundation** — Basic rights, agreements, releases

### What Must Be Built

1. **Backend API** — FastAPI + PostgreSQL
2. **Multi-tenant architecture** — Organizations, users, roles
3. **Authentication** — JWT + sessions
4. **Distribution workflows** — Theatres, collections, settlements
5. **Security layer** — Tenant isolation, audit trails
6. **Deployment** — Docker, documentation

### Risk Assessment

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Scope creep | HIGH | HIGH | Strict phase gates |
| Breaking existing features | MEDIUM | HIGH | Comprehensive testing |
| Security vulnerabilities | MEDIUM | CRITICAL | Security review per phase |
| Performance issues | LOW | MEDIUM | Load testing early |
| Data migration failures | LOW | HIGH | Rollback procedures |

**Awaiting approval before proceeding to architecture design and implementation.**
