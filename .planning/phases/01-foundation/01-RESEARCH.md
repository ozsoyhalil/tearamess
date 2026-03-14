# Phase 1: Foundation - Research

**Researched:** 2026-03-15
**Domain:** Service layer pattern, Next.js middleware auth (Supabase SSR), Zod + React Hook Form
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Service layer scope**
- Full migration: all 5 existing pages (explore, profile, new, place/[slug], auth/register, auth/login) have their inline Supabase calls moved to services now. No page component may call `supabase.from()` directly after this phase.
- By domain: src/lib/services/places.ts, reviews.ts, profiles.ts, auth.ts
- Plain async functions: `export async function getPlaces() {...}` — no classes or wrapper hooks
- Return shape: `{ data: T | null, error: string | null }` — callers always handle both cases
- Typed: service functions return canonical types from src/types/ (Place, Review, Profile from Phase 0)

**Protected routes**
- `/profile` and `/new` require authentication — middleware redirects unauthenticated users to /auth/login before the page renders
- `/explore` and `/place/[slug]` are public — unauthenticated users can browse freely
- On `/place/[slug]`: unauthenticated users see a "Login to write a review" prompt instead of the review form (form is hidden, not just blocked on submit)

**Supabase client strategy**
- Keep existing `src/lib/supabase.ts` (client-only, anon key) for use in client components and services
- Add `src/lib/supabase-server.ts` using @supabase/ssr for middleware auth checking only
- Anon key throughout — no service-role key; RLS policies enforce row-level security

**Form validation**
- All 4 existing forms get migrated: register, login, new place, review
- Validation library: Zod + React Hook Form
- Schema location: `src/lib/schemas/` by domain — auth.ts, places.ts, reviews.ts
- Error display: add optional `error?: string` prop to existing Input and Textarea components in src/components/ui/ — shows error text below the field

### Claude's Discretion
- Exact Zod schema field shapes and validation rules (email format, password length, required fields)
- React Hook Form integration details (register, handleSubmit, formState)
- @supabase/ssr setup details for middleware (cookie handling, createServerClient)
- Order of service files implementation

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFRA-01 | Service layer `src/lib/services/` created; all existing inline Supabase queries moved there | Service layer pattern section; plain async function signatures; `{ data, error }` return shape |
| INFRA-02 | `middleware.ts` with server-side auth protection applied; client-side redirects removed | @supabase/ssr middleware section; `createServerClient` cookie wiring; matcher config |
| INFRA-03 | All new forms written with Zod schema validation and React Hook Form | Zod schema patterns; zodResolver integration; inline error wiring to Input/Textarea props |
</phase_requirements>

---

## Summary

Phase 1 is a pure architectural hardening phase — no new user-visible features. Three independent workstreams must be completed: (1) extracting all Supabase queries into a typed service layer, (2) replacing client-side auth redirects with a Next.js middleware that runs server-side before pages render, and (3) migrating all four forms to Zod + React Hook Form with inline field-level error display.

The codebase is a Next.js 16.1.6 App Router project using React 19 with all pages as `'use client'` components. The existing `supabase.ts` client and canonical types in `src/types/` are already in place. Both `Input` and `Textarea` UI components already accept an `error?: string` prop and render it below the field — no changes are needed to those components, only wiring from React Hook Form `formState.errors` into those props.

The critical risk in this phase is the Zod v4 / @hookform/resolvers compatibility: Zod 4.x ships with `import { z } from 'zod'` but @hookform/resolvers has had TypeScript issues with Zod v4. The safe path is to pin `zod@3` (latest 3.x) until the ecosystem fully stabilizes — zodResolver supports Zod 3 without any issues, and all existing patterns work exactly as documented.

**Primary recommendation:** Install `zod@3`, `react-hook-form@7`, `@hookform/resolvers@3`, and `@supabase/ssr@0.9`. Use `createServerClient` with `getAll`/`setAll` cookie methods in middleware. Service functions return `{ data: T | null, error: string | null }` using the existing anon client.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zod | ^3.24 | Schema validation and type inference | Mature, ecosystem-stable; v4 has resolver compatibility friction |
| react-hook-form | ^7.71 | Uncontrolled form state and submission | Zero re-renders per keystroke; native TS support |
| @hookform/resolvers | ^3.x | Bridge between zod and RHF | Official resolver package; zodResolver works flawlessly with zod 3 |
| @supabase/ssr | ^0.9 | Server-side Supabase client with cookie auth | Replaces deprecated @supabase/auth-helpers-nextjs; required for middleware auth |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @supabase/supabase-js | ^2.99 (already installed) | Client-side Supabase | Already present; used in services and client components |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| zod@3 | zod@4 | Zod 4 has 17x performance improvements but @hookform/resolvers has unresolved TS issues in March 2026; zod 3 is the safe choice |
| react-hook-form | native useState forms (current) | RHF eliminates boilerplate; current forms have no validation beyond one-off if-checks |

**Installation:**
```bash
npm install zod react-hook-form @hookform/resolvers @supabase/ssr
```

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── supabase.ts          # existing client-side client (keep as-is)
│   ├── supabase-server.ts   # NEW: @supabase/ssr createServerClient for middleware
│   ├── services/            # NEW: all data access
│   │   ├── places.ts
│   │   ├── reviews.ts
│   │   ├── profiles.ts
│   │   └── auth.ts
│   └── schemas/             # NEW: Zod validation schemas
│       ├── auth.ts
│       ├── places.ts
│       └── reviews.ts
├── middleware.ts             # NEW: lives at src/middleware.ts (src-directory projects)
├── app/
│   ├── explore/page.tsx      # migrated: supabase.from() removed
│   ├── profile/page.tsx      # migrated: redirect moved to middleware
│   ├── new/page.tsx          # migrated: redirect moved to middleware, form gets RHF
│   ├── place/[slug]/page.tsx # migrated: review form gets RHF
│   └── auth/
│       ├── register/page.tsx # migrated: form gets RHF+Zod
│       └── login/page.tsx    # migrated: form gets RHF+Zod
└── types/
    └── review.ts             # existing canonical types (unchanged)
```

### Pattern 1: Service Function Signature

**What:** All data access is expressed as plain async functions returning a discriminated result type.
**When to use:** Every page that currently calls `supabase.from()` directly.

```typescript
// src/lib/services/places.ts
import { supabase } from '@/lib/supabase'
import type { Place } from '@/types/place'

export async function getPlaces(): Promise<{ data: Place[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from('places')
    .select('id, name, slug, category, city, neighborhood, reviews(rating)')
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  // compute avg_rating here if needed, then return mapped data
  return { data: data ?? [], error: null }
}

export async function searchPlaces(query: string): Promise<{ data: Place[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from('places')
    .select('id, name, slug, category, city')
    .ilike('name', `%${query}%`)
    .limit(8)

  if (error) return { data: null, error: error.message }
  return { data: data ?? [], error: null }
}
```

### Pattern 2: Middleware Auth (server-side redirect)

**What:** `src/middleware.ts` intercepts requests to protected routes, checks the Supabase session via cookies, and redirects unauthenticated users before the page renders — eliminating the client-side flash.
**When to use:** `/profile` and `/new` routes.

```typescript
// src/lib/supabase-server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export function createMiddlewareClient(request: NextRequest, response: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )
}
```

```typescript
// src/middleware.ts
import { type NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase-server'

const PROTECTED_PATHS = ['/profile', '/new']

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request })
  const supabase = createMiddlewareClient(request, response)

  // MUST use getUser(), NOT getSession() — getUser() validates against Supabase Auth server
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isProtected = PROTECTED_PATHS.some(p => pathname.startsWith(p))

  if (isProtected && !user) {
    const loginUrl = new URL('/auth/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### Pattern 3: Zod Schema + zodResolver

**What:** Define a Zod schema once; infer the TypeScript type from it; pass `zodResolver(schema)` to `useForm`.
**When to use:** All four forms: register, login, new place, review.

```typescript
// src/lib/schemas/auth.ts
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta girin'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalı'),
})
export type LoginInput = z.infer<typeof loginSchema>

export const registerSchema = z.object({
  username: z.string()
    .min(3, 'Kullanıcı adı en az 3 karakter olmalı')
    .regex(/^[a-z0-9_]+$/, 'Yalnızca küçük harf, rakam ve _ kullanılabilir'),
  displayName: z.string().optional(),
  email: z.string().email('Geçerli bir e-posta girin'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalı'),
})
export type RegisterInput = z.infer<typeof registerSchema>
```

```typescript
// In a form component:
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginInput } from '@/lib/schemas/auth'

const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
  resolver: zodResolver(loginSchema),
})

// Wiring errors into UI components (error prop already exists on Input/Textarea):
<Input
  {...register('email')}
  label="E-posta"
  error={errors.email?.message}
/>
```

### Anti-Patterns to Avoid

- **Calling `supabase.auth.getSession()` in middleware:** Returns cached session data without server-side revalidation. Always use `supabase.auth.getUser()` in middleware.
- **Using individual `get`/`set`/`remove` cookie methods with @supabase/ssr:** Deprecated. Always use `getAll`/`setAll`.
- **Putting middleware.ts at project root when using `src/` directory:** Must live at `src/middleware.ts` in projects with a `src/` directory.
- **Keeping `router.push('/auth/login')` in page components alongside middleware:** After middleware is added, remove all client-side redirect logic from protected pages — it is now redundant and causes a flash before middleware fires on cold navigation.
- **Importing `zod@4` when @hookform/resolvers has TypeScript issues:** Pin `zod@3` until ecosystem stabilizes.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form field validation | Custom validate functions, manual error state | zodResolver + Zod schemas | RHF handles touched/dirty/submitted state; Zod handles all edge cases |
| Cookie read/write in middleware | Manual `request.cookies.get()` and `response.cookies.set()` | @supabase/ssr createServerClient | Handles token refresh, cookie sync, and session propagation correctly |
| Type inference from schema | Manually writing form data types | `z.infer<typeof schema>` | Schema and type stay in sync; no duplication |
| Server-side session check | Parsing JWT cookies manually | `supabase.auth.getUser()` | Validates token against Supabase Auth server; prevents spoofed cookies |

**Key insight:** Hand-rolling cookie-based auth in Next.js middleware is a 200-line footgun. @supabase/ssr's `createServerClient` with `getAll`/`setAll` handles refresh token rotation, cookie propagation to the browser, and Server Component session visibility all at once.

---

## Common Pitfalls

### Pitfall 1: Client-side redirect flash on protected pages
**What goes wrong:** Pages with `if (!user) { router.push('/auth/login'); return null }` briefly render (or flicker) before redirect fires, because the redirect runs after the page component mounts and the auth state loads.
**Why it happens:** Client components run in the browser; the auth check is asynchronous and depends on `useAuth()` loading.
**How to avoid:** Middleware runs server-side before the page is sent to the browser. Once middleware is wired, remove the `router.push` guard from page components entirely.
**Warning signs:** Pages show a blank loading spinner before redirecting — visible on fast 3G or page refresh.

### Pitfall 2: getSession() vs getUser() in middleware
**What goes wrong:** Using `supabase.auth.getSession()` in middleware lets users forge sessions by manipulating cookies.
**Why it happens:** `getSession()` reads from the cookie directly without re-validating against the Supabase Auth server.
**How to avoid:** Always use `supabase.auth.getUser()` in middleware. It makes a server-to-server request to validate.
**Warning signs:** Auth check passes for users who have manually set fake session cookies.

### Pitfall 3: Missing matcher in middleware config
**What goes wrong:** Middleware runs on every request including `_next/static`, images, and `favicon.ico`, causing unnecessary latency.
**Why it happens:** Default Next.js middleware runs on all routes unless explicitly scoped.
**How to avoid:** Always export `config.matcher` excluding static files. The pattern in Pattern 2 above covers this.

### Pitfall 4: Services importing from the wrong Supabase client
**What goes wrong:** Services accidentally import a server-side Supabase client that isn't available in client components, causing runtime errors.
**Why it happens:** Both `supabase.ts` and `supabase-server.ts` export clients; a wrong import in a service breaks all pages using that service.
**How to avoid:** Services always import from `@/lib/supabase` (the existing client-side client). `supabase-server.ts` is used ONLY in `src/middleware.ts`.

### Pitfall 5: Zod v4 / @hookform/resolvers TypeScript errors
**What goes wrong:** Installing `zod@latest` (which is v4 as of March 2026) causes TypeScript incompatibilities with `@hookform/resolvers`.
**Why it happens:** @hookform/resolvers has unresolved TypeScript issues with Zod 4's new type signatures.
**How to avoid:** Pin `zod@3` explicitly: `npm install zod@3`. The resolver supports Zod 3 without any issues and the API is identical for this phase's needs.
**Warning signs:** TypeScript errors like "Type ... is not assignable to FieldValues" in form components.

### Pitfall 6: Forgetting to remove client-side auth state from migrated pages
**What goes wrong:** After middleware is added, pages like `/profile` still call `if (loading) return <spinner>` and `if (!user) return null`, which causes brief flicker on first load.
**Why it happens:** Old auth guard code isn't removed during migration.
**How to avoid:** After middleware redirect is confirmed working, strip the `useAuth` auth guard pattern from profile/new pages. The middleware guarantees unauthenticated users never reach those pages.

---

## Code Examples

Verified patterns from official sources:

### Service function with typed return
```typescript
// src/lib/services/reviews.ts
import { supabase } from '@/lib/supabase'
import type { Review } from '@/types/review'

export async function getReviewsForPlace(
  placeId: string
): Promise<{ data: Review[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, profiles(username, display_name)')
    .eq('place_id', placeId)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data: (data ?? []) as Review[], error: null }
}

export async function createReview(
  payload: { place_id: string; user_id: string; rating: number; content: string | null; visit_date: string | null }
): Promise<{ data: null; error: string | null }> {
  const { error } = await supabase.from('reviews').insert(payload)
  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}
```

### React Hook Form with zodResolver (login form)
```typescript
// In src/app/auth/login/page.tsx — replacing current useState form
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginInput } from '@/lib/schemas/auth'
import { signIn } from '@/lib/services/auth'

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (values: LoginInput) => {
    const { error } = await signIn(values.email, values.password)
    if (error) {
      setError('root', { message: 'E-posta veya şifre hatalı.' })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input
        {...register('email')}
        type="email"
        label="E-posta"
        error={errors.email?.message}
      />
      <Input
        {...register('password')}
        type="password"
        label="Şifre"
        error={errors.password?.message}
      />
      {errors.root && <p className="text-sm text-red-400">{errors.root.message}</p>}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Giriş yapılıyor…' : 'Giriş Yap'}
      </button>
    </form>
  )
}
```

### Place schema with enum validation
```typescript
// src/lib/schemas/places.ts
import { z } from 'zod'

const CATEGORIES = [
  'Kafe', 'Restoran', 'Park', 'Müze', 'Sahil/Plaj',
  'Sokak/Cadde', 'Kütüphane', 'Bar', 'Teras/Çatı',
  'Köy/Kasaba', 'Doğa/Yürüyüş', 'Manzara Noktası', 'Tarihi Mekan', 'Diğer',
] as const

export const newPlaceSchema = z.object({
  name: z.string().min(1, 'Mekan adı zorunludur').max(100, 'Mekan adı çok uzun'),
  category: z.enum(CATEGORIES, { error: 'Kategori seçmelisiniz' }),
  city: z.string().min(1, 'Şehir zorunludur'),
  neighborhood: z.string().optional(),
  description: z.string().max(500, 'Açıklama en fazla 500 karakter olabilir').optional(),
})
export type NewPlaceInput = z.infer<typeof newPlaceSchema>
```

### Review schema
```typescript
// src/lib/schemas/reviews.ts
import { z } from 'zod'

export const reviewSchema = z.object({
  rating: z.number().min(0.5, 'Puan vermelisiniz').max(5),
  content: z.string().max(1000).optional(),
  visit_date: z.string().optional(),
})
export type ReviewInput = z.infer<typeof reviewSchema>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| @supabase/auth-helpers-nextjs | @supabase/ssr | 2023, deprecated by Supabase | Must use @supabase/ssr for all new middleware auth |
| `createMiddlewareClient` (auth-helpers) | `createServerClient` from @supabase/ssr | 2023 | Different import, new cookie API |
| `get`/`set`/`remove` cookie methods | `getAll`/`setAll` cookie methods | @supabase/ssr 0.2+ | Old individual methods are deprecated and must not be used |
| Manual useState form management | React Hook Form 7 | Current standard | Eliminates re-renders per keystroke, cleaner validation |
| Zod 3 | Zod 4 (transitioning) | July 2025 | Zod 4 ships alongside Zod 3 as `zod/v4`; pin v3 for now |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Deprecated; replaced by `@supabase/ssr`
- `supabase.auth.getSession()` in server context: Insecure; use `getUser()` instead
- Individual cookie methods (`get`, `set`, `remove`) in @supabase/ssr: Deprecated; use `getAll`/`setAll`

---

## Open Questions

1. **Are Place and Profile canonical types already defined in src/types/?**
   - What we know: `src/types/review.ts` exists with the canonical Review type. The CONTEXT.md references Place, Review, Profile types from Phase 0.
   - What's unclear: `src/types/place.ts` and `src/types/profile.ts` existence was not confirmed in the file listing — only `review.ts` was visible.
   - Recommendation: Wave 0 task should check and create `src/types/place.ts` and `src/types/profile.ts` if missing, to match the shapes used inline in current pages.

2. **Should client-side auth guards be fully removed from profile/new pages after middleware?**
   - What we know: Middleware ensures unauthenticated users are redirected before page renders. Client-side `if (!user) router.push(...)` becomes redundant.
   - What's unclear: Whether `useAuth` is still needed in profile/new for other purposes (e.g., getting `user.id` to pass to services).
   - Recommendation: Keep `useAuth` for obtaining the current user's ID (needed for queries and mutations), but remove the redirect guard block.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — no test runner installed |
| Config file | None — Wave 0 must add |
| Quick run command | `npx jest --testPathPattern=services --passWithNoTests` (after install) |
| Full suite command | `npx jest --passWithNoTests` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-01 | `getPlaces()` returns `{ data: Place[], error: null }` on success | unit | `npx jest src/lib/services/places.test.ts -x` | Wave 0 |
| INFRA-01 | `getPlaces()` returns `{ data: null, error: string }` on Supabase error | unit | `npx jest src/lib/services/places.test.ts -x` | Wave 0 |
| INFRA-01 | No page component imports `supabase.from` directly (static analysis check) | lint/manual | `grep -r "supabase.from" src/app/` should return 0 results | N/A |
| INFRA-02 | Unauthenticated GET /profile returns redirect (302) to /auth/login | integration | `npx jest src/middleware.test.ts -x` | Wave 0 |
| INFRA-02 | Unauthenticated GET /new returns redirect (302) to /auth/login | integration | `npx jest src/middleware.test.ts -x` | Wave 0 |
| INFRA-02 | Unauthenticated GET /explore returns 200 (not redirected) | integration | `npx jest src/middleware.test.ts -x` | Wave 0 |
| INFRA-03 | Login form with invalid email shows inline error without server call | unit | `npx jest src/app/auth/login/page.test.tsx -x` | Wave 0 |
| INFRA-03 | New place form with empty name shows inline error without server call | unit | `npx jest src/app/new/page.test.tsx -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest --passWithNoTests --testPathPattern=<file>`
- **Per wave merge:** `npx jest --passWithNoTests`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `jest.config.ts` — Jest config with Next.js transformer (jest-environment-jsdom, @testing-library/react)
- [ ] `src/lib/services/places.test.ts` — covers INFRA-01
- [ ] `src/lib/services/reviews.test.ts` — covers INFRA-01
- [ ] `src/middleware.test.ts` — covers INFRA-02 (mock createServerClient)
- [ ] `src/app/auth/login/page.test.tsx` — covers INFRA-03
- [ ] Framework install: `npm install --save-dev jest @testing-library/react @testing-library/user-event jest-environment-jsdom ts-jest @types/jest`

---

## Sources

### Primary (HIGH confidence)
- [Supabase SSR Next.js Guide](https://supabase.com/docs/guides/auth/server-side/nextjs) — middleware setup, createServerClient, getUser vs getSession
- [Supabase Creating SSR Client](https://supabase.com/docs/guides/auth/server-side/creating-a-client) — getAll/setAll cookie API
- [React Hook Form useForm docs](https://react-hook-form.com/docs/useform) — resolver, formState, register API
- [Zod v4 versioning](https://zod.dev/v4/versioning) — v3/v4 coexistence strategy

### Secondary (MEDIUM confidence)
- WebSearch verified: @supabase/ssr latest is 0.9.0 (March 2025)
- WebSearch verified: react-hook-form latest is 7.71.2 (March 2026)
- WebSearch verified: zod latest is 4.3.6 but @hookform/resolvers has TypeScript issues with Zod 4

### Tertiary (LOW confidence)
- [ZodError with Zod v4 in RHF](https://github.com/react-hook-form/react-hook-form/issues/12816) — open GitHub issue, unresolved as of research date; recommends using zod/v3 import

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — confirmed via npm registry search and official docs
- Architecture: HIGH — confirmed via official Supabase and RHF docs, codebase inspection
- Pitfalls: HIGH — getSession vs getUser from official Supabase security docs; Zod v4 issue from open GitHub issue

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (stable libraries; @supabase/ssr releases frequently — check for getAll/setAll changes)
