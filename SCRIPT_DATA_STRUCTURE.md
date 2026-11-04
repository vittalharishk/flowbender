# Script Module — Data Structure

**Date:** 2026-10-30

---

## Existing types (no changes needed)

These types already exist in `lib/types.ts` and are used by the current script system:

```typescript
// Script block types (screenplay elements)
type ScriptBlockType = "scene_heading" | "action" | "character" | "parenthetical"
  | "dialogue" | "transition" | "shot" | "note";

// Scene heading attributes
type IntExt = "INT" | "EXT" | "INT/EXT";
type TimeOfDay = "DAY" | "NIGHT" | "DAWN" | "DUSK" | "CONTINUOUS" | "MAGIC HOUR";

// Scene breakdown items (props, costumes, vehicles, etc.)
interface SceneBreakdownItem {
  id: string;
  category: "prop" | "costume" | "vehicle" | "special" | "vfx";
  name: string;
  notes?: string;
}

// A block in the screenplay
interface ScriptBlock {
  id: string;
  type: ScriptBlockType;
  text: string;
  sceneId?: string;
}

// A scene within the script (not production Scene)
interface ScriptScene {
  id: string;
  number: string;
  heading: string;
  intExt: IntExt;
  location: string;
  timeOfDay: TimeOfDay;
  scriptDay: string;        // ← used by Timeline tab
  pages: number;
  eighths: number;
  description: string;
  breakdown: SceneBreakdownItem[];
  status: SceneStatus;
  blockIds: string[];
}

// A saved version snapshot
interface ScriptDraftVersion {
  id: string;
  number: number;
  name: string;
  revisionDate: string;
  createdBy: string;
  notes: string;
  status: ScriptStatus;
  blocks: ScriptBlock[];
  scenes: ScriptScene[];
  archived?: boolean;
}

// Script status progression
type ScriptStatus = "Concept" | "First Draft" | "Second Draft" | "Revised Draft"
  | "Production Draft" | "Shooting Draft" | "Locked" | "Archived";

// Script type
type ScriptType = "Feature Film" | "OTT Series" | "OTT Episode" | "TV Series"
  | "TV Episode" | "Short Film" | "Music Video" | "Other";

// Scene production status
type SceneStatus = "not-scheduled" | "scheduled" | "shot" | "partially-shot" | "reshoot-required";
```

---

## New types to add

### Shot Division

```typescript
/**
 * Camera shot types used in Indian film production
 */
type ShotType =
  | "wide"              // WS — full environment
  | "medium"            // MS — waist up
  | "medium-close"      // MCU — chest up
  | "close-up"          // CU — face
  | "extreme-close"     // ECU — eyes, detail
  | "over-shoulder"     // OTS — conversation
  | "pov"               // POV — character's view
  | "insert"            // INSERT — detail/object
  | "establishing"      // EST — location opener
  | "aerial"            // AERIAL — drone/crane
  | "two-shot"          // 2S — two characters
  | "group";            // GROUP — multiple characters

/**
 * Camera movement types
 */
type ShotMovement =
  | "static"
  | "pan"
  | "tilt"
  | "dolly"
  | "track"
  | "steadicam"
  | "handheld"
  | "crane"
  | "drone"
  | "zoom"
  | "whip-pan"
  | "arc";

/**
 * Shot status in production pipeline
 */
type ShotStatus = "planned" | "storyboarded" | "approved" | "shot" | "pickup";

/**
 * An individual camera shot within a scene.
 * Shots live on Script.shots[] and reference ScriptScene by sceneId.
 */
interface Shot {
  id: string;
  sceneId: string;           // → ScriptScene.id
  shotNumber: string;        // e.g. "1A", "2", "3B"
  type: ShotType;
  movement: ShotMovement;
  lens: string;              // e.g. "50mm", "anamorphic 35mm"
  angle: string;             // eye-level, low, high, dutch, bird's-eye, worm's-eye
  description: string;       // what happens in this shot
  duration: string;          // estimated e.g. "8s", "12s"
  characters: string[];      // character names that appear
  equipment: string[];       // special equipment notes (e.g. "jib arm", "underwater housing")
  vfx: boolean;
  vfxNotes: string;
  status: ShotStatus;
  storyboardUrl?: string;    // future: storyboard image (data URL or external)
  notes: string;
}
```

### References

```typescript
/**
 * Reference material category
 */
type ReferenceCategory = "audio" | "video" | "image" | "character" | "location" | "prop";

/**
 * A reference attachment on a script.
 * References live on Script.references[] and can link to scenes and characters.
 */
interface ScriptReference {
  id: string;
  category: ReferenceCategory;
  title: string;
  description: string;
  url: string;               // external URL, YouTube/Vimeo link, or data URL for small images
  thumbnail?: string;        // preview image URL or data URL
  linkedSceneIds: string[];  // which ScriptScene.ids this applies to
  linkedCharacters: string[];// character names
  tags: string[];
  createdAt: string;
  notes: string;
}
```

### Updated Script interface

```typescript
interface Script {
  // ── Existing fields (unchanged) ──
  id: string;
  projectId: string;
  title: string;
  type: ScriptType;
  language: string;
  genre: string;
  writer: string;
  storyBy: string;
  screenplayBy: string;
  dialoguesBy: string;
  scriptCoordinator: string;
  draftName: string;
  draftNumber: string;
  status: ScriptStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  archived: boolean;
  blocks: ScriptBlock[];
  scenes: ScriptScene[];
  versions: ScriptDraftVersion[];
  linkedSceneIds: string[];

  // ── New fields ──
  shots: Shot[];                      // Shot division data
  references: ScriptReference[];      // Reference attachments
}
```

**Migration:** Existing scripts in the seed data and JSON file don't have `shots` or `references`. The store's `normalizeInput` function already handles missing fields — we'll add default empty arrays in the normalization, so existing data works without migration.

---

## Seed data plan

We'll add seed data for 2 scripts to demonstrate the new features:

### Script p1-s1 (Pushpa 2: The Rule — Main Script)

**Shots (8 samples):**

| Scene | Shot | Type | Movement | Description |
|---|---|---|---|---|
| SC-001 | 1A | establishing | drone | Aerial sweep over Seshachalam forest at dawn |
| SC-001 | 1B | wide | steadicam | Pushpa walks through sandalwood grove |
| SC-001 | 1C | close-up | static | Pushpa's face — determination |
| SC-002 | 2A | wide | crane | Police convoy enters village |
| SC-002 | 2B | over-shoulder | dolly | SP Bhanwar Singh surveys the crowd |
| SC-002 | 2C | medium | handheld | Villagers scatter |
| SC-003 | 3A | medium-close | steadicam | Srivalli at the temple entrance |
| SC-003 | 3B | two-shot | dolly | Srivalli and Pushpa reunion |

**References (6 samples):**

| Category | Title | Description |
|---|---|---|
| image | Seshachalam forest reference | Real forest canopy for drone shots |
| image | Sandalwood texture close-up | Art department reference for set dressing |
| video | Pushpa 1 climax sequence | Tone reference for forest chase |
| character | Pushpa — costume board | Look development for Pushpa's forest outfit |
| location | Charminar East Gate — scout photos | Production scouting reference |
| prop | Sandalwood logs — real vs. prop | Prop department comparison reference |

### Script p2-s1 (Game Changer — Main Script)

**Shots (4 samples):**

| Scene | Shot | Type | Movement | Description |
|---|---|---|---|---|
| SC-001 | 1A | establishing | aerial | Government building exterior — dawn |
| SC-001 | 1B | medium | steadicam | Ram Nandan enters the collector's office |
| SC-002 | 2A | close-up | static | Ballot box seal being broken |
| SC-002 | 2B | group | crane | Crowd erupts at election result |

**References (3 samples):**

| Category | Title | Description |
|---|---|---|
| image | AP government building reference | Architecture reference for set |
| audio | Election crowd ambience | Sound design reference |
| location | Visakhapatnam coast — aerial survey | Drone footage from location scout |

---

## Computed data (no storage needed)

These are derived at render time from existing fields:

### Reports computations (from `script.blocks` and `script.scenes`)

```typescript
// Cast Report — computed from blocks
interface CastReportEntry {
  characterName: string;
  totalSpeeches: number;
  totalWords: number;
  dialoguePercentage: number;
  sceneAppearances: string[];    // scene numbers
  roleTier: "Lead" | "Major Supporting" | "Supporting" | "Minor";
  linkedCastMemberId?: string;   // matched from castMembers by character name
}

// Location Report — computed from scenes
interface LocationReportEntry {
  locationName: string;
  sceneCount: number;
  totalPages: number;
  intCount: number;
  extCount: number;
  dayCount: number;
  nightCount: number;
  firstScene: string;       // scene number
  lastScene: string;
  linkedLocationId?: string; // matched from ProjectLocation by name
}

// Dialogue Report — computed from blocks
interface DialogueReportEntry {
  characterName: string;
  sceneNumber: string;
  text: string;
  parenthetical?: string;
  wordCount: number;
  blockIndex: number;
}

// Prop Report — computed from scenes
interface PropReportEntry {
  name: string;
  category: "prop" | "costume" | "vehicle" | "special" | "vfx";
  sceneAppearances: string[];
  notes: string[];
}
```

### Analysis computations (from `script.blocks` and `script.scenes`)

```typescript
interface ThreeActAnalysis {
  totalPages: number;
  acts: {
    act: 1 | 2 | 3;
    label: string;                // "Setup" | "Confrontation" | "Resolution"
    startPage: number;
    endPage: number;
    sceneCount: number;
    pageCount: number;
    dialogueRatio: number;        // dialogue blocks / total blocks in this act
    actionRatio: number;
    characterIntroductions: string[];
    longestScene: { number: string; pages: number };
  }[];
  plotPoints: {
    name: string;                 // "Inciting Incident", "First Plot Point", etc.
    expectedPage: number;         // where it should be per convention
    actualScene: string;          // scene number at that position
    deviation: number;            // pages off from expected
  }[];
  pacing: {
    sceneNumber: string;
    pages: number;
    act: 1 | 2 | 3;
    cumulativePages: number;
  }[];
  protagonist: {
    name: string;
    dialogueByAct: [number, number, number]; // word counts per act
  };
  structureScore: number;         // 0-100
  suggestions: string[];          // improvement notes
}
```

---

## Store function additions

### In `lib/script-store.ts`

```typescript
// Shot CRUD
export function addShot(scriptId: string, sceneId: string, input: Omit<Shot, "id">): Shot
export function updateShot(scriptId: string, shotId: string, updates: Partial<Shot>): void
export function removeShot(scriptId: string, shotId: string): void
export function reorderShots(scriptId: string, sceneId: string, shotIds: string[]): void

// Reference CRUD
export function addReference(scriptId: string, input: Omit<ScriptReference, "id" | "createdAt">): ScriptReference
export function updateReference(scriptId: string, refId: string, updates: Partial<ScriptReference>): void
export function removeReference(scriptId: string, refId: string): void

// Version management (enhanced)
export function restoreScriptVersion(scriptId: string, versionId: string): void
export function deleteScriptVersion(scriptId: string, versionId: string): void
export function updateScriptVersion(scriptId: string, versionId: string, updates: Partial<Pick<ScriptDraftVersion, "name" | "notes">>): void

// Scene management (enhanced)
export function reorderScriptScenes(scriptId: string, sceneIds: string[]): void
export function deleteScene(id: string): void  // in scene-store.ts
```

### New file: `lib/script-report-utils.ts`

```typescript
export function computeCastReport(script: Script): CastReportEntry[]
export function computeLocationReport(script: Script): LocationReportEntry[]
export function computeDialogueReport(script: Script): DialogueReportEntry[]
export function computePropReport(script: Script): PropReportEntry[]
export function computeThreeActAnalysis(script: Script): ThreeActAnalysis
export function exportReportAsCSV(headers: string[], rows: string[][]): string
```

---

## File impact summary

| File | Action | What changes |
|---|---|---|
| `lib/types.ts` | **Edit** | Add `Shot`, `ShotType`, `ShotMovement`, `ShotStatus`, `ScriptReference`, `ReferenceCategory`. Add `shots` and `references` to `Script`. |
| `lib/script-store.ts` | **Edit** | Add shot CRUD, reference CRUD, version restore/delete/update, scene reorder. |
| `lib/scene-store.ts` | **Edit** | Add `deleteScene()`. |
| `lib/script-report-utils.ts` | **New** | Report computation functions, CSV export. |
| `lib/script-analysis.ts` | **New** | Three-act analysis engine. |
| `lib/flowbender-demo-seed.ts` | **Edit** | Add seed shots and references for p1/p2 scripts. |
| `lib/app-data-store.ts` | **Edit** | Default empty `shots: []` and `references: []` in script normalization (if needed). |
| `components/scripts/script-editor.tsx` | **Edit** | Add new tabs to tab bar, render new tab components. |
| `components/scripts/scene-inline-editor.tsx` | **New** | Inline scene editing. |
| `components/scripts/version-viewer.tsx` | **New** | Read-only version view. |
| `components/scripts/version-compare.tsx` | **New** | Side-by-side version diff. |
| `components/scripts/shot-division-tab.tsx` | **New** | Shot division main view. |
| `components/scripts/shot-card.tsx` | **New** | Shot display/edit card. |
| `components/scripts/add-shot-dialog.tsx` | **New** | Add shot form. |
| `components/scripts/timeline-tab.tsx` | **New** | Script timeline view. |
| `components/scripts/timeline-day-column.tsx` | **New** | Timeline day column. |
| `components/scripts/timeline-scene-card.tsx` | **New** | Timeline scene card. |
| `components/scripts/locations-tab.tsx` | **New** | Enhanced locations tab. |
| `components/scripts/references-tab.tsx` | **New** | References tab. |
| `components/scripts/reference-card.tsx` | **New** | Reference card. |
| `components/scripts/add-reference-dialog.tsx` | **New** | Add/edit reference form. |
| `components/scripts/reports/script-reports-tab.tsx` | **New** | Reports sub-tab container. |
| `components/scripts/reports/cast-report.tsx` | **New** | Cast report table. |
| `components/scripts/reports/location-report.tsx` | **New** | Location report table. |
| `components/scripts/reports/dialogue-report.tsx` | **New** | Dialogue report. |
| `components/scripts/reports/prop-report.tsx` | **New** | Prop report. |
| `components/scripts/reports/summary-dashboard.tsx` | **New** | Report summary KPIs. |
| `components/scripts/analysis-tab.tsx` | **New** | Three-act analysis view. |

**Total: 5 files edited, 22 new files created.**
