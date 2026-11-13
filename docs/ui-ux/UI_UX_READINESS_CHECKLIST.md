# UI/UX Readiness Checklist — Pre-Redesign Audit

**Date:** 2026-11-03 | **Scope:** All modules A2–A13 | **Purpose:** Identify visual, interaction, responsive, accessibility, and navigation issues before the dedicated UI/UX improvement phase.

---

## Module-by-Module Assessment

### A2–A9: Accounts (Budgets, Expenses, POs, Vendors, Insurance, Reconciliation)
- [x] Core CRUD functional
- [x] Financial calculations verified (13-source aggregation)
- [ ] **Visual:** Tab-heavy layout — budget workspace has 8+ tabs, can overwhelm users
- [ ] **Visual:** Dense data tables lack row hover highlights in some views
- [ ] **Responsive:** Wide tables (PO line items, vendor ledger) overflow on tablet
- [ ] **Accessibility:** Budget approval status badges rely on color alone (no icon/text differentiation)
- [ ] **Navigation:** Deep nesting — project → accounts → tab → sub-tab is 4 levels

### A10: Audit Infrastructure (No UI — documentation only)
- [x] N/A — no user-facing components

### A11: Production Asset Management (Equipment, Media, VFX)
- [x] Core CRUD functional
- [x] Status workflows implemented
- [ ] **Visual:** Workspace tabs (Equipment/Media/VFX) use different card layouts — inconsistent
- [ ] **Visual:** Allocation calendar lacks visual density indicators
- [ ] **Responsive:** Equipment allocation table needs horizontal scroll on mobile
- [ ] **Accessibility:** VFX shot status relies on color-coded badges without aria-labels
- [ ] **Interaction:** No bulk actions (e.g., bulk status change for media assets)

### A12: Reports & Analytics
- [x] 12 report categories functional
- [x] Filters and CSV export working
- [ ] **Visual:** Report category pills overflow horizontally — no wrap or dropdown fallback
- [ ] **Visual:** Charts use hardcoded colors — no dark mode palette adaptation
- [ ] **Responsive:** Side-by-side charts (PieChart + BarChart) stack poorly on mobile
- [ ] **Accessibility:** Charts (recharts) lack screen reader alternatives / data tables
- [ ] **Interaction:** No drill-down from chart segments to detail views
- [ ] **Interaction:** Export is CSV only — users may expect PDF/Excel

### A13: Distribution Management
- [x] 6-tab workspace functional
- [x] Rights deals, agreements, releases, revenue, settlements
- [ ] **Visual:** Overview tab KPI cards and charts may feel dense on first load
- [ ] **Visual:** Agreement status badges consistent with other modules — good
- [ ] **Responsive:** Territory bar chart labels truncate on narrow screens
- [ ] **Accessibility:** Revenue collection status uses color-only badges
- [ ] **Interaction:** No inline editing — all edits require dialog open
- [ ] **Navigation:** Distribution report accessible from both Distribution tab and Reports module — could confuse

---

## Cross-Module Issues

| # | Issue | Severity | Modules Affected |
|---|---|---|---|
| 1 | **Inconsistent card/table layouts** across workspaces | MEDIUM | A2–A9, A11, A13 |
| 2 | **Color-only status indicators** without text/icon fallback | MEDIUM | A2–A9, A11, A12, A13 |
| 3 | **No loading skeletons** — empty states flash before data loads | LOW | All |
| 4 | **Wide data tables** not responsive on mobile/tablet | MEDIUM | A2–A9, A11, A13 |
| 5 | **No breadcrumb navigation** in deep routes | LOW | A2–A9, A13 |
| 6 | **Dark mode chart colors** not adapted (hardcoded hex) | LOW | A12, A13 |
| 7 | **No keyboard shortcuts** for common actions | LOW | All |
| 8 | **Dialog-only editing** — no inline edit for quick changes | LOW | A11, A13 |
| 9 | **No empty state illustrations** — plain text "No data" messages | LOW | All |
| 10 | **Sidebar nav has 18 items** — may benefit from collapsible groups | MEDIUM | Global |

---

## Pre-Requisites Before UI/UX Phase

| # | Task | Status | Notes |
|---|---|---|---|
| 1 | Remove/redirect legacy Finance module (TD-06) | PENDING | Must fix — eliminates duplicate financial view |
| 2 | Verify all pages build and return 200 | DONE | Verified A13 |
| 3 | All stores functional with seed data | DONE | 86+ collections |
| 4 | TypeScript 0 errors | DONE | |
| 5 | Production build clean | DONE | |

---

## Recommended UI/UX Phase Priorities

1. **Design system standardization** — consistent card, table, badge, and dialog patterns
2. **Responsive audit** — ensure all workspaces work at 768px and 375px breakpoints
3. **Accessibility pass** — aria-labels, keyboard navigation, color+icon status indicators
4. **Chart dark mode** — adapt recharts color palettes to theme
5. **Navigation simplification** — breadcrumbs, collapsible sidebar groups, reduce nesting
6. **Loading states** — skeleton screens for data-heavy views
7. **Empty states** — illustrations and action prompts
