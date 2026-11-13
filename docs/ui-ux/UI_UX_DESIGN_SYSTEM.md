# UI/UX Design System — Flowbender ERP

**Version:** 1.0 (Proposed) | **Date:** 2026-11-03

---

## Design Philosophy

Flowbender is a film-production ERP handling dense operational data — schedules, budgets, contracts, crew, equipment, distribution. The design system must:

1. **Respect information density** — production managers need data-rich views, not marketing pages
2. **Establish clear hierarchy** — distinguish KPIs from detail, actions from navigation
3. **Be restrained with color** — use color purposefully for status, not decoration
4. **Maintain professional tone** — no emojis in UI, no playful animations, clean typography
5. **Work at every viewport** — desktop is primary, but tablet and mobile must be usable

---

## Color Palette

### Brand Colors
| Token | Light | Dark | Usage |
|---|---|---|---|
| `--brand-primary` | `#f59e0b` (amber-500) | `#f59e0b` | Primary actions, active states |
| `--brand-primary-hover` | `#d97706` (amber-600) | `#d97706` | Hover on primary |
| `--brand-gradient` | `amber-500 → orange-600` | `amber-500 → orange-600` | Primary buttons, progress bars |

### Status Colors (standardized across all modules)
| Status Category | Color | Token | Used For |
|---|---|---|---|
| Success / Active / Signed / Completed | Emerald | `--status-success` | Active policies, signed deals, completed scenes |
| Warning / Pending / Negotiating / In-progress | Amber | `--status-warning` | Pending approvals, negotiations, work in progress |
| Error / Overdue / Terminated / Cancelled | Red | `--status-error` | Overdue payments, terminated agreements, cancelled items |
| Info / Draft / Planned | Blue | `--status-info` | Draft documents, planned releases |
| Neutral / Expired / Closed | Gray | `--status-neutral` | Expired policies, archived items |

### Chart Palette (dark-mode safe)
```
Primary series:  #f59e0b, #3b82f6, #10b981, #ef4444, #8b5cf6, #ec4899, #06b6d4, #84cc16
```
These must be defined as CSS variables and referenced by charts, not hardcoded as hex strings.

---

## Typography

### Scale (Tailwind classes only — no custom pixel sizes)
| Element | Class | Size | Usage |
|---|---|---|---|
| Page title | `text-2xl font-bold` | 24px | Module headings |
| Section title | `text-lg font-semibold` | 18px | Card titles, section headers |
| Subsection | `text-sm font-semibold` | 14px | Table headers, group labels |
| Body | `text-sm` | 14px | Default text |
| Caption | `text-xs text-muted-foreground` | 12px | Labels, timestamps, metadata |
| Micro | `text-[11px] text-muted-foreground` | 11px | Only for dense KPI sub-labels (Accounts) — avoid elsewhere |

**Rules:**
- `font-black` is banned — use `font-bold` for headings
- `text-[10px]` is banned — minimum readable size is `text-xs` (12px)
- `text-3xl` only on the main dashboard hero — all module pages use `text-2xl`

---

## Spacing

### Page Layout
| Context | Spacing |
|---|---|
| Between page sections | `space-y-6` |
| Between cards in a grid | `gap-4` |
| Card internal padding | `p-4` (standard) or `p-3` (compact KPI cards) |
| Page max width | `max-w-[1400px] mx-auto` (all pages) |

### Grid Breakpoints
| Items | Breakpoints |
|---|---|
| KPI cards (3-4) | `grid-cols-2 lg:grid-cols-4` |
| KPI cards (6+) | `grid-cols-2 md:grid-cols-3 lg:grid-cols-6` (never lg:grid-cols-8) |
| Content cards | `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` |

---

## Component Standards

### PageHeader
Every module page uses a consistent header:
```
[Icon (optional)] Title [Badge (optional)]
Subtitle text
                                          [Action Button (optional)]
```
- Icon: 40×40 rounded-lg with brand gradient background, module-specific lucide icon
- Title: `text-2xl font-bold`
- Subtitle: `text-sm text-muted-foreground`
- Action button: right-aligned, primary variant

### StatCard (KPI)
```
[Icon (optional)]
Label (text-xs text-muted-foreground)
Value (text-xl font-semibold)
Trend (optional, text-xs with up/down indicator)
```
- Padding: `p-4`
- Border: `border border-border`
- No gradient backgrounds on stat cards

### StatusBadge
All status indicators use `<Badge variant="outline">` with consistent color mapping:
- Text + border color from the status color token
- Background: status color at 10% opacity
- Always include text label (never color-only)

### DataTable
All data tables use the shadcn `<Table>` component with:
- `overflow-x-auto` wrapper
- Consistent header: `text-muted-foreground font-medium text-xs`
- Row hover: `hover:bg-muted/50`
- Pagination for >20 rows
- Sort indicators where applicable

### FilterBar
Composable filter bar with optional slots:
- Project selector (Select)
- Date range (from/to inputs)
- Department filter (Select)
- Status filter (Select)
- Search input (with Search icon)
- Export button (right-aligned)

### Tabs
All tabbed interfaces use shadcn `<Tabs>/<TabsList>/<TabsTrigger>`:
- No hand-rolled border-b-2 tabs
- No custom pill-button tabs
- Tab overflow: `flex-wrap h-auto` for many tabs (wraps to next line)

### EmptyState
```
[Icon (lucide, text-muted-foreground, w-12 h-12)]
Title (text-lg font-semibold)
Description (text-sm text-muted-foreground)
[Action Button (optional)]
```
- Centered, padded `py-12`

### ConfirmDialog
All destructive operations use AlertDialog (never `window.confirm()`):
- Title: action description
- Description: consequence explanation
- Cancel + Destructive action buttons

### Buttons
| Variant | Usage | Style |
|---|---|---|
| `default` | Secondary actions | shadcn default |
| `primary` | Primary actions (Add, Save, Create) | `bg-gradient-to-r from-amber-500 to-orange-600 text-white` |
| `outline` | Tertiary actions, filters | shadcn outline |
| `destructive` | Delete, remove, terminate | shadcn destructive |
| `ghost` | Icon-only buttons, nav items | shadcn ghost |

---

## Accessibility Standards

### Required
- Skip-to-content link in layout
- `<nav>` landmark for sidebar
- `<main>` landmark for content area
- `<header>` landmark for app header
- `aria-label` on all inputs (not just placeholder)
- `role="tablist"` / `role="tab"` on all tab interfaces (shadcn Tabs provides this)
- Focus-visible ring on all interactive elements
- Status badges must include text label (never color-only)

### Charts
- Every chart container gets `aria-label` describing what the chart shows
- Provide a data table alternative (collapsed by default, expandable)

---

## Responsive Strategy

### Breakpoints
| Width | Target | Approach |
|---|---|---|
| <640px (sm) | Mobile | Single column, collapsed sidebar, simplified tables |
| 640–1024px (md) | Tablet | 2-column grids, full sidebar in sheet |
| 1024–1280px (lg) | Desktop | Full layout, 3-4 column grids |
| >1280px (xl) | Wide | max-w-[1400px] centered |

### Tables on Mobile
- Wrap in `overflow-x-auto` (always)
- Remove `min-w-[...]` constraints where possible
- For critical tables: consider card-based mobile layout

### Tab Overflow
- Use `flex-wrap h-auto` (wraps) not `overflow-x-auto` (scrolls) for ≤8 tabs
- For >8 tabs: use a Select dropdown on mobile, pills on desktop

---

## Dark Mode

All color values must work in both light and dark mode:
- Use Tailwind's semantic colors (`text-foreground`, `bg-background`, `border-border`)
- Never hardcode `bg-slate-800` or `text-white` — these break in light mode
- Chart colors defined as CSS variables with dark-mode overrides
- Status badge backgrounds use `bg-{color}-500/10` (works in both themes)
