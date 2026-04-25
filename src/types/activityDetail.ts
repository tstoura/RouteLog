import type { ActivityKind } from './activity.ts'
import type { HistoryStatus } from './historyCard.ts'

/** Label/value pair for detail info grids. */
export type DetailInfoRow = { label: string; value: string }

export type ActivityDetailModel = {
  slug: string
  title: string
  kind: ActivityKind
  /** Links to a history card id */
  historyCardId: string
  fieldLabel: string
  mountainLabel: string
  dateLabel: string
  styleBadge?: string
  status: HistoryStatus
  basics: DetailInfoRow[]
  technical: DetailInfoRow[]
  participation: {
    peopleCount: number
    peopleLabel: string
    partners: string[]
  }
  personalNote: {
    body: string
  }
  routeEvaluation: {
    body: string
  }
  sidebar: {
    scoreTitle: string
    scoreValue: string
    scoreFootnote: string
  }
  routesDeepLink: string
}
