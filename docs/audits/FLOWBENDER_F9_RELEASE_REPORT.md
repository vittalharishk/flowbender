# Flowbender — F9 Release Report

Date: 2026-11-13
Scope: F0–F8 development and verification, final code review, release checkpoint.

## Final test results (executed at commit time)

| Suite | Result |
|-------|--------|
| TypeScript (`npx tsc --noEmit`) | 0 errors |
| Vitest unit tests | 206/206 passed (6 files) |
| Backend pytest (`tests/test_auth_security.py`) | 20/20 passed |
| Python import check (models, routers, app) | PASS |
| Production build (`next build`) | PASS |
| Browser regression (F8, 35 routes) | 35/35 PASS, 0 console errors |
| Frontend auth flow | 5/5 PASS |
| API/RBAC suite (F8) | 25/25 PASS |
| Responsive (1440/1280/820/390) | 4/4 PASS |

## Production configuration status

- `backend/app/config.py` now **refuses to start** in production (`DEBUG=false`) with a placeholder/short `SECRET_KEY` or a SQLite `DATABASE_URL` (verified by running it — startup raised `RuntimeError` as designed).
- `.env` is gitignored and not tracked. `backend/.env.example` and root `.env.example` document all variables without real values.
- Frontend auth mode is explicit: `NEXT_PUBLIC_AUTH_MODE=api` must be set for production; default `local` is demo-only and never switches silently.
- CORS origins, HTTPS, cookie and proxy requirements documented in `FLOWBENDER_PRODUCTION_DEPLOYMENT_CHECKLIST.md`.
- No credentials, database files, logs, or build artifacts are tracked (`tsconfig.tsbuildinfo` removed from the index; `*.db`, `*.db-journal`, `*.log`, `__pycache__` added to `.gitignore`).

## Data and migration status

- Dev database: SQLite (`backend/flowbender.db`, gitignored), 122 tables auto-created at startup.
- Production database: PostgreSQL via `DATABASE_URL`; tables created through SQLAlchemy metadata (Alembic migration history not yet initialized — listed as an outstanding deployment requirement).
- Demo data (org, 3 users, 12 departments) seeded via `backend/seed_demo.py`; safe to re-run (skips when data exists). Not for production — production uses `POST /api/v1/auth/bootstrap`.
- Frontend demo projects p1–p7 and all financial baselines intact: **zero existing store files modified** (verified via `git diff HEAD -- lib/`).

## Defects fixed during F8/F9

1. HIGH — Login 500: `AuditLog` primary key `BigInteger` → `Integer` (SQLite autoincrement).
2. HIGH — Duplicate uvicorn processes bound to port 8000; one stale. Killed, single server policy.
3. MEDIUM — Settings hidden file input missing `aria-label`.
4. MODERATE — Heading-order violations in Settings and Reports.
5. MINOR — Receivables status comparison used `"received"` vs store's `"collected"`.
6. HYGIENE — `tsconfig.tsbuildinfo` untracked; db journals and logs gitignored.

## Outstanding deployment requirements (not blockers for this commit)

1. Generate and set a real `SECRET_KEY` in the production environment.
2. Provision PostgreSQL and set `DATABASE_URL`.
3. Initialize Alembic migration history for schema versioning.
4. Set `NEXT_PUBLIC_AUTH_MODE=api` and `NEXT_PUBLIC_API_URL` for the production frontend.
5. Configure reverse proxy with HTTPS and rate limiting.
6. Set up automated database backups and test restore.

A local commit is **not** a production deployment.
