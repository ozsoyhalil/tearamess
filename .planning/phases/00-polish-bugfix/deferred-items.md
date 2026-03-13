# Deferred Items — Phase 00-polish-bugfix

Items discovered during plan execution that are out of scope for the current plan.

---

## Pre-existing TypeScript Errors in profile/page.tsx

**Discovered during:** Plan 01 (00-01), full `npx tsc --noEmit` verification
**File:** `src/app/profile/page.tsx`
**Errors:**
1. Line 46: `TS2352` — Type cast overlap: Supabase query result type `{ places: Array<{ name: any; ... }[]> }` not assignable to `Review[]` because `places` field is an array of objects but the `Review` type expects plain object properties.
2. Line 183: `TS1117` — Object literal has duplicate property name.

**Status:** Out of scope for Plan 01 (UI primitives). These errors predate Plan 01.
**Recommended fix phase:** Plan 03 (token migration + page refactor) when profile/page.tsx will be edited anyway, or Plan 02 if the rating pipeline fix touches profile types.
