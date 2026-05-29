/**
 * EOOA Hiking / Ski Mountaineering coefficients.
 * Source of truth: docs/eooa-rules-alignment.md §2
 *
 * Backend values are normalized lowercase English strings.
 * Greek uppercase labels are applied ONLY during Excel export (Phase 9).
 * Do not expose "Επιλογή" or "0" as valid choices.
 */

// ── Field type ────────────────────────────────────────────────────────────────

/**
 * Allowed backend values for hiking_activity_details.field_type.
 * UI labels: Κανονικό | Χειμερινών Συνθηκών | Ορειβατικού Σκι
 */
export const HIKING_FIELD_TYPES = ['normal', 'winter_conditions', 'ski_mountaineering'] as const
export type HikingFieldType = (typeof HIKING_FIELD_TYPES)[number]

/**
 * Field type → EOOA coefficient.
 * Source: eooa-rules-alignment.md §2.2
 */
export const HIKING_FIELD_COEFFICIENTS: Record<HikingFieldType, number> = {
  normal: 1,
  winter_conditions: 1.5,
  ski_mountaineering: 1.8,
}

/**
 * Field type → Excel export label (EOOA template uppercase Greek).
 * Used only in Phase 9 Excel builder — do not expose in API responses or UI.
 */
export const HIKING_FIELD_EXCEL_LABELS: Record<HikingFieldType, string> = {
  normal: 'ΚΑΝΟΝΙΚΟ',
  winter_conditions: 'ΧΕΙΜΕΡΙΝΩΝ ΣΥΝΘΗΚΩΝ',
  ski_mountaineering: 'ΟΡΕΙΒΑΤΙΚΟΥ ΣΚΙ',
}

// ── Difficulty grade ──────────────────────────────────────────────────────────

/**
 * Allowed backend values for hiking_activity_details.difficulty_grade.
 * "pezoporia" is the normalized backend value for the Greek "ΠΕΖΟΠΟΡΙΑ".
 * All other grade names (F-, F, F+, …) are kept as international climbing notation.
 * UI labels: Πεζοπορία | F- | F | F+ | PD- | PD | PD+ | AD- | AD | AD+
 */
export const HIKING_DIFFICULTY_GRADES = [
  'pezoporia',
  'F-',
  'F',
  'F+',
  'PD-',
  'PD',
  'PD+',
  'AD-',
  'AD',
  'AD+',
] as const
export type HikingDifficultyGrade = (typeof HIKING_DIFFICULTY_GRADES)[number]

/**
 * Hiking difficulty grade → EOOA coefficient.
 * Source: eooa-rules-alignment.md §2.3
 * Do NOT reuse this table for Expedition difficulty — they use different coefficients.
 */
export const HIKING_DIFFICULTY_COEFFICIENTS: Record<HikingDifficultyGrade, number> = {
  pezoporia: 1,
  'F-': 1.2,
  F: 1.4,
  'F+': 1.6,
  'PD-': 1.8,
  PD: 2,
  'PD+': 2.2,
  'AD-': 2.4,
  AD: 2.6,
  'AD+': 2.8,
}

/**
 * Hiking difficulty grade → Excel export label.
 * "pezoporia" maps back to "ΠΕΖΟΠΟΡΙΑ" for EOOA template compatibility.
 * Used only in Phase 9 Excel builder.
 */
export const HIKING_DIFFICULTY_EXCEL_LABELS: Record<HikingDifficultyGrade, string> = {
  pezoporia: 'ΠΕΖΟΠΟΡΙΑ',
  'F-': 'F-',
  F: 'F',
  'F+': 'F+',
  'PD-': 'PD-',
  PD: 'PD',
  'PD+': 'PD+',
  'AD-': 'AD-',
  AD: 'AD',
  'AD+': 'AD+',
}
