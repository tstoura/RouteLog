# French Grade Mapping — Conservative MVP

**Status:** Implemented  
**Implemented in:** Conservative MVP French mappings phase (post E2E Round 1)

---

## Context

The RouteLog climbing activity form defaults to French scale for route difficulty.
Personal climbing records accept French grades and store them without scoring.
Official climbing records require French grades to resolve to a UIAA/Alpine equivalent
for EOOA point calculation.

The `grade_mappings` table is the runtime source of truth for these resolutions.
The scoring service queries it at activity submission time for official French records.

---

## Conservative MVP Scope

Only the grades needed for the current Patras/demo route set are seeded.
The full French sport-climbing spectrum is **not** covered.

This mapping should be expanded with a verified authoritative source or made
admin-maintainable before the app is used with a broader route catalogue.

---

## MVP Mappings

| French (source) | UIAA (target) | EOOA coefficient |
|---|---|---|
| 5a+ | V+ | 8 |
| 6a | VII- | 12 |
| 6c | VII+ | 14 |
| 6c+ | VIII- | 15 |
| 7a | VIII | 16 |
| 7a+ | VIII+ | 18 |
| 7b+ | IX- | 20 |
| 8a | X- | 26 |
| 8a+ | X- | 26 |
| 8b | X | 28 |
| 8b+ | X+ | 30 |

Coefficients come from the EOOA Excel UIAA Β.Δ. coefficient table
(`CLIMBING_UIAA_COEFFICIENTS` in `server/src/scoring/constants/climbing.constants.ts`).

---

## Approximation Disclaimer

French ↔ UIAA grade conversion is inherently approximate.
Different authoritative sources (UIAA, national federations, published charts)
disagree on specific half-grade values (e.g. 7a+, 7b+).

These mappings represent a best-effort application assumption for the Patras/demo route set.
They are **not** an official EOOA-approved conversion table.

---

## Runtime Behavior

### Official climbing with French grade (mapped)

1. Activity submitted with `difficultyScale="french"` and a mapped grade (e.g. `"6c"`).
2. `activities.service.ts` calls `ScoringService.resolveClimbingGrade("6c")`.
3. Service queries `grade_mappings` for `{ sourceScale:"french", sourceGrade:"6c", targetScale:"uiaa" }`.
4. Result: `{ mappedScale:"uiaa", mappedGrade:"VII+" }`.
5. Points are calculated using `CLIMBING_UIAA_COEFFICIENTS["VII+"]` = 14.
6. Persisted fields:
   - `difficultyScale = "french"` (original source scale)
   - `difficultyGrade = "6c"` (original source grade)
   - `mappedScale = "uiaa"` (resolved scoring scale)
   - `mappedGrade = "VII+"` (resolved scoring grade)

### Official climbing with French grade (unmapped)

1. Activity submitted with a French grade not in `grade_mappings`.
2. `resolveClimbingGrade` throws `ScoringError`.
3. Service returns `422 Unprocessable Entity`.
4. The activity is not created.

### Official climbing with French + mixed difficulty

When both `difficultyScale="french"` and `mixedClimbing` are provided:

```
regularCoeff = CLIMBING_UIAA_COEFFICIENTS[mappedGrade]
mixedCoeff   = CLIMBING_MIXED_COEFFICIENTS[mixedClimbing]
finalCoeff   = max(regularCoeff, mixedCoeff)   // §3.9 EOOA rule
```

Example — French 6c + WI4:
- 6c → VII+ → coeff 14
- WI4 → coeff 7
- finalCoeff = max(14, 7) = **14**

### Personal climbing with French grade

1. Activity submitted with `isOfficial=false`, `difficultyScale="french"`, valid French grade.
2. Grade is validated against the static `CLIMBING_FRENCH_GRADES` list (no DB lookup).
3. Points remain `null`.
4. `mappedScale` / `mappedGrade` are stored as `null`.
5. Activity is created successfully.

---

## Excel Export

The export service uses `mappedGrade ?? difficultyGrade` for the ΒΔ (UIAA/Alpine) Excel column.
For French official records where `mappedGrade = "VII+"`:
- ΒΔ column → `"VII+"`
- ΜΙΚΤΑ column → `"Επιλογή"` (if no mixed grade) or the mixed grade value

No export logic changes were needed.

---

## How to Add Mappings

Edit `server/prisma/seed/grade-mappings.seed.ts`, add entries to `VERIFIED_GRADE_MAPPINGS`,
then re-run the seed:

```bash
cd server
npm run prisma:seed
```

The seed uses `createMany({ skipDuplicates: true })` — re-running is safe and idempotent.

---

## Future Work

- Expand mappings with an approved authoritative French → UIAA conversion table.
- Make mappings admin-maintainable via a dedicated back-office endpoint so an admin
  can add/edit/delete mappings without a code deploy.
- Consider seeding Alpine (D/TD/ED) → UIAA cross-check if needed.
