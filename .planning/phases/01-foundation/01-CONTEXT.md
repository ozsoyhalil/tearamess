# Phase 1: Foundation - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Harden the codebase so it's safe and consistent to extend. All data access routes through a service layer in src/lib/services/, auth is enforced server-side via middleware before pages render, and all forms validate with Zod + React Hook Form. No new user-facing features — this phase is purely architectural.

</domain>

<decisions>
## Implementation Decisions

### Service layer scope
- **Full migration:** All 5 existing pages (explore, profile, new, place/[slug], auth/register, auth/login) have their inline Supabase calls moved to services now. No page component may call `supabase.from()` directly after this phase.
- **By domain:** src/lib/services/places.ts, reviews.ts, profiles.ts, auth.ts
- **Plain async functions:** `export async function getPlaces() {...}` — no classes or wrapper hooks
- **Return shape:** `{ data: T | null, error: string | null }` — callers always handle both cases
- **Typed:** Service functions return canonical types from src/types/ (Place, Review, Profile from Phase 0)

### Protected routes
- `/profile` and `/new` require authentication — middleware redirects unauthenticated users to /auth/login before the page renders
- `/explore` and `/place/[slug]` are public — unauthenticated users can browse freely
- On `/place/[slug]`: unauthenticated users see a "Login to write a review" prompt instead of the review form (form is hidden, not just blocked on submit)

### Supabase client strategy
- Keep existing `src/lib/supabase.ts` (client-only, anon key) for use in client components and services
- Add `src/lib/supabase-server.ts` using @supabase/ssr for middleware auth checking only
- Anon key throughout — no service-role key; RLS policies enforce row-level security

### Form validation
- All 4 existing forms get migrated: register, login, new place, review
- Validation library: Zod + React Hook Form
- Schema location: `src/lib/schemas/` by domain — auth.ts, places.ts, reviews.ts
- Error display: add optional `error?: string` prop to existing Input and Textarea components in src/components/ui/ — shows error text below the field

### Claude's Discretion
- Exact Zod schema field shapes and validation rules (email format, password length, required fields)
- React Hook Form integration details (register, handleSubmit, formState)
- @supabase/ssr setup details for middleware (cookie handling, createServerClient)
- Order of service files implementation

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/supabase.ts`: Existing client — services use this directly. Keep as-is.
- `src/components/ui/Input.tsx`: Add `error?: string` prop for inline error display
- `src/components/ui/Textarea.tsx`: Add `error?: string` prop for inline error display
- `src/types/`: Canonical Place, Review, Profile types — service return types must match these

### Established Patterns
- All pages are `'use client'` with client-side data fetching — services stay client-side, no RSC migration in this phase
- Named exports pattern (established in Phase 0 for UI components) — use same for service functions
- Static Record<Variant,string> pattern from Phase 0 — not relevant here but consistent with codebase style

### Integration Points
- 5 pages with inline Supabase calls to migrate: src/app/explore/page.tsx, src/app/profile/page.tsx, src/app/new/page.tsx, src/app/place/[slug]/page.tsx, src/app/auth/register/page.tsx, src/app/auth/login/page.tsx
- 4 forms to migrate to RHF+Zod: register, login, new place, review (in place/[slug])
- middleware.ts is new — lives at root of src/ or project root (Next.js App Router convention)
- New package installs needed: @supabase/ssr, zod, react-hook-form, @hookform/resolvers

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for service layer patterns and Zod schema design.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-15*
