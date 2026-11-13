# Master Schedule — Data Structures

## REUSED (existing types.ts — DO NOT CHANGE)

### ShootDay (255 lines, types.ts)
```ts
interface ShootDay {
  id: string;                    // "sd-1"
  projectId: string;
  projectTitle: string;
  date: string;                  // "YYYY-MM-DD"
  shootDayNumber: number;
  totalShootDays: number;
  callTime: string;
  wrapTime: string;
  location: string;
  locationAddress: string;
  scenes: ShootDayScene[];       // { sceneNumber, heading, pages, intExt, characters }
  castRequired: string[];        // artist names
  crewRequired: ShootDayCrewReq[];
  equipment: ShootDayEquipment[];
  status: ShootDayStatus;        // planned|confirmed|in-progress|completed|cancelled
  callSheetStatus: string;
  totalPages: number;
  notes: string;
  conflicts: string[];
}
```

### CallSheet (types.ts line 545)
```ts
interface CallSheet {
  id: string;
  project: string;
  workflow: CallSheetWorkflow;
  shootDay: number;
  date: string;
  location: string;
  director: string;
  ad: string;
  cast: number;
  crew: number;
  status: CallSheetStatus;       // Draft|Ready for Review|Published|Revised|Completed
  notes: string;
  scenes: CallSheetScene[];
  castAssignments?: CallSheetCastAssignment[];
  crewAssignments?: CallSheetCrewAssignment[];
  catering?: CallSheetRow[];
  transport?: CallSheetRow[];
  equipment?: CallSheetRow[];
  props?: CallSheetRow[];
  schedule?: CallSheetRow[];
  revisions?: { version, date, changedBy, reason, status }[];
}
```

### ProductionTask (types.ts line 667)
```ts
interface ProductionTask {
  id: string;
  projectId: string;
  department: string;
  title: string;
  owner: string;
  dueDate: string;
  status: "open" | "in-progress" | "blocked" | "done";
  priority: "low" | "medium" | "high" | "critical";
}
```

### PostProductionItem (types.ts line 741)
```ts
interface PostProductionItem {
  id: string;
  projectId: string;
  department: string;            // Editing|VFX|Sound|Dubbing|Music|DI|QC
  task: string;
  owner: string;
  status: PostProductionStatus;  // in-progress|review|completed|blocked|pending
  progress: number;              // 0–100
  dueDate: string;
}
```

### AttendanceRecord (existing, sparse — 6 records)
```ts
interface AttendanceRecord {
  id: string;
  projectId: string;
  personId: string;
  name: string;
  role: string;
  department: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: "present" | "absent" | "half-day" | "on-leave" | "unconfirmed";
  hoursWorked: number;
  notes: string;
}
```

---

## NEW TYPES (add to types.ts)

### DPR Report
```ts
export type DPRStatus = "draft" | "submitted" | "approved";

export interface DPRScene {
  sceneNumber: string;
  heading: string;
  pagesPlanned: number;
  pagesCompleted: number;
  status: "completed" | "partial" | "not-started" | "moved";
  notes: string;
}

export interface DPRReport {
  id: string;                    // "dpr-p1-sd1"
  projectId: string;
  shootDayId: string;            // links to shootDays.id
  date: string;
  shootDayNumber: number;
  location: string;
  director: string;
  adName: string;
  callTime: string;
  actualCallTime: string;
  wrapTime: string;
  actualWrapTime: string;
  castPresent: number;
  crewPresent: number;
  cateringCount: number;
  scenesPlanned: number;
  scenesCompleted: number;
  pagesPlanned: number;
  pagesCompleted: number;
  scenes: DPRScene[];
  issues: string;                // free text for the day
  tomorrowLocation: string;
  tomorrowScenes: string;
  status: DPRStatus;
  submittedBy: string;
  createdAt: string;
  updatedAt: string;
}
```

### Calendar Event
```ts
export type CalendarEventType =
  | "shoot"
  | "rehearsal"
  | "meeting"
  | "deadline"
  | "post-milestone"
  | "delivery"
  | "holiday";

export interface CalendarEvent {
  id: string;                    // "evt-1"
  type: CalendarEventType;
  title: string;
  date: string;                  // YYYY-MM-DD
  endDate?: string;              // for multi-day events
  projectId?: string;
  projectTitle?: string;
  time?: string;                 // "HH:MM"
  location?: string;
  description?: string;
  attendees?: string[];          // names
  linkedShootDayId?: string;
  createdBy?: string;
  createdAt: string;
}
```

### PreProdChecklist
```ts
export type ChecklistStatus = "pending" | "in-progress" | "done" | "blocked";

export interface PreProdChecklistItem {
  id: string;                    // "chk-p1-1"
  projectId: string;
  category: string;              // "Locations" | "Cast" | "Script" | "Equipment" | "Permits" | "Music" | "VFX" | "Legal"
  title: string;
  owner: string;
  dueDate: string;
  status: ChecklistStatus;
  notes: string;
}
```

---

## DATA RELATIONSHIPS MAP

```
shootDays ──────────────────────────┐
  ├── castRequired (names) ──────── castMembers.name
  ├── crewRequired (names) ──────── crewMembers.name
  ├── date ───────────────────────► callSheets.date (match)
  ├── date ───────────────────────► attendanceRecords.date (match)
  └── id ─────────────────────────► DPRReport.shootDayId

callSheets ──────────────────────────┐
  ├── projectId ──────────────────── projects.id
  ├── date ───────────────────────── shootDays.date
  └── castAssignments.castId ──────── castMembers.id

attendanceRecords ────────────────────┐
  ├── projectId ──────────────────── projects.id
  ├── personId ───────────────────── castMembers.id OR crewMembers.id
  └── date ───────────────────────── shootDays.date

DPRReport ───────────────────────────┐
  ├── projectId ──────────────────── projects.id
  ├── shootDayId ─────────────────── shootDays.id
  └── date ───────────────────────── shootDays.date

productionTasks ──────────────────────┐
  └── projectId ──────────────────── projects.id

postProductionItems ──────────────────┐
  └── projectId ──────────────────── projects.id

CalendarEvent ───────────────────────┐
  ├── projectId ──────────────────── projects.id (optional)
  └── linkedShootDayId ──────────── shootDays.id (optional)

PreProdChecklistItem ─────────────────┐
  └── projectId ──────────────────── projects.id
```

---

## NEW SEED DATA VOLUMES

| Collection | Existing | Target | New Records |
|---|---|---|---|
| attendanceRecords | 6 | ~220 | ~214 |
| dprReports | 0 | ~44 | 44 (completed shoot days) |
| calendarEvents | 0 | ~35 | 35 |
| preProdChecklistItems | 0 | ~70 | 70 (10/project) |

## EXISTING DATA — NO CHANGES

| Collection | Count | Action |
|---|---|---|
| shootDays | 96 | READ ONLY |
| scheduleEntries | 96 | READ ONLY |
| callSheets | 95 | Enrich (add castAssignments/catering rows) |
| productionTasks | 90 | READ ONLY (existing) |
| postProductionItems | 29 | Extend in seed |
| deliverables | 22 | READ ONLY |
| crewMembers | 36 | READ ONLY |
| castMembers | 23 | READ ONLY |
| artistAvailability | 4168 | READ ONLY |
