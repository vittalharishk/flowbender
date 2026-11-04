# UI/UX Component Inventory — Flowbender ERP

**Date:** 2026-11-03

---

## Summary Statistics

- **Total component files:** ~115 (excluding components/ui/)
- **Total component lines:** ~42,000+
- **shadcn/ui primitives available:** 42 files
- **shadcn Table:** Used by 1 of 31 table-containing files
- **StatCard:** Exists but used by 0 modules (dead code)
- **Skeleton:** Exists, used by 2 files only
- **Breadcrumb:** Exists, used by 0 application components
- **window.confirm():** 18 occurrences (should be AlertDialog)
- **Inline gradient button:** 43 occurrences in 32 files (should be Button variant)
- **Badge instances:** 253 across 61 files, no standard color map

---

## Component Inventory by Directory

### components/ui/ — 42 shadcn primitives
Standard shadcn/ui: accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb, button, calendar, card, carousel, chart, checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu, form, hover-card, input, input-otp, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, skeleton, slider, sonner, switch, table, tabs, textarea, toast, toaster, toggle, toggle-group, tooltip.

### components/app/ — 12 files, ~1,095L
| File | Lines | Status |
|---|---|---|
| header.tsx | 339 | Keep — needs landmark cleanup |
| sidebar.tsx | 163 | Keep — add nav landmark |
| business-workspaces.tsx | 197 | Legacy module router — review for removal |
| mobile-sidebar.tsx | 95 | Keep — dedup rendering with sidebar.tsx |
| notifications-dropdown.tsx | 86 | Keep |
| project-selector.tsx | 84 | Keep — reuse in FilterBar |
| quick-action-grid.tsx | 72 | Keep |
| stat-card.tsx | 33 | Dead code — never imported. Extend and adopt or delete. |
| production-badge.tsx | 39 | Keep |
| page-placeholder.tsx | 23 | Keep — use as basis for EmptyState |
| business-project-picker.tsx | 16 | Thin wrapper — merge into project-selector |
| back-link.tsx | 14 | Keep |
| project-context-selector.tsx | 8 | Thin wrapper — evaluate |

### components/accounts/ — 6 files, ~4,350L
| File | Lines | Key Issues |
|---|---|---|
| accounts-workspace.tsx | 437 | Good structure, 8 KPI cards too dense (lg:grid-cols-8) |
| budget-management.tsx | 871 | Large — consider splitting |
| purchase-orders-workspace.tsx | 869 | Large — native tables |
| vendors-workspace.tsx | 799 | Only file using shadcn Table |
| insurance-workspace.tsx | 791 | Color-only status badges |
| expenses-register.tsx | 583 | Native tables, inline filters |

### components/cast/ — 10 files, ~4,198L
| File | Lines | Key Issues |
|---|---|---|
| availability-tab.tsx | 944 | Large — calendar-based |
| contracts-tab.tsx | 764 | Native tables |
| roles-probable-tab.tsx | 700 | Native tables |
| casting-dashboard-tab.tsx | 361 | OK |
| cast-profile.tsx | 355 | OK |
| add-cast-dialog.tsx | 303 | Duplicate layout with edit dialog |
| edit-cast-dialog.tsx | 303 | Duplicate layout with add dialog |
| cast-list-view.tsx | 266 | OK |
| cast-card.tsx | 107 | OK |
| cast-list-row.tsx | 95 | OK |

### components/crew/ — 11 files, ~6,317L
| File | Lines | Key Issues |
|---|---|---|
| rentals-workspace.tsx | 1,111 | Very large, native tables |
| art-workspace.tsx | 1,066 | Hardcoded dark colors (bg-slate-800) |
| crew-departments-workspace.tsx | 921 | Large |
| expenses-workspace.tsx | 894 | Large |
| locations-workspace.tsx | 840 | Large |
| vehicles-stunts-workspace.tsx | 558 | OK |
| crew-profile.tsx | 261 | OK |
| add-crew-dialog.tsx | 252 | OK |
| edit-crew-dialog.tsx | 244 | Duplicate layout with add dialog |
| crew-list-view.tsx | 230 | OK |
| crew-card.tsx | 110 | OK |

### components/schedule/ — 12 files, ~5,414L
| File | Lines | Key Issues |
|---|---|---|
| post-prod-pipeline.tsx | 906 | Complex board layout |
| master-calendar.tsx | 826 | OK |
| pre-prod-board.tsx | 731 | OK |
| production-dashboard.tsx | 710 | OK |
| attendance-tab.tsx | 694 | Grid-based |
| scene-stripboard.tsx | 604 | Drag-and-drop |
| schedule-list-view.tsx | 533 | Native tables |
| gantt-chart-view.tsx | 332 | Custom visualization |
| shoot-day-detail.tsx | 301 | OK |

### components/scripts/ — 11 files, ~5,681L
| File | Lines | Key Issues |
|---|---|---|
| reports-tab.tsx | 862 | Large |
| script-editor.tsx | 770 | Raw textarea, custom tabs |
| script-upload-dialog.tsx | 715 | Large |
| references-tab.tsx | 682 | Uses Skeleton (one of 2) |
| scenes-tab.tsx | 631 | OK |
| shot-division-tab.tsx | 617 | Uses Skeleton (one of 2) |
| analysis-tab.tsx | 592 | OK |
| locations-tab.tsx | 467 | OK |
| timeline-tab.tsx | 373 | OK |
| versions-tab.tsx | 354 | OK |
| version-compare.tsx | 219 | OK |

### components/reports/ — 14 files, ~2,462L
All follow consistent pattern: filters → KPI cards → charts → tables → CSV export.
Main issue: chart colors hardcoded, no chart accessibility.

### components/distribution/ — 2 files, ~990L
| File | Lines | Key Issues |
|---|---|---|
| distribution-workspace.tsx | 463 | Inline KpiCard, duplicated COLORS |
| project-distribution-workspace.tsx | 527 | Project-scoped CRUD |

### Monolithic components (>1,000L — candidates for splitting)
| File | Lines |
|---|---|
| crew/rentals-workspace.tsx | 1,111 |
| crew/art-workspace.tsx | 1,066 |
| media/media-management-workspace.tsx | 1,681 |
| equipment/equipment-workspace.tsx | 1,665 |

---

## Standardization Opportunities — Priority Matrix

### HIGH Priority (U2 — Design System phase)

| Component | Current State | Modules Affected | Action |
|---|---|---|---|
| Button "primary" variant | 43 inline gradient classes | ALL | Add variant to shadcn Button |
| StatusBadge | 253 usages, no color map | ALL with status display | Create shared component + color map |
| ConfirmDialog | 18× window.confirm() | ALL with delete actions | Replace with AlertDialog wrapper |
| PageHeader | 4 different patterns | ALL | Create shared component |
| StatCard | Dead code (0 imports) | Dashboard, Accounts, Distribution, Reports | Extend and adopt |
| DataTable | 30/31 use native HTML | ALL with tables | Adopt shadcn Table + wrapper |
| TabNav | 3 patterns (shadcn, hand-rolled, pills) | ALL tabbed pages | Standardize on shadcn Tabs |

### MEDIUM Priority (U3–U5)

| Component | Current State | Modules Affected | Action |
|---|---|---|---|
| FilterBar | 4 different patterns | Reports, Equipment, Distribution, Accounts | Composable shared filter |
| SearchInput | 2 patterns, inconsistent sizing | Projects, Equipment, Cast, Crew, Media | Shared wrapper with icon |
| EmptyState | 3 patterns, mostly plain text | ALL | Icon + title + description + action |
| ChartContainer | 22 inline ResponsiveContainer | Reports, Distribution | Wrapper with standard height + colors |
| FormDialog | Inconsistent dialog layouts | Cast, Crew, Accounts | Standardize header/body/footer |

### LOW Priority (U6+)

| Component | Current State | Action |
|---|---|---|
| IconBox | ~10 inline icon containers | Create with size variants |
| GradientProgress | ~8 inline progress bars | Extend shadcn Progress |
| ExportButton | Already consistent in Reports | Nice-to-have wrapper |
| ViewToggle | 2 implementations (Projects, Equipment) | Share if more modules need it |

---

## Dead / Unused Components

| Component | File | Action |
|---|---|---|
| StatCard | components/app/stat-card.tsx | Extend and adopt, or delete |
| Skeleton | components/ui/skeleton.tsx | Start using in loading states |
| Breadcrumb | components/ui/breadcrumb.tsx | Start using for deep routes |
| business-workspaces.tsx | components/app/business-workspaces.tsx | Legacy router — review for removal |
| business-project-picker.tsx | components/app/business-project-picker.tsx | Merge into project-selector |
| project-context-selector.tsx | components/app/project-context-selector.tsx | Evaluate need |

---

## Duplicated Code Patterns

| Pattern | Occurrences | Files | Fix |
|---|---|---|---|
| Gradient primary button | 43 | 32 files | Button "primary" variant |
| Icon box with gradient bg | ~10 | Headers across modules | IconBox component |
| Gradient progress bar | ~8 | Project cards, dashboards | GradientProgress |
| Add/Edit dialog pair | 4 files (Cast + Crew) | Cast, Crew | FormDialog wrapper |
| Hardcoded dark colors | 3 occurrences | crew/art-workspace.tsx | Replace with theme tokens |
| COLORS chart palette | 2 definitions | distribution-workspace, distribution-report | Shared constant |
