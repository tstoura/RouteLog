/**
 * Frontend option lists and helper texts for Rock Climbing forms.
 *
 * ── Naming convention ──────────────────────────────────────────────────────────
 * New exports (Phase 10A) use backend-aligned values:
 *   e.g. CLIMBING_SEASON_OPTIONS  → { value: 'summer' | 'winter', ... }
 *
 * Legacy exports (kept for backward compatibility until Phase 10C rewrites the
 * climbing form) are marked with @legacy below.
 * ──────────────────────────────────────────────────────────────────────────────
 */

import type { ClimbingDifficultyScale } from '../types/climbingRouteForm.ts'

export type ClimbingSelectOption = { value: string; label: string }

// ── Difficulty scale ───────────────────────────────────────────────────────────

/**
 * Backend value → UI label mapping for difficulty_scale.
 * Backend allowed: "uiaa" | "alpine" | "french"
 * Values are already aligned with the backend — no changes needed.
 *
 * Includes an empty placeholder for uncontrolled selects.
 * @legacy  CLIMBING_SCALE_OPTIONS (used by CreateRouteModal and other legacy code)
 */
export const CLIMBING_SCALE_OPTIONS: ClimbingSelectOption[] = [
  { value: '', label: 'Επιλογή κλίμακας...' },
  { value: 'french', label: 'Γαλλική' },
  { value: 'uiaa', label: 'UIAA' },
  { value: 'alpine', label: 'Αλπική' },
]

/** Activity form scale options — no empty placeholder. @legacy */
export const CLIMBING_SCALE_FORM_OPTIONS: ClimbingSelectOption[] =
  CLIMBING_SCALE_OPTIONS.filter((o) => o.value !== '')

/**
 * Warning shown when the user selects French scale for an official record.
 * French-to-UIAA grade mappings are not yet verified; the backend returns 422
 * for French scale submissions until mappings are added to grade_mappings.
 *
 * TODO: remove this warning once verified mappings are added to the DB seed.
 */
export const FRENCH_SCALE_OFFICIAL_WARNING =
  'Η γαλλική κλίμακα δεν υποστηρίζεται ακόμα για επίσημη καταγραφή ΕΟΟΑ. ' +
  'Χρησιμοποιήστε UIAA ή Αλπική για επίσημες καταχωρήσεις.'

// ── Season ─────────────────────────────────────────────────────────────────────

/**
 * Backend value → UI label mapping for climbing_activity_details.season.
 * Backend allowed: "summer" | "winter"
 *
 * CONFLICT: The existing ACTIVITY_SEASON_RADIO_OPTIONS in FormBuildingBlocks.tsx
 * uses Greek string values ('θερινή', 'χειμερινή'). Those will be replaced with
 * this constant in Phase 10C.
 */
export const CLIMBING_SEASON_OPTIONS: ClimbingSelectOption[] = [
  { value: 'summer', label: 'Θερινή' },
  { value: 'winter', label: 'Χειμερινή' },
]

// ── Repetition type ────────────────────────────────────────────────────────────

/**
 * Backend value → UI label mapping for climbing_activity_details.repetition_type.
 * Backend allowed: "new" | "repeat"
 *
 * CONFLICT: The existing repeatRadioOptions in RockClimbingActivityForm.tsx
 * uses Greek string values ('νέα', 'επανάληψη'). Those will be replaced with
 * this constant in Phase 10C.
 */
export const CLIMBING_REPETITION_OPTIONS: ClimbingSelectOption[] = [
  { value: 'new', label: 'Νέα' },
  { value: 'repeat', label: 'Επανάληψη' },
]

// ── UIAA difficulty grades ─────────────────────────────────────────────────────

/**
 * UIAA numeric grade options. Includes an empty placeholder at index 0.
 * Backend value = the grade string itself (e.g. "IV", "V+", "VIII-").
 */
export const UIAA_GRADE_OPTIONS: ClimbingSelectOption[] = [
  { value: '', label: 'Επιλογή βαθμού...' },
  { value: 'IV', label: 'IV' },
  { value: 'IV+', label: 'IV+' },
  { value: 'V-', label: 'V-' },
  { value: 'V', label: 'V' },
  { value: 'V+', label: 'V+' },
  { value: 'VI-', label: 'VI-' },
  { value: 'VI', label: 'VI' },
  { value: 'VI+', label: 'VI+' },
  { value: 'VII-', label: 'VII-' },
  { value: 'VII', label: 'VII' },
  { value: 'VII+', label: 'VII+' },
  { value: 'VIII-', label: 'VIII-' },
  { value: 'VIII', label: 'VIII' },
  { value: 'VIII+', label: 'VIII+' },
  { value: 'IX-', label: 'IX-' },
  { value: 'IX', label: 'IX' },
  { value: 'IX+', label: 'IX+' },
  { value: 'X-', label: 'X-' },
  { value: 'X', label: 'X' },
  { value: 'X+', label: 'X+' },
  { value: 'XI-', label: 'XI-' },
  { value: 'XI', label: 'XI' },
  { value: 'XI+', label: 'XI+' },
]

// ── Alpine difficulty grades ───────────────────────────────────────────────────

/**
 * Alpine adjectival grade options. Includes an empty placeholder at index 0.
 * Alpine grades share the same EOOA coefficient table as UIAA grades.
 * Backend value = the grade string itself (e.g. "D", "TD+", "ED-").
 */
export const ALPINE_GRADE_OPTIONS: ClimbingSelectOption[] = [
  { value: '', label: 'Επιλογή βαθμού...' },
  { value: 'D-', label: 'D-' },
  { value: 'D', label: 'D' },
  { value: 'D+', label: 'D+' },
  { value: 'TD-', label: 'TD-' },
  { value: 'TD', label: 'TD' },
  { value: 'TD+', label: 'TD+' },
  { value: 'ED-', label: 'ED-' },
  { value: 'ED', label: 'ED' },
  { value: 'ED+', label: 'ED+' },
]

// ── French (sport-climbing) grades ─────────────────────────────────────────────

/**
 * French sport-climbing grade options. Includes an empty placeholder at index 0.
 *
 * NOTE: French scale submissions currently return 422 from the backend because
 * grade_mappings is empty. Use FRENCH_SCALE_OFFICIAL_WARNING in the UI for
 * official records when this scale is selected.
 *
 * The legacy CLIMBING_GRADE_OPTIONS export below is kept for backward
 * compatibility and points to the same list.
 */
export const FRENCH_GRADE_OPTIONS: ClimbingSelectOption[] = [
  { value: '', label: 'Επιλογή βαθμού...' },
  { value: '6a', label: '6a' },
  { value: '6a+', label: '6a+' },
  { value: '6b', label: '6b' },
  { value: '6b+', label: '6b+' },
  { value: '6c', label: '6c' },
  { value: '6c+', label: '6c+' },
  { value: '7a', label: '7a' },
  { value: '7a+', label: '7a+' },
  { value: '7b', label: '7b' },
  { value: '7b+', label: '7b+' },
  { value: '8a', label: '8a' },
  { value: '8a+', label: '8a+' },
  { value: '8b', label: '8b' },
  { value: '8b+', label: '8b+' },
]

/**
 * @legacy — maps to FRENCH_GRADE_OPTIONS.
 * Kept so existing code (RockClimbingActivityForm, CreateRouteModal, etc.)
 * continues to compile until Phase 10C rewrites the climbing form.
 * The empty placeholder value '' is kept but labelled "Επιλογή βαθμού..."
 * to avoid showing "Επιλογή" as a raw Excel technical value in the UI.
 */
export const CLIMBING_GRADE_OPTIONS: ClimbingSelectOption[] = FRENCH_GRADE_OPTIONS

/**
 * Returns grade options for the given scale key.
 * Phase 10C will use this to drive the grade select based on the chosen scale.
 */
export function getGradeOptionsForScale(scaleKey: string): ClimbingSelectOption[] {
  if (scaleKey === 'uiaa') return UIAA_GRADE_OPTIONS
  if (scaleKey === 'alpine') return ALPINE_GRADE_OPTIONS
  return FRENCH_GRADE_OPTIONS
}

// ── Mixed / ice climbing ───────────────────────────────────────────────────────

/**
 * Backend value → UI label mapping for climbing_activity_details.mixed_climbing.
 * Backend allowed: "M1"–"M12" (mixed) | "WI1"–"WI12" (water ice).
 *
 * The first option (value: '') represents "no mixed/ice component".
 *
 * CONFLICT: The existing mixedOptions in RockClimbingActivityForm.tsx uses
 * Greek narrative strings ('μικτό', 'πάγος') instead of actual grade values.
 * Those will be replaced with this constant in Phase 10C.
 */
export const MIXED_CLIMBING_OPTIONS: ClimbingSelectOption[] = [
  { value: '', label: 'Χωρίς μικτό / πάγο' },
  // M-scale (mixed rock/ice)
  { value: 'M1', label: 'M1' },
  { value: 'M2', label: 'M2' },
  { value: 'M3', label: 'M3' },
  { value: 'M4', label: 'M4' },
  { value: 'M5', label: 'M5' },
  { value: 'M6', label: 'M6' },
  { value: 'M7', label: 'M7' },
  { value: 'M8', label: 'M8' },
  { value: 'M9', label: 'M9' },
  { value: 'M10', label: 'M10' },
  { value: 'M11', label: 'M11' },
  { value: 'M12', label: 'M12' },
  // WI-scale (water ice)
  { value: 'WI1', label: 'WI1' },
  { value: 'WI2', label: 'WI2' },
  { value: 'WI3', label: 'WI3' },
  { value: 'WI4', label: 'WI4' },
  { value: 'WI5', label: 'WI5' },
  { value: 'WI6', label: 'WI6' },
  { value: 'WI7', label: 'WI7' },
  { value: 'WI8', label: 'WI8' },
  { value: 'WI9', label: 'WI9' },
  { value: 'WI10', label: 'WI10' },
  { value: 'WI11', label: 'WI11' },
  { value: 'WI12', label: 'WI12' },
]

/** Helper text shown below the ΜΙΚΤΑ field. */
export const MIXED_CLIMBING_HELPER =
  'Βαθμός μικτής ή παγοαναρριχητικής διαδρομής, π.χ. M4 ή WI4.'

// ── Completion type ────────────────────────────────────────────────────────────

/**
 * Backend value → UI label mapping for climbing_activity_details.completion_type.
 * Optional in all cases. Not exported to the EOOA Excel template.
 * Used only for personal climbing history / tracking.
 *
 * Backend allowed: "on_sight" | "flash" | "red_point" | "top_rope"
 *
 * CONFLICT: The existing completionOptions in RockClimbingActivityForm.tsx uses
 * values without underscores ('onsight', 'redpoint', 'toprope'). Those will be
 * replaced with this constant in Phase 10C.
 */
export const CLIMBING_COMPLETION_OPTIONS: ClimbingSelectOption[] = [
  { value: '', label: 'Επιλογή τρόπου ολοκλήρωσης (προαιρετικό)' },
  { value: 'on_sight', label: 'On Sight' },
  { value: 'flash', label: 'Flash' },
  { value: 'red_point', label: 'Red Point' },
  { value: 'top_rope', label: 'Top Rope' },
]

/** Helper text shown below the ΤΡΟΠΟΣ ΟΛΟΚΛΗΡΩΣΗΣ field. */
export const CLIMBING_COMPLETION_HELPER =
  'Προαιρετικά: δηλώνει τον τρόπο ολοκλήρωσης. Δεν επηρεάζει τη βαθμολόγηση ΕΟΟΑ και δεν εξάγεται.'

// ── Legacy utility functions (kept for backward compatibility) ─────────────────

/**
 * Converts a Greek display label to its backend scale key.
 * Used by existing code that receives route data in Greek-label format.
 * @legacy
 */
export function scaleKeyFromGreek(scale: ClimbingDifficultyScale | string | undefined): string {
  if (!scale) return ''
  if (scale === 'UIAA') return 'uiaa'
  if (scale === 'Alpine') return 'alpine'
  if (scale === 'Γαλλική') return 'french'
  return ''
}

/**
 * Converts a backend scale key to its Greek display label.
 * Used by existing code that renders route data in Greek-label format.
 * @legacy
 */
export function scaleKeyToGreek(key: string): ClimbingDifficultyScale {
  if (key === 'uiaa') return 'UIAA'
  if (key === 'alpine') return 'Alpine'
  return 'Γαλλική'
}

/** Map a raw grade label to a matching French grade option value. @legacy */
export function coerceGradeOptionValue(raw: string | undefined): string {
  if (!raw) return ''
  const t = raw.trim().toLowerCase()
  const hit = FRENCH_GRADE_OPTIONS.find((o) => o.value && o.value.toLowerCase() === t)
  return hit?.value ?? t
}
