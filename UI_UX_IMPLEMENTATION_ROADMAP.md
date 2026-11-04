# UI/UX Implementation Roadmap — Flowbender ERP

**Date:** 2026-11-03

---

## Phase Overview

| Phase | Scope | Est. Effort | Dependencies |
|---|---|---|---|
| **U2** | Design system + shared components | HIGH | None |
| **U3** | Navigation, shell, legacy cleanup | MEDIUM | U2 |
| **U4** | Dashboard + Projects | LOW | U2 |
| **U5** | Script, Schedule, Cast, Crew, Production | HIGH | U2, U3 |
| **U6** | Accounts + Insurance | MEDIUM | U2, U3 |
| **U7** | Equipment, Media, VFX | MEDIUM | U2 |
| **U8** | Reports + Distribution | MEDIUM | U2 |
| **U9** | Responsive, accessibility, full regression | MEDIUM | U2–U8 |

---

## U2: Design System & Shared Components

**Goal:** Build the shared component library that all subsequent phases depend on.

### Deliverables
1. **Button "primary" variant** — Add gradient variant to shadcn Button, replace 43 inline occurrences
2. **StatusBadge component** — Centralized status→color map, replace 253 ad-hoc Badge usages
3. **ConfirmDialog component** — AlertDialog wrapper, replace 18 window.confirm() calls
4. **PageHeader component** — Icon + title + badge + subtitle + actions, replace 4 patterns
5. **StatCard component** — Extend existing dead-code StatCard, adopt in Dashboard/Accounts/Distribution/Reports
6. **DataTable component** — shadcn Table wrapper with sort, pagination, overflow, replace 30 native tables
7. **EmptyState component** — Icon + title + description + action, replace 3 patterns
8. **SearchInput component** — Input with Search icon, consistent sizing
9. **ChartContainer component** — ResponsiveContainer wrapper with CSS variable colors
10. **Chart color CSS variables** — Define in globals.css with dark mode overrides
11. **TD-01: Split types file** — Domain-specific type files with barrel re-export from lib/types.ts

### Rules
- No functional logic changes
- No data schema changes
- All existing imports must still work (barrel re-export for types)
- Each component must work in light and dark mode
- Maximum 3 agents

### Acceptance
- 0 window.confirm() in codebase
- 0 inline gradient button classes
- StatCard import count > 0
- Types split into domain files, barrel re-export intact
- TypeScript: 0 errors, production build passes

---

## U3: Navigation & Application Shell

**Goal:** Consistent navigation, landmarks, breadcrumbs, legacy cleanup.

### Deliverables
1. **Semantic landmarks** — `<nav>` on sidebar, `<main>` on content, `<header>` on header
2. **Skip-to-content link** — First focusable element in layout
3. **Breadcrumb integration** — Use existing shadcn Breadcrumb for routes ≥3 levels
4. **Sidebar group collapse** — Accordion-style collapsible groups
5. **Shared sidebar rendering** — Deduplicate mobile/desktop sidebar logic
6. **Command palette cleanup** — Remove emoji headings
7. **Loading skeleton** — Replace "Loading your workspace..." with skeleton layout
8. **TD-06: Legacy Finance** — Redirect `/dashboard/finance` to `/dashboard/accounts`, remove sidebar link
9. **URL consistency** — Redirect `/scripts` to `/dashboard/scripts`, `/call-sheets` to `/dashboard/call-sheets`
10. **Fix missing font file** — Resolve woff2 404

### Dependencies: U2 (PageHeader, Breadcrumb)

### Acceptance
- axe-core: 0 landmark violations
- /dashboard/finance redirects to /dashboard/accounts
- Sidebar groups collapse
- Breadcrumbs on all deep routes
- No woff2 404

---

## U4: Dashboard & Projects

**Goal:** Polish the entry points users see first.

### Deliverables
1. **Dashboard** — Adopt StatCard, loading skeletons, responsive shoot-days table
2. **Projects** — Adopt PageHeader, SearchInput, aria-labels, loading skeleton
3. **Remove redundant formatCurrency** wrapper
4. **Move projectTypeLabels** out of mock-data.ts

### Dependencies: U2 (StatCard, PageHeader, SearchInput, DataTable)

### Acceptance
- No min-w-[800px] on mobile, loading skeletons visible
- Search inputs have aria-label

---

## U5: Production Modules (Script, Schedule, Cast, Crew, DPR)

**Goal:** Standardize tabs, headers, and fix the worst FAIR-rated modules.

### Deliverables
1. **Cast** — Replace hand-rolled tabs with shadcn Tabs, adopt PageHeader, add empty states, project filter
2. **Script** — Replace hand-rolled tabs with shadcn Tabs, replace native select, add breadcrumbs
3. **Crew** — Fix double padding, adopt PageHeader, add project filter
4. **Schedule** — Simplify header (remove font-black), adopt PageHeader
5. **Production/DPR** — Remove external Unsplash images, remove duplicate clapperboard, adopt PageHeader
6. **Clean up no-op callbacks** in Cast

### Dependencies: U2 (TabNav, PageHeader, EmptyState), U3 (breadcrumbs)

### Acceptance
- 0 hand-rolled tab implementations
- No font-black in codebase (except design system doc)
- No external image dependencies
- No double padding

---

## U6: Accounts & Insurance

**Goal:** Improve readability of the densest financial module.

### Deliverables
1. **Accounts KPI grid** — Reduce to lg:grid-cols-4 or summary/detail toggle
2. **Remove text-[10px]** — Minimum text-xs everywhere
3. **Status badges** — Adopt shared StatusBadge (text + color, never color-only)
4. **Breadcrumbs** — Add for sub-navigation within Accounts
5. **Insurance** — Adopt shared EmptyState, StatusBadge, DataTable
6. **Replace native tables** with shared DataTable in all Accounts sub-workspaces

### Dependencies: U2 (StatusBadge, StatCard, DataTable), U3 (Breadcrumb)

### Acceptance
- No text below 12px in Accounts
- All status badges show text label
- Breadcrumbs on sub-navigation

---

## U7: Equipment, Media, VFX

**Goal:** Align the three A11 asset modules visually.

### Deliverables
1. **Equipment** — Add pagination, consolidate icon imports, adopt DataTable
2. **Media** — Split 1,681L component into sub-files (<500L each), adopt StatCard, DataTable
3. **VFX** — Adopt StatusBadge, add progress visualization, adopt DataTable
4. **Art workspace** — Replace hardcoded bg-slate-800 with theme tokens
5. **Align card layouts** across Equipment/Media/VFX

### Dependencies: U2 (StatusBadge, StatCard, DataTable)

### Acceptance
- No monolithic component files >800L
- Pagination on Equipment
- No hardcoded dark colors
- Consistent card layout across asset modules

---

## U8: Reports & Distribution

**Goal:** Polish the two newest modules.

### Deliverables
1. **Report pills mobile** — Collapse to Select dropdown on mobile, keep pills on desktop
2. **Chart accessibility** — aria-label on all charts, optional data table toggle
3. **Chart dark mode** — CSS variable colors, not hardcoded hex
4. **Distribution** — Adopt shared StatCard, EmptyState, ChartContainer
5. **Revenue pagination** — Add pagination for >20 records
6. **Share COLORS constant** — Single definition, imported by both report and workspace

### Dependencies: U2 (StatCard, EmptyState, ChartContainer)

### Acceptance
- All charts have aria-label
- No hardcoded hex chart colors
- Mobile: report categories in dropdown
- Revenue pagination present

---

## U9: Responsive, Accessibility & Full Regression

**Goal:** Final pass — catch everything, verify nothing broke.

### Deliverables
1. **Responsive audit** — Screenshot all pages at 375/768/1024/1440px, fix any overflow
2. **Accessibility scan** — axe-core on all pages, fix critical and serious violations
3. **Keyboard navigation** — Tab through every page, fix focus traps
4. **Dark mode audit** — Toggle theme on every page, fix broken colors
5. **Console clean** — No JS errors, fix warnings where possible
6. **Full regression** — All pages load, all tabs click, all CRUD works, all filters work
7. **Final documentation** — Update all ERP docs to reflect UI/UX changes

### Dependencies: U2–U8

### Acceptance
- axe-core: 0 critical, 0 serious violations
- No horizontal overflow at any viewport
- No JS errors in console
- All 272 existing tests still pass
- TypeScript: 0 errors, production build passes

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| DataTable migration breaks table layouts | MEDIUM | Migrate one module at a time, visual compare |
| shadcn Tabs replacement breaks tab state | MEDIUM | Test each tabbed page after migration |
| StatusBadge color map misses a status | LOW | Grep all Badge usages, verify coverage |
| Legacy Finance removal loses bookmarks | LOW | Redirect in place before removal |
| Types file split breaks imports | LOW | Barrel re-export ensures zero breaking changes |
| Large component splits introduce bugs | MEDIUM | TypeScript + visual verification |
| Chart CSS variables break colors | LOW | Test in both themes |

---

## Recommended Phase Order (confirmed)

The proposed U2→U9 order is correct based on dependency analysis:

1. **U2 first** — Everything depends on shared components
2. **U3 second** — Shell/nav changes affect all pages
3. **U4 next** — Dashboard/Projects are the entry point
4. **U5 before U6** — Production modules (Cast, Script) are worse-rated than Accounts
5. **U6 before U7** — Accounts is higher-traffic than asset modules
6. **U7 and U8 can run in parallel** — No dependencies between them
7. **U9 last** — Full regression after all changes

No reordering recommended.
