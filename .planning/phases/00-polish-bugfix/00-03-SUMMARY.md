---
phase: 00-polish-bugfix
plan: 03
subsystem: ui
tags: [tailwind, token-migration, design-system, react, nextjs]

# Dependency graph
requires:
  - phase: 00-01
    provides: Card, Input, Textarea UI primitives with Tailwind token classes
  - phase: 00-02
    provides: canonical Review type and rating pipeline audit
provides:
  - Full Tiramisu token migration across all 9 app files
  - Zero JS hover/focus style mutation handlers in any page or component
  - Card/Input/Textarea components wired into all pages that use forms or cards
  - Build-clean, TypeScript-clean codebase ready for Phase 1 architecture work
affects: [phase-1-foundation, all-frontend-phases]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Tailwind token classes replace all inline hex color values (bg-espresso, text-caramel, etc.)"
    - "hover: variants replace all onMouseEnter/onMouseLeave style mutation handlers"
    - "focus:ring-2 focus:ring-caramel via Input/Textarea components replace onFocus/onBlur style handlers"
    - "Card variant=interactive replaces JS-driven shadow/transform hover effects"

key-files:
  created: []
  modified:
    - src/components/Navbar.tsx
    - src/components/StarRating.tsx
    - src/app/page.tsx
    - src/app/auth/login/page.tsx
    - src/app/auth/register/page.tsx
    - src/app/explore/page.tsx
    - src/app/place/[slug]/page.tsx
    - src/app/profile/page.tsx
    - src/app/new/page.tsx

key-decisions:
  - "onFocus/onBlur functional handlers (show dropdown, hide suggestions) are NOT style mutations — kept as-is"
  - "StarRating onMouseLeave for setHover(null) is functional state management — not a style mutation handler"
  - "rgba() values for semi-transparent overlays kept inline (cannot express as Tailwind tokens)"
  - "CAT_GRADIENT map and hero gradient kept inline per the documented gradient exception rule"
  - "boxShadow with rgba() values kept inline where they provide depth effects not achievable with shadow-sm/shadow-md alone"

patterns-established:
  - "Token migration: #C08552 → text-caramel/bg-caramel, #4B2E2B → text-espresso, #8C5A3C → text-coffee, etc."
  - "Card variant=default for info/form cards; variant=interactive for clickable place/review cards"
  - "Input component for all text/email/password/date inputs; Textarea for multi-line fields"
  - "select element uses w-full px-4 py-3 rounded-xl bg-warmgray-100 text-espresso border-warmgray-300 focus:ring-caramel pattern (no shared Select component)"

requirements-completed: [PLSH-01, PLSH-03]

# Metrics
duration: 15min
completed: 2026-03-13
---

# Phase 00 Plan 03: Token Migration Final Sweep Summary

**Complete Tiramisu palette token migration across all 9 files — zero onMouseEnter/onMouseLeave/onFocus/onBlur style mutation handlers, Card/Input/Textarea wired into all relevant pages, build exits 0**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-13T18:30:00Z
- **Completed:** 2026-03-13T18:45:00Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments
- Navbar and StarRating fully migrated: all inline hex replaced with token classes, all JS hover handlers removed
- Auth pages (login, register) now use Input component with zero style constants or focus handlers
- Home page, explore, place detail, profile, and new pages fully migrated to token classes
- Card component wired into explore (place tiles), place detail (info + review form), profile (all sections), and new (form wrapper)
- Input/Textarea components used in all form pages replacing inline style objects
- `npm run build` exits 0, `npx tsc --noEmit` exits 0

## Task Commits

1. **Task 1: Migrate Navbar and StarRating** - `374b5e5` (feat)
2. **Task 2: Migrate auth pages and home page** - `7297885` (feat)
3. **Task 3: Migrate explore, place, profile, and new pages** - `844821f` (feat)

## Files Created/Modified
- `src/components/Navbar.tsx` - All inline hex replaced with token classes; all hover handlers removed; rgba border-bottom kept inline
- `src/components/StarRating.tsx` - Wrapper div migrated to flex Tailwind classes; rating display span uses text-coffee font-semibold; gradient backgroundImage kept inline
- `src/app/page.tsx` - All hex colors replaced with token classes; no more onMouseEnter/Leave handlers; hero gradient kept inline
- `src/app/auth/login/page.tsx` - inputStyle constant deleted; Input component used for email/password; no focus handlers
- `src/app/auth/register/page.tsx` - inputStyle/focusStyle constants deleted; Input component for all 4 fields; no focus handlers
- `src/app/explore/page.tsx` - Input component for search; Card variant=interactive for place tiles; category pills use conditional Tailwind; spinner uses border-caramel border-t-transparent
- `src/app/place/[slug]/page.tsx` - Card variant=default for info and review form cards; Textarea/Input for review form fields; inputStyle constant deleted
- `src/app/profile/page.tsx` - Card variant=default/flat/interactive for all card sections; tab buttons use conditional Tailwind (no hover handlers); rating distribution uses Tailwind flex
- `src/app/new/page.tsx` - Card variant=default for form wrapper; Input/Textarea for fields; select uses equivalent Tailwind; city suggestions use hover:bg-warmgray-100

## Decisions Made
- Kept `onFocus` in explore search (shows dropdown — functional state, not styling) and `onBlur` in new page city input (hides suggestions — functional state, not styling)
- StarRating's `onMouseLeave` kept — it resets the hover star state for the interactive star rating widget, not a style mutation
- `rgba()` semi-transparent backgrounds kept inline where Tailwind opacity modifiers would produce different visual results
- `boxShadow: '0 4px 24px rgba(75,46,43,0.09)'` kept inline on auth card — non-standard depth not achievable with shadow-sm alone

## Deviations from Plan

None — plan executed exactly as written. All gradient/rgba/dynamic exceptions followed as documented.

## Issues Encountered
- Git staging with `src/app/place/[slug]/page.tsx` required quoting the path due to brackets — used double-quote wrapping. Minor inconvenience, resolved immediately.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All 9 files using Tailwind token classes exclusively (no inline hex color values outside documented exceptions)
- Zero onMouseEnter/onMouseLeave/onFocus/onBlur style mutation handlers in any file
- Card/Input/Textarea components wired consistently across all pages
- Build clean: TypeScript passes, Next.js build exits 0
- Codebase is visually consistent and ready for Phase 1 service/repository layer architecture work

---
*Phase: 00-polish-bugfix*
*Completed: 2026-03-13*
