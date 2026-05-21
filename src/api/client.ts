/**
 * Thin fetch wrapper for the RouteLog backend API.
 *
 * Base URL is configured via the VITE_API_BASE_URL environment variable.
 * Default: http://localhost:3001 (NestJS dev server).
 */

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

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
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
