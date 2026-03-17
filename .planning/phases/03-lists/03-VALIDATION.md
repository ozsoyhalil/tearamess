---
phase: 3
slug: lists
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-17
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.3.0 with @jest-environment node |
| **Config file** | jest.config.ts (project root) |
| **Quick run command** | `npx jest src/lib/services/lists.test.ts --no-coverage` |
| **Full suite command** | `npx jest --no-coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest src/lib/services/lists.test.ts --no-coverage`
- **After every plan wave:** Run `npx jest --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 0 | LIST-01, LIST-02, LIST-03, LIST-04 | unit | `npx jest src/lib/services/lists.test.ts --no-coverage` | ❌ W0 | ⬜ pending |
| 3-01-02 | 01 | 1 | LIST-01 | unit | `npx jest src/lib/services/lists.test.ts -t "wishlist" --no-coverage` | ❌ W0 | ⬜ pending |
| 3-01-03 | 01 | 1 | LIST-01 | unit | `npx jest src/lib/services/lists.test.ts -t "isPlaceInWishlist" --no-coverage` | ❌ W0 | ⬜ pending |
| 3-02-01 | 02 | 1 | LIST-02 | unit | `npx jest src/lib/services/lists.test.ts -t "createList" --no-coverage` | ❌ W0 | ⬜ pending |
| 3-02-02 | 02 | 1 | LIST-02 | unit | `npx jest src/lib/services/lists.test.ts -t "deleteList" --no-coverage` | ❌ W0 | ⬜ pending |
| 3-03-01 | 03 | 1 | LIST-03 | unit | `npx jest src/lib/services/lists.test.ts -t "addPlaceToList" --no-coverage` | ❌ W0 | ⬜ pending |
| 3-03-02 | 03 | 1 | LIST-03 | unit | `npx jest src/lib/services/lists.test.ts -t "removePlaceFromList" --no-coverage` | ❌ W0 | ⬜ pending |
| 3-04-01 | 04 | 2 | LIST-04 | unit | `npx jest src/lib/services/lists.test.ts -t "getUserLists" --no-coverage` | ❌ W0 | ⬜ pending |
| 3-04-02 | 04 | 2 | LIST-04 | unit | `npx jest src/lib/services/lists.test.ts -t "updateListPrivacy" --no-coverage` | ❌ W0 | ⬜ pending |
| 3-04-03 | 04 | 2 | LIST-04 | manual | Manual browser test — RLS policy enforcement | manual only | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/services/lists.test.ts` — stubs covering LIST-01, LIST-02, LIST-03, LIST-04 (service layer)
- [ ] `src/types/list.ts` — `List` and `ListItem` type definitions

*Existing jest infrastructure covers all phase requirements — no framework install needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Private list detail page returns 404 for non-owner | LIST-04 | RLS policy enforcement cannot be unit-tested with mocked Supabase — requires real DB query | 1. Create private list as User A. 2. Log in as User B (or logged out). 3. Navigate to /lists/[id]. 4. Verify 404 response. |
| "Gideceğim Yerler" pinned first on profile Lists tab | LIST-01 | Visual ordering requires browser verification | 1. Log in as any user. 2. Create custom lists. 3. Go to profile Lists tab. 4. Verify wishlist appears first. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
