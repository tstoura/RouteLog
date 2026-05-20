/**
 * Allowed values for club_memberships.role.
 * Source: docs/backend-decisions.md §2
 *
 * These roles are club-scoped only — they are DIFFERENT from system_role.
 * A club_admin has elevated permissions within their club but does NOT
 * require system_role = super_admin.
 */
export const CLUB_ROLES = ['member', 'club_admin'] as const
export type ClubRole = (typeof CLUB_ROLES)[number]
