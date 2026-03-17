# Phase 3: Lists - Research

**Researched:** 2026-03-17
**Domain:** Next.js 16 / React 19 / Supabase — list management UI and data layer
**Confidence:** HIGH

## Summary

Phase 3 builds entirely on patterns that are already proven and working in this codebase. Every UI component style, every service layer convention, every test file pattern, and every optimistic-update approach needed for Lists already exists in Phases 0–2. There are no new dependencies to install. The entire phase is additive: two new Supabase tables, one new service file, four new UI components/pages, and two integration points in existing pages.

The primary technical work is Supabase schema design (two tables with RLS policies) plus wiring the lists service into the profile tab and place detail page. The "Listeye Ekle" popover is the most novel UI element — it has no direct codebase predecessor but mirrors `FollowListModal`'s pattern (open/close state, cancel-on-backdrop-click, overflow-y-auto body).

Private list access control is the single non-trivial design decision: private lists must return 404 for non-owners at both the service layer AND the RLS layer — not just a client-side redirect.

**Primary recommendation:** Use UUID directly in `/lists/[id]` URLs (no slug needed — lists don't have discoverable names like places do). RLS policies on `lists` and `list_items` enforce privacy; service functions mirror the `{ data, error }` contract exactly.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Wishlist button (place detail page)**
- Placed in the place header — next to the place name/rating at the top, most prominent position
- Default state: bookmark icon + "Gideceğim Yerler" label — discoverable with text
- Added state: shows "Listede" normally; hover reveals "Listeden Çıkar" — mirrors the Phase 2 follow button pattern
- Optimistic update: toggle immediately in UI, sync server in background
- Logged-out user clicks → redirect to /auth/login

**Wishlist rules**
- "Gideceğim Yerler" is a built-in special list — always public, not subject to privacy toggle
- Always pinned as the first item on the profile Lists tab — above user-created lists

**List creation and management**
- New list created from the profile Lists tab — a "+ Yeni Liste" button opens a modal/form
- List has a name and an optional description (captured at creation, editable inline on detail page)
- Named list name can be edited inline on the detail page (click to edit, Enter to save)
- Lists can be deleted from the list detail page (owner only, with confirmation)

**Adding places to lists**
- On the place detail page: a "Listeye Ekle" button opens a popover/dropdown showing the user's lists with checkboxes
- Multi-select: a place can be added to multiple lists at once
- A place can be in both the wishlist AND custom lists simultaneously — no conflict

**List detail page (/lists/[id])**
- Header: list name (inline-editable for owner), optional description, place count, privacy toggle (owner only)
- Shareable URL for public lists — read-only view for non-owners, edit controls only for owner
- Private lists return 404 (or redirect) for non-owners — not "locked", completely hidden
- Places listed in compact horizontal rows: place name + category + neighborhood
- Each row shows the viewer's own star rating if they've rated the place
- Places ordered newest-first (most recently added at top)
- Remove button on each row for owner — "Listeden Çıkar" — not available to visitors
- Empty state: Turkish message + link to /explore to discover places to add

**Profile Lists tab display**
- Lists displayed as a card grid — each card shows: list name, place count, optional cover image (first place's photo or category icon), and privacy badge (lock icon for private lists, visible to owner only)
- "Gideceğim Yerler" pinned first, always at top
- When no custom lists exist: empty state message + "+ Yeni Liste Oluştur" button
- Own profile: sees all lists (public + private), private lists show lock icon badge
- Other user's profile: only public lists visible — private lists completely hidden, no count, no placeholder

**Privacy toggle**
- Toggle lives on the list detail page, in the header — visible only to the list owner
- Private lists: lock icon badge on the list card (profile view, owner only)
- "Gideceğim Yerler" is always public — no privacy toggle for the built-in wishlist

### Claude's Discretion
- Exact DB schema for `lists`, `list_items` tables and RLS policies
- Exact popover/modal styling for the "Listeye Ekle" selector on place detail page
- Loading skeleton for list cards and list detail rows
- Toast/snackbar feedback on add/remove actions
- URL slug strategy for /lists/[id] (UUID vs slug)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LIST-01 | Kullanıcı bir mekanı tek tıkla "Gideceğim Yerler" listesine ekleyip çıkarabilir | WishlistButton component + `toggleWishlist` service function; optimistic update pattern from FollowButton |
| LIST-02 | Kullanıcı isimlendirilmiş özel liste oluşturabilir (örn. "En iyi kahvaltılıklar") | CreateListModal + `createList` service; `lists` table with name/description/is_wishlist fields |
| LIST-03 | Kullanıcı oluşturduğu listelere mekan ekleyip çıkarabilir | ListItemSelector popover on place detail + `addToList`/`removeFromList` service functions; `list_items` junction table |
| LIST-04 | Kullanıcı listesini herkese açık yapabilir; başkaları profilinde görebilir | `is_public` column + RLS policy; privacy toggle on list detail page; `getUserLists` filters by is_public for non-owners |
</phase_requirements>

---

## Standard Stack

### Core (already installed — zero new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 16.1.6 | `src/app/lists/[id]/page.tsx` new route | Already powering entire app |
| @supabase/supabase-js | ^2.99.1 | `lists` and `list_items` table queries | Already in service layer |
| React | 19.2.3 | 'use client' components with useState/useEffect | All existing pages use this pattern |
| TypeScript | (project default) | `List`, `ListItem` types in `src/types/list.ts` | All existing types follow this pattern |

### Supporting (already installed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| jest / @jest-environment node | ^30.3.0 | Unit tests for lists.ts service | All service tests use this; node env required for Supabase imports |
| @testing-library/react | ^16.3.2 | Component tests if needed | Available; service tests are higher priority |
| Tailwind CSS | (project default) | All styling; warmgray/caramel/cream tokens | Same token set as all other components |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| UUID in /lists/[id] URL | Human-readable slug | UUID is simpler — lists don't need SEO-friendly URLs; slugs add collision-handling complexity |
| Inline toast (div-based) | react-hot-toast or sonner | No new deps; a fixed-position div with opacity transition is sufficient for this phase's feedback needs |
| Checkbox-list popover | Separate modal | Popover stays anchored to button; modal is heavier UX for a fast multi-select action |

**Installation:** No new packages needed.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   └── lists/
│       └── [id]/
│           └── page.tsx         # List detail page (new)
├── components/
│   ├── WishlistButton.tsx        # Wishlist toggle on place detail (new)
│   ├── ListItemSelector.tsx      # "Listeye Ekle" popover (new)
│   ├── CreateListModal.tsx       # New list creation modal (new)
│   └── ui/
│       └── Card.tsx              # Reuse interactive variant for list cards
├── lib/
│   └── services/
│       ├── lists.ts              # All list CRUD + membership operations (new)
│       └── lists.test.ts         # TDD stubs before implementation (new)
└── types/
    └── list.ts                   # List and ListItem types (new)
```

### Supabase Schema (Claude's Discretion — recommended design)

```sql
-- lists table
create table lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  is_public boolean not null default true,
  is_wishlist boolean not null default false,
  created_at timestamptz not null default now()
);

-- list_items junction table (composite PK enforces uniqueness)
create table list_items (
  list_id uuid not null references lists(id) on delete cascade,
  place_id uuid not null references places(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (list_id, place_id)
);

-- RLS: lists
alter table lists enable row level security;

-- Anyone can read public lists
create policy "public lists readable by all"
  on lists for select
  using (is_public = true);

-- Owners can read their own lists (including private)
create policy "owners read own lists"
  on lists for select
  using (auth.uid() = user_id);

-- Only owner can insert/update/delete
create policy "owners manage own lists"
  on lists for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- RLS: list_items
alter table list_items enable row level security;

-- list_items readable when parent list is readable
create policy "list_items readable via list"
  on list_items for select
  using (
    exists (
      select 1 from lists
      where lists.id = list_items.list_id
      and (lists.is_public = true or lists.user_id = auth.uid())
    )
  );

-- Only list owner can insert/delete items
create policy "list owner manages items"
  on list_items for all
  using (
    exists (
      select 1 from lists
      where lists.id = list_items.list_id
      and lists.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from lists
      where lists.id = list_items.list_id
      and lists.user_id = auth.uid()
    )
  );
```

**Wishlist bootstrap:** When a new user registers (or on first Lists tab load), check if their `is_wishlist = true` list exists; create it if not. Simpler than a DB trigger for this phase.

### Pattern 1: Service Layer — `{ data, error }` contract

Every function in `src/lib/services/lists.ts` follows the same contract as `follows.ts` and `profiles.ts`.

```typescript
// Source: existing src/lib/services/follows.ts pattern
export async function getUserLists(
  userId: string,
  includePrivate: boolean = false
): Promise<{ data: List[] | null; error: string | null }> {
  let query = supabase
    .from('lists')
    .select('id, name, description, is_public, is_wishlist, created_at')
    .eq('user_id', userId)
    .order('is_wishlist', { ascending: false }) // wishlist pinned first
    .order('created_at', { ascending: false })

  if (!includePrivate) {
    query = query.eq('is_public', true)
  }

  const { data, error } = await query
  if (error) return { data: null, error: error.message }
  return { data: data as List[], error: null }
}
```

### Pattern 2: WishlistButton — optimistic update (mirrors FollowButton exactly)

```typescript
// Source: existing src/components/FollowButton.tsx pattern
'use client'
import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { addToWishlist, removeFromWishlist } from '@/lib/services/lists'

interface WishlistButtonProps {
  placeId: string
  initialIsWishlisted: boolean
}

export function WishlistButton({ placeId, initialIsWishlisted }: WishlistButtonProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [isWishlisted, setIsWishlisted] = useState(initialIsWishlisted)
  const [isHovering, setIsHovering] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const handleClick = async () => {
    if (!user) { router.push('/auth/login'); return }
    if (isPending) return
    const prev = isWishlisted
    setIsPending(true)
    setIsWishlisted(!isWishlisted)
    const result = isWishlisted
      ? await removeFromWishlist(user.id, placeId)
      : await addToWishlist(user.id, placeId)
    if (result.error) setIsWishlisted(prev)
    setIsPending(false)
  }
  // ... label/className logic mirrors FollowButton
}
```

### Pattern 3: ListItemSelector — popover with checkbox list

```typescript
// Pattern: anchored popover, fetch on open, optimistic checkbox toggle
'use client'
// - useEffect to fetch getUserLists on open (like FollowListModal)
// - Each list row: checkbox (checked = place already in list) + list name + place count
// - Clicking checkbox calls addPlaceToList / removePlaceFromList immediately (optimistic)
// - Close on backdrop click or × button (same as FollowListModal)
// - Render: fixed/absolute positioned div anchored to "Listeye Ekle" button via CSS
```

### Pattern 4: Inline edit for list name

```typescript
// Pattern: click-to-edit with local state
const [editing, setEditing] = useState(false)
const [draftName, setDraftName] = useState(list.name)

// Render: if editing, show <input> + onKeyDown Enter → save → setEditing(false)
// If not editing, show <h1 onClick={() => setEditing(true)}>
// Only rendered for isOwner — visitors see plain <h1>
```

### Anti-Patterns to Avoid

- **Fetching all lists on page load before user clicks "Listeye Ekle":** Fetch lists lazily when the popover opens, like FollowListModal does with follower/following data.
- **Trusting client-side isOwner for access control:** RLS policies enforce ownership at the DB level. Client-side `isOwner` only controls which UI controls are visible.
- **Redirecting instead of 404 for private lists:** The spec says private lists are "completely hidden" — serve a 404, not a "you don't have access" message that confirms the list exists.
- **Storing `is_wishlist` list id client-side only:** The wishlist `id` must be fetched from the DB (the row that has `is_wishlist = true`) — never hardcode or assume a fixed UUID.
- **Using `upsert` for list_items without PK:** The composite PK `(list_id, place_id)` already enforces uniqueness; use `insert ... on conflict do nothing` or check-before-insert.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Privacy enforcement | Client-side visibility toggle only | Supabase RLS `is_public = true OR user_id = auth.uid()` | Client can be bypassed; RLS is enforced at DB level for every query |
| Uniqueness of list membership | Manual check-before-insert | Composite PK `(list_id, place_id)` + `on conflict do nothing` | DB constraint is atomic; manual check has race condition |
| Wishlist creation | Complex trigger/function | Bootstrap on first Lists tab load with `getUserLists` + `createWishlist` if missing | Simpler than DB trigger; happens once per user lifecycle |
| Loading skeletons | Custom animation library | Tailwind `animate-pulse` with div structure (same as `SkeletonRow` in `FollowListModal`) | Already used and tested pattern |

**Key insight:** Privacy for lists is a DB concern, not just a UI concern. Every `getUserLists` call for a non-owner must use `is_public = true` filter — not just hide cards in the UI.

---

## Common Pitfalls

### Pitfall 1: Private list leaking place count or existence

**What goes wrong:** Non-owner profile page shows "3 özel liste" or a placeholder card.
**Why it happens:** Service fetches all lists then UI filters — but count was already exposed.
**How to avoid:** `getUserLists(userId, includePrivate=false)` for non-owners never returns private lists at all. RLS also blocks direct DB access.
**Warning signs:** If you find yourself filtering `list.is_public` in a React component for the profile grid — that's the wrong layer.

### Pitfall 2: Wishlist missing for existing users

**What goes wrong:** A user registered before Phase 3 has no `is_wishlist` row. Clicking the wishlist button throws an error because there's no list to add to.
**Why it happens:** The wishlist row doesn't exist yet — no migration ran for existing users.
**How to avoid:** In `addToWishlist`, first call `getOrCreateWishlist(userId)` which does a `select` then `insert` if not found. Use `upsert` with `on conflict do nothing`.
**Warning signs:** `getWishlistForUser` returns `{ data: null, error: null }` (no row) for older accounts.

### Pitfall 3: isFollowing check pattern for "is place in list"

**What goes wrong:** `isPlaceInList` fetches the entire `list_items` row when you only need a boolean.
**Why it happens:** Copy-pasting `getFollowers` pattern without adapting.
**How to avoid:** Use `select('list_id', { count: 'exact', head: true })` — same pattern as `getFollowerCount` uses `head: true` to get a count without data.
**Warning signs:** `data` array returned when only a boolean is needed.

### Pitfall 4: Supabase RLS select policy overlap

**What goes wrong:** Two SELECT policies on `lists` table (public readable + owner readable) can cause unexpected behavior or require `OR` logic.
**Why it happens:** Supabase evaluates multiple SELECT policies with OR between them — this is actually correct behavior here, but devs sometimes write a single policy trying to combine both conditions and get the logic wrong.
**How to avoid:** Two separate policies is the cleaner approach: one for `is_public = true`, one for `user_id = auth.uid()`. Supabase ORs them automatically.
**Warning signs:** Private lists showing up for non-owners, or public lists not showing for logged-out users.

### Pitfall 5: Inline edit sending on every keystroke

**What goes wrong:** List name update fires on every keydown, hammering the DB.
**Why it happens:** `onChange` wired to service call instead of `onKeyDown` Enter / `onBlur`.
**How to avoid:** Only call `updateListName` on Enter keypress or onBlur — not onChange. Store draft in local state, sync to server only on commit.

---

## Code Examples

Verified patterns from existing codebase:

### Service function skeleton (lists.ts)
```typescript
// Source: src/lib/services/follows.ts — exact same contract
import { supabase } from '@/lib/supabase'
import type { List, ListItem } from '@/types/list'

export async function getUserLists(
  userId: string,
  includePrivate = false
): Promise<{ data: List[] | null; error: string | null }> {
  let query = supabase
    .from('lists')
    .select('id, name, description, is_public, is_wishlist, created_at')
    .eq('user_id', userId)
    .order('is_wishlist', { ascending: false })
    .order('created_at', { ascending: false })

  if (!includePrivate) {
    query = query.eq('is_public', true)
  }

  const { data, error } = await query
  if (error) return { data: null, error: error.message }
  return { data: data as List[], error: null }
}

export async function createList(
  userId: string,
  name: string,
  description?: string
): Promise<{ data: List | null; error: string | null }> {
  const { data, error } = await supabase
    .from('lists')
    .insert({ user_id: userId, name, description: description ?? null, is_public: true, is_wishlist: false })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as List, error: null }
}

export async function getOrCreateWishlist(
  userId: string
): Promise<{ data: List | null; error: string | null }> {
  const { data: existing, error: fetchError } = await supabase
    .from('lists')
    .select('*')
    .eq('user_id', userId)
    .eq('is_wishlist', true)
    .single()

  if (existing) return { data: existing as List, error: null }
  if (fetchError && fetchError.code !== 'PGRST116') return { data: null, error: fetchError.message }

  // Not found — create it
  const { data: created, error: createError } = await supabase
    .from('lists')
    .insert({ user_id: userId, name: 'Gideceğim Yerler', is_public: true, is_wishlist: true })
    .select()
    .single()

  if (createError) return { data: null, error: createError.message }
  return { data: created as List, error: null }
}
```

### Test file skeleton (lists.test.ts)
```typescript
/**
 * @jest-environment node
 */
// LIST-01, LIST-02, LIST-03, LIST-04: Lists service stubs (RED — lists.ts does not exist yet)
import { jest, describe, it, expect, beforeEach } from '@jest/globals'

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}))

import { getUserLists, createList, addPlaceToList, removePlaceFromList } from './lists'
import { supabase } from '@/lib/supabase'

beforeEach(() => { jest.clearAllMocks() })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFrom = () => supabase.from as jest.MockedFunction<any>

describe('getUserLists', () => {
  it('returns public lists for non-owner (includePrivate=false)', async () => { /* ... */ })
  it('returns all lists for owner (includePrivate=true)', async () => { /* ... */ })
  it('returns error string on supabase failure', async () => { /* ... */ })
})

describe('createList', () => {
  it('inserts a list row and returns { data: List, error: null }', async () => { /* ... */ })
  it('returns { data: null, error: string } on failure', async () => { /* ... */ })
})

describe('addPlaceToList', () => {
  it('inserts a list_items row', async () => { /* ... */ })
})

describe('removePlaceFromList', () => {
  it('deletes the list_items row', async () => { /* ... */ })
})
```

### Profile Lists tab integration pattern
```typescript
// Source: src/app/profile/page.tsx — same lazy-load-on-tab pattern as visits tab
{activeTab === 'lists' && (
  <ListsTab
    userId={user.id}
    isOwnProfile={true}
  />
)}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom slug for lists | UUID in /lists/[id] | Phase 3 decision | Simpler — no collision handling needed |
| Client-side privacy filtering | RLS enforced + client `includePrivate` param | Phase 3 design | Security enforced at DB level |
| Fetching all data at once | Lazy fetch per tab (established in Phase 2) | Phase 2 | Lists data only fetched when Lists tab is active |

**Deprecated/outdated in this codebase:**
- Inline Supabase queries in page files — all moved to `src/lib/services/` (Phase 1 decision, strictly enforced)
- `comment` column on reviews — use `content` (Phase 0 fix, already done)

---

## Open Questions

1. **Place cover image for list cards**
   - What we know: Context.md says "first place's photo or category icon" — the `places` table has no `photo_url` column in the current schema
   - What's unclear: Does the DB have a photos table, or is this a future field?
   - Recommendation: Fall back to category icon (text/emoji mapped from category string) for Phase 3. No new columns needed.

2. **Toast/snackbar implementation**
   - What we know: No toast system exists in the codebase yet (left as Claude's Discretion)
   - What's unclear: Whether to add a lightweight toast or use inline button state feedback only
   - Recommendation: A simple fixed-position div with Tailwind `transition-opacity` and a 2-second auto-dismiss via `setTimeout` — no new library. Single `Toast.tsx` component, ~30 lines.

3. **List item count on cards without extra query**
   - What we know: List cards need to show place count
   - What's unclear: Fetch count eagerly in `getUserLists` or lazy-load per card?
   - Recommendation: Include count in `getUserLists` via Supabase's `list_items(count)` nested select: `select('id, name, is_public, is_wishlist, list_items(count)')`. Returns count without a second query.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 30.3.0 with @jest-environment node |
| Config file | jest.config.ts (project root) |
| Quick run command | `npx jest src/lib/services/lists.test.ts --no-coverage` |
| Full suite command | `npx jest --no-coverage` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LIST-01 | `addToWishlist` inserts list_items row; `removeFromWishlist` deletes it; `getOrCreateWishlist` returns existing row | unit | `npx jest src/lib/services/lists.test.ts -t "wishlist" --no-coverage` | ❌ Wave 0 |
| LIST-01 | `isPlaceInWishlist` returns boolean | unit | `npx jest src/lib/services/lists.test.ts -t "isPlaceInWishlist" --no-coverage` | ❌ Wave 0 |
| LIST-02 | `createList` inserts with correct shape | unit | `npx jest src/lib/services/lists.test.ts -t "createList" --no-coverage` | ❌ Wave 0 |
| LIST-02 | `deleteList` removes list and cascades items | unit | `npx jest src/lib/services/lists.test.ts -t "deleteList" --no-coverage` | ❌ Wave 0 |
| LIST-03 | `addPlaceToList` inserts list_items row | unit | `npx jest src/lib/services/lists.test.ts -t "addPlaceToList" --no-coverage` | ❌ Wave 0 |
| LIST-03 | `removePlaceFromList` deletes list_items row | unit | `npx jest src/lib/services/lists.test.ts -t "removePlaceFromList" --no-coverage` | ❌ Wave 0 |
| LIST-04 | `getUserLists` with `includePrivate=false` excludes private lists | unit | `npx jest src/lib/services/lists.test.ts -t "getUserLists" --no-coverage` | ❌ Wave 0 |
| LIST-04 | `updateListPrivacy` toggles `is_public` | unit | `npx jest src/lib/services/lists.test.ts -t "updateListPrivacy" --no-coverage` | ❌ Wave 0 |
| LIST-04 | Private list detail page returns 404 for non-owner | manual | Manual browser test — RLS policy enforcement | manual only |

### Sampling Rate
- **Per task commit:** `npx jest src/lib/services/lists.test.ts --no-coverage`
- **Per wave merge:** `npx jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/services/lists.test.ts` — covers LIST-01, LIST-02, LIST-03, LIST-04 (service layer)
- [ ] `src/types/list.ts` — `List` and `ListItem` type definitions

---

## Sources

### Primary (HIGH confidence)
- Existing codebase `src/lib/services/follows.ts` — service layer contract, mock patterns for tests
- Existing codebase `src/components/FollowButton.tsx` — optimistic update pattern for WishlistButton
- Existing codebase `src/components/FollowListModal.tsx` — open/close/fetch pattern for ListItemSelector popover
- Existing codebase `src/app/profile/page.tsx` — lazy tab load pattern, ProfileLayout integration point
- Existing codebase `src/lib/services/lists.test.ts` reference (follows.test.ts) — jest mock chain pattern

### Secondary (MEDIUM confidence)
- Supabase docs on RLS multiple SELECT policies — OR semantics between policies is documented behavior
- Supabase `PGRST116` error code — "no rows returned" from `.single()` — used in `getOrCreateWishlist`

### Tertiary (LOW confidence)
- None — all findings are verified against existing codebase patterns

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new dependencies, all patterns from existing code
- Architecture: HIGH — schema design follows Supabase RLS best practices; service layer mirrors established patterns exactly
- Pitfalls: HIGH — all identified pitfalls are derived from reading actual existing code and known Supabase behaviors

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (stable stack, no fast-moving libraries introduced)
