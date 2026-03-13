# Architecture Research

**Domain:** Place discovery / social check-in platform (Next.js + Supabase)
**Researched:** 2026-03-13
**Confidence:** HIGH (based on direct codebase audit + established patterns for this stack)

---

## Standard Architecture

### System Overview

The target architecture introduces a **service layer** between the client and Supabase, moves
heavy reads to **Next.js API Routes / Server Actions**, and offloads geo and aggregation work
to **PostgreSQL functions** (PostGIS + plpgsql). The browser never calls Supabase directly for
write operations or sensitive reads.

```
┌───────────────────────────────────────────────────────────────────────┐
│                          BROWSER (React)                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Pages   │  │ Feature  │  │  Shared  │  │  Auth    │             │
│  │(App Dir) │  │Components│  │Components│  │ Context  │             │
│  └────┬─────┘  └────┬─────┘  └──────────┘  └──────────┘             │
│       │             │                                                  │
│       └──────┬───────┘   (calls via fetch / server actions)           │
└──────────────┼────────────────────────────────────────────────────────┘
               │
┌──────────────┼────────────────────────────────────────────────────────┐
│              │         NEXT.JS SERVER (App Router)                     │
│  ┌───────────▼──────────────────────────────────────────────────┐     │
│  │                   Service Layer  (src/services/)              │     │
│  │  PlaceService  GeoService  FeedService  NoteService           │     │
│  │  UserService   EventService  StatsService  ListService        │     │
│  └───────────────────────────┬──────────────────────────────────┘     │
│                              │                                         │
│  ┌───────────────────────────▼──────────────────────────────────┐     │
│  │               Repository Layer  (src/repositories/)          │     │
│  │  PlaceRepo  ReviewRepo  GeoRepo  FeedRepo  UserRepo           │     │
│  └───────────────────────────┬──────────────────────────────────┘     │
└──────────────────────────────┼─────────────────────────────────────── ┘
                               │ Supabase JS SDK (server-side client)
┌──────────────────────────────┼────────────────────────────────────────┐
│                              │       SUPABASE (BaaS)                   │
│  ┌─────────────┐  ┌──────────▼──────┐  ┌───────────────────────┐     │
│  │  Auth       │  │  PostgreSQL DB  │  │  Realtime (optional)  │     │
│  │  (JWT/RLS)  │  │  + PostGIS ext  │  │  (activity feed sub.) │     │
│  └─────────────┘  └─────────────────┘  └───────────────────────┘     │
└───────────────────────────────────────────────────────────────────────┘
```

---

### Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|----------------|-------------------|
| **Pages** (`src/app/**/page.tsx`) | Route entry points; compose feature components; own URL state | Feature components, Server Actions |
| **Feature Components** (`src/components/features/`) | Domain UI (feed card, grid cell, place card) | Services via hooks or Server Actions |
| **Shared Components** (`src/components/ui/`) | Stateless UI primitives (StarRating, Button, Modal) | No logic dependencies |
| **Service Layer** (`src/services/`) | Business rules, orchestration, input validation | Repositories, other services |
| **Repository Layer** (`src/repositories/`) | All Supabase queries; returns typed domain objects | Supabase server client only |
| **Supabase Client** (`src/lib/supabase-server.ts`) | Server-side Supabase client (uses service role for writes) | Repositories |
| **Supabase Client** (`src/lib/supabase-browser.ts`) | Browser-side client for auth state and realtime only | AuthContext |
| **Auth Middleware** (`middleware.ts`) | Server-side route protection; redirects unauthenticated requests | Supabase Auth helpers |
| **PostGIS Functions** (DB-level) | Geo queries: grid cell lookup, proximity search, boundary checks | Called via `supabase.rpc()` |

---

## Recommended Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (AuthProvider, fonts)
│   ├── page.tsx                  # Home (server component)
│   ├── explore/page.tsx          # Browse places
│   ├── grid/page.tsx             # Ankara grid map
│   ├── feed/page.tsx             # Social activity feed
│   ├── place/[slug]/page.tsx     # Place detail
│   ├── place/[slug]/events/      # Venue events
│   ├── profile/[username]/       # Public user profile
│   ├── lists/                    # User-created lists
│   └── api/                      # Internal API routes (server → server only)
│       ├── places/route.ts
│       ├── feed/route.ts
│       ├── grid/route.ts
│       └── notes/route.ts
│
├── services/                     # Business logic (server-only)
│   ├── place.service.ts          # CRUD, search, slug generation
│   ├── geo.service.ts            # Grid assignment, proximity, location gate
│   ├── feed.service.ts           # Activity fan-out, feed assembly
│   ├── note.service.ts           # Anonymous notes, location verification
│   ├── event.service.ts          # Venue event management
│   ├── stats.service.ts          # User stats aggregation
│   ├── list.service.ts           # User-created lists
│   └── user.service.ts           # Follow, profile, discovery
│
├── repositories/                 # Supabase query layer (server-only)
│   ├── place.repository.ts
│   ├── review.repository.ts
│   ├── geo.repository.ts         # grid_cells, check_ins tables
│   ├── feed.repository.ts        # activity_events table
│   ├── note.repository.ts
│   ├── user.repository.ts        # profiles, follows tables
│   └── event.repository.ts
│
├── components/
│   ├── ui/                       # Stateless primitives
│   │   ├── StarRating.tsx
│   │   ├── Button.tsx
│   │   └── Modal.tsx
│   └── features/                 # Domain-aware components
│       ├── grid/
│       │   ├── AnkaraGrid.tsx    # SVG/Canvas grid renderer
│       │   └── GridCell.tsx
│       ├── feed/
│       │   └── ActivityCard.tsx
│       ├── place/
│       │   ├── PlaceCard.tsx
│       │   └── ReviewForm.tsx
│       └── notes/
│           └── LocationNote.tsx
│
├── hooks/                        # Custom React hooks (client-side data)
│   ├── useAuth.ts                # Thin wrapper around AuthContext
│   ├── useFeed.ts                # SWR/React Query for feed polling
│   └── useGrid.ts                # Grid state (visited cells)
│
├── lib/
│   ├── supabase-browser.ts       # Browser client (auth + realtime only)
│   ├── supabase-server.ts        # Server client (service role)
│   └── geo/
│       ├── ankara-bounds.ts      # Ankara bounding box constants
│       └── grid.ts               # Grid math (lat/lng → cell ID)
│
├── types/
│   ├── database.types.ts         # Generated Supabase types (supabase gen types)
│   └── domain.types.ts           # App-level domain models
│
└── context/
    └── AuthContext.tsx           # Auth state (browser only)
```

### Structure Rationale

- **`services/` vs `repositories/`:** Services own business rules and call repositories. Repositories own SQL/Supabase calls and return plain typed objects. Never cross-call repositories directly from components.
- **`lib/supabase-browser.ts` vs `lib/supabase-server.ts`:** Two clients with different credentials and lifetimes. Browser client is safe to use in `'use client'` components for auth state. Server client uses the service role key (not exposed to browser) for writes and reads requiring privilege escalation.
- **`components/ui/` vs `components/features/`:** UI components have zero business-logic imports. Feature components may call hooks but never call services directly — they receive data as props or via hooks.

---

## Architectural Patterns

### Pattern 1: Server Action + Service Layer (Writes)

**What:** Write operations go through Next.js Server Actions that call a service function. The service validates input (Zod), runs business rules, then delegates to a repository.

**When to use:** All create/update/delete operations. Any operation needing auth verification before execution.

**Trade-offs:** Adds a compile-time boundary between browser and server — no accidental client-side DB writes. Slightly more boilerplate than inline Supabase calls.

```typescript
// src/app/place/[slug]/actions.ts
'use server'
import { z } from 'zod'
import { reviewService } from '@/services/review.service'
import { getServerUser } from '@/lib/supabase-server'

const schema = z.object({
  placeId: z.string().uuid(),
  rating: z.number().min(0).max(5).multipleOf(0.5),
  comment: z.string().max(1000).optional(),
})

export async function submitReview(formData: FormData) {
  const user = await getServerUser() // throws if unauthenticated
  const input = schema.parse(Object.fromEntries(formData))
  return reviewService.create({ ...input, userId: user.id })
}
```

### Pattern 2: Repository — Typed Supabase Queries

**What:** Each repository wraps table queries in typed functions returning domain objects. No raw Supabase calls outside `src/repositories/`.

**When to use:** Every database interaction.

**Trade-offs:** One extra file per domain. Pays off immediately when the schema changes — update one repository, not 12 components.

```typescript
// src/repositories/place.repository.ts
import { supabaseServer } from '@/lib/supabase-server'
import type { Place } from '@/types/domain.types'

export const placeRepository = {
  async findBySlug(slug: string): Promise<Place | null> {
    const { data, error } = await supabaseServer
      .from('places')
      .select('*, reviews(rating)')
      .eq('slug', slug)
      .single()
    if (error) throw new Error(error.message)
    return data
  },
}
```

### Pattern 3: PostGIS Grid via Database Function

**What:** Ankara city grid logic lives entirely in the database as a PostgreSQL function. The app calls `supabase.rpc('get_grid_cell', { lat, lng })` — no grid math in TypeScript.

**When to use:** Any geo computation: cell lookup, proximity check, location-gate verification.

**Trade-offs:** Logic in DB is harder to unit-test and iterate on than TypeScript. But geo functions benefit enormously from PostGIS's spatial indexes; doing this in app-land is both slower and more error-prone.

```sql
-- DB migration: create PostGIS grid function
CREATE OR REPLACE FUNCTION get_grid_cell(lat float8, lng float8)
RETURNS text AS $$
  -- Divide Ankara bounding box into N×M cells
  -- Returns cell_id like 'R12C04'
  SELECT format('R%sC%s',
    LPAD(FLOOR((lat - 39.70) / 0.01)::text, 2, '0'),
    LPAD(FLOOR((lng - 32.45) / 0.01)::text, 2, '0')
  );
$$ LANGUAGE sql IMMUTABLE;
```

```typescript
// src/repositories/geo.repository.ts
async function getCellForLocation(lat: number, lng: number): Promise<string> {
  const { data } = await supabaseServer.rpc('get_grid_cell', { lat, lng })
  return data as string
}
```

### Pattern 4: Fan-Out Activity Feed (Push model)

**What:** When a user performs a notable action (check-in, review, list update), a database trigger (or a post-write service call) writes one row per follower into `feed_events`. Each user's feed is a simple `SELECT ... WHERE recipient_id = $user_id ORDER BY created_at DESC`.

**When to use:** Social feeds where read volume >> write volume (typical for this scale).

**Trade-offs:** Push model duplicates rows. For Tearamess's scale (hundreds to low thousands of users), this is fine and keeps feed reads extremely fast. Pull model (JOIN over follows + activity table) becomes expensive at scale but is simpler to start. Recommendation: **start with pull model, migrate to push if needed.**

```sql
-- Pull model (start here — simpler, no duplication)
SELECT a.*
FROM activity_events a
JOIN follows f ON f.following_id = a.actor_id
WHERE f.follower_id = $user_id
  AND a.created_at > NOW() - INTERVAL '30 days'
ORDER BY a.created_at DESC
LIMIT 50;
```

### Pattern 5: Location-Gated Notes (Server-side enforcement)

**What:** When a user requests notes for a location, the server verifies they have a check-in record within a configurable radius before returning note data. This check happens in the service layer, never trusting client-supplied coordinates without cross-referencing the `check_ins` table.

**When to use:** Any content that should be gated by physical presence.

**Trade-offs:** Users cannot access notes by spoofing coordinates — the server checks the check-in history. Requires honest check-in recording at visit time. GPS accuracy on mobile web is ~10–30 meters; server-side radius should be generous (e.g., 200m) to avoid false negatives.

```typescript
// src/services/note.service.ts
async function getNotesForLocation(userId: string, placeId: string) {
  const hasVisited = await geoRepository.hasUserVisitedPlace(userId, placeId)
  if (!hasVisited) throw new ForbiddenError('Visit this place to unlock notes')
  return noteRepository.findByPlace(placeId)
}
```

---

## Data Flow

### Write Flow (Check-in + Grid + Feed Update)

```
User taps "I was here"
        ↓
Server Action: checkIn(placeId, { lat, lng })
        ↓
GeoService.recordVisit(userId, placeId, coords)
    ├── GeoRepo: INSERT check_ins row
    ├── GeoRepo: rpc('get_grid_cell') → cell_id
    ├── GeoRepo: UPSERT user_grid_cells (userId, cell_id, first_visit_at)
    └── FeedService.emit('check_in', { userId, placeId })
            └── FeedRepo: INSERT activity_events row
```

### Read Flow (Activity Feed)

```
User opens /feed
        ↓
Server Component fetches via FeedService.getFeed(userId)
        ↓
FeedRepo: SELECT activity_events JOIN follows (pull model)
        ↓
FeedService enriches: attaches place names, actor display names
        ↓
React renders ActivityCard components (server-rendered HTML)
        ↓
Client hydrates — no separate data fetch needed
```

### Read Flow (Anonymous Notes — Location Gated)

```
User opens place detail page
        ↓
Server Component: NoteService.getNotesForPlace(userId, placeId)
        ↓
GeoRepo: SELECT check_ins WHERE user_id = $userId AND place_id = $placeId
    ├── Found → NoteRepo: SELECT notes WHERE place_id = $placeId
    └── Not found → returns empty (no error, no hint that notes exist)
```

### Geo Read Flow (Grid Map)

```
User opens /grid
        ↓
Server Component: GeoService.getUserGrid(userId)
        ↓
GeoRepo: SELECT cell_id, first_visit_at FROM user_grid_cells WHERE user_id = $userId
        ↓
GeoService: compute coverage % against total Ankara cells constant
        ↓
AnkaraGrid component renders SVG with colored cells (visited vs unvisited)
```

### State Management

```
AuthContext (React Context)
    ↓ (browser only)
useAuth() hook ← supabase-browser.ts (auth state + onAuthStateChange)

Server state:  React Server Components fetch once per request (no client cache needed)
Client state:  URL params for filters/tabs; local useState for UI interactions only
Realtime:      supabase-browser.ts Realtime subscriptions for feed (optional, v2 feature)
```

---

## Migration Path (Current → Target Architecture)

This is an **additive migration** — nothing is deleted, services are introduced alongside existing code.

### Phase 0: Infrastructure (do this first, no features blocked on it)

1. Add `src/lib/supabase-server.ts` — server-side Supabase client using `SUPABASE_SERVICE_ROLE_KEY`
2. Rename existing `src/lib/supabase.ts` → `src/lib/supabase-browser.ts` (update imports)
3. Add `middleware.ts` at project root for server-side auth guards
4. Run `supabase gen types typescript` → `src/types/database.types.ts`
5. Enable PostGIS extension in Supabase dashboard (`CREATE EXTENSION postgis`)

### Phase 1: Service Layer Scaffold (introduce pattern, migrate one domain)

1. Create `src/services/` and `src/repositories/` directories
2. Migrate the **places** domain first (lowest risk, already working):
   - `src/repositories/place.repository.ts` — extract existing `supabase.from('places')` calls
   - `src/services/place.service.ts` — add slug uniqueness check, Zod validation
   - `src/app/explore/page.tsx` — convert to Server Component using service
3. Leave auth, profile pages untouched — touch them only when adding features

### Phase 2: New Feature Domains (build fresh, no migration needed)

Each new feature is implemented clean using the new pattern:
- **Geo / Grid**: `geo.service.ts` + `geo.repository.ts` + PostGIS migrations
- **Social follows + feed**: `user.service.ts` + `feed.service.ts` + DB schema
- **Notes**: `note.service.ts` + location-gate logic
- **Events**: `event.service.ts`

### Phase 3: Cleanup (final, not blocking)

- Migrate remaining pages (profile, reviews) to use service layer
- Remove direct Supabase calls from any remaining client components
- Add Zod validation to all remaining endpoints

---

## Database Schema Additions (New Tables Required)

```
profiles              — user display name, username, avatar_url (extends auth.users)
follows               — follower_id, following_id, created_at
check_ins             — id, user_id, place_id, coords GEOMETRY(Point,4326), created_at
user_grid_cells       — user_id, cell_id TEXT, first_visit_at (composite PK)
activity_events       — id, actor_id, type TEXT, payload JSONB, created_at
user_lists            — id, user_id, title, is_public, created_at
list_places           — list_id, place_id, added_at
place_events          — id, place_id, title, starts_at, ends_at, created_by
location_notes        — id, place_id, content TEXT, created_at (no user_id — anonymous)
```

**PostGIS columns needed:**
- `check_ins.coords` — `GEOMETRY(Point, 4326)` with `GIST` spatial index
- `places.coords` — `GEOMETRY(Point, 4326)` (add to existing table)

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0–1k users | Current + service layer is fine. Pull-model feed. No caching needed. |
| 1k–10k users | Add DB indexes on `activity_events(actor_id, created_at)` and `follows(follower_id)`. Consider materialized views for stats. |
| 10k–100k users | Migrate feed to push model. Add Redis for hot feed caching. Consider Supabase Edge Functions for fan-out. |
| 100k+ users | Separate read replicas. PostGIS queries on hot paths need query profiling. Feed becomes a dedicated service. |

### Scaling Priorities (realistic for this project)

1. **First bottleneck:** Unindexed feed JOIN query as follow counts grow. Fix: add composite index on `activity_events(actor_id, created_at DESC)` and `follows(follower_id, following_id)`.
2. **Second bottleneck:** Client-side filtering of all places (current bug). Fix: move category/city filters to WHERE clause in `place.repository.ts`. Already needed, not a scaling concern.

---

## Anti-Patterns

### Anti-Pattern 1: Direct Supabase Calls in Client Components (for writes)

**What people do:** Call `supabase.from('table').insert(...)` directly inside React event handlers in `'use client'` components.

**Why it's wrong:** Bypasses all business logic and validation. Any user with browser devtools can call Supabase's REST API with the anon key. RLS provides a safety net but not a substitute for service-layer validation. Also breaks TypeScript type safety because query results are not domain-typed.

**Do this instead:** Use Server Actions. The server validates, applies business rules, and calls the repository. The browser sends a form POST or `fetch()`.

### Anti-Pattern 2: Grid Math in JavaScript on the Client

**What people do:** Compute grid cell IDs from GPS coordinates in the browser and pass the cell ID to the server to record.

**Why it's wrong:** Client-supplied cell IDs can be trivially forged. A user can claim to visit any grid cell without being there. The server must compute the cell from server-verified coordinates (or at minimum cross-check).

**Do this instead:** The client submits raw GPS coordinates. The server runs the PostGIS `get_grid_cell()` function. Cell ID assignment never comes from the client.

### Anti-Pattern 3: Storing Activity Feed as Denormalized JSON Blobs

**What people do:** Serialize the entire activity object (place name, actor photo URL, etc.) into a `payload JSONB` column at write time to avoid JOINs at read time.

**Why it's wrong:** When a user changes their display name or a place name is corrected, all historical feed items show stale data. Fine for events (immutable facts) but wrong for entity references.

**Do this instead:** Store only IDs in `payload` (actor_id, place_id). Enrich at read time via JOIN or in the service layer. Display names are cheap to fetch with a proper index.

### Anti-Pattern 4: Checking Auth State Client-Side for Route Protection

**What people do (current codebase):** `useEffect(() => { if (!user) router.push('/login') }, [user])` — the page renders briefly before the redirect.

**Why it's wrong:** Content flashes before redirect. Server can render protected page HTML that gets sent to the browser.

**Do this instead:** `middleware.ts` at the Next.js edge checks the Supabase session cookie and redirects before the page function runs.

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Supabase Auth | Cookie-based session via `@supabase/ssr` helper | Server-side session reading requires `createServerClient` from `@supabase/ssr`, not the browser client |
| Supabase PostGIS | `supabase.rpc('function_name', params)` | Enable PostGIS in Supabase dashboard; write functions as DB migrations |
| Mapbox / Leaflet (future) | Client-side map component with static tile URL | Ankara grid overlay can be a pure SVG layer — no map SDK required for the grid feature itself |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| React component → data | Server Components fetch directly; Client Components use hooks | No direct Supabase calls in components |
| Service → Repository | Direct function call (same process, no HTTP) | Services import repositories as modules |
| Browser → Server | Server Actions (`'use server'` functions) or `fetch()` to `/api/*` routes | Never expose service role key to browser |
| DB → App (events) | Optional: Supabase Realtime for live feed updates | Only needed for v2; pull-on-navigate is fine for v1 |

---

## Build Order (Phase Dependencies)

```
Phase 0: Infrastructure
  supabase-server.ts + middleware.ts + DB types
        ↓
Phase 1: Service layer scaffold (places domain)
  Repositories + Services + migrate explore page
        ↓
Phase 2A: User system                   Phase 2B: Geo / Grid
  profiles + follows + user service       PostGIS + check_ins + grid service
        ↓                                       ↓
Phase 3: Activity Feed                  Phase 3B: Location Notes
  Requires: follows (2A), activity_events Requires: check_ins (2B)
        ↓
Phase 4: Lists + Events + Stats
  Requires: service layer (Phase 1), user system (2A)
```

**Key dependency:** The grid system depends on PostGIS being enabled and `check_ins` table existing. The activity feed depends on the follow system. Location-gated notes depend on check-ins. Everything else is independent after Phase 0.

---

## Sources

- Direct codebase audit: `.planning/codebase/ARCHITECTURE.md`, `STACK.md`, `CONCERNS.md`, `INTEGRATIONS.md` (2026-03-13)
- Next.js App Router server/client boundary: https://nextjs.org/docs/app/building-your-application/rendering
- Supabase SSR client pattern: https://supabase.com/docs/guides/auth/server-side/nextjs
- PostGIS GEOMETRY type and spatial index: https://postgis.net/documentation/
- Activity feed architecture (fan-out patterns): established industry pattern, pull model recommended at this scale
- Confidence: HIGH for service layer and DB schema patterns (well-established); MEDIUM for PostGIS SQL specifics (function syntax should be verified against Supabase PostgreSQL version at implementation time)

---

*Architecture research for: Tearamess — place discovery social platform*
*Researched: 2026-03-13*
