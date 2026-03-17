# Roadmap: Tearamess

## Overview

Tearamess is a brownfield project — auth, place browsing, ratings, and profiles already exist. This roadmap delivers six phases that transform the existing foundation into a full venue-discovery platform: first cleaning up visual inconsistencies and critical data bugs, then hardening the codebase architecture, then layering in social, lists, geo check-in, and the Ankara grid conquest mechanic. Every phase delivers a coherent, verifiable capability on top of the last.

## Phases

**Phase Numbering:**
- Integer phases (0, 1, 2, ...): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 0: Polish & Bugfix** - Tiramisu tema tutarlılığı, kritik veri hataları, ve temel UI kalitesi (completed 2026-03-13)
- [x] **Phase 1: Foundation** - Service/repository layer, middleware auth guard, and Zod form validation (completed 2026-03-14)
- [ ] **Phase 2: Social Graph** - One-way follow system, public user profiles, and activity feed
- [ ] **Phase 3: Lists** - Wishlist and custom lists for organizing and sharing places
- [ ] **Phase 4: Check-in + Grid** - Check-in system with PostGIS and Ankara grid cell tracking
- [ ] **Phase 5: Stats + Coverage** - Personal stats dashboard and Ankara coverage percentage

## Phase Details

### Phase 0: Polish & Bugfix
**Goal**: The app looks and behaves consistently before new architecture is layered on top — theme tokens are centralized, known data bugs are eliminated, and every screen shares the same visual language
**Depends on**: Nothing (first phase)
**Requirements**: PLSH-01, PLSH-02, PLSH-03
**Success Criteria** (what must be TRUE):
  1. Every page in the app uses the Tiramisu palette exclusively — no inline hex values remain, and switching the four CSS custom properties changes the entire app's color scheme consistently
  2. A user can submit a review with a 1–5 star rating and the value stored in the database is the same 1–5 number the UI displayed (no 2x multiplier or column mismatch errors)
  3. Place cards, list cards, and profile cards all render with consistent shadow, border-radius, and hover lift — a designer can confirm they share one visual style without reading the code
  4. All form inputs (search, review, auth) share the same focus ring, placeholder style, and error state appearance
**Plans**: 3 plans

Plans:
- [ ] 00-01-PLAN.md — Extract Card, Input, Textarea UI primitive components
- [ ] 00-02-PLAN.md — Audit and fix rating pipeline and review content column
- [ ] 00-03-PLAN.md — Token migration across all pages + apply components + remove hover handlers

### Phase 1: Foundation
**Goal**: The codebase is safe and consistent to extend — all data access goes through a service layer, auth is enforced server-side, and all forms validate with Zod
**Depends on**: Phase 0
**Requirements**: INFRA-01, INFRA-02, INFRA-03
**Success Criteria** (what must be TRUE):
  1. A developer adding a new feature cannot call `supabase.from()` directly from a page component — all queries route through `src/lib/services/`
  2. Navigating to a protected page while unauthenticated redirects via middleware before the page renders (no client-side flash)
  3. Any new form in the app submits only validated data — invalid input shows inline error messages without hitting the server
**Plans**: 4 plans

Plans:
- [ ] 01-01-PLAN.md — Install test/form dependencies and create Jest + test stubs (Wave 0)
- [ ] 01-02-PLAN.md — Create service layer and migrate all page Supabase calls (INFRA-01)
- [ ] 01-03-PLAN.md — Add middleware auth guard and remove client-side redirect guards (INFRA-02)
- [ ] 01-04-PLAN.md — Create Zod schemas and migrate all four forms to RHF (INFRA-03)

### Phase 2: Social Graph
**Goal**: Users can follow other users, see their public activity, and discover a personalized feed of recent place visits and reviews from people they follow
**Depends on**: Phase 1
**Requirements**: SOCL-01, SOCL-02, SOCL-03, SOCL-04
**Success Criteria** (what must be TRUE):
  1. A user can visit another user's profile and follow or unfollow them with one click
  2. A user can see their own following and follower counts and browse both lists
  3. A user's home feed shows the most recent place visits and reviews from accounts they follow, loading more on scroll
  4. Another user's public profile page shows their bio, visit history, and public lists
**Plans**: 6 plans

Plans:
- [ ] 02-01-PLAN.md — Wave 0: Create failing test stubs for follows, feed, and profiles services
- [ ] 02-02-PLAN.md — Wave 1: Define type contracts (Follow, Visit, FeedItem) and relativeTime utility
- [ ] 02-03-PLAN.md — Wave 2: Implement follows, feed, visits services + getProfileByUsername
- [ ] 02-04-PLAN.md — Wave 3: Build FollowButton, FollowListModal, FeedCard, FeedSkeleton, ProfileLayout components
- [ ] 02-05-PLAN.md — Wave 4: Wire pages — auth-split home feed, public profile, own profile social counts
- [ ] 02-06-PLAN.md — Wave 5: Human verification checkpoint for all four SOCL requirements

### Phase 3: Lists
**Goal**: Users can curate named lists of places and maintain a one-click wishlist, all visible on their public profile
**Depends on**: Phase 2
**Requirements**: LIST-01, LIST-02, LIST-03, LIST-04
**Success Criteria** (what must be TRUE):
  1. A user can add or remove any place from their "Gideceğim Yerler" wishlist with a single button on the place detail page
  2. A user can create a named list (e.g., "En iyi kahvaltılıklar") and add or remove places from it
  3. A user's public lists appear on their profile page and are browsable by other users
  4. A user can toggle any of their lists between private and public
**Plans**: TBD

### Phase 4: Check-in + Grid
**Goal**: Users can check in to places, and each check-in colors a cell on an interactive Ankara grid map — making the city explorable as a visual canvas
**Depends on**: Phase 1
**Requirements**: XPLR-01, XPLR-02
**Success Criteria** (what must be TRUE):
  1. A user can check in to a place and the check-in is recorded with a timestamp
  2. After check-in, the user's Ankara grid map shows the corresponding cell colored in, reflecting that visit
  3. A user can open their grid map and see all previously visited cells painted, with the map state persisting across sessions
**Plans**: TBD

### Phase 5: Stats + Coverage
**Goal**: Users can see how much of Ankara they have explored and a full breakdown of their visit patterns — turning exploration into a measurable personal achievement
**Depends on**: Phase 4
**Requirements**: XPLR-03, XPLR-04
**Success Criteria** (what must be TRUE):
  1. A user can see the exact percentage of Ankara grid cells they have visited (e.g., "You've explored 14% of Ankara")
  2. A user's stats page shows total places visited, total unique places, and a category distribution chart
  3. A user's stats page shows an activity calendar and highlights the districts they visit most
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 0 → 1 → 2 → 3 → 4 → 5
(Phase 4 depends only on Phase 1, not Phase 3 — can be parallelized with Phase 3 if needed)

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 0. Polish & Bugfix | 3/3 | Complete   | 2026-03-13 |
| 1. Foundation | 4/4 | Complete   | 2026-03-14 |
| 2. Social Graph | 3/6 | In Progress|  |
| 3. Lists | 0/? | Not started | - |
| 4. Check-in + Grid | 0/? | Not started | - |
| 5. Stats + Coverage | 0/? | Not started | - |
