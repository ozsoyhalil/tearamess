---
phase: 03-lists
plan: "03"
subsystem: ui
tags: [react, typescript, tailwind, wishlist, optimistic-update, modal, form]

# Dependency graph
requires:
  - phase: 03-lists-02
    provides: lists.ts service with addToWishlist, removeFromWishlist, createList exported functions and List type

provides:
  - WishlistButton component (src/components/WishlistButton.tsx) — optimistic toggle, three visual states, auth redirect
  - CreateListModal component (src/components/CreateListModal.tsx) — modal form for creating named lists

affects: [03-05, 03-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "WishlistButton mirrors FollowButton optimistic pattern: capture prev, toggle UI, call service, revert on error"
    - "State-driven hover label swap using onMouseEnter/onMouseLeave (not CSS :hover) for text changes requiring JS"
    - "Modal stopPropagation pattern: backdrop click closes, panel click stops bubbling"

key-files:
  created:
    - src/components/WishlistButton.tsx
    - src/components/CreateListModal.tsx
  modified: []

key-decisions:
  - "WishlistButton uses inline SVG bookmark icon — no icon library dependency added"
  - "Caramel-filled bookmark on wishlisted state uses inline hex #C08552 (CSS variable not available for className text color)"
  - "CreateListModal uses ui/Input and ui/Textarea primitives — consistent styling with rest of app"
  - "CreateListModal validates name client-side (trim + non-empty check) before calling service"

patterns-established:
  - "Wishlist optimistic toggle: setIsWishlisted(!isWishlisted) before await, revert if result.error"
  - "Modal pattern: fixed inset-0 backdrop + stopPropagation on panel + if (!isOpen) return null"

requirements-completed: [LIST-01, LIST-02]

# Metrics
duration: 3min
completed: 2026-03-18
---

# Phase 3 Plan 03: WishlistButton + CreateListModal Summary

**Optimistic wishlist toggle button (3 visual states + auth redirect) and modal form for named list creation — both wired to lists.ts service**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-18T10:44:04Z
- **Completed:** 2026-03-18T10:47:02Z
- **Tasks:** 2 of 2 complete
- **Files modified:** 2

## Accomplishments
- WishlistButton mirrors FollowButton pattern exactly: optimistic update, isPending debounce, three distinct visual states driven by isWishlisted + isHovering state
- CreateListModal provides a full modal form with name/description fields, inline validation, loading state, and success/error handling
- All 54 tests remain green across 8 suites; zero TypeScript errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Build WishlistButton with optimistic update** - `c029d5e` (feat)
2. **Task 2: Build CreateListModal** - `dd480f1` (feat)

## Files Created/Modified
- `src/components/WishlistButton.tsx` — Optimistic bookmark toggle button; redirects logged-out users; imports addToWishlist/removeFromWishlist from lists.ts
- `src/components/CreateListModal.tsx` — Modal form for creating a named list; uses ui/Input + ui/Textarea; calls createList service on submit

## Decisions Made
- WishlistButton uses an inline SVG bookmark path (no icon library added) — keeps zero new dependencies
- Filled/caramel bookmark uses `text-[#C08552]` (literal hex) because CSS custom property `--color-caramel` cannot be used directly in a Tailwind text-color className; this is the same hex established in Phase 0 token decisions
- CreateListModal reuses `ui/Input` and `ui/Textarea` components to stay consistent with the app's form styling patterns
- Client-side validation (name.trim() non-empty) fires before the service call to avoid unnecessary network requests

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- `WishlistButton` is ready to be placed in the place detail header (Plan 05 wires it to `src/app/place/[slug]/page.tsx`)
- `CreateListModal` is ready to be triggered from the profile Lists tab "+ Yeni Liste" button (Plan 05)
- Both components are typed, tested (TypeScript clean), and use the locked service signatures from Plan 02

---
*Phase: 03-lists*
*Completed: 2026-03-18*
