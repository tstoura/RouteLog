# RouteLog Backend Decisions

This document is the source of truth for the backend design decisions of the RouteLog MVP. Cursor should read this file before making backend/database changes.

## 1. Data architecture

RouteLog uses a relational data model.

The common fields of every activity are stored in the `activities` table. Category-specific fields are stored in separate detail tables:

- `hiking_activity_details`
- `climbing_activity_details`
- `expedition_activity_details`

This structure is used because all activity categories share a common core, but each category has different domain-specific fields.

Supported activity categories for the MVP:

- Hiking / Ski Mountaineering
- Rock Climbing
- Expeditions Abroad

Backend category values should use normalized English constants, for example:

- `hiking`
- `climbing`
- `expedition`

The Excel export layer is responsible for mapping backend values to the exact Greek labels required by the EOOA Excel template.

---

## 2. Users, clubs, and memberships

Users are stored in the `users` table.

A user can be:

- a member of one or more clubs, or
- an independent user without any club membership.

The system should not store a direct boolean such as `is_club_member` in the `users` table. Club membership is derived from the `club_memberships` table.

Rules:

- If a user has a row in `club_memberships`, the user is considered a member of the related club.
- If a user has no row in `club_memberships`, the user is considered an independent user.

The `club_memberships` table links users and clubs and stores the user's role inside a specific club.

Suggested club membership roles:

- `member`
- `club_admin`

The club membership role applies only inside the specific club. It is different from the global/system role of the user.

---

## 3. System role and super admin

The `users` table contains:

```text
system_role varchar(30)
```

Suggested values:

- `user`
- `super_admin`

Rules:

- `super_admin` has access to all administrative functionality of the application.
- Regular users have `system_role = user`.
- Club administrators do not need `system_role = super_admin`; their club-level permissions are represented by `club_memberships.role`.

---

## 4. Preferred activity

The `users` table contains:

```text
preferred_activity varchar(30) null
```

Suggested values:

- `hiking`
- `climbing`
- `expedition`

Rules:

- `preferred_activity` is optional.
- It is used only for UI personalization.
- It must not restrict what the user can do.

Example:

- If `preferred_activity = climbing`, the activity form may open with Rock Climbing preselected.
- The user can still create Hiking or Expedition activities.

---

## 5. Onboarding and independent users

During onboarding, the user can declare whether they are a member of a mountain club.

If the user selects that they are a club member:

- they choose a club,
- they may provide a registry number,
- a `club_memberships` row is created.

If the user selects that they are not a club member, or continues without selecting a club:

- no `club_memberships` row is created,
- the user is treated as an independent user.

Rules:

- Independent users can create personal activity records.
- Independent users' activities are not included in official club exports.
- A user may add a club later.

UI recommendation:

- Avoid vague wording such as `Skip`.
- Prefer wording such as `Continue without club` or `I am not a member of a club`.

---

## 6. Official vs personal activities

The `activities` table contains:

```text
is_official boolean
```

Meaning:

- `is_official = true`: the activity participates in the official club records and may be included in the EOOA export.
- `is_official = false`: the activity is personal or excluded from official export.

Important rule:

- `is_official = false` can apply both to independent users and to users who are members of a club.

Examples:

```text
Independent user:
club_id = null
is_official = false
```

```text
Club member choosing personal record:
club_id = <club id>
is_official = false
```

```text
Club member choosing official record:
club_id = <club id>
is_official = true
```

Admin export filtering:

```text
club_id = selected club
AND is_official = true
```

The UI should provide the official/personal choice in all three activity forms.

---

## 7. Activity points

The `activities` table contains:

```text
points numeric(10,2) null
```

Rules:

- For official activities, points are calculated on submit.
- For personal activities, points may remain `null` and do not need to be shown to the user.
- Personal records should be more flexible than official records.

Validation rule:

- If `is_official = true`, all fields required for EOOA scoring and export must be present.
- If `is_official = false`, validation may be more relaxed and `points` may stay `null`.

---

## 8. Draft feature

The MVP will not implement draft activities.

Therefore, the `activities` table currently does not include a `status` field.

Future extension:

```text
status varchar(30)
```

Possible values:

- `draft`
- `submitted`

This is out of scope for the MVP.

---

## 9. Admin export behavior

Exports are generated per club.

A club admin can choose which users should be included in the generated Excel file. The admin can uncheck entire users in the export modal.

Important rule:

- Selected users are not stored in the database for the MVP.
- The selected users are a temporary input to the export request.

Export query logic:

```text
club_id = <admin club id>
AND is_official = true
AND user_id IN selected_user_ids
```

This selection does not modify the original activity records.

Future extension:

If export history/audit is needed, add:

- `exports`
- `export_users`

This is out of scope for the MVP.

---

## 10. Routes and Rock Climbing

The `routes` table is mainly introduced for Rock Climbing.

Rock climbing has many route records, and users should be able to select an existing route or create a new one if it does not exist.

Rules:

- The user must not type a free-text route name directly in the final climbing activity form.
- The user must either select an existing `Route` or create a new `Route` through the Add Route modal.
- After creating a new Route, the user returns to the climbing form with the route fields prefilled.
- Every `climbing_activity_details` row must have a `route_id`.

Schema rule:

```text
climbing_activity_details.route_id uuid > routes.id
```

---

## 11. Locked route identity fields in the climbing form

After the user selects or creates a Route, the route identity fields are read-only in the activity form.

Read-only fields:

- Route name
- Mountain / Area
- Climbing field

Rules:

- Route identity fields must not be edited from the activity form.
- If a Route needs to be corrected, renamed, or merged, this must happen at Route level by an authorized administrator.
- Route editing/merging UI is not part of the MVP.

---

## 12. Route snapshots in climbing activities

Even though `climbing_activity_details` contains `route_id`, it also stores snapshot fields:

- `route_name`
- `mountain_or_area`
- `climbing_field`

Reason:

- `route_id` points to the canonical Route.
- Snapshot fields preserve what the route data looked like at the time of the activity submission.

This is useful if a route is later renamed, corrected, or merged by an admin.

---

## 13. Normalized route name

The `routes` table contains:

```text
normalized_name varchar(255)
```

This is a technical field and must not be shown to the user.

Purpose:

- reduce duplicate route records,
- detect routes that differ only by case, whitespace, or minor formatting.

Example:

```text
name = " Interstellar "
normalized_name = "interstellar"
```

Backend duplicate checking can use:

```text
normalized_name + mountain_or_area + climbing_field
```

Future extension:

- Add fuzzy matching to detect near-duplicate route names.

---

## 14. Creating a new Route

The Add Route modal must require:

- route name,
- mountain / area,
- climbing field,
- difficulty scale,
- difficulty grade.

Optional fields in the Route modal:

- altitude,
- route length.

Reason:

- Users may know the route but not know altitude or route length at the moment of creation.
- The system should not block route creation for missing optional technical data.

Schema rule in `routes`:

```text
altitude integer null
route_length numeric(8,2) null
```

However, altitude and route length may still be required in an official climbing activity.

---

## 15. Altitude and route length in climbing

In `routes`:

```text
altitude integer null
route_length numeric(8,2) null
```

In `climbing_activity_details`:

```text
altitude integer
route_length numeric(8,2)
```

Rules:

- In a Route, altitude and route length are optional defaults.
- In an official climbing Activity, altitude and route length are required.
- If the selected Route has altitude or route length, these values are prefilled in the activity form.
- If the selected Route does not have them, the user must fill them before submitting an official activity.
- If the user changes altitude or route length in the activity form, this changes only the activity snapshot, not the canonical Route.

---

## 16. Difficulty scale and grade

The Add Route modal contains a difficulty scale and difficulty grade.

The UI default for climbing may be the French scale, because climbers commonly use it.

The backend must map the selected difficulty to the scale required by the EOOA Excel template.

The `grade_mappings` table supports this conversion.

Rules:

- The user can choose their preferred difficulty scale.
- Backend maps the user-selected difficulty to the required export/scoring scale.
- For French grades, the preferred flow is:

```text
French grade -> UIAA/Alpine grade -> EOOA coefficient
```

Example:

```text
difficulty_scale = "french"
difficulty_grade = "6c"
mapped_scale = "uiaa"
mapped_grade = "VII+"
difficulty_coefficient = coefficient for VII+
```

The mapping must be implemented as a stable mapping table. Climbing grade conversions are approximate and should not be treated as mathematically exact.

---

## 17. Mixed / ice climbing

The system does not store `default_mixed` in the `routes` table.

Reason:

- Mixed/ice grades are special cases.
- They should not overload the Add Route modal.
- They belong to a specific activity record rather than the canonical Route.

The `climbing_activity_details` table contains:

```text
difficulty_scale varchar(30) null
difficulty_grade varchar(50) null
mapped_scale varchar(30) null
mapped_grade varchar(50) null
mixed_climbing varchar(50) null
```

Rules:

- The user may fill regular difficulty (`difficulty_scale` + `difficulty_grade`).
- The user may fill mixed/ice difficulty (`mixed_climbing`).
- The user may fill both.
- The user may not leave all difficulty fields empty.

Validation rule:

At least one of the following must be true:

1. `difficulty_scale` and `difficulty_grade` are both present.
2. `mixed_climbing` is present.

Additional rule:

- `difficulty_scale` and `difficulty_grade` must be treated as a pair.
- It is invalid to provide only `difficulty_scale` without `difficulty_grade`.
- It is invalid to provide only `difficulty_grade` without `difficulty_scale`.

UI note:

- The UI label can remain `ΜΙΚΤΑ` to match the Excel/template terminology.
- Helper text should clarify that this field also supports ice grades, e.g. `M4` or `WI4`.

Export rule:

- If only `mixed_climbing` exists and regular difficulty is null, export `ΒΔ(UIAA/Alpine)` as `Επιλογή` and export `ΜΙΚΤΑ` with the mixed/ice grade.
- If only regular difficulty exists, export `ΜΙΚΤΑ` as `Επιλογή`.

---

## 18. Backend values vs Excel labels

Backend values should be normalized and should not be stored in uppercase just because the Excel template uses uppercase Greek labels.

Example backend values:

```text
season = "winter"
season = "summer"
repetition_type = "repeat"
repetition_type = "new"
organization_type = "other_continents"
```

Excel export mapping examples:

```text
"winter" -> "ΧΕΙΜΕΡΙΝΗ"
"summer" -> "ΘΕΡΙΝΗ"
"repeat" -> "ΕΠΑΝΑΛΗΨΗ"
"new" -> "ΝΕΑ"
"other_continents" -> "ΑΛΛΕΣ ΗΠΕΙΡΟΙ"
```

Technical/default Excel values such as `Επιλογή` or `0` should not be shown as real UI choices unless explicitly required for export compatibility.

---

## 19. Modifying Routes

Routes may be modified only by authorized administrators.

Rules:

- Regular users can create a new Route when it does not already exist.
- Regular users cannot rename or merge Routes.
- Route correction, renaming, and merging are admin operations.

This supports data quality and reduces duplicate or incorrect route records.

Route merge UI is not part of the MVP.

---

## 20. Timestamps

The main tables include timestamps:

- `users`
- `clubs`
- `activities`
- `routes`

Fields:

```text
created_at timestamp def(now())
updated_at timestamp def(now())
```

Meaning:

- `created_at`: when the record was created.
- `updated_at`: when the record was last updated.

Detail tables do not need separate timestamps for the MVP because they are tied to their parent `activities` record.

---

## 21. Organization type helper text

For Expedition activities, `organization_type` must be clear in the UI.

Helper text:

```text
Συμπληρώνεται μόνο όταν η αποστολή έχει οργανωθεί από τον σύλλογο. Διαφορετικά, επιλέξτε "Όχι".
```

Meaning:

- If the expedition was organized by the user's club, choose the relevant continent.
- Otherwise, choose `no`.

---

## 22. MVP scope

For the MVP, focus on:

1. All three activity forms working correctly.
2. Correct official vs personal activity behavior.
3. Correct EOOA scoring for official activities.
4. Correct Excel export per club.
5. Rock climbing route selection/creation.

Out of scope for MVP:

- draft activities,
- export history,
- route merge UI,
- membership approval workflow,
- full moderation workflow for route corrections.

---

## 23. Core database tables

Current core tables:

- `users`
- `clubs`
- `club_memberships`
- `activities`
- `routes`
- `hiking_activity_details`
- `climbing_activity_details`
- `expedition_activity_details`
- `grade_mappings`

General logic:

- `users` create activities and routes.
- `clubs` have memberships and activities.
- `activities` store the common activity fields.
- detail tables store category-specific fields.
- `routes` store canonical climbing routes.
- `grade_mappings` supports difficulty conversion.
