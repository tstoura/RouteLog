import type { DetailInfoRow } from './activityDetail.ts'

/** User review on the route detail page. */
export type RouteUserReview = {
  /** Member / user display label */
  memberLabel: string
  dateLabel: string
  comment: string
}

export type RouteDetailModel = {
  slug: string
  name: string
  fieldLabel: string
  mountainLabel: string
  difficultyLabel: string
  /** Optional hero image (route detail). */
  heroImageSrc?: string
  /** If false, hide hero despite `heroImageSrc`. Default: show when `src` is set. */
  showHeroImage?: boolean
  /** If false, hide the History link in the sidebar. Default: true. */
  showHistorySidebarLink?: boolean
  /** If false, hide the community visibility badge in reviews. Default: true. */
  showReviewsCommunityBadge?: boolean
  basics: DetailInfoRow[]
  technical: DetailInfoRow[]
  userReviews: RouteUserReview[]
  sidebar: {
    title: string
    value: string
    footnote?: string
  }
}
