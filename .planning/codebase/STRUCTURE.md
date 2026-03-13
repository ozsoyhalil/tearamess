# Structure

> Focus: directory layout, key locations, naming conventions

## Directory Layout

```
tearamess/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── layout.tsx            # Root layout (AuthProvider, font)
│   │   ├── page.tsx              # Home/landing page
│   │   ├── globals.css           # Global CSS (Tailwind base)
│   │   ├── favicon.ico
│   │   ├── auth/
│   │   │   ├── login/page.tsx    # Login form
│   │   │   └── register/page.tsx # Registration form
│   │   ├── explore/
│   │   │   └── page.tsx          # Browse places with filters
│   │   ├── new/
│   │   │   └── page.tsx          # Add new place form
│   │   ├── place/
│   │   │   └── [slug]/page.tsx   # Dynamic place detail + reviews
│   │   └── profile/
│   │       └── page.tsx          # User profile
│   ├── components/               # Shared UI components
│   │   ├── Navbar.tsx            # Navigation bar
│   │   └── StarRating.tsx        # Star rating input (0–5, half-star)
│   ├── context/                  # React contexts
│   │   └── AuthContext.tsx       # Auth state provider + useAuth hook
│   └── lib/                      # Utilities / external clients
│       └── supabase.ts           # Supabase client singleton
├── public/                       # Static assets
├── .env.local                    # Environment variables (gitignored)
├── next.config.ts                # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
├── tailwind.config (via postcss) # Tailwind v4 via @tailwindcss/postcss
├── eslint.config.mjs             # ESLint flat config
├── package.json
└── .planning/                    # GSD planning artifacts (this dir)
```

---

## Key File Locations

| What | Where |
|------|-------|
| Supabase client | `src/lib/supabase.ts` |
| Auth state | `src/context/AuthContext.tsx` |
| Global styles | `src/app/globals.css` |
| Route entry points | `src/app/**/page.tsx` |
| Shared components | `src/components/*.tsx` |
| Environment config | `.env.local` |

---

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| React components | PascalCase | `Navbar.tsx`, `StarRating.tsx` |
| Pages | `page.tsx` (Next.js convention) | `src/app/explore/page.tsx` |
| Context files | PascalCase + `Context` suffix | `AuthContext.tsx` |
| Lib/utility files | camelCase | `supabase.ts` |
| Dynamic segments | `[param]` bracket notation | `place/[slug]/page.tsx` |
| CSS classes | Tailwind utilities + inline styles | mixed |

---

## Path Aliases

Configured in `tsconfig.json`:

```json
{
  "paths": {
    "@/*": ["./src/*"]
  }
}
```

Used throughout: `import { useAuth } from '@/context/AuthContext'`
