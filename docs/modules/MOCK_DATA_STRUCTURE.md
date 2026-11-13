# Flowbender — Mock Data Structure

**Date:** 2026-10-30

---

## Overview

Data is managed by a central store (`lib/app-data-store.ts`) using `useSyncExternalStore`. There are **31 collections** typed in `lib/types.ts`. Seed data comes from `lib/flowbender-demo-seed.ts` and `lib/demo-data.ts`. At runtime, the dataset is stored in `data/flowbender-demo-data.json` (~700 KB) and served via `/api/demo-data`.

**Current persistence:** Server-side JSON file (needs Node server).  
**Target persistence:** localStorage / IndexedDB (frontend-only, no server).

---

## Projects (7 seeded)

| ID | Title | Type | Status | Language |
|---|---|---|---|---|
| p1 | Pushpa 2: The Rule | feature-film | production | Telugu / Hindi |
| p2 | Game Changer | feature-film | post-production | Telugu / Tamil |
| p3 | Spirit | feature-film | production | Telugu / Hindi |
| p4 | Devara: Part 2 | feature-film | pre-production | Telugu / Hindi |
| p5 | Salaar: Part 2 — Shouryanga Parvam | feature-film | production | Telugu / Kannada |
| p6 | Aha Original Series (Season 2) | series | production | Telugu |
| p7 | Mirai: Neon Requiem | feature-film | development | Telugu / Japanese |

---

## Collection Schema Reference

### Core entities

```typescript
interface Project {
  id, title, type: ProjectType, status: ProductionStatus,
  genre, language, director, producer, productionHouse,
  startDate, endDate, releaseDate?, budget, spent,
  posterColor, posterImage?, thumbnailImage?, bannerImage?,
  logline, description, shootProgress, totalShootDays,
  completedShootDays, nextShootDate, createdAt
}

interface Script {
  id, projectId, title, type: ScriptType, language, genre,
  writer, storyBy, screenplayBy, dialoguesBy, scriptCoordinator,
  draftName, draftNumber, status: ScriptStatus, notes,
  createdAt, updatedAt, createdBy, archived,
  blocks: ScriptBlock[], scenes: ScriptScene[],
  versions: ScriptDraftVersion[], linkedSceneIds: string[]
}

interface Scene {
  id, projectId, sceneNumber, heading, intExt: IntExt,
  location, timeOfDay: TimeOfDay, characters: string[],
  props: SceneBreakdownItem[], costumes: SceneBreakdownItem[],
  vehicles: SceneBreakdownItem[], specialRequirements: SceneBreakdownItem[],
  vfxRequired, vfxNotes, notes, estimatedDuration, pages,
  status: SceneStatus, shootDate?, shootDay?, synopsis
}

interface CastMember {
  id, name, character, characterDescription,
  category: CastCategory, projectId, projectTitle,
  avatarUrl?, profileImage?, initials, email, phone, agency?,
  languages: string[], contractStatus: ContractStatus,
  paymentStatus: PaymentStatus, totalFee, paidAmount,
  paymentMilestones: PaymentMilestone[],
  scenes: CastScene[], notes, joinedDate
}

interface CrewMember {
  id, name, initials, profileImage?,
  department: CrewDepartment, role: string,
  projectId, projectTitle, email, phone, agency?,
  contractStatus, paymentStatus, dayRate, totalDays,
  daysWorked, totalPaid, availability: CrewAvailability,
  notes, joinedDate
}
```

### Schedule & Production

```typescript
interface ShootDay {
  id, projectId, projectTitle, date, shootDayNumber,
  totalShootDays, callTime, wrapTime, location, locationAddress?,
  scenes: ShootDayScene[], castRequired: string[],
  crewRequired: ShootDayCrewReq[], equipment: ShootDayEquipment[],
  status: ShootDayStatus, callSheetStatus, totalPages, notes,
  conflicts: ScheduleConflict[]
}

interface ScheduleEntry {
  id, projectId, projectTitle, date, callTime,
  location, scenes: string[], shootDayNumber, totalShootDays,
  callSheetStatus, status
}
// Note: ScheduleEntry is a legacy model alongside ShootDay

interface CallSheet {
  id, project, workflow: CallSheetWorkflow, shootDay, date,
  location, director, ad, cast, crew, status: CallSheetStatus,
  updated, scenes: CallSheetScene[], notes, projectId?,
  // Extended fields:
  version?, callTime?, firstShot?, packUp?, producer?,
  executiveProducer?, productionManager?, dop?, language?, genre?,
  productionCompany?, weather?, productionMessage?,
  sceneIds?, castAssignments?, crewAssignments?, locationIds?,
  locations?, schedule?, transport?, catering?, equipment?,
  props?, safety?, specialNotes?, revisions?
}

interface AttendanceRecord {
  id, projectId, personId?, name, role, department,
  date, checkIn, checkOut, status: AttendanceStatus,
  hoursWorked, notes?
}

interface DprReport {
  id, projectId, shootDayId, date, plannedPages, shotPages,
  completedScenes: string[], delays: string[],
  incidents: string[], producerNote
}
// Note: DprReport collection exists but DPRs actually use localStorage
```

### Finance

```typescript
interface BudgetLineItem {
  id, projectId, category: string, allocated, committed, spent, notes
}

interface ExpenseItem {
  id, projectId, date, category: string, description,
  vendorId?: string, amount, status: "draft"|"approved"|"paid"
}

interface PayrollEntry {
  id, projectId, payeeName, department: string,
  period, grossAmount, paidAmount, status: PaymentStatus, dueDate
}

interface VendorRecord {
  id, name, category: string, contactName, phone, city,
  activeProjects: string[], paymentStatus
}
```

### Equipment & Media

```typescript
interface EquipmentItem {
  id, projectId?, name, category: string, vendorId?,
  quantity, status: "available"|"reserved"|"in-use"|"maintenance",
  notes?, imageUrl?
}

interface CameraCard {
  id, projectId, cardId, capacity, available,
  format: "RAW"|"ProRes"|"DNxHR"|"H.264",
  shootDate, status, shootCount, backupStatus, location, notes?
}

interface StorageDevice {
  id, projectId, deviceId, type: "HDD"|"SSD"|"NAS"|"LTO-Tape",
  capacity, used, status, location, content: string[],
  lastVerified, redundancy, temperature?
}

interface FootageMetadata {
  id, projectId, sceneId: string, takeNumber, duration,
  format, resolution, fps, codecs, storedOn: string[],
  status, notes?, shootDate
}
```

### Post-Production

```typescript
interface PostProductionItem {
  id, projectId, department: string, task, owner,
  status: PostProductionStatus, progress: number, dueDate
}

interface VfxShot {
  id, projectId, shotCode, sequence: string, description,
  vendorId?: string, status: VfxShotStatus,
  priority: "low"|"medium"|"high", dueDate
}

interface SubtitleLanguage {
  id, projectId, language, languageCode, nativeName,
  totalLines, completedLines, inProgressLines,
  qcStatus, translator, startDate, deliveryDate, notes?, fileSize?
}

interface DeliverableItem {
  id, projectId, name, format, territory,
  status: "pending"|"in-progress"|"ready"|"delivered", dueDate
}
```

### Business & Distribution

```typescript
interface RightsDeal {
  id, projectId, territory: string, distributor: string,
  rightsType: "theatrical"|"satellite"|"digital"|"audio"|"dubbed"|"remake"|"broadcast"|"ancillary",
  status: "open"|"negotiating"|"signed"|"closed",
  minimumGuarantee, advanceReceived,
  deliveryStatus: "pending"|"partial"|"complete"
}

interface MarketingItem {
  id, projectId, campaign, channel, owner, launchDate,
  status: "planning"|"live"|"completed", notes
}
// Note: MarketingItem is typed and registered but seed is empty, no UI
```

### Supporting entities

```typescript
interface SeriesSeason { id, projectId, title, seasonNumber, episodeCount, status, logline, showrunner, deliveryWindow }
interface SeriesEpisode { id, projectId, seasonId, episodeNumber, title, status: EpisodeStatus, synopsis, scriptVersionId?, airDate?, duration? }
interface CharacterProfile { id, projectId, name, description, ageBracket, arc, languages: string[], linkedCastIds: string[] }
interface ProjectLocation { id, projectId, name, city, type: string, status: "locked"|"scouting"|"permit-pending", address, notes, coverImage?, gallery? }
interface ProductionTask { id, projectId, department: string, title, owner, dueDate, status: ProductionTaskStatus, priority: TaskPriority }
interface Notification { id, title, message, timestamp, read, type: "info"|"warning"|"success"|"urgent" }
interface ScriptVersion { id, projectId, version, label, date, author, pageCount, sceneCount, notes, color, isCurrent }
```

---

## Type Enums

```typescript
type ProductionStatus = "development" | "pre-production" | "production" | "post-production" | "completed" | "on-hold"
type ProjectType = "feature-film" | "series" | "short-film" | "music-video" | "documentary" | "commercial"
type CastCategory = "lead" | "supporting" | "character-artist" | "guest" | "child-artist" | "special-appearance"
type ContractStatus = "signed" | "negotiating" | "pending" | "expired"
type PaymentStatus = "paid" | "partial" | "pending" | "overdue"
type CrewDepartment = "direction" | "production" | "camera" | "art" | "costume" | "makeup" | "sound" | "lighting" | "vfx" | "editing" | "di" | "dubbing" | "production-design" | "transport" | "accounts" | "publicity"
type CrewAvailability = "available" | "on-set" | "on-leave" | "unavailable"
type SceneStatus = "not-scheduled" | "scheduled" | "shot" | "partially-shot" | "reshoot-required"
type ShootDayStatus = "planned" | "confirmed" | "in-progress" | "completed" | "cancelled"
type CallSheetStatus = "Draft" | "Ready for Review" | "Published" | "Revised" | "Completed"
type ScriptType = "feature" | "series-episode" | "short" | "music-video" | "documentary" | "commercial" | "pilot" | "web-series"
type ScriptStatus = "concept" | "outline" | "treatment" | "first-draft" | "revision" | "final-draft" | "locked" | "shooting-script"
type PostProductionStatus = "not-started" | "in-progress" | "review" | "approved" | "completed"
type VfxShotStatus = "briefed" | "in-progress" | "client-review" | "final"
type AttendanceStatus = "present" | "absent" | "partial" | "leave"
```

---

## Record Counts (seed data)

| Collection | Count | Projects covered |
|---|:-:|---|
| scripts | 14 | all 7 |
| projects | 7 | — |
| castMembers | 23 | all 7 |
| crewMembers | 36 | all 7 |
| scenes | 33 | all 7 |
| scriptVersions | 8 | p1, p2, p3, p5, p7 |
| scheduleEntries | 96 | all 7 |
| shootDays | 96 | all 7 |
| callSheets | 95 | all 7 |
| seriesSeasons | 4 | — |
| seriesEpisodes | 8 | — |
| characters | 10 | — |
| locations | 12 | — |
| dprReports | 3 | — |
| productionTasks | 90 | — |
| equipmentInventory | 40 | — |
| vendors | 5 | — |
| budgetLineItems | 43 | — |
| expenseItems | 27 | — |
| payrollEntries | 20 | — |
| postProductionItems | 29 | — |
| vfxShots | 5 | — |
| deliverables | 22 | — |
| rightsDeals | 35 | — |
| marketingItems | 0 | — |
| notifications | 0 | — |
| attendanceRecords | 6 | — |
| cameraCards | 5 | — |
| storageDevices | 5 | — |
| footageMetadata | 4 | — |
| subtitleLanguages | 7 | — |
| **Total** | **~831** | |

---

## Known Data Issues

1. **Department string mismatch:** `CrewMember.department` is a typed enum (lowercase). `PayrollEntry.department`, `ProductionTask.department`, `AttendanceRecord.department` and `ShootDayCrewReq.department` are free-text strings (capitalised). Cross-module department grouping is unreliable.

2. **Dual scene models:** `Script.scenes` (`ScriptScene[]`) and the `scenes` collection (`Scene[]`) are independent. Importing a script file overwrites all `Scene` records for that project, losing manual edits to props, costumes, vehicles, etc.

3. **Orphan collections:** `characters` (10 records, no UI), `dprReports` (3 records, DPRs use localStorage), `productionTasks` (90 records, only in orphan component), `marketingItems` (0 records, type-only).

4. **Free-text foreign keys:** `VfxShot.vendorId`, `EquipmentItem.vendorId`, `ExpenseItem.vendorId` are strings, not validated against `vendors`. The VFX create form defaults to "DNEG India".

5. **localStorage islands:** Demo accounts, DPR reports, continuity binder, clapperboard take logs and script editor state are in localStorage, not in the main data store or JSON file.

6. **Legacy model:** `ScheduleEntry` (96 records) coexists with `ShootDay` (96 records). Some components use one, some the other.

7. **Seed department errors:** "Action Director" and "Action Choreographer" are filed under department `vfx` instead of a stunts/action department.
