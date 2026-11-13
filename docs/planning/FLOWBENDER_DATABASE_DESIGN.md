# Flowbender — Database Design

**Version:** 1.0 | **Date:** 2026-11-04 | **Status:** Draft for Approval

---

## 1. Entity-Relationship Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              MULTI-TENANT CORE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────┐        ┌──────────────┐        ┌──────────────┐         │
│   │ ORGANIZATION │───1:N──│    BRANCH    │───1:N──│     USER     │         │
│   └──────────────┘        └──────────────┘        └──────┬───────┘         │
│          │                                               │                  │
│          │                                               │                  │
│          │ 1:N                                     ┌─────┴─────┐            │
│          │                                         │   ROLE    │            │
│          ▼                                         └───────────┘            │
│   ┌──────────────┐                                                          │
│   │     FILM     │──────────────────────────────────────────────────────────┤
│   └──────┬───────┘                                                          │
│          │                                                                  │
├──────────┼──────────────────────────────────────────────────────────────────┤
│          │                    DISTRIBUTION DOMAIN                           │
│          │                                                                  │
│   ┌──────┴───────┐     ┌──────────────┐     ┌──────────────┐              │
│   │    RIGHTS    │─────│  AGREEMENT   │─────│   RELEASE    │              │
│   │    DEAL      │     │              │     │              │              │
│   └──────────────┘     └──────────────┘     └──────┬───────┘              │
│                                                     │                       │
│   ┌──────────────┐     ┌──────────────┐     ┌──────┴───────┐              │
│   │   THEATRE    │─────│   SCREEN     │─────│  ALLOCATION  │              │
│   └──────────────┘     └──────────────┘     └──────────────┘              │
│                                                                             │
│   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐              │
│   │  COLLECTION  │─────│  SETTLEMENT  │─────│   REVENUE    │              │
│   │   (Daily)    │     │              │     │   SHARING    │              │
│   └──────────────┘     └──────────────┘     └──────────────┘              │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                           MARKETING & DELIVERY                              │
│                                                                             │
│   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐              │
│   │   CAMPAIGN   │     │   DELIVERY   │     │  CENSOR      │              │
│   │              │     │   CHECKLIST  │     │  CERTIFICATE │              │
│   └──────────────┘     └──────────────┘     └──────────────┘              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Tables

### 2.1 Organizations (Multi-Tenant Root)

```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    logo_url TEXT,
    
    -- Business details
    legal_name VARCHAR(255),
    gst_number VARCHAR(20),
    pan_number VARCHAR(15),
    address JSONB,
    
    -- Settings
    default_currency CHAR(3) DEFAULT 'INR',
    fiscal_year_start INT DEFAULT 4, -- April
    settings JSONB DEFAULT '{}',
    
    -- Subscription (for future hosted version)
    tier VARCHAR(20) DEFAULT 'free',
    trial_ends_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row-Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_isolation ON organizations
    USING (id = current_setting('app.organization_id')::uuid);
```

### 2.2 Branches

```sql
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20),
    address JSONB,
    phone VARCHAR(20),
    email VARCHAR(255),
    is_headquarters BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_branches_org ON branches(organization_id);
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
CREATE POLICY branches_isolation ON branches
    USING (organization_id = current_setting('app.organization_id')::uuid);
```

### 2.3 Users

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    phone VARCHAR(20),
    avatar_url TEXT,
    
    role VARCHAR(50) NOT NULL DEFAULT 'staff',
    permissions JSONB DEFAULT '[]',
    
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, email)
);

CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY users_isolation ON users
    USING (organization_id = current_setting('app.organization_id')::uuid);
```

---

## 3. Film & Acquisition Tables

### 3.1 Films (Distributed Films Portfolio)

```sql
CREATE TABLE films (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Basic Info
    title VARCHAR(500) NOT NULL,
    original_title VARCHAR(500),
    year INT,
    language VARCHAR(50),
    genres TEXT[], -- Array of genres
    runtime_minutes INT,
    
    -- Production Details (source, not our production)
    producer_name VARCHAR(255),
    production_house VARCHAR(255),
    director VARCHAR(255),
    
    -- Acquisition
    acquisition_date DATE,
    acquisition_cost DECIMAL(18,2) DEFAULT 0,
    advance_paid DECIMAL(18,2) DEFAULT 0,
    acquisition_territory VARCHAR(100),
    
    -- Status
    status VARCHAR(50) DEFAULT 'acquired',
    -- acquired, in_distribution, completed, archived
    
    -- Media
    poster_url TEXT,
    banner_url TEXT,
    trailer_url TEXT,
    
    -- Metadata
    synopsis TEXT,
    cast_details JSONB,
    crew_details JSONB,
    certifications JSONB, -- {cbfc: 'U/A', bbfc: '12A'}
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_films_org ON films(organization_id);
CREATE INDEX idx_films_status ON films(organization_id, status);
ALTER TABLE films ENABLE ROW LEVEL SECURITY;
CREATE POLICY films_isolation ON films
    USING (organization_id = current_setting('app.organization_id')::uuid);
```

### 3.2 Producers (Film Owners)

```sql
CREATE TABLE producers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    production_house VARCHAR(255),
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    address JSONB,
    
    gst_number VARCHAR(20),
    pan_number VARCHAR(15),
    bank_details JSONB,
    
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_producers_org ON producers(organization_id);
ALTER TABLE producers ENABLE ROW LEVEL SECURITY;
CREATE POLICY producers_isolation ON producers
    USING (organization_id = current_setting('app.organization_id')::uuid);
```

---

## 4. Rights & Agreements Tables

### 4.1 Territories

```sql
CREATE TABLE territories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20),
    type VARCHAR(50) NOT NULL, -- country, state, district, city
    parent_id UUID REFERENCES territories(id),
    
    -- Hierarchy path for efficient queries
    path LTREE, -- Requires ltree extension
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_territories_org ON territories(organization_id);
CREATE INDEX idx_territories_path ON territories USING GIST(path);
ALTER TABLE territories ENABLE ROW LEVEL SECURITY;
CREATE POLICY territories_isolation ON territories
    USING (organization_id = current_setting('app.organization_id')::uuid);
```

### 4.2 Rights Deals

```sql
CREATE TABLE rights_deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    film_id UUID NOT NULL REFERENCES films(id) ON DELETE CASCADE,
    
    -- Rights specification
    rights_type VARCHAR(50) NOT NULL,
    -- theatrical, ott, satellite, digital, audio, dubbed, remake, broadcast
    
    territory_id UUID REFERENCES territories(id),
    territory_name VARCHAR(255), -- For quick display
    
    -- Deal terms
    is_exclusive BOOLEAN DEFAULT TRUE,
    start_date DATE,
    end_date DATE,
    
    -- Financial
    minimum_guarantee DECIMAL(18,2) DEFAULT 0,
    advance_received DECIMAL(18,2) DEFAULT 0,
    revenue_share_percent DECIMAL(5,2), -- e.g., 50.00
    
    -- Status
    status VARCHAR(50) DEFAULT 'open',
    -- open, negotiating, signed, expired, terminated
    
    -- Delivery
    delivery_status VARCHAR(50) DEFAULT 'pending',
    delivery_date DATE,
    
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent overlapping exclusive rights
    CONSTRAINT no_duplicate_exclusive EXCLUDE USING GIST (
        organization_id WITH =,
        film_id WITH =,
        rights_type WITH =,
        territory_id WITH =,
        daterange(start_date, end_date, '[]') WITH &&
    ) WHERE (is_exclusive = TRUE AND status IN ('signed', 'active'))
);

CREATE INDEX idx_rights_org_film ON rights_deals(organization_id, film_id);
ALTER TABLE rights_deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY rights_isolation ON rights_deals
    USING (organization_id = current_setting('app.organization_id')::uuid);
```

### 4.3 Distribution Agreements

```sql
CREATE TABLE distribution_agreements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    film_id UUID NOT NULL REFERENCES films(id) ON DELETE CASCADE,
    
    -- Counterparty
    distributor_name VARCHAR(255) NOT NULL, -- Could be sub-distributor
    distributor_type VARCHAR(50), -- exhibitor, sub_distributor, ott_platform, channel
    contact_details JSONB,
    
    -- Channel
    channel VARCHAR(50) NOT NULL,
    -- theatrical, ott, satellite, digital, audio
    
    -- Terms
    territories UUID[], -- Array of territory IDs
    territory_names TEXT[], -- For display
    languages TEXT[],
    
    start_date DATE,
    end_date DATE,
    
    -- Financial
    agreement_value DECIMAL(18,2) DEFAULT 0,
    advance_paid DECIMAL(18,2) DEFAULT 0,
    payment_terms TEXT,
    
    -- Revenue sharing (configurable per agreement)
    revenue_sharing JSONB,
    -- Example: {
    --   "distributor_share": 40,
    --   "exhibitor_share": 50,
    --   "producer_share": 10,
    --   "gst_rate": 18
    -- }
    
    -- Status workflow
    status VARCHAR(50) DEFAULT 'draft',
    -- draft, negotiating, pending_approval, active, expired, terminated, cancelled
    
    -- Documents
    document_urls TEXT[],
    
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agreements_org ON distribution_agreements(organization_id);
CREATE INDEX idx_agreements_film ON distribution_agreements(film_id);
CREATE INDEX idx_agreements_status ON distribution_agreements(organization_id, status);
ALTER TABLE distribution_agreements ENABLE ROW LEVEL SECURITY;
CREATE POLICY agreements_isolation ON distribution_agreements
    USING (organization_id = current_setting('app.organization_id')::uuid);
```

---

## 5. Theatrical Distribution Tables

### 5.1 Theatres

```sql
CREATE TABLE theatres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    chain VARCHAR(100), -- PVR, INOX, etc.
    
    -- Location
    territory_id UUID REFERENCES territories(id),
    address JSONB,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    
    -- Contact
    owner_name VARCHAR(255),
    manager_name VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    
    -- Capacity
    total_screens INT DEFAULT 1,
    total_seats INT,
    
    -- Business
    gst_number VARCHAR(20),
    bank_details JSONB,
    
    -- Relationship
    relationship_status VARCHAR(50) DEFAULT 'active',
    -- prospective, active, inactive, blacklisted
    
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_theatres_org ON theatres(organization_id);
CREATE INDEX idx_theatres_territory ON theatres(territory_id);
ALTER TABLE theatres ENABLE ROW LEVEL SECURITY;
CREATE POLICY theatres_isolation ON theatres
    USING (organization_id = current_setting('app.organization_id')::uuid);
```

### 5.2 Screens

```sql
CREATE TABLE screens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    theatre_id UUID NOT NULL REFERENCES theatres(id) ON DELETE CASCADE,
    
    name VARCHAR(50) NOT NULL, -- Screen 1, Audi 2, etc.
    screen_number INT,
    
    seating_capacity INT,
    screen_type VARCHAR(50), -- 2D, 3D, IMAX, 4DX
    sound_system VARCHAR(50), -- Dolby Atmos, DTS, etc.
    
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_screens_theatre ON screens(theatre_id);
ALTER TABLE screens ENABLE ROW LEVEL SECURITY;
CREATE POLICY screens_isolation ON screens
    USING (organization_id = current_setting('app.organization_id')::uuid);
```

### 5.3 Releases

```sql
CREATE TABLE releases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    film_id UUID NOT NULL REFERENCES films(id) ON DELETE CASCADE,
    agreement_id UUID REFERENCES distribution_agreements(id),
    
    -- Release info
    release_date DATE NOT NULL,
    release_type VARCHAR(50), -- wide, limited, premiere
    
    -- Scope
    territory_id UUID REFERENCES territories(id),
    target_screens INT,
    confirmed_screens INT,
    
    -- Status
    status VARCHAR(50) DEFAULT 'planned',
    -- planned, confirmed, released, completed, cancelled
    
    -- Financial projections
    expected_collection DECIMAL(18,2),
    marketing_budget DECIMAL(18,2),
    
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_releases_org_film ON releases(organization_id, film_id);
ALTER TABLE releases ENABLE ROW LEVEL SECURITY;
CREATE POLICY releases_isolation ON releases
    USING (organization_id = current_setting('app.organization_id')::uuid);
```

### 5.4 Screen Allocations

```sql
CREATE TABLE screen_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    release_id UUID NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
    theatre_id UUID NOT NULL REFERENCES theatres(id),
    screen_id UUID REFERENCES screens(id),
    
    start_date DATE NOT NULL,
    end_date DATE,
    
    shows_per_day INT DEFAULT 4,
    show_times JSONB, -- ["10:00", "14:00", "18:00", "21:00"]
    
    ticket_price_range JSONB, -- {"min": 100, "max": 300}
    
    status VARCHAR(50) DEFAULT 'requested',
    -- requested, confirmed, active, completed, cancelled
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_allocations_release ON screen_allocations(release_id);
ALTER TABLE screen_allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY allocations_isolation ON screen_allocations
    USING (organization_id = current_setting('app.organization_id')::uuid);
```

---

## 6. Collections & Settlements Tables

### 6.1 Daily Box Office Collections

```sql
CREATE TABLE box_office_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    release_id UUID NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
    theatre_id UUID NOT NULL REFERENCES theatres(id),
    allocation_id UUID REFERENCES screen_allocations(id),
    
    collection_date DATE NOT NULL,
    
    -- Collection breakdown
    gross_collection DECIMAL(18,2) NOT NULL DEFAULT 0,
    gst_amount DECIMAL(18,2) DEFAULT 0,
    entertainment_tax DECIMAL(18,2) DEFAULT 0,
    other_deductions DECIMAL(18,2) DEFAULT 0,
    net_collection DECIMAL(18,2) GENERATED ALWAYS AS (
        gross_collection - gst_amount - entertainment_tax - other_deductions
    ) STORED,
    
    -- Show details
    total_shows INT,
    total_tickets INT,
    occupancy_percent DECIMAL(5,2),
    
    -- Revenue sharing (copied from agreement, can override)
    distributor_share_percent DECIMAL(5,2),
    exhibitor_share_percent DECIMAL(5,2),
    producer_share_percent DECIMAL(5,2),
    
    -- Calculated shares
    distributor_share DECIMAL(18,2),
    exhibitor_share DECIMAL(18,2),
    producer_share DECIMAL(18,2),
    
    -- Verification
    source VARCHAR(50), -- manual, integrated, estimated
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES users(id),
    
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(release_id, theatre_id, collection_date)
);

CREATE INDEX idx_collections_release ON box_office_collections(release_id);
CREATE INDEX idx_collections_date ON box_office_collections(collection_date);
ALTER TABLE box_office_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY collections_isolation ON box_office_collections
    USING (organization_id = current_setting('app.organization_id')::uuid);
```

### 6.2 Settlements

```sql
CREATE TABLE settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Reference
    settlement_type VARCHAR(50) NOT NULL,
    -- theatre_settlement, producer_settlement, sub_distributor_settlement
    
    film_id UUID REFERENCES films(id),
    release_id UUID REFERENCES releases(id),
    agreement_id UUID REFERENCES distribution_agreements(id),
    
    -- Counterparty
    counterparty_type VARCHAR(50), -- theatre, producer, sub_distributor
    counterparty_id UUID, -- Could reference different tables
    counterparty_name VARCHAR(255),
    
    -- Period
    period_start DATE,
    period_end DATE,
    
    -- Amounts
    gross_amount DECIMAL(18,2) DEFAULT 0,
    deductions JSONB, -- Detailed breakdown
    net_amount DECIMAL(18,2) DEFAULT 0,
    
    -- Advance/balance
    advance_adjusted DECIMAL(18,2) DEFAULT 0,
    previous_balance DECIMAL(18,2) DEFAULT 0,
    amount_payable DECIMAL(18,2) GENERATED ALWAYS AS (
        net_amount - advance_adjusted - previous_balance
    ) STORED,
    
    -- Payment
    payment_status VARCHAR(50) DEFAULT 'pending',
    -- pending, partial, paid, disputed
    paid_amount DECIMAL(18,2) DEFAULT 0,
    payment_date DATE,
    payment_reference VARCHAR(100),
    
    -- Documents
    statement_url TEXT,
    
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_settlements_org ON settlements(organization_id);
CREATE INDEX idx_settlements_film ON settlements(film_id);
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY settlements_isolation ON settlements
    USING (organization_id = current_setting('app.organization_id')::uuid);
```

---

## 7. OTT/Satellite/Digital Tables

### 7.1 Platforms

```sql
CREATE TABLE platforms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- ott, satellite, digital, audio
    
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE platforms ENABLE ROW LEVEL SECURITY;
CREATE POLICY platforms_isolation ON platforms
    USING (organization_id = current_setting('app.organization_id')::uuid);
```

### 7.2 Digital Deals

```sql
CREATE TABLE digital_deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    film_id UUID NOT NULL REFERENCES films(id) ON DELETE CASCADE,
    platform_id UUID REFERENCES platforms(id),
    agreement_id UUID REFERENCES distribution_agreements(id),
    
    deal_type VARCHAR(50), -- ott_license, satellite_premiere, digital_rental
    
    -- Window
    window_start DATE,
    window_end DATE,
    
    -- Financial
    deal_value DECIMAL(18,2),
    advance_received DECIMAL(18,2) DEFAULT 0,
    
    -- Milestones
    milestones JSONB,
    -- [{"name": "On signing", "percent": 30, "status": "paid"}, ...]
    
    -- Delivery
    delivery_status VARCHAR(50) DEFAULT 'pending',
    delivery_date DATE,
    
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE digital_deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY digital_deals_isolation ON digital_deals
    USING (organization_id = current_setting('app.organization_id')::uuid);
```

---

## 8. Marketing Tables

### 8.1 Marketing Campaigns

```sql
CREATE TABLE marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    film_id UUID NOT NULL REFERENCES films(id) ON DELETE CASCADE,
    release_id UUID REFERENCES releases(id),
    
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50), -- digital, outdoor, print, tv, radio, premiere
    
    start_date DATE,
    end_date DATE,
    
    budget DECIMAL(18,2),
    spent DECIMAL(18,2) DEFAULT 0,
    
    status VARCHAR(50) DEFAULT 'planned',
    
    details JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY campaigns_isolation ON marketing_campaigns
    USING (organization_id = current_setting('app.organization_id')::uuid);
```

---

## 9. Audit & System Tables

### 9.1 Audit Log

```sql
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    organization_id UUID NOT NULL,
    user_id UUID,
    
    action VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, LOGIN, etc.
    table_name VARCHAR(100),
    record_id UUID,
    
    old_values JSONB,
    new_values JSONB,
    changes JSONB,
    
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_org ON audit_logs(organization_id);
CREATE INDEX idx_audit_table ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_time ON audit_logs(created_at);

-- No RLS on audit - admins can query across org (with explicit org filter)
```

### 9.2 Sessions

```sql
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    refresh_token_hash VARCHAR(255) NOT NULL,
    
    ip_address INET,
    user_agent TEXT,
    
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);
```

---

## 10. Indexes & Performance

### Key Indexes (in addition to above)

```sql
-- Composite indexes for common queries
CREATE INDEX idx_collections_film_date ON box_office_collections(
    organization_id, 
    (SELECT film_id FROM releases WHERE id = release_id),
    collection_date DESC
);

CREATE INDEX idx_agreements_status_date ON distribution_agreements(
    organization_id, 
    status, 
    end_date
);

-- Full-text search on film titles
CREATE INDEX idx_films_title_search ON films 
    USING GIN(to_tsvector('english', title || ' ' || COALESCE(original_title, '')));
```

---

## 11. Migration Strategy

### From localStorage to PostgreSQL

1. **Export existing data** from localStorage to JSON
2. **Map to new schema** — projects → films, rightsDeals → rights_deals
3. **Create default organization** for existing data
4. **Import with organization_id** set
5. **Validate data integrity**

### Key Mappings

| localStorage Collection | PostgreSQL Table | Notes |
|---|---|---|
| projects | films | Different purpose — production vs distribution |
| rightsDeals | rights_deals | Enhanced with territory FK |
| distributionAgreements | distribution_agreements | Add revenue_sharing JSONB |
| distributionRevenue | box_office_collections | Restructured for daily tracking |
| distributionSettlements | settlements | Enhanced with counterparty |

---

## 12. Summary Statistics

| Category | Tables | Purpose |
|---|---|---|
| Multi-Tenant Core | 3 | organizations, branches, users |
| Film & Acquisition | 2 | films, producers |
| Rights & Agreements | 3 | territories, rights_deals, distribution_agreements |
| Theatrical | 4 | theatres, screens, releases, screen_allocations |
| Collections | 2 | box_office_collections, settlements |
| OTT/Digital | 2 | platforms, digital_deals |
| Marketing | 1 | marketing_campaigns |
| System | 2 | audit_logs, user_sessions |
| **Total** | **19** | |

**Awaiting approval before implementing migrations.**
