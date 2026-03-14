# Phase 2: Social Graph - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can follow other users (single-direction, Letterboxd style), view any user's public profile page, browse follower/following lists, and see a personalized home feed of recent place visits and reviews from accounts they follow. No two-way friendship, no DMs, no notifications.

</domain>

<decisions>
## Implementation Decisions

### Public profile route
- URL: `/users/[username]` — clean, human-readable (e.g. /users/ahmet)
- Requires `username` field on profiles table
- Sections: header (avatar, display name, follower/following counts, follow button) + tabbed content
- Tabs: **Visits | Lists | Reviews** — each section in its own tab
- Architecture: shared `<ProfileLayout>` component used by both `/profile` (own) and `/users/[username]` (other)
- Own profile shows edit options; other profile shows follow button — same layout, conditional controls

### Feed placement
- The home page `/` becomes the activity feed for logged-in users
- Logged-out users at `/` see a **landing/marketing page** with login/register CTA (separate design)
- Feed is chronological only — newest activity first, no sort toggle
- Infinite scroll — auto-loads more as user approaches the bottom (cursor-based pagination)
- Empty state: friendly Turkish message + button to /explore — *"Henüz kimseyi takip etmiyorsun. Keşfet ve ilginç insanları bul."*

### Feed item design
- Two activity types shown: **visits** and **reviews** as distinct card variants
  - Visit card: "Ahmet [mekana] gitti" — no rating or comment
  - Review card: "Ahmet [mekana] yorum yaptı" — includes star rating and comment snippet
- Each card shows:
  - Author avatar + display name (clickable → their profile)
  - Place name + category (clickable → /place/[slug])
  - Star rating (review cards only)
  - Comment snippet ~100 chars (review cards only, if they wrote text)
  - Relative timestamp — "2 saat önce", "3 gün önce"
- Uses existing Card component (interactive variant) for feed items

### Follow interaction
- Follow/unfollow button in the **profile header** next to the user's name
- **Optimistic update** — button toggles immediately in UI, syncs with server in background; reverts on failure
- Button states:
  - Not following → "Takip Et" (caramel/primary style)
  - Following → "Takip Ediliyor" (greyed out / secondary style); hover reveals "Takibi Bırak"
- Follower/following lists: **modal overlay** — clicking the count opens a modal with the list
  - Each entry: avatar + display name + follow/unfollow button
  - Modal is accessible from both /profile and /users/[username]

### Claude's Discretion
- Exact DB schema for `follows` table (user_id, followed_id, created_at) and RLS policies
- Feed query design (JOIN strategy for activity from followed users)
- Loading skeleton design for feed cards
- Modal animation and backdrop style
- How `username` is set (during registration or profile edit)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/Card.tsx`: `interactive` variant — use for feed activity cards
- `src/context/AuthContext.tsx` + `useAuth`: Current user identity and session — needed for follow state and feed queries
- `src/lib/services/`: Established service pattern `{ data: T | null, error: string | null }` — new `follows.ts` and `feed.ts` services follow this
- `src/lib/supabase.ts`: Client singleton — services use this directly
- `src/components/StarRating.tsx`: Display-only mode (readonly) for showing ratings on review cards
- `src/lib/schemas/`: Zod schemas location — any new forms (e.g. username edit) go here

### Established Patterns
- All pages `'use client'` with `useEffect` data fetching — feed page follows same pattern
- Service functions as plain async exports — `export async function getFeed(userId: string)`
- Named exports for services, default exports for components
- `useAuth` hook provides `user` — follow button uses this to determine own vs other profile

### Integration Points
- New routes: `src/app/page.tsx` (replace home with feed/landing split), `src/app/users/[username]/page.tsx`
- New services: `src/lib/services/follows.ts`, `src/lib/services/feed.ts`
- New Supabase tables: `follows` (user_id, followed_id, created_at)
- Navbar needs a link to the feed (home icon → /) if not already present
- `/profile` page gains follower/following counts and modal trigger

</code_context>

<specifics>
## Specific Ideas

- Follow button interaction should feel like Letterboxd — "Takip Ediliyor" with hover-to-reveal "Takibi Bırak"
- Feed should feel like a Letterboxd diary feed — compact cards, identity-first (author avatar prominent), then venue

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-social-graph*
*Context gathered: 2026-03-15*
