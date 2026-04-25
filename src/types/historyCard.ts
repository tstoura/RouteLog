import type { ActivityKind } from './activity.ts'

export type HistoryStatus = 'official' | 'personal'

export type HistoryCard = {
  id: string
  kind: ActivityKind
  /** Short uppercase label on the card (localized UI). */
  categoryLabel: string
  dateLabel: string
  title: string
  styleBadge?: string
  locationLine: string
  metricLine: string
  peopleLine: string
  status: HistoryStatus
  /** Detail page slug for `/app/history/:slug`. If omitted, the card is not a link. */
  detailSlug?: string
  /**
   * Rock climbing only: completion style (full set, e.g. repeat).
   * If omitted, derive from `styleBadge` via `getRockCompletionKind` in `historyRockFilters`.
   */
  rockCompletion?: 'on_sight' | 'flash' | 'red_point' | 'repeat' | 'incomplete'
}
