/**
 * Thin fetch wrapper for the RouteLog backend API.
 *
 * Base URL is configured via the VITE_API_BASE_URL environment variable.
 * Default: http://localhost:3001 (NestJS dev server).
 *
 * Phase 13+ changes:
 *  - credentials: "include" is set on all requests so the httpOnly refresh
 *    cookie is sent automatically by the browser.
 *  - 401 retry: if a non-auth request returns 401, apiFetch calls
 *    POST /auth/refresh once to get a new access token and retries.
 *    Auth endpoints (/auth/*) are excluded from retry to prevent loops.
 */

import { getAccessToken, setAccessToken, clearAccessToken } from '../auth/tokenStorage.ts'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3001'

// Paths that should never trigger the 401 refresh retry.
// Refreshing /auth/login or /auth/refresh itself would cause infinite loops.
const SKIP_RETRY_PREFIXES = ['/auth/']

export class ApiError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(status: number, body: unknown, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

function buildAuthHeaders(): Record<string, string> {
  const token = getAccessToken()
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

function shouldSkipRetry(path: string): boolean {
  return SKIP_RETRY_PREFIXES.some((prefix) => path.startsWith(prefix))
}

type RefreshResult = 'ok' | 'auth_error' | 'network_error'

/**
 * Attempts to refresh the access token via the httpOnly refresh cookie.
 *
 * Returns:
 *   'ok'           — new token obtained and stored in memory.
 *   'auth_error'   — server returned 401 (cookie missing/expired/invalid).
 *                    The session is definitively dead; caller should force logout.
 *   'network_error'— fetch failed or server returned a non-401 error.
 *                    Likely a transient Render cold-start; caller should NOT
 *                    clear the token — the user can retry their action.
 */
async function tryRefreshAccessToken(): Promise<RefreshResult> {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) {
      return res.status === 401 ? 'auth_error' : 'network_error'
    }
    const data = (await res.json()) as { accessToken?: string }
    if (typeof data.accessToken === 'string') {
      setAccessToken(data.accessToken)
      return 'ok'
    }
    return 'network_error'
  } catch {
    // Network-level failure (fetch threw) — backend likely sleeping.
    return 'network_error'
  }
}

/**
 * Called when the refresh cookie is definitively invalid (server returned 401).
 * Clears the in-memory token, sets the localStorage logout flag (so
 * hydrateFromRefreshCookie skips the next page-load refresh), and hard-navigates
 * to the landing page so the user can log in again cleanly.
 */
function forceLogout(): void {
  clearAccessToken()
  localStorage.setItem('routelog_logged_out', '1')
  window.location.replace('/')
}

function extractErrorMessage(json: unknown, status: number): string {
  if (typeof json === 'object' && json !== null && 'message' in json) {
    const rawMsg = (json as Record<string, unknown>)['message']
    if (Array.isArray(rawMsg)) return rawMsg.join(' · ')
    if (typeof rawMsg === 'string') return rawMsg
  }
  return `HTTP ${status}`
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
      ...options?.headers,
    },
    ...options,
    // Always include credentials so the refresh cookie is sent automatically.
    // Placed after ...options to ensure it cannot be overridden by callers.
    credentials: 'include',
  })

  // If unauthorized and this is not an auth endpoint, try a one-time token refresh.
  if (res.status === 401 && !shouldSkipRetry(path)) {
    const refreshResult = await tryRefreshAccessToken()

    if (refreshResult === 'ok') {
      // Retry the original request with the new access token.
      const retryRes = await fetch(`${BASE_URL}${path}`, {
        headers: {
          'Content-Type': 'application/json',
          ...buildAuthHeaders(),
          ...options?.headers,
        },
        ...options,
        credentials: 'include',
      })
      const retryJson: unknown = await retryRes.json().catch(() => null)
      if (!retryRes.ok) {
        throw new ApiError(retryRes.status, retryJson, extractErrorMessage(retryJson, retryRes.status))
      }
      return retryJson as T
    }

    if (refreshResult === 'auth_error') {
      // The refresh cookie is definitively dead (server returned 401).
      // Force logout so the user lands on the login page cleanly instead of
      // seeing a raw "Invalid or expired token" error.
      forceLogout()
      // forceLogout() triggers a hard navigation; this throw is a safety net
      // in case the redirect takes a moment.
      throw new ApiError(401, null, 'Η σύνδεσή σας έχει λήξει. Παρακαλώ συνδεθείτε ξανά.')
    }

    // 'network_error' — transient failure (Render sleeping). Keep the old
    // token in memory so the next request can retry the refresh. Surface the
    // original 401 so the component can show a meaningful message.
    const json401: unknown = await res.json().catch(() => null)
    throw new ApiError(401, json401, extractErrorMessage(json401, 401))
  }

  const json: unknown = await res.json().catch(() => null)

  if (!res.ok) {
    throw new ApiError(res.status, json, extractErrorMessage(json, res.status))
  }

  return json as T
}

/**
 * Like `apiFetch` but returns the raw response `Blob`.
 * Use for binary endpoints such as `POST /export/club/:clubId` that return xlsx files.
 */
export async function apiFetchBlob(path: string, options?: RequestInit): Promise<Blob> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
      ...options?.headers,
    },
    ...options,
    credentials: 'include',
  })

  if (!res.ok) {
    const json: unknown = await res.json().catch(() => null)
    throw new ApiError(res.status, json, extractErrorMessage(json, res.status))
  }

  return res.blob()
}
