---
phase: 03-lists
plan: "02"
subsystem: database
tags: [supabase, typescript, jest, tdd, lists, wishlist, list_items]

# Dependency graph
requires:
  - phase: 03-lists-01
    provides: List and ListItem types, 17 TDD stubs, lists + list_items tables with RLS

provides:
  - Full lists CRUD service (src/lib/services/lists.ts) with 13 exported functions
  - 21 passing assertions in lists.test.ts covering all LIST-01 through LIST-04 requirements
  - ListWithPlaces type for join queries (list_items + places nested select)

affects: [03-03, 03-04, 03-05, 03-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - PGRST116 guard pattern: treat PostgREST "no rows" as null/null not error (getOrCreateWishlist, getListById)
    - Unique constraint 23505 no-op pattern: duplicate list_items insert treated as success
    - Composite wishlist operations: addToWishlist/removeFromWishlist delegate through getOrCreateWishlist
    - Mock chain pattern (per Phase 2): mockReturnValueOnce for multi-call functions in jest

key-files:
  created:
    - src/lib/services/lists.ts
  modified:
    - src/lib/services/lists.test.ts

key-decisions:
  - "addPlaceToList treats Postgres 23505 unique constraint violation as success (place already in list = idempotent)"
  - "getOrCreateWishlist and getListById both guard PGRST116 — no-rows is not an error, returns null/null"
  - "addToWishlist and removeFromWishlist delegate to getOrCreateWishlist to bootstrap wishlist on first use"
  - "ListWithPlaces type exported from lists.ts: ListItem & { places: Pick<Place, 'id'|'name'|'category'|'neighborhood'> | null }"

patterns-established:
  - "TDD mock chain pattern for multi-step service functions: mockReturnValueOnce per call, sequential from() calls"
  - "Wishlist bootstrap via PGRST116: fetch with .single() → if code===PGRST116 → insert → return created"

requirements-completed: [LIST-01, LIST-02, LIST-03, LIST-04]

# Metrics
duration: 9min
completed: 2026-03-18
---

# Phase 3 Plan 02: Lists Service — TDD GREEN Summary

**13-function lists CRUD service with wishlist bootstrap, composite PK no-ops, and 21 passing tests — complete data layer for Phase 3 UI**

## Performance

- **Duration:** ~9 min
- **Started:** 2026-03-18T10:31:35Z
- **Completed:** 2026-03-18T10:40:28Z
- **Tasks:** 2 of 2 complete (RED + GREEN; REFACTOR not needed — code came out clean)
- **Files modified:** 2

## Accomplishments
- Replaced 17 stub assertions with full mock-chain assertions; added 4 extra tests (addToWishlist, removeFromWishlist, duplicate addPlaceToList, isPlaceInWishlist false case) — 21 tests total
- Implemented all 13 service functions in lists.ts, each under 30 lines, following the `{ data, error }` contract from follows.ts and profiles.ts
- Full suite: 54 tests passing across 8 suites — zero regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: RED — full test assertions** - `afca6e9` (test)
2. **Task 2: GREEN — lists.ts implementation** - `5c58cd0` (feat)

## Files Created/Modified
- `src/lib/services/lists.ts` — 13 exported functions: getUserLists, getOrCreateWishlist, createList, deleteList, addPlaceToList, removePlaceFromList, addToWishlist, removeFromWishlist, isPlaceInWishlist, updateListName, updateListPrivacy, getListById, getListItems; also exports ListWithPlaces type
- `src/lib/services/lists.test.ts` — 21 assertions across all service functions, using jest mock chain pattern

## Decisions Made
- `addPlaceToList` catches Postgres error code `23505` (unique constraint) and treats it as success — inserting an already-added place is a no-op, not an error
- `getOrCreateWishlist` guards `PGRST116` correctly: non-PGRST116 errors bubble up; PGRST116 triggers an insert
- `getListById` returns `{ data: null, error: null }` on PGRST116 — does not leak whether the list exists (covers privacy)
- `ListWithPlaces` type is defined and exported from `lists.ts` (not a separate file) since it is only used by `getListItems`

## Deviations from Plan

None — plan executed exactly as written. Tests went RED on `Cannot find module './lists'` as expected; GREEN was achieved on first implementation pass.

## Issues Encountered
None.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- `src/lib/services/lists.ts` is the complete data layer for Phase 3
- All 13 service function signatures are locked — UI plans (03-03 through 03-06) can import directly
- `LIST-01` through `LIST-04` requirements are all covered and verified by 21 passing tests

---
*Phase: 03-lists*
*Completed: 2026-03-18*
