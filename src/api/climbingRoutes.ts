import { apiFetch } from './client.ts'

export type ClimbingRouteResponse = {
  id: string
  name: string
  mountainOrArea: string
  climbingField: string
  category: string
  /** Backend values: "french" | "uiaa" | "alpine" — matches routes.default_scale */
  defaultScale: string | null
  defaultGrade: string | null
  altitude: number | null
  routeLength: number | null
}

export type CreateClimbingRoutePayload = {
  name: string
  mountainOrArea: string
  climbingField: string
  category?: string
  /** Backend values: "french" | "uiaa" | "alpine" */
  defaultScale?: string
  defaultGrade?: string
  altitude?: number
  routeLength?: number
}

export type ActivityReview = {
  id: string
  date: string
  publicNotes: string | null
  climbingDetail: {
    completionType: string | null
    difficultyGrade: string | null
    mappedGrade: string | null
    mixedClimbing: string | null
  } | null
}

export type ClimbingRoutesQuery = {
  q?: string
  climbingField?: string
  take?: number
}

/** Search / list climbing routes with optional filters. */
export function listClimbingRoutes(params: ClimbingRoutesQuery = {}): Promise<ClimbingRouteResponse[]> {
  const sp = new URLSearchParams()
  if (params.q) sp.set('q', params.q)
  if (params.climbingField) sp.set('climbingField', params.climbingField)
  sp.set('take', String(params.take ?? 50))
  return apiFetch<ClimbingRouteResponse[]>(`/climbing-routes?${sp.toString()}`)
}

/** Kept for backward compat — used by the climbing activity form combobox. */
export function searchClimbingRoutes(query: string): Promise<ClimbingRouteResponse[]> {
  return listClimbingRoutes({ q: query, take: 20 })
}

export function getClimbingRouteById(id: string): Promise<ClimbingRouteResponse> {
  return apiFetch<ClimbingRouteResponse>(`/climbing-routes/${id}`)
}

export function getRouteActivityReviews(routeId: string): Promise<ActivityReview[]> {
  return apiFetch<ActivityReview[]>(`/climbing-routes/${routeId}/activity-reviews`)
}

export function createClimbingRoute(
  payload: CreateClimbingRoutePayload,
): Promise<ClimbingRouteResponse> {
  return apiFetch('/climbing-routes', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
