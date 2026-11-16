# Flowbender — Movie Production & Distribution ERP

Full-stack ERP for film production houses: script to release — scheduling, cast, crew, budgets, post-production, business finance, distribution, teams, reports, and role-based access.

## Repository layout

```
flowbender/
├── frontend/        # Next.js 13 app (React 18, TypeScript, Tailwind, shadcn/ui)
│   ├── app/         # App Router pages
│   ├── components/  # Workspace components per module
│   ├── lib/         # Stores, hooks, types (localStorage demo data layer)
│   ├── data/        # Dummy/demo data (flowbender-demo-data.json) — replaced by real DB later
│   └── tests/       # Browser test scripts
├── backend/         # FastAPI + SQLAlchemy async API
│   ├── app/         # Models, schemas, routers, auth
│   └── tests/       # pytest security/RBAC suite
├── docs/            # All documentation
│   ├── planning/    # Architecture, roadmaps, requirements, deployment checklist
│   ├── audits/      # Verification and audit reports (F8/F9, ERP audits)
│   ├── modules/     # Per-module specs and checklists
│   └── ui-ux/       # Design system and UI/UX docs
└── scripts/         # Windows service helper scripts (legacy)
```

## Quick start

### Frontend (demo mode — no backend needed)

```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
```

Demo login: `producer@flowbender.demo` / `demo`

App data is stored in PostgreSQL (`app_state` table, one JSONB row per collection) via the `/api/demo-data` route. Module sections (BGM, dubbing, editing, invoices, marketing, publicity, release, teams, trailers, business, distribution channels, receivables) are stored there too, as `mod:<name>` rows. Set `FLOWBENDER_DATABASE_URL` in `frontend/.env.local` (never committed). localStorage is only a fast-start cache, and `frontend/data/flowbender-demo-data.json` is the first-run seed + backup. User accounts persist to the database.

### Backend API

```bash
cd backend
python -m pip install -r requirements.txt
python seed_demo.py                      # one-time: demo organization + users
python sync_app_state.py                 # copy the app's data (app_state) into the backend tables
python -m uvicorn app.main:app --port 8010
```

`DATABASE_URL` in `backend/.env` must point at the same PostgreSQL database as the frontend. Re-run `sync_app_state.py` whenever you want the backend tables to catch up with the app; it is idempotent. Projects owned by signed-up accounts go into that account's own organization, with a backend login using the same email and password.

API docs: http://localhost:8010/docs — health: `/api/v1/health`. The Next.js app proxies `/api/v1/*` to `BACKEND_INTERNAL_URL` (default `http://127.0.0.1:8010`).
Backend demo login: `producer@flowbender.demo` / `Demo1234`

### Connect frontend to backend (later / production)

Set in `frontend/.env.local` (see `frontend/.env.example`):

```
NEXT_PUBLIC_AUTH_MODE=api
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Tests

```bash
cd frontend && npx vitest run            # 206 unit tests
cd backend && python -m pytest tests/    # 20 security/RBAC tests (API must be running)
```

## Production

See [docs/planning/FLOWBENDER_PRODUCTION_DEPLOYMENT_CHECKLIST.md](docs/planning/FLOWBENDER_PRODUCTION_DEPLOYMENT_CHECKLIST.md). The backend refuses to start with `DEBUG=false` on placeholder secrets or SQLite.
