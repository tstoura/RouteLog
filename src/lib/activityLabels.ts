/**
 * Maps normalized backend enum values to Greek UI labels.
 * Used by History and Detail pages to avoid showing raw backend strings.
 */

import { HIKING_DIFFICULTY_GRADE_OPTIONS } from '../constants/hikingFormOptions.ts'
import { EXPEDITION_DIFFICULTY_GRADE_OPTIONS } from '../constants/expeditionFormOptions.ts'
import {
  UIAA_GRADE_OPTIONS,
  ALPINE_GRADE_OPTIONS,
  FRENCH_GRADE_OPTIONS,
  MIXED_CLIMBING_OPTIONS,
} from '../constants/climbingFormOptions.ts'

/**
 * All difficulty values that are considered valid by the UI option lists.
 * Any value NOT in this set is treated as old/invalid test data and should
 * not be displayed as a prominent badge.
 */
const VALID_DIFFICULTY_VALUES: ReadonlySet<string> = new Set([
  ...HIKING_DIFFICULTY_GRADE_OPTIONS.map((o) => o.value),
  ...EXPEDITION_DIFFICULTY_GRADE_OPTIONS.map((o) => o.value),
  ...UIAA_GRADE_OPTIONS.filter((o) => o.value).map((o) => o.value),
  ...ALPINE_GRADE_OPTIONS.filter((o) => o.value).map((o) => o.value),
  ...FRENCH_GRADE_OPTIONS.filter((o) => o.value).map((o) => o.value),
  ...MIXED_CLIMBING_OPTIONS.filter((o) => o.value).map((o) => o.value),
])

export function categoryToLabel(category: string): string {
  switch (category) {
    case 'hiking':
      return 'Ορειβασία / Ορειβατικό Σκι'
    case 'climbing':
      return 'Αναρρίχηση Βράχου'
    case 'expedition':
      return 'Αποστολές Εξωτερικού'
    default:
      return category
  }
}

export function seasonToLabel(season: string): string {
  switch (season) {
    case 'summer':
      return 'Θερινή'
    case 'winter':
      return 'Χειμερινή'
    default:
      return season
  }
}

export function organizationTypeToLabel(orgType: string): string {
  switch (orgType) {
    case 'no':
      return 'Όχι'
    case 'europe':
      return 'Ευρώπη'
    case 'africa':
      return 'Αφρική'
    case 'other_continents':
      return 'Άλλες ήπειροι'
    default:
      return orgType
  }
}

export function fieldTypeToLabel(fieldType: string): string {
  switch (fieldType) {
    case 'normal':
      return 'Κανονικό'
    case 'winter_conditions':
      return 'Χειμερινών Συνθηκών'
    case 'ski_mountaineering':
      return 'Ορειβατικού Σκι'
    default:
      return fieldType
  }
}

/** "hiking" → "Πεζοπορία", all other grades displayed as-is. */
export function difficultyGradeToLabel(grade: string): string {
  return grade === 'hiking' ? 'Πεζοπορία' : grade
}

export function repetitionTypeToLabel(repType: string): string {
  switch (repType) {
    case 'repeat':
      return 'Επανάληψη'
    case 'new':
      return 'Νέα'
    default:
      return repType
  }
}

export function completionTypeToLabel(ct: string): string {
  switch (ct) {
    case 'on_sight':
      return 'On Sight'
    case 'flash':
      return 'Flash'
    case 'red_point':
      return 'Red Point'
    case 'top_rope':
      return 'Top Rope'
    default:
      return ct
  }
}

/**
 * Returns the Greek UI label for a difficulty value **only if** it is a
 * known-valid option from the UI option lists.
 *
 * Returns `undefined` for unknown or legacy test values (e.g. "personal_easy"),
 * so callers can safely omit the badge rather than displaying raw junk.
 *
 * Valid known values include:
 *   hiking, F- … AD+ (hiking/expedition scale)
 *   D- … ED+ (expedition-only extension)
 *   UIAA grades (IV … XI+)
 *   Alpine grades (D- … ED+)
 *   French grades (3 … 9c)
 *   Mixed/ice grades (M1–M12, WI1–WI12)
 */
export function resolveKnownDifficultyLabel(
  value: string | null | undefined,
): string | undefined {
  if (!value) return undefined
  if (!VALID_DIFFICULTY_VALUES.has(value)) return undefined
  return difficultyGradeToLabel(value)
}

/**
 * Backend scale key → verbose Greek display label (used on route detail page).
 *   french → Γαλλική κλίμακα
 *   uiaa   → UIAA
 *   alpine → Alpine
 */
export function scaleToLabel(scale: string | null | undefined): string {
  switch (scale) {
    case 'french':
      return 'Γαλλική κλίμακα'
    case 'uiaa':
      return 'UIAA'
    case 'alpine':
      return 'Alpine'
    default:
      return scale ?? '—'
  }
}

/**
 * Backend scale key → compact display label (used on activity detail technical tiles).
 *   french → French
 *   uiaa   → UIAA
 *   alpine → Alpine
 */
export function climbingScaleDisplayLabel(scale: string | null | undefined): string {
  switch (scale) {
    case 'french':
      return 'French'
    case 'uiaa':
      return 'UIAA'
    case 'alpine':
      return 'Alpine'
    default:
      return scale ?? '—'
  }
}

/**
 * ISO date string → DD/MM/YYYY (display format).
 * Handles both "YYYY-MM-DD" and full datetime "YYYY-MM-DDTHH:mm:ss.sssZ".
 */
export function formatDateLabel(isoDate: string): string {
  const datePart = isoDate.includes('T') ? isoDate.split('T')[0] : isoDate
  const parts = datePart.split('-')
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return isoDate
  const [y, m, d] = parts
  return `${d}/${m}/${y}`
}
