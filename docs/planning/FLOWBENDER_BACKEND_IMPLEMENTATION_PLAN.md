# FLOWBENDER — BACKEND IMPLEMENTATION PLAN

**Date:** 2026-11-13

---

## 1. Current State

- **FastAPI 0.115** with SQLAlchemy 2.0 async, Alembic, configured for PostgreSQL+asyncpg
- **~70 model classes** across 13 files in `backend/app/models/`
- **30 routers** in `backend/app/routers/`
- **Auth utilities**: JWT tokens, bcrypt hashing, `require_roles()` dependency
- **0 Alembic migrations**: `versions/` contains only `.gitkeep`
- **Frontend**: `NEXT_PUBLIC_AUTH_MODE=local` (localStorage demo mode)

## 2. Phase 1: Database Bootstrap

### 2.1 Create Initial Alembic Migration

```bash
cd backend
alembic revision --autogenerate -m "initial_schema"
alembic upgrade head
```

This generates DDL for all ~70 existing models. Verify FK constraints and indexes.

### 2.2 Database Setup

- Use SQLite for development (`sqlite+aiosqlite:///./flowbender.db`)
- PostgreSQL for production (already configured in `backend/app/config.py`)
- Document both in `.env.example`

## 3. Phase 2: Missing Models for F1-F3

### 3.1 Post-Production Models (new file: `models/post_production_ext.py`)

| Model | Key Fields |
|-------|-----------|
| EditingTask | project_id, scene_id, editor, status (rough_cut/fine_cut/director_review/producer_review/final), version, start_date, completion_date, comments |
| DubbingRecord | project_id, scene_id, character, language, artist, studio, status, retakes, approval |
| BgmCue | project_id, scene_id, cue_id, composer, duration, status, version, approval |
| PublicityAsset | project_id, type (poster/banner/press_kit/social), name, designer, version, approval_status, platform, release_date |
| MarketingCampaign | project_id, name, platform, objective, budget, actual_spend, start_date, end_date, status, owner |
| OstReceivable | project_id, music_label, contract_value, invoiced, received, outstanding, status |
| TrailerDeliverable | project_id, type (teaser/trailer/promo), editor, version, runtime, approval, release_date, platform |

### 3.2 Business Models (new file: `models/business.py`)

| Model | Key Fields |
|-------|-----------|
| Investor | name, type, company, contact, notes |
| InvestorAllocation | investor_id, project_id, amount, investment_date, type, status (proposed/committed/received/returned) |
| Loan | lender, borrower, project_id, principal, interest_rate, interest_method (simple/compound), compounding_frequency, start_date, maturity_date, collateral, status |
| LoanRepayment | loan_id, date, amount, principal_portion, interest_portion, balance |
| BrandingDeal | brand, project_id, placement_type, scene_id, agreement_value, deliverables, approval, invoice_amount, received, outstanding |
| FundingTranche | project_id, source, investor_id, tranche_number, planned_amount, approved_amount, released_amount, received_amount, status, release_date |

### 3.3 Distribution Extension Models (new file: `models/distribution_ext.py`)

| Model | Key Fields |
|-------|-----------|
| DistributionTerritory | project_id, territory, country, region, rights_category, exclusive, licensee, start_date, end_date, status |
| DigitalDistribution | project_id, platform, territory, language, license_period, contract_value, minimum_guarantee, revenue_share, actual_receipts, outstanding |
| SatelliteDistribution | project_id, broadcaster, territory, language, contract_value, rights_period, telecast_dates |
| AudioDistribution | project_id, music_label, territory, language, contract_value, revenue_share, collections, outstanding |
| ConsolidatedReceivable | source_type, source_id, project_id, customer, invoice_date, due_date, amount, received, outstanding, status |

### 3.4 Access Control Models (extend `models/core.py`)

| Model | Key Fields |
|-------|-----------|
| UserProjectAccess | user_id, project_id, access_level (view/edit/manage), granted_by, granted_at |
| UserDepartmentAccess | user_id, department, access_level |
| Permission | role, module, action (view/create/edit/delete/approve/export/manage) |

## 4. Phase 3: Role Remapping

### Current → New Mapping

| Current Role | New Role | Scope |
|-------------|----------|-------|
| owner | business_owner | All projects, all business modules, all reports |
| admin | administrator | All projects, user management, settings |
| manager | executive_producer | Assigned projects only |
| accountant | accounts_manager | Financial modules, assigned projects |
| staff | department_user | Assigned department/projects |
| viewer | viewer | Read-only, assigned projects |

Add to User model: `department`, `is_active` flag (already exists).

### Project-Scoped Authorization

```python
async def require_project_access(project_id: str, user: CurrentUser):
    if user.role in ("business_owner", "administrator"):
        return  # full access
    access = await get_user_project_access(user.user_id, project_id)
    if not access:
        raise HTTPException(403, "No access to this project")
```

Apply to all project-scoped endpoints.

## 5. Phase 4: New API Routers

| Router | Endpoints | Auth |
|--------|-----------|------|
| editing | CRUD + status transitions + scene linkage | project-scoped |
| dubbing | CRUD + recording status + retakes | project-scoped |
| bgm | CRUD + cue management + approvals | project-scoped |
| publicity | CRUD + approval workflow + asset types | project-scoped |
| marketing | CRUD + campaign metrics + platform filter | project-scoped |
| ost_receivables | CRUD + payment milestones + settlement | project-scoped |
| trailers | CRUD + versions + approvals | project-scoped |
| investors | CRUD + allocations + status tracking | business_owner/admin |
| loans | CRUD + repayments + interest calculation | business_owner/admin |
| branding | CRUD + placement + receivables | project-scoped |
| tranches | CRUD + release tracking | business_owner/admin |
| receivables | Consolidated view + filters + aging | business_owner/admin |
| territories | CRUD + conflict detection | project-scoped |
| digital_distribution | CRUD + platform management | project-scoped |
| satellite | CRUD + broadcaster management | project-scoped |
| audio_distribution | CRUD + label management | project-scoped |
| teams | CRUD + department directory + assignments | admin+ |
| departments | Directory + headcount + workload | admin+ |
| permissions | Role-permission matrix + assignment | admin only |
| audit_logs | Read-only log viewer + filters | admin+ |

## 6. Phase 5: Frontend Connection

### 6.1 API Client

Create `lib/api-client.ts`:
- Axios/fetch wrapper with JWT token management
- Auto-refresh on 401
- Base URL from `NEXT_PUBLIC_API_URL`

### 6.2 Dual-Mode Stores

Each store gets an API mode:
```typescript
export function useProjects() {
  if (AUTH_MODE === "api") return useProjectsAPI();
  return useProjectsLocal(); // existing localStorage logic
}
```

### 6.3 Switch AUTH_MODE

Set `NEXT_PUBLIC_AUTH_MODE=api` in `.env.local` once backend is running.

## 7. Phase 6: Security Hardening

- CSRF protection on state-changing endpoints
- Rate limiting (existing middleware, configure thresholds)
- Input validation on all endpoints (Pydantic models)
- SQL injection prevention (SQLAlchemy parameterized queries)
- XSS prevention (React default escaping + API output schemas)
- Secrets in environment variables only
- `.env.example` without real credentials

## 8. Execution Order

1. Alembic initial migration for existing models
2. Add missing models (F1-F3, access control)
3. Generate migration for new models
4. Add new API routers
5. Implement project-scoped authorization
6. Create frontend API client
7. Build dual-mode store wrappers
8. Security hardening
9. Testing
