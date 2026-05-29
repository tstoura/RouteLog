/**
 * EOOA Rock Climbing coefficients.
 * Source of truth: docs/eooa-rules-alignment.md §3
 *
 * Backend values are normalized lowercase English strings.
 * Grade names (UIAA, M-scale, WI-scale) are international notation and kept as-is.
 * Greek uppercase labels are applied ONLY during Excel export (Phase 9).
 * Do not expose "Επιλογή" or "0" as valid choices.
 */

// ── Season ────────────────────────────────────────────────────────────────────

/**
 * Allowed backend values for climbing_activity_details.season.
 * UI labels: Θερινή | Χειμερινή
 */
export const CLIMBING_SEASONS = ['summer', 'winter'] as const
export type ClimbingSeason = (typeof CLIMBING_SEASONS)[number]

/**
 * Season → EOOA coefficient.
 * Source: eooa-rules-alignment.md §3.3
 * NOTE: season coefficient is applied only when altitude > 1000 (§3.12).
 *       This rule is enforced in the scoring function, not here.
 */
export const CLIMBING_SEASON_COEFFICIENTS: Record<ClimbingSeason, number> = {
  summer: 1,
  winter: 2,
}

/**
 * Season → Excel export label.
 * Used only in Phase 9 Excel builder.
 */
export const CLIMBING_SEASON_EXCEL_LABELS: Record<ClimbingSeason, string> = {
  summer: 'ΘΕΡΙΝΗ',
  winter: 'ΧΕΙΜΕΡΙΝΗ',
}

// ── Repetition type ───────────────────────────────────────────────────────────

/**
 * Allowed backend values for climbing_activity_details.repetition_type.
 * UI labels: Νέα | Επανάληψη
 */
export const CLIMBING_REPETITION_TYPES = ['new', 'repeat'] as const
export type ClimbingRepetitionType = (typeof CLIMBING_REPETITION_TYPES)[number]

/**
 * Repetition type → EOOA coefficient.
 * Source: eooa-rules-alignment.md §3.4
 */
export const CLIMBING_REPETITION_COEFFICIENTS: Record<ClimbingRepetitionType, number> = {
  new: 3,
  repeat: 1,
}

/**
 * Repetition type → Excel export label.
 * Used only in Phase 9 Excel builder.
 */
export const CLIMBING_REPETITION_EXCEL_LABELS: Record<ClimbingRepetitionType, string> = {
  new: 'ΝΕΑ',
  repeat: 'ΕΠΑΝΑΛΗΨΗ',
}

// ── Completion type (personal tracking only) ──────────────────────────────────

/**
 * Allowed backend values for climbing_activity_details.completion_type.
 * This field is optional in all cases. Does not affect scoring. Never exported.
 * UI labels: On Sight | Flash | Red Point | Top Rope
 */
export const CLIMBING_COMPLETION_TYPES = ['on_sight', 'flash', 'red_point', 'top_rope'] as const
export type ClimbingCompletionType = (typeof CLIMBING_COMPLETION_TYPES)[number]

// ── UIAA / Alpine regular difficulty ─────────────────────────────────────────

/**
 * Allowed UIAA/Alpine grade backend values for climbing_activity_details.difficulty_grade
 * (or mapped_grade when French scale is used).
 * Source: eooa-rules-alignment.md §3.5
 *
 * "Επιλογή" is an Excel template default value — it is NOT in this list.
 * It is written to the Excel file only when no regular difficulty is present (§3.15).
 */
export const CLIMBING_UIAA_GRADES = [
  'IV',
  'IV+',
  'V-',
  'V',
  'V+',
  'VI-',
  'VI',
  'VI+',
  'VII-',
  'VII',
  'VII+',
  'VIII-',
  'VIII',
  'VIII+',
  'IX-',
  'IX',
  'IX+',
  'X-',
  'X',
  'X+',
  'XI-',
  'XI',
  'XI+',
  // Alpine grades also accepted by the EOOA template
  'D-',
  'D',
  'D+',
  'TD-',
  'TD',
  'TD+',
  'ED-',
  'ED',
  'ED+',
] as const
export type ClimbingUiaaGrade = (typeof CLIMBING_UIAA_GRADES)[number]

/**
 * UIAA/Alpine grade → EOOA coefficient.
 * Source: eooa-rules-alignment.md §3.5
 * Used via getClimbingRegularDifficultyCoefficient() in Phase 6 scoring service.
 */
export const CLIMBING_UIAA_COEFFICIENTS: Record<ClimbingUiaaGrade, number> = {
  IV: 4,
  'IV+': 5,
  'V-': 6,
  V: 7,
  'V+': 8,
  'VI-': 9,
  VI: 10,
  'VI+': 11,
  'VII-': 12,
  VII: 13,
  'VII+': 14,
  'VIII-': 15,
  VIII: 16,
  'VIII+': 18,
  'IX-': 20,
  IX: 22,
  'IX+': 24,
  'X-': 26,
  X: 28,
  'X+': 30,
  'XI-': 32,
  XI: 34,
  'XI+': 36,
  // Alpine grades (D/TD/ED) — also accepted by the EOOA template
  'D-': 8,
  D: 9,
  'D+': 10,
  'TD-': 11,
  TD: 12,
  'TD+': 13,
  'ED-': 14,
  ED: 15,
  'ED+': 16,
}

// ── Allowed difficulty scale values ───────────────────────────────────────────

/**
 * Allowed backend values for climbing_activity_details.difficulty_scale.
 *   "uiaa"   — UIAA numeric grades (IV, IV+, V … XI+).
 *   "alpine" — Alpine adjectival grades (D-, D, D+, TD-, TD, TD+, ED-, ED, ED+).
 *              Alpine grades share the same EOOA coefficient table as UIAA grades
 *              (CLIMBING_UIAA_COEFFICIENTS) so no separate lookup is needed.
 *   "french" — French sport-climbing grades (e.g. 6c, 7a+). Triggers a
 *              grade_mappings DB lookup to resolve mapped_scale / mapped_grade.
 */
export const CLIMBING_DIFFICULTY_SCALES = ['uiaa', 'alpine', 'french'] as const
export type ClimbingDifficultyScale = (typeof CLIMBING_DIFFICULTY_SCALES)[number]

// ── French sport-climbing grades ─────────────────────────────────────────────

/**
 * Allowed backend grade values when difficulty_scale = "french".
 * Mirrors the frontend FRENCH_GRADE_OPTIONS in src/constants/climbingFormOptions.ts.
 *
 * For official records these grades are validated at service level via the
 * grade_mappings DB lookup (resolveClimbingGrade). This static list is used
 * for personal records where the DB lookup is skipped but we still want to
 * reject arbitrary strings.
 */
export const CLIMBING_FRENCH_GRADES = [
  '3', '4', '5',
  '5a', '5a+', '5b', '5b+', '5c', '5c+',
  '6a', '6a+', '6b', '6b+', '6c', '6c+',
  '7a', '7a+', '7b', '7b+', '7c', '7c+',
  '8a', '8a+', '8b', '8b+', '8c', '8c+',
  '9a', '9a+', '9b', '9b+', '9c',
] as const
export type ClimbingFrenchGrade = (typeof CLIMBING_FRENCH_GRADES)[number]

// ── Mixed / ice climbing ──────────────────────────────────────────────────────

/**
 * Allowed M-scale (mixed) grade backend values.
 * Source: eooa-rules-alignment.md §3.7
 * "Επιλογή" is an Excel template default — NOT in this list.
 */
export const CLIMBING_MIXED_M_GRADES = [
  'M1', 'M2', 'M3', 'M4', 'M5', 'M6',
  'M7', 'M8', 'M9', 'M10', 'M11', 'M12',
] as const
export type ClimbingMixedMGrade = (typeof CLIMBING_MIXED_M_GRADES)[number]

/**
 * Allowed WI-scale (ice climbing) grade backend values.
 * Source: eooa-rules-alignment.md §3.7
 */
export const CLIMBING_MIXED_WI_GRADES = [
  'WI1', 'WI2', 'WI3', 'WI4', 'WI5', 'WI6',
  'WI7', 'WI8', 'WI9', 'WI10', 'WI11', 'WI12',
] as const
export type ClimbingMixedWiGrade = (typeof CLIMBING_MIXED_WI_GRADES)[number]

/** All allowed mixed/ice grade backend values (M-scale + WI-scale). */
export const CLIMBING_MIXED_GRADES = [...CLIMBING_MIXED_M_GRADES, ...CLIMBING_MIXED_WI_GRADES] as const
export type ClimbingMixedGrade = ClimbingMixedMGrade | ClimbingMixedWiGrade

/**
 * M-scale grade → EOOA coefficient.
 * Source: eooa-rules-alignment.md §3.7
 */
export const CLIMBING_MIXED_M_COEFFICIENTS: Record<ClimbingMixedMGrade, number> = {
  M1: 4, M2: 5, M3: 6, M4: 7, M5: 8, M6: 9,
  M7: 10, M8: 11, M9: 12, M10: 13, M11: 14, M12: 15,
}

/**
 * WI-scale grade → EOOA coefficient.
 * Source: eooa-rules-alignment.md §3.7
 */
export const CLIMBING_MIXED_WI_COEFFICIENTS: Record<ClimbingMixedWiGrade, number> = {
  WI1: 4, WI2: 5, WI3: 6, WI4: 7, WI5: 8, WI6: 9,
  WI7: 10, WI8: 11, WI9: 12, WI10: 13, WI11: 14, WI12: 15,
}

/** Combined mixed/ice coefficient lookup (M + WI). */
export const CLIMBING_MIXED_COEFFICIENTS: Record<ClimbingMixedGrade, number> = {
  ...CLIMBING_MIXED_M_COEFFICIENTS,
  ...CLIMBING_MIXED_WI_COEFFICIENTS,
}
