# Flowbender — Implementation Roadmap

**Version:** 1.0 | **Date:** 2026-11-04 | **Status:** Draft for Approval

---

## Overview

Total estimated duration: **16-20 weeks**

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         IMPLEMENTATION TIMELINE                             │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Phase 1 ████░░░░░░░░░░░░░░░░ Foundation (2 weeks)                        │
│  Phase 2 ░░░░████░░░░░░░░░░░░ Multi-Tenant (2 weeks)                      │
│  Phase 3 ░░░░░░░░████░░░░░░░░ Film Acquisition (2 weeks)                  │
│  Phase 4 ░░░░░░░░░░░░████░░░░ Theatrical (3 weeks)                        │
│  Phase 5 ░░░░░░░░░░░░░░░░████ Collections (2 weeks)                       │
│  Phase 6 ░░░░░░░░░░░░░░░░░░██ OTT/Digital (2 weeks)                       │
│  Phase 7 ░░░░░░░░░░░░░░░░░░░█ Reports (2 weeks)                           │
│  Phase 8 ░░░░░░░░░░░░░░░░░░░█ Production-Ready (2 weeks)                  │
│                                                                            │
│  Week:  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18              │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Foundation (Weeks 1-2)

### Objectives
- Set up backend infrastructure
- Implement authentication system
- Create API foundation

### Deliverables

| # | Deliverable | Complexity |
|---|---|---|
| 1.1 | FastAPI project structure | LOW |
| 1.2 | PostgreSQL database setup | LOW |
| 1.3 | Alembic migrations framework | LOW |
| 1.4 | SQLAlchemy models (core) | MEDIUM |
| 1.5 | User registration endpoint | MEDIUM |
| 1.6 | Login/logout endpoints | MEDIUM |
| 1.7 | JWT token management | MEDIUM |
| 1.8 | Password hashing (bcrypt) | LOW |
| 1.9 | Session management | MEDIUM |
| 1.10 | API documentation (Swagger) | LOW |

### Database Tables

```sql
-- Phase 1 tables
organizations (id, name, slug, settings, created_at)
users (id, organization_id, email, password_hash, role, created_at)
user_sessions (id, user_id, refresh_token_hash, expires_at)
```

### API Endpoints

```
POST /api/v1/auth/register     -- Create organization + first user
POST /api/v1/auth/login        -- Get JWT tokens
POST /api/v1/auth/refresh      -- Refresh access token
POST /api/v1/auth/logout       -- Invalidate session
GET  /api/v1/auth/me           -- Get current user
```

### Frontend Changes

- Add `api-client.ts` for HTTP calls
- Add `AuthContext` for user state
- Add login/register pages
- Add protected route wrapper

### Acceptance Criteria

- [ ] User can register new organization
- [ ] User can login and receive tokens
- [ ] Protected routes require valid token
- [ ] Invalid tokens return 401
- [ ] Passwords stored hashed (bcrypt)

### Tests

- Unit: Password hashing, token generation
- Integration: Register → Login → Protected route
- Security: Invalid token rejection, rate limiting

### Risks

| Risk | Probability | Mitigation |
|---|---|---|
| JWT library vulnerabilities | LOW | Use well-maintained `python-jose` |
| Session fixation | MEDIUM | Rotate refresh tokens on use |

---

## Phase 2: Multi-Tenant Core (Weeks 3-4)

### Objectives
- Implement organization management
- Enable Row-Level Security
- Build user invitation system

### Deliverables

| # | Deliverable | Complexity |
|---|---|---|
| 2.1 | Organization CRUD | MEDIUM |
| 2.2 | Branch management | LOW |
| 2.3 | User invitation flow | MEDIUM |
| 2.4 | Role-based permissions | HIGH |
| 2.5 | Row-Level Security policies | HIGH |
| 2.6 | Tenant context middleware | MEDIUM |
| 2.7 | Organization settings UI | MEDIUM |
| 2.8 | User management UI | MEDIUM |

### Database Tables

```sql
-- Phase 2 tables
branches (id, organization_id, name, address, is_headquarters)
user_invitations (id, organization_id, email, role, token, expires_at)
audit_logs (id, organization_id, user_id, action, table_name, record_id, changes)
```

### API Endpoints

```
GET  /api/v1/organizations/current
PATCH /api/v1/organizations/current
GET  /api/v1/organizations/current/branches
POST /api/v1/organizations/current/branches

GET  /api/v1/users
POST /api/v1/users/invite
PATCH /api/v1/users/{id}
DELETE /api/v1/users/{id}
```

### Acceptance Criteria

- [ ] User from Org A cannot access Org B data
- [ ] URL/parameter manipulation blocked by RLS
- [ ] Roles correctly limit permissions
- [ ] Invitation email flow works
- [ ] Audit log records all changes

### Tests

- **Critical:** Tenant isolation (100+ test cases)
- Integration: Invite → Accept → Login
- Permission: Each role boundary tested

### Risks

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| RLS bypass vulnerability | MEDIUM | CRITICAL | Extensive isolation tests |
| Permission escalation | MEDIUM | HIGH | Test each role boundary |

---

## Phase 3: Film Acquisition (Weeks 5-6)

### Objectives
- Implement film portfolio management
- Build producer/production house registry
- Create acquisition workflow

### Deliverables

| # | Deliverable | Complexity |
|---|---|---|
| 3.1 | Film CRUD API | MEDIUM |
| 3.2 | Producer registry | MEDIUM |
| 3.3 | Acquisition workflow | MEDIUM |
| 3.4 | Film metadata management | LOW |
| 3.5 | Film list UI (grid/table) | MEDIUM |
| 3.6 | Film detail page | MEDIUM |
| 3.7 | Film acquisition form | MEDIUM |
| 3.8 | Producer management UI | MEDIUM |

### Database Tables

```sql
-- Phase 3 tables
films (id, organization_id, title, year, language, genres, producer_name, 
       acquisition_date, acquisition_cost, advance_paid, status)
producers (id, organization_id, name, production_house, contact_details,
           gst_number, bank_details)
```

### API Endpoints

```
GET  /api/v1/films
POST /api/v1/films
GET  /api/v1/films/{id}
PATCH /api/v1/films/{id}
DELETE /api/v1/films/{id}

GET  /api/v1/producers
POST /api/v1/producers
PATCH /api/v1/producers/{id}
```

### Data Migration

- Map existing `projects` → `films` (production vs distribution context)
- Preserve APP_DATA_VERSION = 23 data for demo mode

### Acceptance Criteria

- [ ] Films list with search/filter/sort
- [ ] Film detail shows all metadata
- [ ] Acquisition cost and advance tracked
- [ ] Producer linked to films
- [ ] Images uploaded to MinIO

---

## Phase 4: Theatrical Distribution (Weeks 7-9)

### Objectives
- Build theatre/exhibitor management
- Implement release planning
- Create screen allocation workflow

### Deliverables

| # | Deliverable | Complexity |
|---|---|---|
| 4.1 | Territory hierarchy | HIGH |
| 4.2 | Theatre management | MEDIUM |
| 4.3 | Screen management | LOW |
| 4.4 | Release planning | MEDIUM |
| 4.5 | Screen allocation | HIGH |
| 4.6 | Rights deals (enhanced) | MEDIUM |
| 4.7 | Distribution agreements | MEDIUM |
| 4.8 | Rights conflict detection | HIGH |
| 4.9 | Release calendar UI | MEDIUM |
| 4.10 | Theatre management UI | MEDIUM |

### Database Tables

```sql
-- Phase 4 tables
territories (id, organization_id, name, type, parent_id, path)
theatres (id, organization_id, name, chain, territory_id, owner_name, 
          total_screens, relationship_status)
screens (id, theatre_id, name, seating_capacity, screen_type)
releases (id, film_id, release_date, territory_id, target_screens, status)
screen_allocations (id, release_id, theatre_id, screen_id, start_date, 
                    shows_per_day, status)
rights_deals (id, film_id, rights_type, territory_id, is_exclusive,
              start_date, end_date, minimum_guarantee)
distribution_agreements (id, film_id, distributor_name, channel, 
                         territories, agreement_value, revenue_sharing)
```

### API Endpoints

```
-- Territories
GET  /api/v1/territories
POST /api/v1/territories

-- Theatres
GET  /api/v1/theatres
POST /api/v1/theatres
GET  /api/v1/theatres/{id}/screens

-- Releases
GET  /api/v1/releases
POST /api/v1/releases
POST /api/v1/releases/{id}/allocations

-- Rights
GET  /api/v1/rights
POST /api/v1/rights
GET  /api/v1/rights/conflicts

-- Agreements
GET  /api/v1/agreements
POST /api/v1/agreements
PATCH /api/v1/agreements/{id}/status
```

### Acceptance Criteria

- [ ] Territory hierarchy (Country → State → District)
- [ ] Theatre with multiple screens
- [ ] Release linked to film and territory
- [ ] Screen allocation workflow
- [ ] Rights conflict detection prevents overlaps
- [ ] Agreement status transitions enforced

---

## Phase 5: Collections & Settlements (Weeks 10-11)

### Objectives
- Implement daily box office collection
- Build revenue sharing calculator
- Create settlement workflow

### Deliverables

| # | Deliverable | Complexity |
|---|---|---|
| 5.1 | Daily collection entry | MEDIUM |
| 5.2 | Collection aggregation | MEDIUM |
| 5.3 | GST/deduction handling | MEDIUM |
| 5.4 | Revenue share calculator | HIGH |
| 5.5 | Settlement generation | HIGH |
| 5.6 | Payment tracking | MEDIUM |
| 5.7 | Collection entry UI | MEDIUM |
| 5.8 | Settlement statement UI | MEDIUM |

### Database Tables

```sql
-- Phase 5 tables
box_office_collections (id, release_id, theatre_id, collection_date,
                        gross_collection, gst_amount, net_collection,
                        distributor_share, exhibitor_share, producer_share)
settlements (id, settlement_type, film_id, counterparty_name,
             period_start, period_end, gross_amount, net_amount,
             advance_adjusted, amount_payable, payment_status)
```

### Revenue Sharing Logic

```python
# Configurable per agreement - NOT hardcoded
def calculate_shares(collection: BoxOfficeCollection, agreement: Agreement):
    net = collection.gross - collection.gst - collection.other_deductions
    
    sharing = agreement.revenue_sharing
    # Example: {"distributor": 40, "exhibitor": 50, "producer": 10}
    
    distributor_share = net * (sharing["distributor"] / 100)
    exhibitor_share = net * (sharing["exhibitor"] / 100)
    producer_share = net * (sharing["producer"] / 100)
    
    return DistributionShares(
        net_collection=net,
        distributor_share=distributor_share,
        exhibitor_share=exhibitor_share,
        producer_share=producer_share
    )
```

### Acceptance Criteria

- [ ] Daily collection entry per theatre
- [ ] GST calculated correctly
- [ ] Revenue shares based on agreement terms
- [ ] Settlement statements generated
- [ ] Advance recoupment tracked
- [ ] Payment status workflow

---

## Phase 6: OTT/Satellite/Digital (Weeks 12-13)

### Objectives
- Implement platform management
- Build digital deal workflows
- Add payment milestone tracking

### Deliverables

| # | Deliverable | Complexity |
|---|---|---|
| 6.1 | Platform registry | LOW |
| 6.2 | OTT deal management | MEDIUM |
| 6.3 | Satellite deal management | MEDIUM |
| 6.4 | Digital licensing | MEDIUM |
| 6.5 | Payment milestones | MEDIUM |
| 6.6 | Delivery tracking | LOW |
| 6.7 | Platform management UI | MEDIUM |
| 6.8 | Digital deals UI | MEDIUM |

### Database Tables

```sql
-- Phase 6 tables
platforms (id, organization_id, name, type, contact_details)
digital_deals (id, film_id, platform_id, deal_type, window_start, 
               window_end, deal_value, milestones, delivery_status)
```

### Acceptance Criteria

- [ ] OTT platform registry
- [ ] Satellite channel registry
- [ ] Deal with license window
- [ ] Payment milestones tracked
- [ ] Delivery status updated
- [ ] Expiry notifications

---

## Phase 7: Reports & Analytics (Weeks 14-15)

### Objectives
- Build comprehensive reporting
- Implement film-wise P&L
- Create export functionality

### Deliverables

| # | Deliverable | Complexity |
|---|---|---|
| 7.1 | Film-wise P&L report | HIGH |
| 7.2 | Territory-wise report | MEDIUM |
| 7.3 | Theatre-wise report | MEDIUM |
| 7.4 | Collection summary | MEDIUM |
| 7.5 | Outstanding receivables | MEDIUM |
| 7.6 | Rights expiry report | LOW |
| 7.7 | CSV export | LOW |
| 7.8 | Excel export | MEDIUM |
| 7.9 | Report dashboard UI | HIGH |

### API Endpoints

```
GET /api/v1/reports/film/{id}/pnl
GET /api/v1/reports/territory
GET /api/v1/reports/theatre
GET /api/v1/reports/collections/summary
GET /api/v1/reports/receivables
GET /api/v1/reports/rights/expiring
GET /api/v1/reports/export
```

### Film P&L Structure

```
REVENUE
├── Theatrical collections
│   ├── Territory A: ₹X
│   └── Territory B: ₹Y
├── OTT licensing: ₹Z
├── Satellite: ₹W
└── Other digital: ₹V
────────────────────
TOTAL REVENUE: ₹R

COSTS
├── Acquisition cost: ₹A
├── Marketing: ₹M
├── Distribution expenses: ₹D
└── Prints & publicity: ₹P
────────────────────
TOTAL COSTS: ₹C

PROFIT/LOSS: ₹(R - C)
```

### Acceptance Criteria

- [ ] Film P&L shows all revenue/costs
- [ ] Territory breakdown accurate
- [ ] Theatre performance ranked
- [ ] Outstanding receivables listed
- [ ] Rights expiry warnings
- [ ] CSV/Excel export working

---

## Phase 8: Production-Readiness (Weeks 16-18)

### Objectives
- Security hardening
- Comprehensive testing
- Docker deployment
- Documentation

### Deliverables

| # | Deliverable | Complexity |
|---|---|---|
| 8.1 | Security audit | HIGH |
| 8.2 | Penetration testing fixes | HIGH |
| 8.3 | Performance optimization | MEDIUM |
| 8.4 | Docker Compose setup | MEDIUM |
| 8.5 | Environment configuration | LOW |
| 8.6 | Backup/restore scripts | MEDIUM |
| 8.7 | Deployment documentation | MEDIUM |
| 8.8 | API documentation | MEDIUM |
| 8.9 | User guide | MEDIUM |
| 8.10 | Contributor guide | LOW |

### Docker Compose Structure

```
docker-compose.yml
├── nginx (reverse proxy)
├── web (Next.js frontend)
├── api (FastAPI backend)
├── worker (background jobs)
├── db (PostgreSQL)
├── redis (cache/queue)
└── minio (file storage)
```

### Documentation

- README.md — Project overview
- INSTALL.md — Self-hosting guide
- API.md — API reference
- SECURITY.md — Security policy
- CONTRIBUTING.md — Contribution guide

### Acceptance Criteria

- [ ] `docker-compose up` starts entire stack
- [ ] Environment variables documented
- [ ] Backup/restore tested
- [ ] No critical security vulnerabilities
- [ ] All tests passing
- [ ] Documentation complete

---

## First 20 Implementation Tasks

| # | Task | Phase | Priority | Est. Hours |
|---|---|---|---|---|
| 1 | Set up FastAPI project structure | 1 | CRITICAL | 4 |
| 2 | Configure PostgreSQL + Alembic | 1 | CRITICAL | 4 |
| 3 | Create SQLAlchemy base models | 1 | CRITICAL | 8 |
| 4 | Implement user registration | 1 | CRITICAL | 8 |
| 5 | Implement JWT authentication | 1 | CRITICAL | 8 |
| 6 | Add session management | 1 | CRITICAL | 4 |
| 7 | Create API client in frontend | 1 | CRITICAL | 4 |
| 8 | Build login/register UI | 1 | HIGH | 8 |
| 9 | Implement organization CRUD | 2 | CRITICAL | 8 |
| 10 | Enable Row-Level Security | 2 | CRITICAL | 8 |
| 11 | Build tenant middleware | 2 | CRITICAL | 4 |
| 12 | Implement RBAC | 2 | CRITICAL | 16 |
| 13 | Create user invitation flow | 2 | HIGH | 8 |
| 14 | Build organization settings UI | 2 | MEDIUM | 8 |
| 15 | Write tenant isolation tests | 2 | CRITICAL | 16 |
| 16 | Implement film CRUD API | 3 | HIGH | 8 |
| 17 | Create film list/detail UI | 3 | HIGH | 16 |
| 18 | Implement territory hierarchy | 4 | HIGH | 8 |
| 19 | Build theatre management | 4 | HIGH | 8 |
| 20 | Create release planning | 4 | HIGH | 8 |

**Total estimated: ~160 hours for first 20 tasks**

---

## Dependency Graph

```
Phase 1 (Foundation)
    │
    ▼
Phase 2 (Multi-Tenant) ──────────────────────────────────┐
    │                                                    │
    ▼                                                    │
Phase 3 (Films) ◄────────────────────────────────────────┤
    │                                                    │
    ├──────────────────┐                                 │
    ▼                  ▼                                 │
Phase 4 (Theatrical)  Phase 6 (OTT/Digital)             │
    │                  │                                 │
    ▼                  │                                 │
Phase 5 (Collections)◄─┘                                 │
    │                                                    │
    ▼                                                    │
Phase 7 (Reports) ◄──────────────────────────────────────┘
    │
    ▼
Phase 8 (Production-Ready)
```

---

## Risk Register

| Risk | Probability | Impact | Mitigation | Owner |
|---|---|---|---|---|
| Scope creep | HIGH | HIGH | Strict phase gates, defer nice-to-haves | PM |
| Tenant isolation bugs | MEDIUM | CRITICAL | 100+ isolation tests, security review | Security |
| Performance issues | MEDIUM | MEDIUM | Load testing in Phase 8, indexes | Backend |
| Data migration failures | LOW | HIGH | Rollback procedures, test migrations | Backend |
| Breaking existing frontend | MEDIUM | MEDIUM | Comprehensive UI tests | Frontend |
| Third-party dependency issues | LOW | MEDIUM | Lock versions, security scanning | DevOps |

---

## Success Criteria

### Phase Gate Checklist

Before advancing to next phase:
- [ ] All deliverables complete
- [ ] Unit tests > 80% coverage
- [ ] Integration tests passing
- [ ] No critical/high security issues
- [ ] Documentation updated
- [ ] Code reviewed and merged
- [ ] Demo to stakeholder approved

### Final Release Criteria

- [ ] All 8 phases complete
- [ ] Security audit passed
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] Docker deployment tested
- [ ] Backup/restore verified
- [ ] User acceptance testing passed

---

**Awaiting explicit approval before beginning Phase 1 implementation.**
