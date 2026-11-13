# Flowbender F8 — Security Test Report

**Date**: 2026-11-13
**Backend**: FastAPI 0.115 at http://localhost:8000
**API**: 472 endpoints across 217 paths

---

## API Authentication — 25/25 PASS

### Health Endpoints
| Test | Expected | Actual | Result |
|------|----------|--------|--------|
| GET /api/v1/health | 200 | 200 | PASS |
| GET /api/v1/auth/bootstrap-status | 200 | 200 | PASS |

### Authentication Flow
| Test | Expected | Actual | Result |
|------|----------|--------|--------|
| Login valid creds (owner) | 200 + tokens | 200 | PASS |
| Login wrong password | 401 | 401 | PASS |
| Login nonexistent email | 401 | 401 | PASS |
| GET /me with valid token | 200 + user | 200 | PASS |
| GET /me without token | 401/403 | 403 | PASS |
| Refresh token | 200 + new tokens | 200 | PASS |
| Logout | 204 | 204 | PASS |

### RBAC
| Test | Expected | Actual | Result |
|------|----------|--------|--------|
| Admin login | 200 | 200 | PASS |
| EP (manager) login | 200 | 200 | PASS |
| Owner list users | 200 | 200 | PASS |
| Admin list users | 200 | 200 | PASS |
| Manager create user | 403 | 403 | PASS |
| Owner audit logs | 200 | 200 | PASS |
| EP audit logs | 403 | 403 | PASS |
| Owner org settings | 200 | 200 | PASS |

### Validation
| Test | Expected | Actual | Result |
|------|----------|--------|--------|
| Empty login body | 422 | 422 | PASS |
| Weak password register | 400 | 400 | PASS |
| Change password without auth | 401/403 | 403 | PASS |

### Security
| Test | Expected | Actual | Result |
|------|----------|--------|--------|
| /me has no password_hash | No hash | Clean | PASS |
| Invalid token rejected | 401 | 401 | PASS |
| Wrong current password rejected | 400 | 400 | PASS |
| Token has reasonable expiry | TTL > 0, <= 86400s | 1800s (30 min) | PASS |

---

## Password Security

- Passwords hashed with bcrypt (passlib)
- Password strength validation: min 8 chars, uppercase, lowercase, digit
- Password hashes never exposed in API responses
- Change-password requires current password verification

## Token Security

- JWT tokens with HS256 signing
- Access token TTL: 30 minutes
- Refresh token TTL: 7 days
- Tokens include: sub (user_id), org (org_id), role, type, exp, iat

## Defect Found & Fixed

**AuditLog table auto-increment on SQLite** (Severity: HIGH)
- Root cause: `BigInteger` primary key doesn't auto-increment on SQLite (only `INTEGER PRIMARY KEY` does)
- Impact: Login returned 500 because AuditLog insert failed with NOT NULL on id
- Fix: Changed `BigInteger` to `Integer` in `backend/app/models/core.py` line 218
- Verification: All 25 API tests pass after fix
