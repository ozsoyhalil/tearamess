# Feature Research

**Domain:** Place discovery / social check-in / city exploration platform
**Researched:** 2026-03-13
**Confidence:** MEDIUM (training knowledge on Foursquare, Swarm, Letterboxd, Yelp, Google Maps — WebSearch unavailable for live verification)

---

## Competitor Baseline

| Platform | Core Loop | What it does well | Where it fails |
|----------|-----------|-------------------|----------------|
| **Foursquare City Guide** | Search → visit → tip | Data density, editorial lists | Feels like a utility, not a social space |
| **Swarm** | Check in → earn coins → mayorships | Habit loop, streaks, social visibility | Divorced from discovery; check-in for its own sake |
| **Letterboxd** | Watch → log → rate → list → discuss | Taste expression, curated lists, follow graph quality | Film-only; list UX is the product |
| **Yelp** | Search → read reviews → rate | Review volume, structured data | Gamification feels mercenary; review spam |
| **Google Maps** | Navigate → review → photo | Universal coverage, trust | Social graph nonexistent; no taste layer |
| **Snap Map** | Real-time location on grid | Visual, spatial thrill | Ephemeral, no memory; privacy issues |
| **Beli** (Turkey) | Social restaurant discovery | Local social proof | Restaurant-only; limited to food |

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Star / numeric rating on a place | Every review platform has it; already exists | LOW | 0–5 with 0.5 steps already implemented |
| Text review per visit | Users expect to record their take in words | LOW | Already exists |
| Place detail page | Canonical page per venue with all reviews/stats | LOW | Already exists |
| Category browse + filter | Users arrive with intent ("show me cafes") | LOW | Already exists |
| User profile with visit history | Social credibility; users want to see their own log | MEDIUM | Basic profile exists; needs enrichment |
| "Want to go" / Wishlist | Every platform (Google Maps, Foursquare) has a save button | LOW | Active requirement; trivial to add |
| Search places by name | Autocomplete search before you commit to browsing | LOW | Not confirmed as existing — likely needed |
| Place photo (at least cover image) | Visual context is expected on any venue card | LOW | Confirm if existing |
| Custom user lists | Letterboxd's core primitive; "Best brunch spots" etc | MEDIUM | Active requirement |
| View other users' profiles + lists | Social context; can't follow someone you can't inspect | LOW | Active requirement |
| Follow other users (one-way) | Asymmetric follow is the Letterboxd standard; lower friction than mutual-add | MEDIUM | Active requirement |
| Activity feed (people you follow) | Core retention loop — why come back daily | MEDIUM | Active requirement |
| Place rating aggregate / score | Users expect to see "this place is rated 4.2 on average" | LOW | Likely trivially derived from existing data |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Ankara grid map ("city conquest")** | Turns the city into a game board; "I've covered 23% of Ankara" is a shareable, sticky stat | HIGH | Core differentiator. Requires dividing Ankara into grid cells, recording which cells a user has visited, rendering a colored grid. Geohash or custom polygon grid. This is the single strongest retention hook. |
| **Personal stats dashboard** | Letterboxd-style year-in-review feel; "47 places this year, top category: cafe, most active: Çankaya" | MEDIUM | Derived from existing visit data; high perceived value for low data-model cost. Drives repeat opens just to see numbers go up. |
| **Anonymous location notes (geo-gated)** | Discoverable only by people who physically visit the location; creates easter-egg surprise and authentic local knowledge | HIGH | Requires location verification on mobile or geo-check on client. Privacy and abuse surface must be designed carefully. Strong differentiation — no major platform does this. |
| **Venue-based events** | Adds temporal layer to static place data; "Workshop at Turuncu Oda this Saturday" | HIGH | Requires event model, creation flow, RSVP/follow, notification. Risk: becomes a ghost town if no events are created. Needs curator/venue-owner bootstrap. |
| **Taste profile inference** | Auto-derive a user's "type" from their ratings (e.g., "You prefer hidden gems over popular spots") | HIGH | Machine learning or simple heuristics from rating + category patterns. Defer to v2. |
| **List discovery / featured lists** | Editorial or community-curated lists surface hidden gems; Letterboxd's lists are a content engine | MEDIUM | Needs curation surface; could be editorial by team first, then community. |
| **Place mood / context tags** | Beyond star rating: "good for solo", "noisy but worth it", "bring a book" — Foursquare tips done better | LOW | Structured tags on reviews. Low complexity, adds richness to discovery. |
| **Visit streaks + milestones** | "Visited 5 new places this week" badge; Swarm-style but tied to exploration not just check-in volume | MEDIUM | Swarm proved this works for habit formation. Milestones should map to exploration quality, not just quantity. |
| **Neighborhood / district heatmap** | Color districts by visit density; "You know Kızılay well but haven't touched Ulus" | MEDIUM | Complementary to or alternative flavor of the grid. Ankara has named districts (mahalle/ilçe) that are meaningful to locals. |
| **Social lists ("People like you also liked")** | Recommendation layer derived from follow graph | HIGH | Deferred — needs sufficient data density first. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Real-time location sharing** | Snap Map feel, "see where friends are now" | Privacy liability; legal complexity in Turkey (KVKK); requires always-on location permission; kills casual use | Grid map shows where people *have been*, not where they are now — same thrill, no privacy bomb |
| **Mutual/bidirectional friendship** | Familiar from Facebook/Instagram | Increases friction to connect; creates awkward pending states; reduces content diversity in feed | One-way follow (Letterboxd/Twitter model) already decided; enforce this |
| **Direct messaging / chat** | Natural "let's meet here!" flow | Full moderation surface; significant scope; distraction from core loop | Comments on lists or places provide enough social friction without full chat |
| **Gamification points / leaderboards** | Feels engaging | Points without meaning inflate engagement metrics not genuine exploration; top users game the system; new users feel behind and quit | Milestone badges tied to quality exploration (grid coverage, district diversity) instead of raw volume |
| **Photo gallery per place** | Every user adds photos in Yelp/Maps | Moderation nightmare at scale; storage cost; doesn't add differentiation vs Google Maps | One cover photo per place (curated); rely on Google Maps / Instagram links for heavy photo needs |
| **Venue owner / business accounts** | Revenue opportunity | Changes community dynamics; introduces paid promotion bias; users distrust reviews when venues can respond/push back | Keep platform user-first; events feature can serve this need partially without full business portal |
| **Full review text editing after publish** | Quality of life | Opens edit-history complexity; makes reviews feel less authentic ("diary entry" feeling) | Allow edit within 24 hours; lock after |
| **Third-party login (Google, Apple)** | Reduces signup friction | Adds OAuth complexity, dependency on third-party auth providers | Email/password auth already exists; can add social login later as v1.x if friction is measured |
| **Offline mode** | Mobile app expectation | Web-first platform; offline adds significant SW complexity | Progressive enhancement with skeleton states; not full offline |

---

## Feature Dependencies

```
[Grid map conquest]
    └──requires──> [Visit / check-in data model with geo-coordinates]
                       └──requires──> [Places have lat/lng stored]

[Activity feed]
    └──requires──> [Follow graph]
                       └──requires──> [User profiles visible]

[Anonymous geo-gated notes]
    └──requires──> [Location verification mechanism]
    └──requires──> [Places have precise coordinates]

[Venue events]
    └──requires──> [Place detail page]
    └──requires──> [User profile (event creator)]

[Stats dashboard]
    └──requires──> [Visit history data]
    └──enhances──> [Grid map conquest] (grid % is a stat)

[Custom lists]
    └──requires──> [Places exist]
    └──enhances──> [Social follow] (following someone's lists)

[Wishlist / "Want to go"]
    └──is a──> [Special case of custom list] (can share data model)

[List discovery / editorial]
    └──requires──> [Custom lists]
    └──requires──> [Sufficient list volume from users]

[Taste profile inference]
    └──requires──> [Stats dashboard]
    └──requires──> [Sufficient rating volume per user]
```

### Dependency Notes

- **Grid map requires geo-coordinates on visits:** The grid only works if each check-in / visit records lat/lng. If places have coordinates already but visits do not record geo, the grid must use place coordinates as proxy (acceptable for v1).
- **Wishlist is a special list:** Implement as a system-created list named "Gideceğim Yerler" — avoids duplicating the list data model, makes lists more powerful from day one.
- **Activity feed requires follow graph:** Build follow first, feed second. Feed without social graph is empty; shipping them together in one phase reduces the empty-state problem.
- **Anonymous notes require location gate:** The location gate is the feature's whole point. If location verification is too complex (web geo API accuracy), a soft alternative is "only visible after you've visited and logged the place."
- **Events require operational bootstrap:** Without seeded events, the feature is invisible. Plan a manual seeding strategy or a venue-owner invite for launch.

---

## What Makes "City Exploration as a Game" Work

Evidence from Swarm, Snap Map, and urban game design:

### The Core Loop That Works
1. **Visit a new place** → record it (low friction, 1–2 taps)
2. **See immediate visual feedback** → grid cell colored, stat increments
3. **Discover gap** → "I've never been to Ulus district"
4. **Social visibility** → friend colored a cell you haven't
5. **Return** → check stats, see feed, plan next visit

### What Swarm Got Right
- Mayorships (being the most frequent visitor) created territorial pride
- Coins gave small, immediate rewards per check-in
- Stickers/categories gave check-ins texture beyond just location

### What Swarm Got Wrong
- Divorced from the utility of place discovery (check-in for its own sake)
- Mayorships became meaningless when user base thinned
- No "what should I visit next" signal from the game

### What the Grid Adds That Swarm Lacks
- The grid is a *canvas* — blank at first, you paint it by living in your city
- Progress is persistent and visible on your profile (unlike mayorships which could be stolen)
- Coverage percentage is a shareable, comparable stat without leaderboard toxicity
- Encourages going to *new areas*, not just revisiting the same places for coins

### Grid Implementation Principles (Tearamess-specific)
- **Cell size matters:** Too large (1km²) = whole city covered too quickly, no discovery incentive. Too small (100m²) = feels impossible. Recommend 300–500m cells for Ankara. Roughly produces ~1500–2500 cells for the city, requiring 50–100 visits to reach 5% — feels achievable.
- **Visual design is the feature:** The colored grid must look good. Consider using the tiramisu palette — unvisited cells in cream (#FFF8F0), visited in warm brown (#C08552), current exploration zone highlighted.
- **District labels as context:** Overlay district names on the grid so users recognize where they haven't been. Pure grid coordinates are meaningless.
- **Social grid comparison:** "You and @friend have 12 cells in common" — drives meeting up and coordinated exploration. Deferred to v1.x but design for it.

---

## MVP Definition (for this milestone's active requirements)

The app already has auth, place browse, place detail, ratings/reviews, add place, basic profile. The active requirements define the v1.1 milestone.

### This Milestone — Launch With

- [x] **Wishlist ("Gideceğim Yerler")** — table stakes; every competitor has save; low complexity; implement as first custom list
- [x] **Custom lists** — Letterboxd's core primitive; makes the social layer meaningful; enables list sharing
- [x] **Follow other users (one-way)** — prerequisite for activity feed; builds the social graph
- [x] **Other user profiles + lists visible** — prerequisite for follow to mean anything
- [x] **Activity feed** — core retention loop; depends on follow graph
- [x] **Stats dashboard** — high perceived value, mostly derived from existing data; reinforces the exploration identity

### This Milestone — High Priority Differentiators

- [x] **Ankara grid map** — the single strongest differentiator; builds "city as game" concept; needs geo data on places
- [x] **Anonymous geo-gated notes** — unique feature; needs careful design of location gate mechanism

### This Milestone — Valuable but Riskier

- [ ] **Venue-based events** — high complexity, depends on user-generated content bootstrap; build last in this milestone or defer to v1.2

### Add After Validation (v1.2)

- [ ] **Grid social comparison** — "You and @friend share X cells" — needs grid adoption first
- [ ] **Place mood/context tags** — enriches discovery; add once review volume is sufficient
- [ ] **Visit streaks + milestones** — add after grid to complement it; data is already captured
- [ ] **List discovery / featured lists** — needs content volume; editorial curation by team first

### Future Consideration (v2+)

- [ ] **Taste profile inference** — needs substantial rating history; ML or heuristic
- [ ] **Social list recommendations** — needs graph density
- [ ] **Multi-city expansion** — deliberate v1 constraint is Ankara-only
- [ ] **Venue/business accounts** — changes platform dynamics; consider after community establishes norms

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Wishlist | HIGH | LOW | P1 |
| Custom lists | HIGH | MEDIUM | P1 |
| Follow + user profiles | HIGH | MEDIUM | P1 |
| Activity feed | HIGH | MEDIUM | P1 |
| Stats dashboard | HIGH | LOW | P1 |
| Ankara grid map | HIGH | HIGH | P1 |
| Anonymous geo-gated notes | MEDIUM | HIGH | P2 |
| Venue events | MEDIUM | HIGH | P2 |
| Place mood/context tags | MEDIUM | LOW | P2 |
| Visit streaks + milestones | MEDIUM | MEDIUM | P2 |
| Grid social comparison | HIGH | MEDIUM | P3 (needs grid adoption) |
| Taste profile inference | MEDIUM | HIGH | P3 |
| List discovery / editorial | MEDIUM | MEDIUM | P3 |

**Priority key:**
- P1: Must have for this milestone
- P2: Should have, add when core is working
- P3: Nice to have, future milestone

---

## Competitor Feature Analysis

| Feature | Foursquare/Swarm | Letterboxd | Google Maps | Our Approach |
|---------|-----------------|------------|-------------|--------------|
| Rating | 10-point + like | 0.5–5 stars | 1–5 stars | 0–5 stars, 0.5 steps (already implemented) |
| Lists | Yes (Foursquare lists) | Strong — core UI | Saved places lists | Custom lists as primary organizing primitive |
| Social follow | Yes (Swarm) | One-way, strong | None | One-way, Letterboxd-style |
| Activity feed | Yes (Swarm) | Yes, rich | None | Follow graph feed with visit/list/review events |
| Gamification | Mayorships, coins, stickers | None | Local Guide points | Grid conquest + stats (exploration quality, not volume) |
| Geo exploration | None systematic | None | None | Ankara grid — unique to Tearamess |
| Anonymous notes | None | None | None | Location-gated notes — unique to Tearamess |
| Stats | Swarm year recap | Profile stats + diary | None | Dashboard + grid coverage percentage |
| Events | Foursquare had this, now degraded | None | Google Events (separate) | Venue-based events tied to place detail |
| Discovery | Search + editorial | Popular + friends | Search + local | Browse + lists + feed + grid gaps |

---

## Sources

- Foursquare City Guide and Swarm feature set: training knowledge, HIGH confidence (platform used extensively through 2024)
- Letterboxd feature set: training knowledge, HIGH confidence (product well-documented)
- Google Maps features: training knowledge, HIGH confidence
- Snap Map grid/visual concept: training knowledge, HIGH confidence
- Gamification patterns (city exploration): training knowledge, MEDIUM confidence — specific mechanics from academic game design literature and product teardowns
- Beli (Turkish platform): training knowledge, MEDIUM confidence — less well-documented in English sources
- Grid cell size recommendations: derived reasoning from city area estimates + game design principles, MEDIUM confidence — validate with Ankara geographic data
- Live verification of competitor current feature sets: NOT DONE (WebSearch unavailable) — verify current Swarm/Foursquare state before finalizing events feature scope

**Note:** WebSearch and Bash were unavailable during this research session. All findings are based on training data (knowledge cutoff August 2025). Confidence is MEDIUM overall. Recommend verifying: (1) current Swarm feature set — the product has changed significantly since Foursquare split; (2) current Beli feature set for Turkish market context; (3) Ankara geospatial data for grid cell sizing.

---

*Feature research for: Tearamess — place discovery / social check-in / city exploration*
*Researched: 2026-03-13*
