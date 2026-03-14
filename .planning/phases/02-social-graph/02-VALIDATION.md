---
phase: 2
slug: social-graph
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30 + ts-jest + jest-environment-jsdom (already installed) |
| **Config file** | `jest.config.ts` (exists at project root) |
| **Quick run command** | `npx jest --testPathPattern=follows\|feed --passWithNoTests` |
| **Full suite command** | `npx jest --passWithNoTests` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern=<service-file> --passWithNoTests`
- **After every plan wave:** Run `npx jest --passWithNoTests`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 2-01-01 | 01 | 0 | SOCL-01 | unit | `npx jest src/lib/services/follows.test.ts -x` | ❌ W0 | ⬜ pending |
| 2-01-02 | 01 | 0 | SOCL-01 | unit | `npx jest src/lib/services/follows.test.ts -x` | ❌ W0 | ⬜ pending |
| 2-01-03 | 01 | 0 | SOCL-01 | unit | `npx jest src/lib/services/follows.test.ts -x` | ❌ W0 | ⬜ pending |
| 2-01-04 | 01 | 0 | SOCL-02 | unit | `npx jest src/lib/services/follows.test.ts -x` | ❌ W0 | ⬜ pending |
| 2-01-05 | 01 | 0 | SOCL-02 | unit | `npx jest src/lib/services/follows.test.ts -x` | ❌ W0 | ⬜ pending |
| 2-02-01 | 02 | 0 | SOCL-03 | unit | `npx jest src/lib/services/feed.test.ts -x` | ❌ W0 | ⬜ pending |
| 2-02-02 | 02 | 0 | SOCL-03 | unit | `npx jest src/lib/services/feed.test.ts -x` | ❌ W0 | ⬜ pending |
| 2-02-03 | 02 | 0 | SOCL-03 | unit | `npx jest src/lib/services/feed.test.ts -x` | ❌ W0 | ⬜ pending |
| 2-03-01 | 03 | 0 | SOCL-04 | unit | `npx jest src/lib/services/profiles.test.ts -x` | ❌ W0 | ⬜ pending |
| 2-03-02 | 03 | 0 | SOCL-04 | unit | `npx jest src/lib/services/profiles.test.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/services/follows.test.ts` — stubs for SOCL-01 (followUser, unfollowUser, isFollowing), SOCL-02 (getFollowerCount, getFollowers)
- [ ] `src/lib/services/feed.test.ts` — stubs for SOCL-03 (empty feed, merged feed, cursor pagination)
- [ ] `src/lib/services/profiles.test.ts` — extend existing file with SOCL-04 cases (getProfileByUsername valid + invalid)

*Jest 30 + ts-jest already installed — no framework install needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Follow button optimistic update reverts on network failure | SOCL-01 | Requires network failure simulation in browser | Open profile, throttle network to offline, click follow, verify UI reverts |
| Infinite scroll loads more feed items | SOCL-03 | Requires real scroll interaction | Scroll to bottom of feed with 20+ items, verify next page loads |
| Landing page shown to logged-out users at `/` | SOCL-03 | Route conditional on auth state | Log out, visit `/`, verify marketing page not feed |
| Follower/following modal opens on count click | SOCL-02 | UI interaction | Click follower count, verify modal opens with list |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
