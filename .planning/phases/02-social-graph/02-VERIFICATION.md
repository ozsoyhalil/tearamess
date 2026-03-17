---
phase: 02-social-graph
verified: 2026-03-17T08:30:00Z
status: human_needed
score: 12/14 must-haves verified
re_verification: false
human_verification:
  - test: "isFollowing accuracy against real Supabase DB"
    expected: "isFollowing(A, B) returns false when A does not follow B"
    why_human: "Implementation uses array .select() then checks data !== null. Supabase returns [] not null for empty array queries, so data !== null is always true. Tests pass because mocks return null directly. Need real DB call to confirm actual behavior."
  - test: "getProfileByUsername 'not found' error message in browser"
    expected: "Navigating to /users/doesnotexist shows 'Kullanıcı bulunamadı' to user"
    why_human: "getProfileByUsername uses .single() not .maybeSingle(). With real Supabase, PGRST116 error fires when no row found — the if(error) branch returns error.message (PostgREST message), not the Turkish string on line 33. The Turkish string is unreachable dead code. Need to confirm what error message the user actually sees."
---

# Phase 2: Social Graph Verification Report

**Phase Goal:** Implement the social graph — follow/unfollow system, activity feed, and public user profiles
**Verified:** 2026-03-17T08:30:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Test stubs exist for all social service functions before implementation | VERIFIED | follows.test.ts (9 cases), feed.test.ts (3 cases), profiles.test.ts extended with 2 getProfileByUsername cases |
| 2 | Running jest produces failures (RED) when implementation missing, not errors | VERIFIED | Plan 01 was designed this way; now tests pass GREEN — lifecycle confirmed |
| 3 | FeedItem union type discriminates between visit and review activity | VERIFIED | src/types/feed.ts exports VisitActivity, ReviewActivity, FeedItem with `type` discriminant field |
| 4 | formatRelativeTime outputs Turkish relative strings without npm install | VERIFIED | src/lib/utils/relativeTime.ts uses native Intl.RelativeTimeFormat('tr') |
| 5 | followUser and unfollowUser correctly write/delete rows in follows table | VERIFIED | follows.ts lines 4-28; 4 follows tests GREEN |
| 6 | isFollowing returns accurate boolean for any follower/following pair | UNCERTAIN | Implementation uses `.select()` (array) then `data !== null` — empty array is not null; may always return true against real DB. Tests pass with mocks returning null. Human reviewer reported working in browser. |
| 7 | getFeed returns merged FeedItems from follows, respects cursor pagination | VERIFIED | feed.ts implements two-query merge with Promise.all + .lt('created_at', cursor); 3 feed tests GREEN |
| 8 | getProfileByUsername resolves a profile by username slug | VERIFIED | profiles.ts line 23-34 exists and queries by username; tests GREEN |
| 9 | Writing a review automatically records a visit | VERIFIED | reviews.ts line 3 imports recordVisit; line 29 calls `recordVisit(...).catch(() => {})` after successful insert |
| 10 | All five UI components exist and are wired to services | VERIFIED | FollowButton, FollowListModal, FeedCard, FeedSkeleton, ProfileLayout — all non-trivial implementations; wiring confirmed by grep and code inspection |
| 11 | Logged-out users at / see landing page, logged-in see feed | VERIFIED | page.tsx uses useAuth() to split into LandingPage and FeedPage components; auth check on line 233 |
| 12 | Any user can visit /users/[username] to see public profile | VERIFIED | src/app/users/[username]/page.tsx calls getProfileByUsername(username) and renders ProfileLayout with isOwnProfile=false |
| 13 | Own /profile page shows follower/following counts and modals | VERIFIED | profile/page.tsx uses ProfileLayout with isOwnProfile=true, fetches getFollowerCount + getFollowingCount, renders two FollowListModal instances |
| 14 | getProfileByUsername 'not found' returns Turkish error string | UNCERTAIN | Uses .single() not .maybeSingle(); Turkish string 'Kullanıcı bulunamadı' on line 33 is unreachable dead code when DB returns PGRST116 error — the Supabase error message would be returned instead |

**Score:** 12/14 truths verified (2 uncertain, requiring human confirmation)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|---------|--------|---------|
| `src/lib/services/follows.test.ts` | Failing stubs for followUser, unfollowUser, isFollowing, getFollowerCount, getFollowers, getFollowing | VERIFIED | 9 test cases across 6 describe blocks |
| `src/lib/services/feed.test.ts` | Failing stubs for getFeed (empty, merged, cursor) | VERIFIED | 3 test cases |
| `src/lib/services/profiles.test.ts` | Extended with getProfileByUsername cases | VERIFIED | 2 new cases added to existing file |
| `src/types/follow.ts` | Follow, FollowProfile types | VERIFIED | Both interfaces exported, correct shape |
| `src/types/visit.ts` | Visit with nested places shape | VERIFIED | Interface with optional places nested type |
| `src/types/feed.ts` | FeedItem discriminated union | VERIFIED | VisitActivity, ReviewActivity, FeedItem exported |
| `src/lib/utils/relativeTime.ts` | formatRelativeTime using Intl.RelativeTimeFormat('tr') | VERIFIED | Uses native Intl API, no library, correct locale |
| `src/lib/services/follows.ts` | followUser, unfollowUser, isFollowing, getFollowerCount, getFollowers, getFollowing | VERIFIED | All 7 functions exported; tests GREEN |
| `src/lib/services/feed.ts` | getFeed with cursor-based pagination | VERIFIED | Two-query merge with PAGE_SIZE=20, cursor via .lt() |
| `src/lib/services/visits.ts` | getUserVisits, recordVisit | VERIFIED | getUserVisits with place join; recordVisit with upsert onConflict |
| `src/lib/services/profiles.ts` | getProfileByUsername added | VERIFIED | Function appended without modifying existing functions |
| `src/lib/services/reviews.ts` | createReview calls recordVisit | VERIFIED | recordVisit imported and called with .catch(() => {}) on line 29 |
| `src/components/FollowButton.tsx` | Optimistic follow/unfollow with three visual states | VERIFIED | Three-state labels, isPending guard, revert on error |
| `src/components/FollowListModal.tsx` | Modal overlay with per-entry follow buttons | VERIFIED | role="dialog", aria-modal, close button, SkeletonRow loading state |
| `src/components/FeedCard.tsx` | Activity card for both FeedItem variants | VERIFIED | Uses type discriminant, formatRelativeTime, StarRating for reviews |
| `src/components/FeedSkeleton.tsx` | Loading skeleton for feed cards | VERIFIED | Renders count (default 5) animated placeholder cards |
| `src/components/ProfileLayout.tsx` | Shared profile shell with header, tabs, conditional controls | VERIFIED | isOwnProfile prop controls FollowButton vs edit link; three tabs |
| `src/app/page.tsx` | Auth-split home: landing for logged-out, feed for logged-in | VERIFIED | LandingPage and FeedPage inline components with auth split |
| `src/app/users/[username]/page.tsx` | Public user profile page | VERIFIED | Uses getProfileByUsername, ProfileLayout, FollowListModal instances |
| `src/app/profile/page.tsx` | Own profile with follower/following counts and modals | VERIFIED | ProfileLayout isOwnProfile=true, two FollowListModal overlays |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| follows.test.ts | follows.ts | `from './follows'` import | VERIFIED | Line 13 in follows.test.ts |
| feed.test.ts | feed.ts | `from './feed'` import | VERIFIED | Line 13 in feed.test.ts |
| follows.ts | src/types/follow.ts | `import type { FollowProfile }` | VERIFIED | Line 2 in follows.ts |
| feed.ts | src/types/feed.ts | `import type { FeedItem }` | VERIFIED | Line 2 in feed.ts |
| feed.ts | follows table (Supabase) | `supabase.from('follows').select('following_id').eq('follower_id', userId)` | VERIFIED | Lines 13-16 in feed.ts |
| reviews.ts | visits.ts | `recordVisit(userId, placeId)` after successful insert | VERIFIED | Line 3 import, line 29 call in reviews.ts |
| FollowButton.tsx | follows.ts | `followUser, unfollowUser imports` | VERIFIED | Line 5 in FollowButton.tsx |
| ProfileLayout.tsx | FollowButton.tsx | `<FollowButton` rendered when !isOwnProfile | VERIFIED | Lines 103-108 in ProfileLayout.tsx |
| FeedCard.tsx | relativeTime.ts | `formatRelativeTime` import | VERIFIED | Line 6 in FeedCard.tsx |
| page.tsx | feed.ts | `getFeed(user.id, cursor)` in useEffect | VERIFIED | Line 9 import, line 116 call in page.tsx |
| users/[username]/page.tsx | profiles.ts | `getProfileByUsername(params.username)` | VERIFIED | Line 10 import, line 45 call |
| users/[username]/page.tsx | ProfileLayout.tsx | `<ProfileLayout` with isOwnProfile=false | VERIFIED | Line 126 in users/[username]/page.tsx |
| profile/page.tsx | ProfileLayout.tsx | `<ProfileLayout` with isOwnProfile=true | VERIFIED | Line 85 in profile/page.tsx |

---

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| SOCL-01 | 02-01, 02-02, 02-03, 02-04, 02-05, 02-06 | User can follow another user (one-way) | SATISFIED | followUser, unfollowUser in follows.ts; FollowButton component with optimistic UI; /users/[username] page wired |
| SOCL-02 | 02-01, 02-02, 02-03, 02-04, 02-05, 02-06 | User can see own follow/following list | SATISFIED | getFollowerCount, getFollowingCount, getFollowers, getFollowing in follows.ts; FollowListModal component; profile/page.tsx fetches counts and renders modals |
| SOCL-03 | 02-01, 02-02, 02-03, 02-04, 02-05, 02-06 | User can see activity feed from followed accounts | SATISFIED | getFeed in feed.ts with two-query merge; FeedCard renders visit+review variants; page.tsx with IntersectionObserver infinite scroll; landing page for logged-out |
| SOCL-04 | 02-01, 02-02, 02-03, 02-04, 02-05, 02-06 | User can see another user's public profile, lists, visit history | SATISFIED | getProfileByUsername in profiles.ts; ProfileLayout with Visits/Lists/Reviews tabs; users/[username]/page.tsx with getUserVisits |

No orphaned requirements — all four SOCL requirements declared in plans, implemented in services and pages.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/lib/services/follows.ts` | 41 | `data !== null` check against array `.select()` result — empty array is truthy, not null | Warning | `isFollowing` may always return `true` against real DB. Tests pass because mocks return null directly. Human reviewer confirmed working, but accuracy needs DB-level verification. |
| `src/lib/services/profiles.ts` | 30, 33 | `.single()` used instead of `.maybeSingle()` for username lookup; Turkish error string on line 33 is dead code | Warning | When username not found, Supabase PGRST116 error message is returned instead of 'Kullanıcı bulunamadı'. Not user-facing catastrophic failure, but wrong message. |
| `src/lib/services/follows.ts` | 72-73 | PostgREST FK join syntax `profiles(username)` used instead of two-query pattern | Warning | RESEARCH.md (Pitfall 2) warned this may fail: follows.follower_id references auth.users, not public.profiles — no direct FK path for PostgREST to auto-join. Human reviewer confirmed working, suggesting DB FK path exists or query was flexible enough. |

---

### Human Verification Required

#### 1. isFollowing accuracy with real Supabase DB

**Test:** Log in as User A. Navigate to /users/[username] of User B who User A does NOT follow. Check whether the FollowButton shows "Takip Et" (not following) or "Takip Ediliyor" (following).
**Expected:** Button shows "Takip Et" — the user is not yet following this person.
**Why human:** The `isFollowing` implementation uses `.select('follower_id, following_id')` (array query) and checks `data !== null`. Real Supabase returns `[]` (empty array, not null) when no row matches. `[] !== null` is `true`, meaning the function would return `{ data: true }` even when not following. Tests pass because mocks return `null` directly. If this bug is real in production, the FollowButton would always show "Takip Ediliyor" — but the human reviewer in Plan 06 approved the follow behavior as working, which is contradictory. Either (a) the DB has been set up and it works despite the logic, (b) the test environment differs, or (c) human testing was not thorough on this specific state.

#### 2. getProfileByUsername error message for unknown username

**Test:** Navigate to /users/doesnotexist (a username that does not exist).
**Expected:** User sees "Kullanıcı bulunamadı" message (or similar Turkish 404 state).
**Why human:** `getProfileByUsername` uses `.single()` which, with the real Supabase client, returns `{ data: null, error: { code: 'PGRST116', message: 'JSON object requested...' } }` when no row is found. The function's `if (error)` branch returns `error.message` (the PostgREST message), not the Turkish string 'Kullanıcı bulunamadı' on line 33. The page renders "Kullanıcı bulunamadı." as its own fallback string (users/[username]/page.tsx line 111), so the user-visible text is likely correct — but the service layer is not providing the Turkish string as designed.

---

### Gaps Summary

No critical blockers found. All 20 required artifacts exist and are substantive. All 13 key links are wired. All 24 service tests pass. TypeScript compiles clean. Human reviewer confirmed all four SOCL requirements working in the browser (Plan 06).

Two code-level behavioral concerns were identified that do not block human-verified functionality but warrant confirmation:

1. `isFollowing` logic is technically incorrect for real Supabase array queries — but human verification confirmed the follow button worked correctly in the browser. This contradiction needs resolution: either the DB returns single-object data for this query (possible if the PostgREST select returns a scalar), or the human testing was done under different conditions.

2. `getProfileByUsername` uses `.single()` instead of `.maybeSingle()` — the Turkish error string is dead code, but the page-level fallback handles the display correctly so users see appropriate text.

These are warning-level findings. The phase goal — implement the social graph — is substantively achieved across all four SOCL requirements.

---

_Verified: 2026-03-17T08:30:00Z_
_Verifier: Claude (gsd-verifier)_
