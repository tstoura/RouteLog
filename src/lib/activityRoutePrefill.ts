import { mockRoutes } from '../data/mockRoutes.ts'
import { getRouteDetailBySlug } from '../data/mockRouteDetails.ts'
import { normalizeGradeLabel } from '../data/climbingFormRoutes.ts'
import { coerceGradeOptionValue } from '../constants/climbingFormOptions.ts'
import type { Route } from '../types/route.ts'
import type { ClimbingRouteFormRecord } from '../types/climbingRouteForm.ts'

/** Find a mock rock-climbing route by slug. */
export function getMockRockClimbingRouteBySlug(slug: string): Route | undefined {
  return mockRoutes.find((r) => r.activityKind === 'rock_climbing' && r.slug === slug)
}

/** Find a mock rock-climbing route by id. */
export function getMockRockClimbingRouteById(id: string): Route | undefined {
  return mockRoutes.find((r) => r.activityKind === 'rock_climbing' && r.id === id)
}

function routeLengthFromDetailSlug(slug: string): string | undefined {
  const d = getRouteDetailBySlug(slug)
  const row = d?.technical.find((t) => {
    const L = t.label.toUpperCase()
    return L.includes('ΑΝΑΠΤΥΓΜΑ') || L.includes('ΜΗΚΟΣ')
  })
  const v = row?.value?.trim()
  return v || undefined
}

/**
 * Map a mock route (plus optional detail rows) to climbing activity form values.
 * The field input uses the route card `sector` (e.g. main crag name).
 */
export function mapRouteToClimbingFormValues(slug: string): ClimbingRouteFormRecord | undefined {
  const r = getMockRockClimbingRouteBySlug(slug)
  if (!r) return undefined
  const rawGrade = normalizeGradeLabel(r.difficultyLabel)
  const grade = coerceGradeOptionValue(rawGrade) || rawGrade
  const routeLen = routeLengthFromDetailSlug(slug)
  return {
    id: r.id,
    name: r.name,
    field: r.sector ?? '',
    mountainOrArea: r.mountain ?? '',
    difficultyScale: 'Γαλλική',
    difficultyGrade: grade,
    altitude: undefined,
    routeLength: routeLen,
  }
}
