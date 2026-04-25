import type { ClimbingDifficultyScale } from '../types/climbingRouteForm.ts'

export type ClimbingSelectOption = { value: string; label: string }

export const CLIMBING_SCALE_OPTIONS: ClimbingSelectOption[] = [
  { value: '', label: 'Επιλογή κλίμακας...' },
  { value: 'french', label: 'Γαλλική' },
  { value: 'uiaa', label: 'UIAA' },
  { value: 'alpine', label: 'Αλπική' },
]

/** Activity form scale options (no empty placeholder option). */
export const CLIMBING_SCALE_FORM_OPTIONS: ClimbingSelectOption[] = CLIMBING_SCALE_OPTIONS.filter((o) => o.value !== '')

export const CLIMBING_GRADE_OPTIONS: ClimbingSelectOption[] = [
  { value: '', label: 'Επιλογή' },
  { value: '6a', label: '6a' },
  { value: '6a+', label: '6a+' },
  { value: '6b', label: '6b' },
  { value: '6b+', label: '6b+' },
  { value: '6c', label: '6c' },
  { value: '6c+', label: '6c+' },
  { value: '6c+ / 7a', label: '6c+ / 7a' },
  { value: '7a', label: '7a' },
  { value: '7a+', label: '7a+' },
  { value: '7b', label: '7b' },
  { value: '7b+', label: '7b+' },
  { value: '8a', label: '8a' },
  { value: '8a+', label: '8a+' },
  { value: '8b', label: '8b' },
  { value: '8b+', label: '8b+' },
]

export function scaleKeyFromGreek(scale: ClimbingDifficultyScale | string | undefined): string {
  if (!scale) return ''
  if (scale === 'UIAA') return 'uiaa'
  if (scale === 'Alpine') return 'alpine'
  if (scale === 'Γαλλική') return 'french'
  return ''
}

export function scaleKeyToGreek(key: string): ClimbingDifficultyScale {
  if (key === 'uiaa') return 'UIAA'
  if (key === 'alpine') return 'Alpine'
  return 'Γαλλική'
}

/** Map a mock grade label (e.g. 8A+) to a matching select option value. */
export function coerceGradeOptionValue(raw: string | undefined): string {
  if (!raw) return ''
  const t = raw.trim().toLowerCase()
  const hit = CLIMBING_GRADE_OPTIONS.find((o) => o.value && o.value.toLowerCase() === t)
  return hit?.value ?? t
}
