# Flowbender — Product Vision

**Version:** 1.0 | **Date:** 2026-11-04 | **Status:** Draft for Approval

---

## 1. Mission Statement

Flowbender is an **open-source movie distribution ERP** that enables independent film distributors, production houses, and distribution companies to manage their entire distribution business **without expensive software subscriptions**.

### Core Principles

1. **Free to use** — no mandatory subscription fees
2. **Open source** — publicly available source code
3. **Self-hostable** — deployable on own infrastructure
4. **Multi-tenant** — multiple independent distribution companies with isolated data
5. **Professional grade** — reliable enough for real business operations

---

## 2. Current State vs. Target State

### What Flowbender IS Today

A **film production ERP** focused on:
- Project management (schedules, call sheets, attendance)
- Talent management (cast, crew, contracts)
- Production tracking (DPR, equipment, media, VFX)
- Financial tracking (budgets, expenses, purchase orders)
- Basic distribution (rights deals, agreements, releases)

**Architecture:** 100% frontend, localStorage-only, single-tenant demo

### What Flowbender NEEDS TO BE

A **film distribution platform** focused on:
- Distributor company management (multi-tenant)
- Film acquisition and portfolio management
- Territory and rights management
- Theatrical distribution (theatres, screens, releases)
- Box office collections and settlements
- OTT/Satellite/Digital licensing
- Marketing and release campaigns
- Financial accounting (film-wise P&L)

**Architecture:** Full-stack, PostgreSQL, multi-tenant, secure

---

## 3. Target Users

| User Type | Primary Needs |
|---|---|
| **Regional Distributor** | Acquire films, manage theatre relationships, track collections, settle with producers |
| **National Distributor** | Multi-territory rights, OTT/satellite deals, revenue analytics, compliance |
| **Production House** | Track distribution of own films, monitor collections, manage producer settlements |
| **Distribution Company** | Multiple employees, role-based access, financial reporting, audit trails |
| **Film Producer** | Visibility into distribution progress, collection reports, settlement statements |

---

## 4. Business Model

### Free Tier (Always Free)
- Full feature access
- Self-hosted deployment
- Community support
- Open-source licence

### Optional Services (Revenue Opportunities)
- **Hosted edition** — managed cloud hosting (subscription)
- **Priority support** — dedicated support contracts
- **Custom integrations** — payment gateways, accounting systems
- **Training and onboarding** — professional services

**Critical:** Core functionality must NEVER require paid services.

---

## 5. Key Differentiators

| vs. Existing Solutions | Flowbender Advantage |
|---|---|
| Expensive commercial ERPs | Free and open-source |
| Generic business software | Purpose-built for film distribution |
| Cloud-only solutions | Self-hostable on own infrastructure |
| Single-company systems | Multi-tenant from day one |
| Closed ecosystems | Open APIs and integrations |

---

## 6. Success Metrics

### Short-Term (6 months)
- Production-ready multi-tenant architecture
- Core distribution workflows functional
- First external deployments
- GitHub stars > 500

### Medium-Term (12 months)
- 10+ active distribution companies using Flowbender
- Complete theatrical and OTT workflows
- Integration with 2+ accounting systems
- Active contributor community

### Long-Term (24 months)
- Industry recognition as viable alternative
- 100+ active deployments
- Feature parity with commercial solutions
- Sustainable maintenance model

---

## 7. Non-Goals

These are explicitly **out of scope**:

1. **Streaming platform** — Flowbender manages distribution rights, not content delivery
2. **Ticketing system** — integration with POS systems, not replacement
3. **Content management** — asset metadata, not media asset storage/transcoding
4. **Production management replacement** — enhance existing production modules, don't rebuild
5. **Statutory compliance guarantees** — provide tools, not legal certification

---

## 8. Open-Source Strategy

### Recommended Licence
**AGPL-3.0** (GNU Affero General Public License)
- Ensures derivative works remain open-source
- Requires source disclosure for network services
- Protects against proprietary forks
- Allows commercial use and self-hosting

### Alternative: MIT or Apache-2.0
- More permissive, wider adoption
- Risk of proprietary forks
- Better for maximizing ecosystem growth

**Recommendation:** Start with AGPL-3.0, consider dual-licensing later.

---

## 9. Implementation Strategy

### Phase 1: Foundation (Weeks 1-4)
- Repository audit and documentation
- Database schema design
- Backend architecture setup
- Authentication system

### Phase 2: Multi-Tenant Core (Weeks 5-8)
- Organization management
- User and role system
- Data isolation
- API security

### Phase 3: Distribution Workflows (Weeks 9-16)
- Film acquisition
- Rights management
- Theatrical distribution
- Collections and settlements

### Phase 4: Production-Readiness (Weeks 17-20)
- Security hardening
- Automated testing
- Docker deployment
- Documentation

See FLOWBENDER_IMPLEMENTATION_ROADMAP.md for detailed phase breakdown.

---

## 10. Approval Request

Before proceeding with implementation:

1. **Confirm product vision** — Is the distribution-first focus correct?
2. **Confirm multi-tenant requirement** — Is organization isolation mandatory?
3. **Confirm backend technology** — PostgreSQL + FastAPI acceptable?
4. **Confirm open-source licence** — AGPL-3.0 preferred?
5. **Confirm implementation timeline** — ~20 weeks realistic?

**Awaiting explicit approval before any code changes.**
