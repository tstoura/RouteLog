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
 * GET /clubs/:clubId/members — returns club members for export selection.
 * Requires JWT. Allowed only for super_admin or club_admin of the club (403 otherwise).
 */
export function getClubMembers(clubId: string): Promise<ClubMember[]> {
  return apiFetch<ClubMember[]>(`/clubs/${clubId}/members`)
}
