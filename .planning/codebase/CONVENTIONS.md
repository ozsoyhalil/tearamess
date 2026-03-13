# Conventions

> Focus: code style, naming, patterns, error handling

## TypeScript

- **Strict mode** enabled in `tsconfig.json`
- Inline `type` / `interface` definitions per file (no shared types file yet)
- Props typed inline: `function Navbar({ user }: { user: User | null })`
- Supabase `User` type imported from `@supabase/supabase-js`

---

## Component Patterns

### Client Components
All interactive components use the `'use client'` directive at the top:

```tsx
'use client'

import { useState, useEffect } from 'react'
```

### Default Exports
All page and component files use default exports:

```tsx
export default function Navbar() { ... }
```

### Named Exports for Context/Hooks
Contexts export both provider and hook as named exports:

```tsx
export function AuthProvider(...) { ... }
export const useAuth = () => useContext(AuthContext)
```

---

## Styling

Mixed approach — Tailwind utility classes for layout/spacing, inline `React.CSSProperties` for brand colors:

```tsx
<div
  className="rounded-2xl p-8 text-center transition-all duration-300 hover:shadow-lg"
  style={{ backgroundColor: '#F5EDE4' }}
>
```

**Brand color palette (tiramisu theme):**

| Token | Hex | Usage |
|-------|-----|-------|
| Dark brown | `#4B2E2B` | Primary text, headings |
| Caramel | `#C08552` | Accent, CTAs, links |
| Light caramel | `#8C5A3C` | Secondary text |
| Cream | `#F5EDE4` | Card backgrounds |
| Off-white | `#FFF8F0` | Page background |

---

## Import Order

1. React / Next.js (framework)
2. External packages
3. Internal imports via `@/` alias

```tsx
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
```

---

## State Management

- React hooks only: `useState`, `useEffect`, `useContext`
- No external state library (no Zustand, Redux, etc.)
- Global state: React Context (`AuthContext`)
- Local state: `useState` per component

---

## Error Handling

Supabase errors are destructured and displayed via state:

```tsx
const { data, error } = await supabase.from('places').select('*')
if (error) {
  setError(error.message)
  return
}
```

No global error boundary. Errors shown as inline text in UI.

---

## Data Fetching Pattern

All data fetching happens in `useEffect` on page components:

```tsx
useEffect(() => {
  const fetchData = async () => {
    const { data, error } = await supabase.from('places').select('*')
    if (error) { setError(error.message); return }
    setPlaces(data)
  }
  fetchData()
}, [])
```

---

## Routing / Navigation

- `useRouter` from `next/navigation` for programmatic navigation
- Auth guards: check `user` in `useEffect`, redirect to `/auth/login` if null
- Links: `<Link href="...">` for declarative navigation
