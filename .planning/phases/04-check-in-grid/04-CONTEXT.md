# Phase 4: Check-in + Grid - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can explicitly check in to places via a prominent button on the place detail page. Each check-in records a visit and colors the corresponding Ankara grid cell on an interactive map. The grid is a full-page canvas at `/grid`, also linked from the profile. Stats (% explored, totals) are Phase 5 — not in scope here.

</domain>

<decisions>
## Implementation Decisions

### Check-in trigger & flow
- Check-in button lives in the **place hero/header** — prominent, makes check-in the primary action on the page
- After check-in: **toast notification** appears — "Mekana check-in yapıldı!" — then button state updates
- Multiple check-ins to the same place are **allowed** — each records a separate timestamp (not idempotent)
- Unauthenticated users clicking check-in → **redirect to /auth/login** (consistent with wishlist/follow patterns)
- Button state: shows "Check In" by default; after checking in, shows "✓ Check edildi" (or similar confirmation text)

### Check-in vs visit relationship
- **Check-in IS a visit** — explicit check-in records to the same `visits` table as review-auto-visits
- Review-auto-visits (`recordVisit()`) also color the grid — same mechanism, both count
- **Backfill from existing visits** — grid shows all historical visits (from past reviews too), not just new check-ins. Users see colored cells immediately on first visit to /grid.
- Places need `latitude` and `longitude` columns on the `places` table for grid calculation
- If a place has no lat/lng: check-in still records the visit, but **no grid cell is colored** (graceful degradation)
- Coordinates are float columns (`places.latitude`, `places.longitude`) — set by creator when adding a place. No PostGIS extension required.

### Grid location & navigation
- Primary home: **`/grid` dedicated page** — full-screen grid canvas
- Also linked from the user profile (profile tab or sidebar link to /grid)
- Navbar should have a link to /grid for logged-in users

### Grid visual design
- **Square cells** over Ankara bounding box — uniform rectangle grid, geohash-friendly
- **~300–500m cell size** — city block level granularity (~400–600 cells for Ankara)
- **Grid overlaid on base map** — semi-transparent colored cells over actual Ankara street map (requires a map library, e.g., Leaflet)
- All cells outlined with **subtle grid lines** (neutral, like #E0D0C0) to show the grid structure

### Grid cell coloring
- **Opacity-based intensity** — caramel color (#C08552) with opacity scaling: 1 visit = ~20% opacity, more visits = higher opacity up to 100%
- Unvisited cells: cream (#F5EDE4) fill with subtle border
- **Click to see places in cell** — clicking a visited cell opens a panel/modal showing the places visited in that cell
- Cells show **no badge/count number** — coloring tells the story, details on click

### Claude's Discretion
- Exact Ankara bounding box coordinates (lat ~39.7–40.3, lng ~32.4–33.2 — needs geographic validation)
- Geohash precision level selection for 300–500m cells (likely precision 6)
- Map library choice for base map (Leaflet recommended — no token required, OSM tiles)
- Toast implementation (custom or lightweight library)
- Exact opacity curve (linear or exponential per visit count)
- Panel/modal design for "places in this cell" view

</decisions>

<specifics>
## Specific Ideas

- Grid should feel like a game map / conquest canvas — filling it in should feel satisfying
- The opacity-based intensity gives a sense of "well-trodden" vs "first visit" areas
- Clicking a cell and seeing what you visited there adds memory/nostalgia value
- Base map underneath the grid provides geographic orientation (streets, landmarks)

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/services/visits.ts`: `recordVisit()` + `getUserVisits()` — check-in can reuse or extend these. `recordVisit` currently uses upsert (idempotent) — will need a new `checkIn()` function using INSERT (not upsert) to allow multiple timestamps.
- `src/components/ui/`: Card, Input, Textarea primitives — reusable for the cell panel/modal
- Tiramisu palette tokens in `globals.css` — use existing caramel (#C08552), cream (#F5EDE4), espresso (#4B2E2B)
- `src/components/WishlistButton.tsx`: optimistic update + redirect-to-login pattern — check-in button should follow same pattern
- `src/components/ProfileLayout.tsx`: tab structure — link to /grid can be added here

### Established Patterns
- Service layer in `src/lib/services/` — new `checkIns.ts` service should follow this pattern
- Toast: no existing toast library — needs to be added or implemented simply
- Data fetching: `useEffect` + Supabase JS SDK — consistent with all other pages
- Auth guard: redirect to `/auth/login` via `useRouter` in `useEffect` when `user` is null

### Integration Points
- `places` table: needs `latitude FLOAT` and `longitude FLOAT` columns added via migration
- `visits` table: check-in inserts here (INSERT, not upsert — allows multiple per place)
- `/place/[slug]/page.tsx`: check-in button goes in the place hero section
- `src/app/layout.tsx` / Navbar: add /grid link for logged-in users
- New page: `src/app/grid/page.tsx` (full-screen map canvas)

</code_context>

<deferred>
## Deferred Ideas

- Anonymous notes on grid cells — v2 (NOTE-01 through NOTE-04)
- % explored / total visit stats — Phase 5 (XPLR-03, XPLR-04)
- Multi-city grid support — v2 (CITY-01, CITY-02)
- Leaderboard / compare grids with friends — future phase

</deferred>

---

*Phase: 04-check-in-grid*
*Context gathered: 2026-03-22*
