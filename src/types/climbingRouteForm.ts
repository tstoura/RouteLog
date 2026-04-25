export type ClimbingDifficultyScale = 'Γαλλική' | 'UIAA' | 'Alpine'

/** Route shape used by the climbing activity form (mock / session-added). */
export type ClimbingRouteFormRecord = {
  id: string
  name: string
  /** Climbing sector / crag (shown as "field" in the form) */
  field: string
  /** Mountain or wider area */
  mountainOrArea: string
  difficultyScale: ClimbingDifficultyScale
  difficultyGrade: string
  altitude?: string
  routeLength?: string
}
