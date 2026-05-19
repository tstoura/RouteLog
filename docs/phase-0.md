# RouteLog Backend — Phase 0: Analysis & Implementation Plan

> Read-only planning document. No source files were modified to produce this analysis.
> Sources: `backend-decisions.md`, `eooa-rules-alignment.md`, `database-schema.md`,
> `dbdesigner-markup.txt`, `routelog-schema-postgresql.sql`.
> Last updated: final corrections applied (varchar(50), no placeholder clubs, exact-duplicate 409 block,
> routes before activities, selectedUserIds temporary only, completion_type always optional).

---

## 1. Backend Requirements Summary

RouteLog needs a REST API + PostgreSQL database that supports:

| Concern | Details |
|---|---|
| **Auth** | Email/password login (argon2id hashing), JWT session, user profile with onboarding flag |
| **Users & clubs** | User accounts; membership inferred from `club_memberships` rows; `system_role` and club-level `role` are separate |
| **Activities** | Three categories (`hiking`, `climbing`, `expedition`); shared base table `activities` + one detail row per category |
| **Official vs personal** | `is_official` flag; official activities require strict validation and `points` calculated; personal activities have relaxed validation and `points` may remain `null` |
| **EOOA scoring** | Three independent formulas (one per category) with coefficient tables documented in `eooa-rules-alignment.md` |
| **Grade mapping** | `grade_mappings` table converts French grades → UIAA/Alpine for climbing scoring and export |
| **Routes (climbing-primary)** | Canonical route records; users select or create a route; snapshot fields copied into the activity at submission time; `routes.category` retained for future extensibility |
| **Excel export** | Club admin triggers export; `selectedUserIds` are a temporary request input and are never persisted; Greek uppercase column labels mapped from normalized backend values only at export time |

---

## 2. Proposed Stack and Folder Structure

### Technology stack

| Layer | Choice | Reason |
|---|---|---|
| Runtime | **Node.js 20 LTS** | TypeScript-native, same ecosystem as the frontend |
| Framework | **NestJS** | Opinionated module structure, built-in DI, guards, pipes, decorators; matches the project's relational complexity |
| ORM | **Prisma** | Explicitly mentioned in `database-schema.md`; handles migrations cleanly; integrates well with NestJS |
| Database | **PostgreSQL 16** | Specified in the SQL schema |
| Auth | **JWT** (`@nestjs/jwt` + `passport-jwt`) | Stateless; `JwtAuthGuard` applies cleanly across NestJS controllers |
| Password hashing | **argon2id** (`argon2` package) | Modern standard; stronger than bcrypt |
| Validation | **class-validator + class-transformer** | NestJS-native DTO validation via `ValidationPipe` |
| Schema types | **Zod** (optional, for scoring input types) | Useful for pure TypeScript functions outside the NestJS DI tree |
| Excel | **ExcelJS** | Cell-level formatting, compatible with `.xlsx` |
| Tests | **Jest** (NestJS default) | Built-in test runner; supports unit and e2e tests |
| Containerization | **Docker Compose** | Local Postgres 16 + backend in one command |

### Folder structure

```
RouteLog/
├── src/                           ← existing React frontend (untouched)
├── server/
│   ├── prisma/
│   │   ├── schema.prisma          ← Prisma models mirroring the SQL schema
│   │   ├── migrations/            ← Prisma migration files
│   │   └── seed/
│   │       ├── clubs.ts           ← club seed structure; data populated only when provided
│   │       └── gradeMappings.ts   ← French → UIAA grade table
│   ├── src/
│   │   ├── main.ts                ← Bootstrap (NestFactory)
│   │   ├── app.module.ts          ← Root module
│   │   │
│   │   ├── prisma/
│   │   │   ├── prisma.module.ts
│   │   │   └── prisma.service.ts  ← PrismaClient singleton
│   │   │
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts ← POST /auth/register, POST /auth/login
│   │   │   ├── auth.service.ts    ← argon2id hash/verify, JWT sign
│   │   │   ├── jwt.strategy.ts    ← PassportStrategy(Strategy)
│   │   │   ├── jwt-auth.guard.ts  ← JwtAuthGuard
│   │   │   └── dto/
│   │   │       ├── register.dto.ts
│   │   │       └── login.dto.ts
│   │   │
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts  ← GET /users/me, PATCH /users/me
│   │   │   ├── users.service.ts
│   │   │   └── dto/
│   │   │       └── update-user.dto.ts
│   │   │
│   │   ├── clubs/
│   │   │   ├── clubs.module.ts
│   │   │   ├── clubs.controller.ts  ← GET /clubs, GET /clubs/:id/members
│   │   │   ├── clubs.service.ts
│   │   │   └── memberships/
│   │   │       ├── memberships.controller.ts ← POST /memberships
│   │   │       ├── memberships.service.ts
│   │   │       └── dto/
│   │   │           └── create-membership.dto.ts
│   │   │
│   │   ├── climbing-routes/        ← Canonical routes (name avoids clash with NestJS routing)
│   │   │   ├── climbing-routes.module.ts
│   │   │   ├── climbing-routes.controller.ts  ← GET /climbing-routes, POST /climbing-routes
│   │   │   ├── climbing-routes.service.ts     ← normalized_name, exact-duplicate 409 block
│   │   │   └── dto/
│   │   │       ├── create-route.dto.ts
│   │   │       └── search-routes.dto.ts
│   │   │
│   │   ├── activities/
│   │   │   ├── activities.module.ts
│   │   │   ├── activities.controller.ts  ← POST /activities, GET /activities, GET /activities/:id
│   │   │   ├── activities.service.ts     ← transaction, scoring dispatch
│   │   │   ├── categories/
│   │   │   │   ├── hiking/
│   │   │   │   │   ├── hiking.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   │       └── create-hiking-activity.dto.ts
│   │   │   │   ├── climbing/
│   │   │   │   │   ├── climbing.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   │       └── create-climbing-activity.dto.ts
│   │   │   │   └── expedition/
│   │   │   │       ├── expedition.service.ts
│   │   │   │       └── dto/
│   │   │   │           └── create-expedition-activity.dto.ts
│   │   │   └── dto/
│   │   │       └── create-activity.dto.ts  ← discriminated union by category
│   │   │
│   │   ├── export/
│   │   │   ├── export.module.ts
│   │   │   ├── export.controller.ts  ← POST /admin/clubs/:id/export
│   │   │   ├── export.service.ts     ← query + dispatch to category Excel builders
│   │   │   ├── guards/
│   │   │   │   └── club-admin.guard.ts
│   │   │   └── excel/
│   │   │       ├── hiking-excel.builder.ts
│   │   │       ├── climbing-excel.builder.ts
│   │   │       └── expedition-excel.builder.ts
│   │   │
│   │   └── scoring/
│   │       ├── scoring.module.ts
│   │       ├── scoring.service.ts    ← dispatches to category-specific calculators
│   │       ├── coefficients.ts       ← all coefficient lookup tables
│   │       ├── hiking.scoring.ts
│   │       ├── climbing.scoring.ts   ← includes French → UIAA grade resolution
│   │       └── expedition.scoring.ts
│   │
│   ├── test/
│   │   ├── scoring/
│   │   │   ├── hiking.scoring.spec.ts
│   │   │   ├── climbing.scoring.spec.ts
│   │   │   └── expedition.scoring.spec.ts
│   │   └── e2e/
│   │       └── activities.e2e-spec.ts
│   │
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   └── .env.example
└── docker-compose.yml
```

---

## 3. Docs and Schema Files That Require Updates

The following source-of-truth files must be updated **before Phase 7 implementation** to reflect the `completion_type` decision and all other clarifications agreed in this review. No backend source code should be modified until these docs are updated.

### 3.1 `docs/database/routelog-schema-postgresql.sql`

Add `completion_type` as a nullable column to the `climbing_activity_details` `CREATE TABLE` block:

```sql
"completion_type" varchar(50),   -- nullable; on_sight | flash | red_point | top_rope
```

### 3.2 `docs/database/database-schema.md`

Update the `climbing_activity_details` schema block (§9) to include:

```text
completion_type varchar(50) null
```

Add a note under the field:

```text
Optional in all cases (personal and official).
Used only for personal climbing history tracking.
Allowed values: on_sight | flash | red_point | top_rope.
Does not affect EOOA scoring.
Not included in the EOOA Excel export.
Not required for official records.
```

### 3.3 `docs/database/dbdesigner-markup.txt`

Add `completion_type varchar(50) null` to the `climbing_activity_details` entity block.

### 3.4 `docs/backend-decisions.md`

Add a new section:

```text
## 24. Completion type in rock climbing

climbing_activity_details contains:

    completion_type varchar(50) null

Allowed values:
- on_sight
- flash
- red_point
- top_rope

Rules:
- Optional in all cases (personal and official).
- Does not affect EOOA scoring.
- Not exported to the EOOA Excel template.
- Used only for personal climbing history and activity display in the UI.
```

---

## 4. Resolved Decisions

| # | Decision |
|---|---|
| 1 | Framework is **NestJS**. Prisma and PostgreSQL unchanged. |
| 2 | `/docs` files remain the source of truth. Backend must not diverge from them without updating them first. |
| 3 | `routes.category` is **kept** as `varchar`. MVP value will be `"climbing"`. Retained for future hiking/expedition route support. |
| 4 | `completion_type` is **`varchar(50) null`** everywhere (schema, docs, Prisma model). Optional in all records. Does not affect scoring or export. |
| 5 | `participants_text` in `climbing_activity_details` is **required for official climbing records**. Not used in scoring; collected for Excel/history completeness. |
| 6 | **No delete endpoints** in MVP unless explicitly requested. |
| 7 | Password hashing: **argon2id**. Authentication: **JWT** via `@nestjs/jwt` + `passport-jwt`. |
| 8 | Backend stores **normalized lowercase English values**. Greek uppercase labels are applied **only during Excel export**. |
| 9 | Excel technical values (`Επιλογή`, `0`) are **never shown in the UI**. Written into the Excel file only when required for template compatibility. |
| 10 | Official activities validated strictly; all EOOA-required fields must be present and `points` is calculated. Personal activities have relaxed validation; `points` may remain `null`. |
| 11 | Club seed file structure is created, but **no placeholder club data is inserted** unless real club data is explicitly provided. |
| 12 | Exact duplicate route check (same `normalized_name + mountain_or_area + climbing_field`) returns **409 Conflict** and includes the existing route in the response body. Fuzzy/near-duplicate matching is deferred to a later phase. |
| 13 | **Climbing routes module is implemented before the activity submission module** (Phase 6 before Phase 7) because `climbing_activity_details.route_id` is required. |
| 14 | `selectedUserIds` in export requests are **never persisted**. They are temporary input to the export query only. |

---

## 5. Remaining Open Questions

### A. Frontend → backend value mismatch (high risk, must fix before Phase 9)

The frontend forms currently send Greek UI labels directly:

| Form field | Current frontend value | Required backend value |
|---|---|---|
| Season | `"θερινή"` / `"χειμερινή"` | `"summer"` / `"winter"` |
| Repetition | `"νέα"` / `"επανάληψη"` | `"new"` / `"repeat"` |
| Field type | `"Κανονικό"` / `"Χειμερινών Συνθηκών"` / `"Ορειβατικού Σκι"` | `"normal"` / `"winter_conditions"` / `"ski_mountaineering"` |
| Organization | `"Ευρώπη"` / `"Αφρική"` / `"Άλλες Ήπειροι"` | `"europe"` / `"africa"` / `"other_continents"` |

A mapping layer must exist in the API client or form submission handlers before values leave the frontend. This is a Phase 9 concern.

### B. Hiking difficulty options in the frontend do not match the docs

`HikingActivityForm.tsx` still has `{ Επική, Αλπικό }` as difficulty options. `eooa-rules-alignment.md` §2.3 specifies hiking difficulty as `ΠΕΖΟΠΟΡΙΑ, F-, F, F+, PD-, PD, PD+, AD-, AD, AD+` (10 options). This must be corrected before Phase 9 integration.

### C. No club data provided

The `clubs` seed file will be created with its structure, but no rows will be inserted until real EOOA-registered club data is explicitly provided. The export feature will not be fully testable end-to-end until this data is available.

### D. `activities.club_id` is nullable in the DB but required for official activities

`club_id uuid` is nullable in the SQL schema. For `is_official = true`, `club_id` must be present. This constraint must be enforced at the application validation layer, not the database layer.

---

## 6. Phase-by-Phase Implementation Plan

### Phase 1 — Backend scaffold

**Goal:** A running NestJS server with a health check, connected to a local Postgres instance via Prisma.

- Initialize `server/` as a separate Node/TypeScript NestJS project.
- Configure `AppModule`, global `ValidationPipe`, `@nestjs/config` for env variables.
- Add `PrismaModule` with `PrismaService` (singleton client).
- Add `docker-compose.yml` (Postgres 16 service + server service).
- Add `GET /health` endpoint that calls `prisma.$queryRaw\`SELECT 1\``.
- Add `.env.example` with `DATABASE_URL`, `JWT_SECRET`.

**Deliverable:** `npm run start:dev` returns `{ status: "ok" }` and Prisma connects to Postgres.

---

### Phase 2 — Database schema and seeding

**Goal:** All 9 tables created via Prisma migrations; `grade_mappings` seeded; club seed structure in place.

- Translate `routelog-schema-postgresql.sql` into `schema.prisma`:
  - Add Prisma enums for `system_role`, `activity_category`, `field_type`, `season`, `repetition_type`, `organization_type`, `completion_type`.
  - Retain `routes.category` as `String` (not an enum) to allow future non-climbing route types.
  - Add `completionType String?` (`varchar(50) null`) to `ClimbingActivityDetails`.
- Create the initial migration (`prisma migrate dev --name init`).
- Seed `grade_mappings` with the full French → UIAA mapping table from `eooa-rules-alignment.md` §3.6.
- Create `seed/clubs.ts` with the seeding structure; **leave the data array empty** until real club data is provided.

**Deliverable:** `prisma migrate dev` succeeds; `prisma db seed` populates grade mappings; club seed runs without error (zero rows).

---

### Phase 3 — Auth module

**Goal:** Register, login, JWT issuance, authenticated user profile.

- `POST /auth/register` — hash password with argon2id; create user with `system_role = "user"`, `onboarding_completed = false`.
- `POST /auth/login` — verify argon2id hash; return signed JWT.
- `GET /users/me` — return authenticated user with club membership rows.
- `PATCH /users/me` — update `preferred_activity`, `onboarding_completed`.
- `JwtAuthGuard` via `passport-jwt` strategy; decorates `request.user` with `{ userId, systemRole }`.

**Deliverable:** Can register, log in, and fetch own profile with a valid JWT.

---

### Phase 4 — Clubs and membership module

**Goal:** Users can join a club during or after onboarding. Club admins can list their members.

- `GET /clubs` — list all clubs (for onboarding selector).
- `POST /memberships` — create a `club_memberships` row; no approval workflow in MVP.
- `GET /clubs/:id/members` — restricted to `club_memberships.role = "club_admin"` for that club.

**No delete endpoints in MVP.**

**Deliverable:** Onboarding "I am a club member" flow persists to the database.

---

### Phase 5 — Scoring module

**Goal:** Pure TypeScript functions for all three scoring formulas, fully tested before any HTTP endpoint writes activities.

- `scoring/coefficients.ts` — all coefficient lookup tables:
  - Hiking: field type coefficients (`normal → 1`, `winter_conditions → 1.5`, `ski_mountaineering → 1.8`), difficulty coefficients (`ΠΕΖΟΠΟΡΙΑ → 1` through `AD+ → 2.8`).
  - Climbing: UIAA/Alpine regular difficulty coefficients, mixed/ice (M/WI) coefficients, season coefficients (`summer → 1`, `winter → 2`), repetition coefficients (`repeat → 1`, `new → 3`).
  - Expedition: difficulty coefficients (`ΠΕΖΟΠΟΡΙΑ → 2` through `ED+ → 9.2`), organization coefficients (`no → 0`, `europe → 4`, `africa → 6`, `other_continents → 12`), season coefficients.
- `hiking.scoring.ts` — `calculateHikingPoints(input)`.
- `climbing.scoring.ts` — `calculateClimbingPoints(input)` (includes French → UIAA grade lookup via `grade_mappings`).
- `expedition.scoring.ts` — `calculateExpeditionPoints(input)`.
- Unit tests for all edge cases from `eooa-rules-alignment.md` §5.6:

```text
Hiking: participants_num < 3 AND field_type = normal       → points = 0
Hiking: participants_num < 3 AND field_type = ski_mountaineering → points calculated
Hiking: distance_length <= 15                              → distance factor = 1

Climbing: only mixed_climbing present                      → valid
Climbing: only regular difficulty present                  → valid
Climbing: neither regular difficulty nor mixed_climbing    → invalid (rejected before scoring)
Climbing: altitude <= 1000                                 → season coefficient not applied
Climbing: route_length < 100                               → route length factor uses 100

Expedition: organization_type = no                         → organization coefficient = 0
Expedition: organization_type = other_continents           → organization coefficient = 12
Expedition: no minimum participant count restriction
```

**Deliverable:** All scoring unit tests pass before Phase 6 begins.

---

### Phase 6 — Climbing routes module

**Goal:** Route search and creation for the rock climbing form. Implemented before the activity API because `climbing_activity_details.route_id` is a required foreign key.

- `GET /climbing-routes?q=&mountainOrArea=&climbingField=` — search routes using `normalized_name` (stored as `trim(lower(name))`).
- `POST /climbing-routes` — create a new route:
  - Auto-compute `normalized_name = trim(lower(name))`.
  - Check for an existing row with the same `normalized_name + mountain_or_area + climbing_field`.
  - If an **exact match** exists → return **409 Conflict** with the existing route in the response body. Exact duplicates are blocked completely.
  - Fuzzy / near-duplicate detection (e.g. Levenshtein similarity) is deferred to a future phase and will be implemented as a warning, not a block.
  - `routes.category` defaults to `"climbing"` for all MVP-created routes.
- Route editing, rename, and merge are restricted to `super_admin` (stub endpoint returning 501 for MVP).

**Deliverable:** Climbing form can search existing routes and create new ones; exact duplicates are rejected with 409.

---

### Phase 7 — Activity submission API

**Goal:** Create activities for all three categories (personal and official), with scoring applied to official ones.

- `POST /activities` — accepts `category` + common base fields + category-specific detail payload:
  - `is_official = true`: strict validation (all EOOA-required fields present; `club_id` required; `points` calculated via scoring module).
  - `is_official = false`: relaxed validation; `points` may remain `null`.
  - Inserts `activities` row + category detail row in a single **Prisma transaction**.
- `GET /activities` — list own activities, paginated, sorted by date descending.
- `GET /activities/:id` — single activity with full category detail.

**Per-category official validation:**

| Category | Required fields and rules |
|---|---|
| Hiking | All fields from `eooa-rules-alignment.md` §2.6; `club_id` required |
| Climbing | `route_id`, `season`, `repetition_type`, `altitude`, `route_length`, `participants_num`, `participants_text` required; either `(difficulty_scale + difficulty_grade)` or `mixed_climbing` must be present; `completion_type` is **always optional** regardless of `is_official` |
| Expedition | All fields from `eooa-rules-alignment.md` §4.8; `organization_type` required; `club_id` required |

**No delete endpoints in MVP.**

**Deliverable:** Can submit hiking, climbing, and expedition activities via API; official activities have `points` populated.

---

### Phase 8 — Admin export API

**Goal:** Club admin can download a correctly formatted Excel file for official activities.

- `GET /admin/clubs/:id/members` — club members list for the export user selector UI (protected by `ClubAdminGuard`).
- `POST /admin/clubs/:id/export` — accepts `{ selectedUserIds: string[], year?: number }`:
  - `selectedUserIds` are used only for the current query; they are **never persisted**.
  - Query: `club_id = :id AND is_official = true AND user_id IN (selectedUserIds) [AND year filter]`.
  - Generates a `.xlsx` file (ExcelJS) with separate sheets per category.
  - All column headers and cell values use **Greek uppercase EOOA labels** (backend values mapped at this layer only).
  - `Επιλογή` is written for nullable Excel-template fields only where the EOOA template requires it.
  - Response: streams the `.xlsx` binary with `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.

**Excel column mapping:**

| Category | Backend field → Excel column |
|---|---|
| Hiking | `date` → ΗΜ/ΝΙΑ; `mountain` → ΒΟΥΝΟ; `start_point` → ΑΦΕΤΗΡΙΑ; `end_point` → ΚΟΡΥΦΗ / ΤΕΡΜΑΤΙΣΜΟΣ; `max_altitude` → ΜΕΓΙΣΤΟ ΥΨΟΜ.; `total_elevation_gain` → ΣΥΑ; `distance_length` → ΜΗΚΟΣ; `field_type` → ΠΕΔΙΟ; `difficulty_grade` → ΒΑΘ. ΔΥΣΚ.; `participants_num` → ΑΤΟΜΑ; `points` → ΒΑΘΜΟΙ |
| Climbing | `date` → ΗΜΕΡ/ΝΙΑ; `mountain_or_area` → ΒΟΥΝΟ; `climbing_field` → ΠΕΔΙΟ; `route_name` → ΔΙΑΔΡΟΜΗ; `season` → ΕΠΟΧΗ; `repetition_type` → ΕΠΑΝ./ΝΕΑ; `altitude` → ΥΨΟΜ.; `mapped_grade or difficulty_grade` → ΒΔ(UIAA/Alpine); `mixed_climbing` → ΜΙΚΤΑ; `route_length` → ΑΝΑΠΤ.; `participants_num` → ΑΤΟΜΑ; `participants_text` → ΣΥΜ/ΝΤΕΣ; `points` → ΒΑΘΜΟΙ |
| Expedition | `date` → ΗΜΕΡ/ΝΙΑ; `country` → ΧΩΡΑ; `mountain_range` → ΟΡΟΣΕΙΡΑ; `mountain` → ΒΟΥΝΟ; `summit` → ΚΟΡΥΦΗ; `route_name` → ΔΙΑΔΡΟΜΗ; `season` → ΕΠΟΧΗ; `altitude` → ΥΨΟΜ.; `total_elevation_gain` → ΣΥΑ; `difficulty_grade` → ΒΔ; `participants_num` → ΑΤΟΜΑ; `organization_type` → ΟΡΓΑΝΩΣΗ; `points` → ΒΑΘΜΟΙ |

**`completion_type` is never exported to Excel.**

**Deliverable:** Admin can download a valid `.xlsx` file that matches the EOOA column format for all three categories.

---

### Phase 9 — Frontend integration

**Goal:** Replace all mock data in the React app with real API calls.

- Add `src/lib/api.ts` using native `fetch` with JWT header injection and typed response helpers.
- Add a **form value mapping layer** (frontend Greek labels → normalized backend values) for all three forms:

| Form field | Frontend value | Backend value |
|---|---|---|
| Season | `"θερινή"` / `"χειμερινή"` | `"summer"` / `"winter"` |
| Repetition | `"νέα"` / `"επανάληψη"` | `"new"` / `"repeat"` |
| Field type | `"Κανονικό"` / `"Χειμερινών Συνθηκών"` / `"Ορειβατικού Σκι"` | `"normal"` / `"winter_conditions"` / `"ski_mountaineering"` |
| Organization | `"Ευρώπη"` / `"Αφρική"` / `"Άλλες Ήπειροι"` | `"europe"` / `"africa"` / `"other_continents"` |
| Completion type | `"On Sight"` / `"Flash"` / `"Red Point"` / `"Top Rope"` | `"on_sight"` / `"flash"` / `"red_point"` / `"top_rope"` |

- Replace mock activity lists, route data, admin user lists, and history data with real endpoints.
- Integrate login/register with the auth API; store JWT in memory or `localStorage`.
- Handle loading, error, and empty states in all forms and the history page.
- Fix hiking form difficulty options to match `eooa-rules-alignment.md` §2.3 (`ΠΕΖΟΠΟΡΙΑ, F-, F, F+, PD-, PD, PD+, AD-, AD, AD+`).

**Deliverable:** Full end-to-end flow: register → onboard → submit activity → view in history → admin exports Excel.
