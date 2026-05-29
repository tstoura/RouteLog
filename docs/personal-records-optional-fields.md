# Personal Records — Optional Fields

**Status:** Phase A implemented. Phase B (nullable migrations) pending.  
**Phase A completed:** Post E2E Round 1 + climbing numeric/difficulty validation fixes.

---

## Context

Personal records are not exported to EOOA and do not calculate official points.
If a difficulty value is provided it must still come from valid dropdown values —
custom/arbitrary difficulty strings are not allowed even for personal records.

### Phase A summary (implemented)

- Official records remain strict and unchanged.
- DB columns remain `NOT NULL` (no migrations).
- Missing optional text fields are stored as `""` (empty string).
- Missing optional numeric fields are stored as `0` (Phase A sentinel).
- The UI displays `"—"` or omits rows entirely for missing personal values.
- Difficulty values, when provided, are validated against the same backend constants as
  official records (`CLIMBING_UIAA_GRADES`, `CLIMBING_FRENCH_GRADES`, `CLIMBING_MIXED_GRADES`).

### Phase B (pending)

Make sentinel columns nullable via Prisma migration so `NULL` can be stored instead of
`0`/`""`. This allows cleaner queries and removes ambiguity between "user entered 0"
and "user left blank". See §DB migration table below for affected columns.

---

## 1. Current required fields per category (personal records — Phase A state)

### Hiking

All `hiking_activity_details` columns are currently `NOT NULL`.
The DTO therefore requires all of them unconditionally.

| Field | Why required today | DB column |
|---|---|---|
| `date` | DTO `@IsDateString` always | – |
| `mountain` | DTO `@IsNotEmpty` always | `NOT NULL` |
| `startPoint` | DTO `@IsNotEmpty` always | `NOT NULL` |
| `endPoint` | DTO `@IsNotEmpty` always | `NOT NULL` |
| `maxAltitude` | DTO `@IsInt @Min(0)` always (frontend sends `0` as fallback) | `NOT NULL` |
| `totalElevationGain` | DTO `@IsInt @Min(0)` always (frontend sends `0` as fallback) | `NOT NULL` |
| `distanceLength` | DTO `@IsNumber @Min(0)` always (frontend sends `0`) | `NOT NULL` |
| `fieldType` | DTO `@IsNotEmpty` always (frontend pre-selects `'normal'`) | `NOT NULL` |
| `difficultyGrade` | DTO `@IsNotEmpty` always (frontend pre-selects `'hiking'`) | `NOT NULL` |
| `participantsNum` | DTO `@IsInt @Min(1)` always (frontend defaults to 1) | `NOT NULL` |

The service's `maxAltitude > 0`, `totalElevationGain > 0`, and `fieldType`/`difficultyGrade`
allowed-value checks run only inside `if (dto.isOfficial)` — personal bypasses them.

---

### Climbing

Several `climbing_activity_details` columns are already nullable in the schema.

| Field | Why required today | DB column |
|---|---|---|
| `date` | DTO always | – |
| `routeId` | DTO `@IsUUID` always | FK `NOT NULL` |
| `season` | DTO `@IsNotEmpty` always (radio always has a default) | `NOT NULL` |
| `repetitionType` | DTO `@IsNotEmpty` always (radio always has a default) | `NOT NULL` |
| `altitude` | DTO `@IsInt @Min(1)` always — frontend sends `Number(altitude) \|\| 1` | `NOT NULL` |
| `routeLength` | DTO `@IsNumber @Min(0.01)` always — frontend sends `Number(routeLength) \|\| 0.01` | `NOT NULL` |
| `participantsNum` | DTO `@IsInt @Min(1)` always (defaults to 1) | `NOT NULL` |
| `participantsText` | Service stores `''` via `?? ''`; DTO now conditional (fixed E2E R1) | `NOT NULL` |
| `difficultyScale` | **Already optional** in DTO and DB | `NULL` ✓ |
| `difficultyGrade` | **Already optional** | `NULL` ✓ |
| `mixedClimbing` | **Already optional** | `NULL` ✓ |
| `completionType` | **Already optional** | `NULL` ✓ |

The service validates `season` and `repetitionType` for **all** records (personal too)
because they are non-nullable and come from a fixed allowed set.
**Phase A implemented:** `altitude` and `routeLength` are now optional for personal records.
Empty personal fields omit the values from the payload; the backend stores `0` as a Phase A
sentinel. Ghost values `1` / `0.01` no longer appear in new personal records.
History/Detail pages show `"—"` for `altitude = 0` and `routeLength = 0` on personal cards.

---

### Expedition

All `expedition_activity_details` columns are currently `NOT NULL`.

| Field | Why required today | DB column |
|---|---|---|
| `date` | DTO always | – |
| `country` | DTO `@IsNotEmpty` always | `NOT NULL` |
| `mountainRange` | DTO `@IsNotEmpty` always | `NOT NULL` |
| `mountain` | DTO `@IsNotEmpty` always | `NOT NULL` |
| `summit` | DTO `@IsNotEmpty` always | `NOT NULL` |
| `routeName` | DTO `@IsNotEmpty` always | `NOT NULL` |
| `season` | DTO `@IsNotEmpty` always (pre-selected `'summer'`) + service validates for all | `NOT NULL` |
| `altitude` | DTO `@IsInt @Min(1)` always (frontend sends `Number(altitude) \|\| 0`) | `NOT NULL` |
| `totalElevationGain` | DTO `@IsInt @Min(0)` always (frontend sends `Number(…) \|\| 0`) | `NOT NULL` |
| `difficultyGrade` | DTO `@IsNotEmpty` always — **`useState('')` means personal currently BROKEN** | `NOT NULL` |
| `participantsNum` | DTO `@IsInt @Min(1)` always (defaults to 1) | `NOT NULL` |
| `organizationType` | DTO `@IsNotEmpty` always + service validates for all — payload fallback `\|\| 'no'` | `NOT NULL` |

> **Phase A implemented:** `difficultyGrade` for Expedition is now optional for personal
> records. The bug is fixed. Personal expedition submissions with empty `difficultyGrade`
> succeed. `difficultyGrade` is stored as `""` (empty string) for personal records when omitted.

---

## 2. Proposed required fields for personal records

### Hiking

| Field | Personal required? | Rationale |
|---|---|---|
| `date` | ✓ | Always |
| `mountain` | ✓ | Minimum useful data |
| `startPoint` | Optional | Not always known for a personal diary entry |
| `endPoint` | Optional | Same |
| `maxAltitude` | Optional (store 0) | No scoring for personal; useful if known |
| `totalElevationGain` | Optional (store 0) | Same |
| `distanceLength` | Optional (store 0) | Same |
| `fieldType` | Optional (keep pre-selected default `'normal'`) | Pre-selection avoids UX friction |
| `difficultyGrade` | Optional (keep pre-selected default `'hiking'`) | Same; could be dropped fully with Phase B migration |
| `participantsNum` | ✓ (default 1) | Trivial; always at least the submitting user |

### Climbing

| Field | Personal required? | Rationale |
|---|---|---|
| `date` | ✓ | Always |
| `routeId` | ✓ | Climbing activities are always tied to a canonical route |
| `season` | Optional (keep radio default `'summer'`) | Default covers the common case; no UX friction |
| `repetitionType` | Optional (keep radio default `'new'`) | Same |
| `altitude` | Optional (omit / store null) | Ghost value `1` is misleading in a personal diary |
| `routeLength` | Optional (omit / store null) | Ghost value `0.01` is misleading |
| `participantsNum` | ✓ (default 1) | Trivial |
| `participantsText` | Already optional ✓ | Fixed in E2E Round 1 |
| `difficultyScale/Grade` | Already optional ✓ | Already correct |
| `mixedClimbing` | Already optional ✓ | Already correct |
| `completionType` | Already optional ✓ | Already correct |

### Expedition

| Field | Personal required? | Rationale |
|---|---|---|
| `date` | ✓ | Always |
| `country` | ✓ | Minimum geographic context |
| `mountain` | ✓ | Minimum context |
| `mountainRange` | Optional | Not always known or relevant |
| `summit` | Optional | May not have reached the summit |
| `routeName` | Optional | Not every personal climb has a named route |
| `season` | Optional (keep pre-selected default `'summer'`) | Pre-selection is fine |
| `altitude` | Optional (store 0 or null) | No scoring for personal |
| `totalElevationGain` | Optional (store 0 or null) | No scoring for personal |
| `difficultyGrade` | Optional (**current bug to fix**) | No scoring; must allow empty selection |
| `participantsNum` | ✓ (default 1) | Trivial |
| `organizationType` | Optional (auto `'no'`) | For personal, `'no'` is always correct; hide field for personal |

---

## 3. Official records — no relaxation

All currently required fields for official records stay required.
Service guards (`altitude > 0`, `totalElevationGain > 0`, `fieldType` in allowed set,
`difficultyGrade` in allowed set, etc.) are untouched.

---

## 4. Schema impact per field

### Frontend-only change is enough

The DB already accepts the value being stored; no DTO or migration change needed.

| Category | Field | Why no further change needed |
|---|---|---|
| Hiking | `maxAltitude` | DTO already `@Min(0)`; `NOT NULL` can store `0` |
| Hiking | `totalElevationGain` | Same |
| Hiking | `distanceLength` | DTO already `@Min(0)` |
| Hiking | `fieldType` | Pre-selected default `'normal'` always sent |
| Hiking | `difficultyGrade` | Pre-selected default `'hiking'` always sent |
| Climbing | `season` | Radio always has a valid default |
| Climbing | `repetitionType` | Radio always has a valid default |
| Expedition | `organizationType` | Payload already falls back to `'no'` |
| Expedition | `season` | Pre-selected default always sent |
| Expedition | `totalElevationGain` | DTO `@Min(0)`; send `0` |

### DTO + service change needed (no DB migration required)

PostgreSQL `NOT NULL VARCHAR` columns can legally store `''` (empty string).
Phase A uses this to avoid a migration while making fields optional.

| Category | Field | What to change |
|---|---|---|
| Hiking | `startPoint` | DTO: `@ValidateIf((o) => o.isOfficial === true)` before `@IsNotEmpty`. Service: store `dto.startPoint \|\| ''`. |
| Hiking | `endPoint` | Same pattern |
| Expedition | `mountainRange` | DTO: official-only `@IsNotEmpty`. Service: store `dto.mountainRange \|\| ''`. |
| Expedition | `summit` | Same |
| Expedition | `routeName` | Same |
| Expedition | `difficultyGrade` | DTO: `@ValidateIf((o) => o.isOfficial === true)` before `@IsNotEmpty`. Service: validate allowed values inside `if (dto.isOfficial)` only; store `dto.difficultyGrade \|\| ''`. **This also fixes the active bug.** |

### DB migration needed for clean `NULL` values (Phase B)

| Category | Field | Current column | Proposed |
|---|---|---|---|
| Hiking | `startPoint` | `VARCHAR NOT NULL` | `VARCHAR NULL` |
| Hiking | `endPoint` | `VARCHAR NOT NULL` | `VARCHAR NULL` |
| Hiking | `maxAltitude` | `INT NOT NULL` | `INT NULL` |
| Hiking | `totalElevationGain` | `INT NOT NULL` | `INT NULL` |
| Hiking | `distanceLength` | `DECIMAL NOT NULL` | `DECIMAL NULL` |
| Hiking | `fieldType` | `VARCHAR NOT NULL` | `VARCHAR NULL` (if we want to drop the default) |
| Hiking | `difficultyGrade` | `VARCHAR NOT NULL` | `VARCHAR NULL` (same) |
| Climbing | `altitude` | `INT NOT NULL` | `INT NULL` |
| Climbing | `routeLength` | `DECIMAL NOT NULL` | `DECIMAL NULL` |
| Expedition | `mountainRange` | `VARCHAR NOT NULL` | `VARCHAR NULL` |
| Expedition | `summit` | `VARCHAR NOT NULL` | `VARCHAR NULL` |
| Expedition | `routeName` | `VARCHAR NOT NULL` | `VARCHAR NULL` |
| Expedition | `altitude` | `INT NOT NULL` | `INT NULL` |
| Expedition | `totalElevationGain` | `INT NOT NULL` | `INT NULL` |
| Expedition | `difficultyGrade` | `VARCHAR NOT NULL` | `VARCHAR NULL` |

---

## 5. History / Detail / Export impact

**History list** — Cards in `HistoryPage` already render `'—'` for null/missing values via
`ActivityDetailPage`'s mapping helpers (`?? '—'`). Phase A (empty string `''`) will display
as blank; phase B (null) will be caught by `?? '—'` fallbacks. No structural changes needed.

**Activity detail** — `buildDetailModel` in `ActivityDetailPage.tsx` already uses `?? '—'`
for optional climbing fields. For newly optional hiking/expedition fields (e.g. `startPoint`,
`summit`) the mapper should use `field || '—'` rather than passing the value directly.

**Export** — Personal records (`isOfficial = false`) are excluded from the EOOA Excel export
entirely. No export impact for any personal field becoming optional, regardless of phase.

---

## 6. Recommended implementation strategy

### Phase A — Fix bugs + DTO/service relaxations (no DB migration) ✅ COMPLETED

**Priority 1 (bug fix — completed):**
- Expedition `difficultyGrade`: now `@ValidateIf` for personal; stored as `""` when omitted.

**Priority 2 (UX improvement — completed):**
- Hiking: `startPoint`/`endPoint` optional for personal; stored as `""`.
- Expedition: `mountainRange`/`summit`/`routeName` optional for personal; stored as `""`.
- Expedition frontend: `organizationType` hidden for personal (auto-sends `'no'`).
- Climbing: `altitude`/`routeLength` optional for personal; stored as `0`.
- Climbing: all difficulty fields already optional; grade validation added for personal.

**Climbing difficulty validation (completed, separate phase):**
- Personal climbing with no difficulty is valid.
- If difficulty is provided for personal records, values must be from allowed backend lists.
- Invalid grades (e.g. arbitrary strings) return `422` for both official and personal.
- French grades for personal are validated against `CLIMBING_FRENCH_GRADES` (no DB lookup).

### Phase B — DB migrations for clean nullable columns

Single migration making identified columns nullable (see table above).
Update DTO `@Min` and `@IsNotEmpty` validators to be conditional on `isOfficial`.
Update service Prisma writes to use `?? null` instead of `?? 0` / `?? ''`.

### Phase C — UI polish

- Display `'—'` consistently for all null/empty optional fields in History and Detail.
- Update field label/hint text to communicate optional vs required context.
- Optionally collapse technical section for personal records by default.

---

## 7. Proposed final field table

| Category | Field | Currently required? | Personal required? | Official required? | Needs DB migration? | Notes |
|---|---|---|---|---|---|---|
| Hiking | date | ✓ | ✓ | ✓ | No | |
| Hiking | mountain | ✓ | ✓ | ✓ | No | |
| Hiking | startPoint | ✓ | Optional | ✓ | Phase B | Phase A: store `''` |
| Hiking | endPoint | ✓ | Optional | ✓ | Phase B | Phase A: store `''` |
| Hiking | maxAltitude | ✓ (sends 0) | Optional | ✓ | Phase B | Currently stores `0` for personal |
| Hiking | totalElevationGain | ✓ (sends 0) | Optional | ✓ | Phase B | Same |
| Hiking | distanceLength | ✓ (sends 0) | Optional | ✓ | Phase B | Same |
| Hiking | fieldType | ✓ (pre-selected) | Optional (default `'normal'`) | ✓ | Phase B if null wanted | Pre-select avoids UX issue |
| Hiking | difficultyGrade | ✓ (pre-selected) | Optional (default `'hiking'`) | ✓ | Phase B if null wanted | Pre-select avoids UX issue |
| Hiking | participantsNum | ✓ | ✓ (default 1) | ✓ | No | |
| Climbing | date | ✓ | ✓ | ✓ | No | |
| Climbing | routeId | ✓ | ✓ | ✓ | No | Route required for all climbing |
| Climbing | season | ✓ (radio default) | Optional (default `'summer'`) | ✓ | No | Radio default always valid |
| Climbing | repetitionType | ✓ (radio default) | Optional (default `'new'`) | ✓ | No | Same |
| Climbing | altitude | ✓ (ghost `1`) | Optional | ✓ | Phase B | Ghost value `1` is misleading |
| Climbing | routeLength | ✓ (ghost `0.01`) | Optional | ✓ | Phase B | Ghost value `0.01` misleading |
| Climbing | participantsNum | ✓ | ✓ (default 1) | ✓ | No | |
| Climbing | participantsText | Fixed (stores `''`) | Optional | Required if num > 1 | No | Fixed E2E Round 1 |
| Climbing | difficultyScale | Optional ✓ | Optional ✓ | ✓ | No | Already correct |
| Climbing | difficultyGrade | Optional ✓ | Optional ✓ | ✓ | No | Already correct |
| Climbing | mixedClimbing | Optional ✓ | Optional ✓ | One of scale/mixed | No | Already correct |
| Climbing | completionType | Optional ✓ | Optional ✓ | Optional | No | Already correct |
| Expedition | date | ✓ | ✓ | ✓ | No | |
| Expedition | country | ✓ | ✓ | ✓ | No | |
| Expedition | mountain | ✓ | ✓ | ✓ | No | |
| Expedition | mountainRange | ✓ | Optional | ✓ | Phase B | Phase A: store `''` |
| Expedition | summit | ✓ | Optional | ✓ | Phase B | Phase A: store `''` |
| Expedition | routeName | ✓ | Optional | ✓ | Phase B | Phase A: store `''` |
| Expedition | season | ✓ (pre-selected) | Optional (default `'summer'`) | ✓ | No | Pre-select avoids issue |
| Expedition | altitude | ✓ (sends 0, fails Min 1) | Optional | ✓ | Phase B | DTO `@Min(1)` blocks 0; needs DTO fix too |
| Expedition | totalElevationGain | ✓ (sends 0) | Optional | ✓ | Phase B | |
| Expedition | difficultyGrade | ✓ (**BROKEN for personal**) | Optional | ✓ | Phase A: DTO fix | **Active bug — top priority** |
| Expedition | participantsNum | ✓ | ✓ (default 1) | ✓ | No | |
| Expedition | organizationType | ✓ (payload `\|\| 'no'`) | Optional (auto `'no'`) | ✓ | No | Frontend hides it for personal |

---

## Immediate action — resolved

~~Expedition `difficultyGrade` bug~~ — **Fixed in Phase A.** Personal expedition records
now submit successfully with an empty `difficultyGrade`. No migration was required.

---

## Current personal required fields (Phase A state)

| Category | Always required for personal |
|---|---|
| Hiking | `date`, `mountain`, `participantsNum` (default 1) |
| Climbing | `date`, `routeId`, `participantsNum` (default 1) |
| Expedition | `date`, `country`, `mountain`, `participantsNum` (default 1) |
