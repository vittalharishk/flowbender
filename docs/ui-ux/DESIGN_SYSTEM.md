# Flowbender — Design System

**Date:** 2026-10-30

---

## Foundation

| Property | Value |
|---|---|
| **UI Framework** | shadcn/ui (47 primitives from Radix UI) |
| **CSS** | Tailwind CSS 3 with HSL CSS custom properties |
| **Theme** | Dark default (`defaultTheme="dark"`), light supported via class toggle |
| **Font** | Inter (Google Fonts, loaded via `next/font`) |
| **Icons** | Lucide React ^0.446.0 |
| **Animation** | `tailwindcss-animate` plugin |
| **Border radius** | `--radius: 0.5rem` (lg: 0.5rem, md: calc-2px, sm: calc-4px) |

---

## Colour Palette

All colours are HSL values defined as CSS custom properties on `:root` (light) and `.dark` (dark).

### Core tokens

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--background` | 0 0% 98% | 220 20% 7% | Page background |
| `--foreground` | 220 20% 10% | 0 0% 98% | Primary text |
| `--card` | 0 0% 100% | 220 18% 10% | Card surfaces |
| `--primary` | 24 80% 50% | 24 80% 50% | **Amber/orange — brand accent** |
| `--secondary` | 220 14% 96% | 220 15% 14% | Secondary surfaces |
| `--muted` | 220 14% 96% | 220 15% 14% | Muted backgrounds |
| `--destructive` | 0 84% 60% | 0 62% 30% | Error/danger |
| `--success` | 142 71% 45% | 142 71% 45% | Success states |
| `--warning` | 38 92% 50% | 38 92% 50% | Warning states |

### Sidebar tokens

| Token | Light | Dark |
|---|---|---|
| `--sidebar` | 220 20% 7% | 220 22% 5% |
| `--sidebar-foreground` | 220 10% 80% | 220 10% 80% |
| `--sidebar-accent` | 220 15% 14% | 220 15% 12% |
| `--sidebar-border` | 220 15% 16% | 220 15% 14% |

### Chart tokens

| Token | Light | Dark |
|---|---|---|
| `--chart-1` | 24 80% 50% (amber) | 24 80% 50% |
| `--chart-2` | 173 58% 39% (teal) | 160 60% 45% |
| `--chart-3` | 197 37% 24% (dark teal) | 30 80% 55% |
| `--chart-4` | 43 74% 66% (gold) | 280 65% 60% |
| `--chart-5` | 27 87% 67% (peach) | 340 75% 55% |

### Semantic colour usage (Tailwind classes)

The app uses colour extensively. Frequency in components and pages:

| Colour | Occurrences | Role |
|---|:-:|---|
| amber | 556 | **Primary brand**, accent borders, icons, gradients |
| emerald | 278 | Success, positive trends, completed states |
| red/rose | 173 | Errors, negative trends, destructive actions |
| blue | 158 | Information, development status |
| zinc | 120 | Neutral borders, disabled states |
| orange | 95 | Secondary brand, gradient endpoints |
| slate | 76 | Text on dark backgrounds, login page |
| violet/purple | 68 | Special accents, script/call-sheet icons |
| cyan | 31 | Post-production status badge |
| sky | 8 | Minimal usage |

### Production status colours

Defined in `components/app/production-badge.tsx`:

| Status | Background | Text | Border |
|---|---|---|---|
| development | blue-500/10 | blue-400 | blue-500/20 |
| pre-production | amber-500/10 | amber-400 | amber-500/20 |
| production | emerald-500/10 | emerald-400 | emerald-500/20 |
| post-production | cyan-500/10 | cyan-400 | cyan-500/20 |
| completed | slate-500/10 | slate-400 | slate-500/20 |
| on-hold | rose-500/10 | rose-400 | rose-500/20 |

---

## Typography

| Scale | Tailwind class | Occurrences | Typical use |
|---|---|:-:|---|
| xs | `text-xs` | 888 | Labels, badges, metadata, timestamps |
| sm | `text-sm` | 431 | Body text, form labels, descriptions |
| base | `text-base` | 64 | Card titles, section headers |
| lg | `text-lg` | 65 | Section titles, sidebar brand |
| xl | `text-xl` | 35 | Page subtitles |
| 2xl | `text-2xl` | 85 | Stat values, page titles, modal headers |
| 3xl | `text-3xl` | 19 | Dashboard hero numbers |
| 4xl | `text-4xl` | 2 | Landing page hero |

Font weights: `font-bold` (headings, stats), `font-semibold` (card titles), `font-medium` (labels, badges).

---

## Spacing and Layout

| Pattern | Value |
|---|---|
| Page padding | `p-3 sm:p-6` |
| Card padding | `p-4` to `p-5` |
| Card gap | `gap-4` to `gap-6` |
| Grid columns | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` |
| Sidebar width | 260px (expanded), 68px (collapsed) |
| Header height | `h-16` (64px) |
| Border radius | Mostly `rounded-lg` (179) and `rounded-xl` (169) |
| Max content width | None (full-width within sidebar offset) |

---

## Border Radius Distribution

| Class | Count | Usage |
|---|:-:|---|
| `rounded-lg` | 179 | Cards, inputs, dropdowns |
| `rounded-xl` | 169 | Stat cards, workspace sections |
| `rounded-full` | 154 | Avatars, badges, progress dots |
| `rounded-md` | 89 | Buttons, smaller elements |
| `rounded-sm` | 23 | Tight UI elements |
| `rounded-2xl` | 18 | Hero sections, large cards |

---

## Component Patterns

### Glass morphism
```css
.glass-card {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(220, 225, 235, 0.6);
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.04);
}
.dark .glass-card {
  background: rgba(18, 24, 38, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 24px -2px rgba(0, 0, 0, 0.4);
}
```

### Brand gradient
```
bg-gradient-to-r from-amber-500 to-orange-600
```
Used on primary CTAs, hero sections, the text-gradient utility.

### Stat Card
`components/app/stat-card.tsx` — reusable KPI tile:
- Icon in amber gradient box (`from-amber-500/15 to-orange-600/10`)
- Label (muted), value (2xl bold), optional trend
- Hover: `-translate-y-1`, amber glow shadow

### Page Placeholder
`components/app/page-placeholder.tsx` — "Module under development" state:
- Centred icon, title, description
- Construction icon footer

---

## shadcn/ui Components (47)

accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb, button, calendar, card, carousel, chart, checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu, form, hover-card, input, input-otp, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, skeleton, slider, sonner (toasts), switch, table, tabs, textarea, toast, toaster, toggle, toggle-group, tooltip

---

## Key Libraries

| Library | Version | Usage |
|---|---|---|
| next-themes | ^0.3.0 | Dark/light mode toggle via class |
| recharts | ^2.12.7 | Installed, only orphan usage |
| date-fns | ^3.6.0 | Date formatting throughout |
| react-hook-form | ^7.53.0 | Form validation in dialogs |
| zod | ^3.23.8 | Schema validation |
| cmdk | ^1.0.0 | Command palette (⌘K) |
| sonner | ^1.5.0 | Toast notifications |
| vaul | ^0.9.9 | Drawer component |
| embla-carousel-react | ^8.3.0 | Carousel |
| class-variance-authority | ^0.7.0 | Component variant styling |
| tailwind-merge | ^2.5.2 | Class deduplication |
| clsx | ^2.1.1 | Conditional classes |

---

## Design Principles (observed)

1. **Dark-first:** Default theme is dark. The amber/orange accent on dark charcoal creates a premium cinema feel.
2. **Glassmorphism:** Cards use translucent backgrounds with backdrop blur.
3. **Subtle interaction:** Hover lifts (`-translate-y-1`), amber glow shadows, smooth 200-300ms transitions.
4. **Dense information:** Small text (`text-xs` dominates), compact tables, many KPI tiles.
5. **Amber brand:** The primary colour is amber-500 (`hsl(24, 80%, 50%)`), used for icons, buttons, gradients, active states, and the brand gradient.
6. **Consistent elevation:** `border-border/50`, `bg-card/60`, `backdrop-blur-md` create depth without heavy shadows.
