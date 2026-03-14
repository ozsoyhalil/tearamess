# Phase 2: Social Graph - Research

**Researched:** 2026-03-15
**Domain:** Supabase social graph (follows, cursor-based feed), Next.js App Router, optimistic UI, infinite scroll
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Public profile route**
- URL: `/users/[username]` — clean, human-readable (e.g. /users/ahmet)
- Requires `username` field on profiles table
- Sections: header (avatar, display name, follower/following counts, follow button) + tabbed content
- Tabs: **Visits | Lists | Reviews** — each section in its own tab
- Architecture: shared `<ProfileLayout>` component used by both `/profile` (own) and `/users/[username]` (other)
- Own profile shows edit options; other profile shows follow button — same layout, conditional controls

**Feed placement**
- The home page `/` becomes the activity feed for logged-in users
- Logged-out users at `/` see a **landing/marketing page** with login/register CTA (separate design)
- Feed is chronological only — newest activity first, no sort toggle
- Infinite scroll — auto-loads more as user approaches the bottom (cursor-based pagination)
- Empty state: friendly Turkish message + button to /explore — *"Henüz kimseyi takip etmiyorsun. Keşfet ve ilginç insanları bul."*

**Feed item design**
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

**Follow interaction**
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

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SOCL-01 | User can follow another user (single-direction) | follows table schema, followUser/unfollowUser service, optimistic update pattern |
| SOCL-02 | User can see their own following/follower list | getFollowers/getFollowing services, follower count query, modal pattern |
| SOCL-03 | User sees activity feed of followed users (visits + reviews) with infinite scroll | getFeed cursor-based pagination, UNION query or separate queries merged, IntersectionObserver for scroll trigger |
| SOCL-04 | User can view another user's public profile, lists, and visit history | /users/[username] route, getProfileByUsername service, ProfileLayout shared component |
</phase_requirements>

---

## Summary

Phase 2 introduces the social layer on top of the existing Supabase data model. The core data requirement is a `follows` table (follower_id, following_id, created_at) with two RLS policies: anyone can read follow relationships (public social graph), but only authenticated users can insert/delete their own follow rows. No new library installs are needed — everything builds on the existing stack (Supabase client, Next.js App Router, React state patterns already in the codebase).

The feed is the most technically involved feature. It must combine activity from two different tables — `reviews` and `visits` (the latter is a new table this phase introduces) — filter to only accounts the current user follows, sort chronologically, and support cursor-based infinite scroll. The cleanest implementation given the existing stack is to run two separate Supabase queries (one per activity type), merge and sort the results client-side, and implement cursor pagination by tracking the oldest-seen `created_at` timestamp. This avoids complex SQL UNION workarounds in the Supabase JS client.

The profile refactor (shared `<ProfileLayout>`) requires adding a `getProfileByUsername` service (lookup by `username` column) and new tabs (Visits, Lists, Reviews). The follow button's optimistic update pattern mirrors what Letterboxd does: flip state immediately, fire the network request, revert on error. This is standard React `useState` — no library needed.

**Primary recommendation:** Add `follows` table + `visits` table to Supabase with correct RLS policies. Build two services (`follows.ts`, `feed.ts`). Use IntersectionObserver for infinite scroll trigger. Share `<ProfileLayout>` across `/profile` and `/users/[username]` with a `isOwnProfile` prop to conditionally render edit vs follow controls.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2.99 (already installed) | Supabase queries for follows, feed, profiles | Already the project's data client; no change needed |
| React (already installed) | 19.2.3 | Component state for optimistic follow, modal, scroll | Already present; no additions needed |
| Next.js App Router (already installed) | 16.1.6 | `/users/[username]` dynamic route, `/` page split | Already present |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| IntersectionObserver (Web API) | Native | Detect when user scrolls near bottom of feed | Built-in; no install needed; use a `useRef` + `useEffect` pattern |
| date-fns | ^4.x | Relative timestamp formatting ("2 saat önce") | Lightweight, tree-shakeable; OR hand-roll with `Intl.RelativeTimeFormat` (see below) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| date-fns for relative time | `Intl.RelativeTimeFormat` (native) | Native API works well for simple relative times; date-fns adds 7KB but has better Turkish locale support. For "2 saat önce" style: native `Intl.RelativeTimeFormat('tr')` is sufficient and zero-install. Prefer native. |
| IntersectionObserver (manual) | `react-intersection-observer` library | Library saves 10 lines; native Web API is already supported in all target browsers. Prefer native. |
| Two-query client-side merge | Supabase RPC / PostgreSQL function | RPC is cleaner for large datasets but adds DB migration complexity. Two-query merge is fine for v1 feed volumes. |

**Installation:**
```bash
# No new dependencies required for this phase
# If relative time formatting proves complex: npm install date-fns
```

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── page.tsx                    # REPLACE: auth-split home (feed or landing)
│   └── users/
│       └── [username]/
│           └── page.tsx            # NEW: public user profile
├── components/
│   ├── ProfileLayout.tsx           # NEW: shared profile shell (own + public)
│   ├── FollowButton.tsx            # NEW: optimistic follow/unfollow
│   ├── FollowListModal.tsx         # NEW: followers/following modal
│   ├── FeedCard.tsx                # NEW: activity card (visit or review variant)
│   └── FeedSkeleton.tsx            # NEW: loading skeleton for feed cards
├── lib/
│   └── services/
│       ├── follows.ts              # NEW: follow/unfollow/getFollowers/getFollowing/isFollowing
│       ├── feed.ts                 # NEW: getFeed(userId, cursor?) → FeedItem[]
│       └── visits.ts               # NEW: getUserVisits(userId) for profile Visits tab
├── types/
│   ├── follow.ts                   # NEW: Follow type
│   ├── visit.ts                    # NEW: Visit type
│   └── feed.ts                     # NEW: FeedItem union type (VisitActivity | ReviewActivity)
└── lib/
    └── utils/
        └── relativeTime.ts         # NEW: formatRelativeTime(date) using Intl.RelativeTimeFormat('tr')
```

### Pattern 1: Follows Table Schema + RLS
**What:** Minimal join table with two foreign keys and a composite unique constraint.
**When to use:** All follow/unfollow/check-follow operations.

```sql
-- Supabase SQL editor migration
create table public.follows (
  follower_id  uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id)
);

-- RLS: enable row-level security
alter table public.follows enable row level security;

-- Anyone can read follows (public social graph)
create policy "follows_select_public"
  on public.follows for select
  using (true);

-- Users can only insert their own follow rows
create policy "follows_insert_own"
  on public.follows for insert
  with check (auth.uid() = follower_id);

-- Users can only delete their own follow rows
create policy "follows_delete_own"
  on public.follows for delete
  using (auth.uid() = follower_id);
```

### Pattern 2: Visits Table Schema
**What:** Lightweight "I was here" record. Distinct from reviews — no rating or text required.
**When to use:** Feed visit cards, profile Visits tab (SOCL-03, SOCL-04).

```sql
create table public.visits (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  place_id   uuid not null references public.places(id) on delete cascade,
  visited_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, place_id)  -- one visit record per user per place (upsert pattern)
);

alter table public.visits enable row level security;

-- Anyone can read visits (public activity)
create policy "visits_select_public"
  on public.visits for select
  using (true);

-- Users can only insert their own visits
create policy "visits_insert_own"
  on public.visits for insert
  with check (auth.uid() = user_id);

-- Users can delete their own visits
create policy "visits_delete_own"
  on public.visits for delete
  using (auth.uid() = user_id);
```

### Pattern 3: Follows Service Functions
**What:** Plain async functions following the existing `{ data, error }` service pattern.

```typescript
// src/lib/services/follows.ts
import { supabase } from '@/lib/supabase'

export async function followUser(
  followerId: string,
  followingId: string
): Promise<{ data: null; error: string | null }> {
  const { error } = await supabase
    .from('follows')
    .insert({ follower_id: followerId, following_id: followingId })
  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

export async function unfollowUser(
  followerId: string,
  followingId: string
): Promise<{ data: null; error: string | null }> {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

export async function isFollowing(
  followerId: string,
  followingId: string
): Promise<{ data: boolean; error: string | null }> {
  const { data, error } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle()
  if (error) return { data: false, error: error.message }
  return { data: data !== null, error: null }
}

export async function getFollowerCount(
  userId: string
): Promise<{ data: number; error: string | null }> {
  const { count, error } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', userId)
  if (error) return { data: 0, error: error.message }
  return { data: count ?? 0, error: null }
}

export async function getFollowingCount(
  userId: string
): Promise<{ data: number; error: string | null }> {
  const { count, error } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', userId)
  if (error) return { data: 0, error: error.message }
  return { data: count ?? 0, error: null }
}

export async function getFollowers(userId: string): Promise<{
  data: Array<{ user_id: string; username: string | null; display_name: string | null; avatar_url: string | null }> | null
  error: string | null
}> {
  const { data, error } = await supabase
    .from('follows')
    .select('profiles!follower_id(user_id, username, display_name, avatar_url)')
    .eq('following_id', userId)
  if (error) return { data: null, error: error.message }
  return {
    data: (data ?? []).map((row: any) => row.profiles).filter(Boolean),
    error: null,
  }
}

export async function getFollowing(userId: string): Promise<{
  data: Array<{ user_id: string; username: string | null; display_name: string | null; avatar_url: string | null }> | null
  error: string | null
}> {
  const { data, error } = await supabase
    .from('follows')
    .select('profiles!following_id(user_id, username, display_name, avatar_url)')
    .eq('follower_id', userId)
  if (error) return { data: null, error: error.message }
  return {
    data: (data ?? []).map((row: any) => row.profiles).filter(Boolean),
    error: null,
  }
}
```

### Pattern 4: Feed Service (Two-Query Merge + Cursor Pagination)
**What:** Fetches recent reviews and visits from followed accounts, merges them by timestamp, paginates via cursor.
**When to use:** Home feed page with infinite scroll.

```typescript
// src/types/feed.ts
export type VisitActivity = {
  type: 'visit'
  id: string
  created_at: string
  user_id: string
  author: { username: string | null; display_name: string | null; avatar_url: string | null }
  place: { id: string; name: string; slug: string; category: string }
}

export type ReviewActivity = {
  type: 'review'
  id: string
  created_at: string
  user_id: string
  author: { username: string | null; display_name: string | null; avatar_url: string | null }
  place: { id: string; name: string; slug: string; category: string }
  rating: number
  content: string | null
}

export type FeedItem = VisitActivity | ReviewActivity
```

```typescript
// src/lib/services/feed.ts
import { supabase } from '@/lib/supabase'
import type { FeedItem } from '@/types/feed'

const PAGE_SIZE = 20

export async function getFeed(
  userId: string,
  cursor?: string // ISO timestamp — load items older than this
): Promise<{ data: FeedItem[] | null; error: string | null }> {
  // Step 1: get all followed user IDs
  const { data: followRows, error: followErr } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId)

  if (followErr) return { data: null, error: followErr.message }
  if (!followRows || followRows.length === 0) return { data: [], error: null }

  const followedIds = followRows.map(r => r.following_id)

  // Step 2: fetch recent reviews from followed users
  let reviewQuery = supabase
    .from('reviews')
    .select('id, created_at, user_id, rating, content, places(id, name, slug, category), profiles(username, display_name, avatar_url)')
    .in('user_id', followedIds)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE)

  if (cursor) reviewQuery = reviewQuery.lt('created_at', cursor)

  // Step 3: fetch recent visits from followed users
  let visitQuery = supabase
    .from('visits')
    .select('id, created_at, user_id, places(id, name, slug, category), profiles(username, display_name, avatar_url)')
    .in('user_id', followedIds)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE)

  if (cursor) visitQuery = visitQuery.lt('created_at', cursor)

  const [reviewRes, visitRes] = await Promise.all([reviewQuery, visitQuery])

  if (reviewRes.error) return { data: null, error: reviewRes.error.message }
  if (visitRes.error) return { data: null, error: visitRes.error.message }

  // Step 4: normalize to FeedItem, merge, sort, slice to PAGE_SIZE
  const reviews: FeedItem[] = (reviewRes.data ?? []).map((r: any) => ({
    type: 'review' as const,
    id: r.id,
    created_at: r.created_at,
    user_id: r.user_id,
    author: r.profiles ?? { username: null, display_name: null, avatar_url: null },
    place: r.places ?? { id: '', name: 'Silinmiş mekan', slug: '', category: '' },
    rating: r.rating,
    content: r.content,
  }))

  const visits: FeedItem[] = (visitRes.data ?? []).map((v: any) => ({
    type: 'visit' as const,
    id: v.id,
    created_at: v.created_at,
    user_id: v.user_id,
    author: v.profiles ?? { username: null, display_name: null, avatar_url: null },
    place: v.places ?? { id: '', name: 'Silinmiş mekan', slug: '', category: '' },
  }))

  const merged = [...reviews, ...visits]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, PAGE_SIZE)

  return { data: merged, error: null }
}
```

### Pattern 5: Optimistic Follow Button
**What:** Toggle state immediately; sync with server; revert on error.
**When to use:** Follow button in `<ProfileLayout>` header.

```typescript
// src/components/FollowButton.tsx
'use client'
import { useState } from 'react'
import { followUser, unfollowUser } from '@/lib/services/follows'
import { useAuth } from '@/context/AuthContext'

interface FollowButtonProps {
  targetUserId: string
  initialIsFollowing: boolean
}

export function FollowButton({ targetUserId, initialIsFollowing }: FollowButtonProps) {
  const { user } = useAuth()
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isHovering, setIsHovering] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const handleToggle = async () => {
    if (!user || isPending) return
    const prev = isFollowing
    setIsFollowing(!prev)   // optimistic update
    setIsPending(true)

    const { error } = prev
      ? await unfollowUser(user.id, targetUserId)
      : await followUser(user.id, targetUserId)

    if (error) setIsFollowing(prev)  // revert on failure
    setIsPending(false)
  }

  if (!user) return null

  const label = isFollowing
    ? (isHovering ? 'Takibi Bırak' : 'Takip Ediliyor')
    : 'Takip Et'

  return (
    <button
      onClick={handleToggle}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      disabled={isPending}
      className={/* caramel when not following, grey when following */ ''}
    >
      {label}
    </button>
  )
}
```

### Pattern 6: IntersectionObserver Infinite Scroll
**What:** Attach an invisible sentinel div at the bottom of the feed list; IntersectionObserver fires when it enters the viewport.

```typescript
// Inside feed page component
const sentinelRef = useRef<HTMLDivElement>(null)

useEffect(() => {
  const el = sentinelRef.current
  if (!el) return
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !loading && hasMore) {
        loadMore()
      }
    },
    { rootMargin: '200px' }
  )
  observer.observe(el)
  return () => observer.disconnect()
}, [loading, hasMore])

// In JSX — after the feed list:
<div ref={sentinelRef} className="h-px" />
```

### Pattern 7: Relative Time (Turkish, zero-install)
**What:** Format a UTC ISO timestamp into Turkish relative text.

```typescript
// src/lib/utils/relativeTime.ts
const rtf = new Intl.RelativeTimeFormat('tr', { numeric: 'auto' })

export function formatRelativeTime(isoDate: string): string {
  const diff = (new Date(isoDate).getTime() - Date.now()) / 1000 // negative = past
  const abs = Math.abs(diff)
  if (abs < 60)    return rtf.format(Math.round(diff), 'second')
  if (abs < 3600)  return rtf.format(Math.round(diff / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour')
  return rtf.format(Math.round(diff / 86400), 'day')
}
// Output: "2 saat önce", "3 gün önce", "dün", etc.
```

### Pattern 8: getProfileByUsername Service
**What:** Look up a profile by username slug (for `/users/[username]` route).

```typescript
// Add to src/lib/services/profiles.ts
export async function getProfileByUsername(
  username: string
): Promise<{ data: Profile | null; error: string | null }> {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, username, display_name, avatar_url')
    .eq('username', username)
    .maybeSingle()
  if (error) return { data: null, error: error.message }
  if (!data) return { data: null, error: 'Kullanıcı bulunamadı' }
  return { data: data as Profile, error: null }
}
```

### Anti-Patterns to Avoid

- **Fetching all follows and then all activity:** Load followed IDs first, then use `.in()` for activity. Never load all activity and filter client-side.
- **Offset-based pagination for feed:** Using `.range(0, 19)`, `.range(20, 39)` has a race condition when new items arrive — always use cursor-based pagination with `.lt('created_at', cursor)`.
- **Storing follow counts as a denormalized column:** Count queries on the `follows` table with `{ count: 'exact', head: true }` are fast enough for v1; a cached counter needs extra update logic and can drift.
- **Making the follows table private (RLS: only own rows readable):** Following relationships need to be publicly readable for profile pages to display follower/following counts for any user, not just the current user.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Relative timestamps | Custom date formatter | `Intl.RelativeTimeFormat('tr')` | Native Web API; zero-install; correct Turkish grammar |
| Scroll detection | `onScroll` + scroll position math | IntersectionObserver | No scroll event spam; fires exactly once when sentinel enters viewport |
| Optimistic state | Complex state machine / Redux | Local `useState` + revert on error | Trivial for binary follow toggle; no library overhead |
| Follow uniqueness enforcement | Application-level duplicate check | Supabase composite primary key `(follower_id, following_id)` | DB-level guarantee; insert fails cleanly if already following |
| Feed type discrimination | `if (item.hasOwnProperty('rating'))` | `type` discriminant field on FeedItem union | Explicit type field makes TypeScript narrowing safe and readable |

**Key insight:** The social graph for v1 is read-heavy and simple. Every "don't hand-roll" item here is solved by a native Web API, a DB constraint, or a one-line TypeScript pattern. Adding a library would be over-engineering.

---

## Common Pitfalls

### Pitfall 1: profiles table join — user_id vs id
**What goes wrong:** The `profiles` table has a `user_id` column (FK to `auth.users`) but Supabase join syntax uses the FK column name. Joining `follows` to `profiles` requires using the correct FK name in the select string.
**Why it happens:** The `profiles` table has `user_id` as the foreign key, not `id`. A naive `select('profiles(*)')` won't work on `follows` because there's no direct FK from `follows.follower_id` to `profiles.id` — the FK is to `auth.users`.
**How to avoid:** Fetch follows rows, extract user IDs, then do a second query to `profiles` with `.in('user_id', [...ids])`. OR use a Supabase SQL view/RPC that joins `follows` to `profiles` on `user_id`. For v1, the two-query approach is simpler.
**Warning signs:** Supabase returns `null` for the joined `profiles` field despite the user existing.

### Pitfall 2: `follows` foreign key references `auth.users`, not `public.profiles`
**What goes wrong:** If `follows.follower_id` references `auth.users`, Supabase JS cannot auto-join to `public.profiles` because there's no direct FK path.
**Why it happens:** `auth.users` and `public.profiles` are different tables. Supabase foreign-key-based joins only traverse defined FK relationships.
**How to avoid:** Either (a) add an FK from `profiles.user_id` to `auth.users` (likely already exists since profiles was created in Phase 0), then use a two-step lookup; or (b) create an RPC function for the joined query. Recommended: use two-query pattern for follows lists.
**Warning signs:** `profiles!follower_id` throws a PostgREST error about unresolvable relationships.

### Pitfall 3: Username column may not exist on profiles table
**What goes wrong:** The `profiles` table was used in Phase 1 but `username` column was not verified to exist in the DB — only inferred from code. The `/users/[username]` route depends on `username` being queryable.
**Why it happens:** `getProfileByUserId` selects `username` and the `Profile` type has it, but the DB column existence wasn't confirmed through a migration file (no `/supabase/migrations` directory found).
**How to avoid:** Wave 0 task must verify the `profiles` table schema in Supabase dashboard and add `username` column if missing, with a unique index.
**Warning signs:** `getProfileByUsername` returns error "column username does not exist".

### Pitfall 4: Feed cursor drift on new items
**What goes wrong:** Loading page 2 with `.lt('created_at', lastTimestamp)` can duplicate items if two items have exactly the same `created_at`.
**Why it happens:** `lt` is exclusive; two items at the same millisecond would both be included in page 1 and excluded by cursor.
**How to avoid:** Use `(created_at, id)` as cursor — `lt` on timestamp + `.or()` for same-timestamp-but-different-id. For v1, millisecond collisions are extremely rare; single-timestamp cursor is acceptable risk.
**Warning signs:** Same feed item appears twice when scrolling.

### Pitfall 5: Optimistic update forgetting to disable button during pending
**What goes wrong:** User double-clicks follow/unfollow; two concurrent requests race; final DB state depends on which resolves last.
**Why it happens:** Button isn't disabled between click and server response.
**How to avoid:** Set `isPending = true` immediately on click; disable button until request completes; then set `isPending = false`.
**Warning signs:** Follower count in DB shows wrong value after rapid clicking.

### Pitfall 6: visits table unique constraint conflicts with upsert intent
**What goes wrong:** Using `.insert()` on visits table when user visits a place twice throws a unique constraint error.
**Why it happens:** The `unique(user_id, place_id)` constraint prevents duplicate visit records.
**How to avoid:** Use `.upsert({ user_id, place_id, visited_at: now }, { onConflict: 'user_id,place_id' })` to update `visited_at` on re-visit, or use `.insert()` without the unique constraint if multiple visits per place are desired (remove constraint). Decision: for v1 feed simplicity, upsert with one record per user-place pair.
**Warning signs:** `insertVisit` returns "duplicate key value violates unique constraint" error.

---

## Code Examples

### Username-based profile lookup
```typescript
// src/lib/services/profiles.ts addition
export async function getProfileByUsername(
  username: string
): Promise<{ data: Profile | null; error: string | null }> {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, username, display_name, avatar_url')
    .eq('username', username)
    .maybeSingle()
  if (error) return { data: null, error: error.message }
  if (!data) return { data: null, error: 'Kullanıcı bulunamadı' }
  return { data: data as Profile, error: null }
}
```

### Visits service
```typescript
// src/lib/services/visits.ts
import { supabase } from '@/lib/supabase'
import type { Visit } from '@/types/visit'

export async function getUserVisits(
  userId: string
): Promise<{ data: Visit[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from('visits')
    .select('*, places(id, name, slug, category, city)')
    .eq('user_id', userId)
    .order('visited_at', { ascending: false })
  if (error) return { data: null, error: error.message }
  return { data: (data ?? []) as Visit[], error: null }
}

export async function recordVisit(
  userId: string,
  placeId: string
): Promise<{ data: null; error: string | null }> {
  const { error } = await supabase
    .from('visits')
    .upsert({ user_id: userId, place_id: placeId, visited_at: new Date().toISOString() },
             { onConflict: 'user_id,place_id' })
  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}
```

### ProfileLayout component structure
```typescript
// src/components/ProfileLayout.tsx
'use client'
interface ProfileLayoutProps {
  profile: Profile
  isOwnProfile: boolean
  followerCount: number
  followingCount: number
  isFollowing?: boolean       // undefined when isOwnProfile
  children: React.ReactNode   // tab content
}

// Renders: avatar | displayName | @username | follower/following counts (clickable) | follow button (if !isOwnProfile)
// Tab bar: Visits | Lists | Reviews
// Tab content injected via children
```

### Follow count query (Supabase count: 'exact')
```typescript
// Efficient count query — no row data transferred
const { count } = await supabase
  .from('follows')
  .select('*', { count: 'exact', head: true })
  .eq('following_id', userId)
// count is number | null
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Offset pagination (`range(0,19)`) | Cursor pagination (`lt('created_at', cursor)`) | Always preferred for live feeds | Prevents duplicate/missing items when feed updates between page loads |
| `onScroll` event listener | `IntersectionObserver` | Widely adopted ~2018, now universal | No scroll jank; fires exactly once per threshold crossing |
| Individual follow count columns on profiles | Count query on follows table | N/A (v1 decision) | Simpler for v1; avoids trigger/function complexity; fine for current scale |

**Deprecated/outdated:**
- `onScroll` + `scrollTop + clientHeight >= scrollHeight` math: Works but fires constantly and requires debounce. Prefer IntersectionObserver.
- `router.push` client-side redirects on protected pages: Removed in Phase 1 via middleware. Do not re-introduce.

---

## Open Questions

1. **Does the `profiles` table have a `username` column in the actual Supabase DB?**
   - What we know: `profiles.ts` service selects `username`; `Profile` type declares `username: string | null`; auth service passes `username` in signup metadata.
   - What's unclear: No SQL migration files were found in the repo — the DB was likely set up manually via the Supabase dashboard.
   - Recommendation: Wave 0 task — verify via `select username from profiles limit 1` in Supabase SQL editor. If missing, add: `alter table profiles add column username text unique`.

2. **What is the `profiles` table primary key — `id` or `user_id`?**
   - What we know: `getProfileByUserId` queries `.eq('user_id', userId)` suggesting `user_id` is a column, not the PK. The `Profile` type has both `id?: string` and `user_id?: string` (both optional).
   - What's unclear: Whether `profiles.id` is a separate UUID PK or if `user_id` is both the PK and the FK to `auth.users`.
   - Recommendation: Verify in Supabase dashboard. For the follows foreign key, use `auth.users(id)` not `profiles.id` to avoid ambiguity.

3. **Does creating a visit during review submission make sense, or are visits always explicit?**
   - What we know: CONTEXT.md defines visit cards as "Ahmet [mekana] gitti" — a distinct activity type from review. Phase 4 introduces check-in (XPLR-01). For this phase, the feed must show visits but there's no explicit "record visit" UI in scope.
   - What's unclear: Should writing a review automatically create a visit record?
   - Recommendation: Yes — in `createReview` service, also call `upsert` on visits table for the same `user_id + place_id`. This populates visit history without needing a separate UI action. Mark this as a Claude's Discretion implementation detail.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 30 + ts-jest + jest-environment-jsdom (already installed) |
| Config file | `jest.config.ts` (already exists at project root) |
| Quick run command | `npx jest --testPathPattern=follows\|feed --passWithNoTests` |
| Full suite command | `npx jest --passWithNoTests` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SOCL-01 | `followUser()` calls supabase insert with correct follower/following IDs | unit | `npx jest src/lib/services/follows.test.ts -x` | ❌ Wave 0 |
| SOCL-01 | `unfollowUser()` calls supabase delete with correct filter | unit | `npx jest src/lib/services/follows.test.ts -x` | ❌ Wave 0 |
| SOCL-01 | `isFollowing()` returns true when row exists, false when null | unit | `npx jest src/lib/services/follows.test.ts -x` | ❌ Wave 0 |
| SOCL-02 | `getFollowerCount()` returns correct count from supabase | unit | `npx jest src/lib/services/follows.test.ts -x` | ❌ Wave 0 |
| SOCL-02 | `getFollowers()` returns array of profile objects | unit | `npx jest src/lib/services/follows.test.ts -x` | ❌ Wave 0 |
| SOCL-03 | `getFeed()` returns empty array when user follows nobody | unit | `npx jest src/lib/services/feed.test.ts -x` | ❌ Wave 0 |
| SOCL-03 | `getFeed()` returns merged and sorted FeedItems from followed users | unit | `npx jest src/lib/services/feed.test.ts -x` | ❌ Wave 0 |
| SOCL-03 | `getFeed()` respects cursor — only returns items older than cursor | unit | `npx jest src/lib/services/feed.test.ts -x` | ❌ Wave 0 |
| SOCL-04 | `getProfileByUsername()` returns profile for valid username | unit | `npx jest src/lib/services/profiles.test.ts -x` | ❌ Wave 0 (extend existing) |
| SOCL-04 | `getProfileByUsername()` returns error for unknown username | unit | `npx jest src/lib/services/profiles.test.ts -x` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest --testPathPattern=<service-file> --passWithNoTests`
- **Per wave merge:** `npx jest --passWithNoTests`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/services/follows.test.ts` — covers SOCL-01, SOCL-02
- [ ] `src/lib/services/feed.test.ts` — covers SOCL-03
- [ ] `src/lib/services/profiles.test.ts` — extend existing file to add SOCL-04 cases

*(jest.config.ts and test framework already installed — no framework install needed)*

---

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `src/lib/services/`, `src/types/`, `src/app/profile/page.tsx`, `src/context/AuthContext.tsx` — confirmed existing patterns, service signatures, type shapes
- Supabase JS docs pattern: `.select('*', { count: 'exact', head: true })` for efficient counts — standard Supabase JS v2 API
- MDN: `Intl.RelativeTimeFormat` — supported in all modern browsers, Turkish locale ('tr') supported
- MDN: `IntersectionObserver` — supported in all modern browsers, recommended pattern for infinite scroll

### Secondary (MEDIUM confidence)
- CONTEXT.md decisions confirmed: follows table schema, feed design, optimistic update requirement, ProfileLayout architecture
- Phase 01-RESEARCH.md confirmed: service layer pattern (`{ data, error }`), supabase client location, existing test infrastructure details
- `profiles` table `username` column inferred from service code and type definition — not confirmed via DB migration file

### Tertiary (LOW confidence)
- Supabase foreign key join syntax for `follows → profiles`: exact PostgREST join syntax for non-standard FK paths needs validation during Wave 0 — two-query approach recommended as fallback

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; all patterns use existing installed libraries
- Architecture: HIGH — patterns derived directly from codebase inspection + CONTEXT.md decisions
- DB schema: MEDIUM — `profiles.username` existence inferred from code, not confirmed from migration file; Wave 0 must verify
- Pitfalls: HIGH — PostgREST join limitations and cursor pagination behavior are known Supabase patterns

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (stable APIs; Supabase JS client changes infrequently for these query patterns)
