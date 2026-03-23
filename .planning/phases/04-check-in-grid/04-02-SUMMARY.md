---
phase: 04-check-in-grid
plan: 02
subsystem: testing, api
tags: [grid, math, tdd, typescript, ankara, geospatial]

# Dependency graph
requires:
  - phase: 04-check-in-grid/04-01
    provides: grid.test.ts RED baseline, react-leaflet installed, DB migration with lat/lng on places
  - phase: 01-foundation
    provides: jest/ts-jest setup, @jest-environment node pattern, service layer patterns
provides:
  - VisitWithCoords interface in src/types/visit.ts
  - src/lib/grid.ts with GRID_BOUNDS, CELL_LAT, CELL_LNG, latLngToCellKey, cellKeyToBounds, isInAnkaraBounds, buildCellCounts
  - All grid.test.ts tests passing GREEN (11 tests)
affects: [04-03, 04-04, 04-05, 04-06, 04-07]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - TDD RED→GREEN: test file extended with real buildCellCounts tests before implementation, then implementation written to pass
    - Pure math module pattern: grid.ts imports only types (no Supabase, no React), all arithmetic is deterministic

key-files:
  created:
    - src/lib/grid.ts
  modified:
    - src/types/visit.ts
    - src/lib/grid.test.ts

key-decisions:
  - "VisitWithCoords extends Visit's places join with latitude/longitude: number | null — matches DB schema after migration"
  - "buildCellCounts skips null coordinates via nullish coalescing check, not strict equality — handles undefined gracefully"
  - "grid.ts has zero runtime dependencies — only imports VisitWithCoords type (erased at compile time)"

patterns-established:
  - "Pure math module: all grid utilities are stateless functions operating on numeric inputs — trivially testable"
  - "buildCellCounts guard order: null check first, then bounds check — fails fast on bad data"

requirements-completed: [XPLR-02]

# Metrics
duration: 6min
completed: 2026-03-23
---

# Phase 4 Plan 02: Grid Math Utilities Summary

**VisitWithCoords type added to visit.ts, pure grid.ts implementing GRID_BOUNDS constants and four coordinate utilities, all 11 Jest tests GREEN**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-23T08:38:13Z
- **Completed:** 2026-03-23T08:44:00Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Extended `src/types/visit.ts` with `VisitWithCoords` interface including `latitude: number | null` and `longitude: number | null` on the places join
- Updated `src/lib/grid.test.ts` with 6 real `buildCellCounts` tests covering same-cell aggregation, null lat/lng skip, out-of-bounds skip, and multi-cell independence — RED confirmed on Cannot-find-module
- Created `src/lib/grid.ts` with all 7 required exports: `GRID_BOUNDS`, `CELL_LAT`, `CELL_LNG`, `latLngToCellKey`, `cellKeyToBounds`, `isInAnkaraBounds`, `buildCellCounts` — 11/11 tests GREEN

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend Visit type with VisitWithCoords** - `71db9dc` (feat)
2. **Task 2: Update grid.test.ts with real buildCellCounts tests (RED)** - `e0d1643` (test)
3. **Task 3: Implement grid.ts pure math utilities (GREEN)** - `5f42d7a` (feat)

## Files Created/Modified
- `src/types/visit.ts` - Added VisitWithCoords interface with coordinate-aware places join
- `src/lib/grid.test.ts` - Replaced stub buildCellCounts test with 6 real test cases; added NE > SW bounds assertion
- `src/lib/grid.ts` - Pure grid math: Ankara bounding box constants, latLngToCellKey, cellKeyToBounds, isInAnkaraBounds, buildCellCounts

## Decisions Made
- `VisitWithCoords` uses `latitude: number | null` (not optional) — matches the DB column type after migration; null is an explicit "no coordinate" signal vs undefined meaning "field not selected"
- `buildCellCounts` guard uses `?? null` for both lat and lng before null check — safely handles undefined places or missing fields without crashing
- `grid.ts` imports only the `VisitWithCoords` type (a TypeScript type import erased at compile time) — zero runtime dependencies maintained

## Deviations from Plan

None - plan executed exactly as written. TDD RED→GREEN cycle followed: type extension, then failing tests, then implementation.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. All changes are pure TypeScript with no external dependencies.

## Next Phase Readiness
- `VisitWithCoords` type is ready for use in the checkIn service and grid data fetching layer (Plans 04-03 and 04-04)
- `grid.ts` is ready to be imported by `GridMap.tsx` (Plan 04-05) and any server-side grid aggregation queries
- All 11 unit tests provide a safety net for any future constant or algorithm changes

## Self-Check: PASSED

- FOUND: src/types/visit.ts
- FOUND: src/lib/grid.ts
- FOUND: src/lib/grid.test.ts
- FOUND: 04-02-SUMMARY.md
- Commit 71db9dc: feat(04-02): extend Visit type with VisitWithCoords
- Commit e0d1643: test(04-02): add real buildCellCounts tests to grid.test.ts (RED)
- Commit 5f42d7a: feat(04-02): implement grid.ts pure math utilities (GREEN)

---
*Phase: 04-check-in-grid*
*Completed: 2026-03-23*
