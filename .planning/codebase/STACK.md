# Technology Stack

**Analysis Date:** 2026-03-13

## Languages

**Primary:**
- TypeScript 5+ - All source code in `src/` directory
- TSX - React components with TypeScript

**Secondary:**
- CSS - Tailwind CSS utility classes
- JavaScript - Runtime and Node.js tooling

## Runtime

**Environment:**
- Node.js (version specified via `.nvmrc` or implicit from Next.js requirements)

**Package Manager:**
- npm - Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Next.js 16.1.6 - Full-stack React framework with App Router
- React 19.2.3 - UI library (client-side)
- React DOM 19.2.3 - React rendering target

**Styling:**
- Tailwind CSS 4 - Utility-first CSS framework
- @tailwindcss/postcss 4 - Tailwind PostCSS plugin

**Build/Dev:**
- TypeScript 5+ - Language and type checking
- ESLint 9 - Code linting
- eslint-config-next 16.1.6 - Next.js ESLint configuration

## Key Dependencies

**Critical:**
- @supabase/supabase-js 2.99.1 - Supabase JavaScript client for auth and database operations
  - Used throughout app: auth management, database queries, real-time subscriptions
  - Client location: `src/lib/supabase.ts`

**Infrastructure:**
- next - Handles server-side rendering, API routes (if added), file-based routing
- react, react-dom - Component rendering and DOM manipulation

## Configuration

**Environment:**
- `.env.local` file present - Contains environment variables
- Required env vars (from `src/lib/supabase.ts`):
  - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (public)
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (public)
  - Note: Missing either var will log error but not prevent app load

**Build:**
- `next.config.ts` - Next.js configuration (minimal, no special config detected)
- `tsconfig.json` - TypeScript compiler options
  - Path alias: `@/*` maps to `./src/*`
  - Target: ES2017
  - Module resolution: bundler (Next.js 13+)
  - Strict mode enabled

## Platform Requirements

**Development:**
- Node.js with npm
- TypeScript 5+
- Next.js 16.1.6 compatible system

**Production:**
- Node.js runtime (Next.js server)
- Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Deployment: Vercel (recommended for Next.js) or any Node.js-compatible platform

---

*Stack analysis: 2026-03-13*
