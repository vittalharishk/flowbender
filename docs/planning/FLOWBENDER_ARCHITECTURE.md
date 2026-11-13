# Flowbender — System Architecture

**Version:** 1.0 | **Date:** 2026-11-04 | **Status:** Draft for Approval

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              FLOWBENDER PLATFORM                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐          │
│  │   Distributor A │    │   Distributor B │    │   Distributor C │          │
│  │   (Tenant 1)    │    │   (Tenant 2)    │    │   (Tenant 3)    │          │
│  └────────┬────────┘    └────────┬────────┘    └────────┬────────┘          │
│           │                      │                      │                    │
│           └──────────────────────┼──────────────────────┘                    │
│                                  ▼                                           │
│  ┌───────────────────────────────────────────────────────────────────────┐   │
│  │                         NGINX REVERSE PROXY                           │   │
│  │                    (SSL termination, rate limiting)                   │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                  │                                           │
│           ┌──────────────────────┼──────────────────────┐                    │
│           ▼                      ▼                      ▼                    │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐          │
│  │   NEXT.JS WEB   │    │   FASTAPI API   │    │   BACKGROUND    │          │
│  │   (Frontend)    │◄───│   (Backend)     │    │   WORKER        │          │
│  │   Port 3000     │    │   Port 8000     │    │   (Celery/ARQ)  │          │
│  └─────────────────┘    └────────┬────────┘    └────────┬────────┘          │
│                                  │                      │                    │
│                                  ▼                      ▼                    │
│  ┌───────────────────────────────────────────────────────────────────────┐   │
│  │                         POSTGRESQL DATABASE                           │   │
│  │              (Multi-tenant with Row-Level Security)                   │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                  │                                           │
│           ┌──────────────────────┼──────────────────────┐                    │
│           ▼                      ▼                      ▼                    │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐          │
│  │   REDIS CACHE   │    │   MINIO/S3      │    │   BACKUP        │          │
│  │   (Sessions,    │    │   (File Storage)│    │   (Scheduled    │          │
│  │    Background)  │    │                 │    │    Dumps)       │          │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘          │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Choices

### Backend: FastAPI (Python)

**Why FastAPI:**
| Advantage | Details |
|---|---|
| Async performance | Native async/await, high concurrency |
| Type safety | Pydantic models, auto-validation |
| Auto documentation | OpenAPI/Swagger out of the box |
| Ecosystem | SQLAlchemy, Alembic, Celery |
| Developer productivity | Less boilerplate than Django |

**Alternatives considered:**
- **Django** — heavier, more opinionated, better for rapid prototyping
- **Node.js/Express** — same language as frontend, but Python has better data science/ML ecosystem
- **Go** — excellent performance, but smaller talent pool

**Recommendation:** FastAPI for balance of performance, type safety, and developer experience.

### Database: PostgreSQL

**Why PostgreSQL:**
| Advantage | Details |
|---|---|
| Row-Level Security | Built-in multi-tenant isolation |
| JSONB | Flexible semi-structured data |
| Full-text search | Native search without Elasticsearch |
| Extensions | PostGIS for location data, pg_cron for scheduling |
| Mature | Battle-tested, excellent tooling |

**Multi-tenant strategy:**

Option A: **Row-Level Security (Recommended)**
```sql
-- Every table has organization_id
ALTER TABLE films ENABLE ROW LEVEL SECURITY;

CREATE POLICY films_isolation ON films
  USING (organization_id = current_setting('app.organization_id')::uuid);
```
- Pros: Single database, simple backup, shared schema
- Cons: Requires careful policy design, all queries filtered

Option B: **Schema per tenant**
- Pros: Stronger isolation, per-tenant backup
- Cons: Schema migrations across tenants, connection pooling complexity

**Recommendation:** Row-Level Security for simpler operations.

### Cache: Redis

**Use cases:**
- Session storage
- API response caching
- Background job queue (with ARQ or Celery)
- Real-time notifications (pub/sub)

### File Storage: MinIO (S3-compatible)

**Why MinIO:**
- Self-hostable, no cloud dependency
- S3-compatible API
- Supports presigned URLs for direct upload
- Can migrate to AWS S3 later

**Storage structure:**
```
bucket: flowbender-{environment}
├── {organization_id}/
│   ├── films/{film_id}/
│   │   ├── masters/
│   │   ├── trailers/
│   │   ├── posters/
│   │   └── documents/
│   ├── agreements/
│   ├── settlements/
│   └── reports/
```

---

## 3. Multi-Tenant Architecture

### Organization Model

```
┌─────────────────────────────────────────────────────────────────┐
│                         ORGANIZATION                            │
│  id, name, slug, settings, subscription_tier, created_at        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐      │
│   │   BRANCH    │     │   BRANCH    │     │   BRANCH    │      │
│   │  (Mumbai)   │     │  (Chennai)  │     │  (Delhi)    │      │
│   └──────┬──────┘     └──────┬──────┘     └──────┬──────┘      │
│          │                   │                   │               │
│   ┌──────┴──────┐     ┌──────┴──────┐     ┌──────┴──────┐      │
│   │    USERS    │     │    USERS    │     │    USERS    │      │
│   │ with ROLES  │     │ with ROLES  │     │ with ROLES  │      │
│   └─────────────┘     └─────────────┘     └─────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Role-Based Access Control

| Role | Scope | Permissions |
|---|---|---|
| **Owner** | Organization | All permissions, billing, delete org |
| **Admin** | Organization | Manage users, settings, all data |
| **Manager** | Branch/Film | CRUD films, agreements, collections in scope |
| **Accountant** | Organization | Financial reports, settlements, read-only data |
| **Staff** | Assigned films | Limited CRUD on assigned records |
| **Viewer** | Assigned films | Read-only access |

### Data Isolation Guarantee

Every API request:
1. Extracts `organization_id` from JWT token
2. Sets PostgreSQL session variable: `SET app.organization_id = '{uuid}'`
3. RLS policies automatically filter all queries
4. Audit log records user, organization, action, timestamp

**Critical test:** User from Organization A must NEVER see Organization B's data, regardless of:
- URL manipulation
- API parameter tampering
- Record ID guessing
- SQL injection attempts

---

## 4. API Architecture

### REST API Design

```
/api/v1/
├── auth/
│   ├── POST   /register          # Create organization + first user
│   ├── POST   /login             # Get JWT tokens
│   ├── POST   /refresh           # Refresh access token
│   ├── POST   /logout            # Invalidate session
│   └── POST   /forgot-password   # Password reset flow
│
├── organizations/
│   ├── GET    /current           # Get current org details
│   ├── PATCH  /current           # Update org settings
│   └── GET    /current/branches  # List branches
│
├── users/
│   ├── GET    /                  # List org users
│   ├── POST   /invite            # Invite new user
│   ├── PATCH  /{id}              # Update user role
│   └── DELETE /{id}              # Remove user
│
├── films/
│   ├── GET    /                  # List films (filterable)
│   ├── POST   /                  # Create film
│   ├── GET    /{id}              # Get film details
│   ├── PATCH  /{id}              # Update film
│   └── DELETE /{id}              # Delete film
│
├── rights/
│   ├── GET    /                  # List rights deals
│   ├── POST   /                  # Create rights deal
│   ├── GET    /{id}              # Get deal details
│   ├── PATCH  /{id}              # Update deal
│   └── GET    /conflicts         # Check for conflicts
│
├── agreements/
│   ├── GET    /                  # List agreements
│   ├── POST   /                  # Create agreement
│   ├── PATCH  /{id}/status       # Status transitions
│   └── GET    /{id}/documents    # Agreement documents
│
├── theatres/
│   ├── GET    /                  # List theatres
│   ├── POST   /                  # Add theatre
│   ├── GET    /{id}/screens      # Theatre screens
│   └── POST   /{id}/allocate     # Allocate to release
│
├── collections/
│   ├── GET    /                  # List collections
│   ├── POST   /                  # Record daily collection
│   ├── GET    /summary           # Collection summary
│   └── GET    /settlements       # Settlement calculations
│
├── reports/
│   ├── GET    /film/{id}         # Film-wise P&L
│   ├── GET    /territory         # Territory-wise performance
│   ├── GET    /theatre           # Theatre-wise performance
│   └── GET    /export            # CSV/Excel export
```

### Authentication Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │     │  Next.js │     │  FastAPI │     │PostgreSQL│
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │
     │  Login form    │                │                │
     │───────────────►│                │                │
     │                │  POST /login   │                │
     │                │───────────────►│                │
     │                │                │  Verify creds  │
     │                │                │───────────────►│
     │                │                │◄───────────────│
     │                │  JWT tokens    │                │
     │                │◄───────────────│                │
     │  Set cookies   │                │                │
     │◄───────────────│                │                │
     │                │                │                │
     │  API request   │                │                │
     │───────────────►│                │                │
     │                │  + Bearer token│                │
     │                │───────────────►│                │
     │                │                │  SET org_id    │
     │                │                │───────────────►│
     │                │                │  RLS filtered  │
     │                │                │◄───────────────│
     │  Response      │                │                │
     │◄───────────────│◄───────────────│                │
```

---

## 5. Frontend Integration

### Current → Future Transition

| Current | Future |
|---|---|
| `useAppDataSlice(key)` | `useQuery(['key', params])` (TanStack Query) |
| `updateAppDataSlice(key, fn)` | `useMutation()` → API call |
| `localStorage` persistence | PostgreSQL via API |
| Single-user demo | Multi-user authenticated |

### Migration Strategy

1. **Create API client** — abstract HTTP calls
2. **Add auth context** — manage tokens, user state
3. **Wrap stores with API calls** — gradual migration
4. **Keep localStorage as offline cache** — optional enhancement

### Example Migration

```typescript
// BEFORE (current)
export function useRightsDeals(projectId?: string): RightsDeal[] {
  const all = useAppDataSlice("rightsDeals");
  return projectId ? all.filter(d => d.projectId === projectId) : all;
}

// AFTER (with API)
export function useRightsDeals(filmId?: string) {
  return useQuery({
    queryKey: ['rightsDeals', filmId],
    queryFn: () => api.get('/api/v1/rights', { params: { film_id: filmId } }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

---

## 6. Deployment Architecture

### Docker Compose (Development/Small Deployment)

```yaml
version: '3.8'
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./certs:/etc/nginx/certs

  web:
    build: ./frontend
    environment:
      - API_URL=http://api:8000

  api:
    build: ./backend
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/flowbender
      - REDIS_URL=redis://redis:6379
      - MINIO_URL=http://minio:9000
    depends_on:
      - db
      - redis

  worker:
    build: ./backend
    command: arq worker
    depends_on:
      - redis
      - db

  db:
    image: postgres:15
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=flowbender
      - POSTGRES_USER=flowbender
      - POSTGRES_PASSWORD=${DB_PASSWORD}

  redis:
    image: redis:7-alpine

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    volumes:
      - miniodata:/data

volumes:
  pgdata:
  miniodata:
```

### Production Recommendations

| Component | Recommendation |
|---|---|
| Database | Managed PostgreSQL (AWS RDS, DigitalOcean) or self-hosted with replication |
| Cache | Managed Redis or self-hosted with persistence |
| Storage | MinIO cluster or AWS S3 |
| Reverse proxy | Nginx with Let's Encrypt |
| Monitoring | Prometheus + Grafana |
| Logging | Loki or ELK stack |
| Backups | pg_dump to S3, daily automated |

---

## 7. Security Architecture

### Defense in Depth

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: Network                                            │
│ - Firewall rules (only 80/443 exposed)                      │
│ - DDoS protection                                           │
│ - SSL/TLS termination                                       │
├─────────────────────────────────────────────────────────────┤
│ Layer 2: Application                                        │
│ - Rate limiting (per IP, per user)                          │
│ - Input validation (Pydantic)                               │
│ - CORS configuration                                        │
│ - CSRF protection                                           │
├─────────────────────────────────────────────────────────────┤
│ Layer 3: Authentication                                     │
│ - JWT with short expiry (15 min access, 7 day refresh)      │
│ - Secure password hashing (bcrypt)                          │
│ - Session management                                        │
├─────────────────────────────────────────────────────────────┤
│ Layer 4: Authorization                                      │
│ - Role-based access control                                 │
│ - Resource-level permissions                                │
│ - Row-Level Security in PostgreSQL                          │
├─────────────────────────────────────────────────────────────┤
│ Layer 5: Data                                               │
│ - Encryption at rest (PostgreSQL TDE or disk encryption)    │
│ - Encrypted backups                                         │
│ - Audit logging                                             │
└─────────────────────────────────────────────────────────────┘
```

### Audit Trail

Every data modification logged:
```json
{
  "timestamp": "2026-11-04T10:30:00Z",
  "organization_id": "uuid",
  "user_id": "uuid",
  "action": "UPDATE",
  "table": "agreements",
  "record_id": "uuid",
  "changes": {
    "status": { "old": "draft", "new": "active" }
  },
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0..."
}
```

---

## 8. Scalability Considerations

### Phase 1: Single Server (MVP)
- All services on one machine
- PostgreSQL with connection pooling (PgBouncer)
- Suitable for: 1-10 organizations, <100 concurrent users

### Phase 2: Separated Services
- Dedicated database server
- Separate API and worker nodes
- Suitable for: 10-100 organizations, <1,000 concurrent users

### Phase 3: Horizontal Scaling
- Multiple API instances behind load balancer
- Read replicas for database
- Distributed cache (Redis Cluster)
- Suitable for: 100+ organizations, 1,000+ concurrent users

**Note:** Design for Phase 1, implement for Phase 1, but don't make decisions that prevent scaling.

---

## 9. Third-Party Dependencies

### Required (Open-Source, No Cost)
| Dependency | Purpose | Licence |
|---|---|---|
| PostgreSQL | Database | PostgreSQL License |
| Redis | Cache | BSD-3 |
| MinIO | Storage | AGPL-3.0 |
| Nginx | Proxy | BSD-2 |
| Docker | Containerization | Apache-2.0 |

### Optional (May Have Costs)
| Service | Purpose | Notes |
|---|---|---|
| SendGrid/Mailgun | Email | Free tier usually sufficient |
| Twilio | SMS | Pay-per-use |
| AWS S3 | Storage | Alternative to self-hosted MinIO |
| Sentry | Error tracking | Free tier available |

**No mandatory paid dependencies.**

---

## 10. Decision Log

| Decision | Choice | Rationale | Alternatives Rejected |
|---|---|---|---|
| Backend framework | FastAPI | Async, typed, auto-docs | Django (heavier), Node (ecosystem) |
| Database | PostgreSQL | RLS, mature, extensions | MySQL (no RLS), MongoDB (relational data) |
| Multi-tenant strategy | Row-Level Security | Simpler ops, single schema | Schema-per-tenant (complexity) |
| File storage | MinIO | Self-hostable, S3-compatible | Local filesystem (no scaling) |
| Auth | JWT + sessions | Stateless API, secure refresh | Session-only (scaling issues) |
| Frontend state | TanStack Query | Caching, optimistic updates | Redux (boilerplate) |

**Awaiting approval before implementation.**
