---
phase: 0
slug: polish-bugfix
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 0 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None (build + tsc gate; Jest optional for extracted components) |
| **Config file** | None — Wave 0 may install if component tests desired |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npm run build` |
| **Estimated runtime** | ~15 seconds (tsc) / ~30 seconds (build) |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npm run build`
- **Before `/gsd:verify-work`:** Full build must be green + browser visual review
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 0-01-01 | 01 | 1 | PLSH-01 | static analysis | `grep -r "style={{" src/ --include="*.tsx" \| grep -v "gradient\|backgroundImage\|transform\|rgba"` | ✅ | ⬜ pending |
| 0-01-02 | 01 | 1 | PLSH-03 | build | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 0-02-01 | 02 | 1 | PLSH-02 | static analysis | `grep -r "\.comment" src/ --include="*.tsx"` | ✅ | ⬜ pending |
| 0-02-02 | 02 | 1 | PLSH-02 | static analysis | `grep -rn "\*2\|/ 2\|rating.*2" src/ --include="*.tsx" \| grep -v "Math.round"` | ✅ | ⬜ pending |
| 0-03-01 | 03 | 2 | PLSH-03 | build + visual | `npm run build` | ✅ | ⬜ pending |
| 0-03-02 | 03 | 2 | PLSH-03 | static analysis | `grep -r "onMouseEnter\|onMouseLeave" src/ --include="*.tsx"` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Verify `npx tsc --noEmit` baseline passes before any changes
- [ ] Confirm `npm run build` baseline passes before any changes
- [ ] Run static analysis grep commands to establish baseline counts

*Note: No new test infrastructure required for this refactor phase. Build + tsc is the appropriate gate.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Tiramisu palette looks correct in browser | PLSH-01 | Visual — cannot automate color appearance | Load all 6 pages; confirm warm color palette renders consistently |
| Cards have uniform shadow/border-radius/hover | PLSH-03 | Visual — computed CSS cannot be asserted via build | Open explore, place detail, profile; confirm consistent card appearance |
| Form inputs share focus ring appearance | PLSH-03 | Visual — focus state requires browser interaction | Tab through all form fields; confirm caramel ring appears uniformly |
| Star rating stores and displays same 1–5 value | PLSH-02 | E2E data flow | Submit a 3-star review; verify DB stores 3; reload page; verify 3 displays |
| `border-caramel/20` renders correctly | PLSH-01 | Tailwind v4 opacity modifier with hex tokens uncertain | Check Navbar bottom border in browser; if incorrect, keep rgba inline |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
