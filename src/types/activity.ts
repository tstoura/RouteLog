export type ActivityKind = 'hiking' | 'rock_climbing' | 'expedition'

export type Activity = {
  id: string
  kind: ActivityKind
  title: string
  date: string
  location: string
  notes?: string
}
