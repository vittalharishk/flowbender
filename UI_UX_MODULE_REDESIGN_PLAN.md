# UI/UX Module Redesign Plan — Flowbender ERP

**Date:** 2026-11-03

---

## Global Shell

### Current Condition: GOOD
Sidebar, header, and layout work well. Mobile sidebar via Sheet.

### Problems
1. No `<nav>`, `<main>`, `<header>` landmark elements
2. No skip-to-content link
3. No breadcrumbs for deep routes (e.g., /dashboard/projects/p1/accounts)
4. Command palette uses emoji headings (⚡🎬📁) — unprofessional
5. Digital Clapperboard button has `animate-pulse` — visually distracting
6. Sidebar: 18 items in 5 groups, no collapsible sections
7. Mobile sidebar duplicates rendering logic with desktop sidebar
8. Layout loading state is plain text — no skeleton/spinner
9. `overflow-x-hidden` on main masks overflow instead of fixing it

### Proposed Improvements
- Add semantic landmarks (`<nav>`, `<main>`, `<header>`)
- Add skip-to-content link
- Add Breadcrumb component for routes ≥3 levels deep
- Remove emoji from command palette headings
- Replace animate-pulse with subtle indicator or remove
- Make sidebar groups collapsible (accordion)
- Extract shared sidebar rendering for mobile/desktop
- Add loading skeleton to layout

### Priority: HIGH (U3)
### Dependencies: Shared components from U2
### Acceptance: Landmarks pass axe-core, breadcrumbs on all deep routes, sidebar groups collapse

---

## Dashboard / Home

### Current Condition: GOOD
### Problems
1. No loading state while data loads
2. Shoot-days table uses `min-w-[800px]` — forces scroll
3. `formatCurrency` redundant wrapper
4. Quick links hardcoded to 3 items

### Proposed Improvements
- Add loading skeletons for stat cards and tables
- Make shoot-days table responsive (card layout on mobile or remove min-width)
- Remove redundant formatCurrency wrapper
- Adopt shared StatCard, DataTable components

### Priority: MEDIUM (U4)
### Dependencies: StatCard, DataTable from U2
### Acceptance: No horizontal scroll on mobile, loading skeleton visible

---

## Projects (A2)

### Current Condition: GOOD
### Problems
1. Search input: no aria-label
2. Filter labels may have low contrast (`text-xs text-muted-foreground`)
3. `text-[11px]` budget labels — too small
4. View toggle lacks aria-pressed
5. No loading skeleton
6. `projectTypeLabels` imported from mock-data.ts

### Proposed Improvements
- Add aria-label to search
- Adopt shared SearchInput, PageHeader, DataTable
- Replace `text-[11px]` with `text-xs`
- Add aria-pressed to view toggle
- Move type labels out of mock-data

### Priority: MEDIUM (U4)
### Dependencies: SharedSearchInput, PageHeader from U2
### Acceptance: All inputs have labels, no custom pixel sizes

---

## Script (A3)

### Current Condition: FAIR
### Problems
1. Hand-rolled tabs (border-b-2) — inconsistent with shadcn Tabs
2. 8+ tabs overflow on mobile — no handling
3. Raw `<textarea>` — no formatting
4. Native `<select>` instead of shadcn Select
5. URL at `/scripts` instead of `/dashboard/scripts`
6. No breadcrumb back to project
7. Custom font sizes (`text-[11px]`)

### Proposed Improvements
- Replace hand-rolled tabs with shadcn Tabs (flex-wrap for overflow)
- Replace native select with shadcn Select
- Add breadcrumb navigation
- Standardize font sizes
- Consider URL migration to `/dashboard/scripts` (redirecting old URL)

### Priority: HIGH (U5)
### Dependencies: TabNav standardization from U2
### Acceptance: shadcn Tabs used, no custom tabs, breadcrumbs present

---

## Schedule (A4)

### Current Condition: GOOD
### Problems
1. Header overdesigned — `font-black` unique to this module, badge + icon redundant
2. No project filter on global schedule page

### Proposed Improvements
- Adopt shared PageHeader (remove font-black, simplify)
- Add project filter

### Priority: LOW (U5)
### Dependencies: PageHeader from U2
### Acceptance: Header matches other modules

---

## Cast (A5)

### Current Condition: FAIR
### Problems
1. Hand-rolled tabs with border-amber-500 — differs from shadcn Tabs
2. No ARIA tablist/tab roles or arrow key navigation
3. Simple header (no icon, badge, or breadcrumb)
4. `onCastAdded={() => undefined}` — no-op callback
5. No project filter, no loading/empty states

### Proposed Improvements
- Replace hand-rolled tabs with shadcn Tabs
- Adopt shared PageHeader
- Add proper empty states
- Add project filter
- Clean up no-op callbacks

### Priority: HIGH (U5)
### Dependencies: TabNav, PageHeader, EmptyState from U2
### Acceptance: shadcn Tabs, proper ARIA roles, empty states

---

## Crew (A6)

### Current Condition: FAIR
### Problems
1. Double padding (page p-4/p-6 + layout p-3/p-6)
2. Simple header — no icon, no count badges
3. Heavy initial render (6 full workspace components)
4. No lazy loading of tab content
5. No project filter

### Proposed Improvements
- Remove page-level padding (layout provides it)
- Adopt shared PageHeader
- Add project filter
- Consider React.lazy for tab content

### Priority: MEDIUM (U5)
### Dependencies: PageHeader from U2
### Acceptance: No double padding, header consistent

---

## Accounts (A7)

### Current Condition: GOOD (most complex module)
### Problems
1. 8 KPI cards at `lg:grid-cols-8` — too cramped
2. `text-[10px]` and `text-[11px]` — below minimum
3. Color-only status badges
4. Deep nesting (sidebar → Accounts → tab → sub-workspace tabs)
5. No breadcrumbs

### Proposed Improvements
- Reduce KPI grid to `lg:grid-cols-4` with 2-row layout or summary/detail toggle
- Replace custom pixel sizes with `text-xs`
- Adopt shared StatusBadge (text + color)
- Add breadcrumbs for sub-navigation
- Adopt shared DataTable for all tables

### Priority: MEDIUM (U6)
### Dependencies: StatCard, StatusBadge, DataTable, Breadcrumb from U2/U3
### Acceptance: No text below 12px, status badges have text labels

---

## Insurance (A8)

### Current Condition: GOOD
### Problems
1. Color-only statuses (active=green, expired=red, pending=yellow)
2. Plain text empty states
3. Table header style inconsistent with other modules

### Proposed Improvements
- Adopt shared StatusBadge
- Adopt shared EmptyState
- Adopt shared DataTable

### Priority: LOW (U6)
### Dependencies: StatusBadge, EmptyState, DataTable from U2
### Acceptance: Consistent with Accounts module

---

## Production/DPR (A9)

### Current Condition: FAIR
### Problems
1. Uses Unsplash external images — external dependency
2. Thin DPR/Pre-Prod stores
3. Clapperboard duplicated (header + production page)

### Proposed Improvements
- Replace Unsplash images with local assets or remove
- Remove duplicate clapperboard (keep only in header)
- Adopt shared PageHeader

### Priority: MEDIUM (U5)
### Dependencies: PageHeader from U2
### Acceptance: No external image dependencies

---

## Equipment (A11)

### Current Condition: GOOD
### Problems
1. Uses Sheet (side drawer) for details — other modules use Dialog
2. No pagination (all items render at once)
3. 35+ lucide imports
4. Grid/list toggle similar to Projects but separate implementation

### Proposed Improvements
- Standardize on Dialog for detail views (or document Sheet as the pattern for asset browsing)
- Add pagination for >20 items
- Consolidate icon imports
- Share ViewToggle with Projects

### Priority: LOW (U7)
### Dependencies: DataTable from U2
### Acceptance: Pagination present, icon imports reduced

---

## Media (A11)

### Current Condition: FAIR
### Problems
1. 1,681-line monolithic component
2. Different card layout from Equipment
3. No shared KPI card pattern

### Proposed Improvements
- Split into sub-components (tabs as separate files)
- Align card layout with Equipment
- Adopt shared StatCard, DataTable

### Priority: MEDIUM (U7)
### Dependencies: StatCard, DataTable from U2
### Acceptance: Component split into <500L files

---

## VFX (A11)

### Current Condition: FAIR
### Problems
1. Different status badge pattern from Equipment
2. No charts or visual progress indicators
3. Table-only workflow view

### Proposed Improvements
- Adopt shared StatusBadge
- Add progress bar visualization for shot pipeline
- Adopt shared DataTable

### Priority: MEDIUM (U7)
### Dependencies: StatusBadge, DataTable from U2
### Acceptance: Status badges consistent with Equipment

---

## Reports (A12)

### Current Condition: GOOD
### Problems
1. 12 category pills overflow on mobile — hidden items not indicated
2. Chart colors hardcoded hex — no dark mode adaptation
3. Charts lack aria-label or data table alternatives
4. No loading state between tab switches

### Proposed Improvements
- Mobile: collapse pills into Select dropdown, desktop: keep pills
- Move chart colors to CSS variables
- Add aria-label to all chart containers
- Add optional data table toggle for accessibility
- Add brief loading indicator on tab switch

### Priority: MEDIUM (U8)
### Dependencies: ChartContainer from U2
### Acceptance: All charts have aria-label, mobile pill overflow solved

---

## Distribution (A13)

### Current Condition: GOOD
### Problems
1. KpiCard defined inline — not shared
2. COLORS array duplicated from distribution-report.tsx
3. Same hardcoded chart colors as Reports
4. No empty state illustrations
5. Revenue tab lacks pagination

### Proposed Improvements
- Adopt shared StatCard
- Share COLORS constant (or use CSS variables)
- Adopt shared EmptyState
- Add pagination for revenue records

### Priority: MEDIUM (U8)
### Dependencies: StatCard, EmptyState, ChartContainer from U2
### Acceptance: Shared components adopted, pagination on revenue
