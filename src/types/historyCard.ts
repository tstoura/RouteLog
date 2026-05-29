import type { ActivityKind } from './activity.ts'

export type HistoryStatus = 'official' | 'personal'

/** Icon keys mapped to lucide-react components in `HistoryActivityCard`. */
export type HistoryInfoIconKey = 'pin' | 'mountain' | 'ruler' | 'award' | 'users' | 'gauge'

/** One labeled row inside the card info box. */
export type HistoryInfoRow = {
  iconKey: HistoryInfoIconKey
  /** Full display string, e.g. "Αφετηρία: Λιβάδι → Τερματισμός: Κορυφή" */
  text: string
}

export type HistoryCard = {
  id: string
  kind: ActivityKind
  /** Short uppercase label on the card (localized UI). */
  categoryLabel: string
  dateLabel: string
  title: string
  /**
   * Difficulty grade shown as a small pill next to the title.
   * "hiking" is mapped to "Πεζοπορία". Climbing/mixed grades display as-is.
   */
  difficultyBadge?: string
  /** Rock climbing only: completion style badge (On Sight, Flash, etc.). */
  styleBadge?: string
  /** Structured info rows rendered inside the card info box. */
  infoRows: HistoryInfoRow[]
  status: HistoryStatus
  /** Detail page slug for `/app/history/:slug`. If omitted, the card is not a link. */
  detailSlug?: string
  /**
   * Rock climbing only: completion style (full set, e.g. repeat).
   * If omitted, derive from `styleBadge` via `getRockCompletionKind` in `historyRockFilters`.
   */
  rockCompletion?: 'on_sight' | 'flash' | 'red_point' | 'repeat' | 'incomplete'
}
