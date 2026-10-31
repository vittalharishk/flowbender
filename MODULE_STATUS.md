# Flowbender — Module Status

**Date:** 2026-10-31 (Final Master Schedule Audit)  
**Legend:** ✅ DONE · 🔶 PARTIAL · 👁 VIEW-ONLY · ❌ MISSING

---

## Module 1 — Script

| Submodule | Status | What exists | What's missing |
|---|:-:|---|---|
| Scenes (Version Control) | 🔶 | Scene list with filters and status. ScriptScene add/delete inside editor. Version snapshot creation (`Script.versions`). | Cannot open, restore, compare or delete a version. Scene edit is limited (no character edit after create, no delete). ScriptScene can't be edited. |
| Shot Division | ❌ | `shot` block type exists but renders blank. | No shot list, shot model, or shot-to-scene link. |
| Script Reports > Cast Report | 👁 | Characters & Dialogue tab computes speeches, words, share of dialogue. | Not linked to `castMembers`. No export. |
| Script Reports > Location Report | 👁 | Locations tab shows distinct location names as chips. | No scene count per location, no INT/EXT or day/night split, no export. Parser computes these but only in upload preview. |
| Script Reports > Dialogue Report | 👁 | "Spoken Lines Inspector" shows lines by scene. | No export, no per-scene dialogue breakdown. |
| Script Reports > Prop Report | ❌ | Breakdown tab lets you type props per scene (comma-separated). Scene detail shows props from seed. | No combined cross-scene report. Scene breakdown items can't be added or edited from the scene detail view. |
| Script Timeline | ❌ | `ScriptScene.scriptDay` field exists but nothing displays it. | No story chronology or timeline view. |
| Locations and Scouting | 🔶 | Full CRUD: add, edit, delete, status cycle (scouting → permit-pending → locked), cover image upload/crop, permit dialog. | No gallery editing, no recce notes/photos/costs, no scout dates, permit fields use `as any` with hardcoded defaults, Police/Fire NOC toggles not saved. |
| References (Audio, Video, Image, Character, Location, Prop) | ❌ | — | No reference attachment system at all. |
| Analysis (Three Act Structure AI) | ❌ | — | No structure analysis. Only analysis is word/dialogue stats in the parser. |

**Extras not in spec:** Script library with search/filter/duplicate/archive/delete. Block-based editor (8 block types). Upload/parse from .fdx/paste with 3 sample screenplays. Script metadata editor.

---

## Module 2 — Cast

| Submodule | Status | What exists | What's missing |
|---|:-:|---|---|
| Roles – Probable | 🔶 | `CharacterProfile` type with `linkedCastIds` (10 seeded). Script editor computes role tiers. | No UI to view or edit characters. Calculated tiers aren't saved. No "probable" status for casting. |
| Casting | 🔶 | Add/edit cast member with character, project, category, contact info. List with grid/table views. | No casting pipeline: auditions, shortlist, multiple candidates per role, offer/accept workflow. No delete function. |
| Leads and Supporting | ✅ | `CastCategory`: lead, supporting, character-artist, guest, child-artist, special-appearance. Filterable and badged. | — |
| Contracts | 🔶 | `contractStatus`, `paymentStatus`, `totalFee`, `paidAmount` editable. List filter, profile summary. | `paymentMilestones` view-only (new members start with `[]`). No contract documents, terms, dates, clauses or signatures. |
| Availability | ❌ | — | No availability field on CastMember. Only crew has availability. Cast profile shows upcoming shoot days (view-only, derived from schedule). |

**Extras not in spec:** Assigned scenes matched by character name. Grid/list view toggle. Profile with contact details, payment summary, shoot schedule.

---

## Module 3 — Master Schedule

| Submodule | Status | What exists | What's missing |
|---|:-:|---|---|
| Attendance > Set Count for Catering | ✅ | AttendanceTab: 3 sub-tabs (Register/Catering/History). 514 records seeded. calcCateringCount: present×1.0 + half-day×0.5. Live catering panel with cast/crew/visitor/total cards. Manual adjustments. History view. Global + project-scoped pages. | — |
| Call Sheets | ✅ | Full CRUD with status flow (Draft → Review → Published → Revised → Completed). Cast/crew sync, transport/catering tables, revision history, print/PDF preview. | Publishing sends nothing. `props`, `safety`, `specialNotes` fields exist in type but have no editor. |
| Pre-Production | ✅ | PreProdBoard: 4 tabs (Dashboard, Task Board Kanban on 90 productionTasks, Checklist on 196 items / 7 categories, Readiness from real data). Global + project-scoped pages. | — |
| Production | ✅ | ProductionDashboard: 4 tabs (Dashboard, Shoot Days list, Scene Progress, DPR Reports). 96 shootDays visible. 13 richDprReports + 3 original dprReports preserved. DPR CRUD. Global + project-scoped pages. | 8 shootDays have castRequired names not matching castMember.name (pre-existing). |
| Post-Production | ✅ | Task tracker + departments + deliverables (existing workspace). NEW: PostProdPipeline with 5 tabs — Dashboard (summary cards, project/dept progress, deadlines), Pipeline (8 dept columns with progress), Task Board (Kanban with approval workflow), Milestones (70 seeded across 7 projects, editable), Approvals (in-review queue). 29 postProductionItems preserved + enriched. postProdMilestones: 70 seeded. | Gantt post bar still a dummy. Not yet linked to Event Calendar. |
| Event Calendar | ✅ | Full unified calendar with Dashboard / Month / Week / Day / Agenda tabs. Shoot days (96) overlaid from shootDays. 37 calendarEvents seeded (table reads, crew meetings, rehearsals, delivery deadlines, cast meetings, location scouting, dubbing sessions). CRUD: create / edit / cancel / delete with confirmation. Filters: project, category, status, search. Cross-module: shoot days linked to shootDay records. Global + project-scoped pages. | Shoot day events read-only (from shootDays, not duplicated). |

**Extras not in spec:** Gantt chart (custom implementation). Scene stripboard with conflict detection. Digital clapperboard (localStorage). Continuity binder (localStorage). Call sheet versioning and print-to-PDF.

---

## Module 4 — Production Crew Depts

The app has a single `CrewMember` record with one department enum (16 values) and a free-text `role` field. There are no per-department entities for Remunerations, Rentals or Expenses.

**Pay tracking:** day rate × days, paid amount, payment status — per crew member only. No milestones, no weekly/package rates, no allowances.

| Dept / Item | Status | Evidence | Gaps |
|---|:-:|---|---|
| **1. Writing & Direction** | | | |
| Script Writer | 🔶 | `Script.writer/screenplayBy` fields exist. No crew preset. | Not linked to crew records. |
| Lyric Writers | ❌ | — | No preset, field or seed. |
| Dialogue Writers | 🔶 | `Script.dialoguesBy` field. | No crew role preset. |
| Co-Director | ❌ | — | Custom free-text role only. |
| Assistant Directors | 🔶 | Presets "1st/2nd AD" in add dialog. | Role value only, no dept-specific tracking. |
| **2. Daily Prod & Catering** | | | |
| Catering In-charge | ❌ | Call sheet catering rows (free text). | No crew role, no catering cost tracking. |
| Production Assistants | 🔶 | Preset "Production Assistant". | Role value only. |
| **3. Camera & Lights** | | | |
| Camera Assistants | 🔶 | Presets "1st/2nd AC". | Role value only. |
| Gaffers | 🔶 | Preset "Gaffer". Not in seed. | Role value only. |
| Light Boys | ❌ | Nearest: "Electrician" / "Lighting Technician". | No exact match. |
| **4. Locations** | | | |
| Production Manager | 🔶 | Preset + demo auth role. | No locations department in enum. |
| Location Manager | ❌ | — | No preset, no locations dept. |
| Spot Boys | ❌ | — | — |
| Boarding (Hotel Stay) | ❌ | — | No hotel/stay type or UI. |
| Travel (Add Trip) | ❌ | — | No trip type. Travel only as free-text expense category. |
| **5. Art & Props** | | | |
| Art Director | 🔶 | Preset. Seeded under `production-design`. | — |
| Set Assistants | ❌ | Nearest: "Set Decorator" / "Set Designer". | — |
| Props and Prop Library | 🔶 | Equipment with `category: "props"`. Scene breakdown props. | No prop-library entity, rental rate, or vendor tracking. |
| Sets | ❌ | — | No Set entity. Only budget line text. |
| AI Set Extensions | ❌ | — | VfxShot has no set/art link. |
| **6. Costume & Makeup** | | | |
| Costumer | 🔶 | Presets "Costume Designer / Wardrobe Supervisor / Costume Assistant". | — |
| Makeup Artist | 🔶 | Preset. | — |
| Prosthetics Artist | 🔶 | Only "SFX Makeup Artist". | No exact match. |
| **7. Vehicles** | | | |
| Caravans | ❌ | — | — |
| Production Vehicles | 👁 | Scene breakdown `vehicles[]`. Call sheet transport rows. Equipment "Transport unit" seed. | No vehicle entity, rental rate or fuel. Equipment form has no transport category. |
| Drivers | 🔶 | Preset "Driver" under transport. Call sheet transport driver column. | — |
| **8. Action & Stunts** | | | |
| Action Director | 🔶 | Seeded under wrong dept (vfx). | No stunts department. |
| Stunt Boys | ❌ | — | — |
| **9. Production Office** | | | |
| Rents | ❌ | — | — |
| Maintenance | ❌ | Only `EquipmentItem.status: "maintenance"`. | — |
| Miscellaneous | 🔶 | Free-text `ExpenseItem.category`. | — |

---

## Module 5 — Budgets and Accounts

| Submodule | Status | What exists | What's missing |
|---|:-:|---|---|
| Overview | 👁 | 8 KPI tiles (Budget, Committed, Actual, Forecast, Variance, Paid, Payables, Receivables). Burn bar. | No charts (CSS bars only). Budget from Project record, not line-item totals. |
| Budgets > Departments | 👁 | Lists `budgetLineItems` (category, allocated, committed, spent, notes). | No add/edit — the collection is never written to. No account codes. |
| Expenses | ✅ | Create/edit form, ledger with search, category filter, status changes, edit, delete. | `vendorId` shown but can't be set. No receipt attachment. Categories hardcoded. |
| Purchase Orders | 🔶 | "Vendor Orders" tab re-lists budget items with fake "PO Active" badge. | No PO type, PO number, vendor link, approval or create. |
| Invoices | ❌ | — | — |
| Insurance | ❌ | — | — |
| Reports | 🔶 | "Cost Report" button exports JSON. | No on-screen report, PDF or CSV. |

**Extras not in spec:** Payroll & Talent tab (cast fees, crew rates, payroll entries — view-only). Forecast/variance KPIs. JSON cost-report export.

---

## Module 6 — Equipment

| Submodule | Status | What exists | What's missing |
|---|:-:|---|---|
| Equipment | ✅ | Full CRUD: add/edit/delete, status changes, grid/table views, category filters, inventory vs. requirements modes, vendor side drawer, image upload, pagination. 1,665 lines. | No rental cost/dates, no check-in/out history, vendor can't be set in form. New items always start "reserved". Not linked to shoot day equipment lists. |

---

## Module 7 — Post

| Submodule | Status | What exists | What's missing |
|---|:-:|---|---|
| Media (CF cards, Hard disks) | ✅ | Camera cards CRUD, storage devices CRUD. | — |
| Media: Footage/takes | ✅ | Footage metadata CRUD (take, duration, format, resolution, fps). | `sceneId` is free text, not linked to scenes collection. |
| Media: Backup policy | 🔶 | Backup policy tab with settings and mock sweep. | Settings in local useState, not persisted. Checksum sweep is a setTimeout mock. |
| Edit (Linked to Script timeline) | ❌ | Only generic post tasks with dept "Editing". | No edit/reel/cut model. No link to script, scenes or timeline. |
| VFX & CGI (Scenes and Shots) | ✅ | VfxShot CRUD with status/priority quick updates. | `sequence` is free text (no scene link). `vendorId` free text (default "DNEG India"). No cost/bid fields. |
| Posters and Publicity | ❌ | "Poster" only means project image. | — |
| Internet and Digital Marketing | ❌ | `MarketingItem` type exists but seed is empty and no UI. | — |
| OST Receivables | ❌ | Only as deliverable/rights-deal names. | No audio-rights income model. |
| Dubbing | 🔶 | Post task with dept "Dubbing". | No language/artist/session model. |
| BGM | 🔶 | Post task with dept "Music & Score". | No cue sheet or track model. |
| Subtitles | ✅ | Full CRUD: add/edit/delete, quick status update, per-language progress. | QC tab and delivery formats are hardcoded static checklists. |
| Trailers & Teasers | ❌ | Only as task/deliverable names in seed. | — |

**Extras not in spec:** Deliverables register. Post task tracker with departments (DI, Sound Design, DIT, QC). Series Episodes tab. Post Crew tab. Media backup policy screen.

---

## Module 8 — Business

| Submodule | Status | What exists | What's missing |
|---|:-:|---|---|
| Finance (Investor, Loan, Interest) | ❌ | — | No investor, loan or interest type. |
| In-film Branding | ❌ | — | — |
| Burn and Tranches | 🔶 | Burn exists as spent-vs-budget % bar in finance. | No tranches. No monthly burn data. Orphan `budget-overview.tsx` has chart data but is unreachable. |
| Release | ❌ | Only `Project.releaseDate` (editable). | No release planning (screens, dates per territory). |
| Distribution (Rights, Territories, Digital, Satellite, Audio) | ✅ | Full CRUD: create/edit/delete deals, 6 KPIs, filter by type/status. `rightsType` includes theatrical, satellite, digital, audio, dubbed, remake, broadcast, ancillary. | Territory is free text. No type-specific fields (platform window, term, language). |
| Receivables | 🔶 | MG minus advance shown as "Balance Due". Finance "Receivables" KPI. | No receivable schedule, due dates, instalments or collection tracking. |

**Extras not in spec:** `rightsType` values remake/broadcast/ancillary/dubbed. Deal delivery status tracking.

---

## Module 9 — Reports

| Submodule | Status | What exists | What's missing |
|---|:-:|---|---|
| Overview (Dept-wise spend pie / Gantt) | ❌ | 4 metric tiles. Hardcoded "12" deadlines. CSS progress bars. | No pie chart. Gantt is in Schedule only. |
| Production | ❌ | 6 report buttons with no onClick. | — |
| Scheduling | ❌ | — | — |
| Budget and Finance | ❌ | Static button. Only real output: finance JSON export. | — |
| Cast and Crew | ❌ | Static button. | — |
| Equipment | ❌ | — | — |
| Locations | ❌ | — | — |
| Custom reports | ❌ | Filters (date, dept, status) are uncontrolled and do nothing. Export button has no handler. | — |

**Note:** Recharts is installed (`^2.12.7`) and a shadcn chart wrapper exists (`components/ui/chart.tsx`), but the only usage is in `producer-command-center.tsx` which is an orphan (no route renders it).

---

## Module 10 — Teams

| Submodule | Status | What exists | What's missing |
|---|:-:|---|---|
| Department wise listing | 🔶 | Crew list with department filter and sort. 16 departments. Add/edit crew dialogs. | No grouped view with department headings. No "Teams" nav item. No crew delete. Cast is separate. |

---

## Module 11 — Settings

| Submodule | Status | What exists | What's missing |
|---|:-:|---|---|
| Create Logins (UI) | 🔶 | Producer can add accounts with name/email, remove accounts, toggle project assignments. | Every new account forced to "Production Manager" with password "demo". No role picker, password field, or edit. |
| User role | ❌ | — | No basic User role. |
| Business Owner (all projects) | ❌ | Only the single seeded Producer (super-admin). | Can't be created from UI. |
| Administrator (all projects) | ❌ | — | — |
| Executive Producer (some projects) | 🔶 | Production Manager role has per-project assignment (labelled "EP 1/EP 2"). | Named "Production Manager", not EP. View-only permissions not enforced on edits. |

**Extras not in spec:** Data management (record counts, JSON export/import, reset to seed). Workspace preferences UI (production house, currency, switches — not persisted).
