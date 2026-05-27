/**
 * Thin fetch wrapper for the RouteLog backend API.
 *
 * Base URL is configured via the VITE_API_BASE_URL environment variable.
 * Default: http://localhost:3001 (NestJS dev server).
 */

import { getAccessToken } from '../auth/tokenStorage.ts'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3001'

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

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
      ...options?.headers,
    },
    ...options,
  })

  const json: unknown = await res.json().catch(() => null)

  if (!res.ok) {
    const rawMsg =
      typeof json === 'object' && json !== null && 'message' in json
        ? (json as Record<string, unknown>)['message']
        : null
    const message = Array.isArray(rawMsg)
      ? rawMsg.join(' · ')
      : typeof rawMsg === 'string'
        ? rawMsg
        : `HTTP ${res.status}`
    throw new ApiError(res.status, json, message)
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
  })

  if (!res.ok) {
    const json: unknown = await res.json().catch(() => null)
    const rawMsg =
      typeof json === 'object' && json !== null && 'message' in json
        ? (json as Record<string, unknown>)['message']
        : null
    const message = Array.isArray(rawMsg)
      ? rawMsg.join(' · ')
      : typeof rawMsg === 'string'
        ? rawMsg
        : `HTTP ${res.status}`
    throw new ApiError(res.status, json, message)
  }

  return res.blob()
}
