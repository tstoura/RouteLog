/**
 * Thin wrapper around localStorage for the JWT access token.
 *
 * Kept separate from AuthContext so that api/client.ts can import it
 * without creating a circular dependency.
 *
 * TODO (production hardening): migrate from localStorage to httpOnly cookies
 * issued by the backend, or use a secure in-memory store with a refresh-token
 * cookie. localStorage is acceptable for this MVP.
 */

const TOKEN_KEY = 'routelog_access_token'

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setAccessToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // ignore — storage may be unavailable in some environments
  }
}

export function clearAccessToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // ignore
  }
}
