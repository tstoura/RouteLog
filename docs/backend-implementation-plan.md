# Cursor Backend Implementation Plan — RouteLog

This document defines the recommended phased implementation plan for the RouteLog backend.  
Cursor should follow these phases sequentially and stop after each phase for human review.

## General Cursor Rule

For every phase, Cursor must:

1. Implement only the requested phase.
2. Avoid continuing to the next phase unless explicitly instructed.
3. Summarize all changes after completion.
4. List all modified/created files.
5. Mention assumptions, risks, or open questions.
6. Stop and wait for review.

---

## Phase 0 — Read Documentation and Inspect Current Project

**Goal:** Understand the project and documentation before writing code.

### Prompt for Cursor

```text
Read the documentation files in /docs before implementing anything:

- docs/backend-decisions.md
- docs/eooa-rules-alignment.md
- docs/database/database-schema.md
- docs/database/dbdesigner-markup.txt
- docs/database/routelog-schema-postgresql.sql

Also inspect the existing project structure.

Do not modify any files yet.

Your task is only to understand the current design and propose an implementation plan.

Please provide:
1. A short summary of the backend requirements.
2. The proposed backend stack and folder/module structure.
3. Any inconsistencies, missing information, or risky assumptions you notice.
4. A phase-by-phase implementation plan.

Stop after this. Do not implement anything yet.
```

---

## Phase 1 — Backend Project Setup

**Goal:** Set up the backend foundation without implementing business logic.

### Prompt for Cursor

```text
Implement Phase 1 only: backend project setup.

Use NestJS with Prisma and PostgreSQL.

Tasks:
1. Create or configure the backend application structure.
2. Add Prisma.
3. Add environment configuration for DATABASE_URL.
4. Add a basic module structure, but do not implement business logic yet.

Suggested modules:
- auth
- users
- clubs
- activities
- routes
- scoring
- export

Do not implement endpoints yet except maybe a basic health check.

After finishing:
- list all created/modified files
- explain how to run the backend
- explain what environment variables are needed
- stop and wait for review
```

---

## Phase 2 — Prisma Schema / Database Schema

**Goal:** Translate the approved database schema into Prisma.

### Prompt for Cursor

```text
Implement Phase 2 only: Prisma database schema.

Use the database design from:
- docs/database/database-schema.md
- docs/database/dbdesigner-markup.txt
- docs/database/routelog-schema-postgresql.sql

Create the Prisma schema for the following tables/models:
- users
- clubs
- club_memberships
- activities
- routes
- hiking_activity_details
- climbing_activity_details
- expedition_activity_details
- grade_mappings

Important rules:
1. Detail tables use activity_id as both primary key and foreign key to activities.id.
2. Do not generate separate ids for detail tables.
3. activities.club_id must be nullable.
4. activities.points must be nullable.
5. climbing difficulty_scale, difficulty_grade and mixed_climbing must be nullable.
6. routes.altitude and routes.route_length must be nullable.
7. Add created_at and updated_at where defined in the docs.
8. Use enums where appropriate if it is safe, or keep strings with validation if enums would slow down implementation.

Do not implement API endpoints yet.

After finishing:
- show the Prisma models
- explain any differences from the DBDesigner schema
- provide migration instructions
- stop and wait for review
```

---

## Phase 3 — Reference Data and Constants

**Goal:** Create the source of truth for EOOA coefficients, mappings, and allowed values.

### Prompt for Cursor

```text
Implement Phase 3 only: reference data and constants.

Create a clear source of truth for EOOA coefficients and mappings based on docs/eooa-rules-alignment.md.

Implement constants or seed data for:
1. Hiking field coefficients:
   - normal
   - winter_conditions
   - ski_mountaineering

2. Hiking difficulty coefficients:
   - hiking / πεζοπορία
   - F-, F, F+, PD-, PD, PD+, AD-, AD, AD+

3. Climbing season coefficients:
   - summer
   - winter

4. Climbing repetition coefficients:
   - repeat
   - new

5. Climbing UIAA/Alpine coefficients.

6. Climbing mixed/ice coefficients:
   - M1-M12
   - WI1-WI12

7. Expedition season coefficients.

8. Expedition difficulty coefficients.

9. Expedition organization coefficients:
   - no
   - europe
   - africa
   - other_continents

10. French climbing grade mapping to UIAA/Alpine, if enough mapping data is already defined.
If mapping is incomplete, create a placeholder mapping module with TODO comments, but do not invent uncertain mappings.

Do not implement endpoints yet.

After finishing:
- list where each coefficient table lives
- explain how scoring functions will use them
- stop and wait for review
```

---

## Phase 4 — Users, Clubs, and Memberships

**Goal:** Implement core user/club membership logic.

### Prompt for Cursor

```text
Implement Phase 4 only: users, clubs, and memberships.

Implement backend logic for:
1. Creating/listing users if needed for development.
2. Creating/listing clubs.
3. Creating club memberships.
4. Determining whether a user is independent or a club member:
   - A user is a club member if they have a club_membership.
   - A user is independent if they have no club_membership.
5. Support system_role:
   - user
   - super_admin
6. Support club membership role:
   - member
   - club_admin

If authentication already exists in the project, integrate with the existing auth instead of replacing it.

Do not implement full activity creation yet.

After finishing:
- list endpoints/services created
- explain how independent users are detected
- stop and wait for review
```

---

## Phase 5 — Climbing Routes Module

**Goal:** Implement route creation/search logic for rock climbing.

### Prompt for Cursor

```text
Implement Phase 5 only: climbing routes module.

Use the route rules from docs/backend-decisions.md and docs/database/database-schema.md.

Implement:
1. Create route.
2. Search/list routes.
3. Get route by id.
4. Duplicate prevention using normalized_name + mountain_or_area + climbing_field.
5. normalized_name should be generated by backend from name.
6. Do not allow users to freely type route data directly in climbing activity submission without route_id.
7. Route editing should be restricted to authorized admins/super_admin for now.

Route fields:
- name
- normalized_name
- mountain_or_area
- climbing_field
- default_scale
- default_grade
- altitude nullable
- route_length nullable
- created_by_user_id nullable/optional depending on auth context

Do not implement climbing activity submission yet.

After finishing:
- list endpoints
- explain duplicate prevention logic
- stop and wait for review
```

---

## Phase 6 — EOOA Scoring Service

**Goal:** Implement scoring as isolated pure functions before connecting to endpoints.

### Prompt for Cursor

```text
Implement Phase 6 only: EOOA scoring service.

Create a scoring module/service with pure functions for:

1. calculateHikingPoints(input)
2. calculateClimbingPoints(input)
3. calculateExpeditionPoints(input)

Follow docs/eooa-rules-alignment.md exactly.

Important:
- For personal activities, points may be null.
- For official activities, points must be calculated.
- Hiking uses sqrt(max(distance_length / 15, 1)).
- Climbing uses the Excel-compatible season/altitude rule:
  season coefficient is applied only when altitude > 1000.
- Climbing final difficulty coefficient is max(regular difficulty coefficient, mixed/ice coefficient).
- Expedition organization coefficient is added at the end, not multiplied.
- Expedition has no minimum participants restriction.

Also add unit tests or at least simple test cases for each category.

Do not implement activity endpoints yet.

After finishing:
- list functions
- list test cases
- explain any assumptions
- stop and wait for review
```

---

## Phase 7A — Hiking Activity Creation

**Goal:** Implement submission of Hiking / Ski Mountaineering activities.

### Prompt for Cursor

```text
Implement Phase 7A only: Hiking activity creation.

Create endpoint/service to submit a hiking/ski mountaineering activity.

It must:
1. Create a row in activities.
2. Create a matching row in hiking_activity_details using the same activity_id.
3. If is_official = true:
   - require club_id
   - validate all official required fields
   - calculate points using calculateHikingPoints
4. If is_official = false:
   - allow personal activity
   - points may be null
5. Do not implement other categories yet.

After finishing:
- list endpoint payload
- list validation rules
- stop and wait for review
```

---

## Phase 7B — Climbing Activity Creation

**Goal:** Implement submission of Rock Climbing activities.

### Prompt for Cursor

```text
Implement Phase 7B only: Climbing activity creation.

Create endpoint/service to submit a climbing activity.

Rules:
1. route_id is required.
2. Fetch route by route_id.
3. route_name, mountain_or_area and climbing_field must be snapshotted from the selected route.
4. Users must not override route identity fields in the activity payload.
5. altitude and route_length may be prefilled from route but activity stores its own values.
6. If is_official = true:
   - require club_id
   - require route_id, season, repetition_type, altitude, route_length, participants_num
   - require either difficulty_scale + difficulty_grade OR mixed_climbing
   - difficulty_scale and difficulty_grade must exist together
   - calculate points
7. If is_official = false:
   - points may be null
8. Do not expose Excel technical values "Επιλογή" or "0" in API validation as user choices.

After finishing:
- list endpoint payload
- list validation rules
- stop and wait for review
```

---

## Phase 7C — Expedition Activity Creation

**Goal:** Implement submission of Expeditions Abroad activities.

### Prompt for Cursor

```text
Implement Phase 7C only: Expedition activity creation.

Create endpoint/service to submit an expedition abroad activity.

Rules:
1. Create row in activities.
2. Create row in expedition_activity_details.
3. If is_official = true:
   - require club_id
   - validate all official fields
   - calculate points
4. organization_type helper rule:
   organization_type is about whether the member's club organized the expedition.
   If not organized by the club, use "no".
5. No minimum participants restriction.
6. If is_official = false:
   - points may be null.

After finishing:
- list endpoint payload
- list validation rules
- stop and wait for review
```

---

## Phase 8 — Activity History and Retrieval

**Goal:** Implement read/query endpoints for activities.

### Prompt for Cursor

```text
Implement Phase 8 only: activity retrieval/history.

Implement endpoints for:
1. Get current user's activities.
2. Filter by category.
3. Get activity details by id.
4. Return the correct detail object depending on category.

Rules:
- Users can see their own activities.
- Club admins can see activities for their club when needed.
- Super admin can access all.
- Personal activities are included in the user's own history.
- Official export only uses is_official = true.

Do not implement export yet.

After finishing:
- list endpoints
- explain access rules
- stop and wait for review
```

---

## Phase 9 — Admin Export Logic

**Goal:** Implement official club export to EOOA-compatible Excel.

### Prompt for Cursor

```text
Implement Phase 9 only: admin export logic.

Implement backend support for exporting official club activities to the EOOA Excel format.

Rules:
1. Export is per club.
2. Only club_admin for that club or super_admin can export.
3. Export input includes selected_user_ids.
4. selected_user_ids are not stored in the database.
5. Query activities where:
   - club_id = requested club
   - is_official = true
   - user_id IN selected_user_ids
6. Personal activities are excluded.
7. Use Excel export mappings from docs/eooa-rules-alignment.md.
8. For climbing export:
   - if only mixed_climbing exists, export ΒΔ(UIAA/Alpine) = "Επιλογή"
   - if only regular grade exists, export ΜΙΚΤΑ = "Επιλογή"
9. Preserve the structure of the EOOA Excel template as much as possible.

Do not implement UI changes in this phase.

After finishing:
- list endpoint
- explain query
- explain generated file format
- stop and wait for review
```

---

## Phase 10 — Frontend Form Alignment

**Goal:** Align frontend forms with backend validation and official/personal logic.

### Prompt for Cursor

```text
Implement Phase 10 only: frontend form alignment with backend rules.

Tasks:
1. Add or confirm the toggle "Συμμετοχή στην επίσημη καταγραφή" / "Προσωπική καταγραφή" in all three activity forms:
   - Hiking / Ski Mountaineering
   - Rock Climbing
   - Expeditions Abroad

2. Ensure technical Excel values are not shown as user options:
   - "Επιλογή"
   - "0"

3. Hiking form:
   - Add label/helper/hover text for ΒΔ.
   - Add label/helper/hover text for Πεδίο.

4. Expedition form:
   - Add helper text for Organization:
     "Συμπληρώνεται μόνο όταν η αποστολή έχει οργανωθεί από τον σύλλογο. Διαφορετικά, επιλέξτε "Όχι"."

5. Climbing form:
   - If official toggle is ON, enforce:
     route_id, season, repetition_type, altitude, route_length, participants_num
     and either difficulty_scale + difficulty_grade or mixed_climbing.

Do not change backend in this phase unless necessary for integration.

After finishing:
- list UI files changed
- explain how form payload maps to backend DTOs
- stop and wait for review
```

---

## Recommended Execution Order

Run the phases in this order:

```text
Phase 0
Phase 1
Phase 2
Phase 3
Phase 4
Phase 5
Phase 6
Phase 7A
Phase 7B
Phase 7C
Phase 8
Phase 9
Phase 10
```

Do not let Cursor implement multiple critical phases at once.

Most critical review checkpoints:

```text
Phase 2 — Prisma schema
Phase 6 — Scoring service
Phase 7A/7B/7C — Activity creation
Phase 9 — Export
```

---

## Notes

The files in `/docs` are the source of truth.  
If implementation details conflict with these docs, Cursor should stop and ask before proceeding.

