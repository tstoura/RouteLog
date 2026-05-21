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

export function searchClimbingRoutes(query: string): Promise<ClimbingRouteResponse[]> {
  const params = new URLSearchParams()
  if (query) params.set('q', query)
  params.set('take', '20')
  return apiFetch<ClimbingRouteResponse[]>(`/climbing-routes?${params.toString()}`)
}

export function createClimbingRoute(
  payload: CreateClimbingRoutePayload,
): Promise<ClimbingRouteResponse> {
  return apiFetch('/climbing-routes', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
