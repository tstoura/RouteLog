/**
 * TEMPORARY: development user and club IDs used for API submissions.
 *
 * These replace JWT auth until the auth phase is implemented.
 * Set the following in your .env file:
 *
 *   VITE_DEV_USER_ID=<uuid of a user that exists in your local DB>
 *   VITE_DEV_CLUB_ID=<uuid of a club that exists in your local DB>
 *
 * TODO: replace with `useAuthContext().user.id` / `useAuthContext().user.clubId`
 *       once JWT auth guards are implemented.
 */

export const DEV_USER_ID: string =
  (import.meta.env.VITE_DEV_USER_ID as string | undefined) ?? ''

export const DEV_CLUB_ID: string =
  (import.meta.env.VITE_DEV_CLUB_ID as string | undefined) ?? ''
