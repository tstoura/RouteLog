# Current Implementation Status

**Last updated:** May 2026  
**Next milestone:** Auth/JWT MVP

---

## Backend

| Area | Status | Notes |
|---|---|---|
| Project scaffold (NestJS + Prisma + PostgreSQL) | ✅ Done | Phase 0–2 |
| Database schema | ✅ Done | All detail tables, routes, grade_mappings; no pending migrations |
| User + Club models | ✅ Done | No auth yet; userId/clubId sent in request body (temporary) |
| Hiking activity creation + scoring | ✅ Done | Phase 5–6; EOOA formula verified |
| Climbing activity creation + scoring | ✅ Done | Phase 6–7; UIAA/Alpine/mixed; French via grade_mappings |
| Expedition activity creation + scoring | ✅ Done | Phase 6–7; expedition formula verified |
| Activity history (`GET /activities`) | ✅ Done | Phase 8; returns full detail with filters |
| EOOA Excel export | ✅ Done | Phase 9; hiking, climbing, expedition sheets |
| Routes backend (`GET/POST /climbing-routes`) | ✅ Done | Phase 10F |
| French grade mappings (Conservative MVP) | ✅ Done | 11 mappings seeded; see docs/french-grade-mapping.md |
| Personal records optional fields Phase A | ✅ Done | DTO/service relaxations; no DB migration; see docs/personal-records-optional-fields.md |
| Grade validation for personal climbing | ✅ Done | Static lists; no DB lookup for personal |
| **Auth/JWT** | ⏳ Pending | userId/clubId currently sent in request body |
| Phase B nullable migrations | ⏳ Pending | altitude/routeLength/text fields for personal records |

---

## Frontend

| Area | Status | Notes |
|---|---|---|
| App shell + routing | ✅ Done | React + Vite + Tailwind |
| Hiking activity form | ✅ Done | Official + personal; optional fields for personal |
| Rock Climbing activity form | ✅ Done | Official + personal; French/UIAA/Alpine/mixed; optional fields for personal |
| Expedition activity form | ✅ Done | Official + personal; optional fields for personal |
| Activity success banner | ✅ Done | Category-aware action labels; score card resets on new activity |
| Activity history page | ✅ Done | Filtered list; client-side search; cards per category |
| Activity detail page | ✅ Done | Full detail view; shows `—` for omitted personal fields |
| Routes tab (Διαδρομές) | ✅ Done | Backend-driven list/detail/create; see docs/routes-tab.md |
| Admin pages | ⏳ Scaffold only | AdminActivitiesPage, AdminDashboardPage, AdminMembersPage use mock data |
| **Auth/login UI** | ⏳ Pending | |
| E2E Round 2 | ⏳ Pending | |
| UI polish pass | ⏳ Pending | |

---

## Scoring

| Rule | Status |
|---|---|
| Hiking formula (§2.5) | ✅ Verified against EOOA Excel |
| Climbing formula (§3.13) | ✅ Verified; max(regular, mixed) for combined difficulty |
| French → UIAA resolution via grade_mappings | ✅ Working |
| Expedition formula (§4.7) | ✅ Verified |
| Season coefficient only above 1000 m (§3.12) | ✅ Implemented |

---

## Testing

| Suite | Status |
|---|---|
| `scoring.service.spec.ts` | ✅ Passing — hiking, climbing, expedition formula tests |
| `activities.service.spec.ts` | ✅ Passing — personal/official climbing difficulty validation + French mapping tests (22 tests) |
| Frontend unit tests | ⏳ Not yet started |
| E2E tests | ⏳ Not yet started |

---

## Known TODOs / Pending Work

| Item | Priority | Notes |
|---|---|---|
| Auth/JWT MVP | High | Replace `DEV_USER_ID`/`DEV_CLUB_ID` with JWT-decoded context |
| Phase B nullable migrations | Medium | Make altitude/routeLength nullable; replace `?? 0`/`?? ''` sentinels |
| User display names on route reviews | Medium | Requires auth/profile endpoint |
| Backend pagination for `/climbing-routes` | Low | Add when DB grows beyond ~100 routes |
| French grade mapping expansion | Low | Expand beyond 11 MVP mappings; consider admin UI |
| French grade mappings for grade_mappings table | Low | Currently 11 Conservative MVP entries |
| Multi-user export selection | Low | Requires `GET /clubs/:clubId/members` |
| Backend search for history | Low | Current search is client-side |
| Admin UI | Low | Admin pages currently use mock data |
| E2E Round 2 | Medium | Test full official flows end-to-end after auth |
| Final presentation/report | Medium | When features are complete |
