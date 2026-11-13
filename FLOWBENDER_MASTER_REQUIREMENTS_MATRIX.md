# FLOWBENDER — MASTER REQUIREMENTS MATRIX

**Date:** 2026-11-13 (Updated)

Legend: **C** = COMPLETE | **P** = PARTIAL | **M** = MISSING | **V** = NEEDS VERIFICATION

---

## F1: Post-Production

| # | Requirement | Status | Notes |
|---|------------|--------|-------|
| F1.A.1 | Media device management (CF/SD/HDD/SSD/RAID) | P | media-store has assets; no physical device tracking |
| F1.A.2 | Check-in/check-out workflow | M | |
| F1.A.3 | Transfer history | M | |
| F1.A.4 | Storage utilization tracking | M | |
| F1.B.1 | Editing workspace linked to Script | M | |
| F1.B.2 | Scene-wise editing status | M | |
| F1.B.3 | Cut versions (rough/fine/final) | M | |
| F1.B.4 | Editor assignment and workload | M | |
| F1.B.5 | Review and approval workflow | M | |
| F1.C.1 | VFX scenes and shots | C | vfx-store has shots with codes, scene refs |
| F1.C.2 | VFX vendor/artist assignment | P | Has artist field; no vendor management |
| F1.C.3 | VFX cost tracking | M | |
| F1.C.4 | VFX version submissions and reviews | C | vfx-store has versions and reviews |
| F1.C.5 | VFX approval workflow | P | Has review status; no formal director/producer approval |
| F1.D.1 | Publicity asset types (posters, banners, press kits) | M | |
| F1.D.2 | Asset review and approval workflow | M | |
| F1.D.3 | Platform and release tracking | M | |
| F1.E.1 | Marketing campaign management | M | |
| F1.E.2 | Platform-specific campaigns | M | |
| F1.E.3 | Campaign metrics (reach, impressions, clicks) | M | |
| F1.E.4 | Marketing spend integration with Accounts | M | |
| F1.F.1 | OST receivables workflow | M | |
| F1.F.2 | Payment milestones and settlements | M | |
| F1.G.1 | Dubbing management | M | |
| F1.G.2 | Multi-language support | M | |
| F1.G.3 | Recording schedule and status | M | |
| F1.H.1 | BGM cue management | M | |
| F1.H.2 | Scene-linked BGM | M | |
| F1.H.3 | BGM approval workflow | M | |
| F1.I.1 | Subtitles language management | C | Existing subtitles module |
| F1.I.2 | Subtitle version management | P | Basic support; needs translator/reviewer fields |
| F1.I.3 | Multi-language per project | P | Supported; needs workflow fields |
| F1.J.1 | Trailer/teaser management | M | |
| F1.J.2 | Promotional video versions and approvals | M | |
| F1.K.1 | Post-production consolidated dashboard | P | Basic post-prod page exists; needs full dashboard |

## F2: Business Management

| # | Requirement | Status | Notes |
|---|------------|--------|-------|
| F2.A.1 | Investor register | M | |
| F2.A.2 | Investment status tracking (proposed/committed/received/returned) | M | |
| F2.A.3 | Investment-to-project allocation | M | |
| F2.B.1 | Loan register | M | |
| F2.B.2 | Interest calculation (simple/compound) | M | |
| F2.B.3 | Repayment schedule and tracking | M | |
| F2.B.4 | Automated interest calculation tests | M | |
| F2.C.1 | In-film branding management | M | |
| F2.C.2 | Brand receivables tracking | M | |
| F2.D.1 | Production burn tracking | M | |
| F2.D.2 | Tranche management | M | |
| F2.D.3 | Burn integration with Accounts selectors | M | |
| F2.E.1 | Business dashboard | M | |

## F3: Distribution Expansion

| # | Requirement | Status | Notes |
|---|------------|--------|-------|
| F3.A.1 | Rights and territories | P | distribution-store has rights deals; no territory conflict detection |
| F3.A.2 | Exclusive rights conflict prevention | M | |
| F3.B.1 | Digital distribution (platform agreements) | P | Existing distribution covers some; needs platform-specific fields |
| F3.B.2 | Minimum guarantee and revenue share | M | |
| F3.C.1 | Satellite distribution | M | |
| F3.D.1 | Audio distribution | M | |
| F3.E.1 | Consolidated receivables workspace | M | |
| F3.E.2 | Cross-module receivables aggregation | M | |

## F4: Teams and Department Management

| # | Requirement | Status | Notes |
|---|------------|--------|-------|
| F4.A.1 | Department directory | P | Crew has departments; no dedicated directory |
| F4.B.1 | Team member management | P | Crew module has members; needs formalization |
| F4.B.2 | Project assignments across teams | P | Crew assignments exist |
| F4.C.1 | Team dashboard | M | |
| F4.D.1 | Multi-project team assignments | P | Possible via crew; needs dedicated view |

## F5: Advanced Reports

| # | Requirement | Status | Notes |
|---|------------|--------|-------|
| F5.A.1 | Executive overview report | M | |
| F5.A.2 | Department spending pie chart | M | |
| F5.B.1 | Interactive Gantt chart | M | |
| F5.C.1 | Production reports | C | Existing report categories |
| F5.D.1 | Scheduling reports | C | Existing report categories |
| F5.E.1 | Budget and finance reports | C | Existing report categories |
| F5.E.2 | Loan/investor/tranche reports | M | Depends on F2 |
| F5.F.1 | Cast and crew reports | C | Existing |
| F5.G.1 | Equipment reports | C | Existing |
| F5.H.1 | Location reports | C | Existing |
| F5.I.1 | Post-production reports | M | Depends on F1 |
| F5.J.1 | Business and distribution reports | M | Depends on F2/F3 |
| F5.K.1 | Custom report builder | M | |
| F5.K.2 | Saved report configurations | M | |
| F5.K.3 | Role-based report access | M | |

## F6: Settings, Authentication and User Management

| # | Requirement | Status | Notes |
|---|------------|--------|-------|
| F6.A.1 | Login/logout | P | Backend JWT auth; frontend uses demo login |
| F6.A.2 | Password hashing (bcrypt) | C | Backend implemented |
| F6.A.3 | Password change | M | |
| F6.A.4 | Password reset flow | M | |
| F6.A.5 | Session management and expiry | P | JWT tokens; no expiry UI |
| F6.A.6 | CSRF protection | M | |
| F6.A.7 | Login failure handling | P | Backend 401; no lockout |
| F6.A.8 | Account deactivation | P | Model has is_active; no UI |
| F6.A.9 | Initial administrator bootstrap | M | |
| F6.B.1 | User CRUD UI | P | Backend router; no frontend |
| F6.B.2 | Role assignment | P | Backend supports; no frontend |
| F6.B.3 | Project assignment to users | M | |
| F6.B.4 | Department assignment to users | M | |
| F6.C.1 | Business Owner role | P | "owner" enum exists |
| F6.C.2 | Administrator role | P | "admin" enum exists |
| F6.C.3 | Executive Producer (project-scoped) | M | No project scoping |
| F6.C.4 | Additional configurable roles | P | 6 roles; not configurable |
| F6.D.1 | Role-based access control | P | require_roles() exists |
| F6.D.2 | Project-level access control | M | |
| F6.D.3 | Department restrictions | M | |
| F6.D.4 | Server-side permission enforcement | P | Role checks; no project checks |
| F6.E.1 | Project access management UI | M | |
| F6.E.2 | API-level project access enforcement | M | |
| F6.F.1 | Settings workspace | P | Demo data management only |
| F6.F.2 | Audit logs UI | M | |
| F6.F.3 | Organization profile | M | |

## F7: Backend, Database and Security

| # | Requirement | Status | Notes |
|---|------------|--------|-------|
| F7.A.1 | Normalized database models | P | ~70 models; 0 migrations |
| F7.A.2 | Alembic migrations | M | |
| F7.A.3 | Missing models for F1-F3 | M | ~30 needed |
| F7.B.1 | Existing module API endpoints | P | 30 routers |
| F7.B.2 | New module API endpoints | M | ~16 needed |
| F7.B.3 | Input validation | V | |
| F7.B.4 | Pagination and filtering | V | |
| F7.C.1 | Audit log recording | P | Model exists |
| F7.C.2 | Audit log viewer | M | |
| F7.D.1 | Database backup | M | |
| F7.D.2 | Backup schedule and retention | M | |
| F7.D.3 | Restore documentation | M | |
| F7.E.1 | Security review | M | |
| F7.E.2 | Rate limiting | P | Middleware exists |
| F7.E.3 | Secrets management | P | .env with defaults |
| F7.E.4 | .env.example | V | |

---

## Summary

| Phase | C | P | M | V | Total |
|-------|---|---|---|---|-------|
| F1 | 3 | 6 | 26 | 0 | 35 |
| F2 | 0 | 0 | 13 | 0 | 13 |
| F3 | 0 | 2 | 6 | 0 | 8 |
| F4 | 0 | 4 | 1 | 0 | 5 |
| F5 | 5 | 0 | 8 | 0 | 13 |
| F6 | 1 | 13 | 11 | 0 | 25 |
| F7 | 0 | 5 | 8 | 3 | 16 |
| **Total** | **9** | **30** | **73** | **3** | **115** |

**Overall: ~21% complete, ~34% weighted including partial work**
