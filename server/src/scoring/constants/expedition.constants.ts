/**
 * EOOA Expeditions Abroad coefficients.
 * Source of truth: docs/eooa-rules-alignment.md §4
 *
 * Backend values are normalized lowercase English strings.
 * Grade names (pezoporia, F-, F, F+, …) match the backend convention.
 * Greek uppercase labels are applied ONLY during Excel export (Phase 9).
 * Do not expose "Επιλογή" or "0" as valid choices.
 *
 * IMPORTANT: Expedition difficulty uses DIFFERENT coefficients than hiking
 * even though the grade names (ΠΕΖΟΠΟΡΙΑ → pezoporia, F-, F+, etc.) overlap.
 * Do NOT reuse HIKING_DIFFICULTY_COEFFICIENTS for expedition scoring.
 */

// ── Season ────────────────────────────────────────────────────────────────────

/**
 * Allowed backend values for expedition_activity_details.season.
 * UI labels: Θερινή | Χειμερινή
 * Note: There is no ski_mountaineering option for expeditions.
 *       Ski-mountaineering conditions are treated as winter (§4.2).
 */
export const EXPEDITION_SEASONS = ['summer', 'winter'] as const
export type ExpeditionSeason = (typeof EXPEDITION_SEASONS)[number]

/**
 * Season → EOOA coefficient.
 * Source: eooa-rules-alignment.md §4.2
 */
export const EXPEDITION_SEASON_COEFFICIENTS: Record<ExpeditionSeason, number> = {
  summer: 1,
  winter: 2,
}

/**
 * Season → Excel export label.
 * Used only in Phase 9 Excel builder.
 */
export const EXPEDITION_SEASON_EXCEL_LABELS: Record<ExpeditionSeason, string> = {
  summer: 'ΘΕΡΙΝΗ',
  winter: 'ΧΕΙΜΕΡΙΝΗ',
}

// ── Difficulty grade ──────────────────────────────────────────────────────────

/**
 * Allowed backend values for expedition_activity_details.difficulty_grade.
 * "pezoporia" is the normalized backend value for the Greek "ΠΕΖΟΠΟΡΙΑ".
 * All other grade names are standard Alpine notation.
 *
 * UI labels: Πεζοπορία | F- | F | F+ | PD- | PD | PD+ | AD- | AD | AD+ |
 *            D- | D | D+ | TD- | TD | TD+ | ED- | ED | ED+
 */
export const EXPEDITION_DIFFICULTY_GRADES = [
  'pezoporia',
  'F-', 'F', 'F+',
  'PD-', 'PD', 'PD+',
  'AD-', 'AD', 'AD+',
  'D-', 'D', 'D+',
  'TD-', 'TD', 'TD+',
  'ED-', 'ED', 'ED+',
] as const
export type ExpeditionDifficultyGrade = (typeof EXPEDITION_DIFFICULTY_GRADES)[number]

/**
 * Expedition difficulty grade → EOOA coefficient.
 * Source: eooa-rules-alignment.md §4.3
 *
 * These coefficients are DIFFERENT from hiking difficulty coefficients.
 * Example: PD = 4 for expeditions, but PD = 2 for hiking.
 */
export const EXPEDITION_DIFFICULTY_COEFFICIENTS: Record<ExpeditionDifficultyGrade, number> = {
  pezoporia: 2,
  'F-': 2.4,
  F: 2.8,
  'F+': 3.2,
  'PD-': 3.6,
  PD: 4,
  'PD+': 4.4,
  'AD-': 4.8,
  AD: 5.2,
  'AD+': 5.6,
  'D-': 6,
  D: 6.4,
  'D+': 6.8,
  'TD-': 7.2,
  TD: 7.6,
  'TD+': 8,
  'ED-': 8.4,
  ED: 8.8,
  'ED+': 9.2,
}

/**
 * Expedition difficulty grade → Excel export label.
 * "pezoporia" maps back to "ΠΕΖΟΠΟΡΙΑ" for EOOA template compatibility.
 * Used only in Phase 9 Excel builder.
 */
export const EXPEDITION_DIFFICULTY_EXCEL_LABELS: Record<ExpeditionDifficultyGrade, string> = {
  pezoporia: 'ΠΕΖΟΠΟΡΙΑ',
  'F-': 'F-', F: 'F', 'F+': 'F+',
  'PD-': 'PD-', PD: 'PD', 'PD+': 'PD+',
  'AD-': 'AD-', AD: 'AD', 'AD+': 'AD+',
  'D-': 'D-', D: 'D', 'D+': 'D+',
  'TD-': 'TD-', TD: 'TD', 'TD+': 'TD+',
  'ED-': 'ED-', ED: 'ED', 'ED+': 'ED+',
}

// ── Organization type ─────────────────────────────────────────────────────────

/**
 * Allowed backend values for expedition_activity_details.organization_type.
 * UI labels: Όχι | Ευρώπη | Αφρική | Άλλες Ήπειροι
 *
 * The organization coefficient is ADDED (not multiplied) at the end of the
 * expedition scoring formula. See eooa-rules-alignment.md §4.6 and §4.7.
 */
export const EXPEDITION_ORGANIZATION_TYPES = ['no', 'europe', 'africa', 'other_continents'] as const
export type ExpeditionOrganizationType = (typeof EXPEDITION_ORGANIZATION_TYPES)[number]

/**
 * Organization type → EOOA coefficient.
 * Source: eooa-rules-alignment.md §4.6
 * "no" → 0 means the organization bonus is not applied.
 */
export const EXPEDITION_ORGANIZATION_COEFFICIENTS: Record<ExpeditionOrganizationType, number> = {
  no: 0,
  europe: 4,
  africa: 6,
  other_continents: 12,
}

/**
 * Organization type → Excel export label.
 * Used only in Phase 9 Excel builder.
 */
export const EXPEDITION_ORGANIZATION_EXCEL_LABELS: Record<ExpeditionOrganizationType, string> = {
  no: 'ΟΧΙ',
  europe: 'ΕΥΡΩΠΗ',
  africa: 'ΑΦΡΙΚΗ',
  other_continents: 'ΑΛΛΕΣ ΗΠΕΙΡΟΙ',
}
