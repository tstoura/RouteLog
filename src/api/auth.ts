import { apiFetch } from './client.ts'

// ── Response types (mirror backend AuthService) ────────────────────────────

export type AuthMembership = {
  clubId: string
  clubName: string
  role: string
}

export type AuthUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  systemRole: string
  /** Convenience shortcut for direct form navigation. One of 'hiking' | 'climbing' | 'expedition' | null. */
  preferredActivity: string | null
  onboardingCompleted: boolean
  memberships: AuthMembership[]
}

export type AuthResponse = {
  accessToken: string
  user: AuthUser
}

export type ClubOption = {
  id: string
  name: string
}

export type ClubMember = {
  userId: string
  firstName: string
  lastName: string
  email: string
  role: string
}

// ── Request payload types ──────────────────────────────────────────────────

export type RegisterPayload = {
  firstName: string
  lastName: string
  email: string
  password: string
  /** Optional: join an existing club as a regular member. */
  clubId?: string
  /** Optional: preferred activity type for UI personalisation. One of 'hiking' | 'climbing' | 'expedition'. */
  preferredActivity?: string
}

export type LoginPayload = {
  email: string
  password: string
}

// ── API functions ──────────────────────────────────────────────────────────

/** GET /clubs — returns all clubs for the register dropdown. */
export function getClubs(): Promise<ClubOption[]> {
  return apiFetch<ClubOption[]>('/clubs')
}

/** POST /auth/register — creates a new user account. */
export function register(payload: RegisterPayload): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/** POST /auth/login — authenticates an existing user. */
export function login(payload: LoginPayload): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/**
 * GET /auth/me — returns the currently authenticated user.
 * Requires a valid Bearer token; throws ApiError(401) if invalid/expired.
 */
export function getMe(): Promise<AuthUser> {
  return apiFetch<AuthUser>('/auth/me')
}

/**
 * POST /auth/refresh — exchanges the httpOnly refresh cookie for a new access token.
 * Returns { accessToken, user } on success; throws ApiError(401) if the cookie is
 * missing, invalid, or expired.
 * credentials: "include" is set automatically by apiFetch.
 *
 * Accepts an optional AbortSignal so callers can enforce a timeout.
 */
export function refresh(options?: Pick<RequestInit, 'signal'>): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/refresh', { method: 'POST', ...options })
}

/**
 * POST /auth/logout — clears the httpOnly refresh cookie server-side.
 * Returns { ok: true }. Safe to call even if no cookie exists.
 */
export function logout(): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>('/auth/logout', { method: 'POST' })
}

/**
 * GET /clubs/:clubId/members — returns club members for export selection.
 * Requires JWT. Allowed only for super_admin or club_admin of the club (403 otherwise).
 */
export function getClubMembers(clubId: string): Promise<ClubMember[]> {
  return apiFetch<ClubMember[]>(`/clubs/${clubId}/members`)
}

// ── Admin activity types ───────────────────────────────────────────────────

export type AdminActivityItem = {
  id: string
  category: string
  isOfficial: boolean
  points: number | null
  /** ISO datetime string from the backend, e.g. "2026-04-12T00:00:00.000Z" */
  date: string
  userId: string
  clubId: string | null
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  hikingDetail: {
    mountain: string
    startPoint: string
    endPoint: string
    fieldType: string
    difficultyGrade: string
    maxAltitude: number
    distanceLength: number
    totalElevationGain: number
  } | null
  climbingDetail: {
    routeId: string
    routeName: string
    mountainOrArea: string
    climbingField: string
    difficultyScale: string
    difficultyGrade: string
    mixedClimbing: string | null
    completionType: string
    repetitionType: string
    altitude: number
    routeLength: number
    participantsNum: number
    participantsText: string | null
    season: string
    mappedScale: string | null
    mappedGrade: string | null
  } | null
  expeditionDetail: {
    country: string
    mountainRange: string
    mountain: string
    summit: string
    routeName: string
    season: string
    altitude: number
    totalElevationGain: number
    difficultyGrade: string
    participantsNum: number
    organizationType: string
  } | null
}

/**
 * GET /clubs/:clubId/activities — returns official activities for a club (admin view).
 * Requires JWT. Allowed only for super_admin or club_admin of the club (403 otherwise).
 */
export function getClubActivities(clubId: string): Promise<AdminActivityItem[]> {
  return apiFetch<AdminActivityItem[]>(`/clubs/${clubId}/activities`)
}

/**
 * POST /auth/me/club-membership — declares club membership for the authenticated user.
 *
 * - Requires JWT (Bearer token in Authorization header).
 * - Body: { clubId: string }
 * - Role is always "member" — the backend ignores any role sent by the client.
 * - Returns 404 if the club does not exist.
 * - Returns 409 if the user already has a membership.
 * - Returns the updated safe AuthUser (same shape as GET /auth/me).
 */
export function joinMyClub(clubId: string): Promise<AuthUser> {
  return apiFetch<AuthUser>('/auth/me/club-membership', {
    method: 'POST',
    body: JSON.stringify({ clubId }),
  })
}
