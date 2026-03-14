---
phase: 01-foundation
plan: 03
subsystem: auth
tags: [supabase, middleware, next.js, ssr, edge-auth]

# Dependency graph
requires:
  - phase: 01-01
    provides: service layer and Supabase client setup this middleware extends
provides:
  - src/lib/supabase-server.ts — createMiddlewareClient using @supabase/ssr createServerClient
  - src/middleware.ts — Next.js edge middleware redirecting unauthenticated users on /profile and /new
  - PROTECTED_PATHS pattern for extending auth coverage to future routes
affects:
  - 01-04
  - any future route that needs server-side auth protection

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Edge middleware auth using @supabase/ssr getUser() (not getSession())
    - PROTECTED_PATHS array pattern for declarative route protection
    - @jest-environment node docblock for Next.js server tests in jsdom project

key-files:
  created:
    - src/lib/supabase-server.ts
    - src/middleware.ts
  modified:
    - src/middleware.test.ts
    - src/app/new/page.tsx

key-decisions:
  - "getUser() used in middleware (not getSession()) — validates against Supabase Auth server rather than reading cookie blindly"
  - "Middleware placed at src/middleware.ts (not root) because project has src/ directory — Next.js requires correct placement"
  - "@jest-environment node docblock added to middleware.test.ts to avoid Request is not defined error in jsdom environment"

patterns-established:
  - "Server-side auth: middleware redirects before page renders — no client-side auth redirect guards needed in page components"
  - "Test environment per-file override: @jest-environment node for Next.js server/edge code tests"

requirements-completed:
  - INFRA-02

# Metrics
duration: 5min
completed: 2026-03-14
---

# Phase 01 Plan 03: Middleware Auth Guard Summary

**Next.js edge middleware using @supabase/ssr that server-side redirects unauthenticated users from /profile and /new before any page code runs — eliminating the client-side flash**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-14T22:30:50Z
- **Completed:** 2026-03-14T22:35:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Created `src/lib/supabase-server.ts` with `createMiddlewareClient` helper using `@supabase/ssr` `createServerClient` with proper `getAll`/`setAll` cookie handling
- Created `src/middleware.ts` with `PROTECTED_PATHS` constant and `getUser()` (not `getSession()`) for secure server-side auth validation
- Replaced `it.todo` stubs in `src/middleware.test.ts` with 4 passing auth guard tests using mocked `createMiddlewareClient`
- Removed `if (!user) router.push('/auth/login')` pre-render guard from `src/app/new/page.tsx`

## Task Commits

Each task was committed atomically:

1. **Task 1: Create supabase-server.ts and middleware.ts** - `3d58729` (feat)
2. **Task 2: Remove client-side redirect guards from profile and new pages** - `05cc83f` (feat)

**Plan metadata:** (docs commit follows)

_Note: Task 1 was TDD — test written first (RED), then implementation (GREEN)_

## Files Created/Modified
- `src/lib/supabase-server.ts` - createMiddlewareClient factory for Next.js middleware using @supabase/ssr
- `src/middleware.ts` - Edge middleware with PROTECTED_PATHS redirecting unauthenticated requests
- `src/middleware.test.ts` - 4 auth guard tests (redirect /profile, redirect /new, pass /explore, pass authenticated /profile)
- `src/app/new/page.tsx` - Removed client-side `router.push('/auth/login')` pre-render guard; added null guard in handleSubmit

## Decisions Made
- `getUser()` used over `getSession()` in middleware — getUser validates against Supabase Auth server; getSession reads from cookie without server validation (security requirement)
- Middleware at `src/middleware.ts` not root `middleware.ts` — project has `src/` directory and Next.js only picks up middleware from the correct location
- `@jest-environment node` docblock added to test file — prevents `Request is not defined` error when Next.js server imports run in jsdom environment

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added @jest-environment node docblock to test file**
- **Found during:** Task 1 (TDD RED→GREEN phase)
- **Issue:** Test file imported `next/server` which requires `Request` global — unavailable in jsdom environment; tests failed with `ReferenceError: Request is not defined`
- **Fix:** Added `@jest-environment node` docblock at top of `src/middleware.test.ts`
- **Files modified:** src/middleware.test.ts
- **Verification:** All 4 tests pass in node environment
- **Committed in:** 3d58729 (Task 1 commit)

**2. [Rule 1 - Bug] Fixed assertion pattern for non-redirect responses**
- **Found during:** Task 1 (TDD GREEN phase)
- **Issue:** Plan's `expect(res.headers.get('location')).not.toContain('/auth/login')` fails with "received value must not be null" when middleware returns NextResponse.next() (no location header)
- **Fix:** Changed non-redirect assertions to `expect(location == null || !location.includes('/auth/login')).toBe(true)`
- **Files modified:** src/middleware.test.ts
- **Verification:** All 4 tests pass
- **Committed in:** 3d58729 (Task 1 commit)

**3. [Rule 1 - Bug] Added null guard in handleSubmit after removing pre-render auth guard**
- **Found during:** Task 2 (TypeScript compile check)
- **Issue:** After removing `if (!user) return null`, TypeScript correctly flagged `user.id` on line 103 as `user` possibly null — TS2018047 error
- **Fix:** Added `if (!user) return` at the start of `handleSubmit`; middleware protects the route so this path is unreachable at runtime, but required for type safety
- **Files modified:** src/app/new/page.tsx
- **Verification:** `npx tsc --noEmit --skipLibCheck` returns no errors
- **Committed in:** 05cc83f (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (1 blocking test environment, 2 bugs from test/type gaps)
**Impact on plan:** All fixes necessary for correct test execution and type safety. No scope creep.

## Issues Encountered
- `profile/page.tsx` already had no `router.push('/auth/login')` — only had `if (!user) return null` (soft fallback, not a redirect). No change needed for that file.

## Next Phase Readiness
- Middleware auth guard in place; /profile and /new are server-side protected
- INFRA-02 requirement fulfilled
- Ready for 01-04 (place detail page auth-conditional UI)

---
*Phase: 01-foundation*
*Completed: 2026-03-14*
