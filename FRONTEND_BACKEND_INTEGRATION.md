# Frontend / Backend Integration Status

**Date:** 2026-10-31  
**Status:** Frontend-only, mock-data-driven

---

## Current Architecture

This application is **100% frontend-only**. No backend, database, or external API integrations exist.

### Data layer
- All mock data lives in `data/flowbender-demo-data.json`
- Managed by `lib/app-data-store.ts` using React's `useSyncExternalStore`
- Changes persist in the **browser's localStorage** under the key `flowbender-app-data-v{APP_DATA_VERSION}`
- On version mismatch, `lib/flowbender-demo-seed.ts` provides the seed fallback

### Store pattern
- **Read**: `useAppDataSlice("collectionKey")` — reactive hook for components
- **Write**: `updateAppDataSlice("collectionKey", updaterFn)` — takes an updater function
- **Never use**: `getAppDataSlice()` inside React component renders (causes infinite re-renders)

### Current APP_DATA_VERSION: 18

---

## Collections (all in flowbender-demo-data.json)

| Collection | Records | Module |
|---|---:|---|
| projects | 7 | All |
| castMembers | 23 | Cast |
| castContracts | 23 | Cast |
| castCandidates | 56 | Cast |
| characterProfiles | — | Cast |
| artistAvailability | 4,168 | Cast |
| scenes | 33 | Script |
| scripts | 21 | Script |
| vfxShots | 5 | Script |
| locations | 12 | Schedule |
| crewMembers | 36 | Crew |
| shootDays | 96 | Schedule |
| scheduleEntries | 96 | Schedule |
| callSheets | 92 | Call Sheets |
| attendanceRecords | 514 | Attendance |
| cateringAdjustments | 0 | Attendance |
| productionTasks | 90 | Pre-Production |
| preProdChecklist | 196 | Pre-Production |
| richDprReports | 13 | Production |
| dprReports | 3 | Production (legacy sparse) |
| postProductionItems | 29 | Post-Production |
| postProdMilestones | 70 | Post-Production |
| calendarEvents | 37 | Event Calendar |
| deliverables | 22 | Post-Production |

---

## What is NOT integrated (future backend work)

- No server-side authentication or role-based access control
- No real file uploads (costume images use base64 client-side only)
- No email notifications for call sheet publishing
- No PDF generation server-side (print uses `window.print()`)
- No real-time collaboration
- No external calendar sync (Google Calendar, etc.)
- No payment gateway integrations
- No VFX pipeline API integrations

---

## Future backend integration points (when approved)

1. **Auth**: Replace mock Producer/PM accounts with JWT-based auth
2. **API**: REST or GraphQL endpoints replacing `app-data-store.ts`
3. **Database**: PostgreSQL or similar for persistent multi-user data
4. **File storage**: S3 or similar for script uploads, call sheet PDFs, costume photos
5. **Notifications**: Email/SMS for call sheet publishing, attendance reminders
6. **Calendar sync**: iCal export / Google Calendar API
