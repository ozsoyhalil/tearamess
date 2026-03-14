---
phase: 02-social-graph
plan: "02"
subsystem: types
tags: [typescript, types, social-graph, feed, intl, relative-time]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Place, Review, Profile canonical types in src/types/

provides:
  - Follow and FollowProfile interfaces for follows table rows and list queries
  - Visit interface with optional nested places join shape
  - FeedItem discriminated union (VisitActivity | ReviewActivity) on 'type' field
  - formatRelativeTime(isoDate) utility using Intl.RelativeTimeFormat('tr') with no npm deps

affects:
  - 02-social-graph Plan 03 (follows service imports Follow, FollowProfile, Visit)
  - 02-social-graph Plan 04 (feed components call formatRelativeTime, use FeedItem)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Discriminated union types using a literal 'type' field for TypeScript narrowing without hasOwnProperty checks
    - Intl.RelativeTimeFormat('tr') for zero-dependency Turkish relative time strings

key-files:
  created:
    - src/types/follow.ts
    - src/types/visit.ts
    - src/types/feed.ts
    - src/lib/utils/relativeTime.ts
  modified: []

key-decisions:
  - "FeedItem discriminated union uses 'type' literal field — enables item.type === 'review' narrowing without runtime duck-typing"
  - "formatRelativeTime uses native Intl.RelativeTimeFormat('tr') — zero new npm deps, no bundle overhead"
  - "Visit.places is optional (present only when fetched with select join) — matches Supabase select('*, places(...)') pattern"

patterns-established:
  - "Named exports only on all type files — no default exports, consistent with project pattern"
  - "Discriminated union pattern: type literal field enables exhaustive switch/if narrowing in components and services"
  - "Utility files in src/lib/utils/ — new directory established for standalone helpers"

requirements-completed: [SOCL-01, SOCL-02, SOCL-03, SOCL-04]

# Metrics
duration: 1min
completed: 2026-03-14
---

# Phase 2 Plan 02: Type Contracts and RelativeTime Utility Summary

**Follow/FollowProfile/Visit types, FeedItem discriminated union, and Turkish relative-time formatter via Intl.RelativeTimeFormat — zero npm dependencies added**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-14T23:52:53Z
- **Completed:** 2026-03-14T23:53:51Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Defined Follow and FollowProfile interfaces matching the follows table and follower/following list query shapes
- Defined Visit interface with optional nested places join — accommodates Supabase select('*, places(...)') query pattern
- Created FeedItem = VisitActivity | ReviewActivity discriminated union on the 'type' literal field, enabling clean TypeScript narrowing
- Implemented formatRelativeTime using native Intl.RelativeTimeFormat('tr') — no npm install, outputs "2 saat önce", "3 gün önce", "dün", "geçen hafta"

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Follow and Visit type definitions** - `0cb322e` (feat)
2. **Task 2: Create FeedItem union type and relativeTime utility** - `192214b` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `src/types/follow.ts` - Follow and FollowProfile interfaces for follows table rows and list queries
- `src/types/visit.ts` - Visit interface with optional nested places join shape
- `src/types/feed.ts` - FeedItem discriminated union (VisitActivity | ReviewActivity) on 'type' field
- `src/lib/utils/relativeTime.ts` - formatRelativeTime(isoDate) using Intl.RelativeTimeFormat('tr'), covers seconds/minutes/hours/days/weeks

## Decisions Made
- FeedItem uses a discriminated union on the 'type' literal field (`'visit' | 'review'`), enabling TypeScript narrowing via `if (item.type === 'review') { item.rating }` without runtime duck-typing
- formatRelativeTime uses native `Intl.RelativeTimeFormat('tr')` rather than any library — zero bundle overhead, covers all common relative durations
- Visit.places is optional to match Supabase query patterns: present only when the query includes a places join

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing TypeScript error in `src/lib/services/follows.test.ts(20,8)`: "Cannot find module './follows'" — this is the TDD RED stub from Plan 02-01, expected to fail until Plan 03 implements the follows service. Out of scope for this plan; not fixed.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All four type contracts are in place; Plan 03 (follows/visit services) can import Follow, FollowProfile, and Visit immediately
- Plan 04 (feed UI components) can call formatRelativeTime and use FeedItem discriminated union
- No blockers or concerns

---
*Phase: 02-social-graph*
*Completed: 2026-03-14*
