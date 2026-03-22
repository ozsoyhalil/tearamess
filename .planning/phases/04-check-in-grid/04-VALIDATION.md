---
phase: 4
slug: check-in-grid
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30 + ts-jest 29 |
| **Config file** | `jest.config.ts` |
| **Quick run command** | `npx jest src/lib/services/checkIns.test.ts src/lib/grid.test.ts --no-coverage` |
| **Full suite command** | `npx jest --no-coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest src/lib/services/checkIns.test.ts src/lib/grid.test.ts --no-coverage`
- **After every plan wave:** Run `npx jest --no-coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 4-01-01 | 01 | 0 | XPLR-01 | unit | `npx jest src/lib/services/checkIns.test.ts -x` | ❌ W0 | ⬜ pending |
| 4-01-02 | 01 | 0 | XPLR-02 | unit | `npx jest src/lib/grid.test.ts -x` | ❌ W0 | ⬜ pending |
| 4-02-01 | 02 | 1 | XPLR-01 | unit | `npx jest src/lib/services/checkIns.test.ts -x` | ❌ W0 | ⬜ pending |
| 4-02-02 | 02 | 1 | XPLR-01 | unit | `npx jest src/lib/services/checkIns.test.ts -x` | ❌ W0 | ⬜ pending |
| 4-03-01 | 03 | 1 | XPLR-02 | unit | `npx jest src/lib/grid.test.ts -x` | ❌ W0 | ⬜ pending |
| 4-03-02 | 03 | 1 | XPLR-02 | unit | `npx jest src/lib/grid.test.ts -x` | ❌ W0 | ⬜ pending |
| 4-04-01 | 04 | 2 | XPLR-02 | manual | Visual inspection of grid page | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/services/checkIns.test.ts` — stubs for XPLR-01 (checkIn service, non-idempotent insert, error handling)
- [ ] `src/lib/grid.test.ts` — stubs for XPLR-02 (latLngToCellKey, cellKeyToBounds, isInAnkaraBounds, buildCellCounts, getUserVisitsWithCoords)

*Framework (Jest + ts-jest) already installed — no new framework setup needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Grid cells render correctly as semi-transparent colored overlays on Leaflet base map | XPLR-02 | Visual rendering correctness cannot be asserted via unit tests | Open /grid page while logged in with visits; confirm cells are colored, grid lines visible, map tiles load |
| Check-in button in place hero updates to "✓ Check edildi" after click | XPLR-01 | UI state transition and toast notification require browser interaction | Open a place detail page; click "Check In"; verify toast appears and button updates |
| Unauthenticated user clicking check-in redirects to /auth/login | XPLR-01 | Auth redirect requires Next.js middleware + browser session | Open place detail page while logged out; click check-in button; verify redirect to /auth/login |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
