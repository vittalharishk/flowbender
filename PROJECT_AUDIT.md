# Flowbender — Project Audit

**Date:** 2026-10-30  
**Auditor:** Claude (automated code audit)  
**Scope:** Compare Flowbender.docx spec (11 modules) against the existing React application  
**Decision:** Frontend-only · React + Tailwind · Static JSON · No database · No FastAPI · No backend APIs

---

## Executive Summary

The app is a **Next.js 13.5 (App Router)** project with **47 shadcn/ui components**, **~35,000 lines** of application code (excluding UI primitives), and a rich demo dataset of 7 real Telugu/Hindi film projects (Pushpa 2, Game Changer, Spirit, Devara, Salaar 2, Aha OTT series, etc.) with ~700 total records.

**Application Shell: COMPLETE.** The sidebar, top header, command palette (⌘K), project selector, notifications dropdown, user profile menu, dark/light theme toggle, mobile responsive sidebar, and breadcrumb-style workspace titles are all fully built and working.

### Coverage at a glance

| # | Module | Spec submodules | Done | Partial | View-only | Missing |
|---|--------|:-:|:-:|:-:|:-:|:-:|
| 1 | Script | 11 | 0 | 5 | 3 | 3 |
| 2 | Cast | 5 | 1 | 3 | 0 | 1 |
| 3 | Master Schedule | 6 | 2 | 2 | 0 | 2 |
| 4 | Production Crew Depts | 27+ | 0 | 12 | 1 | 14+ |
| 5 | Budgets & Accounts | 7 | 1 | 2 | 1 | 3 |
| 6 | Equipment | 1 | 1 | 0 | 0 | 0 |
| 7 | Post | 11 | 4 | 3 | 0 | 4 |
| 8 | Business | 6 | 1 | 2 | 0 | 3 |
| 9 | Reports | 8 | 0 | 0 | 0 | 8 |
| 10 | Teams | 1 | 0 | 1 | 0 | 0 |
| 11 | Settings | 5 | 0 | 2 | 0 | 3 |
| | **Totals** | **~88** | **10** | **32** | **5** | **41** |

**Bottom line:** ~11% of spec submodules are fully done, ~36% partial, ~6% view-only, ~47% missing. The application shell, data architecture and several workspaces are solid. The biggest gaps are Reports (entirely placeholder), Production Crew Depts (needs per-department entities), and Business (investors, branding, release planning).

---

## Architecture

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 13.5.1 (App Router) | `next.config.js`: separate dev/prod build dirs, unoptimised images, ESLint + TS errors ignored |
| UI library | shadcn/ui (47 components) | Radix UI primitives, Tailwind CSS, `class-variance-authority` |
| Styling | Tailwind CSS 3, HSL CSS variables | Dark theme default, light theme supported, `tailwindcss-animate` |
| Icons | Lucide React ^0.446.0 | Used throughout |
| Charts | Recharts ^2.12.7 | Installed but only used in an orphan component (`producer-command-center.tsx`) |
| Forms | React Hook Form + Zod | Used in some dialogs |
| State | `useSyncExternalStore` + custom store | `lib/app-data-store.ts`: 31 collections, seed registry, import/export |
| Data persistence | `data/flowbender-demo-data.json` via `/api/demo-data` | Server route reads/writes JSON with `fs` — **conflicts with frontend-only decision** |
| Auth | Local demo auth (2 roles) | `lib/auth-client.ts`: Producer + Production Manager. API mode available but off by default |
| Font | Inter (Google Fonts, next/font) | |
| Routing | ~55 routes under `/app` | Dashboard layout with sidebar + header shell |

### Backend dependencies that conflict with the frontend-only decision

1. **`/api/demo-data` (GET/PUT):** every data change is saved to a JSON file on the server via `fs/promises`. This needs a running Node server.
2. **`/api/webhook/deploy`:** a deploy webhook using `child_process.spawn`. Has a hardcoded fallback secret in source code (security risk).
3. **`lib/auth-client.ts`:** can call `NEXT_PUBLIC_API_URL` for `/api/v1/auth/*`, but only when `NEXT_PUBLIC_AUTH_MODE=api` (off by default).
4. **localStorage-only data:** DPR reports, continuity binder, clapperboard take logs and demo accounts are saved to localStorage but not the main data store.

### Recommendation
Move persistence to localStorage or IndexedDB for the frontend-only phase. Keep the JSON file as the initial seed only (loaded once, never written). This removes the server dependency and makes the app deployable as a static site. The `/api/demo-data` route and deploy webhook can be removed.

---

## Data Model (31 collections)

All collections are defined in `lib/app-data-store.ts` and typed in `lib/types.ts`. Seed data is in `lib/flowbender-demo-seed.ts` (87 KB) and `lib/demo-data.ts` (100 KB).

| Collection | Type | Records | Used by |
|---|---|:-:|---|
| projects | Project | 7 | Dashboard, project pages |
| scripts | Script | 14 | Script library, editor |
| scenes | Scene | 33 | Scene list, stripboard, schedule |
| scriptVersions | ScriptVersion | 8 | Script overview (orphan component) |
| castMembers | CastMember | 23 | Cast list, profile, call sheets |
| crewMembers | CrewMember | 36 | Crew list, profile, call sheets |
| characters | CharacterProfile | 10 | **Unused** (no UI reads it) |
| locations | ProjectLocation | 12 | Locations workspace, call sheets |
| scheduleEntries | ScheduleEntry | 96 | Schedule calendar, cast profile |
| shootDays | ShootDay | 96 | Schedule, stripboard, Gantt, DPR |
| callSheets | CallSheet | 95 | Call sheet workspace |
| seriesSeasons | SeriesSeason | 4 | Post-production workspace |
| seriesEpisodes | SeriesEpisode | 8 | Post-production workspace |
| dprReports | DprReport | 3 | **Unused** (DPRs use localStorage) |
| productionTasks | ProductionTask | 90 | **Only in orphan** producer-command-center |
| equipmentInventory | EquipmentItem | 40 | Equipment workspace |
| vendors | VendorRecord | 5 | Equipment side drawer |
| budgetLineItems | BudgetLineItem | 43 | Finance (view-only) |
| expenseItems | ExpenseItem | 27 | Finance (CRUD) |
| payrollEntries | PayrollEntry | 20 | Finance (view-only) |
| postProductionItems | PostProductionItem | 29 | Post-production workspace |
| vfxShots | VfxShot | 5 | VFX workspace |
| deliverables | DeliverableItem | 22 | Post-production, distribution |
| rightsDeals | RightsDeal | 35 | Distribution workspace |
| marketingItems | MarketingItem | 0 | **Unused** (type exists, seed empty) |
| notifications | Notification | 0 | Notifications dropdown |
| attendanceRecords | AttendanceRecord | 6 | Attendance workspace |
| cameraCards | CameraCard | 5 | Media workspace |
| storageDevices | StorageDevice | 5 | Media workspace |
| footageMetadata | FootageMetadata | 4 | Media workspace |
| subtitleLanguages | SubtitleLanguage | 7 | Subtitle workspace |

### Data integrity issues
- **Department strings disagree** across collections: `CrewMember.department` is an enum (lowercase), while `PayrollEntry`, `ProductionTask`, `AttendanceRecord` use free-text capitalised strings.
- **Scene–Script disconnect:** `Script.scenes` (ScriptScene) and `scenes` collection (Scene) are separate. Importing a script overwrites all Scene records for that project, losing manual edits.
- **Free-text foreign keys:** `VfxShot.vendorId`, `EquipmentItem.vendorId`, `ExpenseItem.vendorId` are free text, not validated against `vendors`.
- **Unused collections:** `characters`, `dprReports`, `productionTasks`, `marketingItems` have types and seed data but no working UI.

---

## Extra features not in the spec

These exist in the app but are not mentioned in the Flowbender.docx spec:

1. **Script library** — create, search, filter, duplicate, archive, delete scripts
2. **Block-based screenplay editor** — add blocks (scene heading, action, dialogue, parenthetical, transition, shot, note, general)
3. **Script upload and parse** — `.fdx` (Final Draft XML), paste, and 3 built-in sample screenplays. `.pdf`/`.doc` import is broken (reads binary as text)
4. **Digital clapperboard** — full-screen slate with take logging (localStorage)
5. **Continuity binder** — before/after image tracking per scene (localStorage)
6. **Scene stripboard** — drag-and-drop reorder, move scene to next day, conflict checks
7. **Gantt chart** — custom implementation (no chart library), shows shoot days by location
8. **Call sheet versioning** — revisions with changelog, print-to-PDF preview
9. **DPR form** — daily production report (saved to localStorage, not the store)
10. **Media management** — camera cards, storage devices, footage metadata, backup policy
11. **Settings data management** — record counts, JSON export/import, reset to seed
12. **Producer command center** — scenario modelling, compare films (orphan: no route renders it)
13. **Series/episodes model** — SeriesSeason + SeriesEpisode types with post-production integration
14. **Deliverables register** — master deliverables with format, territory and status
15. **Image upload and crop** — `components/images/` with compression and validation

---

## Files of note

| File | Lines | Purpose |
|---|:-:|---|
| `lib/types.ts` | 806 | All TypeScript interfaces and type unions |
| `lib/app-data-store.ts` | 753 | Central state management, persistence, import/export |
| `lib/flowbender-demo-seed.ts` | 1,448 | Seed data factory |
| `lib/demo-data.ts` | 2,210 | Demo data constants (projects, budgets, timeline, etc.) |
| `lib/navigation.ts` | 110 | Sidebar navigation structure (5 groups, 16 items) |
| `components/scripts/script-editor.tsx` | 940 | Tabbed script editor (8 tabs) |
| `components/equipment/equipment-workspace.tsx` | 1,665 | Full equipment CRUD workspace |
| `components/media/media-management-workspace.tsx` | 1,681 | Media management (cards, storage, footage, backup) |
| `components/production/digital-clapperboard-modal.tsx` | 1,134 | Digital cinema clapperboard |
| `data/flowbender-demo-data.json` | ~700 KB | Runtime demo data (includes one base64 image) |
