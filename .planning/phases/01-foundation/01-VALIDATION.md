---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest + Testing Library (none detected — Wave 0 installs) |
| **Config file** | `jest.config.ts` — Wave 0 creates |
| **Quick run command** | `npx jest --passWithNoTests --testPathPattern=<file>` |
| **Full suite command** | `npx jest --passWithNoTests` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --passWithNoTests --testPathPattern=<relevant-file>`
- **After every plan wave:** Run `npx jest --passWithNoTests`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-W0-01 | W0 | 0 | INFRA-01 | setup | `npx jest --passWithNoTests` | ❌ W0 | ⬜ pending |
| 1-W0-02 | W0 | 0 | INFRA-01 | unit stub | `npx jest src/lib/services/places.test.ts -x` | ❌ W0 | ⬜ pending |
| 1-W0-03 | W0 | 0 | INFRA-01 | unit stub | `npx jest src/lib/services/reviews.test.ts -x` | ❌ W0 | ⬜ pending |
| 1-W0-04 | W0 | 0 | INFRA-02 | integration stub | `npx jest src/middleware.test.ts -x` | ❌ W0 | ⬜ pending |
| 1-W0-05 | W0 | 0 | INFRA-03 | unit stub | `npx jest src/app/auth/login/page.test.tsx -x` | ❌ W0 | ⬜ pending |
| 1-01-01 | 01 | 1 | INFRA-01 | unit | `npx jest src/lib/services/places.test.ts -x` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | INFRA-01 | unit | `npx jest src/lib/services/reviews.test.ts -x` | ❌ W0 | ⬜ pending |
| 1-01-03 | 01 | 1 | INFRA-01 | lint | `grep -r "supabase.from" src/app/ \| wc -l` (expect 0) | N/A | ⬜ pending |
| 1-02-01 | 02 | 1 | INFRA-02 | integration | `npx jest src/middleware.test.ts -x` | ❌ W0 | ⬜ pending |
| 1-03-01 | 03 | 2 | INFRA-03 | unit | `npx jest src/app/auth/login/page.test.tsx -x` | ❌ W0 | ⬜ pending |
| 1-03-02 | 03 | 2 | INFRA-03 | unit | `npx jest src/app/new/page.test.tsx -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `jest.config.ts` — Jest config with Next.js transformer (jest-environment-jsdom, @testing-library/react)
- [ ] `src/lib/services/places.test.ts` — stubs for INFRA-01
- [ ] `src/lib/services/reviews.test.ts` — stubs for INFRA-01
- [ ] `src/middleware.test.ts` — stubs for INFRA-02 (mock createServerClient)
- [ ] `src/app/auth/login/page.test.tsx` — stubs for INFRA-03
- [ ] Framework install: `npm install --save-dev jest @testing-library/react @testing-library/user-event jest-environment-jsdom ts-jest @types/jest`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| No page component calls `supabase.from()` directly | INFRA-01 | Static analysis check, not a runtime test | Run `grep -r "supabase.from" src/app/` — must return 0 results |
| `/place/[slug]` shows "Login to write a review" prompt for unauthenticated users | INFRA-02 | Requires browser rendering of conditional UI | Visit a place page while logged out; confirm review form is hidden and prompt is shown |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
