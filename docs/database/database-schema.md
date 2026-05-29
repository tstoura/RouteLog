# RouteLog Database Schema

This document describes the first version of the RouteLog database schema. It is intended to be used as a reference for backend implementation, Prisma schema design, validation rules, and database-related decisions.

Related reference files:

```text
/docs/database/dbdesigner-markup.txt
/docs/database/RouteLog-schema-postgresql.sql
/docs/database/diagrams/erd-Routelog.png
/docs/database/diagrams/dbdesigner-RouteLog.png
```

The DBDesigner markup and PostgreSQL export are useful references, but the final implementation may be expressed through Prisma models and migrations.

---

## 1. General Design Approach

The database follows a relational structure. The core idea is to separate the common fields of all activity records from the category-specific fields of each activity type.

All activities share a common base table:

```text
activities
```

Each activity belongs to exactly one of the following category-specific detail tables:

```text
hiking_activity_details
climbing_activity_details
expedition_activity_details
```

This structure was chosen because all activity categories share some common fields, such as user, club, date, official/personal status, points, and notes, but each category also has different technical fields.

Activity categories:

```text
hiking      → Hiking / Ski Mountaineering in Greece
climbing    → Rock Climbing
expedition  → Expeditions Abroad
```

In the current schema these values are represented as `varchar`, but in the backend they should be restricted through enums or validation rules.

---

## 2. Tables Overview

The current schema contains the following tables:

```text
users
clubs
club_memberships
activities
routes
hiking_activity_details
climbing_activity_details
expedition_activity_details
grade_mappings
```

High-level responsibility of each table:

```text
users                         stores application users
clubs                         stores mountaineering clubs
club_memberships              connects users with clubs and club-level roles
activities                    stores common activity data
hiking_activity_details       stores hiking/ski-mountaineering-specific fields
climbing_activity_details     stores rock-climbing-specific fields
expedition_activity_details   stores expedition-specific fields
routes                        stores canonical climbing routes
grade_mappings                stores grade conversion mappings between grading scales
```

---

## 3. users

The `users` table stores the core account information of each user.

```text
users {
    id uuid pk
    first_name varchar(100)
    last_name varchar(100)
    email varchar(255) unique
    password_hash text
    system_role varchar(30)
    preferred_activity varchar(30) null
    onboarding_completed boolean
    created_at timestamp def(now())
    updated_at timestamp def(now())
}
```

### Purpose

A user may be:

```text
- a member of a mountaineering club
- a club administrator
- an independent user without club membership
- a super administrator of the application
```

The user is not directly marked as a club member with a boolean field. Instead, club membership is inferred from the existence of a row in `club_memberships`.

### Important fields

```text
system_role
```

Application-level role. Suggested values:

```text
user
super_admin
```

A `super_admin` has access to application-wide administrative functionality. A normal user has `system_role = user`.

```text
preferred_activity
```

Optional user preference used only for personalization. Suggested values:

```text
hiking
climbing
expedition
```

This field must not restrict what the user can do. For example, a user with `preferred_activity = climbing` may still create hiking or expedition records.

```text
onboarding_completed
```

Indicates whether the user has completed or skipped the onboarding flow.

---

## 4. clubs

The `clubs` table stores mountaineering clubs.

```text
clubs {
    id uuid pk
    name varchar(255)
    short_name varchar(100) null
    created_at timestamp def(now())
    updated_at timestamp def(now())
}
```

### Purpose

Clubs are used for:

```text
- associating users with mountaineering clubs
- associating official activities with a club
- generating club-level exports for the federation
```

---

## 5. club_memberships

The `club_memberships` table connects users with clubs.

```text
club_memberships {
    id uuid pk
    user_id uuid > users.id
    club_id uuid > clubs.id
    role varchar(30)
    registry_number varchar(100) null
    created_at timestamp def(now())
    updated_at timestamp def(now())
}
```

### Purpose

This table represents the relationship between a user and a club.

Suggested values for `role`:

```text
member
club_admin
```

A user is considered a club member if they have at least one row in `club_memberships`.

An independent user is a user with no active club membership row.

### Important decision

There is currently no membership approval workflow in the MVP. A club admin does not need to confirm each member before the member can exist in the system.

Instead, the admin can choose which users to include during the export process.

---

## 6. activities

The `activities` table stores fields that are common to all activity categories.

```text
activities {
    id uuid pk
    user_id uuid > users.id
    club_id uuid null > clubs.id
    date date
    category varchar(30)
    is_official boolean
    points numeric(10,2) null
    private_notes text null
    public_notes text null
    created_at timestamp def(now())
    updated_at timestamp def(now())
}
```

### Purpose

Every activity record has one row in `activities` and exactly one matching row in one of the category-specific detail tables.

### Important fields

```text
category
```

Suggested backend values:

```text
hiking
climbing
expedition
```

```text
is_official
```

Determines whether the activity participates in the official club export.

Rules:

```text
is_official = true
→ the activity participates in official club records and can be exported to the federation.

is_official = false
→ the activity is personal and must not be exported.
```

This field can be `false` both for independent users and for users who are members of a club.

Examples:

```text
Independent user:
club_id = null
is_official = false

Club member, personal activity:
club_id = club id
is_official = false

Club member, official activity:
club_id = club id
is_official = true
```

```text
points
```

Nullable because personal activities may not need points. For official activities, points are calculated on submission according to the EOOA rules.

### Export rule

For official export, the backend should query:

```text
club_id = selected club
AND is_official = true
AND user_id IN selected_user_ids
```

The `selected_user_ids` list is not stored in the database for the MVP. It is sent temporarily from the export modal to the backend.

---

## 7. hiking_activity_details

The `hiking_activity_details` table stores fields for Hiking / Ski Mountaineering activities in Greece.

```text
hiking_activity_details {
    activity_id uuid pk > activities.id
    mountain varchar(255)
    start_point varchar(255)
    end_point varchar(255)
    max_altitude integer
    total_elevation_gain integer
    distance_length numeric(8,2)
    field_type varchar(100)
    difficulty_grade varchar(50)
    participants_num integer
}
```

### Purpose

This table stores the technical information required for the first EOOA category.

### Field mapping to Excel

```text
activities.date                       → ΗΜΕΡ/ΝΙΑ
hiking_activity_details.mountain       → ΒΟΥΝΟ
hiking_activity_details.start_point    → ΑΦΕΤΗΡΙΑ
hiking_activity_details.end_point      → ΚΟΡΥΦΗ / ΤΕΡΜΑΤΙΣΜΟΣ
hiking_activity_details.max_altitude   → ΜΕΓΙΣΤΟ ΥΨΟΜ.
hiking_activity_details.total_elevation_gain → ΣΥΑ
hiking_activity_details.distance_length → ΜΗΚΟΣ
hiking_activity_details.field_type      → ΠΕΔΙΟ
hiking_activity_details.difficulty_grade → ΒΑΘ. ΔΥΣΚ.
hiking_activity_details.participants_num → ΑΤΟΜΑ
activities.points                       → ΒΑΘΜΟΙ
```

### Notes

The backend value should not necessarily be stored in uppercase Greek. Instead, use normalized backend values and map them to the exact Excel values during export.

Example:

```text
Backend value: winter_conditions
Excel value: ΧΕΙΜΕΡΙΝΩΝ ΣΥΝΘΗΚΩΝ
```

---

## 8. routes

The `routes` table stores canonical climbing routes.

```text
routes {
    id uuid pk
    created_by_user_id uuid null > users.id
    category varchar(30)
    name varchar(255)
    normalized_name varchar(255)
    mountain_or_area varchar(255)
    climbing_field varchar(255)
    default_scale varchar(30)
    default_grade varchar(50)
    altitude integer null
    route_length numeric(8,2) null
    created_at timestamp def(now())
    updated_at timestamp def(now())
}
```

### Purpose

Routes are mainly used for Rock Climbing.

A user does not freely type the route name when submitting a climbing activity. Instead, the user must either:

```text
1. select an existing route
2. create a new route through the route creation modal
```

After a route is selected or created, its values are used to prefill the climbing activity form.

### normalized_name

`normalized_name` is a technical field used for duplicate prevention and fuzzy matching.

Example:

```text
name = " Interstellar "
normalized_name = "interstellar"
```

The UI should display `name`, not `normalized_name`.

### Optional route fields

In `routes`, the following fields are nullable:

```text
altitude
route_length
```

They are optional during route creation because users may not always know them when adding a new route.

However, for an official climbing activity, `altitude` and `route_length` are required in `climbing_activity_details`.

### Route editing

Normal users can create routes, but route editing, renaming, and merging should be restricted to authorized administrators.

---

## 9. climbing_activity_details

The `climbing_activity_details` table stores Rock Climbing activity details.

```text
climbing_activity_details {
    activity_id uuid pk > activities.id
    route_id uuid > routes.id
    route_name varchar(255)
    mountain_or_area varchar(255)
    climbing_field varchar(255)
    season varchar(30)
    repetition_type varchar(30)
    altitude integer
    difficulty_scale varchar(30) null
    difficulty_grade varchar(50) null
    mapped_scale varchar(30) null
    mapped_grade varchar(50) null
    mixed_climbing varchar(50) null
    route_length numeric(8,2)
    participants_num integer
    participants_text text
}
```

### Purpose

This table stores the technical fields for Rock Climbing activity records.

### Route relationship

Every climbing activity must have a `route_id`.

```text
route_id is required
```

The route is selected from the `routes` table or created before the activity is submitted.

### Route snapshots

Even though the row has a `route_id`, the table also stores snapshot fields:

```text
route_name
mountain_or_area
climbing_field
```

These represent the route identity at the time the activity was submitted.

This is useful because the canonical route may later be renamed, corrected, or merged by an administrator.

### Difficulty fields

The fields below are nullable:

```text
difficulty_scale
difficulty_grade
mapped_scale
mapped_grade
mixed_climbing
```

Validation rule:

```text
At least one of the following must exist:

1. difficulty_scale + difficulty_grade
2. mixed_climbing
```

Additional rule:

```text
difficulty_scale and difficulty_grade must appear together.
It is not valid to submit only one of them.
```

### Mapping

If the user selects the French scale, the backend should map it to a UIAA/Alpine value for EOOA compatibility.

Example:

```text
difficulty_scale = french
difficulty_grade = 6c
mapped_scale = uiaa
mapped_grade = VII+
```

The mapped value is used for:

```text
- points calculation
- Excel export
```

### Mixed / ice climbing

The `mixed_climbing` field can store mixed or ice grades, such as:

```text
M4
WI4
```

The UI may show the label as:

```text
ΜΙΚΤΑ
```

with helper text explaining that the field also covers ice climbing grades.

### Field mapping to Excel

```text
activities.date                         → ΗΜΕΡ/ΝΙΑ
climbing_activity_details.mountain_or_area → ΒΟΥΝΟ
climbing_activity_details.climbing_field   → ΠΕΔΙΟ
climbing_activity_details.route_name       → ΔΙΑΔΡΟΜΗ
climbing_activity_details.season           → ΕΠΟΧΗ
climbing_activity_details.repetition_type  → ΕΠΑΝ./ΝΕΑ
climbing_activity_details.altitude         → ΥΨΟΜ.
climbing_activity_details.mapped_grade or difficulty_grade → ΒΔ(UIAA/Alpine)
climbing_activity_details.mixed_climbing   → ΜΙΚΤΑ
climbing_activity_details.route_length     → ΑΝΑΠΤ.
climbing_activity_details.participants_num → ΑΤΟΜΑ
climbing_activity_details.participants_text → ΣΥΜ/ΝΤΕΣ
activities.points                          → ΒΑΘΜΟΙ
```

Export rules:

```text
If only regular difficulty exists:
ΒΔ(UIAA/Alpine) = mapped_grade or difficulty_grade
ΜΙΚΤΑ = Επιλογή

If only mixed_climbing exists:
ΒΔ(UIAA/Alpine) = Επιλογή
ΜΙΚΤΑ = mixed_climbing

If both exist:
ΒΔ(UIAA/Alpine) = mapped_grade or difficulty_grade
ΜΙΚΤΑ = mixed_climbing
```

---

## 10. expedition_activity_details

The `expedition_activity_details` table stores Expeditions Abroad details.

```text
expedition_activity_details {
    activity_id uuid pk > activities.id
    country varchar(255)
    mountain_range varchar(255)
    mountain varchar(255)
    summit varchar(255)
    route_name varchar(255)
    season varchar(30)
    altitude integer
    total_elevation_gain integer
    difficulty_grade varchar(50)
    participants_num integer
    organization_type varchar(100)
}
```

### Purpose

This table stores the fields required for expeditions abroad.

### Field mapping to Excel

```text
activities.date                              → ΗΜΕΡ/ΝΙΑ
expedition_activity_details.country          → ΧΩΡΑ
expedition_activity_details.mountain_range   → ΟΡΟΣΕΙΡΑ
expedition_activity_details.mountain         → ΒΟΥΝΟ
expedition_activity_details.summit           → ΚΟΡΥΦΗ
expedition_activity_details.route_name       → ΔΙΑΔΡΟΜΗ
expedition_activity_details.season           → ΕΠΟΧΗ
expedition_activity_details.altitude         → ΥΨΟΜ.
expedition_activity_details.total_elevation_gain → ΣΥΑ
expedition_activity_details.difficulty_grade → ΒΔ
expedition_activity_details.participants_num → ΑΤΟΜΑ
expedition_activity_details.organization_type → ΟΡΓΑΝΩΣΗ
activities.points                            → ΒΑΘΜΟΙ
```

### Organization type

`organization_type` is required for official expedition activities.

Suggested backend values:

```text
no
europe
africa
other_continents
```

Excel mapping:

```text
no → ΟΧΙ
europe → ΕΥΡΩΠΗ
africa → ΑΦΡΙΚΗ
other_continents → ΑΛΛΕΣ ΗΠΕΙΡΟΙ
```

UI helper text:

```text
Συμπληρώνεται μόνο όταν η αποστολή έχει οργανωθεί από τον σύλλογο. Διαφορετικά, επιλέξτε "Όχι".
```

---

## 11. grade_mappings

The `grade_mappings` table stores grade conversion mappings between climbing grading systems.

```text
grade_mappings {
    id uuid pk
    source_scale varchar(30)
    source_grade varchar(50)
    target_scale varchar(30)
    target_grade varchar(50)
}
```

### Purpose

This table is mainly used for converting French climbing grades into UIAA/Alpine grades for EOOA compatibility.

Example:

```text
source_scale = french
source_grade = 6c
target_scale = uiaa
target_grade = VII+
```

The target grade is then used to find the EOOA difficulty coefficient.

### Important note

Grade conversion is not always mathematically exact. The application should use a fixed mapping table selected during implementation.

---

## 12. Important Validation Rules

### General official activity rules

For every official activity:

```text
activities.is_official = true
```

then:

```text
club_id is required
points must be calculated
all fields required by the corresponding EOOA category must be present
```

For personal activities:

```text
activities.is_official = false
```

then:

```text
points may be null
activity is not exported
validation can be more flexible
```

### Activity category rule

Each activity must have exactly one detail row in the corresponding detail table.

```text
category = hiking     → one row in hiking_activity_details
category = climbing   → one row in climbing_activity_details
category = expedition → one row in expedition_activity_details
```

### Climbing difficulty rule

For climbing:

```text
Either difficulty_scale + difficulty_grade must exist,
or mixed_climbing must exist.
```

### Export selected users rule

Selected users in the export modal are not stored in the database for the MVP.

They are sent to the backend as a temporary list:

```text
selected_user_ids = [user_id_1, user_id_2, ...]
```

The backend uses them only for the current Excel export.

---

## 13. Future Extensions

The current MVP schema does not include:

```text
- draft activities
- export history
- route merge history
- membership approval workflow
- activity comments as separate entities
- public route reviews as separate entities
```

These can be added later if required.

Possible future tables:

```text
exports
export_users
route_merge_history
activity_comments
route_reviews
```

---

## 14. Implementation Notes

The final implementation should use normalized backend values and explicit mappings to UI and Excel values.

Example:

```text
Backend value: winter
UI label: Χειμερινή
Excel value: ΧΕΙΜΕΡΙΝΗ
```

The database schema may use `varchar` fields at the diagram level, but the backend should enforce allowed values using one of the following:

```text
- TypeScript enums
- Prisma enums
- validation rules
- PostgreSQL check constraints, if needed
```

The Excel export must preserve the exact labels expected by the EOOA template.
