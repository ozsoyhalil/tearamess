---
phase: 03-lists
plan: "04"
subsystem: ui
tags: [react, typescript, supabase, lists, popover, next.js, starrating]

# Dependency graph
requires:
  - phase: 03-lists-02
    provides: Full lists CRUD service (getUserLists, addPlaceToList, removePlaceFromList, getListById, getListItems, updateListName, updateListPrivacy, deleteList)

provides:
  - ListItemSelector.tsx — multi-list popover for adding/removing a place from user's lists
  - getPlaceListMembership — service function fetching which lists contain a given place
  - getViewerRatingsForPlaces — batch fetch viewer star ratings for a set of place IDs
  - src/app/lists/[id]/page.tsx — list detail page with owner edit controls and visitor read-only view

affects: [03-05, 03-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Lazy-fetch-on-open: useEffect fires only when isOpen transitions to true — no unnecessary fetches
    - Optimistic toggle with Set: checkbox state held in Set<string>, toggled optimistically, reverted on error
    - Batch ratings fetch: single getViewerRatingsForPlaces call after items load, maps place_id to rating
    - Conditional StarRating: rating !== undefined guard prevents empty-star rows for unrated places

key-files:
  created:
    - src/components/ListItemSelector.tsx
    - src/app/lists/[id]/page.tsx
  modified:
    - src/lib/services/lists.ts
    - src/lib/services/reviews.ts

key-decisions:
  - "getPlaceListMembership added to lists.ts in Plan 04 (stub implementation) — Plan 05 may refine or replace it"
  - "ListItemSelector centers with fixed positioning + translate-50 fallback (no anchorRef needed for current use case)"
  - "list detail page shows notFound state when getListById returns null — no Next.js notFound() needed since RLS hides data"
  - "is_wishlist hides delete button and privacy toggle on list detail page — wishlist is permanent and always public"

patterns-established:
  - "Lazy-fetch popover: fetch on isOpen=true, cancelled ref to prevent stale state updates on unmount"
  - "Optimistic Set toggle: clone Set, apply change, call service, revert clone on error"

requirements-completed: [LIST-03, LIST-04]

# Metrics
duration: 8min
completed: 2026-03-18
---

# Phase 3 Plan 04: ListItemSelector + List Detail Page Summary

**Multi-list popover with optimistic checkbox toggle and full list detail page with owner inline-edit, privacy toggle, delete, and per-row viewer star ratings**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-18T10:54:33Z
- **Completed:** 2026-03-18T11:02:00Z
- **Tasks:** 2 of 2 complete
- **Files modified:** 4

## Accomplishments
- ListItemSelector.tsx: lazy fetch on open, optimistic checkbox toggle per list, no direct Supabase in component
- getViewerRatingsForPlaces added to reviews.ts — INFRA-01 compliant, batch query with place_id→rating map
- src/app/lists/[id]/page.tsx: inline-editable name, privacy toggle, delete with confirm, per-row remove button, viewer star ratings
- Full jest suite stays at 54 passing tests — zero regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Build ListItemSelector popover** - `a0dba93` (feat)
2. **Task 2: Add getViewerRatingsForPlaces + build list detail page** - `708147a` (feat)

## Files Created/Modified
- `src/components/ListItemSelector.tsx` — Popover showing user's lists as checkboxes; lazy fetch, optimistic toggle
- `src/app/lists/[id]/page.tsx` — List detail page: owner edit controls, visitor read-only, viewer ratings per row
- `src/lib/services/lists.ts` — Added getPlaceListMembership (stub implementation for Plan 04; Plan 05 may extend)
- `src/lib/services/reviews.ts` — Added getViewerRatingsForPlaces for batch viewer rating lookup

## Decisions Made
- `getPlaceListMembership` added to lists.ts now (plan noted Plan 05 would add it) — auto-fixed as Rule 3 (blocking import). Implementation uses `list_items` join with `lists.user_id` filter. Plan 05 can refine if needed.
- ListItemSelector uses fixed centering instead of anchor-relative positioning — simpler, no anchorRef prop needed for current callers; plan prop was marked optional anyway.
- list detail page uses inline `notFound` state rather than Next.js `notFound()` call — avoids server-side constraint in client component and matches the plan spec ("show not-found state").

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added getPlaceListMembership stub to lists.ts**
- **Found during:** Task 1 (ListItemSelector.tsx build)
- **Issue:** ListItemSelector imports getPlaceListMembership from lists.ts, but Plan 05 Task 2 was supposed to add it. Without it, TypeScript would fail on the import and the component could not compile.
- **Fix:** Added a working implementation of getPlaceListMembership to lists.ts using a join query on list_items + lists tables. Plan 05 can extend/replace it.
- **Files modified:** src/lib/services/lists.ts
- **Verification:** tsc --noEmit clean; lists.test.ts still 21/21 passing
- **Committed in:** a0dba93 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Required for component to compile. No scope creep — Plan 05 can refine the implementation.

## Issues Encountered
None.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- ListItemSelector ready to wire into place detail page (Plan 05 or 06)
- getViewerRatingsForPlaces ready for any page showing lists with viewer context
- List detail page live at /lists/[id] — requires Supabase RLS to be active (confirmed from Plan 01 migration)
- getPlaceListMembership stub ready; Plan 05 can replace with optimized query if needed

---
*Phase: 03-lists*
*Completed: 2026-03-18*
