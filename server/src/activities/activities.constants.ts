/**
 * Allowed backend values for activities.category.
 * Must stay in sync with the Prisma schema comment and scoring/export logic.
 */
export const ACTIVITY_CATEGORIES = ['hiking', 'climbing', 'expedition'] as const
export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number]
