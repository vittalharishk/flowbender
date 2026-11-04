# Script Module — Complete Development Plan

**Date:** 2026-10-30  
**Module:** 1 of 11 — Script  
**Principle:** Don't break existing UI. Enhance and extend what's already built.

---

## What already exists

The app has a working script system with ~3,700 lines of code:

| Component | Lines | What it does |
|---|:-:|---|
| `components/scripts/script-editor.tsx` | 940 | 8-tab editor: Overview, Script, Scenes, Characters & Dialogue, Breakdown, Locations, Versions, Reports |
| `components/scripts/script-upload-dialog.tsx` | 715 | Upload/paste .fdx/.txt, 3 sample screenplays, preview, import to scenes |
| `components/scenes/scene-list-view.tsx` | 239 | Production scene list with filters and status badges |
| `components/scenes/scene-detail.tsx` | 323 | Scene detail view (edit heading, status, breakdown display) |
| `components/scenes/add-scene-dialog.tsx` | 203 | Create scene dialog |
| `components/scenes/scene-strip.tsx` | 95 | Scene strip card for stripboard |
| `components/scenes/script-overview.tsx` | 134 | Script version colour chart (orphan — no route renders it) |
| `lib/script-store.ts` | 151 | CRUD for scripts, blocks, scenes, versions |
| `lib/script-parser.ts` | 491 | Screenplay parser (FDX, plain text, 3 samples) |
| `lib/scene-store.ts` | 413 | Scene CRUD, script version queries |
| `app/scripts/page.tsx` | 79 | Script library page |
| `app/scripts/[id]/page.tsx` | 9 | Script detail route |
| `app/dashboard/projects/[id]/script/page.tsx` | 29 | Project-scoped script page |

**Existing routes:**
- `/scripts` — Script library (list, create, search, filter)
- `/scripts/[id]` — Script editor (8 tabs)
- `/dashboard/projects/[id]/script` — Same editor, project-scoped
- `/dashboard/projects/[id]/scenes` — Production scene list
- `/dashboard/projects/[id]/scenes/[sceneId]` — Scene detail
- `/dashboard/script` — Redirects to `/scripts`

**Existing data:** 14 scripts, 33 scenes, 8 script versions, 10 characters, 12 locations in seed.

---

## What we're building

The plan preserves all existing UI and adds 7 features from the spec. The script editor's tab bar is the main navigation hub — we add new tabs and enhance existing ones.

### Architecture decision: tabs vs. pages

The current script editor uses **inline tabs** (Overview, Script, Scenes, etc.) inside a single page component. This is a good pattern for a script module because everything relates to one script. We'll keep this pattern and:

1. **Enhance existing tabs** (Scenes, Locations, Versions, Reports, Breakdown)
2. **Add new tabs** (Shot Division, Timeline, References, Analysis)
3. **Keep the tab bar scrollable** (it already is via `overflow-auto`)

The tab order will be:
```
Overview | Script | Scenes | Shot Division | Timeline | Characters & Dialogue |
Breakdown | Locations | References | Versions | Reports | Analysis
```

---

## Feature 1 — Scenes (Version Control) ✨ Enhance existing

**Current state:** Scenes tab can add/delete ScriptScenes. Versions tab can create snapshots but not open, restore, compare or delete them.

### What we'll build

#### 1a. Scene editing (enhance Scenes tab)
- **Inline edit** for each ScriptScene: heading, INT/EXT, location, time of day, pages, description, status
- **Delete confirmation** with scene number
- **Drag-and-drop reorder** (using the existing scene number field)
- **Scene status badges** with colour coding (reuse `sceneStatusColors` from scene-store)

#### 1b. Version management (enhance Versions tab)
- **Open version:** click a version to view its blocks and scenes in read-only mode (rendered in the same screenplay format as the Script tab)
- **Restore version:** button to replace current blocks/scenes with the version's snapshot (with confirmation)
- **Compare versions:** side-by-side diff view showing added/removed/changed blocks between any two versions (current vs. saved, or saved vs. saved)
- **Delete version:** with confirmation
- **Version notes:** editable notes field on each version
- **Auto-version on import:** when uploading a new screenplay, auto-save the current state as a version first

**Components:**
- `components/scripts/scene-inline-editor.tsx` — inline edit row for ScriptScene
- `components/scripts/version-viewer.tsx` — read-only screenplay view for a version
- `components/scripts/version-compare.tsx` — side-by-side diff view

**Store changes:**
- `script-store.ts`: add `restoreScriptVersion()`, `deleteScriptVersion()`, `updateScriptVersion()`, `reorderScriptScenes()`

---

## Feature 2 — Shot Division 🆕

**Current state:** `shot` exists as a ScriptBlockType but renders blank. No shot model.

### What we'll build

A new **Shot Division** tab in the script editor that breaks each scene into individual shots.

#### Data model
```typescript
interface Shot {
  id: string;
  sceneId: string;       // links to ScriptScene.id
  shotNumber: string;     // e.g. "1A", "1B", "2"
  type: ShotType;         // wide, medium, close-up, etc.
  movement: string;       // dolly, steadicam, handheld, static, crane, drone
  lens: string;           // e.g. "50mm", "anamorphic 35mm"
  angle: string;          // eye-level, low, high, dutch, bird's-eye, worm's-eye
  description: string;    // what happens in this shot
  duration: string;       // estimated duration e.g. "8s"
  characters: string[];   // who appears
  equipment: string[];    // special equipment notes
  vfx: boolean;           // VFX required
  vfxNotes: string;
  status: "planned" | "storyboarded" | "approved" | "shot" | "pickup";
  storyboardUrl?: string; // future: storyboard image
  notes: string;
}

type ShotType = "wide" | "medium" | "medium-close" | "close-up" | "extreme-close" |
  "over-shoulder" | "pov" | "insert" | "establishing" | "aerial" | "two-shot" | "group";
```

#### UI
- **Shot list by scene:** accordion of scenes, each expanding to show its shots
- **Add shot:** inline form with type, movement, lens, angle, description
- **Edit shot:** click to expand inline edit
- **Delete shot:** with confirmation
- **Shot count summary:** total shots, shots per scene, shots by type
- **Filter/group:** by scene, type, status, VFX required
- **Shot list export:** (future-ready, button with "coming soon" for now)

Shots are stored as a new collection on the `Script` object: `Script.shots: Shot[]`. This keeps them versioned with the script.

**Components:**
- `components/scripts/shot-division-tab.tsx` — main tab content
- `components/scripts/shot-card.tsx` — individual shot display/edit card
- `components/scripts/add-shot-dialog.tsx` — add shot form

**Store changes:**
- `script-store.ts`: add `addShot()`, `updateShot()`, `removeShot()`, `reorderShots()`
- `types.ts`: add `Shot`, `ShotType` interfaces

---

## Feature 3 — Script Reports 📊 Enhance existing

**Current state:** Reports tab shows 4 stat tiles (page eighths, characters, dialogue count, last updated). Characters & Dialogue tab computes character stats but can't export.

### What we'll build

Replace the Reports tab with a full **sub-tabbed report panel**:

#### 3a. Cast Report
- Table of all speaking characters with:
  - Name, total speeches, total words, dialogue %, scene appearances
  - Role tier (calculated: Lead / Major Supporting / Supporting / Minor)
  - Linked `CastMember` if one exists (by character name match)
- **Sort** by any column
- **Export as CSV** button

#### 3b. Location Report
- Table of all unique locations with:
  - Location name, INT/EXT breakdown, day/night breakdown
  - Scene count, total pages at that location
  - Linked `ProjectLocation` if one exists (by name match)
- **Map to production locations** button (links to locations workspace)

#### 3c. Dialogue Report
- Per-character expandable dialogue list
- Scene-by-scene dialogue breakdown
- Word count per scene per character
- Longest/shortest speeches
- **Search** within all dialogue

#### 3d. Prop Report
- Aggregated props across all scenes from `ScriptScene.breakdown` and `Scene.props`
- Table: prop name, category, scenes where it appears, notes
- Grouped by category (prop, costume, vehicle, special, VFX)
- Total counts per category

#### 3e. Summary Dashboard
- KPI tiles: total pages, scenes, characters, dialogues, locations, shots, props
- Scene status pie (using CSS, not recharts — matching existing patterns)
- INT/EXT ratio bar
- Day/Night ratio bar

All reports are **computed live** from `script.blocks`, `script.scenes` and `script.shots`. No separate data storage needed.

**Components:**
- `components/scripts/reports/script-reports-tab.tsx` — sub-tab container
- `components/scripts/reports/cast-report.tsx`
- `components/scripts/reports/location-report.tsx`
- `components/scripts/reports/dialogue-report.tsx`
- `components/scripts/reports/prop-report.tsx`
- `components/scripts/reports/summary-dashboard.tsx`
- `lib/script-report-utils.ts` — shared computation functions, CSV export

---

## Feature 4 — Script Timeline 🆕

**Current state:** `ScriptScene.scriptDay` exists but nothing displays it.

### What we'll build

A new **Timeline** tab showing the story's internal chronology.

#### UI
- **Horizontal timeline** with script days as columns
- Each scene is a card placed under its script day
- Scenes without a `scriptDay` are shown in an "Unassigned" lane
- **Drag scenes** between days to assign/reassign `scriptDay`
- **Day detail panel:** click a day to see all scenes, total pages, characters involved
- **Auto-assign:** button that assigns script days sequentially based on scene order
- **Day/Night indicator** per scene (from `timeOfDay`)
- **Elapsed time bar** showing story progression

This is a **read/edit view** — changes update `ScriptScene.scriptDay` in the store.

**Components:**
- `components/scripts/timeline-tab.tsx` — main timeline view
- `components/scripts/timeline-day-column.tsx` — a single day column
- `components/scripts/timeline-scene-card.tsx` — a scene card on the timeline

**Store changes:**
- `script-store.ts`: `updateScriptScene()` already exists and can set `scriptDay`

---

## Feature 5 — Locations and Scouting ✨ Enhance existing

**Current state:** The Locations tab in the script editor only shows location name chips. The locations workspace (`components/locations/locations-management-workspace.tsx`) has full CRUD but is separate from the script context.

### What we'll build

Enhance the script editor's **Locations** tab to be a full location management view scoped to the script:

#### 5a. Script locations panel
- Table of all unique locations extracted from `script.scenes`
- For each location: scene count, pages, INT/EXT, day/night, first/last appearance
- **Link to production location:** dropdown to match with existing `ProjectLocation` records
- **Create production location:** button to create a new `ProjectLocation` from the script location data

#### 5b. Scouting status
- Show each location's production status (scouting / permit-pending / locked) from the linked `ProjectLocation`
- Inline status badge and permit info from the location permit dialog
- **Quick link** to open the full locations workspace for that location

#### 5c. Location gallery (from linked ProductionLocation)
- Show `coverImage` if the location is linked to a `ProjectLocation`
- Display address, city, notes from the production record

This tab becomes a **bridge** between the script's text-based locations and the production's real location records.

**Components:**
- `components/scripts/locations-tab.tsx` — enhanced locations tab (replaces the current chips-only view)

**Store changes:** None — uses existing `updateAppDataSlice("locations")` and `ProjectLocation` type.

---

## Feature 6 — References 🆕

**Current state:** No reference system exists.

### What we'll build

A new **References** tab in the script editor for attaching reference materials to the script.

#### Data model
```typescript
interface ScriptReference {
  id: string;
  category: "audio" | "video" | "image" | "character" | "location" | "prop";
  title: string;
  description: string;
  url: string;           // URL, data URL for uploaded images, or placeholder
  thumbnail?: string;    // auto-generated or user-set
  linkedSceneIds: string[];  // which scenes this reference applies to
  linkedCharacters: string[]; // which characters
  tags: string[];
  createdAt: string;
  notes: string;
}
```

References are stored as `Script.references: ScriptReference[]`.

#### UI
- **Category tabs:** Audio | Video | Image | Character | Location | Prop
- **Add reference:** form with title, description, URL/file upload, category, linked scenes/characters
- **Reference grid:** cards with thumbnail (or icon for audio/video), title, description, linked scenes
- **Edit/delete** each reference
- **Scene linkage:** when viewing a scene, show its linked references
- **Filter** by category, linked scene, tags
- **Bulk operations:** select multiple, assign to scene, delete

For the frontend-only phase:
- **Images:** stored as data URLs (small previews) or external URLs
- **Audio/Video:** stored as external URLs (YouTube, Vimeo, SoundCloud links) with an embed preview
- **No file storage backend** — ready for future S3/R2 integration

**Components:**
- `components/scripts/references-tab.tsx` — main references tab
- `components/scripts/reference-card.tsx` — reference display card
- `components/scripts/add-reference-dialog.tsx` — add/edit reference form

**Store changes:**
- `types.ts`: add `ScriptReference` interface
- `script-store.ts`: add `addReference()`, `updateReference()`, `removeReference()`

---

## Feature 7 — Analysis (Three Act Structure) 🆕

**Current state:** Nothing exists. No real AI integration allowed.

### What we'll build

A new **Analysis** tab that provides a **rule-based** three-act structure analysis. No external AI API — all computation is local.

#### How it works (rule-based engine)

The analysis uses established screenplay structure conventions:

1. **Three Acts by page count:**
   - Act I (Setup): pages 1–25% of total
   - Act II (Confrontation): pages 25%–75%
   - Act III (Resolution): pages 75%–100%

2. **Key plot points detected by position:**
   - Inciting Incident: ~10-12% mark
   - First Plot Point / Act I Turning Point: ~25% mark
   - Midpoint: ~50% mark
   - Second Plot Point / Act II Turning Point: ~75% mark
   - Climax: ~85-90% mark

3. **Character arc analysis:**
   - Protagonist = character with most dialogue
   - Character introduction scenes
   - Dialogue frequency distribution across acts

4. **Pacing analysis:**
   - Action-to-dialogue ratio per act
   - Scene length distribution
   - Average scene length trend

5. **Structure scoring:**
   - Rates how closely the script follows classical structure (0-100)
   - Flags scenes that are unusually long or short
   - Identifies dialogue-heavy vs. action-heavy sections

#### UI
- **Three-act visual bar** — colour-coded bar showing Act I (blue), Act II (amber), Act III (emerald) with plot point markers
- **Act breakdown cards** — for each act: page range, scene count, character introductions, key events (longest scene, most dialogue)
- **Pacing chart** — scene length bar chart across the script (CSS bars, not recharts)
- **Character arc panel** — protagonist dialogue frequency across acts
- **Structure score** — overall score with improvement suggestions
- **"AI Analysis" badge** — says "Rule-based structural analysis" with a note that AI-powered analysis is coming in a future release

All of this is computed from `script.blocks` and `script.scenes` data.

**Components:**
- `components/scripts/analysis-tab.tsx` — main analysis view
- `lib/script-analysis.ts` — analysis engine (pure functions, no side effects)

---

## Navigation changes

### Script editor tab bar
Current: `Overview | Script | Scenes | Characters & Dialogue | Breakdown | Locations | Versions | Reports`

New: `Overview | Script | Scenes | Shot Division | Timeline | Characters & Dialogue | Breakdown | Locations | References | Versions | Reports | Analysis`

### Sidebar navigation
No changes — the existing "Scripts" item under Production already links to `/scripts`.

### Project-level routes
No new routes needed — everything lives inside the script editor tabs. The existing routes remain:
- `/scripts` — library
- `/scripts/[id]` — editor with all tabs
- `/dashboard/projects/[id]/script` — project-scoped editor
- `/dashboard/projects/[id]/scenes` — production scenes (unchanged)

---

## Reusable components

These new components will be designed for reuse across other modules:

| Component | Reusable for |
|---|---|
| `components/scripts/reports/cast-report.tsx` | Global Reports module (Module 9) |
| `components/scripts/reports/location-report.tsx` | Global Reports module |
| `components/scripts/reference-card.tsx` | Any module that needs file/link references |
| `components/scripts/timeline-tab.tsx` | Pattern for Schedule timeline |
| `lib/script-analysis.ts` | Analysis patterns for other modules |
| `lib/script-report-utils.ts` | CSV export utility for any module |
| Inline edit pattern (scene-inline-editor) | Any list that needs inline editing |

---

## Data flow diagram

```
Script (lib/types.ts)
├── blocks: ScriptBlock[]          ← Script tab (add/delete/view)
├── scenes: ScriptScene[]          ← Scenes tab (CRUD, inline edit)
│   ├── breakdown: SceneBreakdownItem[]  ← Breakdown tab (edit props/costumes/vehicles)
│   └── scriptDay: string          ← Timeline tab (assign days)
├── shots: Shot[] [NEW]            ← Shot Division tab (CRUD)
├── references: ScriptReference[] [NEW]  ← References tab (CRUD)
├── versions: ScriptDraftVersion[] ← Versions tab (create/open/restore/compare/delete)
└── (computed from blocks+scenes)  ← Reports tab (cast/location/dialogue/prop reports)
                                   ← Analysis tab (three-act structure)
                                   ← Locations tab (bridge to ProjectLocation)
                                   ← Characters & Dialogue tab (character stats)
```

---

## What we will NOT change

- ❌ No changes to the app shell (sidebar, header, layout)
- ❌ No changes to other modules (schedule, equipment, cast, crew, finance, etc.)
- ❌ No changes to the login/auth system
- ❌ No changes to the data persistence layer (we use the existing store as-is)
- ❌ No removal of existing functionality — only enhance and extend
- ❌ No new npm packages — use only what's already installed
- ❌ No backend API calls
- ❌ No real AI API integration

---

## Implementation order

| Step | Feature | Est. effort | Dependencies |
|---|---|---|---|
| 1 | Type definitions (Shot, ScriptReference, ShotType) | Small | None |
| 2 | Store functions (shot CRUD, reference CRUD, version restore/delete) | Small | Step 1 |
| 3 | Seed data (shots and references for 2-3 scripts) | Small | Step 1 |
| 4 | Scenes tab enhancement (inline edit, delete, reorder) | Medium | Step 2 |
| 5 | Versions tab enhancement (open, restore, compare, delete) | Medium | Step 2 |
| 6 | Shot Division tab | Medium | Step 2 |
| 7 | Script Timeline tab | Medium | Step 2 |
| 8 | Locations tab enhancement | Medium | None |
| 9 | References tab | Medium | Step 2, Step 3 |
| 10 | Reports tab (all 5 sub-reports + CSV export) | Large | None (computed) |
| 11 | Analysis tab (rule-based engine + UI) | Medium | None (computed) |
| 12 | Update script editor tab bar | Small | Steps 4-11 |
| 13 | Test all tabs, verify no regressions | Small | All |
