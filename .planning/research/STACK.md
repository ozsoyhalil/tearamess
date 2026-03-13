# Stack Research

**Domain:** Place discovery / social check-in platform (brownfield extension)
**Researched:** 2026-03-13
**Confidence:** MEDIUM — external network unavailable; analysis is based on training data (cutoff August 2025). Versions should be verified before install.

---

## Existing Stack (Do Not Replace)

| Technology | Version | Role |
|------------|---------|------|
| Next.js | 16.1.6 | Full-stack framework, App Router |
| React | 19.2.3 | UI runtime |
| Supabase JS | 2.99.1 | Auth + PostgreSQL + Realtime client |
| Tailwind CSS | 4.x | Utility-first styling |
| TypeScript | 5.x | Type safety |

---

## Additions Required by Feature Area

### 1. Geo / Grid System

The city grid (Ankara divided into explorable squares) requires two things: computing which grid cell a lat/lng falls into, and rendering those cells visually. PostGIS is already available in Supabase as an optional extension — enable it via the Supabase dashboard SQL editor.

**Database side — PostGIS (Supabase extension, no npm install)**

Enable with:
```sql
create extension if not exists postgis;
```

This gives `geography(Point)` column types, `ST_DWithin` for radius queries, and `ST_MakePoint` for indexing. No library needed in the JS client — queries are plain SQL via `supabase.rpc()`.

**Confidence: HIGH** — PostGIS is a first-class Supabase extension, documented and widely used in production Supabase projects.

**Client-side grid math — ngeohash**

Geohash encodes a lat/lng pair into a short string that represents a bounding box. Precision level 5 gives ~5km x 5km cells; precision 6 gives ~1.2km x 1.2km — appropriate for a city-block-scale grid over Ankara. The library is tiny (< 5KB), zero dependencies, works in both Node and browser.

Use `ngeohash` rather than rolling custom grid math. It encodes a point to a cell ID, decodes a cell ID back to a bounding box for rendering, and neighbors() returns adjacent cells for heatmap expansion.

**Confidence: HIGH** — ngeohash has been the standard geohash implementation in the JS ecosystem for 10+ years with no meaningful competitors.

**Visual map layer — Leaflet + React-Leaflet**

Leaflet is the correct choice for this project. It renders vector overlays (grid rectangles, markers) over tile maps efficiently, is MIT-licensed, and React-Leaflet provides a component API that integrates naturally with Next.js. The bundle is ~40KB gzipped.

Do NOT use Google Maps JS API — it requires a billing account and adds per-load cost at scale. Do NOT use Mapbox GL JS v3 — its license changed in 2023 to require a Mapbox account with usage-based billing for production. OpenStreetMap tiles via Leaflet are free.

Use `react-leaflet` v4 (compatible with React 18/19) for the grid overlay component. Mark the map component with `'use client'` — Leaflet requires window access and will error in SSR.

**Confidence: HIGH** — React-Leaflet v4 + Leaflet v1 is a proven pattern for Next.js App Router projects.

---

### 2. Social Follow System + Activity Feed

**Database side — Supabase Realtime Postgres Changes**

The follow system itself requires no new library — it is two tables (`follows`, `activities`) with RLS policies. The activity feed is a JOIN query on activities where `actor_id IN (followed_user_ids)`.

For real-time updates to the feed (when someone you follow checks in, the feed updates live), use Supabase Realtime `postgres_changes`. The `@supabase/supabase-js` client already supports this — no additional package needed.

```typescript
supabase
  .channel('feed')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'activities',
    filter: `actor_id=in.(${followedIds.join(',')})`
  }, handleNewActivity)
  .subscribe()
```

**Confidence: MEDIUM** — `postgres_changes` with `in` filters works but has a known limitation: the filter string must not exceed ~1000 characters, meaning it breaks down if a user follows 100+ people. For MVP (typical follow counts < 50), this is fine. Document this as a scaling cliff.

**State management for feed — SWR or React Query**

The existing app has no client-side data-fetching library — it uses raw `useEffect` + `useState`. For the activity feed (paginated, invalidated by realtime events), this pattern becomes painful. Add either SWR or TanStack Query.

Use **SWR** because:
- Smaller bundle than TanStack Query (~4KB vs ~13KB)
- Simpler API — adequate for this use case
- `mutate()` integrates cleanly with Supabase Realtime: when a realtime INSERT fires, call `mutate()` to revalidate the feed
- Already used in many Supabase example apps

**Confidence: MEDIUM** — Both SWR and TanStack Query solve this well. SWR recommendation is based on bundle size advantage and simpler mental model for a codebase that currently has no data layer.

---

### 3. Anonymous Location Notes

Anonymous notes are location-gated: a user can only see a note if they have checked in within a configurable radius of the note's coordinates. This is pure PostGIS logic — `ST_DWithin(note.location, user_checkin.location, radius_meters)` — no new library needed.

The "anonymous" aspect means storing no `author_id` on the note row (or storing a hashed identifier that cannot be reversed). A SHA-256 hash of `user_id + salt` lets you deduplicate a user's own notes without revealing identity to others.

No new npm packages needed for this feature.

---

### 4. Venue-Based Events

Events are a data model addition (`events` table linked to `venues`). RSVP is an `event_attendees` junction table. The only UI complexity is date/time handling.

Add **date-fns** for date formatting and relative time display ("in 2 days", "yesterday"). Do not use Moment.js — it is in maintenance mode and its bundle is 60KB+. Do not use Day.js unless you prefer its API; date-fns is tree-shakeable so you only pay for what you import.

**Confidence: HIGH** — date-fns v3 is the current standard for date manipulation in TypeScript projects. It is fully typed and tree-shakeable.

---

### 5. Stats / Analytics Display

The stats page (visit counts, category distribution, activity heatmap) requires chart rendering. Use **Recharts** because:
- Built on React and SVG — no Canvas complexity
- Composable API maps cleanly to TypeScript
- Adequate performance for profile-level stats (not dashboard-scale data)
- Tailwind-compatible styling (style via className or inline props)

Do NOT use Chart.js with react-chartjs-2 — Chart.js v4 has significant TypeScript friction and the react wrapper adds complexity without benefit in this use case.

**Confidence: MEDIUM** — Recharts is widely used in the React/Next.js ecosystem. The alternative, Tremor (which wraps Recharts), adds a nice abstraction but is overkill for a single stats page.

---

### 6. Form Handling

New features (event creation, list creation, note submission) involve multi-field forms with validation. The existing app likely has manual state per form field. For new features, use **React Hook Form** with **Zod**:

- React Hook Form: minimal re-renders, uncontrolled inputs, ~10KB gzipped
- Zod: type-safe schema validation that doubles as TypeScript type generation (`z.infer<typeof schema>`)
- `@hookform/resolvers` bridges the two

This combination is the standard pattern in the Next.js ecosystem as of 2024-2025.

**Confidence: HIGH** — React Hook Form + Zod is the dominant form validation pattern in Next.js App Router projects.

---

### 7. Service Layer (Architectural Addition, No New Libraries)

The existing architecture has no service layer — Supabase queries are inline in page components. Adding the features above without a service layer will make the codebase unmanageable. This is not a library addition but a mandatory structural change.

Add `src/lib/services/` with modules like:
- `places.service.ts` — CRUD + geo queries
- `follows.service.ts` — follow/unfollow, follower list
- `activities.service.ts` — feed query, realtime subscription
- `events.service.ts` — event CRUD, RSVP
- `grid.service.ts` — geohash encoding, cell coverage calculation

This keeps Supabase client import in one place and makes RLS policy errors traceable.

---

## Recommended Stack (Additions Only)

### Core Additions

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| PostGIS | Supabase extension | Geo queries — radius search, coordinate storage | First-class Supabase extension; enables `ST_DWithin` for location-gated notes and proximity queries. No JS package needed. |
| Leaflet | ^1.9.4 | Interactive map rendering for grid overlay | Mature, MIT-licensed, free tile sources. No billing account required unlike Mapbox/Google. |
| react-leaflet | ^4.2.1 | React component wrapper for Leaflet | v4 supports React 18/19. Required because Leaflet needs DOM access — use with `'use client'`. |
| ngeohash | ^0.6.3 | Geohash encode/decode for grid cell IDs | Zero-dependency, tiny. Converts lat/lng to grid cell ID and back. Standard JS geohash library. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| swr | ^2.3.0 | Client-side data fetching + cache invalidation | Activity feed, any paginated list that needs realtime invalidation |
| react-hook-form | ^7.54.0 | Performant form state management | All new multi-field forms (events, lists, notes) |
| zod | ^3.24.0 | Schema validation + TypeScript type generation | Validate all form inputs and Supabase response shapes |
| @hookform/resolvers | ^3.9.0 | Bridge between react-hook-form and zod | Required when using Zod with React Hook Form |
| date-fns | ^3.6.0 | Date formatting and relative time | Event dates, activity feed timestamps |
| recharts | ^2.13.0 | Chart/graph components | Stats page — category distribution, visit counts |

### Development Tools (Additions)

| Tool | Purpose | Notes |
|------|---------|-------|
| @types/leaflet | ^1.9.x | TypeScript types for Leaflet | Install as devDependency; react-leaflet has its own types built-in |

---

## Installation

```bash
# Geo / map
npm install leaflet react-leaflet ngeohash

# Data fetching
npm install swr

# Forms + validation
npm install react-hook-form zod @hookform/resolvers

# Date handling
npm install date-fns

# Charts
npm install recharts

# Dev types
npm install -D @types/leaflet
```

PostGIS: enable via Supabase dashboard > Database > Extensions > search "postgis" > enable.

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Leaflet + react-leaflet | Mapbox GL JS | When you need 3D terrain, vector tiles at scale, or have a Mapbox budget |
| Leaflet + react-leaflet | Google Maps JS API | When you need Street View, business data, or Google Places autocomplete |
| ngeohash | Custom grid math | Never — rolling your own cell ID system adds no value vs geohash |
| SWR | TanStack Query (React Query) | When you need background refetching, optimistic updates, or complex cache invalidation across multiple components simultaneously |
| Recharts | Tremor | When building a full admin dashboard with many chart types; overkill for one stats page |
| Recharts | Victory | When targeting React Native in addition to web |
| date-fns | Day.js | Either works; Day.js has slightly smaller core but is less tree-shakeable |
| Zod | Yup | Yup is older and less TypeScript-first; Zod is now dominant in the Next.js ecosystem |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Mapbox GL JS | License changed 2021; requires paid Mapbox account for any production use | Leaflet with OpenStreetMap tiles |
| Google Maps JS API | Per-load billing; requires billing account; privacy implications | Leaflet with OpenStreetMap tiles |
| Moment.js | Maintenance mode since 2020; 67KB bundle; mutable API | date-fns v3 |
| Chart.js + react-chartjs-2 | Poor TypeScript support in v4; requires canvas; react wrapper adds complexity | Recharts |
| socket.io | Unnecessary — Supabase Realtime already provides WebSocket channels; adding another WS library creates two parallel connections | Supabase Realtime (`postgres_changes`) |
| Redux / Zustand | No global client state needed for this feature set; Supabase client + SWR cache covers it | React Context (existing) + SWR |
| next-auth | Already have Supabase Auth; adding next-auth would create two auth systems in conflict | Supabase Auth (existing) |

---

## Stack Patterns by Variant

**If grid cells should be stored in the database (for querying "who has visited cell X"):**
- Store geohash string as `text` column on check-in rows, indexed with `CREATE INDEX ON checkins (geohash_cell)`
- Use `WHERE geohash_cell = $1` for fast lookups
- Because string equality on an indexed column is faster than PostGIS geometry contains queries for regular grid lookups

**If grid visualization needs to show neighbor cells (heatmap spreading):**
- Use `ngeohash.neighbors(cellId)` to get the 8 surrounding cells
- Render all 9 as a group with opacity scaled by visit count
- Because geohash adjacency is O(1) — no spatial query needed

**If anonymous note proximity check is server-side (recommended for security):**
- Create a Supabase RPC function `can_see_note(note_id, user_id)` using `ST_DWithin`
- Call it from a Next.js Route Handler (not client-side) so the user cannot bypass the radius check by spoofing coordinates
- Because location-gating security must not depend on client-provided location data

**If the activity feed grows beyond 50 followed users:**
- Switch from `postgres_changes` with `in` filter to a Supabase Realtime Broadcast channel
- Have a database trigger post to the channel on `activities` INSERT
- Because the `in` filter string has a practical length ceiling around 100 IDs

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| react-leaflet@4.x | React 18.x, React 19.x | v4 is the React 18+ compatible version; v3 does not support React 18+ |
| leaflet@1.9.x | react-leaflet@4.x | Must install both; react-leaflet is a peer dependency wrapper |
| @types/leaflet@1.9.x | leaflet@1.9.x | Types track leaflet minor versions closely |
| recharts@2.x | React 19.x | recharts@2.13+ has React 19 compatibility; earlier 2.x may warn |
| swr@2.x | React 18.x, React 19.x | swr@2.x uses React concurrent features; compatible with Next.js 16 |
| react-hook-form@7.x | React 19.x | v7.54+ explicitly tested with React 19 |
| date-fns@3.x | TypeScript 5.x | v3 is fully ESM, tree-shakeable, typed; v2 had CommonJS-only issues in App Router |
| zod@3.x | TypeScript 5.x | z.infer works correctly with TS strict mode enabled |

---

## Confidence Notes

| Area | Confidence | Reason |
|------|------------|--------|
| PostGIS on Supabase | HIGH | Well-documented, stable extension; in production use since Supabase v1 |
| react-leaflet v4 | HIGH | Stable, widely used, explicit React 18/19 support documented |
| ngeohash | HIGH | Stable, no active competitors, no recent breaking changes |
| SWR vs TanStack Query | MEDIUM | Both work; recommendation is an opinion based on bundle size |
| Supabase Realtime `postgres_changes` with `in` filter | MEDIUM | Filter length limitation is documented in community but not in official Supabase docs as of training cutoff — verify before depending on it at scale |
| recharts@2.13 React 19 compat | MEDIUM | Compatibility noted in changelog; verify with npm peerDeps before install |

---

## Sources

- PostGIS Supabase extension: training knowledge from Supabase docs (supabase.com/docs/guides/database/extensions/postgis) — HIGH confidence
- react-leaflet v4: training knowledge from react-leaflet.js.org changelog — HIGH confidence
- ngeohash: training knowledge from npm registry + GitHub — HIGH confidence
- Mapbox license change (2021): PUBLIC record, widely reported — HIGH confidence
- SWR v2 / TanStack Query comparison: training knowledge — MEDIUM confidence
- Supabase Realtime `in` filter length limit: community-reported pattern — MEDIUM confidence, verify before scaling
- recharts React 19 compat: training knowledge from recharts changelog — MEDIUM confidence
- date-fns v3 ESM / TypeScript: official date-fns v3 migration guide — HIGH confidence

Note: All external network tools (WebSearch, WebFetch, Brave CLI) were unavailable during this research session. Verify all version numbers with `npm info <package> version` before installing.

---

*Stack research for: Tearamess — place discovery social platform (brownfield extension)*
*Researched: 2026-03-13*
