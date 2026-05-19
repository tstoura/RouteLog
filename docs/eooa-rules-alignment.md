# EOOA Rules Alignment

This document summarizes how RouteLog aligns its backend validation, scoring logic, and Excel export behavior with the EOOA activity scoring rules and Excel template.

The backend should treat this document as a source of truth for:

- official activity validation rules,
- scoring formulas,
- coefficient mappings,
- UI-to-backend values,
- backend-to-Excel export mappings.

The application should store normalized backend values, not necessarily the uppercase Greek labels used in the EOOA Excel template. Uppercase Greek labels are applied only during Excel export.

Example:

```text
Backend value: winter
UI label: Χειμερινή
Excel export value: ΧΕΙΜΕΡΙΝΗ
```

---

## 1. General Rules

### 1.1 Official vs personal activities

The `activities.is_official` field determines whether an activity participates in the official export and scoring process.

```text
is_official = true
→ The activity participates in official club records and can be exported to the EOOA Excel file.

is_official = false
→ The activity is personal and is not exported.
```

The `points` field is nullable:

```text
points numeric(10,2) null
```

For official activities, points are calculated during submission. For personal activities, points may remain `null` and do not need to be shown to the user.

### 1.2 Validation strictness

Official activities are validated strictly because they must support scoring and Excel export.

Personal activities may be more flexible, especially when the user wants to keep a private record. The exact relaxed validation rules can be implemented later, but official activities must always satisfy the rules in this document.

### 1.3 Technical/default Excel values

Some dropdown values in the EOOA Excel template, such as:

```text
Επιλογή
0
```

are treated as technical/default Excel values. They should generally not be exposed as valid UI options unless explicitly required.

During export, the backend may write such values into the Excel file only when needed for compatibility with the template.

---

## 2. Hiking / Ski Mountaineering

This corresponds to the category:

```text
Ορειβασία / Ορειβατικό Σκι
```

Backend category value:

```text
hiking
```

### 2.1 EOOA / Excel fields

The EOOA Excel template expects the following fields:

```text
Α/Α
ΗΜ/ΝΙΑ
ΒΟΥΝΟ
ΑΦΕΤΗΡΙΑ
ΚΟΡΥΦΗ / ΤΕΡΜΑΤΙΣΜΟΣ
ΜΕΓΙΣΤΟ ΥΨΟΜ.
ΣΥΑ
ΜΗΚΟΣ
ΠΕΔΙΟ
ΒΑΘ. ΔΥΣΚ.
ΑΤΟΜΑ
ΒΑΘΜΟΙ
```

Database mapping:

```text
activities.date                         → ΗΜ/ΝΙΑ
hiking_activity_details.mountain         → ΒΟΥΝΟ
hiking_activity_details.start_point      → ΑΦΕΤΗΡΙΑ
hiking_activity_details.end_point        → ΚΟΡΥΦΗ / ΤΕΡΜΑΤΙΣΜΟΣ
hiking_activity_details.max_altitude     → ΜΕΓΙΣΤΟ ΥΨΟΜ.
hiking_activity_details.total_elevation_gain → ΣΥΑ
hiking_activity_details.distance_length  → ΜΗΚΟΣ
hiking_activity_details.field_type       → ΠΕΔΙΟ
hiking_activity_details.difficulty_grade → ΒΑΘ. ΔΥΣΚ.
hiking_activity_details.participants_num → ΑΤΟΜΑ
activities.points                        → ΒΑΘΜΟΙ
```

### 2.2 Field type coefficient

The user selects a field type. The backend maps it to a numeric coefficient.

Allowed backend values:

```text
normal
winter_conditions
ski_mountaineering
```

UI labels:

```text
Κανονικό
Χειμερινών Συνθηκών
Ορειβατικού Σκι
```

Excel export values and coefficients:

```text
normal             → ΚΑΝΟΝΙΚΟ             → 1
winter_conditions  → ΧΕΙΜΕΡΙΝΩΝ ΣΥΝΘΗΚΩΝ  → 1.5
ski_mountaineering → ΟΡΕΙΒΑΤΙΚΟΥ ΣΚΙ      → 1.8
```

Do not expose `0` as a valid UI/backend option. It is treated as a technical/default Excel value.

### 2.3 Difficulty coefficient

For Hiking / Ski Mountaineering, the difficulty grade is a valid user-selected value. `ΠΕΖΟΠΟΡΙΑ` is a real option in this category, not merely a placeholder.

Allowed values and coefficients:

```text
ΠΕΖΟΠΟΡΙΑ → 1
F-        → 1.2
F         → 1.4
F+        → 1.6
PD-       → 1.8
PD        → 2
PD+       → 2.2
AD-       → 2.4
AD        → 2.6
AD+       → 2.8
```

Recommended UI placeholder:

```text
Επιλέξτε βαθμό δυσκολίας
```

The actual UI options should include:

```text
Πεζοπορία
F-
F
F+
PD-
PD
PD+
AD-
AD
AD+
```

### 2.4 Distance factor

The Excel formula uses:

```text
sqrt(max(distance_length / 15, 1))
```

Therefore:

```text
if distance_length <= 15:
    distanceFactor = 1
else:
    distanceFactor = sqrt(distance_length / 15)
```

The database field `distance_length` is required for official hiking activities. It should not be empty for official submissions.

### 2.5 Scoring formula

The Excel formula is equivalent to:

```text
if field_coefficient < 1.7 and participants_num < 3:
    points = 0
else:
    points =
        (max_altitude / 2000)
        * (total_elevation_gain / 1000)
        * sqrt(max(distance_length / 15, 1))
        * field_coefficient
        * difficulty_coefficient
        * sqrt(participants_num)
```

Readable backend version:

```text
fieldCoefficient = getHikingFieldCoefficient(field_type)
difficultyCoefficient = getHikingDifficultyCoefficient(difficulty_grade)
distanceFactor = sqrt(max(distance_length / 15, 1))
participantsFactor = sqrt(participants_num)

if fieldCoefficient < 1.7 and participants_num < 3:
    points = 0
else:
    points =
        (max_altitude / 2000)
        * (total_elevation_gain / 1000)
        * distanceFactor
        * fieldCoefficient
        * difficultyCoefficient
        * participantsFactor
```

### 2.6 Validation rules for official hiking activities

For:

```text
category = hiking
is_official = true
```

Required fields:

```text
date
club_id
mountain
start_point
end_point
max_altitude
total_elevation_gain
distance_length
field_type
difficulty_grade
participants_num
```

Validation constraints:

```text
max_altitude > 0
total_elevation_gain > 0
distance_length >= 0
field_type must be one of: normal, winter_conditions, ski_mountaineering
difficulty_grade must be one of the allowed hiking difficulty grades
participants_num > 0
```

### 2.7 Export rules

Excel export mapping:

```text
date                 → ΗΜ/ΝΙΑ
mountain             → ΒΟΥΝΟ
start_point          → ΑΦΕΤΗΡΙΑ
end_point            → ΚΟΡΥΦΗ / ΤΕΡΜΑΤΙΣΜΟΣ
max_altitude         → ΜΕΓΙΣΤΟ ΥΨΟΜ.
total_elevation_gain → ΣΥΑ
distance_length      → ΜΗΚΟΣ
field_type           → ΚΑΝΟΝΙΚΟ / ΧΕΙΜΕΡΙΝΩΝ ΣΥΝΘΗΚΩΝ / ΟΡΕΙΒΑΤΙΚΟΥ ΣΚΙ
difficulty_grade     → ΠΕΖΟΠΟΡΙΑ / F- / F / ... / AD+
participants_num     → ΑΤΟΜΑ
points               → ΒΑΘΜΟΙ
```

---

## 3. Rock Climbing

This corresponds to the category:

```text
Αναρρίχηση Βράχου
```

Backend category value:

```text
climbing
```

### 3.1 EOOA / Excel fields

The EOOA Excel template expects the following fields:

```text
Α/Α
ΗΜΕΡ/ΝΙΑ
ΒΟΥΝΟ
ΠΕΔΙΟ
ΔΙΑΔΡΟΜΗ
ΕΠΟΧΗ
ΕΠΑΝ./ΝΕΑ
ΥΨΟΜ.
ΒΔ (UIAA/Alpine)
ΜΙΚΤΑ
ΑΝΑΠΤ.
ΑΤΟΜΑ
ΣΥΜ/ΝΤΕΣ
ΒΑΘΜΟΙ
```

Database mapping:

```text
activities.date                              → ΗΜΕΡ/ΝΙΑ
climbing_activity_details.mountain_or_area   → ΒΟΥΝΟ
climbing_activity_details.climbing_field     → ΠΕΔΙΟ
climbing_activity_details.route_name         → ΔΙΑΔΡΟΜΗ
climbing_activity_details.season             → ΕΠΟΧΗ
climbing_activity_details.repetition_type    → ΕΠΑΝ./ΝΕΑ
climbing_activity_details.altitude           → ΥΨΟΜ.
climbing_activity_details.difficulty_grade   → ΒΔ (UIAA/Alpine)
climbing_activity_details.mixed_climbing     → ΜΙΚΤΑ
climbing_activity_details.route_length       → ΑΝΑΠΤ.
climbing_activity_details.participants_num   → ΑΤΟΜΑ
climbing_activity_details.participants_text  → ΣΥΜ/ΝΤΕΣ
activities.points                            → ΒΑΘΜΟΙ
```

### 3.2 Route requirement

Every official climbing activity must be linked to a route.

```text
climbing_activity_details.route_id is required
```

The user cannot freely type the route name in the final activity form. They must either:

1. select an existing route, or
2. create a new route through the “Add Route” modal and then return to the form.

After route selection/creation, these fields are filled from the route and should be read-only in the activity form:

```text
route_name
mountain_or_area
climbing_field
```

Snapshot fields are still stored in `climbing_activity_details` to preserve the historical values used at the time of activity submission.

### 3.3 Season coefficient

Allowed backend values:

```text
summer
winter
```

UI labels:

```text
Θερινή
Χειμερινή
```

Excel export values and coefficients:

```text
summer → ΘΕΡΙΝΗ   → 1
winter → ΧΕΙΜΕΡΙΝΗ → 2
```

Do not expose `Επιλογή` or `0` as valid UI/backend values.

### 3.4 Repetition / new route coefficient

Allowed backend values:

```text
repeat
new
```

UI labels:

```text
Επανάληψη
Νέα
```

Excel export values and coefficients:

```text
repeat → ΕΠΑΝΑΛΗΨΗ → 1
new    → ΝΕΑ        → 3
```

Do not expose `Επιλογή` or `0` as valid UI/backend values.

### 3.5 Regular difficulty coefficients: UIAA / Alpine

The EOOA Excel template uses UIAA / Alpine values for regular climbing difficulty.

Allowed Excel values and coefficients:

```text
Επιλογή → 0

IV     → 4
IV+    → 5
V-     → 6
V      → 7
V+     → 8
VI-    → 9
VI     → 10
VI+    → 11
VII-   → 12
VII    → 13
VII+   → 14
VIII-  → 15
VIII   → 16
VIII+  → 18
IX-    → 20
IX     → 22
IX+    → 24
X-     → 26
X      → 28
X+     → 30
XI-    → 32
XI     → 34
XI+    → 36

D-     → 8
D      → 9
D+     → 10
TD-    → 11
TD     → 12
TD+    → 13
ED-    → 14
ED     → 15
ED+    → 16
```

`Επιλογή` is an Excel template value, not a UI option.

### 3.6 French grade mapping

The UI may allow the user to enter climbing difficulty in the French scale because this is commonly used by climbers.

Recommended mapping flow:

```text
French grade → UIAA/Alpine grade → EOOA coefficient
```

Example:

```text
difficulty_scale = french
difficulty_grade = 6c

mapped_scale = uiaa
mapped_grade = VII+

difficulty_coefficient = getRegularDifficultyCoefficient(VII+)
```

The `grade_mappings` table supports this mapping.

Important: climbing grade conversions are approximate. The backend should use a fixed mapping table selected for the project, not dynamic or ambiguous conversions.

### 3.7 Mixed / ice climbing coefficients

The Excel column is named:

```text
ΜΙΚΤΑ
```

However, the field may represent either mixed climbing grades (`M`) or ice climbing grades (`WI`).

UI recommendation:

```text
Label: ΜΙΚΤΑ
Helper text: Βαθμός μικτής ή παγοαναρριχητικής διαδρομής, π.χ. M4 ή WI4.
```

Backend field:

```text
mixed_climbing varchar(50) null
```

Allowed values and coefficients:

```text
Επιλογή → 0

M1  → 4
M2  → 5
M3  → 6
M4  → 7
M5  → 8
M6  → 9
M7  → 10
M8  → 11
M9  → 12
M10 → 13
M11 → 14
M12 → 15

WI1  → 4
WI2  → 5
WI3  → 6
WI4  → 7
WI5  → 8
WI6  → 9
WI7  → 10
WI8  → 11
WI9  → 12
WI10 → 13
WI11 → 14
WI12 → 15
```

`Επιλογή` is an Excel template value, not a UI option.

### 3.8 Difficulty validation rule

In `climbing_activity_details`, the following fields are nullable:

```text
difficulty_scale varchar(30) null
difficulty_grade varchar(50) null
mapped_scale varchar(30) null
mapped_grade varchar(50) null
mixed_climbing varchar(50) null
```

This is required because a climbing activity may have only a mixed/ice grade and no regular UIAA/Alpine grade.

Validation rule:

```text
At least one of the following must exist:

1. difficulty_scale + difficulty_grade
2. mixed_climbing
```

Additionally:

```text
difficulty_scale and difficulty_grade must be provided together.
It is invalid to provide difficulty_scale without difficulty_grade.
It is invalid to provide difficulty_grade without difficulty_scale.
It is invalid for difficulty_scale, difficulty_grade, and mixed_climbing to all be null.
```

### 3.9 Final difficulty coefficient

When both regular difficulty and mixed/ice difficulty exist, the scoring formula uses the maximum coefficient.

```text
regularDifficultyCoefficient = coefficient from UIAA/Alpine mapping
mixedDifficultyCoefficient = coefficient from M/WI mapping

finalDifficultyCoefficient = max(regularDifficultyCoefficient, mixedDifficultyCoefficient)
```

Examples:

```text
difficulty_grade = VI
mixed_climbing = M4

regularDifficultyCoefficient = 10
mixedDifficultyCoefficient = 7
finalDifficultyCoefficient = 10
```

```text
difficulty_grade = null
mixed_climbing = WI4

regularDifficultyCoefficient = 0
mixedDifficultyCoefficient = 7
finalDifficultyCoefficient = 7
```

### 3.10 Altitude factor

The database stores the actual altitude entered by the user.

```text
altitude = 850
```

It is not changed to 1000 in the database.

For scoring:

```text
altitudeFactor = sqrt(max(altitude / 1000, 1))
```

Examples:

```text
altitude = 850  → altitudeFactor = 1
altitude = 1000 → altitudeFactor = 1
altitude = 2400 → altitudeFactor = sqrt(2.4)
```

### 3.11 Route length factor

The database stores the actual route length entered by the user.

```text
route_length = 60
```

It is not changed to 100 in the database.

For scoring:

```text
routeLengthFactor = max(route_length, 100) / 1500
```

Examples:

```text
route_length = 60  → 100 / 1500
route_length = 100 → 100 / 1500
route_length = 850 → 850 / 1500
```

### 3.12 Season and altitude rule

The EOOA Excel template appears to apply the season coefficient only when:

```text
altitude > 1000
```

Therefore, for compatibility with the official Excel template, the backend should follow the Excel behavior.

### 3.13 Scoring formula

Readable backend version:

```text
seasonCoefficient = season == winter ? 2 : 1
repetitionCoefficient = repetition_type == new ? 3 : 1

regularDifficultyCoefficient =
    difficulty_grade exists
        ? getRegularDifficultyCoefficient(mapped_grade or difficulty_grade)
        : 0

mixedDifficultyCoefficient =
    mixed_climbing exists
        ? getMixedDifficultyCoefficient(mixed_climbing)
        : 0

finalDifficultyCoefficient = max(regularDifficultyCoefficient, mixedDifficultyCoefficient)

altitudeFactor = sqrt(max(altitude / 1000, 1))
routeLengthFactor = max(route_length, 100) / 1500

if altitude > 1000:
    points =
        seasonCoefficient
        * repetitionCoefficient
        * altitudeFactor
        * finalDifficultyCoefficient
        * routeLengthFactor
        * participants_num
else:
    points =
        repetitionCoefficient
        * altitudeFactor
        * finalDifficultyCoefficient
        * routeLengthFactor
        * participants_num
```

### 3.14 Validation rules for official climbing activities

For:

```text
category = climbing
is_official = true
```

Required fields:

```text
date
club_id
route_id
route_name
mountain_or_area
climbing_field
season
repetition_type
altitude
route_length
participants_num
```

Validation constraints:

```text
season must be one of: summer, winter
repetition_type must be one of: repeat, new
altitude > 0
route_length > 0
participants_num > 0
```

Difficulty validation:

```text
Either difficulty_scale + difficulty_grade must exist, or mixed_climbing must exist.
```

If French scale is used:

```text
A mapping to UIAA/Alpine, or directly to an accepted EOOA coefficient, must exist.
```

### 3.15 Export rules

Excel export mapping:

```text
date                 → ΗΜΕΡ/ΝΙΑ
mountain_or_area     → ΒΟΥΝΟ
climbing_field       → ΠΕΔΙΟ
route_name           → ΔΙΑΔΡΟΜΗ
season               → ΘΕΡΙΝΗ / ΧΕΙΜΕΡΙΝΗ
repetition_type      → ΕΠΑΝΑΛΗΨΗ / ΝΕΑ
altitude             → ΥΨΟΜ.
route_length         → ΑΝΑΠΤ.
participants_num     → ΑΤΟΜΑ
participants_text    → ΣΥΜ/ΝΤΕΣ
points               → ΒΑΘΜΟΙ
```

Difficulty export behavior:

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

## 4. Expeditions Abroad

This corresponds to the category:

```text
Αποστολές Εξωτερικού
```

Backend category value:

```text
expedition
```

### 4.1 EOOA / Excel fields

The EOOA Excel template expects the following fields:

```text
Α/Α
ΗΜΕΡ/ΝΙΑ
ΧΩΡΑ
ΟΡΟΣΕΙΡΑ
ΒΟΥΝΟ
ΚΟΡΥΦΗ
ΔΙΑΔΡΟΜΗ
ΕΠΟΧΗ
ΥΨΟΜ.
ΣΥΑ
ΒΔ
ΑΤΟΜΑ
ΟΡΓΑΝΩΣΗ
ΒΑΘΜΟΙ
```

Database mapping:

```text
activities.date                                  → ΗΜΕΡ/ΝΙΑ
expedition_activity_details.country              → ΧΩΡΑ
expedition_activity_details.mountain_range       → ΟΡΟΣΕΙΡΑ
expedition_activity_details.mountain             → ΒΟΥΝΟ
expedition_activity_details.summit               → ΚΟΡΥΦΗ
expedition_activity_details.route_name           → ΔΙΑΔΡΟΜΗ
expedition_activity_details.season               → ΕΠΟΧΗ
expedition_activity_details.altitude             → ΥΨΟΜ.
expedition_activity_details.total_elevation_gain → ΣΥΑ
expedition_activity_details.difficulty_grade     → ΒΔ
expedition_activity_details.participants_num     → ΑΤΟΜΑ
expedition_activity_details.organization_type    → ΟΡΓΑΝΩΣΗ
activities.points                                → ΒΑΘΜΟΙ
```

### 4.2 Season coefficient

Allowed backend values:

```text
summer
winter
```

UI labels:

```text
Θερινή
Χειμερινή
```

Excel export values and coefficients:

```text
summer → ΘΕΡΙΝΗ   → 1
winter → ΧΕΙΜΕΡΙΝΗ → 2
```

There is no separate `ski_mountaineering` option for expeditions. If an expedition was performed in ski-mountaineering conditions, it is treated as `winter`.

Do not expose `Επιλογή` or `0` as valid UI/backend values.

### 4.3 Difficulty coefficient

Expedition difficulty values look similar to hiking difficulty values, but the coefficients are different.

Allowed values and coefficients:

```text
ΠΕΖΟΠΟΡΙΑ → 2
F-        → 2.4
F         → 2.8
F+        → 3.2
PD-       → 3.6
PD        → 4
PD+       → 4.4
AD-       → 4.8
AD        → 5.2
AD+       → 5.6
D-        → 6
D         → 6.4
D+        → 6.8
TD-       → 7.2
TD        → 7.6
TD+       → 8
ED-       → 8.4
ED        → 8.8
ED+       → 9.2
```

Important:

```text
Do not reuse the hiking difficulty coefficient table for expeditions.
```

### 4.4 Altitude and total elevation gain

For official expedition activities:

```text
altitude > 0
total_elevation_gain > 0
```

The scoring formula uses:

```text
sqrt(total_elevation_gain / max(altitude, 1))
```

and:

```text
(altitude / 2000)^2
```

### 4.5 Participants

There is no minimum participant restriction for expeditions.

The Excel formula uses:

```text
sqrt(participants_num)
```

Therefore:

```text
participants_num > 0
```

### 4.6 Organization coefficient

The `organization_type` field is filled only when the expedition was organized by the user’s club.

UI helper text:

```text
Συμπληρώνεται μόνο όταν η αποστολή έχει οργανωθεί από τον σύλλογο. Διαφορετικά, επιλέξτε "Όχι".
```

Allowed backend values:

```text
no
europe
africa
other_continents
```

Excel export values and coefficients:

```text
no               → ΟΧΙ             → 0
europe           → ΕΥΡΩΠΗ          → 4
africa           → ΑΦΡΙΚΗ          → 6
other_continents → ΑΛΛΕΣ ΗΠΕΙΡΟΙ   → 12
```

`Επιλογή` is treated as a technical/default Excel value and should not be exposed as a valid UI option.

The organization coefficient is added at the end of the scoring formula. It is not multiplied by the other factors.

### 4.7 Scoring formula

Readable backend version:

```text
seasonCoefficient = season == winter ? 2 : 1

difficultyCoefficient = getExpeditionDifficultyCoefficient(difficulty_grade)
organizationCoefficient = getOrganizationCoefficient(organization_type)

elevationFactor = sqrt(total_elevation_gain / max(altitude, 1))
altitudeFactor = (altitude / 2000) ^ 2
participantsFactor = sqrt(participants_num)

points =
    seasonCoefficient
    * elevationFactor
    * altitudeFactor
    * difficultyCoefficient
    * participantsFactor
    + organizationCoefficient
```

### 4.8 Validation rules for official expedition activities

For:

```text
category = expedition
is_official = true
```

Required fields:

```text
date
club_id
country
mountain_range
mountain
summit
route_name
season
altitude
total_elevation_gain
difficulty_grade
participants_num
organization_type
```

Validation constraints:

```text
season must be one of: summer, winter
altitude > 0
total_elevation_gain > 0
difficulty_grade must be one of the allowed expedition difficulty grades
participants_num > 0
organization_type must be one of: no, europe, africa, other_continents
```

### 4.9 Export rules

Excel export mapping:

```text
date                 → ΗΜΕΡ/ΝΙΑ
country              → ΧΩΡΑ
mountain_range       → ΟΡΟΣΕΙΡΑ
mountain             → ΒΟΥΝΟ
summit               → ΚΟΡΥΦΗ
route_name           → ΔΙΑΔΡΟΜΗ
season               → ΘΕΡΙΝΗ / ΧΕΙΜΕΡΙΝΗ
altitude             → ΥΨΟΜ.
total_elevation_gain → ΣΥΑ
difficulty_grade     → ΒΔ
participants_num     → ΑΤΟΜΑ
organization_type    → ΟΧΙ / ΕΥΡΩΠΗ / ΑΦΡΙΚΗ / ΑΛΛΕΣ ΗΠΕΙΡΟΙ
points               → ΒΑΘΜΟΙ
```

---

## 5. Implementation Notes for Cursor

### 5.1 Do not expose Excel technical values in the UI

The UI should generally avoid showing:

```text
Επιλογή
0
```

These are Excel/template values. The UI should use clear placeholders and valid user choices.

### 5.2 Apply Excel mapping only during export

Backend values should remain normalized and readable.

Example:

```text
Backend: winter
Excel: ΧΕΙΜΕΡΙΝΗ
```

### 5.3 Add official/personal toggle to all activity forms

The official/personal activity toggle must be available for all three categories:

```text
hiking
climbing
expedition
```

This maps to:

```text
activities.is_official
```

### 5.4 Scoring follows the Excel template

If there is a discrepancy between a textual interpretation and the Excel formula, the backend should follow the Excel template for MVP compatibility with EOOA exports.

### 5.5 Coefficient functions should be isolated

Scoring should be implemented through small, testable helper functions, for example:

```text
getHikingFieldCoefficient(field_type)
getHikingDifficultyCoefficient(difficulty_grade)
getClimbingRegularDifficultyCoefficient(scale, grade)
getClimbingMixedDifficultyCoefficient(mixed_climbing)
getExpeditionDifficultyCoefficient(difficulty_grade)
getExpeditionOrganizationCoefficient(organization_type)
calculateHikingPoints(...)
calculateClimbingPoints(...)
calculateExpeditionPoints(...)
```

### 5.6 Add tests for known edge cases

Important test cases:

```text
Hiking with participants_num < 3 and field_type = normal → points = 0
Hiking with participants_num < 3 and field_type = ski_mountaineering → points calculated
Hiking distance_length <= 15 → distance factor = 1
Climbing with only mixed_climbing → valid
Climbing with only regular difficulty → valid
Climbing with neither regular difficulty nor mixed_climbing → invalid
Climbing with altitude <= 1000 → no season coefficient according to Excel behavior
Climbing route_length < 100 → route length factor uses 100
Expedition organization_type = no → organization coefficient = 0
Expedition organization_type = other_continents → organization coefficient = 12
Expedition participants have no minimum threshold
```
