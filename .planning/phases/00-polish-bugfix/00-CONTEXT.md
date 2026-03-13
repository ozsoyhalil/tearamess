# Phase 0: Polish & Bugfix - Context

**Gathered:** 2026-03-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix known data bugs (rating pipeline, column name mismatch), centralize all Tiramisu color tokens from inline hex to Tailwind utility classes, and establish consistent visual components (Card, Input, Textarea) so every screen shares the same card and form language. No new features or capabilities.

</domain>

<decisions>
## Implementation Decisions

### Token migration approach
- Replace all inline `style={{ color: '#C08552' }}` hex literals with Tailwind utility classes (e.g., `text-caramel`, `bg-cream`, `border-warmgray-200`)
- Use existing `@theme` token names as-is — do NOT rename to match PLSH-01 spec aliases
- Exception: CSS gradients in `StarRating` (backgroundImage) must stay inline — cannot be expressed as Tailwind classes
- For hex values that don't exactly match a token, snap to the nearest existing token (e.g., `#9C8E7E` → `warmgray-500`)

### Rating bug scope
- No DB migration needed — app has no real user data yet
- Audit the full rating pipeline: UI input → form state → Supabase insert → DB → read query → display
- The `reviews` column is named `content` in the DB — the bug is code-side inconsistency (some old code referenced `.comment`)
- Fix all code references to use `content` consistently; verify no `*2` or `/2` multiplier exists in the pipeline

### Card consistency strategy
- Extract a shared `<Card>` component at `src/components/ui/Card.tsx`
- Three variants: `default` (static, standard shadow + border), `interactive` (adds hover lift + cursor-pointer), `flat` (no shadow, border only — for secondary panels like rating distribution)
- Hover lift effect via Tailwind `hover:` variants (`hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300`) — remove all `onMouseEnter`/`onMouseLeave` inline handlers from card instances

### Form input approach
- Create shared `<Input>` and `<Textarea>` components at `src/components/ui/`
- Focus ring: `focus:ring-2 focus:ring-caramel focus:border-caramel` via Tailwind — removes inline `onFocus`/`onBlur` event handlers
- Error state: `border-red-400` on the input + small error message `<p>` below it
- Apply to all form inputs: search bar, review form, auth forms (login, register, new place)

### Claude's Discretion
- Exact Tailwind shadow preset to use for Card default/interactive variants (shadow-sm, shadow-md, etc.)
- Whether to export Card/Input/Textarea as named or default exports
- Exact border-radius class to standardize on (rounded-xl vs rounded-2xl) — pick one and apply consistently

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/StarRating.tsx`: Already works correctly (0–5, 0.5 increments) — keep logic, just migrate non-gradient color refs to tokens
- `globals.css @theme`: All 5 core Tiramisu tokens already defined (`cream`, `caramel`, `coffee`, `espresso`, `warmgray-*`) — use these directly

### Established Patterns
- All components are `'use client'` with default exports
- Tailwind v4 `@theme` block in `globals.css` — token classes auto-generated (no tailwind.config.ts needed)
- Existing `scrollbar-hide` utility in `globals.css` shows how custom utilities are added
- Import alias: `@/` → `src/`

### Integration Points
- New `Card`, `Input`, `Textarea` components go in `src/components/ui/`
- All pages (`explore`, `profile`, `place/[slug]`, `auth/login`, `auth/register`, `new`) need token migration
- `Navbar.tsx` also needs inline hex → Tailwind migration

</code_context>

<specifics>
## Specific Ideas

- Card component should match the visual style already in place/[slug]/page.tsx info card: `rounded-2xl`, cream/white background, warmgray border — that one looks the most polished
- The caramel spinner (`border-caramel border-t-transparent animate-spin`) appears on multiple pages — could be a candidate for a shared `<Spinner>` too (but not required for PLSH-03)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 00-polish-bugfix*
*Context gathered: 2026-03-13*
