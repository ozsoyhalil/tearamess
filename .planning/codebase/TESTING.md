# Testing

> Focus: framework, structure, mocking, coverage

## Current State

**Zero test infrastructure. Zero test files.**

| Metric | Status |
|--------|--------|
| Test framework | Not installed |
| Test files | 0 |
| Coverage | 0% |
| CI/CD checks | None |

---

## What's Missing

### Framework
No test runner installed. `package.json` has no Jest, Vitest, or similar in `devDependencies`.

### Configuration
No test config files:
- No `jest.config.js` / `jest.config.ts`
- No `vitest.config.ts`
- No `playwright.config.ts`

### Test Files
No `.test.ts`, `.test.tsx`, `.spec.ts`, or `.spec.tsx` files anywhere in `src/`.

---

## Recommended Setup

Given the Next.js + TypeScript stack, the recommended testing stack is:

**Unit / Integration:**
- **Vitest** — fast, Vite-compatible, works with Next.js
- **React Testing Library** — component testing
- **MSW (Mock Service Worker)** — mock Supabase API calls

**E2E:**
- **Playwright** — browser automation for critical flows

---

## Critical Flows to Test (Priority Order)

1. **Auth flow** — register, login, logout, session persistence
2. **Add place** — form validation, Supabase insert, redirect
3. **Place detail** — data loading, review submission
4. **Star rating** — half-star increments, min/max bounds
5. **Explore/filter** — category filtering, empty states
6. **Auth guard** — unauthenticated redirect on protected pages

---

## Coverage Target

Per project standards: **80% minimum** across unit, integration, and E2E tests.

Current gap: **80% below target.**
