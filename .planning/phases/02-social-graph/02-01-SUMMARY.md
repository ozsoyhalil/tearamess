---
phase: 02-social-graph
plan: "01"
subsystem: testing
tags: [jest, tdd, supabase, follows, feed, profiles, social-graph]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Service layer pattern (jest.MockedFunction, @jest-environment node, chainable mock builder)
provides:
  - Failing test stubs for followUser, unfollowUser, isFollowing, getFollowerCount, getFollowers, getFollowing
  - Failing test stubs for getFeed (empty, merged sorted, cursor pagination)
  - profiles.test.ts with getProfileByUserId (green) + getProfileByUsername stubs (red)
affects: [02-social-graph Plan 02 and 03 — all implementation tasks have automated verify targets]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "@jest-environment node docblock for Supabase server-side test files"
    - "jest.MockedFunction<any> for TypeScript5/jest30 chainable mock compatibility"
    - "Chainable query builder mock: mockFrom().mockReturnValue({ select: selectFn })"

key-files:
  created:
    - src/lib/services/follows.test.ts
    - src/lib/services/feed.test.ts
    - src/lib/services/profiles.test.ts
  modified: []

key-decisions:
  - "profiles.test.ts created as new file (not extended) — it did not exist prior to this plan"
  - "getProfileByUserId tests added to profiles.test.ts alongside getProfileByUsername stubs to provide baseline coverage for the existing function"

patterns-established:
  - "Wave 0 TDD stub pattern: test files created before implementation files exist — failing on Cannot find module"
  - "Turkish error messages (Kullanıcı bulunamadı) used for user-facing profile lookup errors"

requirements-completed: [SOCL-01, SOCL-02, SOCL-03, SOCL-04]

# Metrics
duration: 2min
completed: 2026-03-14
---

# Phase 2 Plan 01: Social Graph Wave 0 — Test Stubs Summary

**Failing TDD stubs for follows service (6 functions), feed service (3 scenarios), and getProfileByUsername — establishing RED baseline for all social-graph implementation tasks.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-14T23:52:50Z
- **Completed:** 2026-03-14T23:54:28Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created `follows.test.ts` with 8 test cases across 6 describe blocks covering the full follows service API
- Created `feed.test.ts` with 3 test cases for getFeed (empty feed, merged sorted items, cursor pagination)
- Created `profiles.test.ts` with getProfileByUserId tests (green) and getProfileByUsername stubs (red)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create follows service test stubs** - `9dabba4` (test)
2. **Task 2: Create feed service stubs and extend profiles tests** - `300dd2a` (test)

## Files Created/Modified
- `src/lib/services/follows.test.ts` - 8 failing stubs for followUser, unfollowUser, isFollowing, getFollowerCount, getFollowers, getFollowing
- `src/lib/services/feed.test.ts` - 3 failing stubs for getFeed (empty, merged, cursor)
- `src/lib/services/profiles.test.ts` - New file: getProfileByUserId tests (green) + getProfileByUsername stubs (red, SOCL-04)

## Decisions Made
- `profiles.test.ts` was created as a new file (it did not exist before this plan). Existing `getProfileByUserId` tests were added alongside the new `getProfileByUsername` stubs to provide baseline coverage.
- The `@jest-environment node` docblock is used on all three new files per the Phase 1 decision for Supabase server-side code in jsdom projects.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All three test files exist and fail RED (Cannot find module for follows/feed, export not found for getProfileByUsername)
- Existing places and reviews tests remain green (19 passing)
- Plan 02 (schema migration) and Plan 03 (service implementation) have automated verify targets ready
- Implementation tasks in later waves can use these test files as their `<verify>` command

---
*Phase: 02-social-graph*
*Completed: 2026-03-14*
