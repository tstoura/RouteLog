export type RoutePoint = {
  lat: number
  lng: number
  label?: string
}

export type RouteActivityKind = 'hiking' | 'rock_climbing' | 'expedition'

export type Route = {
  id: string
  /** Detail page slug for `/app/routes/:slug` */
  slug?: string
  /** Crag filter key (e.g. metropolis) */
  fieldKey?: string
  name: string
  /** Hiking / expedition distance (optional on climbing cards) */
  distanceKm?: number
  elevationGainM?: number
  /** ISO date */
  updatedAt: string
  /** Single-line region fallback */
  region?: string
  /** Sector / crag line (pin icon on cards) */
  sector?: string
  /** Mountain / area line (summit icon on cards) */
  mountain?: string
  /** Grade / difficulty badge text */
  difficultyLabel?: string
  activityKind?: RouteActivityKind
}
