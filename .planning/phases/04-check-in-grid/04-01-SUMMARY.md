---
phase: 04-check-in-grid
plan: 01
subsystem: database, testing
tags: [react-leaflet, leaflet, sonner, supabase, migrations, jest, tdd]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: service layer patterns, jest/ts-jest setup, @jest-environment node pattern
provides:
  - react-leaflet, leaflet, sonner installed in dependencies
  - '@types/leaflet in devDependencies'
  - supabase migration adding latitude/longitude to places and dropping unique constraint on visits
  - checkIns.test.ts with 4 failing tests (RED baseline for XPLR-01)
  - grid.test.ts with 5 failing tests (RED baseline for XPLR-02)
affects: [04-02, 04-03, 04-04, 04-05, 04-06, 04-07]

# Tech tracking
tech-stack:
  added: [react-leaflet@5.0.0, leaflet@1.9.4, sonner@2.0.7, "@types/leaflet@1.9.21"]
  patterns:
    - TDD RED baseline via Cannot-find-module — test stubs created before implementation
    - Migration SQL committed to supabase/migrations/ with idempotent ADD COLUMN IF NOT EXISTS

key-files:
  created:
    - supabase/migrations/20260322_add_place_coords_and_multi_visit.sql
    - src/lib/services/checkIns.test.ts
    - src/lib/grid.test.ts
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "react-leaflet@5 installed — compatible with React 19 and Next 16; no peer dep errors"
  - "Migration uses ADD COLUMN IF NOT EXISTS and DROP CONSTRAINT IF EXISTS for safe re-runs"
  - "visits unique constraint dropped to allow multiple check-in rows per user+place (non-idempotent checkIn)"
  - "grid.test.ts uses GRID_BOUNDS/CELL_LAT/CELL_LNG constants from grid module — expected row/col derived at test runtime, not hardcoded"

patterns-established:
  - "TDD Wave 0 stub pattern: test files import from not-yet-created modules to establish Cannot-find-module RED baseline"
  - "checkIns.test.ts uses @jest-environment node docblock + jest.mock('@/lib/supabase') per Phase 1 pattern"

requirements-completed: [XPLR-01, XPLR-02]

# Metrics
duration: 8min
completed: 2026-03-23
---

# Phase 4 Plan 01: Check-in + Grid Setup Summary

**react-leaflet/leaflet/sonner installed, DB migration adds lat/lng to places and drops visits unique constraint, TDD RED baselines for checkIn service (XPLR-01) and grid math (XPLR-02) established via Cannot-find-module failures**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-23T08:20:12Z
- **Completed:** 2026-03-23T08:28:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Installed react-leaflet, leaflet, sonner as dependencies and @types/leaflet as devDependency
- Created DB migration that adds nullable latitude/longitude columns to places and drops the visits unique constraint to allow multiple check-ins per user+place
- Created checkIns.test.ts with 4 tests covering insert behavior, return values, and non-idempotency (XPLR-01 RED baseline)
- Created grid.test.ts with tests for latLngToCellKey, cellKeyToBounds, isInAnkaraBounds, and buildCellCounts stub (XPLR-02 RED baseline)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies and create DB migration** - `847169a` (feat)
2. **Task 2: Create failing test stubs — checkIns.test.ts and grid.test.ts** - `f99bb51` (test)

## Files Created/Modified
- `package.json` - Added react-leaflet, leaflet, sonner, @types/leaflet
- `package-lock.json` - Updated lock file
- `supabase/migrations/20260322_add_place_coords_and_multi_visit.sql` - Phase 4 schema changes
- `src/lib/services/checkIns.test.ts` - 4 failing tests for checkIn service (XPLR-01)
- `src/lib/grid.test.ts` - 5 failing tests for grid math utilities (XPLR-02)

## Decisions Made
- react-leaflet@5 installed — compatible with React 19 and Next 16; no peer dependency errors
- Migration uses ADD COLUMN IF NOT EXISTS and DROP CONSTRAINT IF EXISTS for safe idempotent re-runs
- visits unique constraint dropped to allow multiple check-in rows per user+place — recordVisit() continues inserting normally, now both checkIn and recordVisit produce valid visit rows
- grid.test.ts derives expected row/col from GRID_BOUNDS constants at test runtime rather than hardcoding values, keeping tests aligned with implementation constants

## Deviations from Plan

None - plan executed exactly as written. `npx supabase db push` ran in background (migration file committed regardless as instructed).

## Issues Encountered
- Node v25 in environment rejects `!!` in shell heredoc `-e` strings — worked around using file read for package.json verification instead.

## User Setup Required
None - no external service configuration required. Migration file committed; apply via Supabase SQL editor if `supabase db push` has not yet linked.

## Next Phase Readiness
- All Phase 4 dependencies installed and ready
- DB migration file ready to apply
- RED test baselines established — Plans 04-02 and 04-03 can implement checkIns.ts and grid.ts to turn RED to GREEN

---
*Phase: 04-check-in-grid*
*Completed: 2026-03-23*
