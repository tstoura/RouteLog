/**
 * Frontend option lists and helper texts for Expeditions Abroad forms.
 *
 * Values in every option object match the normalized backend DTO values
 * (see server/src/activities/dto/create-expedition-activity.dto.ts and
 *  server/src/scoring/constants/expedition.constants.ts).
 *
 * Labels are the UI-facing Greek strings shown to the user.
 * Do not include Excel technical values ("Επιλογή", "0") here.
 */

export type ExpeditionFormOption = { value: string; label: string }

// ── Season ─────────────────────────────────────────────────────────────────────

/**
 * Backend value → UI label mapping for expedition_activity_details.season.
 *
 * Backend allowed: "summer" | "winter"
 * NOTE: There is no "ski_mountaineering" season for expeditions.
 *       Ski mountaineering conditions are classified as winter.
 */
export const EXPEDITION_SEASON_OPTIONS: ExpeditionFormOption[] = [
  { value: 'summer', label: 'Θερινή' },
  { value: 'winter', label: 'Χειμερινή' },
]

// ── Difficulty grade ───────────────────────────────────────────────────────────

/**
 * Backend value → UI label mapping for expedition_activity_details.difficulty_grade.
 *
 * Expedition difficulty uses a wider range than hiking (extends to ED+)
 * and different coefficients — do NOT reuse hiking difficulty options.
 *
 * Backend allowed: "pezoporia" | "F-" … "AD+" | "D-" … "ED+"
 * The backend value "pezoporia" corresponds to the Greek label "Πεζοπορία".
 * All other grade labels match their backend value.
 */
export const EXPEDITION_DIFFICULTY_GRADE_OPTIONS: ExpeditionFormOption[] = [
  { value: 'pezoporia', label: 'Πεζοπορία' },
  { value: 'F-', label: 'F-' },
  { value: 'F', label: 'F' },
  { value: 'F+', label: 'F+' },
  { value: 'PD-', label: 'PD-' },
  { value: 'PD', label: 'PD' },
  { value: 'PD+', label: 'PD+' },
  { value: 'AD-', label: 'AD-' },
  { value: 'AD', label: 'AD' },
  { value: 'AD+', label: 'AD+' },
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

/**
 * Helper text shown below the ΒΑΘΜΟΣ ΔΥΣΚΟΛΙΑΣ field.
 */
export const EXPEDITION_DIFFICULTY_GRADE_HELPER =
  'Βαθμός δυσκολίας της αποστολής βάσει αλπικής κλίμακας.'

// ── Organization type ──────────────────────────────────────────────────────────

/**
 * Backend value → UI label mapping for expedition_activity_details.organization_type.
 *
 * Backend allowed: "no" | "europe" | "africa" | "other_continents"
 * The organization coefficient is ADDED (not multiplied) to the EOOA score.
 * "no" → coefficient 0 (no bonus added).
 */
export const EXPEDITION_ORGANIZATION_TYPE_OPTIONS: ExpeditionFormOption[] = [
  { value: 'no', label: 'Όχι' },
  { value: 'europe', label: 'Ευρώπη' },
  { value: 'africa', label: 'Αφρική' },
  { value: 'other_continents', label: 'Άλλες ήπειροι' },
]

/**
 * Helper text shown below the ΟΡΓΑΝΩΣΗ field.
 * Clarifies that "Όχι" is the default unless the club organized the expedition.
 */
export const EXPEDITION_ORGANIZATION_HELPER =
  'Συμπληρώνεται μόνο όταν η αποστολή έχει οργανωθεί από τον σύλλογο. Διαφορετικά, επιλέξτε "Όχι".'
