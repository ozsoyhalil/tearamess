---
phase: quick
plan: 1
subsystem: ui-polish
tags: [visual-polish, bug-fix, profile, explore, place-detail, home]
dependency_graph:
  requires: []
  provides: [profile-edit-page, wishlist-dedup-sql, updateProfile-fn, home-carousel, home-category-grid, explore-sort, place-hero, profile-avatar-96]
  affects: [src/app/page.tsx, src/app/explore/page.tsx, src/app/place/[slug]/page.tsx, src/app/profile/page.tsx, src/components/ProfileLayout.tsx, src/components/PlaceCard.tsx]
tech_stack:
  added: []
  patterns: [Suspense-boundary-for-useSearchParams, horizontal-snap-carousel, overlap-card-effect]
key_files:
  created:
    - src/app/profile/edit/page.tsx
    - supabase/migrations/20260322_fix_wishlist_dedup.sql
  modified:
    - src/types/profile.ts
    - src/lib/services/profiles.ts
    - src/components/PlaceCard.tsx
    - src/app/page.tsx
    - src/app/explore/page.tsx
    - src/app/place/[slug]/page.tsx
    - src/app/profile/page.tsx
    - src/components/ProfileLayout.tsx
decisions:
  - resolvePhotoSrc exported from PlaceCard.tsx for reuse in place detail hero
  - useSearchParams() wrapped in Suspense boundary to fix Next.js build error
  - FeedPage accepts displayName prop derived from user metadata at root level
metrics:
  duration: 6min
  completed_date: "2026-03-22T14:48:53Z"
  tasks_completed: 3
  files_modified: 8
---

# Quick Task 1: 4 Sayfa Görsel Polish + 3 Bug Fix — Summary

**One-liner:** Profil edit 404 fix + wishlist dedup SQL + 4 sayfa tiramisu temalı görsel iyileştirme (hero, carousel, kategori grid, 96px avatar, overlap kart, sıralama dropdown)

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Bug Fixes — profil edit, wishlist dedup, updateProfile | a48bf31 | profile/edit/page.tsx, profiles.ts, profile.ts, migration SQL |
| 2 | Ana Sayfa — hero, carousel, kategori grid, son reviewlar | 1926b27 | page.tsx, PlaceCard.tsx |
| 3 | Keşfet + Mekan Detay + Profil + ProfileLayout polish | 6acc41d | explore/page.tsx, place/[slug]/page.tsx, profile/page.tsx, ProfileLayout.tsx |

## What Was Built

### Task 1: Bug Fixes

- **Wishlist dedup SQL** (`supabase/migrations/20260322_fix_wishlist_dedup.sql`): Deletes duplicate `is_wishlist=true` rows keeping oldest per user. Ready to run in Supabase SQL editor.
- **Profile type** (`src/types/profile.ts`): Added `bio?: string | null` field.
- **updateProfile function** (`src/lib/services/profiles.ts`): Upserts `display_name`, `bio`, `avatar_url` by `user_id` with `updated_at` timestamp.
- **Profile edit page** (`src/app/profile/edit/page.tsx`): Full form with display_name, bio, avatar_url fields. Loads existing profile on mount, redirects to /login if unauthenticated, redirects to /profile on save success.

### Task 2: Ana Sayfa Improvements

- **Personalized greeting**: "Merhaba, [isim] 👋" derived from `user.user_metadata.full_name ?? name ?? email prefix`. Shown in both the feed view and the empty feed/discover fallback.
- **Category explore grid**: 10 categories with emoji icons linking to `/explore?category=X`, 4-column mobile / 5-column desktop grid.
- **Horizontal snap carousel**: Popüler Mekanlar and Yeni Eklenen Mekanlar both converted from grid to `overflow-x-auto snap-x` scrollable carousel with `min-w-[280px]` cards.
- **Recent reviews section**: Last 5 reviews with profile avatar initials, place name link, rating, date, and line-clamped content.
- **PlaceCard**: `h-40 → h-48`, overlay `from-black/50 via-black/10`, `hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300`, `resolvePhotoSrc` exported.

### Task 3: Visual Polish

- **Keşfet**: Sort dropdown (yeniden eskiye / en yüksek puan / A→Z), URL `?category=` param sets initial active category, pill buttons `px-5 py-2.5 text-base`, search input `text-lg py-4 px-5`.
- **Mekan detay hero**: Full-width `h-64` hero image with `from-black/60 via-black/20` overlay when photo exists; category gradient + emoji banner when no photo.
- **Mekan detay overlap**: Info card gets `-mt-8 relative z-10` for the overlap effect; `pt-0` on main container.
- **Mekan detay reviews**: `bg-warmgray-100` → `bg-white border border-warmgray-200 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`.
- **Profil visit cards**: Same hover treatment — `bg-white border-warmgray-200 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`.
- **ProfileLayout**: Avatar `w-20 h-20 → w-24 h-24`, initials `text-2xl → text-3xl`, display name `text-xl → text-2xl`, tabs `px-5 py-2.5 → px-6 py-3`, "Profili Düzenle" button `bg-warmgray-100 hover:bg-warmgray-200 border border-warmgray-300 px-5 py-2 font-semibold`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Next.js useSearchParams() Suspense boundary missing**
- **Found during:** Task 3 — npm run build
- **Issue:** `useSearchParams()` in `/explore` page caused build to fail: "useSearchParams() should be wrapped in a suspense boundary at page /explore"
- **Fix:** Extracted page content into `ExploreContent` component; default export `ExplorePage` wraps it in `<Suspense>` with a spinner fallback
- **Files modified:** `src/app/explore/page.tsx`
- **Commit:** 6acc41d (included in same commit)

## Self-Check

### Created files exist:
- [x] `src/app/profile/edit/page.tsx`
- [x] `supabase/migrations/20260322_fix_wishlist_dedup.sql`

### Commits exist:
- [x] a48bf31 — Task 1
- [x] 1926b27 — Task 2
- [x] 6acc41d — Task 3

### Build passes:
- [x] `npm run build` — no errors, `/profile/edit` route present in output

## Self-Check: PASSED
