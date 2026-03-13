# Codebase Concerns

> Focus: tech debt, bugs, security, performance, fragile areas

## Tech Debt

### Inline Styles Everywhere
- All components use extensive inline styles instead of Tailwind utility classes or CSS modules
- Makes global theming changes difficult and violates separation of concerns
- Files affected: all component files under `src/`

### No Input Validation Schema
- No Zod or similar schema validation for form inputs
- User-submitted data (place names, reviews, etc.) passed directly without sanitization

### Missing Error Boundaries
- No React error boundaries wrapping page sections
- Unhandled errors will crash the entire page

### Untyped Supabase Queries
- Database queries lack generated TypeScript types from Supabase schema
- No type safety between DB schema and application layer

### Tight State-Component Coupling
- Business logic and state management embedded directly in page components
- No separation into hooks or service layer

---

## Security Issues

### Client-Side-Only Auth
- Authentication state managed only on client side
- Server-side route protection not implemented

### Exposed Supabase Keys
- Supabase anon key exposed in client bundle (mitigated by RLS policies, but RLS completeness is unverified)

### No CSRF Protection
- No CSRF tokens on state-changing requests

### Potential XSS
- User-generated content (reviews, place descriptions) rendered without explicit sanitization

### No Rate Limiting
- No rate limiting on Supabase calls or form submissions

---

## Performance

### No Pagination
- All places and reviews loaded at once — will degrade as data grows

### All Data Loaded Client-Side
- No server-side data fetching (no use of Next.js Server Components or `getServerSideProps`)

### Inefficient Filtering
- Client-side filtering over full datasets instead of DB-level queries

### Emoji Placeholders Instead of Images
- No real image upload or CDN integration — emoji used as stand-ins

---

## Missing Features (Gaps vs. Expected)

- Profile editing
- Review/place deletion
- Image uploads
- Moderation tools
- Favorites/bookmarking

---

## Fragile Areas

| Area | Risk | Notes |
|------|------|-------|
| Star rating component | Medium | Custom implementation, edge cases likely |
| Place detail page async logic | High | Async data loading with no loading/error states |
| Auth context initialization | High | Race condition risk on first render |
| Slug generation | Medium | No uniqueness enforcement |

---

## Test Coverage

**Critical gap: 0% test coverage.**

- No unit tests
- No integration tests
- No E2E tests
- Target: 80%+ coverage per project standards
