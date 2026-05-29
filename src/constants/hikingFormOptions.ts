/**
 * Frontend option lists and helper texts for Hiking / Ski Mountaineering forms.
 *
 * Values in every option object match the normalized backend DTO values
 * (see server/src/activities/dto/create-hiking-activity.dto.ts and
 *  server/src/scoring/constants/hiking.constants.ts).
 *
 * Labels are the UI-facing Greek strings shown to the user.
 * Excel/EOOA uppercase labels are handled on the server (Phase 9 export).
 * Do not include Excel technical values ("Επιλογή", "0") here.
 */

export type HikingFormOption = { value: string; label: string }

// ── Field type ─────────────────────────────────────────────────────────────────

/**
 * Backend value → UI label mapping for hiking_activity_details.field_type.
 *
 * Backend allowed: "normal" | "winter_conditions" | "ski_mountaineering"
 */
export const HIKING_FIELD_TYPE_OPTIONS: HikingFormOption[] = [
  { value: 'normal', label: 'Κανονικό' },
  { value: 'winter_conditions', label: 'Χειμερινών συνθηκών' },
  { value: 'ski_mountaineering', label: 'Ορειβατικού σκι' },
]

/**
 * Helper text shown below the ΠΕΔΙΟ field.
 * Explains the scoring impact without exposing backend/Excel internals.
 */
export const HIKING_FIELD_TYPE_HELPER =
  'Η κατηγορία του πεδίου κατά τη δραστηριότητα. Επηρεάζει τη βαθμολόγηση ΕΟΟΑ.'

// ── Difficulty grade ───────────────────────────────────────────────────────────

/**
 * Backend value → UI label mapping for hiking_activity_details.difficulty_grade.
 *
 * Backend allowed: "hiking" | "F-" | "F" | "F+" | "PD-" | "PD" | "PD+" | "AD-" | "AD" | "AD+"
 * The backend value "hiking" corresponds to the Greek label "Πεζοπορία".
 * All other grade labels match their backend value (F-, F, etc.).
 */
export const HIKING_DIFFICULTY_GRADE_OPTIONS: HikingFormOption[] = [
  { value: 'hiking', label: 'Πεζοπορία' },
  { value: 'F-', label: 'F-' },
  { value: 'F', label: 'F' },
  { value: 'F+', label: 'F+' },
  { value: 'PD-', label: 'PD-' },
  { value: 'PD', label: 'PD' },
  { value: 'PD+', label: 'PD+' },
  { value: 'AD-', label: 'AD-' },
  { value: 'AD', label: 'AD' },
  { value: 'AD+', label: 'AD+' },
]

/**
 * Helper text shown below the ΒΑΘΜΟΣ ΔΥΣΚΟΛΙΑΣ field.
 */
export const HIKING_DIFFICULTY_GRADE_HELPER =
  'Βαθμός δυσκολίας της ανάβασης βάσει διεθνούς ορειβατικής κλίμακας.'
