# FLOWBENDER — REMAINING GAPS ANALYSIS

**Date:** 2026-11-13
**Baseline:** Repository as of commit 62c9c31 + U11 fixes

---

## F1: Post-Production Management

| Gap | Severity | Effort | Notes |
|-----|----------|--------|-------|
| Media device management (CF/SD/HDD/SSD/RAID check-in/out) | High | Medium | Existing media-store has basic assets; needs physical device tracking, serial numbers, transfer history |
| Editing management (scene-wise editing status, cuts, reviews) | High | High | No editing workflow exists. Needs new store, models, UI |
| VFX extension (vendor assignment, cost tracking, approvals) | Medium | Medium | Existing vfx-store has shots/versions/reviews; needs vendor, cost, approval fields |
| Posters and Publicity module | High | High | Completely missing. New store, models, UI |
| Digital Marketing campaigns | High | High | Completely missing. New store, models, UI |
| OST Receivables | High | Medium | Completely missing. New store, models, UI |
| Dubbing management | High | High | Completely missing. New store, models, UI |
| BGM management | High | Medium | Completely missing. New store, models, UI |
| Subtitles extension (multi-language, translator, reviewer) | Medium | Medium | Existing subtitles module has basic support; needs workflow fields |
| Trailers and Teasers | High | Medium | Completely missing. New store, models, UI |
| Post-production dashboard | Medium | Medium | Existing post-prod page is minimal; needs consolidated view |

## F2: Business Management

| Gap | Severity | Effort | Notes |
|-----|----------|--------|-------|
| Investor management | Critical | High | Completely missing. New store, models, UI, financial integration |
| Loan management with interest calculations | Critical | High | Completely missing. Complex financial logic, needs automated tests |
| In-film Branding | High | Medium | Completely missing. New store, models, UI |
| Burn and Tranche management | Critical | High | Completely missing. Must integrate with existing Accounts selectors |
| Business dashboard | Medium | Medium | Depends on all F2 modules above |

## F3: Distribution Expansion

| Gap | Severity | Effort | Notes |
|-----|----------|--------|-------|
| Rights and Territories (conflict detection) | High | Medium | Existing distribution has rights deals but no territory conflict detection |
| Digital Distribution (platform agreements, MG, revenue share) | High | Medium | Partially covered by existing distribution; needs platform-specific fields |
| Satellite Distribution | High | Medium | Completely missing |
| Audio Distribution | High | Medium | Completely missing |
| Consolidated Receivables workspace | Critical | High | Completely missing. Must aggregate across distribution, satellite, digital, audio, OST, branding |

## F4: Teams and Department Management

| Gap | Severity | Effort | Notes |
|-----|----------|--------|-------|
| Department directory | Medium | Low | Existing crew has departments; needs dedicated directory view |
| Team member management | Medium | Medium | Crew module has members; needs team-specific assignment/availability views |
| Team dashboard | Medium | Medium | Completely missing |
| Project team assignments | Medium | Medium | Crew assignments exist but not formalized as team assignments |

## F5: Advanced Reports

| Gap | Severity | Effort | Notes |
|-----|----------|--------|-------|
| Executive Overview report | High | Medium | Existing reports cover 12 categories but no executive summary |
| Gantt chart | High | High | Completely missing. Needs interactive timeline component |
| Post-production reports | Medium | Medium | Depends on F1 modules |
| Business and Distribution reports | Medium | Medium | Depends on F2/F3 modules |
| Custom report builder | High | High | Completely missing. Configurable fields, filters, saved configurations |

## F6: Settings, Authentication and User Management

| Gap | Severity | Effort | Notes |
|-----|----------|--------|-------|
| Connect frontend to backend auth | Critical | Medium | Backend auth exists; frontend defaults to localStorage demo mode |
| User management UI (create, edit, activate/deactivate) | Critical | Medium | Settings page has demo account management only |
| Role mapping (Business Owner, Administrator, Executive Producer) | Critical | Medium | Backend has 6 roles; need remapping and additional configurable roles |
| Project-level access control | Critical | High | No UserProjectAccess model. Executive Producer must be restricted to assigned projects |
| Department restrictions | High | Medium | No user-department assignment model |
| Permission enforcement on API endpoints | Critical | High | Backend has require_roles() but no project-scoped checks |
| Audit logs UI | Medium | Medium | Backend AuditLog model exists; no UI |
| Password reset flow | High | Medium | Backend has password hashing; no reset flow |
| Session management and expiry | High | Medium | JWT tokens exist; no session cleanup or expiry UI |
| Administrator bootstrap process | Critical | Low | Needs documented initial admin setup |

## F7: Backend, Database and Security

| Gap | Severity | Effort | Notes |
|-----|----------|--------|-------|
| Alembic migrations for existing models | Critical | Medium | ~70 models, 0 migrations created |
| Missing database models (F1-F3 modules) | Critical | High | ~30+ new models needed |
| API endpoints for new modules | Critical | High | ~15+ new routers needed |
| Data migration from localStorage | Critical | High | 35 stores, 925+ records, ID preservation |
| Security hardening (CSRF, rate limiting, input validation) | High | Medium | Rate limiter exists; needs comprehensive review |
| Backup and recovery | Medium | Medium | No backup infrastructure |

---

## Summary

| Phase | Critical | High | Medium | Total |
|-------|----------|------|--------|-------|
| F1 | 0 | 7 | 4 | 11 |
| F2 | 3 | 1 | 1 | 5 |
| F3 | 1 | 3 | 0 | 4 (+ existing partial) |
| F4 | 0 | 0 | 4 | 4 |
| F5 | 0 | 3 | 2 | 5 |
| F6 | 5 | 3 | 2 | 10 |
| F7 | 4 | 1 | 1 | 6 |
| **Total** | **13** | **18** | **14** | **45** |
