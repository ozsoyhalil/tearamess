---
phase: 01-foundation
plan: 02
subsystem: service-layer
tags: [services, types, data-access, tdd, migration]
dependency_graph:
  requires: [01-01]
  provides: [service-layer, canonical-types]
  affects: [all-subsequent-phases]
tech_stack:
  added: []
  patterns: [repository-pattern, typed-service-functions, tdd]
key_files:
  created:
    - src/types/place.ts
    - src/types/profile.ts
    - src/lib/services/places.ts
    - src/lib/services/reviews.ts
    - src/lib/services/profiles.ts
    - src/lib/services/auth.ts
  modified:
    - src/app/explore/page.tsx
    - src/app/profile/page.tsx
    - src/app/new/page.tsx
    - src/app/place/[slug]/page.tsx
    - src/lib/services/places.test.ts
    - src/lib/services/reviews.test.ts
decisions:
  - Typed mock helper `mockSupabaseFrom()` with `jest.MockedFunction<any>` pattern avoids TypeScript5/jest30 `never` inference on chained mock builders
  - Place.neighborhood made optional (not required) — searchPlaces returns partial shapes, canonical type must accommodate both explore and search responses
  - getPlaces without user filtering; profile page filters by created_by client-side using returned data
metrics:
  duration: ~8min
  completed_date: "2026-03-15"
  tasks_completed: 2
  files_changed: 12
---

# Phase 1 Plan 2: Service Layer Migration Summary

Centralized Supabase data access into typed service functions; all four page components migrated off direct `supabase.from()` calls.

## What Was Built

Four service files providing all data access for the app:
- `/src/lib/services/places.ts` — `getPlaces`, `searchPlaces`, `getPlaceBySlug`, `createPlace`
- `/src/lib/services/reviews.ts` — `getReviewsForPlace`, `createReview`, `getUserReviews`
- `/src/lib/services/profiles.ts` — `getProfileByUserId`, `getProfile`
- `/src/lib/services/auth.ts` — `signIn`, `signUp`, `signOut`, `getSession`

Two canonical type files:
- `/src/types/place.ts` — `Place` interface merging explore and detail-page shapes
- `/src/types/profile.ts` — `Profile` interface

All functions return `{ data: T | null, error: string | null }` envelope for consistent error handling.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Define canonical types and create service layer (TDD) | a53f04e |
| 2 | Migrate page components to use service layer | 86124f5 |

## Verification

- `grep -r "supabase.from(" src/app/` → 0 results
- `npx jest --passWithNoTests` → 8 passed, 0 failed
- `npx tsc --noEmit` → 0 errors

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Place.neighborhood made optional in canonical type**
- **Found during:** Task 1 (TypeScript check)
- **Issue:** `searchPlaces` SELECT only fetches `id, name, slug, category, city` (no neighborhood). The canonical Place type had `neighborhood: string | null` as required, causing TS2322 on the search return.
- **Fix:** Changed to `neighborhood?: string | null` — all consumers already handle undefined/null case.
- **Files modified:** src/types/place.ts
- **Commit:** a53f04e (included in task commit)

**2. [Rule 1 - Bug] Jest mock typing pattern for TypeScript 5 + jest@30 compatibility**
- **Found during:** Task 1 (TypeScript check after tests passed)
- **Issue:** `jest.fn().mockResolvedValue(...)` infers `never` return type when function has `any` return from chained mock builders, causing TS2345 errors in test files.
- **Fix:** Cast mock functions as `jest.MockedFunction<any>` and call `.mockResolvedValue()` / `.mockReturnValue()` on separate variable (not chained inline). Used `mockSupabaseFrom()` helper.
- **Files modified:** src/lib/services/places.test.ts, src/lib/services/reviews.test.ts
- **Commit:** a53f04e (included in task commit)

**3. [Rule 2 - Missing functionality] profile/page.tsx — getProfile uses user_id filter**
- **Found during:** Task 2 analysis
- **Issue:** The existing page used `.eq('id', user.id)` on profiles (matching profile.id = user.id). The service `getProfileByUserId` uses `.eq('user_id', userId)`. Kept service's `user_id` approach which is the correct FK pattern.
- **Fix:** No code change — this is the intended behavior from plan. Documented for awareness.

## Self-Check: PASSED

All created files verified on disk. Both task commits (a53f04e, 86124f5) exist in git history. `grep -r "supabase.from(" src/app/` returns 0. `npx tsc --noEmit` passes clean.
