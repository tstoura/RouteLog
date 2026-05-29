/**
 * Allowed values for users.system_role.
 * Source: docs/backend-decisions.md §3
 */
export const SYSTEM_ROLES = ['user', 'super_admin'] as const
export type SystemRole = (typeof SYSTEM_ROLES)[number]

/**
 * Allowed values for users.preferred_activity.
 * Source: docs/backend-decisions.md §4
 * This field is optional and used only for UI personalisation.
 * It does not restrict what the user can do.
 */
export const PREFERRED_ACTIVITIES = ['hiking', 'climbing', 'expedition'] as const
export type PreferredActivity = (typeof PREFERRED_ACTIVITIES)[number]

/**
 * Fields returned in public user responses.
 * password_hash is NEVER included in any API response.
 */
export const USER_PUBLIC_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  systemRole: true,
  preferredActivity: true,
  onboardingCompleted: true,
  createdAt: true,
  updatedAt: true,
} as const
