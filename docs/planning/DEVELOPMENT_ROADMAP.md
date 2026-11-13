# Flowbender — Development Roadmap

**Date:** 2026-10-30  
**Approach:** Frontend-only · React + Tailwind · Static JSON mock data · No database (yet)  
**Principle:** Don't disturb the current design and UI. Build step by step.

---

## Phase 0 — Stabilise (Foundation fixes, no new features)

**Goal:** Remove backend dependencies, fix data integrity, make the app fully frontend-only.

| # | Task | Priority | Effort |
|---|---|---|---|
| 0.1 | Move persistence from `/api/demo-data` to localStorage/IndexedDB | Critical | Medium |
| 0.2 | Load `data/flowbender-demo-data.json` as initial seed only (import at build, never write) | Critical | Small |
| 0.3 | Remove or gate `app/api/demo-data/route.ts` and `app/api/webhook/deploy/route.ts` | Critical | Small |
| 0.4 | Migrate DPR reports, continuity binder, clapperboard logs and demo accounts into the main store | High | Medium |
| 0.5 | Unify department strings (enum everywhere, with labels) | High | Medium |
| 0.6 | Fix seed: Action Director/Choreographer should be under a new `stunts` department | Low | Small |
| 0.7 | Remove legacy `ScheduleEntry` or merge into `ShootDay` | Medium | Medium |
| 0.8 | Update Settings page text to reflect shared data (remove "Changes stay in this browser") | Low | Small |

---

## Phase 1 — Complete existing modules (fill the PARTIAL and VIEW-ONLY gaps)

**Goal:** Every module that already has UI should become fully functional (CRUD) using the existing design.

### Module 1 — Script
| # | Task | Effort |
|---|---|---|
| 1.1 | Version restore and compare (open a saved version, diff against current) | Medium |
| 1.2 | ScriptScene inline editing (not just add/delete) | Small |
| 1.3 | Scene delete in scene-store | Small |
| 1.4 | Script Reports export (Cast, Location, Dialogue as PDF/CSV) | Medium |
| 1.5 | Location report: scene count per location, INT/EXT and day/night split | Small |
| 1.6 | Locations: gallery editing, recce notes, permit fields in type (remove `as any`) | Medium |
| 1.7 | Fix `.pdf`/`.doc` import (currently reads binary as text) | Medium |

### Module 2 — Cast
| # | Task | Effort |
|---|---|---|
| 2.1 | Cast delete function | Small |
| 2.2 | Cast availability field + calendar view | Medium |
| 2.3 | Payment milestones CRUD (currently view-only, new members get `[]`) | Medium |
| 2.4 | Wire up `CharacterProfile` UI — view/edit characters, link to cast | Medium |

### Module 3 — Master Schedule
| # | Task | Effort |
|---|---|---|
| 3.1 | Shoot day delete | Small |
| 3.2 | Edit crew/equipment on shoot days (currently display-only) | Medium |
| 3.3 | Attendance → catering count integration | Small |
| 3.4 | Replace hardcoded weekly metrics with computed values | Small |
| 3.5 | Event calendar: general events beyond shoot days | Medium |

### Module 5 — Budgets and Accounts
| # | Task | Effort |
|---|---|---|
| 5.1 | Budget line items CRUD (currently view-only, never written) | Medium |
| 5.2 | Expense form: vendor picker from `vendors` collection | Small |
| 5.3 | Payroll entries CRUD (currently view-only) | Medium |

### Module 7 — Post
| # | Task | Effort |
|---|---|---|
| 7.1 | VFX: vendor picker from `vendors`, cost/bid fields | Small |
| 7.2 | VFX: link `sequence` to `scenes` collection | Small |
| 7.3 | Footage metadata: link `sceneId` to `scenes` collection | Small |
| 7.4 | Persist backup policy to the store | Small |
| 7.5 | Deliverables: add Edit button (editingId state exists but no UI) | Small |

### Module 8 — Business
| # | Task | Effort |
|---|---|---|
| 8.1 | Distribution: territory master list (instead of free text) | Small |
| 8.2 | Receivables: due dates, instalment schedule | Medium |

### Module 10 — Teams
| # | Task | Effort |
|---|---|---|
| 10.1 | Grouped department view with headings | Small |
| 10.2 | Crew delete function | Small |
| 10.3 | Add "Teams" to navigation | Small |

### Module 11 — Settings
| # | Task | Effort |
|---|---|---|
| 11.1 | Role picker when creating accounts (not forced to Production Manager) | Small |
| 11.2 | Password and name/email editing for accounts | Small |
| 11.3 | Persist workspace preferences (production house, currency, switches) | Small |

---

## Phase 2 — Build missing modules

**Goal:** Implement the MISSING submodules from the spec, one module at a time.

### Module 4 — Production Crew Depts (largest gap)
| # | Task | Effort |
|---|---|---|
| 4.1 | Align department enum to spec's 9 departments (with sub-roles as data) | Medium |
| 4.2 | Per-department remuneration tracking (milestones, rate types, allowances) | Large |
| 4.3 | Rental entity (vendor, item, rate, period, cost) per department | Large |
| 4.4 | Department-level expense tracking (link `ExpenseItem` to department) | Medium |
| 4.5 | New types: `HotelStay`, `Trip` (Locations dept) | Medium |
| 4.6 | New types: `PropLibraryItem`, `Set` with VFX link (Art & Props dept) | Medium |
| 4.7 | New types: `Vehicle`, `Caravan` with driver link (Vehicles dept) | Medium |
| 4.8 | Production Office: rent, maintenance, miscellaneous tracking | Medium |

### Module 5 — Budgets (remaining)
| # | Task | Effort |
|---|---|---|
| 5.4 | Purchase Orders: proper PO type with number, vendor, approval workflow | Large |
| 5.5 | Invoices: new type and CRUD | Large |
| 5.6 | Insurance: new type and CRUD | Medium |

### Module 1 — Script (remaining)
| # | Task | Effort |
|---|---|---|
| 1.8 | Shot Division: shot list model linked to scenes | Large |
| 1.9 | Script Timeline: story chronology view | Medium |
| 1.10 | References: attachment system (audio, video, image per character/location/prop) | Large |
| 1.11 | Three Act Structure Analysis (could be rule-based or AI-assisted later) | Large |

### Module 7 — Post (remaining)
| # | Task | Effort |
|---|---|---|
| 7.6 | Edit/Reel/Cut model linked to script timeline | Large |
| 7.7 | Posters and Publicity workspace | Medium |
| 7.8 | Internet and Digital Marketing workspace (wire up `MarketingItem`) | Medium |
| 7.9 | OST Receivables model | Medium |
| 7.10 | Dubbing: language/artist/session model | Medium |
| 7.11 | BGM: cue sheet / track model | Medium |
| 7.12 | Trailers & Teasers workspace | Medium |

### Module 8 — Business (remaining)
| # | Task | Effort |
|---|---|---|
| 8.3 | Finance: Investor, Loan, Interest rate types | Large |
| 8.4 | In-film Branding tracking | Medium |
| 8.5 | Burn and Tranches: monthly burn data, tranche schedule | Medium |
| 8.6 | Release planning: territory dates, screen counts | Medium |

### Module 3 — Schedule (remaining)
| # | Task | Effort |
|---|---|---|
| 3.6 | Pre-Production phase: tasks, milestones, dates | Large |

### Module 9 — Reports (entirely missing)
| # | Task | Effort |
|---|---|---|
| 9.1 | Overview: dept-wise spend pie chart, project Gantt | Large |
| 9.2 | Production report (shoot progress, DPR summary) | Medium |
| 9.3 | Scheduling report (utilisation, conflicts) | Medium |
| 9.4 | Budget and Finance report (budget vs actual, variance) | Medium |
| 9.5 | Cast and Crew report (availability, payment summary) | Medium |
| 9.6 | Equipment report (utilisation, maintenance) | Medium |
| 9.7 | Locations report (permits, costs, usage) | Medium |
| 9.8 | Custom reports (user-defined filters, export) | Large |

### Module 11 — Settings (remaining)
| # | Task | Effort |
|---|---|---|
| 11.4 | Add User, Business Owner, Administrator roles | Medium |
| 11.5 | Route guards and edit permission enforcement | Medium |

---

## Phase 3 — Polish and advanced features

| # | Task | Effort |
|---|---|---|
| P.1 | Wire up Recharts for all dashboard and report charts | Medium |
| P.2 | Render `producer-command-center.tsx` (currently orphan) | Small |
| P.3 | Render `production-timeline.tsx` and `budget-overview.tsx` (currently orphans) | Small |
| P.4 | Call sheet print/PDF export with real formatting | Medium |
| P.5 | Global search across all collections in command palette | Medium |
| P.6 | Notification system: generate notifications from data changes | Medium |
| P.7 | Data export as CSV/PDF per module | Medium |

---

## Phase 4 — Database migration (future)

When ready to move from static JSON to a real database:

1. Replace `useSyncExternalStore` store with API calls (React Query / SWR)
2. Implement FastAPI or Node.js backend with the same collection structure
3. Migrate JSON seed data to database seed scripts
4. Add real authentication (JWT, sessions)
5. Add real-time sync (WebSocket / SSE for multi-user)
6. Add file storage (S3/R2) for images, scripts, attachments

The current type system in `lib/types.ts` maps directly to database tables, so the migration path is clean.

---

## Effort estimates

| Phase | Tasks | Est. effort |
|---|:-:|---|
| Phase 0 — Stabilise | 8 | 1-2 days |
| Phase 1 — Complete existing | ~25 | 1-2 weeks |
| Phase 2 — Build missing | ~25 | 3-5 weeks |
| Phase 3 — Polish | 7 | 1 week |
| **Total frontend phase** | **~65** | **6-10 weeks** |
