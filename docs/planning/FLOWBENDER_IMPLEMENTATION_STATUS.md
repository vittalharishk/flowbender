# FLOWBENDER — IMPLEMENTATION STATUS

**Date:** 2026-11-13
**Baseline:** Commit 62c9c31 + U11 fixes

---

## Module Status

| Module | Frontend | Backend Models | Backend API | Database | Status |
|--------|----------|---------------|-------------|----------|--------|
| **Dashboard** | COMPLETE | — | — | — | COMPLETE |
| **Projects** | COMPLETE | Project | projects router | No migrations | PARTIAL |
| **Scripts** | COMPLETE | Script, ScriptVersion, Scene | scripts router | No migrations | PARTIAL |
| **Schedule** | COMPLETE | ScheduleEntry, ShootDay, CallSheet | schedule router | No migrations | PARTIAL |
| **Cast** | COMPLETE | CastMember, CastContract, + 4 | cast router | No migrations | PARTIAL |
| **Crew** | COMPLETE | CrewMember, CrewAssignment, + 2 | crew router | No migrations | PARTIAL |
| **Production** | COMPLETE | ProductionTask, DprReport, + 2 | production router | No migrations | PARTIAL |
| **Call Sheets** | COMPLETE | CallSheet | call_sheets router | No migrations | PARTIAL |
| **Attendance** | COMPLETE | AttendanceRecord | attendance router | No migrations | PARTIAL |
| **Locations** | COMPLETE | FilmLocation, + 3 | locations router | No migrations | PARTIAL |
| **Equipment** | COMPLETE | EquipmentItem, + 2 | equipment router | No migrations | PARTIAL |
| **Media** | COMPLETE | CameraCard, StorageDevice, + 3 | media router | No migrations | PARTIAL |
| **VFX** | COMPLETE | VfxShot, VfxVersion, VfxReview | vfx router | No migrations | PARTIAL |
| **Post-Production** | PARTIAL | PostProductionItem, + 3 | post_production router | No migrations | PARTIAL |
| **Subtitles** | COMPLETE | SubtitleLanguage | — | No migrations | PARTIAL |
| **Distribution** | COMPLETE | RightsDeal, + 4 | distribution router | No migrations | PARTIAL |
| **Accounts** | COMPLETE | ProjectBudget, + 5 | budgets router | No migrations | PARTIAL |
| **Finance** | COMPLETE | ExpenseItem, PayrollEntry | expenses router | No migrations | PARTIAL |
| **Insurance** | COMPLETE | InsurancePolicy, InsuranceClaim | insurance router | No migrations | PARTIAL |
| **Reports** | COMPLETE | — | reports router | No migrations | PARTIAL |
| **Settings** | PARTIAL | User, UserSession, AuditLog | auth/users/settings routers | No migrations | PARTIAL |
| **Authentication** | PARTIAL | User, UserSession | auth router | No migrations | PARTIAL |
| **Editing** | MISSING | — | — | — | MISSING |
| **Publicity/Posters** | MISSING | — | — | — | MISSING |
| **Digital Marketing** | MISSING | — | — | — | MISSING |
| **OST Receivables** | MISSING | — | — | — | MISSING |
| **Dubbing** | MISSING | — | — | — | MISSING |
| **BGM** | MISSING | — | — | — | MISSING |
| **Trailers/Teasers** | MISSING | — | — | — | MISSING |
| **Investors** | MISSING | — | — | — | MISSING |
| **Loans** | MISSING | — | — | — | MISSING |
| **Branding** | MISSING | — | — | — | MISSING |
| **Burn/Tranches** | MISSING | — | — | — | MISSING |
| **Receivables** | MISSING | — | — | — | MISSING |
| **Teams** | MISSING | — | — | — | MISSING |
| **Gantt Chart** | MISSING | — | — | — | MISSING |
| **Custom Reports** | MISSING | — | — | — | MISSING |

## Summary

| Status | Count |
|--------|-------|
| COMPLETE (frontend + no backend needed) | 1 |
| PARTIAL (frontend done, backend not connected) | 21 |
| MISSING (not started) | 15 |
| **Total** | **37** |

## Key Findings

1. **Frontend is mature**: 20+ modules with UI/UX redesign (U2-U11), 206 tests, 0 TS errors
2. **Backend exists but is disconnected**: FastAPI with ~70 models and 30 routers, but 0 Alembic migrations, no PostgreSQL database running, frontend uses localStorage
3. **Auth infrastructure exists but unused**: JWT auth, bcrypt hashing, role decorators — all in backend code but frontend defaults to demo mode
4. **15 modules are completely missing**: All F1 new modules (editing through trailers), all F2 modules (investors through tranches), consolidated receivables, teams, Gantt, custom reports
5. **Data lives in localStorage only**: 35 store files, APP_DATA_VERSION 23, ~925 demo records
