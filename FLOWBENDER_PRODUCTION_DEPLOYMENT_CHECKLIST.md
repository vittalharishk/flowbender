# Flowbender — Production Deployment Checklist

A local commit is **not** a production deployment. Complete every item below before going live.

## 1. Secrets

- [ ] Generate a real `SECRET_KEY`: `openssl rand -hex 32`
- [ ] Set it in the server environment or `backend/.env` (never commit `.env`)
- [ ] The backend **refuses to start** with `DEBUG=false` if `SECRET_KEY` is a placeholder or shorter than 32 characters (`backend/app/config.py`)
- [ ] Rotate any credentials that were ever used in development
- [ ] If using MinIO/S3, replace `minioadmin` defaults with real credentials

## 2. Database

- [ ] Provision PostgreSQL 14+
- [ ] Set `DATABASE_URL=postgresql+asyncpg://USER:PASS@HOST:5432/DBNAME`
- [ ] The backend **refuses to start** with `DEBUG=false` on SQLite
- [ ] SQLite remains the default for local development (no setup needed)
- [ ] Run table creation / migrations before first start
- [ ] Configure automated backups (pg_dump nightly at minimum) and test a restore
- [ ] Seed the first account with `POST /api/v1/auth/bootstrap` (works only while the users table is empty) — do **not** run `seed_demo.py` in production

## 3. Backend configuration

- [ ] `DEBUG=false`
- [ ] `CORS_ORIGINS` set to the exact production frontend origin(s) — no wildcards
- [ ] Serve only over HTTPS (terminate TLS at a reverse proxy such as nginx/Caddy)
- [ ] Run uvicorn behind the proxy: `uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 4`
- [ ] Token lifetimes: access 30 min, refresh 7 days (adjust via env if needed)

## 4. Frontend configuration

- [ ] `NEXT_PUBLIC_AUTH_MODE=api` — production must use real backend auth; "local" is demo-only and never switches automatically
- [ ] `NEXT_PUBLIC_API_URL=https://api.yourdomain.com`
- [ ] Build with `npm run build` and serve with `npm start` (or export behind a CDN)
- [ ] Verify login hits the backend, not localStorage demo accounts

## 5. Security verification (run after deploy)

- [ ] `backend/tests/test_auth_security.py` passes against the production URL (use a staging copy, not live data)
- [ ] `/api/v1/auth/me` response contains no `password_hash`
- [ ] Unauthenticated requests to `/api/v1/users/` return 401/403
- [ ] A `manager`-role user cannot create users (403)
- [ ] Audit logs record login/logout/password changes

## 6. Known non-blockers to review

- Redis and MinIO are optional; the app degrades gracefully without them
- Rate limiting is not enabled by default — add at the reverse proxy
- Session invalidation on logout removes server-side sessions; access tokens remain valid until expiry (30 min window)
