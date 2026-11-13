# Flowbender — Security Plan

**Version:** 1.0 | **Date:** 2026-11-04 | **Status:** Draft for Approval

---

## 1. Security Risk Assessment

### Current State — CRITICAL RISKS

| Risk | Severity | Current Status | Impact |
|---|---|---|---|
| **No authentication** | CRITICAL | Demo tokens only | Anyone can access everything |
| **No tenant isolation** | CRITICAL | Single-user demo | Data leakage between companies |
| **No authorization** | CRITICAL | UI-only role checks | Bypassed via API/URL manipulation |
| **No audit trail** | HIGH | No logging | No accountability, compliance failure |
| **Client-side data** | HIGH | localStorage only | No backup, no persistence |
| **No API security** | HIGH | No API exists | Will need from scratch |
| **No file validation** | MEDIUM | Base64 only | Potential malicious uploads |
| **No secrets management** | MEDIUM | No secrets exist | Will need env-based config |

### Threat Model

| Threat Actor | Motivation | Capability | Mitigations |
|---|---|---|---|
| **Competitor distributor** | Access competitor data | URL manipulation, ID guessing | Tenant isolation, UUID IDs |
| **Disgruntled employee** | Data exfiltration | Internal access | Audit logs, role limits |
| **External attacker** | Data theft, ransom | SQL injection, XSS | Input validation, WAF |
| **Insider threat** | Financial fraud | Admin access | Separation of duties, audit |

---

## 2. Authentication Security

### Password Requirements

```
Minimum length: 12 characters
Required: uppercase + lowercase + number
Optional: special character
Blocked: common passwords (Have I Been Pwned list)
```

### Password Storage

```python
# bcrypt with work factor 12
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)
```

### JWT Token Design

```json
// Access Token (15 minute expiry)
{
  "sub": "user-uuid",
  "org": "organization-uuid",
  "role": "manager",
  "permissions": ["films:read", "films:write", "agreements:read"],
  "iat": 1699084800,
  "exp": 1699085700,
  "type": "access"
}

// Refresh Token (7 day expiry, stored in DB)
{
  "sub": "user-uuid",
  "session": "session-uuid",
  "iat": 1699084800,
  "exp": 1699689600,
  "type": "refresh"
}
```

### Session Management

| Feature | Implementation |
|---|---|
| Session storage | PostgreSQL `user_sessions` table |
| Refresh rotation | New refresh token on each use |
| Session limits | Max 5 active sessions per user |
| Forced logout | Delete session from DB |
| Idle timeout | 30 minutes of inactivity |

### Multi-Factor Authentication (Future)

- TOTP (Google Authenticator, Authy)
- Email verification codes
- Backup codes

---

## 3. Authorization Security

### Role-Based Access Control (RBAC)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PERMISSION HIERARCHY                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  OWNER (organization level)                                         │
│    └── All permissions                                              │
│    └── Billing, delete organization                                 │
│    └── Manage admins                                                │
│                                                                     │
│  ADMIN (organization level)                                         │
│    └── Manage users, settings                                       │
│    └── All data CRUD                                                │
│    └── Cannot delete organization                                   │
│                                                                     │
│  MANAGER (branch/film scoped)                                       │
│    └── CRUD films, agreements, collections in scope                 │
│    └── Cannot manage users                                          │
│                                                                     │
│  ACCOUNTANT (organization level, limited scope)                     │
│    └── Read all data                                                │
│    └── Write settlements, collections                               │
│    └── Export reports                                               │
│                                                                     │
│  STAFF (assigned resources only)                                    │
│    └── CRUD assigned films/agreements                               │
│    └── Cannot see unassigned data                                   │
│                                                                     │
│  VIEWER (assigned resources only)                                   │
│    └── Read-only on assigned resources                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Permission Matrix

| Resource | Owner | Admin | Manager | Accountant | Staff | Viewer |
|---|---|---|---|---|---|---|
| Organization settings | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| User management | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Films - create | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Films - read all | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Films - read assigned | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Agreements - create | ✅ | ✅ | ✅ | ❌ | ✅* | ❌ |
| Collections - create | ✅ | ✅ | ✅ | ✅ | ✅* | ❌ |
| Settlements - approve | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Reports - export | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |

*On assigned resources only

### API Authorization Pattern

```python
from fastapi import Depends, HTTPException
from typing import List

def require_permissions(required: List[str]):
    async def checker(current_user: User = Depends(get_current_user)):
        if not has_all_permissions(current_user, required):
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return checker

@router.post("/agreements")
async def create_agreement(
    data: AgreementCreate,
    user: User = Depends(require_permissions(["agreements:write"]))
):
    # Proceed with creation
    pass
```

---

## 4. Tenant Isolation

### Database-Level Isolation (Row-Level Security)

```sql
-- Enable RLS on every table with organization_id
ALTER TABLE films ENABLE ROW LEVEL SECURITY;

-- Policy ensures users only see their organization's data
CREATE POLICY tenant_isolation ON films
    USING (organization_id = current_setting('app.organization_id')::uuid);

-- Policy for INSERT must also set correct organization_id
CREATE POLICY tenant_insert ON films
    FOR INSERT
    WITH CHECK (organization_id = current_setting('app.organization_id')::uuid);
```

### Application-Level Enforcement

```python
# Middleware sets session variable from JWT
@app.middleware("http")
async def set_tenant_context(request: Request, call_next):
    user = await get_current_user_from_request(request)
    if user:
        # Set PostgreSQL session variable for RLS
        await db.execute(
            f"SET app.organization_id = '{user.organization_id}'"
        )
    response = await call_next(request)
    return response
```

### Critical Isolation Tests

```python
def test_user_cannot_access_other_org_film():
    # User from Org A
    user_a = create_user(organization_id=org_a.id)
    film_a = create_film(organization_id=org_a.id)
    
    # User from Org B
    user_b = create_user(organization_id=org_b.id)
    
    # User B tries to access Film A by ID
    response = client.get(
        f"/api/v1/films/{film_a.id}",
        headers=auth_headers(user_b)
    )
    
    assert response.status_code == 404  # NOT 403 - don't reveal existence

def test_user_cannot_access_via_url_manipulation():
    # Try to access with different org_id in URL
    response = client.get(
        f"/api/v1/films/{film_a.id}?organization_id={org_b.id}",
        headers=auth_headers(user_b)
    )
    
    assert response.status_code == 404  # Query param ignored, RLS enforced
```

---

## 5. API Security

### Input Validation

```python
from pydantic import BaseModel, Field, validator
from typing import Optional

class FilmCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    year: Optional[int] = Field(None, ge=1900, le=2100)
    acquisition_cost: Optional[float] = Field(None, ge=0, le=1e12)
    
    @validator('title')
    def sanitize_title(cls, v):
        # Remove potential XSS
        return bleach.clean(v, tags=[], strip=True)
```

### SQL Injection Prevention

```python
# ALWAYS use parameterized queries
# BAD:
await db.execute(f"SELECT * FROM films WHERE id = '{film_id}'")

# GOOD:
await db.execute("SELECT * FROM films WHERE id = $1", film_id)

# With SQLAlchemy (recommended):
stmt = select(Film).where(Film.id == film_id)
result = await session.execute(stmt)
```

### Rate Limiting

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/api/v1/auth/login")
@limiter.limit("5/minute")  # Prevent brute force
async def login(request: Request, data: LoginRequest):
    pass

@app.get("/api/v1/films")
@limiter.limit("100/minute")  # Normal API calls
async def list_films(request: Request):
    pass
```

### CORS Configuration

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://app.flowbender.com",
        "https://staging.flowbender.com",
        # Never use "*" in production
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
```

---

## 6. Data Security

### Sensitive Data Classification

| Classification | Examples | Handling |
|---|---|---|
| **Highly Sensitive** | Passwords, tokens, bank details | Encrypted at rest, never logged |
| **Sensitive** | Financial data, contracts, collections | Encrypted at rest, audit logged |
| **Internal** | Film details, theatre info | Access controlled, audit logged |
| **Public** | Film titles, release dates | Can be cached, minimal logging |

### Encryption at Rest

```sql
-- PostgreSQL Transparent Data Encryption (TDE)
-- Or use encrypted disk (LUKS, AWS EBS encryption)

-- Specific column encryption for highly sensitive data
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Store bank details encrypted
UPDATE producers SET 
    bank_details = pgp_sym_encrypt(
        bank_details::text, 
        current_setting('app.encryption_key')
    )::jsonb;
```

### Backup Security

```bash
# Encrypted backup
pg_dump flowbender | gpg --symmetric --cipher-algo AES256 > backup.sql.gpg

# Upload to secure storage
aws s3 cp backup.sql.gpg s3://flowbender-backups/$(date +%Y-%m-%d)/ \
    --sse aws:kms
```

---

## 7. Audit Logging

### What to Log

| Event | Log Level | Details |
|---|---|---|
| Login success | INFO | user_id, ip, user_agent |
| Login failure | WARN | email, ip, failure_reason |
| Data creation | INFO | user_id, table, record_id |
| Data modification | INFO | user_id, table, record_id, changes |
| Data deletion | WARN | user_id, table, record_id, old_values |
| Permission denied | WARN | user_id, resource, action |
| Settings change | WARN | user_id, setting, old_value, new_value |

### Audit Log Schema

```python
class AuditLog(BaseModel):
    id: int
    organization_id: UUID
    user_id: Optional[UUID]
    
    action: str  # CREATE, UPDATE, DELETE, LOGIN, etc.
    table_name: Optional[str]
    record_id: Optional[UUID]
    
    old_values: Optional[dict]
    new_values: Optional[dict]
    changes: Optional[dict]  # Diff of old/new
    
    ip_address: str
    user_agent: str
    
    created_at: datetime
```

### Implementation

```python
async def audit_log(
    db: AsyncSession,
    user: User,
    action: str,
    table_name: str = None,
    record_id: UUID = None,
    old_values: dict = None,
    new_values: dict = None,
    request: Request = None
):
    log = AuditLog(
        organization_id=user.organization_id,
        user_id=user.id,
        action=action,
        table_name=table_name,
        record_id=record_id,
        old_values=old_values,
        new_values=new_values,
        changes=compute_diff(old_values, new_values),
        ip_address=request.client.host if request else None,
        user_agent=request.headers.get("user-agent") if request else None
    )
    db.add(log)
    await db.commit()
```

---

## 8. File Upload Security

### Allowed File Types

| Category | Extensions | Max Size | Validation |
|---|---|---|---|
| Images | jpg, png, webp | 10 MB | Magic bytes, dimension limits |
| Documents | pdf, doc, docx | 25 MB | Magic bytes, virus scan |
| Video | mp4, mov | 5 GB | Magic bytes, presigned upload |
| Spreadsheets | xlsx, csv | 10 MB | Magic bytes, row limits |

### Validation Process

```python
import magic
from PIL import Image

ALLOWED_MIME_TYPES = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "application/pdf": [".pdf"],
}

async def validate_upload(file: UploadFile) -> bool:
    # 1. Check extension
    ext = Path(file.filename).suffix.lower()
    
    # 2. Check magic bytes (actual content type)
    content = await file.read(1024)
    await file.seek(0)
    
    mime = magic.from_buffer(content, mime=True)
    
    if mime not in ALLOWED_MIME_TYPES:
        raise HTTPException(400, "File type not allowed")
    
    if ext not in ALLOWED_MIME_TYPES[mime]:
        raise HTTPException(400, "Extension doesn't match content")
    
    # 3. For images, validate dimensions
    if mime.startswith("image/"):
        img = Image.open(file.file)
        if img.width > 10000 or img.height > 10000:
            raise HTTPException(400, "Image dimensions too large")
    
    return True
```

### Presigned Upload (for large files)

```python
from minio import Minio

async def get_presigned_upload_url(
    user: User,
    filename: str,
    content_type: str
) -> dict:
    # Validate content type
    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(400, "Content type not allowed")
    
    # Generate secure path
    key = f"{user.organization_id}/uploads/{uuid4()}/{filename}"
    
    # Generate presigned URL (valid 1 hour)
    url = minio_client.presigned_put_object(
        "flowbender",
        key,
        expires=timedelta(hours=1)
    )
    
    return {"upload_url": url, "key": key}
```

---

## 9. Security Testing Plan

### Automated Tests

| Test Type | Tools | Frequency |
|---|---|---|
| Dependency vulnerabilities | `safety`, `npm audit` | Every build |
| Static analysis | `bandit` (Python), `eslint` | Every commit |
| SQL injection | `sqlmap` | Weekly |
| XSS scanning | `XSStrike` | Weekly |
| API fuzzing | `wfuzz` | Weekly |

### Manual Tests (per release)

- [ ] Tenant isolation verification
- [ ] Permission boundary testing
- [ ] Session fixation tests
- [ ] CSRF token validation
- [ ] Rate limit bypass attempts
- [ ] File upload bypass attempts

### Penetration Testing (quarterly)

- External security audit
- Focus areas: tenant isolation, auth, financial data

---

## 10. Incident Response

### Severity Levels

| Level | Description | Response Time | Example |
|---|---|---|---|
| P1 Critical | Data breach, system compromise | 15 minutes | Tenant data leaked |
| P2 High | Security vulnerability exploited | 1 hour | Unauthorized access |
| P3 Medium | Potential vulnerability found | 24 hours | Failed auth spike |
| P4 Low | Security improvement needed | 1 week | Weak password policy |

### Response Procedure

1. **Detect** — Monitoring, user report, automated alert
2. **Contain** — Disable affected accounts, revoke tokens
3. **Investigate** — Audit logs, system logs, scope assessment
4. **Remediate** — Fix vulnerability, patch systems
5. **Recover** — Restore service, re-enable accounts
6. **Post-mortem** — Document learnings, update procedures

---

## 11. Compliance Considerations

### Data Protection

- **Data minimization** — Only collect what's needed
- **Right to deletion** — Implement account/data deletion
- **Data portability** — Export user data on request
- **Consent management** — Clear data usage policies

### Financial Data (India)

- **GST records** — Maintain for 6 years
- **Settlement records** — Audit trail required
- **Bank details** — Encrypted storage

### Security Certifications (Future)

- SOC 2 Type II
- ISO 27001
- GDPR compliance (for EU expansion)

---

## 12. Implementation Priority

| Phase | Security Features | Timeline |
|---|---|---|
| **Phase 1** | Auth, password hashing, JWT | Week 1-2 |
| **Phase 2** | RBAC, RLS, tenant isolation | Week 3-4 |
| **Phase 3** | Audit logging, rate limiting | Week 5-6 |
| **Phase 4** | File validation, encryption | Week 7-8 |
| **Phase 5** | Security testing, penetration test | Week 9-10 |

**Awaiting approval before implementation.**
