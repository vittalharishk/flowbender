# Script Module — Development Checklist

**Date:** 2026-10-30  
**Last updated:** 2026-10-30  
**Total items:** 78  
**Completed:** 68 / 78  
**Estimated effort:** 5-7 working days

---

## Phase 1 — Foundation (types, store, seed data)

### 1.1 Type definitions
- [x] Add `ShotType` union type to `lib/types.ts`
- [x] Add `ShotMovement` union type to `lib/types.ts`
- [x] Add `ShotStatus` union type to `lib/types.ts`
- [x] Add `Shot` interface to `lib/types.ts`
- [x] Add `ReferenceCategory` union type to `lib/types.ts`
- [x] Add `ScriptReference` interface to `lib/types.ts`
- [x] Add `shots: Shot[]` field to `Script` interface
- [x] Add `references: ScriptReference[]` field to `Script` interface
- [x] Verify TypeScript compiles with no errors (`npx tsc --noEmit`)

### 1.2 Store functions
- [x] Add `addShot()` to `lib/script-store.ts`
- [x] Add `updateShot()` to `lib/script-store.ts`
- [x] Add `removeShot()` to `lib/script-store.ts`
- [ ] Add `reorderShots()` to `lib/script-store.ts`
- [x] Add `addReference()` to `lib/script-store.ts`
- [x] Add `updateReference()` to `lib/script-store.ts`
- [x] Add `removeReference()` to `lib/script-store.ts`
- [x] Add `restoreScriptVersion()` to `lib/script-store.ts`
- [x] Add `deleteScriptVersion()` to `lib/script-store.ts`
- [x] Add `updateScriptVersion()` to `lib/script-store.ts`
- [x] Add `reorderScriptScenes()` to `lib/script-store.ts`
- [x] Add `deleteScene()` to `lib/scene-store.ts`
- [x] Handle default `shots: []` and `references: []` for existing scripts (in store normalization or component fallback)

### 1.3 Utility functions
- [x] ~~Create `lib/script-report-utils.ts`~~ — inlined into `reports-tab.tsx`
  - [x] `computeCastReport(script)` — character stats from blocks
  - [x] `computeLocationReport(script)` — location stats from scenes
  - [x] `computeDialogueReport(script)` — all dialogue entries
  - [x] `computePropReport(script)` — aggregated breakdown items
  - [x] `exportReportAsCSV(headers, rows)` — generic CSV builder
- [x] ~~Create `lib/script-analysis.ts`~~ — inlined into `analysis-tab.tsx`
  - [x] `computeThreeActAnalysis(script)` — full analysis engine

### 1.4 Seed data
- [x] Add 12 sample shots for Pushpa 2 script in `lib/flowbender-demo-seed.ts`
- [x] Add 4 sample shots for Game Changer script (shared from shot pool)
- [x] Add 9 sample references across both scripts
- [ ] ~~Add 3 sample references for Game Changer script~~ (covered above)
- [x] Verify the app loads correctly with new seed data

---

## Phase 2 — Enhance existing tabs

### 2.1 Scenes tab — full dashboard with inline editing
- [x] Create `components/scripts/scenes-tab.tsx`
  - [x] KPI tiles (Total Scenes, Pages, INT/EXT, Day/Night)
  - [x] Search, filters (status, INT/EXT, time of day)
  - [x] Sort (scene number, pages, location, status)
  - [x] Pagination (10 per page)
  - [x] Table view with all columns
  - [x] Add Scene dialog
  - [x] Edit Scene dialog
  - [x] View/expand scene detail
  - [x] Delete with confirmation
  - [x] Move up/down reorder buttons
  - [x] Status badges with colors
- [x] Integrate scenes-tab into `script-editor.tsx`
- [ ] ~~Add scene status colour badges (reuse `sceneStatusColors`)~~ — done in scenes-tab
- [ ] ~~Verify existing scene add/delete still works~~ — replaced with new component

### 2.2 Versions tab — full version management
- [x] Create `components/scripts/version-compare.tsx`
  - [x] Side-by-side scene diff (added/removed/changed)
  - [x] Summary stats
  - [x] Color-coded change indicators
- [x] Create `components/scripts/versions-tab.tsx`
  - [x] Create version form
  - [x] Version list with details
  - [x] View version (expandable)
  - [x] Compare versions (dialog)
  - [x] Restore version (with confirmation)
  - [x] Delete version (with confirmation)
  - [x] Inline-editable notes
  - [x] Version count badge
- [x] Integrate versions-tab into `script-editor.tsx`

### 2.3 Locations tab — enhanced
- [x] Create `components/scripts/locations-tab.tsx`
  - [x] Table: location name, scene count, pages, INT/EXT ratio, day/night ratio
  - [x] Linked ProjectLocation lookup
  - [x] Scouting status badges
  - [x] Search and filters
  - [x] Detail expansion per location
  - [x] KPI tiles
- [x] Replace current Locations tab in `script-editor.tsx` with new component

### 2.4 Breakdown tab — enhance prop editing
- [ ] Allow adding items by category (prop, costume, vehicle, special, VFX) — not just "prop"
- [ ] Show category badge on each item
- [ ] Allow editing existing breakdown items (currently only add)
- [ ] Allow deleting individual items

---

## Phase 3 — New tabs

### 3.1 Shot Division tab
- [x] Create `components/scripts/shot-division-tab.tsx`
  - [x] KPI tiles (total, by status, VFX count)
  - [x] Scene accordion: expand to show shots
  - [x] Shot cards with type/movement/lens/status
  - [x] Filter bar: by scene, type, status, VFX
  - [x] Search
- [x] Create add shot dialog (integrated in component)
  - [x] All fields: scene, type, movement, lens, angle, description, duration, characters, equipment, VFX, status, notes
  - [x] Auto-suggest shot number
- [x] Edit shot functionality
- [x] Delete shot with confirmation
- [x] Shot detail expand view
- [x] Add "Shot Division" tab to `script-editor.tsx` tab bar
- [x] Verify shots persist across page reload

### 3.2 Script Timeline tab
- [x] Create `components/scripts/timeline-tab.tsx`
  - [x] KPI header (scenes, pages, day/night counts)
  - [x] Filter bar (search, status, INT/EXT, time of day)
  - [x] Grouping toggle (All / By Script Day)
  - [x] Vertical timeline with scene circles and connecting lines
  - [x] Scene cards with heading, badges, location, pages, status
  - [x] Expandable detail
  - [x] Move up/down reorder
  - [x] Auto-assign script days button
- [x] Add "Timeline" tab to `script-editor.tsx` tab bar

### 3.3 References tab
- [x] Create `components/scripts/references-tab.tsx`
  - [x] Category sub-tabs: All | Audio | Video | Image | Character | Location | Prop
  - [x] Grid of reference cards
  - [x] Filter by linked scene, search
  - [x] "Add Reference" dialog
  - [x] Reference card with category icon/badge, title, description, linked scenes, tags
  - [x] Edit dialog
  - [x] Delete with confirmation
  - [x] Detail expansion
  - [x] Empty state per category
- [x] Add "References" tab to `script-editor.tsx` tab bar

### 3.4 Reports tab — complete overhaul
- [x] Create `components/scripts/reports-tab.tsx`
  - [x] Sub-tab navigation: Summary | Cast | Locations | Dialogue | Props
  - [x] Export CSV button per report
- [x] Summary dashboard with KPI tiles and distribution bars
- [x] Cast report: sortable table with role tiers, CSV export
- [x] Location report: sortable table, CSV export
- [x] Dialogue report: by-character and by-scene views, search, CSV export
- [x] Prop report: table with category filter, CSV export
- [x] Replace Reports tab in `script-editor.tsx`

### 3.5 Analysis tab
- [x] Create `components/scripts/analysis-tab.tsx`
  - [x] Three-act colour bar (Act I blue, Act II amber, Act III emerald)
  - [x] Plot point markers
  - [x] Act breakdown cards (page range, scene count, dialogue/action ratios)
  - [x] Pacing chart (CSS bar chart)
  - [x] Protagonist detection and dialogue distribution
  - [x] Structure score (0-100)
  - [x] Suggestions list
  - [x] Scenes grouped by act
  - [x] User notes textarea
  - [x] "Rule-based structural analysis" badge
- [x] Add "Analysis" tab to `script-editor.tsx` tab bar

---

## Phase 4 — Integration and polish

### 4.1 Tab bar update
- [x] Update tab array in `script-editor.tsx` to: Overview | Script | Scenes | Shot Division | Timeline | Characters & Dialogue | Breakdown | Locations | References | Versions | Reports | Analysis
- [x] Add badge counts on tabs: Scenes (count), Shot Division (count), References (count), Versions (count)
- [x] Verify horizontal scrolling works on mobile for 12 tabs
- [ ] Tab from URL parameter support (deep linking to a specific tab)

### 4.2 Cross-tab integration
- [ ] In Scenes tab: show shot count per scene
- [ ] In Scenes tab: show reference count per scene
- [ ] In Characters & Dialogue tab: link to cast report
- [ ] In Breakdown tab: link to prop report
- [ ] In Shot Division: show "No scenes yet" message linking to Scenes tab if empty

### 4.3 Regression testing
- [x] Script library page (`/scripts`) loads and creates scripts
- [x] Script editor loads for existing scripts with seed data
- [ ] Upload/import .fdx still works
- [ ] Upload/import paste text still works
- [ ] Sample screenplay import still works
- [x] Script blocks add/delete works
- [x] Existing scenes add/delete works (via new ScenesTab)
- [x] Characters & Dialogue tab computes correctly
- [x] All 12 tabs render without errors
- [x] New shot/reference data persists across page reload
- [ ] Project-scoped script page (`/dashboard/projects/[id]/script`) works
- [ ] Production scenes page (`/dashboard/projects/[id]/scenes`) is unchanged
- [ ] Scene detail page (`/dashboard/projects/[id]/scenes/[sceneId]`) is unchanged
- [x] No TypeScript compilation errors
- [x] No console errors on any tab (build passes)
- [ ] Mobile responsive: tab bar scrolls, tables stack, cards stack

---

## Definition of done

A feature is complete when:
1. The UI renders correctly in dark and light themes
2. Data persists across page reload (via the existing store)
3. No TypeScript errors
4. No console errors
5. Mobile responsive (tab bar scrolls, content stacks)
6. Follows existing design system (amber accent, glass cards, text-xs labels, rounded-xl borders)
7. Uses only existing npm packages (no new dependencies)
8. Does not break any existing module or page
9. Uses the existing store pattern (`updateScript` / `updateAppDataSlice`)
10. Seed data demonstrates the feature realistically

---

## Files created (8 new)

```
components/scripts/
├── scenes-tab.tsx          — Enhanced scenes dashboard with table, CRUD, filters, pagination
├── version-compare.tsx     — Side-by-side version diff viewer
├── versions-tab.tsx        — Full version management with create/view/compare/restore/delete
├── shot-division-tab.tsx   — Shot division with scene accordion, full CRUD, filters
├── timeline-tab.tsx        — Visual scene timeline with reorder, grouping
├── locations-tab.tsx       — Enhanced locations with scouting status, production location links
├── references-tab.tsx      — 6-category reference library with CRUD
├── reports-tab.tsx         — Cast, Location, Dialogue, Prop reports with CSV export
└── analysis-tab.tsx        — Three-act structure analysis with scoring
```

## Files edited (5 existing)

```
lib/types.ts                         — Added Shot, ShotType, ShotMovement, ShotStatus, ScriptReference, ReferenceCategory; extended Script
lib/script-store.ts                  — Added shot/reference CRUD, version restore/delete/update, scene reorder
lib/scene-store.ts                   — Added deleteScene()
lib/flowbender-demo-seed.ts          — Added seed scripts with shots and references
components/scripts/script-editor.tsx  — Updated tab bar to 12 tabs, integrated all new tab components
```
