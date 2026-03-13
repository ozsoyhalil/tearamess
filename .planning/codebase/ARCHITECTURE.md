# Architecture

> Focus: patterns, layers, data flow, abstractions, entry points

## Architectural Pattern

**Next.js App Router (client-heavy SPA-style)**

This is a Next.js 16 application using the App Router. Despite using the App Router, the majority of components are client components (`'use client'`). There is minimal use of React Server Components or server-side data fetching — most data is fetched on the client via Supabase JS SDK.

---

## Layers

```
┌─────────────────────────────────────────┐
│              Pages (App Router)          │
│  src/app/**/page.tsx                    │
├─────────────────────────────────────────┤
│         Shared Components               │
│  src/components/*.tsx                   │
├─────────────────────────────────────────┤
│           Context / State               │
│  src/context/AuthContext.tsx            │
├─────────────────────────────────────────┤
│           Data Access                   │
│  src/lib/supabase.ts (Supabase client)  │
├─────────────────────────────────────────┤
│           Supabase (BaaS)               │
│  Auth, PostgreSQL, Row Level Security   │
└─────────────────────────────────────────┘
```

---

## Data Flow

1. **Auth**: `AuthContext` wraps the app in `layout.tsx`. On mount, calls `supabase.auth.getSession()` and subscribes to `onAuthStateChange`. Exposes `user`, `loading`, `signOut` via `useAuth()` hook.

2. **Data reads**: Individual pages call `supabase.from(table).select(...)` directly in `useEffect` hooks. No shared data-fetching layer.

3. **Data writes**: Forms in pages call `supabase.from(table).insert(...)` or `supabase.auth.signIn/signUp(...)` directly.

4. **Routing**: Next.js App Router file-based routing. No programmatic route guards — auth protection is UI-only (redirect via `router.push`).

---

## Entry Points

| File | Purpose |
|------|---------|
| `src/app/layout.tsx` | Root layout — wraps all pages with `AuthProvider`, applies Inter font |
| `src/app/page.tsx` | Landing/home page (server component) |
| `src/app/explore/page.tsx` | Browse all places with category filter |
| `src/app/place/[slug]/page.tsx` | Dynamic place detail + reviews |
| `src/app/new/page.tsx` | Add new place form |
| `src/app/profile/page.tsx` | User profile page |
| `src/app/auth/login/page.tsx` | Login form |
| `src/app/auth/register/page.tsx` | Registration form |

---

## Key Abstractions

| Abstraction | File | Purpose |
|------------|------|---------|
| `supabase` client | `src/lib/supabase.ts` | Singleton Supabase client, initialized from env vars |
| `AuthContext` / `AuthProvider` | `src/context/AuthContext.tsx` | Global auth state via React Context |
| `useAuth()` | `src/context/AuthContext.tsx` | Hook to consume auth state |
| `Navbar` | `src/components/Navbar.tsx` | Shared navigation, auth-aware |
| `StarRating` | `src/components/StarRating.tsx` | Reusable 0–5 star (0.5 increment) rating input |

---

## Notable Architectural Decisions

- **No service layer**: Supabase queries written inline in page components, not abstracted into repositories or service modules.
- **Client-side auth guards**: Route protection done by checking `user` in `useEffect` and calling `router.push('/auth/login')`. No middleware or server-side guards.
- **No API routes**: Zero `app/api/` routes — all DB operations go directly from browser to Supabase.
- **Tiramisu theme**: Custom color palette (`#4B2E2B`, `#C08552`, `#F5EDE4`, `#FFF8F0`) applied via inline styles throughout.
