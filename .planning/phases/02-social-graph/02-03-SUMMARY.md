---
phase: 02-social-graph
plan: 03
subsystem: api
tags: [supabase, social-graph, follows, feed, visits, profiles, cursor-pagination]

# Dependency graph
requires:
  - phase: 02-social-graph
    provides: "type contracts: Follow, FollowProfile, Visit, FeedItem discriminated union — and failing test stubs (wave 0)"
  - phase: 01-foundation
    provides: "supabase client, service layer pattern, Review/Profile types"
provides:
  - follows.ts: followUser, unfollowUser, isFollowing, getFollowerCount, getFollowingCount, getFollowers, getFollowing
  - feed.ts: getFeed with cursor-based pagination and two-query merge pattern
  - visits.ts: getUserVisits, recordVisit (upsert with onConflict)
  - profiles.ts: getProfileByUsername added alongside getProfileByUserId
  - reviews.ts: createReview auto-records a visit via recordVisit (silent failure)
affects:
  - 03-profile-page
  - 04-checkin-grid
  - any phase needing user feed, follow state, or visit history

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Two-query pattern for follows: fetch IDs from follows table then query profiles/feed tables with .in()"
    - "Cursor pagination via .lt('created_at', cursor) applied to both reviews and visits queries"
    - "Upsert with onConflict for visits table to handle repeat visits gracefully"
    - "Silent visit recording on review creation: recordVisit().catch(() => {}) prevents blocking caller"
    - "Promise.all parallel fetch for reviews and visits in getFeed"

key-files:
  created:
    - src/lib/services/follows.ts
    - src/lib/services/feed.ts
    - src/lib/services/visits.ts
  modified:
    - src/lib/services/profiles.ts
    - src/lib/services/reviews.ts
    - src/lib/services/feed.test.ts

key-decisions:
  - "Two-query approach for feed: parallel Promise.all for reviews+visits (not SQL UNION or single view) — follows the established service pattern and avoids PostgREST FK join pitfalls"
  - "feed.test.ts mock stubs fixed (Rule 1): original stubs used mockReturnValue for all from() calls which prevented two-query implementation; fixed to use mockReturnValueOnce per query"
  - "recordVisit fires and forgets in createReview — visit error never bubbles to review caller"
  - "getProfileByUsername uses .single() (same as getProfileByUserId) — test mock uses select().eq().single() chain"

patterns-established:
  - "Feed pagination: always apply .lt('created_at', cursor) to BOTH reviews and visits queries when cursor provided"
  - "Upsert pattern for visits: { onConflict: 'user_id,place_id' } — idempotent re-visit"

requirements-completed: [SOCL-01, SOCL-02, SOCL-03, SOCL-04]

# Metrics
duration: 9min
completed: 2026-03-17
---

# Phase 02 Plan 03: Social Graph Wave 2 Implementation Summary

**Social graph service layer complete: follows CRUD, cursor-paginated feed merging reviews+visits, visit recording, and getProfileByUsername — all 24 service tests GREEN**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-17T07:36:00Z
- **Completed:** 2026-03-17T07:45:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- follows.ts implements all 7 exports (followUser, unfollowUser, isFollowing, getFollowerCount, getFollowingCount, getFollowers, getFollowing) — all 9 follows tests GREEN
- feed.ts implements getFeed with two-query merge (reviews + visits in parallel) and cursor pagination — all 3 feed tests GREEN
- visits.ts provides getUserVisits (with place join) and recordVisit (upsert with conflict handling)
- profiles.ts extended with getProfileByUsername — all 4 profiles tests GREEN
- reviews.ts wired to call recordVisit after successful insert (silent failure pattern)

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement follows service (SOCL-01, SOCL-02)** - `0c4bf5e` (feat)
2. **Task 2: Implement feed, visits, getProfileByUsername, wire recordVisit** - `1aa83c5` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified
- `src/lib/services/follows.ts` - Social graph: follow/unfollow, isFollowing, counts, follower/following lists
- `src/lib/services/feed.ts` - getFeed with two-query merge, cursor pagination, PAGE_SIZE=20
- `src/lib/services/visits.ts` - getUserVisits (with places join) and recordVisit (upsert)
- `src/lib/services/profiles.ts` - Extended with getProfileByUsername using .eq('username').single()
- `src/lib/services/reviews.ts` - createReview now calls recordVisit after successful insert
- `src/lib/services/feed.test.ts` - Fixed mock stubs to support two-query implementation (Rule 1)

## Decisions Made
- Two-query approach in getFeed: first gets followedIds from follows table with .eq(), then fires parallel Promise.all for reviews and visits with .in(followedIds). Matches plan guidance and avoids PostgREST FK join pitfalls.
- recordVisit fires without await in createReview — caller never sees visit errors. This is correct for UX: a failed visit record should not fail the review submission.
- getProfileByUsername uses .single() consistent with getProfileByUserId — returns supabase error message when not found (test mock returns 'Kullanıcı bulunamadı' as error.message).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed feed.test.ts mock stubs for two-query implementation**
- **Found during:** Task 2 (feed service implementation)
- **Issue:** Original test stubs used `mockReturnValue` for all `from()` calls, which set the same mock return for every query. Cases 2 and 3 had `selectFn` returning `{ in: inFn }` with no `.eq()` — this made the follows lookup (which needs `.eq()`) crash with "eq is not a function". Cases 2/3 couldn't coexist with the two-query approach.
- **Fix:** Rewrote cases 2 and 3 to use `mockReturnValueOnce` per query: once for follows lookup (supporting `.eq()`), once for reviews query, once for visits query. Each query gets its own mock chain with realistic data shapes.
- **Files modified:** src/lib/services/feed.test.ts
- **Verification:** All 3 feed tests pass GREEN
- **Committed in:** 1aa83c5 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — test bug)
**Impact on plan:** Necessary fix. The stubs' mock setup was incompatible with the two-query implementation pattern specified in the plan. No scope creep — only test mock correction.

## Issues Encountered
- feed.test.ts stubs (Plan 01 wave 0) had a fundamental mock incompatibility: all three test cases shared `mockFrom().mockReturnValue(...)` which could not simultaneously support `.eq()` (for follows lookup) and `.in()` (for feed queries). Required careful analysis before settling on `mockReturnValueOnce` per query as the fix.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Social graph service layer is complete and fully tested (24/24 tests GREEN)
- follows.ts, feed.ts, visits.ts ready for consumption by profile pages and feed UI
- getProfileByUsername enables URL-slug based profile routing
- All SOCL requirements (01-04) satisfied and ready for Phase 03 profile page implementation

---
*Phase: 02-social-graph*
*Completed: 2026-03-17*

## Self-Check: PASSED

- FOUND: src/lib/services/follows.ts
- FOUND: src/lib/services/feed.ts
- FOUND: src/lib/services/visits.ts
- FOUND: .planning/phases/02-social-graph/02-03-SUMMARY.md
- FOUND: 0c4bf5e (follows service commit)
- FOUND: 1aa83c5 (feed/visits/profiles/reviews commit)
- All 24 service tests GREEN
