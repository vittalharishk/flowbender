# FLOWBENDER — DATA MIGRATION PLAN

**Date:** 2026-11-13

---

## 1. Current State

- **35 localStorage store files** using `useAppDataSlice(key)` pattern
- **APP_DATA_VERSION: 23**, localStorage key: `flow-bender.demo-data.v7`
- **~925 demo records** across all modules
- **Project IDs p1–p7** used throughout all stores
- **No database** currently in use (backend models exist but no migrations)

## 2. Migration Strategy: Parallel Operation

### Phase 1: Export (non-destructive)

Create `scripts/export-demo-data.ts`:
- Read all slices from `lib/app-data-store.ts` demo data
- Export each collection as JSON: `data/export/{collection}.json`
- Record counts, IDs, and cross-references
- Generate a manifest: `data/export/manifest.json`

### Phase 2: Transform

Create `scripts/transform-to-db.py`:
- Read exported JSON files
- Map localStorage schema → SQLAlchemy model fields
- Preserve all IDs (p1–p7 for projects, all record IDs)
- Generate SQL-compatible insert data
- Detect and report:
  - Duplicate IDs
  - Broken foreign key references
  - Missing required fields
  - Data type mismatches

### Phase 3: Seed

Create `backend/scripts/seed_demo_data.py`:
- Load transformed data into PostgreSQL/SQLite via SQLAlchemy
- Run inside a transaction — rollback on any error
- Validate record counts match export manifest
- Create demo users:
  - `producer@flowbender.demo` → business_owner role
  - `manager@flowbender.demo` → executive_producer role (assigned to p1-p3)
  - `admin@flowbender.demo` → administrator role
- Hash demo passwords with bcrypt

### Phase 4: Validate

Create `backend/scripts/validate_migration.py`:
- Compare record counts: localStorage export vs database
- Verify all project IDs p1–p7 exist
- Verify cross-references (e.g., cast→project, schedule→project)
- Verify financial totals match (Accounts balances)
- Generate migration report

## 3. Dual-Mode Operation

During transition, the app runs in two modes:

| Mode | AUTH_MODE | Data Source | Auth |
|------|-----------|------------|------|
| Demo (default) | `local` | localStorage | Demo login |
| Production | `api` | PostgreSQL via API | JWT auth |

The frontend `AUTH_MODE` environment variable controls which mode is active. Both modes coexist — switching is a config change, not a code change.

### Store Wrapper Pattern

```typescript
// lib/project-store.ts (existing localStorage logic preserved)
// lib/api/project-api.ts (new API-backed implementation)
// lib/use-projects.ts (selector that delegates based on AUTH_MODE)
```

## 4. ID Preservation Rules

| Entity | ID Format | Rule |
|--------|-----------|------|
| Projects | p1–p7 | Preserve exactly |
| All records | UUID or short IDs | Preserve existing, generate UUID for new |
| Users | New | Create fresh with demo credentials |
| Relationships | FK references | Map via preserved IDs |

## 5. Financial Integrity

- Export Accounts totals before migration
- After seeding, query database Accounts totals
- Compare: approved budgets, committed, paid, outstanding must match
- Any discrepancy blocks migration completion

## 6. Rollback Procedure

1. **Database rollback**: `alembic downgrade base` drops all tables
2. **Frontend rollback**: Set `NEXT_PUBLIC_AUTH_MODE=local` — app reverts to localStorage
3. **Data preservation**: localStorage data is never deleted during migration
4. **Re-seed**: Run seed script again after fixing issues

## 7. Commands

```bash
# Export demo data from localStorage
npx ts-node scripts/export-demo-data.ts

# Run database migrations
cd backend && alembic upgrade head

# Seed demo data
cd backend && python scripts/seed_demo_data.py

# Validate migration
cd backend && python scripts/validate_migration.py

# Switch to API mode
echo "NEXT_PUBLIC_AUTH_MODE=api" >> .env.local

# Rollback
echo "NEXT_PUBLIC_AUTH_MODE=local" >> .env.local
cd backend && alembic downgrade base
```

## 8. Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| ID collisions between demo and new records | Use UUID for all new records; preserve existing IDs |
| Financial data corruption | Pre/post migration balance comparison |
| localStorage data loss | Never delete localStorage; read-only export |
| Schema mismatch | Transform script validates all fields before insert |
| Partial migration | Transaction-wrapped seed; all-or-nothing |
