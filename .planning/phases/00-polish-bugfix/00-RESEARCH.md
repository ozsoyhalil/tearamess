# Phase 0: Polish & Bugfix - Research

**Researched:** 2026-03-13
**Domain:** Tailwind CSS v4 token migration, React component extraction, Supabase data pipeline audit
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Token migration approach**
- Replace all inline `style={{ color: '#C08552' }}` hex literals with Tailwind utility classes (e.g., `text-caramel`, `bg-cream`, `border-warmgray-200`)
- Use existing `@theme` token names as-is — do NOT rename to match PLSH-01 spec aliases
- Exception: CSS gradients in `StarRating` (backgroundImage) must stay inline — cannot be expressed as Tailwind classes
- For hex values that don't exactly match a token, snap to the nearest existing token (e.g., `#9C8E7E` → `warmgray-500`)

**Rating bug scope**
- No DB migration needed — app has no real user data yet
- Audit the full rating pipeline: UI input → form state → Supabase insert → DB → read query → display
- The `reviews` column is named `content` in the DB — the bug is code-side inconsistency (some old code referenced `.comment`)
- Fix all code references to use `content` consistently; verify no `*2` or `/2` multiplier exists in the pipeline

**Card consistency strategy**
- Extract a shared `<Card>` component at `src/components/ui/Card.tsx`
- Three variants: `default` (static, standard shadow + border), `interactive` (adds hover lift + cursor-pointer), `flat` (no shadow, border only — for secondary panels like rating distribution)
- Hover lift effect via Tailwind `hover:` variants (`hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300`) — remove all `onMouseEnter`/`onMouseLeave` inline handlers from card instances

**Form input approach**
- Create shared `<Input>` and `<Textarea>` components at `src/components/ui/`
- Focus ring: `focus:ring-2 focus:ring-caramel focus:border-caramel` via Tailwind — removes inline `onFocus`/`onBlur` event handlers
- Error state: `border-red-400` on the input + small error message `<p>` below it
- Apply to all form inputs: search bar, review form, auth forms (login, register, new place)

### Claude's Discretion
- Exact Tailwind shadow preset to use for Card default/interactive variants (shadow-sm, shadow-md, etc.)
- Whether to export Card/Input/Textarea as named or default exports
- Exact border-radius class to standardize on (rounded-xl vs rounded-2xl) — pick one and apply consistently

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PLSH-01 | Consistent Tiramisu color theme applied to all pages (inline styles removed, migrated to Tailwind CSS custom tokens) | Token mapping table below + complete audit of all 7 files with inline hex |
| PLSH-02 | `reviews` table: `content` column used consistently everywhere; star rating normalized to 5-point scale | Rating pipeline audit — `place/[slug]/page.tsx` already inserts to `content` correctly; explore page avg_rating calculation is clean; no `*2` multiplier found |
| PLSH-03 | Cards, shadows, hover effects and form styles use a consistent visual language; transitions on all interactive elements | Card/Input/Textarea component design patterns documented |
</phase_requirements>

---

## Summary

This phase is a refactor-only cleanup on an existing Next.js 16 / React 19 / Tailwind v4 / Supabase app. No new features are built. The work falls into three buckets: (1) token migration — replacing ~100+ inline hex `style` props with Tailwind utility classes generated from the existing `@theme` block in `globals.css`; (2) a rating data audit confirming the `content` column is used consistently and no double-counting multiplier exists; (3) extracting shared `Card`, `Input`, and `Textarea` components so all six pages share one visual language.

The codebase was read directly and is well-understood. Every file that needs changes has been examined. The token definitions in `globals.css` are already complete — no changes to that file are needed. The Tailwind v4 `@theme` block auto-generates utility classes (`bg-cream`, `text-caramel`, `border-warmgray-200`, etc.) without a `tailwind.config.ts`. The rating pipeline in `place/[slug]/page.tsx` already inserts `content` and uses the correct 0–5 scale; the bug is in legacy code that may have referenced `.comment` but is not currently visible in active pages — the audit task is to confirm no dead reference paths exist.

**Primary recommendation:** Migrate tokens file-by-file (Navbar first as warm-up, then auth pages, then explore, then place, then new, then home), extract components in parallel, then sweep for any remaining `.comment` references in queries or TypeScript types.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.6 | App framework | Already in use |
| React | 19.2.3 | UI library | Already in use |
| Tailwind CSS | ^4 | Utility-first styling | Already in use; `@theme` block drives all tokens |
| @supabase/supabase-js | ^2.99.1 | Database client | Already in use |
| TypeScript | ^5 | Type safety | Already in use |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tailwindcss/postcss | ^4 | PostCSS integration for Tailwind v4 | Build pipeline — already configured |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tailwind utility classes | CSS modules or styled-components | Locked decision — Tailwind is already the standard |
| Inline `onFocus`/`onBlur` | CSS `:focus-within` | Tailwind `focus:` variants are cleaner and already decided |

**Installation:** No new packages required. All libraries are already installed.

---

## Architecture Patterns

### Recommended Project Structure After Phase 0
```
src/
├── components/
│   ├── ui/
│   │   ├── Card.tsx        # New: default/interactive/flat variants
│   │   ├── Input.tsx       # New: shared input with focus ring + error state
│   │   └── Textarea.tsx    # New: shared textarea with focus ring + error state
│   ├── Navbar.tsx          # Modified: inline hex → token classes
│   └── StarRating.tsx      # Modified: non-gradient hex → token classes (gradients stay inline)
├── app/
│   ├── globals.css         # Unchanged — @theme already complete
│   ├── page.tsx            # Modified: inline hex → tokens
│   ├── explore/page.tsx    # Modified: inline hex → tokens, Card/Input usage
│   ├── place/[slug]/page.tsx # Modified: inline hex → tokens, Card/Input/Textarea usage
│   ├── profile/page.tsx    # Modified: inline hex → tokens, Card usage
│   ├── new/page.tsx        # Modified: inline hex → tokens, Input/Textarea usage
│   └── auth/
│       ├── login/page.tsx  # Modified: inline hex → tokens, Input usage
│       └── register/page.tsx # Modified: inline hex → tokens, Input usage
```

### Pattern 1: Tailwind v4 `@theme` Token Usage

**What:** In Tailwind v4, CSS custom properties defined inside `@theme {}` in `globals.css` automatically generate utility classes. A token `--color-caramel: #C08552` produces `bg-caramel`, `text-caramel`, `border-caramel`, `ring-caramel`, etc.

**When to use:** Everywhere currently using `style={{ color: '#C08552' }}` or equivalent.

**Confirmed token-to-class mapping:**
```
#FFF8F0  → bg-cream / text-cream
#C08552  → bg-caramel / text-caramel / border-caramel / ring-caramel
#D4A574  → bg-caramel-light / text-caramel-light
#A06B3C  → bg-caramel-dark / text-caramel-dark
#8C5A3C  → bg-coffee / text-coffee
#A07050  → bg-coffee-light / text-coffee-light
#6B4530  → bg-coffee-dark / text-coffee-dark
#4B2E2B  → bg-espresso / text-espresso
#5C3A36  → bg-espresso-light / text-espresso-light
#3A2320  → bg-espresso-dark / text-espresso-dark
#F5EDE4  → bg-warmgray-100 / text-warmgray-100
#E8DDD1  → bg-warmgray-200 / text-warmgray-200 / border-warmgray-200
#D4C5B5  → bg-warmgray-300 / text-warmgray-300 / border-warmgray-300
#B8A898  → bg-warmgray-400 / text-warmgray-400 / text-warmgray-400
#9C8E7E  → bg-warmgray-500 / text-warmgray-500
```

**Non-token hex values in codebase (snap to nearest):**
```
rgba(192,133,82,0.12)  → NOT expressible as Tailwind class — keep inline (transparent bg for category badge)
rgba(192,133,82,0.15)  → NOT expressible as Tailwind class — keep inline (box-shadow focus ring)
rgba(192,133,82,0.35)  → NOT expressible as Tailwind class — keep inline (button shadow)
rgba(75,46,43,0.75)    → NOT expressible as Tailwind class — keep inline (overlay badge bg)
rgba(75,46,43,0.06/.07/.09/.12) → NOT expressible as Tailwind class — keep inline (box-shadow)
#ef4444               → Use Tailwind `text-red-400` (standard Tailwind color, not a token)
#ffffff               → Use `bg-white` (standard Tailwind)
#FDFAF7               → Snap to `bg-cream` (nearest token — off-white)
```

**Gradients:** All CSS `linear-gradient()` values (in StarRating, page hero, CAT_GRADIENT map) must stay inline.

### Pattern 2: Card Component

**What:** A single `<Card>` wrapper that encodes shadow, border, border-radius, and background. Variant prop controls hover behavior.

**Decided reference:** The `place/[slug]/page.tsx` info card is the visual reference — `rounded-2xl`, white bg, `border-warmgray-200` border.

**Discretion recommendation:**
- `rounded-2xl` — already used on the reference card, auth cards, form cards. Choose this as standard.
- Shadow for `default`: `shadow-sm` (maps to `0 1px 2px` — light lift, consistent with the lightest current usage)
- Shadow for `interactive` on hover: `shadow-md` on hover (`hover:shadow-md`) plus `-translate-y-0.5`
- Named exports are better for tree-shaking and explicit import; use named export `export function Card`

```typescript
// src/components/ui/Card.tsx
'use client'

import { type ReactNode } from 'react'

type CardVariant = 'default' | 'interactive' | 'flat'

interface CardProps {
  variant?: CardVariant
  className?: string
  children: ReactNode
  [key: string]: unknown  // allow as, href passthrough via composition
}

export function Card({ variant = 'default', className = '', children, ...rest }: CardProps) {
  const base = 'rounded-2xl border border-warmgray-200 bg-white'
  const variants = {
    default: 'shadow-sm',
    interactive: 'shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer',
    flat: '',
  }
  return (
    <div className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </div>
  )
}
```

**Note:** When a `Card` must be a `<Link>` (e.g., explore grid), compose by wrapping `<Link>` around `<Card>` or pass the Link's `className` directly to a `<Link>` element that uses the same class string. Do NOT try to make Card polymorphic for this phase — keep it simple.

### Pattern 3: Input / Textarea Components

**What:** Shared form inputs that encode the focus ring and error state via Tailwind, eliminating `onFocus`/`onBlur` handlers.

**Tailwind v4 note:** The `ring` utilities work as: `focus:ring-2 focus:ring-caramel focus:border-caramel outline-none`. The `outline-none` removes browser default outline so the Tailwind ring is the only focus indicator.

```typescript
// src/components/ui/Input.tsx
'use client'

import { type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
  label?: string
}

export function Input({ error, label, className = '', id, ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-espresso mb-2">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`
          w-full px-4 py-3 rounded-xl bg-warmgray-100 text-espresso text-sm
          border border-warmgray-300 outline-none
          placeholder:text-warmgray-400
          focus:ring-2 focus:ring-caramel focus:border-caramel
          transition-all duration-200
          ${error ? 'border-red-400' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  )
}
```

Textarea follows the same pattern with `<textarea>` and `resize-none`.

### Pattern 4: Hover States — Tailwind vs Inline Handlers

**What:** Replace all `onMouseEnter`/`onMouseLeave` that mutate `e.currentTarget.style` with Tailwind `hover:` variants.

**Scope of inline hover handlers in codebase:**
- `Navbar.tsx`: 5 link hover handlers (color swap)
- `explore/page.tsx`: card hover (shadow + transform), category pill hover (bg), search dropdown item hover (bg)
- `profile/page.tsx`: review card hover, places card hover, tab hover, link hover
- `new/page.tsx`: city suggestion item hover, submit button hover
- `auth/login/page.tsx`: submit button hover
- `auth/register/page.tsx`: submit button hover
- `place/[slug]/page.tsx`: submit button hover (via disabled state)

**Token-mapped hover classes (Navbar example):**
```
style={{ color: '#D4C5B5' }} + onMouseEnter → color: #FFF8F0
Becomes: className="text-warmgray-300 hover:text-cream transition-colors duration-200"
```

**Search dropdown item hover (explore):**
```
onMouseEnter/Leave swapping backgroundColor to #FFF8F0
Becomes: className="hover:bg-cream transition-colors"
```

### Anti-Patterns to Avoid

- **Mixing Tailwind classes and inline style for the same property:** If you add `className="text-caramel"`, remove `style={{ color: '#C08552' }}`. Having both means inline wins and the Tailwind class is invisible.
- **Using arbitrary values `text-[#C08552]`:** Don't do this — the whole point is tokens. Use `text-caramel`.
- **Making Card polymorphic with `as` prop for Link:** Next.js Link has its own className prop — just spread the card classes onto the Link element for interactive cards on explore/profile pages.
- **Removing gradient from StarRating:** The `linear-gradient` on the star clip path cannot be expressed as a Tailwind class. Keep that inline.
- **Forgetting `outline-none` on Input:** Without it the browser's default focus outline shows alongside the Tailwind ring.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Token-based color system | Custom CSS variables wiring | Tailwind v4 `@theme` | Already configured and working |
| Focus rings | `onFocus`/`onBlur` JS handlers | Tailwind `focus:ring-*` + CSS | Pure CSS, no JS runtime cost |
| Hover transitions | `onMouseEnter`/`onMouseLeave` JS handlers | Tailwind `hover:` variants | Declarative, no re-renders |
| Shadow + radius standardization | Per-component shadow values | Card component + shared Tailwind classes | Single source of truth |

**Key insight:** Every `onMouseEnter`/`onMouseLeave` pair that mutates style imperatively is a micro-performance issue (triggers React re-render) AND a maintainability problem. Tailwind hover variants are pure CSS and cost nothing at runtime.

---

## Common Pitfalls

### Pitfall 1: Tailwind v4 Class Generation Requires Usage in Source Files

**What goes wrong:** Tailwind v4 scans source files for class strings. If you dynamically construct class names like `text-${color}`, Tailwind won't detect them and won't emit the CSS.
**Why it happens:** JIT compilation scans for static string matches.
**How to avoid:** Always write full class names: `text-caramel`, not `text-${tokenName}`. For variant-based components (Card variants), use a lookup object mapping variant → full class string.
**Warning signs:** A color that was working before extraction suddenly disappears — it was only present as a concatenated string.

### Pitfall 2: `rgba()` Values Cannot Be Token-Replaced

**What goes wrong:** Attempting to replace `rgba(192,133,82,0.12)` (the semi-transparent category badge background) with a Tailwind class — there is no token for it.
**Why it happens:** The token defines the opaque color; opacity variants generate `bg-caramel/20` syntax but only in Tailwind v4 with opacity modifier support enabled.
**How to avoid:** Keep `style={{ backgroundColor: 'rgba(192,133,82,0.12)' }}` inline for semi-transparent uses. Tailwind v4 does support `bg-caramel/10` syntax but only if the color is defined with oklch or rgb notation, not hex in `@theme`. Since our tokens are hex, opacity modifiers may not work. Verify before using; if they don't work, leave rgba inline.
**Warning signs:** Badge backgrounds turn fully opaque or disappear.

### Pitfall 3: Card Component as Link Wrapping

**What goes wrong:** On the explore page, each place card is a `<Link>`. The Card component renders a `<div>`. Wrapping `<div>` inside `<Link>` is valid HTML, but `<Link>` inside `<Card>` means Card gets no href.
**Why it happens:** Attempting to make Card too generic.
**How to avoid:** For explore place cards and profile place cards, use `<Link href={...} className="group rounded-2xl ...">` with the card classes applied directly to Link, OR wrap Link with Card via `asChild`-style composition. The simplest approach: keep the Link and apply card classes as a `className` prop to Card, which passes through to the div, then wrap the div in the Link. Actually: `<Link href="..."><Card variant="interactive">...</Card></Link>` works fine — the link click propagates through the div.
**Warning signs:** Cards not navigating on click.

### Pitfall 4: Rating Pipeline — The `avg_rating` Calculation

**What goes wrong:** The `explore/page.tsx` computes `avg_rating` client-side from a related `reviews(rating)` join. If the DB stores ratings as 0–5 and the client multiplies by 2 (or any factor), the displayed value is wrong.
**What the code actually does:** In `explore/page.tsx` line 73:
```
Math.round(rs.reduce((s, r) => s + r.rating, 0) / rs.length * 2) / 2
```
This is `round(avg * 2) / 2` — it rounds to the nearest 0.5, NOT a ×2 multiplier. This is correct behavior for half-star display. Same formula appears in `place/[slug]/page.tsx` line 80. These are fine.
**What to check:** Any code path that inserts `rating * 2` or reads `rating / 2`. The `place/[slug]/page.tsx` insert at line 116–122 inserts `form.rating` directly (no multiplier) — this is correct.
**Column name check:** `place/[slug]/page.tsx` `Review` type defines `content: string | null` and the insert uses `content: form.content`. This is already correct. Search codebase for `.comment` references — none found in current active files.

### Pitfall 5: `globals.css` body Has Inline Hex

**What goes wrong:** `globals.css` `@layer base` has `body { background-color: #FFF8F0; color: #4B2E2B; }` and `::selection { background-color: #C08552; color: #FFF8F0; }`. These cannot use Tailwind utility classes because they are inside `@layer base` raw CSS.
**How to avoid:** These are intentionally raw CSS — do NOT try to convert them to Tailwind utilities. They are global base styles, not component styles. Leave them as-is.

---

## Code Examples

### Example 1: Removing Inline `onFocus`/`onBlur` with Shared Input Component
```typescript
// BEFORE (login/page.tsx pattern)
<input
  style={{ width: '100%', padding: '12px 16px', backgroundColor: '#F5EDE4',
    border: '1px solid #D4C5B5', borderRadius: 12, color: '#4B2E2B' }}
  onFocus={e => { e.target.style.borderColor = '#C08552'; e.target.style.boxShadow = '...' }}
  onBlur={e => { e.target.style.borderColor = '#D4C5B5'; e.target.style.boxShadow = 'none' }}
/>

// AFTER
<Input
  type="email"
  label="E-posta"
  placeholder="ornek@email.com"
  value={email}
  onChange={e => setEmail(e.target.value)}
  required
/>
```

### Example 2: Removing Card `onMouseEnter`/`onMouseLeave`
```typescript
// BEFORE (explore/page.tsx place card)
<Link
  className="group rounded-2xl overflow-hidden border transition-all duration-300"
  style={{ backgroundColor: '#ffffff', borderColor: '#E8DDD1', boxShadow: '...' }}
  onMouseEnter={e => { e.currentTarget.style.boxShadow = '...'; e.currentTarget.style.transform = 'translateY(-2px)' }}
  onMouseLeave={e => { ... }}
>

// AFTER — Link wraps Card, or Link gets card classes directly
<Link
  href={`/place/${place.slug}`}
  className="block rounded-2xl overflow-hidden border border-warmgray-200 bg-white
             shadow-sm hover:shadow-md hover:-translate-y-0.5
             transition-all duration-300"
>
```

### Example 3: Navbar Token Migration Sample
```typescript
// BEFORE
<nav style={{ backgroundColor: '#4B2E2B', borderBottomColor: 'rgba(192,133,82,0.2)' }}>
<Link style={{ color: '#FFF8F0' }}
  onMouseEnter={e => (e.currentTarget.style.color = '#C08552')}
  onMouseLeave={e => (e.currentTarget.style.color = '#FFF8F0')}>

// AFTER
<nav className="bg-espresso border-b border-caramel/20">
<Link className="text-cream hover:text-caramel transition-colors duration-200">
```

Note: `border-caramel/20` uses Tailwind opacity modifier. Verify this renders correctly with hex tokens in Tailwind v4. If it doesn't, keep `style={{ borderBottomColor: 'rgba(192,133,82,0.2)' }}`.

### Example 4: Confirming Rating Insert Pipeline (No Bug Found)
```typescript
// place/[slug]/page.tsx — handleSubmit (lines 116-122)
const { error } = await supabase.from('reviews').insert({
  place_id: place!.id,
  user_id: user.id,
  rating: form.rating,      // form.rating is 0–5 from StarRating — correct
  content: form.content || null,  // uses 'content' column — correct
  visit_date: form.visit_date || null,
})
// No multiplier. No .comment reference. Pipeline is clean.
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwind.config.ts` with `theme.extend.colors` | `@theme {}` block in CSS | Tailwind v4 (2024) | No config file needed; tokens auto-generate classes |
| `onMouseEnter`/`onMouseLeave` style mutations | `hover:` Tailwind variants | Best practice since Tailwind v2 | No JS event overhead; GPU-accelerated CSS transitions |
| Separate style objects (`const inputStyle`) | Shared UI components | React component era | Single source of truth, testable |

**Deprecated/outdated in this codebase:**
- `onMouseEnter`/`onMouseLeave` for color/shadow changes — replaced by Tailwind hover variants
- `onFocus`/`onBlur` for border/shadow focus rings — replaced by `focus:ring-*` Tailwind classes
- `const inputStyle: React.CSSProperties = { ... }` pattern — replaced by shared `<Input>` component
- Per-file `style={{ color: '#C08552' }}` hex literals — replaced by `text-caramel` etc.

---

## Open Questions

1. **Tailwind v4 opacity modifier with hex tokens**
   - What we know: Tailwind v4 supports `bg-caramel/20` syntax for opacity variants
   - What's unclear: Whether hex-defined `@theme` tokens support the opacity modifier — Tailwind v4 converts hex to oklch internally, which should support it, but needs verification at runtime
   - Recommendation: Test `border-caramel/20` in the Navbar during implementation. If it renders wrong, keep the two rgba inline values (Navbar border and category badge bg) as inline style.

2. **Category gradient map in `explore/page.tsx`**
   - What we know: `CAT_GRADIENT` and `DEFAULT_GRADIENT` contain 8 hardcoded `linear-gradient` strings with non-token hex values
   - What's unclear: Whether these should be migrated (they are visual brand colors but not expressible as Tailwind)
   - Recommendation: Leave the gradient map values as-is (they must be inline gradients by definition); this is consistent with the StarRating exception in CONTEXT.md. These are not covered by any PLSH requirement.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected in project source |
| Config file | None — Wave 0 must create |
| Quick run command | `npx jest --testPathPattern=src` (after Wave 0 setup) |
| Full suite command | `npx jest` (after Wave 0 setup) |

**Note:** No test files exist in the project source (only node_modules contain tests). This is a pure frontend refactoring phase — the practical validation is visual + TypeScript compilation + build success. Component unit tests are the appropriate coverage for the extracted components.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PLSH-01 | No inline hex values remain in non-gradient contexts | Static analysis / grep | `grep -r "style={{" src/ --include="*.tsx" \| grep -v "gradient\|backgroundImage\|transform\|boxShadow.*rgba"` | ❌ Wave 0 script |
| PLSH-02 | `reviews` insert uses `content` column; no `.comment` reference; rating 1–5 stored and retrieved unchanged | Unit test (rating pipeline) + grep | `npx jest src/components/ui/` after Wave 0 | ❌ Wave 0 |
| PLSH-02 | No `.comment` column reference in any query | Static analysis | `grep -r "\.comment" src/ --include="*.tsx"` | Runnable now |
| PLSH-03 | Card/Input/Textarea render with correct visual classes | Component unit tests | `npx jest src/components/ui/ -x` | ❌ Wave 0 |
| PLSH-03 | No `onMouseEnter`/`onMouseLeave` style mutations remain | Static analysis | `grep -r "onMouseEnter\|onMouseLeave" src/ --include="*.tsx"` | Runnable now |

### Sampling Rate
- **Per task commit:** `npx tsc --noEmit` (TypeScript check — confirms no broken imports after refactor)
- **Per wave merge:** `npm run build` (full Next.js build — catches all compilation errors)
- **Phase gate:** `npm run build` green + manual visual review in browser before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/components/ui/__tests__/Card.test.tsx` — covers PLSH-03 Card variant rendering
- [ ] `src/components/ui/__tests__/Input.test.tsx` — covers PLSH-03 Input focus/error state
- [ ] `src/components/ui/__tests__/Textarea.test.tsx` — covers PLSH-03 Textarea rendering
- [ ] Test framework: `npm install --save-dev jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom ts-jest` if component unit tests are required
- [ ] Alternative: skip Jest entirely for this phase and rely on `npx tsc --noEmit` + `npm run build` as the validation gate — acceptable for a pure visual/refactor phase

**Practical note:** Given this is a pure visual refactoring phase with no logic changes (except the `.comment` → `.content` verification), the most effective validation is: TypeScript compilation clean + Next.js build succeeds + browser visual review. Full Jest setup is a disproportionate investment for Phase 0's scope. Recommend the planner structure Wave 0 as a grep-and-build verification rather than Jest test authoring.

---

## Complete Hex Audit by File

This section gives the planner a precise checklist of what needs changing in each file.

### `src/components/Navbar.tsx`
Inline hex/style occurrences: 12
- `style={{ backgroundColor: '#4B2E2B', borderBottomColor: 'rgba(...)' }}` on `<nav>` → `className="bg-espresso"` + keep rgba border inline or use `border-caramel/20`
- `style={{ color: '#FFF8F0' }}` on logo Link + `onMouseEnter/Leave` → `className="text-cream hover:text-caramel transition-colors duration-200"`
- `style={{ color: '#D4C5B5' }}` on nav links + `onMouseEnter/Leave` → `className="text-warmgray-300 hover:text-cream transition-colors duration-200"`
- `style={{ backgroundColor: '#5C3A36' }}` on loading skeleton → `className="bg-espresso-light"`
- `style={{ backgroundColor: '#C08552', color: '#FFF8F0' }}` on CTA buttons + `onMouseEnter/Leave` → `className="bg-caramel text-cream hover:bg-caramel-dark transition-all duration-200"`
- `style={{ color: '#9C8E7E' }}` on sign-out button → `className="text-warmgray-500 hover:text-warmgray-300 transition-colors duration-200"`

### `src/app/page.tsx` (home)
Inline hex occurrences: 6
- Hero gradient `background: 'linear-gradient(...)'` → keep inline (gradient)
- `style={{ color: '#C08552' }}` → `text-caramel`
- `style={{ color: '#4B2E2B' }}` → `text-espresso`
- `style={{ color: '#8C5A3C' }}` → `text-coffee`
- `style={{ backgroundColor: '#C08552', color: '#FFF8F0' }}` → `bg-caramel text-cream`
- `style={{ borderColor: '#4B2E2B', color: '#4B2E2B', backgroundColor: 'transparent' }}` on "Mekan Ekle" button → `border-espresso text-espresso bg-transparent hover:text-cream`
- `style={{ backgroundColor: '#F5EDE4' }}` on "how it works" cards → `bg-warmgray-100`

### `src/app/auth/login/page.tsx`
Inline hex occurrences: ~8 + `const inputStyle` object + `onFocus`/`onBlur`
- Replace with `<Input>` component: eliminates `inputStyle` constant and `onFocus`/`onBlur` handlers
- Auth card `style={{ backgroundColor: '#ffffff', borderColor: '#E8DDD1', boxShadow: '...' }}` → use `<Card>` component or direct classes `bg-white border-warmgray-200 shadow-sm`
- Page wrapper `style={{ backgroundColor: '#FFF8F0' }}` → `bg-cream`
- Logo `style={{ color: '#C08552' }}` → `text-caramel`
- Submit button inline styles → `bg-caramel text-cream hover:bg-caramel-dark disabled:bg-warmgray-300`

### `src/app/auth/register/page.tsx`
Same pattern as login. `const inputStyle` + `const focusStyle` objects → `<Input>` component.

### `src/app/explore/page.tsx`
Most complex file. Inline hex occurrences: ~25+
- Place cards: `onMouseEnter/Leave` hover handlers → Tailwind hover classes on `<Link>` or `<Card>`
- Search input: `onFocusCapture`/`onBlurCapture` style mutations → `<Input>` component (with no label, just className override for width)
- Category filter pills: `onMouseEnter/Leave` → `hover:bg-warmgray-200` (inactive state)
- Spinner: `style={{ borderColor: '#C08552', borderTopColor: 'transparent' }}` → `border-caramel border-t-transparent`
- Text colors: migrate all hex → token classes
- `CAT_GRADIENT` map values: leave as-is (gradients)

### `src/app/place/[slug]/page.tsx`
Inline hex occurrences: ~15
- Place info card → `<Card variant="default">`
- Review form card → `<Card variant="default">`
- Review form fields: `const inputStyle` + `onFocus`/`onBlur` → `<Input>` and `<Textarea>`
- Review list items: `style={{ backgroundColor: '#F5EDE4' }}` → `bg-warmgray-100`
- Text colors throughout → token classes
- Spinner → `border-caramel border-t-transparent`

### `src/app/new/page.tsx`
Inline hex occurrences: ~15
- Form card wrapper → `<Card variant="default">`
- All form fields: `const fieldStyle` + `onFocus`/`onBlur` → `<Input>` + `<Textarea>` (select may need its own className since `<Input>` wraps `<input>`)
- City autocomplete dropdown: style object → Tailwind classes
- City suggestion items: `onMouseEnter/Leave` → `hover:bg-warmgray-100`
- Submit button → `bg-caramel text-cream hover:bg-caramel-dark`

### `src/app/profile/page.tsx`
Inline hex occurrences: ~20
- Profile card → `<Card variant="default">`
- Rating distribution card → `<Card variant="flat">`
- Review list cards → `<Card variant="interactive">` (has hover)
- Places grid cards → use `<Link>` with card classes (these are links)
- Tab buttons: `onMouseEnter/Leave` + inline style → Tailwind
- Inline bar chart progress (`width: pct%`) must stay inline (dynamic value)

### `src/components/StarRating.tsx`
- `style={{ color: '#8C5A3C', fontWeight: 600 }}` on rating display span → `text-coffee font-semibold` (add `className` alongside existing `style`)
- `backgroundImage: linear-gradient(...)` → keep inline (gradient, explicitly excepted)
- `display: 'flex'`, `alignItems: 'center'`, `gap: 3` on wrapper → replace style with `className="flex items-center gap-0.5"` and remove `style` from the wrapper div

---

## Sources

### Primary (HIGH confidence)
- Direct source code read — all 9 component/page files examined line by line
- `globals.css` `@theme` block — authoritative token-to-class mapping
- `package.json` — confirmed Tailwind v4, Next.js 16, React 19

### Secondary (MEDIUM confidence)
- Tailwind v4 `@theme` documentation behavior (class auto-generation from CSS custom properties) — consistent with observed project setup
- Tailwind v4 opacity modifier behavior with hex tokens — needs runtime verification (flagged as Open Question)

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Token mapping: HIGH — derived directly from `globals.css` source
- Rating pipeline audit: HIGH — read all relevant code paths; no bug in active code
- Component design patterns: HIGH — locked in CONTEXT.md with clear specifications
- Tailwind v4 opacity modifier support: MEDIUM — needs runtime verification
- Test infrastructure: HIGH — confirmed no tests exist; build + tsc recommended as gate

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (stable stack — Tailwind v4, Next.js 16, no fast-moving dependencies)
