/**
 * In-memory store for the JWT access token.
 *
 * Phase 13+: The access token is kept only in memory (a module-level variable)
 * and is never written to localStorage or any other persistent browser storage.
 * This prevents XSS attacks from stealing long-lived credentials.
 *
 * Session persistence is handled by the httpOnly refresh cookie:
 *  - On every page load, AuthContext calls POST /auth/refresh.
 *  - If the cookie is valid, a new access token is returned and stored here.
 *  - If the cookie is missing/expired, the user is unauthenticated.
 *
 * Kept as a separate module (not inside AuthContext) so api/client.ts can
 * import getAccessToken() without creating a circular dependency.
 */

let _accessToken: string | null = null

export function getAccessToken(): string | null {
  return _accessToken
}

export function setAccessToken(token: string): void {
  _accessToken = token
}

export function clearAccessToken(): void {
  _accessToken = null
}
