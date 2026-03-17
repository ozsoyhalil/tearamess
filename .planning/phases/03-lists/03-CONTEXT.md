# Phase 3: Lists - Context

**Gathered:** 2026-03-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can maintain a one-click "Gideceğim Yerler" wishlist, create named custom lists (e.g. "En iyi kahvaltılıklar"), add/remove places, and toggle list privacy. Public lists appear on the user's profile and are browsable by others via a shareable URL. No recommendations, no collaborative lists, no following-based list discovery — those belong in future phases.

</domain>

<decisions>
## Implementation Decisions

### Wishlist button (place detail page)
- Placed in the place header — next to the place name/rating at the top, most prominent position
- Default state: bookmark icon + "Gideceğim Yerler" label — discoverable with text
- Added state: shows "Listede" normally; hover reveals "Listeden Çıkar" — mirrors the Phase 2 follow button pattern
- Optimistic update: toggle immediately in UI, sync server in background
- Logged-out user clicks → redirect to /auth/login

### Wishlist rules
- "Gideceğim Yerler" is a built-in special list — always public, not subject to privacy toggle
- Always pinned as the first item on the profile Lists tab — above user-created lists

### List creation and management
- New list created from the profile Lists tab — a "+ Yeni Liste" button opens a modal/form
- List has a name and an optional description (captured at creation, editable inline on detail page)
- Named list name can be edited inline on the detail page (click to edit, Enter to save)
- Lists can be deleted from the list detail page (owner only, with confirmation)

### Adding places to lists
- On the place detail page: a "Listeye Ekle" button opens a popover/dropdown showing the user's lists with checkboxes
- Multi-select: a place can be added to multiple lists at once
- A place can be in both the wishlist AND custom lists simultaneously — no conflict

### List detail page (/lists/[id])
- Header: list name (inline-editable for owner), optional description, place count, privacy toggle (owner only)
- Shareable URL for public lists — read-only view for non-owners, edit controls only for owner
- Private lists return 404 (or redirect) for non-owners — not "locked", completely hidden
- Places listed in compact horizontal rows: place name + category + neighborhood
- Each row shows the viewer's own star rating if they've rated the place
- Places ordered newest-first (most recently added at top)
- Remove button on each row for owner — "Listeden Çıkar" — not available to visitors
- Empty state: Turkish message + link to /explore to discover places to add

### Profile Lists tab display
- Lists displayed as a card grid — each card shows: list name, place count, optional cover image (first place's photo or category icon), and privacy badge (lock icon for private lists, visible to owner only)
- "Gideceğim Yerler" pinned first, always at top
- When no custom lists exist: empty state message + "+ Yeni Liste Oluştur" button
- Own profile: sees all lists (public + private), private lists show lock icon badge
- Other user's profile: only public lists visible — private lists completely hidden, no count, no placeholder

### Privacy toggle
- Toggle lives on the list detail page, in the header — visible only to the list owner
- Private lists: lock icon badge on the list card (profile view, owner only)
- "Gideceğim Yerler" is always public — no privacy toggle for the built-in wishlist

### Claude's Discretion
- Exact DB schema for `lists`, `list_items` tables and RLS policies
- Exact popover/modal styling for the "Listeye Ekle" selector on place detail page
- Loading skeleton for list cards and list detail rows
- Toast/snackbar feedback on add/remove actions
- URL slug strategy for /lists/[id] (UUID vs slug)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/Card.tsx` (interactive variant): Use for list cards on the profile Lists tab
- `src/components/FollowButton.tsx`: Pattern reference for the "Listede / hover → Listeden Çıkar" wishlist toggle button
- `src/components/FollowListModal.tsx`: Pattern reference for the "Listeye Ekle" popover/modal component
- `src/context/AuthContext.tsx` + `useAuth`: Needed to determine owner vs visitor view on list detail page
- `src/lib/services/` pattern `{ data: T | null, error: string | null }`: New `lists.ts` service follows this
- `src/components/StarRating.tsx` (readonly): Used inline on place rows in list detail to show viewer's own rating

### Established Patterns
- `'use client'` + `useEffect` data fetching — list detail and profile Lists tab follow this pattern
- Service functions as plain async exports — `export async function getUserLists(userId: string)`
- Named exports for services, default exports for components
- Optimistic update pattern (established in Phase 2 FollowButton) — wishlist toggle uses same approach
- ProfileLayout shared component: `/profile` and `/users/[username]` already use shared layout — Lists tab logic lives here, conditional on isOwnProfile

### Integration Points
- `src/app/profile/page.tsx`: Lists tab already declared (`type Tab = 'visits' | 'lists' | 'reviews'`) — wire up lists data fetch and rendering here
- `src/app/users/[username]/page.tsx`: Same ProfileLayout — public lists appear here for other users
- `src/app/place/[slug]/page.tsx`: Add wishlist button + "Listeye Ekle" popover to place header area
- New routes: `src/app/lists/[id]/page.tsx` — list detail page
- New service: `src/lib/services/lists.ts`
- New Supabase tables: `lists` (id, user_id, name, description, is_public, is_wishlist, created_at) and `list_items` (list_id, place_id, created_at)

</code_context>

<specifics>
## Specific Ideas

- Wishlist button hover pattern mirrors Phase 2 follow button: "Takip Ediliyor" → hover → "Takibi Bırak" — same UX for "Listede" → hover → "Listeden Çıkar"
- List detail rows feel like a music tracklist — compact, scannable, focused on the curation not the exploration
- Profile Lists tab: "Gideceğim Yerler" always pinned first, like a Letterboxd watchlist being the fixed top item

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-lists*
*Context gathered: 2026-03-17*
