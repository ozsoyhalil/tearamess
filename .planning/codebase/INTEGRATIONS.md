# External Integrations

**Analysis Date:** 2026-03-13

## APIs & External Services

**Authentication & Database:**
- Supabase - Complete backend platform providing auth, database, and real-time features
  - SDK/Client: @supabase/supabase-js 2.99.1
  - Auth methods: Email/password signup and signin
  - Database: PostgreSQL via Supabase
  - Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Data Storage

**Databases:**
- Supabase PostgreSQL Database
  - Connection: Supabase client (`src/lib/supabase.ts`)
  - Client: @supabase/supabase-js
  - Tables detected in codebase:
    - `places` - Main place/venue data
      - Fields: id, name, slug, category, city, neighborhood, description, created_by, created_at
      - Relations: One-to-many with reviews
    - `reviews` - User reviews for places
      - Fields: id, place_id, rating, and implicit user connection
      - Relations: One-to-many with places

**File Storage:**
- Local filesystem only - No external file storage detected
- No file upload endpoints or image handling in current codebase

**Caching:**
- None - No caching layer (Redis, Memcached) detected
- App relies on Supabase client-side caching and browser cache

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (built-in)
  - Implementation: Email/password authentication
  - Signup endpoint: `supabase.auth.signUp()` with user metadata (username, display_name)
  - Login endpoint: `supabase.auth.signInWithPassword()`
  - Session management: `supabase.auth.getSession()`, `onAuthStateChange()` listener
  - Auth context: `src/context/AuthContext.tsx` - Global auth state using React Context
  - User type: Supabase User from @supabase/supabase-js

## Monitoring & Observability

**Error Tracking:**
- None - No error tracking service (Sentry, etc.) detected
- Errors handled locally in UI with user-facing messages

**Logs:**
- Console logging only
  - `src/lib/supabase.ts` logs Supabase configuration validation errors
  - No structured logging or log aggregation service

## CI/CD & Deployment

**Hosting:**
- Not explicitly configured, but Next.js best practices suggest:
  - Recommended: Vercel (official Next.js hosting)
  - Alternative: Any Node.js runtime (AWS, Heroku, Railway, etc.)

**CI Pipeline:**
- None detected - No GitHub Actions, GitLab CI, or other CI config found

## Environment Configuration

**Required env vars:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (must be public for browser client)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (must be public for browser client)
- Note: These are "NEXT_PUBLIC_" prefixed, making them available to browser - acceptable for public API keys

**Secrets location:**
- `.env.local` file (local development only)
- Production: Environment variables set in deployment platform (Vercel, etc.)
- Note: `.env*` files should not be committed to git

## Webhooks & Callbacks

**Incoming:**
- None detected - No webhook endpoints or API routes implemented

**Outgoing:**
- None detected - No third-party webhook integrations found

## Data Flow Integration Points

**User Registration & Authentication:**
1. User submits email/password/username via `src/app/auth/register/page.tsx`
2. `supabase.auth.signUp()` creates auth record and user metadata
3. Supabase creates user record (implicit)
4. User redirected to home

**Place Management:**
1. Authenticated user submits place form via `src/app/new/page.tsx`
2. Slug generated client-side from place name
3. `supabase.from('places').insert()` writes to places table with `created_by` = user.id
4. Redirect to place detail page

**Place Exploration & Search:**
1. `src/app/explore/page.tsx` fetches places with related reviews
2. `supabase.from('places').select('...').order()` retrieves all places
3. Supabase joins with reviews table for ratings
4. Search: `supabase.from('places').ilike('name', '%query%')` for autocomplete
5. Client-side filtering by category and city

**Place Details & Reviews:**
1. Detail view fetches place and reviews from `supabase.from('places')`
2. Reviews are nested relations accessible via place data

---

*Integration audit: 2026-03-13*
