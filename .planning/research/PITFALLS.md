# Pitfalls Research

**Domain:** Place discovery / social check-in platform (Letterboxd for venues, Ankara grid)
**Researched:** 2026-03-13
**Confidence:** HIGH (stack-specific pitfalls from well-documented patterns) / MEDIUM (geo grid, anonymous content)

---

## Critical Pitfalls

### Pitfall 1: RLS Policies Written for Current Features, Not Future Ones

**What goes wrong:**
RLS policies are added incrementally as features ship. The anonymous notes feature ships later, after social follows and stats already exist. A developer writes an RLS policy for notes that looks correct but assumes `auth.uid()` is always present. Anonymous reads, server-side rendering via service role, or unauthenticated users trigger policy failures silently — either returning empty results or throwing 406/403 errors with no clear trace.

**Why it happens:**
Supabase RLS policies are written per-table in isolation. Developers test with an authenticated user in the browser and the policy passes. They don't test the unauthenticated path, the service role path, or the case where a row exists but the current user has no location claim yet. The location-gate check ("has user visited this location?") requires a JOIN or subquery inside the policy — this is easy to get wrong and hard to test.

**How to avoid:**
- Write a full RLS policy matrix before any feature touches the DB: for each table, list (anon, authenticated, service_role) × (SELECT, INSERT, UPDATE, DELETE) and what each cell should return.
- Anonymous notes location-gate: the policy must JOIN `check_ins` or `visit_logs` to verify the reading user has a confirmed visit to the same grid cell or place. Test this policy with a dedicated Supabase policy test script before the feature ships.
- Never assume a user has a session when writing RLS for read paths; always consider the unauthenticated case explicitly.
- Enable `pgrst.db_anon_role` only if intentional. Default deny on all new tables.

**Warning signs:**
- Empty arrays returned from Supabase queries with no error in the console (silent RLS block)
- A feature works in development (service role or anon key bypasses) but breaks for real users
- `auth.uid()` appearing in policies without a null-check guard (`auth.uid() IS NOT NULL AND ...`)
- Policy written without a corresponding test

**Phase to address:** The phase introducing anonymous notes (location-gated content). RLS policy matrix should be an artifact produced in that phase, not retroactively.

---

### Pitfall 2: The Grid System Becoming a Coordinate Mismatch Nightmare

**What goes wrong:**
The Ankara grid is designed in one coordinate system (e.g., WGS84 lat/lng bounding boxes), but the application stores venue coordinates as simple decimal lat/lng without a spatial index. As grid-cell membership queries run — "which cell does this venue belong to?" and "which cells has this user visited?" — they are computed client-side or via expensive PostgreSQL arithmetic on every request. At first this works fine. As the place count grows and the grid is rendered with 50–200 cells, query time explodes and the grid becomes the slowest page in the app.

**Why it happens:**
Developers start by computing cell membership in JavaScript ("latitude is between X and Y, longitude is between A and B"). This works for 20 places. It does not scale to 500 places rendered on a grid with user-specific coloring. Nobody installs PostGIS because "it feels like overkill for one city."

**How to avoid:**
- Store a pre-computed `grid_cell_id` (e.g., `"ankara_r12_c07"`) on each venue row and each check-in row at write time, not query time.
- Define the Ankara grid as a static lookup table (or a constants file) with fixed cell boundaries and IDs. Grid membership is then a simple equality check (`WHERE grid_cell_id = $1`), not a range query.
- Add a DB index on `grid_cell_id` immediately. This is a one-line migration, not a refactor.
- The grid boundary data (Ankara city limits, cell count, cell size) must be locked down before any data is written, because retroactive re-gridding every existing row is expensive.

**Warning signs:**
- Grid cell assignment happens in a React component or a client-side utility function
- `venues` table has no `grid_cell_id` column
- Grid page makes N+1 Supabase queries (one per cell)
- "Works fine with 30 places, feels slow with 100"

**Phase to address:** The grid/exploration phase — grid cell ID must be part of the schema design, not added as an afterthought after venues are already populated.

---

### Pitfall 3: Social Feed Built as a Fan-Out-on-Read with No Pagination

**What goes wrong:**
The social feed ("activity from people I follow") is implemented as: fetch all user IDs I follow → fetch all recent activity from those users → merge and sort client-side. This is fan-out-on-read without a materialized feed table. At 10 follows it works. At 50 follows with active users it produces dozens of parallel Supabase queries or one giant `IN (...)` clause. Client-side merging of multiple async result sets introduces race conditions and inconsistent ordering.

**Why it happens:**
The app is already client-heavy with no service layer (confirmed in CONCERNS.md). The path of least resistance is to replicate the same "fetch everything and filter client-side" pattern that the existing place list uses. Nobody creates a `feed_events` table because it feels like premature optimization.

**How to avoid:**
- Build the feed as a single parameterized DB query from day one: `SELECT * FROM activity_events WHERE actor_id IN (SELECT followee_id FROM follows WHERE follower_id = $me) ORDER BY created_at DESC LIMIT 20 OFFSET $cursor`.
- This is a single SQL query, not N client-side fetches. Supabase can execute it directly.
- Add cursor-based pagination (use `created_at` + `id` as the cursor, not `OFFSET` — `OFFSET` is O(n) in PostgreSQL).
- Implement this as a Supabase RPC (database function) so the query logic lives in the DB, not scattered across client components.

**Warning signs:**
- Feed implementation uses `Promise.all([...follows.map(id => supabase.from('events').eq('user_id', id))])`
- No `activity_events` or unified feed table exists
- Feed component holds multiple independent `useEffect` calls for data fetching
- No pagination component or "load more" on the feed

**Phase to address:** The social follow phase — the feed schema must be designed when follows are built, not bolted on afterwards.

---

### Pitfall 4: Anonymous Notes That Are Not Actually Anonymous (or Not Actually Gated)

**What goes wrong:**
Two failure modes exist here, and they pull in opposite directions.

Failure mode A (not anonymous enough): The anonymous note is stored with `user_id` in the DB for moderation purposes (reasonable), but the API response includes `user_id` in the payload. The client "hides" it in the UI. Any user with browser devtools or direct Supabase access can see who wrote every "anonymous" note.

Failure mode B (not gated enough): The location gate is enforced only on the client. The component checks if the user has a check-in near the location before rendering the note. But the Supabase query that fetches notes has no server-side enforcement — any user can query the `anonymous_notes` table directly and receive all notes regardless of location history.

**Why it happens:**
Developers implement the happy path (logged-in user who has visited sees the note in the UI) and consider the feature done. The adversarial paths (API bypass, devtools inspection) are not in the acceptance criteria.

**How to avoid:**
- Store `user_id` on anonymous notes only for internal moderation. The SELECT RLS policy must exclude `user_id` from the response columns for non-admin roles — use a view or a computed column that returns `null` for `user_id` on SELECT.
- The location gate must be enforced in an RLS policy, not in client code. The policy checks: `EXISTS (SELECT 1 FROM check_ins WHERE user_id = auth.uid() AND place_id = anonymous_notes.place_id)`. This runs server-side on every query.
- Never trust client-side gate enforcement for content that has a privacy expectation.

**Warning signs:**
- Anonymous notes feature ships before the RLS policy is written and tested
- `user_id` column present on `anonymous_notes` table with no view masking it
- Location-gate logic appears in a React component or client-side hook rather than in a DB migration file
- No test that verifies a non-visitor cannot fetch a note via direct Supabase query

**Phase to address:** The anonymous notes phase — treat the RLS policy as a required deliverable of this phase, not a follow-up task.

---

### Pitfall 5: Rebuilding Service Layer Incrementally Causes Inconsistent Patterns

**What goes wrong:**
The existing app has no service layer — all Supabase queries are inline in page components (confirmed in CONCERNS.md). When new features are added, some developers add a `lib/` service layer, others keep using inline queries, and some mix both. After three phases, the codebase has three incompatible patterns: inline component queries, ad-hoc service functions, and a partially-implemented repository layer. Refactoring later requires touching every component.

**Why it happens:**
Each feature phase feels isolated. "I'll just add this one query here for now." The service layer never gets a first-class design pass before feature work starts — it grows organically and inconsistently.

**How to avoid:**
- Before any new feature work: establish the service layer pattern as a single foundational phase or a pre-requisite task.
- Decision: use a repository pattern (`VenueRepository`, `UserRepository`, `FeedRepository`) with typed return values driven by Supabase generated types.
- All new feature work exclusively uses the service layer — never direct Supabase queries in components.
- Migrate existing inline queries to the service layer in the same foundational phase (the tech debt is small enough now to address before it compounds).

**Warning signs:**
- New feature PR introduces `supabase.from('venues')` directly in a page component
- Two different files both fetch user profiles using different query shapes
- No `src/lib/` or `src/services/` directory exists
- Types for DB rows are defined ad-hoc in each file instead of from a generated schema

**Phase to address:** First milestone, as a mandatory pre-requisite before any of the active features are built.

---

### Pitfall 6: Gamification Stats That Cannot Be Recomputed

**What goes wrong:**
User stats (places visited count, categories distribution, grid cells conquered percentage) are computed on-the-fly from raw check-in data with every profile page load. Early on this is fast. As a user accumulates 200 check-ins, the profile page triggers 3–5 aggregation queries that each scan the full check-ins table filtered by user. Page load exceeds 2 seconds. Worse: if a check-in is deleted or a place's category is changed, cached counts become stale with no invalidation path.

**Why it happens:**
Stats feel like "just counts" — `SELECT COUNT(*)` seems cheap. The complexity is hidden: category distribution requires a JOIN to places, grid coverage requires a JOIN to grid cells, and the full stats page may need 5+ separate aggregation queries.

**How to avoid:**
- Store pre-computed stats in a `user_stats` table, updated via a database trigger or a Supabase Edge Function on check-in insert/delete.
- The stats table holds: `total_visits`, `unique_places`, `grid_cells_visited[]`, `category_counts JSONB`. These are O(1) reads.
- Alternatively, use a PostgreSQL materialized view with periodic refresh — acceptable for a small Ankara-scoped dataset.
- Never run aggregation queries in the critical path of a page render.

**Warning signs:**
- Profile page makes 4+ Supabase queries before rendering
- Stats components use `useEffect` with multiple aggregation queries that run on every mount
- No `user_stats` table or materialized view in the schema
- Deleting a check-in does not update any stat counter

**Phase to address:** Stats/gamification phase — the trigger or stat-update mechanism must ship alongside the stats display, not as a follow-up optimization.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Inline Supabase queries in page components | Faster initial development | Untestable, duplicated logic, no type safety | Never for new features — existing code must be migrated first |
| Client-side filtering of full dataset | Zero backend changes needed | Exponential query payload growth, broken on mobile | Never beyond MVP with <50 records |
| `OFFSET`-based pagination | Simple to implement | O(n) PostgreSQL scan, inconsistent results with concurrent inserts | Never for feeds or large lists — use cursor pagination |
| Skipping Supabase type generation | No setup time | Runtime errors when schema changes, no autocomplete | Never — `supabase gen types` takes 30 seconds |
| Location gate enforcement in React only | Fast to ship | Privacy bypass via API, zero security value | Never for any content with privacy expectations |
| Computing grid cell membership at query time | No schema change | Slow range queries, impossible to index | MVP only if cell count <10 and place count <50; otherwise never |
| Storing anonymous note author in plain `user_id` column with no view mask | Simpler schema | Author identity leaks through any SELECT | Never — use a view or exclude column from RLS-gated reads |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Supabase RLS + Next.js Server Components | Using the anon client in Server Components — bypasses user context, RLS uses anon role instead of authenticated role | Create a server-side Supabase client using `createServerClient` from `@supabase/ssr` with cookies, not the browser client |
| Supabase RLS + anonymous notes | Writing `auth.uid() = user_id` as the only SELECT policy — blocks all reads when auth.uid() is null | Separate policies for authenticated reads (with location check) and explicitly deny unauthenticated reads |
| Next.js App Router + Supabase auth | Using `useUser()` hook in Server Components — it does not exist server-side | Use `supabase.auth.getUser()` in async Server Components; never use client hooks in server context |
| Supabase Realtime + social feed | Subscribing to the entire `activity_events` table — receives all users' events, not just followed users | Subscribe to a filtered channel using Postgres Changes with a `filter` param, or use polling instead |
| Grid rendering + Supabase | Fetching all places then computing grid membership in the browser | Store `grid_cell_id` on DB rows; query `SELECT grid_cell_id, COUNT(*) GROUP BY grid_cell_id` — one query for the whole grid |
| Supabase Edge Functions + RLS | Calling DB from an Edge Function with the anon key — RLS blocks writes that should be privileged (e.g., updating `user_stats` on check-in) | Edge Functions that need elevated access must use the service role key, stored only server-side, never in client bundle |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| All places loaded into client memory | Explore page becomes slow to navigate; filter UI lags | Server-side filtering with DB `WHERE` clauses; cursor pagination | ~200 places |
| Social feed via N parallel user queries | Feed takes 3–5s to load; waterfall visible in Network tab | Single JOIN query or RPC; one round-trip to DB | ~15 followed users |
| Stats recomputed on every profile load | Profile page slow; DB CPU spikes on popular user pages | Pre-computed `user_stats` table with trigger updates | ~100 check-ins per user |
| Grid cell membership computed at render | Grid page freezes during calculation; wrong cells highlighted | Pre-stored `grid_cell_id` on venue and check-in rows | ~100 venues on grid |
| Anonymous notes fetched without spatial index | Notes queries slow even with RLS; full table scan on every view | Index on `(place_id, created_at)` on notes table | ~500 notes |
| Full client-side auth check on every route | 200ms flash of unauthenticated content before redirect; SEO issues | Supabase middleware in `middleware.ts` with server-side session check | From day one |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| RLS policy on anonymous notes without location-gate | Any authenticated user reads any note regardless of visit history | Policy must JOIN check-ins: `EXISTS (SELECT 1 FROM check_ins WHERE user_id = auth.uid() AND place_id = notes.place_id)` |
| `user_id` exposed in anonymous note API response | Author identity leakable via devtools or direct API call | Create a DB view that returns `NULL` for `user_id`; grant SELECT on the view, not the base table |
| No rate limiting on check-in writes | User writes 1000 fake check-ins to unlock all anonymous notes without visiting | Supabase `pg_cron` or Edge Function rate check: max N check-ins per user per hour |
| No validation on grid cell coordinates sent from client | Client sends fabricated GPS coordinates to claim grid cells | Server (RLS + DB constraint) must validate coordinates fall within Ankara bounding box; never trust client-supplied coordinates |
| Missing auth check on event creation | Any user creates events for any venue | RLS `INSERT` policy must verify the inserting user is authenticated; optionally, only venue owners/admins |
| XSS via unescaped review/note content (existing) | Stored XSS via review or anonymous note text | Sanitize on input with a schema library (Zod + strip HTML) and escape on render; existing reviews must be retroactively scanned |
| Follow/unfollow endpoint without rate limit | Follow-spam or algorithmic follow harassment | Rate limit follow actions: max 50 new follows per hour per user via Edge Function or middleware |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Grid that shows 0% progress on first visit | New users feel no sense of progress; churn risk | Show "You've started your journey" empty state with first actionable CTA, not a blank grid |
| Anonymous note discovered with no context about how it was unlocked | Confusing — users don't understand why they can suddenly see a note | Show a one-time "You unlocked a note at this location" notification on first note discovery |
| Activity feed with no "nothing here yet" state | Blank page when following 0 people; users think it's broken | Suggest users to follow based on active reviewers in their area |
| Check-in with no confirmation that it recorded for grid/stats | Users unsure if their visit "counted" | Show immediate feedback: "Kuzey Ankara grid karesi güncellendi" toast on check-in |
| Wishlists with no way to distinguish visited vs. unvisited items | List becomes stale; visited items cluttered with unvisited | Automatically cross-reference wishlist items with check-ins and visually distinguish visited ones |
| Star rating allowing 0.0 stars visible on place cards | "0 stars" looks like an error or broken state, not "unrated" | Display "unrated" explicitly rather than "0/5" when no reviews exist |

---

## "Looks Done But Isn't" Checklist

- [ ] **Anonymous notes location gate:** Feature renders correctly for a logged-in user who has visited — verify that a logged-in user who has NOT visited cannot fetch notes via direct Supabase query (not just via the UI)
- [ ] **Grid cell assignment:** Grid visually colors cells based on visit data — verify that venues added BEFORE the grid feature was released have correct `grid_cell_id` values (retroactive migration ran)
- [ ] **Social follow feed:** Feed shows followed users' activity — verify that unfollowing a user removes their events from the feed immediately (not just on next page load)
- [ ] **User stats:** Stats counters show correct numbers — verify that deleting a check-in decrements the stat (not just increments on create)
- [ ] **Event listing on venue:** Events show on venue detail page — verify that past events are filtered out by default and that unauthenticated users see events but cannot RSVP
- [ ] **Wishlist:** Places appear in wishlist — verify that a place already visited is visually distinguished from unvisited, and that the wishlist is private to the owner by default
- [ ] **Service layer migration:** New code uses service layer — verify no new `supabase.from()` calls exist directly in `page.tsx` or component files
- [ ] **RLS completeness:** All new tables have RLS enabled — verify with `SELECT tablename FROM pg_tables WHERE schemaname = 'public'` joined against `pg_policies` to find tables with no policy

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| RLS policy written without location gate | MEDIUM | Write and deploy corrected policy; audit existing reads to check for data leaks; no data migration needed |
| Grid cell IDs missing on existing venue rows | MEDIUM | Write a one-time migration script: for each venue, compute cell from lat/lng and UPDATE; add constraint/trigger to prevent future gaps |
| Social feed built as N parallel queries | HIGH | Add `activity_events` feed table; backfill historical events; migrate feed component to single-query pattern; deprecate parallel fetch pattern |
| Anonymous notes with user_id in API response | LOW | Create a DB view masking user_id; update client queries to use view instead of base table |
| Stats recomputed on every request | MEDIUM | Add `user_stats` table; write backfill script for existing users; add DB trigger for future updates |
| No service layer, everything inline | HIGH | Introduce service layer in a dedicated refactor phase; migrate file-by-file with tests; cannot be done alongside feature work |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| RLS policy gaps (general) | Phase 1: Foundation/service layer | Automated policy audit query run in CI |
| Anonymous notes not truly gated | Phase: Anonymous Notes feature | Integration test: unauthenticated Supabase query to notes table returns 0 rows |
| Anonymous notes author leakable | Phase: Anonymous Notes feature | API response for notes asserts `user_id === null` for all rows |
| Grid cell mismatch/performance | Phase: Grid System (must precede any place writes that use grid) | All existing venues have non-null `grid_cell_id`; grid page makes exactly 1 DB query |
| Social feed N+1 queries | Phase: Social Follow System | Feed component network tab shows 1 request; pagination works with cursor |
| Stats non-recomputable | Phase: Stats & Gamification | Delete a check-in, verify counter decrements within 1 second |
| Service layer inconsistency | Phase 1: Foundation (before all feature phases) | No `supabase.from()` calls in `app/` or `components/` directories (enforced via ESLint rule) |
| Client-side auth only (existing debt) | Phase 1: Foundation | `middleware.ts` exists and redirects unauthenticated users server-side; verified with a curl request |
| XSS via unescaped content (existing debt) | Phase 1: Foundation | Zod schema validation on all form submits; DOMPurify or equivalent on render of user content |
| Fake GPS coordinates for grid unlock | Phase: Grid System | DB constraint: `CHECK (lat BETWEEN 39.7 AND 40.3 AND lng BETWEEN 32.4 AND 33.2)` for Ankara bounds |

---

## Sources

- Supabase RLS documentation (official, `supabase.com/docs/guides/database/row-level-security`) — HIGH confidence
- PostgreSQL RLS policy patterns, including JOIN-in-policy and null auth.uid() handling — HIGH confidence
- Next.js App Router + Supabase SSR authentication patterns (`supabase.com/docs/guides/auth/server-side/nextjs`) — HIGH confidence
- Fan-out-on-read vs. fan-out-on-write social feed architecture — well-documented pattern (Instagram engineering, activity stream literature) — HIGH confidence
- Cursor-based pagination vs. OFFSET in PostgreSQL — documented performance characteristic — HIGH confidence
- Location-gated content RLS pattern — derived from Supabase documentation and PostgreSQL policy design — MEDIUM confidence (no single canonical source for this exact pattern)
- Grid system pre-computation approach — derived from geospatial database best practices (PostGIS docs, H3 grid system design) — MEDIUM confidence
- Gamification stat pre-computation via triggers — standard OLAP/OLTP separation pattern — HIGH confidence
- Existing codebase concerns documented in `.planning/codebase/CONCERNS.md` — HIGH confidence (direct inspection)

---
*Pitfalls research for: Place discovery / social check-in platform (Tearamess — Ankara)*
*Researched: 2026-03-13*
