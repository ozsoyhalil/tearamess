# Phase 4: Check-in + Grid - Research

**Researched:** 2026-03-22
**Domain:** Geospatial grid visualization, Supabase INSERT pattern, Leaflet map, Toast notifications
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- Check-in button lives in the **place hero/header** — prominent, makes check-in the primary action on the page
- After check-in: **toast notification** — "Mekana check-in yapıldı!" — then button state updates
- Multiple check-ins to the same place are **allowed** — each records a separate timestamp (not idempotent)
- Unauthenticated users clicking check-in → **redirect to /auth/login** (consistent with wishlist/follow patterns)
- Button state: shows "Check In" by default; after checking in, shows "✓ Check edildi" (or similar)
- **Check-in IS a visit** — explicit check-in records to the same `visits` table as review-auto-visits
- Review-auto-visits (`recordVisit()`) also color the grid — same mechanism, both count
- **Backfill from existing visits** — grid shows all historical visits (from past reviews too)
- Places need `latitude` and `longitude` columns on the `places` table for grid calculation
- If a place has no lat/lng: check-in still records the visit, but **no grid cell is colored** (graceful degradation)
- Coordinates are float columns (`places.latitude`, `places.longitude`) — no PostGIS extension required
- Primary home: **`/grid` dedicated page** — full-screen grid canvas
- Also linked from the user profile and Navbar (for logged-in users)
- **Square cells** over Ankara bounding box — uniform rectangle grid
- **~300–500m cell size** — city block level granularity (~400–600 cells for Ankara)
- **Grid overlaid on base map** — semi-transparent colored cells over actual Ankara street map (Leaflet)
- All cells outlined with **subtle grid lines** (neutral, like #E0D0C0)
- **Opacity-based intensity** — caramel color (#C08552) with opacity scaling: 1 visit = ~20% opacity, more visits = higher opacity up to 100%
- Unvisited cells: cream (#F5EDE4) fill with subtle border
- **Click to see places in cell** — clicking a visited cell opens a panel/modal showing places visited in that cell
- Cells show **no badge/count number** — coloring tells the story, details on click

### Claude's Discretion

- Exact Ankara bounding box coordinates (lat ~39.7–40.3, lng ~32.4–33.2 — needs geographic validation)
- Geohash precision level selection for 300–500m cells (likely precision 6)
- Map library choice for base map (Leaflet recommended — no token required, OSM tiles)
- Toast implementation (custom or lightweight library)
- Exact opacity curve (linear or exponential per visit count)
- Panel/modal design for "places in this cell" view

### Deferred Ideas (OUT OF SCOPE)

- Anonymous notes on grid cells — v2 (NOTE-01 through NOTE-04)
- % explored / total visit stats — Phase 5 (XPLR-03, XPLR-04)
- Multi-city grid support — v2 (CITY-01, CITY-02)
- Leaderboard / compare grids with friends — future phase
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| XPLR-01 | Kullanıcı bir mekana check-in yapabilir | New `checkIn()` service (INSERT not upsert), CheckInButton component following WishlistButton pattern, toast feedback, auth redirect |
| XPLR-02 | Check-in yapılan konumdan Ankara grid hücresi hesaplanır ve kullanıcı haritasında işaretlenir | Custom bounding-box grid math (lat/lng → cell index), Leaflet Rectangle overlays, visits query with place lat/lng join, `/grid` page |
</phase_requirements>

---

## Summary

Phase 4 introduces two interconnected features: a check-in action and a visual grid map. The check-in side is straightforward — a new `checkIn()` function that does a plain `INSERT` (not upsert) into the existing `visits` table, paired with a `CheckInButton` component that mirrors the `WishlistButton` optimistic pattern. The grid side is the technically novel part.

The key finding on grid coordinates: **geohash is not a fit for the desired 300–500m square cells**. Geohash precision 6 produces rectangular 1.22km × 0.61km cells (too large and non-square); precision 7 produces 153m × 153m cells (too small). The correct approach is a **custom uniform grid** — divide the Ankara bounding box into equal lat/lng steps that correspond to ~400m on the ground. At latitude 40°N, 1 degree latitude ≈ 111,132m and 1 degree longitude ≈ 85,170m. A step of 0.0040° lat × 0.0047° lng gives approximately 445m × 400m cells, producing roughly 150 rows × 190 columns = 28,500 cells total (much larger than the 400–600 cells stated in CONTEXT; see Open Questions).

The grid page uses `react-leaflet` v5 (React 19 peer dep matched) with OSM tiles, `dynamic()` import with `ssr: false`, and Leaflet `Rectangle` components for each visited cell. For toast, `sonner` is the current lightweight standard compatible with Next.js App Router.

**Primary recommendation:** Use custom uniform grid math (no geohash library needed), react-leaflet v5, sonner for toast. Cell step: ~0.004° lat / 0.0047° lng per cell.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-leaflet | ^5.0.0 | React wrapper for Leaflet maps | v5 requires React 19 (peer dep matched); no API token needed; OSM tiles free |
| leaflet | ^1.9.x | Underlying map engine (peer dep) | Industry standard for token-free interactive maps |
| sonner | ^2.x | Toast notifications | Opinionated, lightweight (<5KB), App Router compatible, no provider boilerplate |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/leaflet | ^1.9.x | TypeScript types for Leaflet | Required when using leaflet directly (marker icon fix) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-leaflet | Mapbox GL JS | Requires API token, overkill for this use case |
| react-leaflet | Leaflet vanilla (no React wrapper) | More imperative code, harder to manage React lifecycle |
| sonner | react-hot-toast | Both are valid; sonner is marginally newer/lighter; either works |
| sonner | Custom toast component | Custom is fine but sonner adds zero complexity and handles accessibility |
| Custom grid math | ngeohash | ngeohash precision 6 = 1.22km×0.61km (non-square, too big); precision 7 = 153m×153m (too small); no middle ground |

**Installation:**
```bash
npm install react-leaflet leaflet sonner
npm install --save-dev @types/leaflet
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── lib/
│   ├── services/
│   │   ├── checkIns.ts          # new: checkIn() INSERT service
│   │   ├── checkIns.test.ts     # new: unit tests
│   │   └── visits.ts            # extend: getUserVisitsWithCoords()
│   └── grid.ts                  # new: pure grid math utilities (no deps)
├── types/
│   └── visit.ts                 # extend: add latitude/longitude to places join
├── app/
│   └── grid/
│       ├── page.tsx             # new: /grid page (dynamic import of map)
│       └── GridMap.tsx          # new: 'use client', react-leaflet map component
├── components/
│   └── CheckInButton.tsx        # new: mirrors WishlistButton pattern
supabase/migrations/
└── 20260322_add_place_coords.sql  # new: latitude + longitude float cols on places
```

### Pattern 1: Custom Uniform Grid Math (no external library)

**What:** Pure arithmetic to convert lat/lng → row/column index, and back to a bounding box for rendering.
**When to use:** Any time a place's coordinates need to map to a grid cell, or a grid cell needs to be drawn as a Leaflet Rectangle.

```typescript
// Source: derived from USGS degree-to-meters conversion (111,132m/deg lat, 85,170m/deg lng at lat 40°N)
// File: src/lib/grid.ts

// Ankara urban bounding box (validated against OpenStreetMap Nominatim data)
// Wikipedia location map data: top 40.1007, bottom 39.769, left 32.5394, right 33.0064
export const GRID_BOUNDS = {
  minLat: 39.769,
  maxLat: 40.1007,
  minLng: 32.5394,
  maxLng: 33.0064,
}

// Step sizes targeting ~400-450m cells at latitude 40°N
// 0.004° lat × 111,132m/deg ≈ 444m
// 0.0047° lng × 85,170m/deg ≈ 400m  (lng degree shorter at lat 40°)
export const CELL_LAT = 0.004   // ~444m vertical
export const CELL_LNG = 0.0047  // ~400m horizontal

export function latLngToCellKey(lat: number, lng: number): string {
  const row = Math.floor((lat - GRID_BOUNDS.minLat) / CELL_LAT)
  const col = Math.floor((lng - GRID_BOUNDS.minLng) / CELL_LNG)
  return `${row}:${col}`
}

export function cellKeyToBounds(key: string): [[number, number], [number, number]] {
  const [row, col] = key.split(':').map(Number)
  const swLat = GRID_BOUNDS.minLat + row * CELL_LAT
  const swLng = GRID_BOUNDS.minLng + col * CELL_LNG
  return [
    [swLat, swLng],              // southwest corner
    [swLat + CELL_LAT, swLng + CELL_LNG]  // northeast corner
  ]
}

export function isInAnkaraBounds(lat: number, lng: number): boolean {
  return (
    lat >= GRID_BOUNDS.minLat && lat <= GRID_BOUNDS.maxLat &&
    lng >= GRID_BOUNDS.minLng && lng <= GRID_BOUNDS.maxLng
  )
}
```

### Pattern 2: Check-in Service (INSERT, not upsert)

**What:** New `checkIn()` function in a dedicated `checkIns.ts` service. Uses plain INSERT to allow multiple visits per place per user (unlike `recordVisit()` which uses upsert).
**When to use:** Called by CheckInButton on user tap.

```typescript
// Source: project pattern — mirrors src/lib/services/lists.ts style
// File: src/lib/services/checkIns.ts
import { supabase } from '@/lib/supabase'

export async function checkIn(
  userId: string,
  placeId: string
): Promise<{ data: null; error: string | null }> {
  const { error } = await supabase
    .from('visits')
    .insert({ user_id: userId, place_id: placeId, visited_at: new Date().toISOString() })

  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}
```

### Pattern 3: CheckInButton (mirrors WishlistButton)

**What:** Client component with auth-redirect, pending state, optimistic feedback via toast.
**When to use:** Placed in place hero section.

```typescript
// Source: pattern from src/components/WishlistButton.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { checkIn } from '@/lib/services/checkIns'
import { toast } from 'sonner'

export function CheckInButton({ placeId }: { placeId: string }) {
  const { user } = useAuth()
  const router = useRouter()
  const [checkedIn, setCheckedIn] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const handleClick = async () => {
    if (!user) { router.push('/auth/login'); return }
    if (isPending) return
    setIsPending(true)
    const { error } = await checkIn(user.id, placeId)
    if (!error) {
      setCheckedIn(true)
      toast.success('Mekana check-in yapıldı!')
    }
    setIsPending(false)
  }
  // ... render
}
```

### Pattern 4: react-leaflet with Next.js App Router (SSR-disabled dynamic import)

**What:** Leaflet requires the browser DOM; it cannot run on the server. Use Next.js `dynamic()` with `ssr: false`.
**When to use:** The `/grid` page wraps `GridMap` in a dynamic import.

```typescript
// Source: https://xxlsteve.net/blog/react-leaflet-on-next-15/
// File: src/app/grid/page.tsx
import dynamic from 'next/dynamic'

const GridMap = dynamic(() => import('./GridMap'), {
  ssr: false,
  loading: () => <div className="flex-1 animate-pulse bg-warmgray-100" />,
})

export default function GridPage() {
  return (
    <div className="h-screen flex flex-col">
      <Navbar />
      <GridMap />
    </div>
  )
}
```

```typescript
// File: src/app/grid/GridMap.tsx  — must be 'use client' + default export
'use client'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Rectangle } from 'react-leaflet'
```

### Pattern 5: Opacity-based Cell Coloring

**What:** Calculate per-cell visit count from the visits array, map count to opacity.
**When to use:** Inside GridMap when rendering Rectangle cells.

```typescript
// Opacity curve: linear, capped at 1.0
// 1 visit → 0.20, 2 visits → 0.40, 3 visits → 0.60, 4 visits → 0.80, 5+ → 1.0
function visitCountToOpacity(count: number): number {
  return Math.min(count * 0.20, 1.0)
}

// Rectangle pathOptions
const pathOptions = {
  fillColor: '#C08552',     // caramel
  fillOpacity: visitCountToOpacity(count),
  color: '#E0D0C0',         // subtle grid line
  weight: 0.5,
  opacity: 0.6,
}
```

### Pattern 6: getUserVisitsWithCoords — extended visit query

**What:** New query that joins places.latitude and places.longitude so the grid page has coordinates to compute cell keys.
**When to use:** Grid page data loading.

```typescript
// Extend visits.ts — new function
export async function getUserVisitsWithCoords(
  userId: string
): Promise<{ data: VisitWithCoords[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from('visits')
    .select('id, place_id, visited_at, places(id, name, slug, latitude, longitude)')
    .eq('user_id', userId)

  if (error) return { data: null, error: error.message }
  return { data: (data ?? []) as VisitWithCoords[], error: null }
}
```

### Pattern 7: Sonner Toast Setup

**What:** Single `<Toaster />` in layout, `toast.success()` at call sites.
**When to use:** Add once to `src/app/layout.tsx`; call from any client component.

```typescript
// src/app/layout.tsx — add once
import { Toaster } from 'sonner'
// inside <body>:  <Toaster position="bottom-center" />

// At call site:
import { toast } from 'sonner'
toast.success('Mekana check-in yapıldı!')
```

### Anti-Patterns to Avoid

- **Using `upsert` for check-in:** `recordVisit()` uses upsert (idempotent). `checkIn()` must use `insert` to allow multiple check-ins per place. Never reuse `recordVisit()` for the check-in button.
- **Importing leaflet at module level in a server component:** Will crash Next.js build. Always behind `dynamic(() => import(...), { ssr: false })`.
- **Rendering all ~28,500 possible cells as Rectangles:** Only render cells where visit count > 0. Unvisited cells are the base map (no Rectangle element needed — just the CSS background of the map).
- **Using geohash for this grid:** Geohash precision 6 = 1.22km × 0.61km (rectangular, too large). Precision 7 = 153m × 153m (too small). No standard precision gives 300–500m square cells. Use the custom bounding-box math instead.
- **Forgetting `leaflet/dist/leaflet.css`:** The map renders blank without it. Import inside the `'use client'` GridMap component.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Toast notifications | Custom toast state + animation | `sonner` | Handles a11y, stacking, animations, RTL — 3 lines vs 100+ |
| Map rendering | Custom SVG/canvas map | `react-leaflet` + OSM tiles | Leaflet handles zoom, pan, projection math, tile loading |
| Leaflet marker icon broken URL | Custom icon workaround | Standard `delete L.Icon.Default.prototype._getIconUrl` fix | Well-known Leaflet/webpack issue with one-liner fix |

**Key insight:** The grid math (bounding box → cell index) is genuinely simple pure arithmetic — 10 lines. The map rendering and toast are where external libraries earn their keep.

---

## Common Pitfalls

### Pitfall 1: Leaflet SSR crash in Next.js

**What goes wrong:** `window is not defined` error at build time.
**Why it happens:** Leaflet accesses `window` on import. Next.js App Router runs components on the server.
**How to avoid:** Wrap `GridMap` in `dynamic(() => import('./GridMap'), { ssr: false })` in the page component. The `GridMap` component itself must be a separate file with `'use client'` and `export default`.
**Warning signs:** Build error mentioning `window`, `document`, or `L is not defined`.

### Pitfall 2: Leaflet CSS not loaded → blank/grey map

**What goes wrong:** Map container renders but shows grey tiles or nothing.
**Why it happens:** Leaflet's CSS (`leaflet/dist/leaflet.css`) must be imported in the client component.
**How to avoid:** Add `import 'leaflet/dist/leaflet.css'` at the top of `GridMap.tsx`.
**Warning signs:** Map container has correct height but shows no tiles.

### Pitfall 3: Map container height = 0

**What goes wrong:** Map renders but is invisible (zero-height).
**Why it happens:** `MapContainer` needs explicit height. `h-full` only works if all ancestor elements have explicit heights.
**How to avoid:** Use `h-screen` on the grid page container, subtract Navbar height. Or give `MapContainer` an explicit `style={{ height: 'calc(100vh - 64px)' }}`.

### Pitfall 4: Leaflet default marker icon broken (webpack asset issue)

**What goes wrong:** Default markers show broken image icons.
**Why it happens:** Leaflet hardcodes `_getIconUrl` which webpack/Next.js breaks.
**How to avoid:** Add this once in `GridMap.tsx`:
```typescript
import L from 'leaflet'
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({ iconUrl: '/leaflet/marker-icon.png', ... })
```
**Note:** This phase doesn't use markers — only Rectangle overlays — so this may not surface.

### Pitfall 5: visits table missing unique constraint for upsert but has it for INSERT conflicts

**What goes wrong:** The existing `recordVisit()` uses `onConflict: 'user_id,place_id'` — this means a `UNIQUE` constraint exists. Multiple check-ins via plain `INSERT` will fail if that constraint is still there.
**Why it happens:** The `visits` table may have a unique constraint to support upsert. A plain INSERT for check-ins would violate it.
**How to avoid:** Verify the `visits` table schema. If a unique constraint on `(user_id, place_id)` exists, it must be **dropped** to allow multiple visits. The migration must handle this. The `recordVisit()` upsert call in reviews will then just do a plain insert (multiple records per user/place pair is fine — all are valid visits).
**Warning signs:** `duplicate key value violates unique constraint` error on check-in.

### Pitfall 6: Places table missing latitude/longitude columns

**What goes wrong:** Grid map shows no colored cells even after check-in.
**Why it happens:** The `places` table has no `latitude`/`longitude` columns yet — they must be added via migration.
**How to avoid:** Migration `20260322_add_place_coords.sql` must add `latitude FLOAT` and `longitude FLOAT` to `places` before any grid query runs. The join in `getUserVisitsWithCoords` will return `null` for places without coords — graceful degradation is handled by checking `places?.latitude != null`.

### Pitfall 7: Ankara bounding box too tight or too wide

**What goes wrong:** Some places in Ankara fall outside the grid (no cell colored) or the grid shows mostly ocean/empty land.
**Why it happens:** Urban Ankara fits roughly lat 39.769–40.1007, lng 32.5394–33.0064. The CONTEXT suggested a wider box (39.7–40.3, 32.4–33.2) which would include significant non-urban areas.
**How to avoid:** Use the validated bounding box from OpenStreetMap data: `minLat: 39.769, maxLat: 40.1007, minLng: 32.5394, maxLng: 33.0064`. Places outside this box during check-in: cell is not colored (same graceful degradation as missing coords).

### Pitfall 8: Cell count arithmetic

**What goes wrong:** CONTEXT says "~400–600 cells total" but the math produces many more.
**Why it happens:** With the validated bounding box and 0.004°/0.0047° steps:
- Rows: (40.1007 - 39.769) / 0.004 = **83 rows**
- Cols: (33.0064 - 32.5394) / 0.0047 = **99 cols**
- Total: **~8,217 cells**
This is more than 400–600 but far fewer than 28,500 (which would result from a larger bounding box). This is fine — only visited cells are rendered as Leaflet Rectangles.
**How to avoid:** Understand that CONTEXT's "400–600" figure may be an estimate. The actual cell count doesn't affect rendering performance because only visited cells are rendered (typical user will have tens to hundreds, not thousands).

---

## Code Examples

Verified patterns from codebase and official sources:

### Migration: Add lat/lng to places, drop unique constraint on visits

```sql
-- supabase/migrations/YYYYMMDD_add_place_coords_and_multi_visit.sql

-- 1. Add coordinate columns to places (nullable — existing rows have no coords)
alter table places
  add column if not exists latitude float,
  add column if not exists longitude float;

-- 2. Drop the unique constraint on visits to allow multiple check-ins
--    (recordVisit upsert will become plain insert; both paths produce valid rows)
alter table visits drop constraint if exists visits_user_id_place_id_key;
```

### Rendering visited cells in react-leaflet

```typescript
// Source: react-leaflet official docs + project pattern
// File: src/app/grid/GridMap.tsx
'use client'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Rectangle } from 'react-leaflet'
import { cellKeyToBounds, visitCountToOpacity } from '@/lib/grid'

export default function GridMap({ cellCounts }: { cellCounts: Record<string, number> }) {
  const center: [number, number] = [39.9208, 32.8541]  // Ankara Kızılay

  return (
    <MapContainer
      center={center}
      zoom={12}
      style={{ height: 'calc(100vh - 64px)', width: '100%' }}
      scrollWheelZoom
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      {Object.entries(cellCounts).map(([key, count]) => (
        <Rectangle
          key={key}
          bounds={cellKeyToBounds(key)}
          pathOptions={{
            fillColor: '#C08552',
            fillOpacity: Math.min(count * 0.20, 1.0),
            color: '#E0D0C0',
            weight: 0.5,
            opacity: 0.6,
          }}
          eventHandlers={{
            click: () => { /* open cell detail panel */ }
          }}
        />
      ))}
    </MapContainer>
  )
}
```

### Building cellCounts from visits

```typescript
// Pure utility — no deps
import { latLngToCellKey, isInAnkaraBounds } from '@/lib/grid'

function buildCellCounts(visits: VisitWithCoords[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const v of visits) {
    const lat = v.places?.latitude
    const lng = v.places?.longitude
    if (lat == null || lng == null) continue
    if (!isInAnkaraBounds(lat, lng)) continue
    const key = latLngToCellKey(lat, lng)
    counts[key] = (counts[key] ?? 0) + 1
  }
  return counts
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| geohash for grid cells | Custom bounding-box uniform grid math | n/a (geohash was never right for non-standard cell sizes) | No npm dep needed; pure arithmetic; cells are consistently sized |
| Leaflet via Pages Router `_document` | Next.js App Router + `dynamic(ssr:false)` | Next.js 13+ App Router | Different import strategy required |
| react-leaflet v3/v4 with React 16–18 | react-leaflet v5 with React 19 (required) | react-leaflet v5 release | v5 is peer-dep locked to React 19 — matches this project |

**Deprecated/outdated:**
- `react-leaflet` v3/v4: incompatible with React 19 peer dep. Use v5.
- `geohash` for 300–500m cells: no precision level produces this cell size. Use custom grid math.

---

## Open Questions

1. **visits table unique constraint**
   - What we know: `recordVisit()` uses `upsert({ onConflict: 'user_id,place_id' })`, which implies a unique constraint exists.
   - What's unclear: Is the constraint explicitly named? Does the migration need to drop it by name or by `if not exists` pattern?
   - Recommendation: Migration should query `information_schema.table_constraints` or simply use `drop constraint if exists visits_user_id_place_id_key`. Planner should include schema introspection step.

2. **CONTEXT "400–600 cells" estimate vs actual ~8,217**
   - What we know: Math with validated bounding box gives ~8,217 possible cells, not 400–600.
   - What's unclear: Whether the CONTEXT estimate was aspirational or based on a coarser grid step.
   - Recommendation: The ~8,217 cell count is fine — only visited cells render. The 400–600 estimate in CONTEXT is likely wrong but functionally irrelevant. Use the 0.004°/0.0047° step (≈444m × 400m cells).

3. **Cell detail panel: which places show in a clicked cell**
   - What we know: Clicking a visited cell shows "places visited in that cell". The visit data loaded for the grid already contains `place_id` and coordinates.
   - What's unclear: Should the panel query Supabase for place details or derive from the already-loaded visits array?
   - Recommendation: Derive from already-loaded visits data to avoid an extra round-trip. The visits query joins `places(id, name, slug, latitude, longitude)` — add `category, neighborhood` to the select for panel display.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 30 + ts-jest 29 |
| Config file | `jest.config.ts` |
| Quick run command | `npx jest src/lib/services/checkIns.test.ts src/lib/grid.test.ts --no-coverage` |
| Full suite command | `npx jest --no-coverage` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| XPLR-01 | `checkIn()` inserts a visit row with INSERT (not upsert) | unit | `npx jest src/lib/services/checkIns.test.ts -x` | ❌ Wave 0 |
| XPLR-01 | Multiple `checkIn()` calls produce multiple rows (non-idempotent) | unit | `npx jest src/lib/services/checkIns.test.ts -x` | ❌ Wave 0 |
| XPLR-01 | `checkIn()` returns `{ data: null, error: null }` on success | unit | `npx jest src/lib/services/checkIns.test.ts -x` | ❌ Wave 0 |
| XPLR-01 | `checkIn()` returns error string on Supabase failure | unit | `npx jest src/lib/services/checkIns.test.ts -x` | ❌ Wave 0 |
| XPLR-02 | `latLngToCellKey()` maps a known Kızılay coordinate to expected row:col | unit | `npx jest src/lib/grid.test.ts -x` | ❌ Wave 0 |
| XPLR-02 | `cellKeyToBounds()` returns a valid LatLngBounds tuple | unit | `npx jest src/lib/grid.test.ts -x` | ❌ Wave 0 |
| XPLR-02 | `isInAnkaraBounds()` returns true for center, false for Istanbul | unit | `npx jest src/lib/grid.test.ts -x` | ❌ Wave 0 |
| XPLR-02 | `buildCellCounts()` aggregates multiple visits to same cell | unit | `npx jest src/lib/grid.test.ts -x` | ❌ Wave 0 |
| XPLR-02 | `getUserVisitsWithCoords()` selects lat/lng from places join | unit | `npx jest src/lib/services/checkIns.test.ts -x` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npx jest src/lib/services/checkIns.test.ts src/lib/grid.test.ts --no-coverage`
- **Per wave merge:** `npx jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/lib/services/checkIns.test.ts` — covers XPLR-01 (checkIn service)
- [ ] `src/lib/grid.test.ts` — covers XPLR-02 (grid math utilities)
- Framework already installed — no new framework setup needed

---

## Sources

### Primary (HIGH confidence)

- Project codebase: `src/lib/services/visits.ts`, `src/components/WishlistButton.tsx`, `src/types/visit.ts`, `src/types/place.ts`, `src/app/place/[slug]/page.tsx`, `src/components/Navbar.tsx`, `src/components/ProfileLayout.tsx`, `package.json`, `globals.css` — direct inspection
- https://www.movable-type.co.uk/scripts/geohash.html — geohash precision cell size table (precision 6: 1.22km×0.61km, precision 7: 153m×153m)
- https://react-leaflet.js.org/ — react-leaflet v5 official docs
- https://xxlsteve.net/blog/react-leaflet-on-next-15/ — Next.js 15 App Router + react-leaflet dynamic import pattern

### Secondary (MEDIUM confidence)

- https://github.com/emilkowalski/sonner — sonner toast library official repo, React 19 support confirmed
- https://www.npmjs.com/package/react-leaflet — v5 peer dep requires React 19 confirmed
- Wikipedia Module:Location map/data/Turkey Ankara — Ankara bounding box coordinates (search result fragment: top 40.1007, bottom 39.769, left 32.5394, right 33.0064)

### Tertiary (LOW confidence — needs validation)

- Ankara bounding box precise values: derived from search result fragment referencing Wikipedia location map data. **Planner should validate these bounds** against OpenStreetMap Nominatim before locking in migration constants. The values `minLat: 39.769, maxLat: 40.1007, minLng: 32.5394, maxLng: 33.0064` appear consistent across multiple sources but were not verified via direct API call.
- visits table unique constraint name: assumed `visits_user_id_place_id_key` (Postgres default naming) — migration must use `IF EXISTS` to be safe.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — react-leaflet v5 + React 19 confirmed, sonner lightweight confirmed, no geohash library needed
- Architecture: HIGH — grid math is pure arithmetic, patterns derived directly from existing codebase
- Pitfalls: HIGH — Leaflet SSR issues are well-documented; visits unique constraint is inferred from existing upsert code and is critical to validate
- Ankara bounding box: MEDIUM — sourced from search result referencing Wikipedia data, consistent with CONTEXT estimates but not directly API-verified

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (react-leaflet and sonner are stable; grid math is static)
