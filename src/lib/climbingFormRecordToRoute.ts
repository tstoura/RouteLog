import type { ClimbingRouteFormRecord } from '../types/climbingRouteForm.ts'
import type { Route } from '../types/route.ts'

function inferFieldKey(field: string): Route['fieldKey'] {
  const t = field.trim().toLowerCase()
  if (t.includes('metropolis') || t.includes('μετρόπολι') || t.includes('κυρί')) return 'metropolis'
  if (t.includes('παναγ') || t.includes('panagia')) return 'panagia'
  if (t.includes('γαλάζ') || t.includes('galazio') || t.includes('στροφ')) return 'galazio'
  return undefined
}

/** Map a `CreateRouteModal` save payload to a routes list card (mock). */
export function climbingFormRecordToRoute(r: ClimbingRouteFormRecord): Route {
  return {
    id: r.id,
    name: r.name,
    sector: r.field,
    mountain: r.mountainOrArea,
    difficultyLabel: r.difficultyGrade,
    activityKind: 'rock_climbing',
    updatedAt: new Date().toISOString().slice(0, 10),
    fieldKey: inferFieldKey(r.field),
  }
}
