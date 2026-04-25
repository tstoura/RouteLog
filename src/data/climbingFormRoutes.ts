import type { Route } from '../types/route.ts'
import type { ClimbingRouteFormRecord } from '../types/climbingRouteForm.ts'
import { mockRoutes } from './mockRoutes.ts'

/** Normalize sector label for form display (Metropolis parentheses style). */
export function formatClimbingFieldDisplay(sector?: string): string {
  if (!sector) return ''
  return sector.replace(/Κύριο Πεδίο\s*-\s*Metropolis/i, 'Κύριο Πεδίο (Metropolis)').trim()
}

export function normalizeGradeLabel(label: string | undefined): string {
  if (!label) return ''
  return label.trim().toLowerCase()
}

function mapCardToFormRecord(r: Route): ClimbingRouteFormRecord | null {
  if (r.activityKind !== 'rock_climbing') return null
  return {
    id: r.id,
    name: r.name,
    field: formatClimbingFieldDisplay(r.sector),
    mountainOrArea: r.mountain ?? '',
    difficultyScale: 'Γαλλική',
    difficultyGrade: normalizeGradeLabel(r.difficultyLabel),
  }
}

/** Extra mock routes for the combobox (beyond `mockRoutes`). */
const EXTRA_FORM_ROUTES: ClimbingRouteFormRecord[] = [
  {
    id: 'r-inter-override',
    name: 'Interstellar Override',
    field: 'Κύριο Πεδίο (Metropolis)',
    mountainOrArea: 'Κλεισούρα',
    difficultyScale: 'Γαλλική',
    difficultyGrade: '8a+',
  },
]

/** Base route list for the climbing activity combobox. */
export function getBaseClimbingFormRoutes(): ClimbingRouteFormRecord[] {
  const fromMocks = mockRoutes.map(mapCardToFormRecord).filter(Boolean) as ClimbingRouteFormRecord[]
  const seen = new Set(fromMocks.map((x) => x.id))
  const extras = EXTRA_FORM_ROUTES.filter((e) => !seen.has(e.id))
  return [...fromMocks, ...extras]
}
