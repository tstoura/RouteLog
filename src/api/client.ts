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

import { getAccessToken, setAccessToken } from '../auth/tokenStorage.ts'

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

/**
 * Attempts to refresh the access token via the httpOnly refresh cookie.
 * Returns true and updates the in-memory token on success; returns false on failure.
 * Uses raw fetch (not apiFetch) to avoid circular calls.
 */
async function tryRefreshAccessToken(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) return false
    const data = (await res.json()) as { accessToken?: string }
    if (typeof data.accessToken === 'string') {
      setAccessToken(data.accessToken)
      return true
    }
    return false
  } catch {
    return false
  }
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
    const refreshed = await tryRefreshAccessToken()
    if (refreshed) {
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

    // Refresh failed — surface the 401 but do NOT clear the token.
    // Clearing it would cause the very next request to send no Authorization
    // header at all ("No authorization token provided") instead of a proper 401.
    // The proactive refresh in AuthContext handles permanent expiry gracefully.
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
