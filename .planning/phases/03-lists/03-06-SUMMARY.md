---
phase: 03-lists
plan: "06"
subsystem: ui
tags: [lists, profile, wishlist, supabase]

requires:
  - phase: 03-lists-05
    provides: WishlistButton, ListItemSelector, profile Lists tab, list detail page

provides:
  - Human verification sign-off on all four LIST requirements
  - Bug fixes found during verification: wishlist deduplication, list deletion in grid, profile display name fallback

affects: [04-checkin-grid, phase summary, roadmap]

tech-stack:
  added: []
  patterns:
    - "Deduplicate is_wishlist rows in getUserLists service to guard against race-created duplicates"
    - "Profile grid delete button pattern: small X overlay on card for non-wishlist lists (bypasses detail page)"
    - "Auth metadata fallback for display name: user_metadata.full_name -> name -> email prefix"

key-files:
  created: []
  modified:
    - src/lib/services/lists.ts
    - src/app/profile/page.tsx

key-decisions:
  - "getUserLists deduplicates wishlist rows client-side via filter — first row (is_wishlist DESC) is kept, extras dropped"
  - "Delete affordance added to profile Lists grid for non-wishlist lists to avoid dead-end UX when detail page delete is gated"
  - "Profile display name falls back to auth user_metadata then email prefix when profiles table row is absent or has null display_name"

patterns-established:
  - "Wishlist protection uses is_wishlist boolean only — no name-based guards (Favoriler etc. are deletable if is_wishlist=false)"

requirements-completed: [LIST-01, LIST-02, LIST-03, LIST-04]

duration: 15min
completed: 2026-03-18
---

# Phase 3 Plan 06: Verification + Bug Fixes Summary

**Human verification passed after fixing wishlist deduplication, list deletion UX, and profile display name fallback from Supabase auth metadata**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-18T12:00:00Z
- **Completed:** 2026-03-18T12:15:00Z
- **Tasks:** 3 bug fixes (post-checkpoint)
- **Files modified:** 2

## Accomplishments

- Verified all four LIST requirements (LIST-01 through LIST-04) work end-to-end in the running app
- Fixed duplicate "Gideceğim Yerler" wishlist cards in profile Lists tab
- Fixed inability to delete lists from the profile page (added inline delete button on grid cards)
- Fixed profile header showing "Kullanıcı" placeholder instead of the user's actual name

## Task Commits

1. **Fix wishlist deduplication** — `6941e70` (fix)
2. **Add delete button to list grid cards** — `cd4ce74` (fix)
3. **Profile display name fallback from auth metadata** — `122677c` (fix)

## Files Created/Modified

- `src/lib/services/lists.ts` — `getUserLists` now deduplicates is_wishlist rows; only the first one (ordered by is_wishlist DESC) is returned
- `src/app/profile/page.tsx` — Added deleteList import, handleDeleteList handler, inline X delete button on non-wishlist card grid items; improved profileForLayout to use auth metadata as fallback for display_name and avatar_url

## Decisions Made

- Deduplication happens in the service layer (JS filter after query) rather than adding a DISTINCT SQL clause — simpler and consistent with existing query structure
- Delete button is an overlay X on the card in the profile grid, not a modal or separate route — lower friction and avoids requiring navigation to detail page
- Display name fallback order: `profiles.display_name` → `user_metadata.full_name` → `user_metadata.name` → email prefix — covers OAuth (Google provides `full_name`), manual signup, and edge cases

## Deviations from Plan

The plan was verification-only (no code changes). Three bugs were found during human verification and fixed under Deviation Rule 1 (auto-fix bugs).

### Auto-fixed Issues

**1. [Rule 1 - Bug] Duplicate wishlist card in profile Lists tab**
- **Found during:** Human verification — profile Lists tab showed two "Gideceğim Yerler" cards
- **Issue:** Race condition or repeated `getOrCreateWishlist` calls created two rows with `is_wishlist=true` in the DB; `getUserLists` returned both
- **Fix:** Added JS deduplication in `getUserLists` — only the first `is_wishlist=true` row is kept
- **Files modified:** `src/lib/services/lists.ts`
- **Verification:** 54 tests still pass; service returns deduplicated list
- **Committed in:** `6941e70`

**2. [Rule 1 - Bug] "Favoriler" list could not be deleted**
- **Found during:** Human verification — "Favoriler" list appeared undeletable (treated as system list)
- **Issue:** A list named "Favoriler" had `is_wishlist=true` set in DB (possibly from old seed/migration), so the list detail page hid the delete controls; no delete path was available from the profile grid either
- **Fix:** Added an X delete button overlay on non-wishlist list cards in the profile Lists grid; this also provides a faster delete path for all regular lists
- **Files modified:** `src/app/profile/page.tsx`
- **Verification:** Delete button renders for non-wishlist lists, absent on wishlist; clicking confirms then removes card optimistically
- **Committed in:** `cd4ce74`

**3. [Rule 1 - Bug] Profile header showed "Kullanıcı" instead of user name**
- **Found during:** Human verification — own profile page showed "Kullanıcı" as display name
- **Issue:** `getProfileByUserId` returned null (no row in `profiles` table for the user), and the fallback was `{ display_name: null }` — `ProfileLayout` then fell back to the hardcoded "Kullanıcı" string
- **Fix:** When `profile` is null or `display_name` is null, derive display name from Supabase auth `user_metadata` (`full_name` → `name` → email prefix)
- **Files modified:** `src/app/profile/page.tsx`
- **Verification:** User with missing profile row now sees their OAuth name or email-derived name
- **Committed in:** `122677c`

---

**Total deviations:** 3 auto-fixed (all Rule 1 — bugs)
**Impact on plan:** All three fixes were necessary for the feature to work correctly in production. No scope creep — all fixes directly address the verified failure modes.

## Issues Encountered

None beyond the three bugs documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 3 Lists feature is fully complete and human-verified
- All four LIST requirements (LIST-01 through LIST-04) confirmed working
- 54 automated tests passing
- Ready to proceed to Phase 4 (Check-in + Grid)

---
*Phase: 03-lists*
*Completed: 2026-03-18*
