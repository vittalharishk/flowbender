# Master Schedule Module — Implementation Plan

## Existing Infrastructure (DO NOT DUPLICATE)

| Collection | Count | Notes |
|---|---|---|
| projects | 7 | p1–p7, statuses: pre-prod / production / post-prod / completed |
| shootDays | 96 | Full structure: date, castRequired, crewRequired, scenes, equipment, conflicts |
| scheduleEntries | 96 | Lighter version of shootDays for timeline views |
| callSheets | 95 | Already rich: scenes, cast, crew, status, director, AD |
| crewMembers | 36 | 7 departments, dayRate, daysWorked, availability |
| castMembers | 23 | Linked to candidates, contracts, availability |
| artistAvailability | 4168 | Per-date state: confirmed / available / tentative / unavailable |
| productionTasks | 90 | Pre-production tasks, 11 departments, status: open/in-progress/blocked |
| attendanceRecords | 6 | Sparse — needs full seeding |
| postProductionItems | 29 | Editing/VFX/Sound/Dubbing/Music/DI/QC |
| scenes | 33 | Linked to projects |
| vfxShots | 5 | Sparse — partial coverage |
| deliverables | 22 | Final deliveries |

## Existing Routes (pages already exist — enhance, don't rebuild)

| Route | Status |
|---|---|
| /dashboard/attendance | EXISTS — stub or partial |
| /dashboard/schedule | EXISTS |
| /dashboard/production | EXISTS |
| /dashboard/post-production | EXISTS |
| /dashboard/projects/[id]/attendance | EXISTS |
| /dashboard/projects/[id]/call-sheets | EXISTS |
| /dashboard/projects/[id]/schedule | EXISTS |
| /dashboard/projects/[id]/production | EXISTS |
| /dashboard/projects/[id]/post-production | EXISTS |

---

## Section 1: ATTENDANCE

### Goal
Daily attendance for cast and crew, with catering headcount derived from attendance totals.

### Pages & Screens
- **Global**: `/dashboard/attendance` — cross-project attendance overview
- **Project**: `/dashboard/projects/[id]/attendance` — single-project daily attendance

### Components
1. `AttendanceDatePicker` — select date, navigate prev/next shooting day
2. `AttendanceSummaryCards` — Present / Absent / Half-day / On-leave / Total Headcount / Catering Count
3. `AttendanceRoster` — table of cast + crew, one row per person, status selector
4. `CateringPanel` — derived count: (present × 1) + (half-day × 0.5) + extras override
5. `AttendanceHistory` — week-view grid per person

### Attendance States
| State | Code | Catering Weight |
|---|---|---|
| Present | present | 1.0 |
| Half Day | half-day | 0.5 |
| Absent | absent | 0 |
| On Leave | on-leave | 0 |
| Unconfirmed | unconfirmed | 0 (default) |

### Catering Set Count
```
setCount = Σ(present × 1.0) + Σ(half-day × 0.5) + extras
extras = manually overridable buffer (default: round up to next 5)
```

### Data Reuse
- Cast: from `castMembers` filtered by `projectId`
- Crew: from `crewMembers` filtered by `projectId`
- Dates: from `shootDays` — only shooting dates show in date picker
- Existing `attendanceRecords` (6) preserved and extended

### New Data Needed
- Full attendance records: ~200 entries across p1–p5 (active/completed projects), 4–5 crew/cast per shoot day

### Relationships
- Cast module: read `castMembers`, `artistAvailability` (prefill unconfirmed based on availability state)
- Schedule: read `shootDays` for shooting dates
- Production: daily attendance feeds into production day status

---

## Section 2: CALL SHEETS

### Goal
Publish and manage daily call sheets linking shoot date, scenes, cast, crew, locations and call times.

### Pages & Screens
- **Global**: `/dashboard/projects/[id]/call-sheets` (already routed, existing UI)
- **Detail**: `/dashboard/projects/[id]/call-sheets/[id]` — full call sheet detail view

### Components
1. `CallSheetList` — filterable list: project, date, status
2. `CallSheetCard` — summary: date, day #, location, status badge, cast/crew counts
3. `CallSheetDetail` — full render: header info, scene breakdown, cast assignments, crew assignments, transport, catering, equipment, advance schedule
4. `CallSheetStatusWorkflow` — Draft → Ready for Review → Published → Completed
5. `CallSheetRevisions` — version history with change reasons

### Data Reuse
- `callSheets` (95 records): all existing data preserved
- Linked to `shootDays` via date + projectId
- Cast from `castMembers`, crew from `crewMembers`
- `artistAvailability` shown inline per cast member on that date

### New Data Needed
- Enrich existing call sheets with `castAssignments`, `crewAssignments`, `transport`, `catering` rows (most currently empty)

### Relationships
- Attendance: published call sheet defines who is expected → seeds attendance pre-fill
- Production: completed call sheet links to production day report
- Schedule: call sheet date matches shootDay

---

## Section 3: PRE-PRODUCTION

### Goal
Track all preparation tasks, departmental readiness, and milestones before principal photography begins.

### Pages & Screens
- **Global**: `/dashboard/production` (reuse, add Pre-Production tab)
- **Project**: `/dashboard/projects/[id]/production` (tab: Pre-Production)

### Components
1. `PreProdDashboard` — overall readiness %, by department
2. `PreProdTaskBoard` — Kanban: open / in-progress / blocked / done
3. `PreProdCalendar` — deadline calendar view
4. `PreProdDepartmentView` — per-department task list with owner and due date
5. `ReadinessTracker` — checklist: Locations locked / Permits / Equipment confirmed / Cast contracts / Script finalized etc.

### Data Reuse
- `productionTasks` (90 records): all preserved — status, department, owner, dueDate, priority
- Projects: filter by `status === "pre-production"` (p6: HIT 3 is the only active pre-production project)

### New Data Needed
- Task completion records (mark done)
- Pre-production checklist items per project (10–12 items per project)
- Location readiness per project

### Relationships
- Locations module: location permits and status
- Equipment module: equipment booking status
- Cast module: contract status drives casting readiness flag

---

## Section 4: PRODUCTION

### Goal
Manage each shooting day: scene progress, shot completion, daily reports, issues and wrap status.

### Pages & Screens
- **Global**: `/dashboard/production` (Production tab)
- **Project**: `/dashboard/projects/[id]/production`
- **Day**: `/dashboard/projects/[id]/schedule/[dayId]` (existing, enhance with DPR sub-section)

### Components
1. `ProductionDashboard` — active projects, today's shoot, days remaining, pages shot
2. `ShootDayCard` — date, location, scenes planned vs shot, cast present, status
3. `SceneProgress` — per scene: planned pages vs actual, INT/EXT, status
4. `DailyProductionReport (DPR)` — day summary: scenes completed, pages, cast, crew, issues, next day preview
5. `IssueTracker` — log delays, weather, technical problems inline
6. `ProductionCalendar` — month view of shoot days with status colours

### Data Reuse
- `shootDays` (96): primary source — date, scenes, cast, crew, equipment, status
- `scheduleEntries` (96): for timeline/calendar display
- `attendanceRecords`: feeds into DPR headcounts
- `dprReports` if in types (check) — may already exist partially

### New Data Needed
- DPR records per completed shoot day (~40 records for p1/p2/p3 completed projects)
- Scene completion status per shoot day
- Issue log entries (~20 sample issues)

### Relationships
- Call Sheets: feeds scenes / cast / crew into production day
- Attendance: DPR pulls headcount from attendance
- Post-Production: completed scenes feed VFX/editing pipeline

---

## Section 5: POST-PRODUCTION

### Goal
Track all post-production milestones from picture lock through delivery.

### Pages & Screens
- **Global**: `/dashboard/post-production`
- **Project**: `/dashboard/projects/[id]/post-production`

### Components
1. `PostProdDashboard` — pipeline overview: departments, overall progress, delivery date countdown
2. `PostProdPipeline` — horizontal timeline: Editing → VFX → Sound → DI → Dubbing → QC → Delivery
3. `DepartmentTracker` — per department: tasks, owners, progress bars, due dates
4. `VFXShotList` — shot-level VFX tracking: status, department, complexity
5. `DeliverableTracker` — final deliveries: format, platform, due date, status
6. `SubtitleStatus` — reuse existing subtitleLanguages data

### Data Reuse
- `postProductionItems` (29): Editing/VFX/Sound/Dubbing/Music/DI/QC with progress %
- `deliverables` (22): final delivery records
- `vfxShots` (5): extend to cover more VFX shots
- `subtitleLanguages`: from existing module

### New Data Needed
- Extend `postProductionItems` to 60+ records across all 7 projects
- VFX shot list expanded to ~30 shots
- Deliverable records for each platform (theatrical, OTT, PVOD)

### Relationships
- Production: picture lock milestone feeds post-production start
- Distribution module: deliverables link to distribution window
- Finance: post-production costs trackable

---

## Section 6: EVENT CALENDAR

### Goal
Unified shared calendar showing all shoot days, meetings, rehearsals, deadlines and post milestones across all projects.

### Pages & Screens
- **Global**: `/dashboard/schedule` (existing route — enhance)
- **Project**: `/dashboard/projects/[id]/schedule` (existing — enhance)

### Components
1. `MasterCalendar` — full month grid, color-coded event types
2. `WeekView` — 7-day view with time slots and event stacking
3. `AgendaView` — linear list of upcoming events
4. `EventTypeFilter` — toggle: Shoot Days / Meetings / Rehearsals / Deadlines / Post milestones / Releases
5. `EventDetail` — click any event → side panel: full detail, linked cast/crew, actions
6. `EventCreateDialog` — add custom event (meeting, rehearsal, deadline)

### Event Types & Colors
| Type | Color |
|---|---|
| Shoot Day | amber |
| Rehearsal | violet |
| Meeting | blue |
| Pre-production deadline | orange |
| Post-production milestone | teal |
| Delivery / Release | emerald |
| Holiday / Block | red |

### Data Reuse
- `shootDays` (96): shoot events
- `scheduleEntries` (96): schedule timeline events
- `productionTasks`: due dates as deadline events
- `postProductionItems`: milestone dates
- `deliverables`: delivery dates
- `artistAvailability`: show artist availability in calendar day cell

### New Data Needed
- Meeting events (~15 records: script readings, production meetings, table reads)
- Rehearsal events (~10 records)
- Custom calendar events collection (new lightweight type)

### Relationships
- All modules feed into event calendar
- Cast availability overlay
- Finance payment deadlines (optional overlay)

---

## Implementation Order (when approved)

1. **Attendance** — seed data + enhance existing stub pages
2. **Call Sheets** — enrich existing 95 records, build detail view
3. **Pre-Production** — enhance productionTasks into Kanban + checklist
4. **Production** — DPR builder on top of shootDays
5. **Post-Production** — enhance postProductionItems into pipeline view
6. **Event Calendar** — aggregate all above into unified calendar

---

## Shared Components (build once, reuse across sections)

- `StatusBadge` — generic colored badge
- `ProgressBar` — with percentage label
- `DateNavigator` — prev/next with calendar picker
- `PersonAvatar` — initials fallback
- `SectionTabBar` — consistent internal tab navigation
- `EmptyState` — consistent empty/placeholder UI
