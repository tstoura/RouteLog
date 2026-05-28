/**
 * Thin localStorage wrapper for the super_admin selected club.
 *
 * Follows the same pattern as src/auth/tokenStorage.ts.
 * club_admin users do not use this — their club is derived from their membership.
 * super_admin users write here when they pick a club from the dropdown.
 *
 * The entry is cleared on logout so the next session starts fresh.
 */

const ADMIN_CLUB_KEY = 'routelog_admin_club_id'

export function getAdminClubId(): string | null {
  try {
    return localStorage.getItem(ADMIN_CLUB_KEY)
  } catch {
    return null
  }
}

export function setAdminClubId(id: string): void {
  try {
    localStorage.setItem(ADMIN_CLUB_KEY, id)
  } catch {
    // ignore — storage may be unavailable in some environments
  }
}

export function clearAdminClubId(): void {
  try {
    localStorage.removeItem(ADMIN_CLUB_KEY)
  } catch {
    // ignore
  }
}
