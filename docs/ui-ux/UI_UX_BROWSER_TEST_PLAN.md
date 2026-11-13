# UI/UX Browser Test Plan — Flowbender ERP

**Date:** 2026-11-03

---

## Current Testing State

| Category | Coverage |
|---|---|
| Store unit tests (vitest) | 206 tests passing |
| Insurance validation (standalone) | 66 tests passing |
| E2E / integration tests | None |
| Component tests | None |
| Visual regression tests | None |

---

## U1 Browser Audit Results (Puppeteer headless)

### Verified ✅
- 16/18 pages load with HTTP 200 and render content
- All 6 Distribution tabs click and render without errors
- All 12 Reports categories click and render without errors
- Charts render (48 SVGs on reports page)
- CSV export button present and clickable
- No horizontal overflow at 375px, 768px, 1024px, 1440px
- No JavaScript runtime errors
- Focus indicators work, tab navigation functional

### Issues Found
- Missing font file (woff2 404 on every page) — HIGH
- No /dashboard/insurance route (sub-tab only) — MEDIUM
- No /dashboard/dpr route (sub-module only) — MEDIUM
- Recharts defaultProps deprecation warnings — LOW
- No `<nav>` or `<main>` landmarks — MEDIUM

### Not Tested (limitations of headless audit)
- CRUD create/edit/delete flows
- Form validation and error display
- Filter interactions (date pickers, dropdowns, search filtering)
- Chart data accuracy
- CSV file content
- Color contrast
- Touch interactions
- Cross-browser (only Chromium)
- Performance metrics

---

## Test Plan by Phase

### U2: Design System & Shared Components
**What to test:** New shared components work correctly in isolation and when adopted.

| Test | Method | Acceptance |
|---|---|---|
| Button "primary" variant renders gradient | Visual check | Matches spec in light + dark |
| StatusBadge shows correct color for each status | Unit test + visual | All status→color mappings correct |
| ConfirmDialog replaces window.confirm | Grep for window.confirm = 0 | No window.confirm remaining |
| DataTable renders, sorts, paginates | Component test or manual | Headers, rows, pagination visible |
| PageHeader consistent across modules | Visual comparison | Same pattern everywhere |
| StatCard adopted where needed | Visual check | No inline KPI card patterns |

### U3: Navigation & Shell
| Test | Method | Acceptance |
|---|---|---|
| Sidebar nav landmark | axe-core or manual | `<nav>` present |
| Main content landmark | axe-core or manual | `<main>` present |
| Skip-to-content link | Keyboard test | Tab → skip link → main content |
| Breadcrumbs on deep routes | Manual nav | Breadcrumbs on ≥3-level routes |
| Legacy Finance redirect | Navigate to /dashboard/finance | Redirects to /dashboard/accounts |
| Sidebar group collapse | Click group headers | Groups collapse/expand |
| Command palette search | Ctrl+K → type → select | Navigates to correct page |

### U4: Dashboard & Projects
| Test | Method | Acceptance |
|---|---|---|
| Dashboard loading skeleton | Throttle network / manual | Skeleton visible before data |
| Shoot-days table responsive | 375px viewport | No forced horizontal scroll |
| Project search with aria-label | axe-core or inspect | aria-label present |
| Project grid/list toggle | Click toggle | View switches, aria-pressed correct |
| Project card budget text | Visual check | text-xs minimum, no text-[11px] |

### U5: Production Modules (Script, Schedule, Cast, Crew)
| Test | Method | Acceptance |
|---|---|---|
| Cast tabs → shadcn Tabs | Manual click all tabs | Consistent with Crew tabs |
| Cast tab keyboard nav | Arrow keys on tabs | Tabs switch via arrow keys |
| Script tabs → shadcn Tabs | Manual click all tabs | No hand-rolled tabs |
| Script breadcrumb | Navigate to script | Breadcrumb back to project |
| Crew no double padding | Visual check | Content not double-padded |
| Schedule header simplified | Visual check | No font-black, consistent with others |
| External images removed (Production) | Network tab | No Unsplash requests |

### U6: Accounts & Insurance
| Test | Method | Acceptance |
|---|---|---|
| Accounts KPI grid readable | Visual at 1024px | Cards not cramped |
| No text below 12px | Inspect elements | No text-[10px] |
| Status badges with text | Visual check | Color + text label on all badges |
| Accounts breadcrumbs | Navigate to sub-tabs | Breadcrumb trail visible |
| Insurance empty states | Clear data | Shared EmptyState component |

### U7: Equipment, Media, VFX
| Test | Method | Acceptance |
|---|---|---|
| Equipment pagination | Add >20 items | Pagination controls visible |
| Media component split | Code review | No file >500L |
| VFX status badges | Visual check | Consistent with Equipment |
| VFX progress visualization | Visual check | Pipeline progress visible |
| Art workspace dark theme | Toggle theme | No hardcoded slate-800 colors |

### U8: Reports & Distribution
| Test | Method | Acceptance |
|---|---|---|
| Report pills mobile | 375px viewport | Dropdown or wrapped pills |
| Chart colors in dark mode | Toggle theme | Colors visible and distinct |
| Chart aria-labels | Inspect | Every chart has aria-label |
| Distribution shared StatCard | Visual check | No inline KpiCard |
| Revenue pagination | Add >20 records | Pagination visible |
| CSV export content | Download + open | Correct headers and data |

### U9: Full Regression
| Test | Method | Acceptance |
|---|---|---|
| All pages load (16+) | Puppeteer suite | HTTP 200, content renders |
| All tabs click without error | Puppeteer suite | No JS errors |
| All CRUD flows | Manual per module | Create, edit, delete work |
| All filters | Manual per module | Filters narrow results correctly |
| Responsive at 4 viewports | Puppeteer screenshots | No overflow, readable |
| Dark mode | Toggle + screenshot all pages | No broken colors |
| Keyboard navigation | Tab through each page | Focus visible, no traps |
| axe-core scan all pages | Automated | 0 critical, 0 serious violations |
| Font file loaded | Network tab | No 404 on woff2 |
| No window.confirm | grep codebase | 0 occurrences |
| Console clean | Puppeteer console listener | No errors (warnings acceptable) |

---

## Recommended Test Tooling

### Already Available
- **vitest** — store unit tests (206 tests)
- **Puppeteer 25.11.0** — installed, used for U1 audit

### Recommended Additions
- **@axe-core/puppeteer** — automated accessibility scanning
- **puppeteer screenshot comparison** — visual regression (compare before/after screenshots)

### Not Recommended (scope too large for this phase)
- Full Playwright E2E suite — good long-term investment but too much setup for U2–U9
- Storybook — useful for component development but adds infrastructure

---

## Regression Risk Matrix

| Change | Risk | Mitigation |
|---|---|---|
| Replace window.confirm with AlertDialog | LOW — same user flow | Manual test delete flows |
| Replace native tables with shadcn Table | MEDIUM — layout may shift | Visual comparison per module |
| Replace hand-rolled tabs with shadcn Tabs | MEDIUM — state management differs | Test tab switching + content |
| Add Button "primary" variant | LOW — visual only | Visual check gradient matches |
| Remove Legacy Finance | LOW if redirect in place | Test /dashboard/finance redirects |
| Split monolithic components | MEDIUM — import paths change | TypeScript compilation |
| Add semantic landmarks | LOW — no visual change | axe-core scan |
