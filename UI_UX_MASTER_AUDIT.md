# UI/UX Master Audit — Flowbender ERP

**Audit Date:** 2026-11-03 | **Scope:** All modules A2–A13 + global shell
**Method:** Code inspection + Puppeteer 25.11.0 headless browser testing

---

## Overall Quality Assessment

**Rating: FAIR-TO-GOOD** — Functionally complete but visually inconsistent across modules.

The application has strong functional depth (26 complete modules, 272 passing tests, clean TypeScript and production builds) but lacks a unified design language. Each module was built in isolation, resulting in 3–4 competing patterns for every major UI element (headers, cards, tabs, tables, badges, filters).

**Strengths:**
- Functional completeness — every module works
- Dark/light theme support via Tailwind
- Responsive sidebar with mobile sheet fallback
- Command palette (Ctrl+K) — excellent power-user feature
- recharts integration for data visualization
- CSV export across all 12 report categories

**Weaknesses:**
- No shared component library beyond shadcn primitives
- 3 different tab patterns, 4 header patterns, 4 KPI card patterns
- 18 destructive operations use `window.confirm()` instead of AlertDialog
- shadcn Table used by 1 of 31 table-containing files
- StatCard and Skeleton components exist but are never imported
- No semantic landmarks (`<nav>`, `<main>`)
- Hard-coded chart colors that don't adapt to dark mode
- Missing font file (woff2 404 on every page)

---

## Module Ratings

| Module | Rating | Critical Issues |
|---|---|---|
| Dashboard / Home | GOOD | No loading state, shoot-day table not responsive |
| Projects (A2) | GOOD | No aria-labels on search, no loading skeleton |
| Script (A3) | FAIR | Hand-rolled tabs, URL pattern inconsistency, raw textarea, no breadcrumbs |
| Schedule (A4) | GOOD | Overdesigned header (font-black unique), no project filter |
| Cast (A5) | FAIR | Hand-rolled tabs (inconsistent with shadcn Tabs elsewhere), no project filter |
| Crew (A6) | FAIR | Double padding, no project filter, no lazy tab loading |
| Accounts (A7) | GOOD | Too-dense KPI cards (8 cols), color-only badges, deep nesting |
| Insurance (A8) | GOOD | Color-only statuses, plain text empty states |
| Production/DPR (A9) | FAIR | External Unsplash images, thin store, duplicate clapperboard |
| Equipment (A11) | GOOD | Sheet vs Dialog inconsistency, no pagination, 35+ lucide imports |
| Media (A11) | FAIR | 1,681-line monolithic component, inconsistent card layout |
| VFX (A11) | FAIR | Different badge pattern, no visual progress indicators |
| Reports (A12) | GOOD | 12 pills overflow on mobile, hardcoded chart colors, no chart a11y |
| Distribution (A13) | GOOD | Inline KpiCard, duplicated COLORS array, no empty state illustrations |

**GOOD:** 8 modules | **FAIR:** 6 modules

---

## Cross-Module Inconsistencies (10 found)

### 1. Tab Implementation (CRITICAL)
- **shadcn Tabs:** Crew, Schedule, Production, Distribution, Accounts
- **Hand-rolled border-b-2:** Cast (5 tabs)
- **Pill buttons:** Reports (12 categories)
- **Impact:** Inconsistent keyboard navigation, ARIA roles, visual treatment

### 2. Page Headers (HIGH)
- Plain h1+p (Cast, Crew)
- h1+p+action button (Projects)
- Badge+icon+h1+p (Schedule — overdesigned)
- Gradient icon box+h1+badge+p (Reports)

### 3. KPI/Stat Cards (HIGH)
- StatCard component exists but is used by zero modules (dead code)
- Inline Card+CardContent p-4 (Reports, Distribution)
- Grid stat blocks (Accounts, Schedule)
- No KPI cards (Cast, Crew, Equipment, Media, VFX)

### 4. Status Badge Colors (MEDIUM)
- 253 Badge usages across 61 files, no standard color map
- Each module assigns colors inline with template literals

### 5. Empty States (MEDIUM)
- Projects has icon+heading+message (best pattern)
- Most modules: plain text "No data found"
- Skeleton component exists but is never imported

### 6. Data Tables (MEDIUM)
- shadcn Table used by 1 of 31 table-containing files
- 30 files use native HTML tables with inconsistent header styles

### 7. Search Implementation (MEDIUM)
- 2 patterns, 15 instances, inconsistent sizing (w-48 vs full-width, h-8 vs h-9)

### 8. Confirmation Dialogs (MEDIUM)
- 18 `window.confirm()` calls — no consistent UX, no focus management

### 9. Dialog vs Sheet (LOW)
- Equipment uses Sheet (side drawer) for details
- Cast/Crew use Dialog — inconsistent detail view pattern

### 10. URL Pattern (LOW)
- Most pages under `/dashboard/*`
- Scripts at `/scripts`, Call Sheets at `/call-sheets` — breaks convention

---

## Browser Testing Results

### Pages (16/18 load successfully)
- `/dashboard/insurance` — 404 (sub-tab within Accounts)
- `/dashboard/dpr` — 404 (sub-module within Production)
- All other pages return 200 with correct content

### Functional Tests
- Distribution: All 6 tabs click and render ✅
- Reports: All 12 categories click and render ✅
- Charts: 48 SVGs rendered on reports page ✅
- CSV export: Button present and clickable ✅
- No JavaScript runtime errors ✅

### Console Issues
- **HIGH:** Missing font file (woff2 404 on every page)
- **LOW:** Recharts defaultProps deprecation warnings (known v2.x issue)

### Responsive (no horizontal overflow at any viewport)
- 375px ✅ | 768px ✅ | 1024px ✅ | 1440px ✅

---

## Accessibility Issues (7 found)

| # | Severity | Issue |
|---|---|---|
| E1 | MEDIUM | Missing aria-labels on search inputs (rely on placeholder only) |
| E2 | MEDIUM | Color-only status indicators (no icon fallback) in Accounts, VFX, Distribution |
| E3 | HIGH | No skip-to-content link |
| E4 | MEDIUM | Charts lack aria-label or data table alternatives |
| E5 | MEDIUM | Custom tab buttons (Cast) lack visible focus ring and ARIA roles |
| E6 | LOW | Stat cards use div where dl semantics would be appropriate |
| E7 | HIGH | No semantic landmarks (nav, main, header elements) |

---

## Responsive Issues (6 found)

| # | Issue | Affected Modules |
|---|---|---|
| F1 | Wide tables with min-width constraints force inner scroll | Accounts, Distribution, Reports |
| F2 | Dashboard shoot-days table: min-w-[800px] | Dashboard |
| F3 | Accounts KPI grid: lg:grid-cols-8 crushes cards | Accounts |
| F4 | 12 report category pills overflow without scroll indicator | Reports |
| F5 | Crew page adds own p-4/p-6, double-padding with layout | Crew |
| F6 | Chart labels overlap/cut off at small sizes | Reports, Distribution |

---

## Typography & Spacing Inconsistencies

- Custom pixel sizes: `text-[10px]`, `text-[11px]` used alongside Tailwind scale
- Heading weights: `font-black` used only in Schedule, `font-bold` everywhere else
- Section spacing: varies between `space-y-4`, `space-y-6`, `space-y-8`
- Card padding: varies between `p-3`, `p-4`, `p-6` with no system
- Max width: some pages use `max-w-[1400px]`, others stretch full width

---

## Technical Debt Impact on UI/UX

| Item | Status | UI Impact | Recommendation |
|---|---|---|---|
| TD-01: Monolithic types (2,366L) | Active | DX only | Split in U2 via barrel re-export |
| TD-03: Dual scene model | Active | Potential user confusion | Document boundary, defer unification |
| TD-06: Legacy Finance overlap | Active | CRITICAL — two sidebar items for similar data | Redirect in U3, remove in U4 |
| TD-08: No E2E tests | Active | Can't verify UI changes | Add critical-path E2E in U9 |

---

## Not Tested (requires manual verification)

- CRUD create/edit/delete flows within each module
- Form validation error display and required field enforcement
- Filter functionality (date pickers, dropdowns, search)
- Chart data accuracy
- CSV file content correctness
- Color contrast ratios
- Touch/mobile gestures
- Cross-browser (only Chromium tested)
- Print styles
- Performance metrics
