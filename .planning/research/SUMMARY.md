# Project Research Summary

**Project:** Tearamess
**Domain:** Place discovery / social check-in / city exploration (brownfield extension)
**Researched:** 2026-03-13
**Confidence:** MEDIUM (no live network access; training data through August 2025)

## Executive Summary

Tearamess is a Letterboxd-for-venues product built on an existing Next.js + Supabase codebase. The product already has auth, place browsing, ratings, and a basic profile. The v1.1 milestone adds the social graph (follow, feed), custom lists, a personal stats dashboard, an Ankara city grid conquest mechanic, and anonymous location-gated notes. The recommended approach is to build a service/repository layer first as a non-negotiable foundation, then add each feature domain on top of it. The current codebase violates this boundary — Supabase queries live inline in page components — and every new feature built without first correcting this pattern will compound the debt.

The Ankara grid conquest mechanic is the single strongest differentiator. No competitor (Swarm, Foursquare, Google Maps, Beli) offers a visual city-canvas that a user "paints" by living in it. The key risks are geo correctness (grid cell IDs must be pre-computed at write time, never at render time), social feed performance (must be a single JOIN query from day one, not N parallel client-side fetches), and anonymous note security (the location gate must be enforced by RLS policy, not by client-side UI logic). All three are avoidable if addressed in the correct phase order.

The stack is stable and the additions are minimal: PostGIS (already available as a Supabase extension), Leaflet + react-leaflet for map rendering, ngeohash for grid math, SWR for feed caching, React Hook Form + Zod for forms, date-fns for dates, and Recharts for the stats page. No billing-locked mapping provider is needed. No global state library is needed. The recommended library choices are conservative and have direct compatibility with the existing React 19 + Next.js 16 stack.

## Key Findings

### Recommended Stack

The existing stack (Next.js 16, React 19, Supabase JS 2, Tailwind 4, TypeScript 5) is not changing. All additions are additive. The most important structural addition is a service/repository layer (`src/services/` + `src/repositories/`) that moves all Supabase queries out of page components and behind typed function boundaries. This is an architectural change, not a library install — it is the prerequisite for everything else.

**Core technology additions:**
- **PostGIS** (Supabase extension, no npm): geo queries for radius search, grid cell assignment, and location-gated note verification — enable via Supabase dashboard
- **Leaflet + react-leaflet ^4.2.1**: interactive map with free OpenStreetMap tiles; `'use client'` required due to DOM access; Mapbox and Google Maps are explicitly excluded due to billing requirements
- **ngeohash ^0.6.3**: encodes lat/lng to grid cell ID and back; zero-dependency, zero alternatives worth considering
- **SWR ^2.3.0**: client-side data fetching for the activity feed; `mutate()` integrates with Supabase Realtime events; smaller bundle than TanStack Query for this use case
- **React Hook Form ^7.54.0 + Zod ^3.24.0**: standard form validation pattern in the Next.js ecosystem; Zod doubles as TypeScript type generator for all DB schemas and API payloads
- **date-fns ^3.6.0**: tree-shakeable, ESM-native date formatting; Moment.js is maintenance-mode and 67KB
- **Recharts ^2.13.0**: SVG-based React charts for the stats dashboard; verify React 19 peer dependency before install

### Expected Features

The app already ships: auth, place browse/detail, star rating, text reviews, add place, basic profile.

**Must have — this milestone (P1):**
- Wishlist ("Gideceğim Yerler") — every competitor has a save button; implement as a system-created list
- Custom user lists — Letterboxd's core organizing primitive; enables meaningful social layer
- One-way follow system + visible user profiles — prerequisite for the activity feed to mean anything
- Activity feed — core retention loop; empty without the social graph so ship together
- Personal stats dashboard — high perceived value, low data-model cost; drives repeat opens
- **Ankara grid map** — the primary differentiator; "I've covered 23% of Ankara" is the sticky metric

**Should have — this milestone (P2):**
- Anonymous location-gated notes — unique feature with no direct competitor analog; security design is complex
- Venue-based events — high complexity, depends on content bootstrap; ship last in this milestone or defer to v1.2

**Defer to v1.2+:**
- Grid social comparison ("you and @friend share X cells"), place mood/context tags, visit streaks/milestones, list discovery/editorial curation

**Defer to v2+:**
- Taste profile inference, social list recommendations, multi-city expansion, business/venue accounts

### Architecture Approach

The target architecture introduces a strict server-side layering: React components communicate with the server via Next.js Server Actions, Server Actions call a service layer (`src/services/`) that owns business rules, services delegate all DB access to a repository layer (`src/repositories/`), and repositories call Supabase exclusively through a server-side client. The browser Supabase client is restricted to auth state and optional Realtime subscriptions. Heavy geo and aggregation work lives in PostgreSQL functions called via `supabase.rpc()`. The current codebase violates this boundary; the first phase of work corrects it.

**Major components:**
1. **Service layer** (`src/services/`) — business rules, orchestration, Zod validation for all writes
2. **Repository layer** (`src/repositories/`) — all Supabase queries; returns typed domain objects; never called from components
3. **Next.js middleware** (`middleware.ts`) — server-side auth guard; replaces existing client-side `useEffect` redirect pattern
4. **PostGIS functions** — `get_grid_cell()`, proximity checks, location-gate verification; called via RPC, not computed in TypeScript
5. **AnkaraGrid component** — SVG grid renderer; `'use client'`; receives pre-computed cell data from server; never fetches from browser
6. **Supabase Realtime** (optional, v2) — activity feed push updates; pull-on-navigate is sufficient for v1

**Key database additions:**
`profiles`, `follows`, `check_ins` (with PostGIS geometry column), `user_grid_cells`, `activity_events`, `user_lists`, `list_places`, `place_events`, `location_notes`

### Critical Pitfalls

1. **Service layer never gets a first-class design pass** — every feature phase adds inline queries because "just this one." Prevention: service/repository scaffold is Phase 0, not a later refactor. Enforce with an ESLint rule banning `supabase.from()` outside `src/repositories/`.

2. **Grid cell IDs computed at query time, not stored at write time** — JS range queries over 200+ places become unbearably slow, and results cannot be indexed. Prevention: store `grid_cell_id` as a text column on both venues and check-ins at write time; add DB index immediately; lock Ankara grid boundaries before any data is written.

3. **Social feed built as N parallel client-side queries** — fan-out-on-read without a single JOIN query breaks at ~15 follows. Prevention: `activity_events` table + single JOIN query with cursor pagination from the start.

4. **Anonymous notes with author identity leakable or gate bypassable** — two failure modes: `user_id` exposed in API response (devtools reveals author), or location gate enforced only in UI (any authenticated user fetches all notes via direct Supabase query). Prevention: RLS policy with `EXISTS (SELECT 1 FROM check_ins WHERE user_id = auth.uid() AND place_id = notes.place_id)`; DB view masks `user_id` in SELECT responses.

5. **Stats recomputed on every profile load** — `SELECT COUNT(*)` with JOINs on every profile page render spikes DB CPU as check-ins accumulate. Prevention: `user_stats` table updated by DB trigger on check-in insert/delete; stats page reads one row.

6. **RLS policies written for happy path only** — policies tested with authenticated users pass; unauthenticated, service-role, and location-ungated reads silently return empty arrays. Prevention: write a full RLS policy matrix (anon, authenticated, service_role × SELECT, INSERT, UPDATE, DELETE) before any feature touches the DB.

## Implications for Roadmap

Based on dependency analysis across all four research files, the feature set has a clear build order: infrastructure before everything, social graph before feed, geo system before grid, notes last because they depend on both check-ins and the RLS design being solid.

### Phase 0: Foundation (Infrastructure + Service Layer)

**Rationale:** Nothing safe can be built on the current inline-query pattern. Every feature phase that skips this will multiply the refactor cost. This phase has no user-visible features but it is the precondition for all subsequent work.
**Delivers:** Server-side Supabase client, `middleware.ts` auth guard, service/repository scaffold, Supabase type generation, PostGIS enabled, Zod validation integrated, ESLint rule blocking direct Supabase calls from components
**Addresses:** (pre-requisite for all features)
**Avoids:** Service layer inconsistency pitfall, client-side auth flash, XSS via unescaped content (add Zod + sanitization here)
**Research flag:** Standard patterns — well-documented. Skip `/gsd:research-phase`.

### Phase 1: Social Graph (Follow System + User Profiles)

**Rationale:** The activity feed is the core daily retention loop, but it requires a follow graph to populate. Shipping follow without feed creates a dead-end; ship them as a unit in the same phase.
**Delivers:** One-way follow/unfollow, visible user profiles, `follows` table with RLS, `profiles` table, user discovery
**Addresses:** Follow + user profiles (P1), activity feed (P1, shipped together)
**Uses:** SWR for feed polling, Supabase Realtime `postgres_changes` for live feed updates (optional at this phase)
**Implements:** `user.service.ts`, `feed.service.ts`, `user.repository.ts`, `feed.repository.ts`, `activity_events` table with single JOIN query + cursor pagination
**Avoids:** Social feed N+1 pitfall (design the `activity_events` schema correctly here, not later)
**Research flag:** Standard patterns — established social graph architecture. Skip `/gsd:research-phase`.

### Phase 2: Lists + Wishlist

**Rationale:** Lists are independent of geo and can ship in parallel with or after Phase 1. Wishlist is a system-created special-case of the lists data model — implementing lists generically unlocks wishlist for free.
**Delivers:** Custom user lists (create, edit, add/remove places), wishlist as a system list ("Gideceğim Yerler"), list visibility on public profiles
**Addresses:** Wishlist (P1), custom lists (P1)
**Uses:** React Hook Form + Zod for list creation forms
**Implements:** `user_lists` + `list_places` tables, `list.service.ts`, list UI components
**Avoids:** Wishlist as a separate data model (anti-pattern: adds complexity without benefit)
**Research flag:** Standard patterns. Skip `/gsd:research-phase`.

### Phase 3: Stats Dashboard

**Rationale:** Stats are derived entirely from existing visit data. High perceived value, low implementation complexity. Delivers engagement with existing data before the geo system ships.
**Delivers:** Per-user stats page: total visits, unique places, category distribution chart, most active district, `user_stats` pre-computed table
**Addresses:** Stats dashboard (P1)
**Uses:** Recharts for category distribution; date-fns for "your most active month"
**Implements:** `user_stats` table + DB trigger, `stats.service.ts`, stats UI
**Avoids:** Stats recomputed on every profile load pitfall (pre-computed table + trigger is required, not optional)
**Research flag:** Standard patterns. Skip `/gsd:research-phase`.

### Phase 4: Ankara Grid Conquest

**Rationale:** This is the primary differentiator. It requires PostGIS (enabled in Phase 0), check-in data with geo-coordinates, and pre-computed `grid_cell_id` on venue rows. Grid boundaries and cell IDs must be locked before any venue data is written under the new schema.
**Delivers:** Interactive Ankara grid map, grid cell coloring by visit, coverage percentage stat, grid cell assignment on check-in, district label overlay
**Addresses:** Ankara grid map (P1 differentiator)
**Uses:** Leaflet + react-leaflet for map rendering, ngeohash for cell encoding, PostGIS `get_grid_cell()` DB function
**Implements:** `check_ins` table (with PostGIS geometry), `user_grid_cells` table, `geo.service.ts`, `AnkaraGrid.tsx` component
**Avoids:** Grid cell computation at render time, client-supplied grid cell IDs, coordinate spoofing (DB constraint for Ankara bounds)
**Research flag:** Moderate complexity — PostGIS SQL syntax and Leaflet SVG overlay integration need verification during planning. Consider `/gsd:research-phase` for this phase.

### Phase 5: Anonymous Location-Gated Notes

**Rationale:** Depends on the check-in system from Phase 4. Ships last because its security design (RLS + author masking) is the most complex and mistakes are hard to reverse after content is created.
**Delivers:** Anonymous note creation at a place, note visibility gated by check-in history, `user_id` masked in API responses, moderation `user_id` stored internally only
**Addresses:** Anonymous geo-gated notes (P2)
**Implements:** `location_notes` table, `note.service.ts`, DB view masking `user_id`, RLS policy with check-in JOIN
**Avoids:** Both anonymous-note failure modes (identity leak + gate bypass); must write and test RLS policy as a required deliverable of this phase, not a follow-up
**Research flag:** High security complexity — RLS policy with JOIN inside policy and view-based column masking needs careful verification. Use `/gsd:research-phase`.

### Phase 6: Venue Events (if in scope for this milestone)

**Rationale:** Most complex feature with content bootstrap dependency. Build last. If no event seeding strategy exists at planning time, defer to v1.2.
**Delivers:** Venue event creation, event listing on place detail page, RSVP/follow event, past/future filtering
**Addresses:** Venue-based events (P2)
**Uses:** date-fns for event date display
**Implements:** `place_events` table, `event.service.ts`, event UI on place detail
**Avoids:** Unauthenticated RSVP (RLS INSERT policy), events becoming a ghost town (plan bootstrap strategy at phase start)
**Research flag:** Content strategy question (bootstrap) is the key unknown. Use `/gsd:research-phase` to resolve seeding approach.

### Phase Ordering Rationale

- **Phase 0 before everything:** Service layer is a prerequisite, not a nice-to-have. Without it, every subsequent phase will introduce inline queries that must be retroactively migrated — a HIGH recovery cost per PITFALLS.md.
- **Social graph before feed (Phase 1 bundled):** An empty feed is a worse UX than no feed. Ship the follow graph and the feed together to avoid a dead state at launch.
- **Lists before geo (Phase 2 before Phase 4):** Lists are independent of geo and have lower risk. Shipping them early gives users a meaningful way to interact with the social graph before the grid ships.
- **Stats before grid (Phase 3 before Phase 4):** Stats are cheap to build and establish the "exploration identity" concept before the grid makes it visual. Also validates the `user_stats` table design that the grid will extend.
- **Grid before notes (Phase 4 before Phase 5):** Notes require check-ins (Phase 4 introduces the check-in system). Notes also require a proven RLS design foundation — best established after Phase 4 where PostGIS and coordinate validation are in place.
- **Events last:** Highest complexity and content risk. If bootstrap strategy is unclear, defer.

### Research Flags

Phases likely needing `/gsd:research-phase` during planning:
- **Phase 4 (Ankara Grid):** PostGIS SQL function syntax, Leaflet SVG layer integration, geohash precision calibration for Ankara cell size
- **Phase 5 (Anonymous Notes):** RLS policy with JOIN inside policy, DB view for column masking, integration test strategy for security verification
- **Phase 6 (Venue Events):** Content bootstrap strategy, event seeding plan, moderation approach

Phases with standard, well-documented patterns (skip research-phase):
- **Phase 0 (Foundation):** Next.js + Supabase SSR pattern is exhaustively documented
- **Phase 1 (Social Graph):** One-way follow + activity feed is a standard pattern
- **Phase 2 (Lists):** CRUD data model, well-understood
- **Phase 3 (Stats):** Aggregation + trigger pattern is standard

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Existing stack is confirmed from codebase; additions are conservative, well-documented, and version-compatible with React 19 + Next.js 16 |
| Features | MEDIUM | Based on training knowledge of Foursquare, Swarm, Letterboxd; no live competitor verification; grid cell sizing for Ankara is estimated, needs geographic validation |
| Architecture | HIGH | Based on direct codebase audit + established Next.js App Router / Supabase SSR patterns |
| Pitfalls | HIGH (stack-specific) / MEDIUM (geo + anonymous content) | RLS, service layer, and feed patterns are well-documented; location-gate RLS JOIN pattern and grid pre-computation approach are derived from first principles with no single canonical source |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Ankara grid cell size validation:** Recommended 300–500m cells, producing ~1500–2500 cells for the city. Validate against actual Ankara geographic area and adjust geohash precision accordingly before locking schema.
- **Supabase Realtime `postgres_changes` with `in` filter length limit:** Community-reported ~1000 character limit for the filter string (breaks at ~100 followed users). For MVP this is fine; document as a known scaling cliff and plan Broadcast channel migration for v1.2.
- **recharts@2.13 React 19 peer dependency:** Compatibility noted in changelog but should be verified with `npm install --dry-run` before Phase 3.
- **Current Swarm/Beli feature state:** These products may have changed since training cutoff. Verify before finalizing the events feature scope for Phase 6.
- **Ankara bounding box constants:** `39.7–40.3` lat, `32.4–33.2` lng used in pitfall prevention DB constraints — verify against authoritative geographic data before Phase 4.

## Sources

### Primary (HIGH confidence)
- Direct codebase audit (`.planning/codebase/`) — architecture, concerns, integrations
- Supabase RLS documentation — RLS policy patterns, null auth.uid() handling
- Next.js App Router server/client boundary — rendering model, Server Actions
- Supabase SSR client pattern — `@supabase/ssr`, `createServerClient`
- PostGIS documentation — GEOMETRY column types, spatial indexes, ST_DWithin

### Secondary (MEDIUM confidence)
- Training knowledge: Foursquare, Swarm, Letterboxd, Google Maps, Snap Map, Beli feature sets (through August 2025)
- Activity feed fan-out architecture (Instagram engineering, activity stream literature)
- ngeohash npm registry + GitHub — zero-dependency, stable, no active competitors
- Cursor-based pagination vs OFFSET in PostgreSQL — documented performance characteristic
- Gamification patterns: city exploration mechanics from Swarm teardowns and urban game design literature

### Tertiary (LOW confidence / needs validation)
- Supabase Realtime `in` filter character limit — community-reported, not in official docs
- recharts@2.13 React 19 compatibility — changelog entry, needs npm verification
- Ankara grid bounding box coordinates — estimated from training knowledge, needs authoritative source
- Beli (Turkish platform) current feature set — less well-documented in training data

---
*Research completed: 2026-03-13*
*Ready for roadmap: yes*
