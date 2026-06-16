import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import {
  getMe,
  login as apiLogin,
  register as apiRegister,
  refresh as apiRefresh,
  logout as apiLogout,
  joinMyClub as apiJoinMyClub,
} from '../api/auth.ts'
import type { AuthUser, AuthMembership, LoginPayload, RegisterPayload } from '../api/auth.ts'
import { clearAccessToken, setAccessToken } from './tokenStorage.ts'
import { clearAdminClubId } from '../admin/adminClubStorage.ts'

/**
 * Client-side logout flag stored in localStorage.
 *
 * Problem: POST /auth/logout clears the httpOnly refresh cookie on the server,
 * but if Render is sleeping when logout is called, the request silently fails
 * (.catch is swallowed) and the cookie remains valid.  The next page load then
 * restores the old session via hydrateFromRefreshCookie — making the user
 * appear logged in (potentially as a different role) even though they clicked
 * "logout".
 *
 * Solution: set this flag synchronously in logout() before any async work.
 * hydrateFromRefreshCookie() checks it first; if present it skips the refresh
 * entirely and treats the browser as logged out.  The flag is cleared on the
 * next successful login/register so the session works normally again.
 */
const LOGOUT_FLAG_KEY = 'routelog_logged_out'

function setLogoutFlag() { localStorage.setItem(LOGOUT_FLAG_KEY, '1') }
function clearLogoutFlag() { localStorage.removeItem(LOGOUT_FLAG_KEY) }
function isLogoutFlagSet(): boolean { return localStorage.getItem(LOGOUT_FLAG_KEY) === '1' }

/**
 * Decode a JWT's `exp` claim (seconds since epoch) without verifying the
 * signature — the backend already verified it; we just need the expiry time.
 */
function getTokenExpiryMs(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]!)) as Record<string, unknown>
    return typeof payload['exp'] === 'number' ? payload['exp'] * 1000 : null
  } catch {
    return null
  }
}

// ── Context shape ──────────────────────────────────────────────────────────

type AuthContextValue = {
  /** The decoded user object, or null if not authenticated. */
  user: AuthUser | null
  /** True while the initial token verification is in progress. */
  isLoading: boolean
  /** True once the user is verified (token present and /auth/me succeeded). */
  isAuthenticated: boolean
  /** True when the user has at least one club membership. */
  hasClubMembership: boolean
  /** The first (and in MVP the only) membership, or null if none. */
  primaryMembership: AuthMembership | null
  /** Log in with email and password; returns the authenticated user. */
  login: (payload: LoginPayload) => Promise<AuthUser>
  /** Register a new account; returns the created user on success. */
  register: (payload: RegisterPayload) => Promise<AuthUser>
  /** Clear the token and user — navigating out is handled by the caller. */
  logout: () => void
  /** Re-fetch /auth/me and refresh the user in state. */
  refreshMe: () => Promise<void>
  /**
   * Join an existing club as a regular member.
   * Updates the user in context immediately — no page reload required.
   * Returns the updated AuthUser on success.
   */
  joinClub: (clubId: string) => Promise<AuthUser>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// ── Provider ───────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // Prevent double-run in StrictMode
  const initialCheckDone = useRef(false)
  // Timer handle for proactive token refresh
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  /**
   * Schedule a silent token refresh before the current access token expires.
   * Fires at 80 % of the token's remaining lifetime (or at least 60 s before
   * expiry) so that active sessions never hit a 401 due to expiry.
   */
  const scheduleProactiveRefresh = useCallback((accessToken: string) => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current)

    const expiryMs = getTokenExpiryMs(accessToken)
    if (!expiryMs) return

    const remaining = expiryMs - Date.now()
    // Refresh 60 s before expiry, but no later than 80 % of remaining lifetime.
    const delay = Math.min(remaining * 0.8, remaining - 60_000)
    if (delay <= 0) return // Already expired; the 401-retry path handles this.

    refreshTimer.current = setTimeout(async () => {
      try {
        const { accessToken: newToken, user: me } = await apiRefresh()
        setAccessToken(newToken)
        setUser(me)
        scheduleProactiveRefresh(newToken) // chain the next refresh
      } catch (err) {
        // If the server explicitly rejected the refresh token (401), the
        // session is dead — force logout so the user lands on login cleanly.
        // For transient errors (Render cold-start), do nothing: the 401-retry
        // in apiFetch will recover on the next user-triggered API call.
        const status = (err as { status?: number })?.status
        if (status === 401) {
          setLogoutFlag()
          clearAccessToken()
          setUser(null)
          clearAdminClubId()
          window.location.replace('/')
        }
      }
    }, delay)
  }, [])

  /**
   * On startup, call POST /auth/refresh to restore the session from the
   * httpOnly refresh cookie. No localStorage is involved — the access token
   * lives only in memory (tokenStorage.ts).
   *
   * Success → store the new access token in memory and set the user.
   * Failure (401 / no cookie) → unauthenticated state.
   */
  const hydrateFromRefreshCookie = useCallback(async () => {
    // If the user explicitly logged out (even if the server-side cookie clear
    // failed because Render was sleeping), honour that intent and stay logged out.
    if (isLogoutFlagSet()) {
      clearLogoutFlag()
      clearAccessToken()
      setUser(null)
      setIsLoading(false)
      return
    }
    // Abort the refresh request if the backend doesn't respond within 20 seconds
    // (e.g. Render cold start). On abort the catch block fires → isLoading = false
    // → RequireAuth redirects to /login so the user isn't stuck on "Φόρτωση"
    // indefinitely. By the time they submit the login form Render is awake.
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15_000)
    try {
      const { accessToken, user: me } = await apiRefresh({ signal: controller.signal })
      setAccessToken(accessToken)
      setUser(me)
      scheduleProactiveRefresh(accessToken)
    } catch {
      // No valid refresh cookie, request timed out, or network error.
      clearAccessToken()
      setUser(null)
    } finally {
      clearTimeout(timeoutId)
      setIsLoading(false)
    }
  }, [scheduleProactiveRefresh])

  useEffect(() => {
    if (initialCheckDone.current) return
    initialCheckDone.current = true
    void hydrateFromRefreshCookie()
  }, [hydrateFromRefreshCookie])

  const login = useCallback(async (payload: LoginPayload): Promise<AuthUser> => {
    const { accessToken, user: me } = await apiLogin(payload)
    clearLogoutFlag() // user deliberately logging in — clear any stale logout flag
    setAccessToken(accessToken)
    setUser(me)
    scheduleProactiveRefresh(accessToken)
    return me
  }, [scheduleProactiveRefresh])

  const register = useCallback(async (payload: RegisterPayload): Promise<AuthUser> => {
    const { accessToken, user: me } = await apiRegister(payload)
    clearLogoutFlag()
    setAccessToken(accessToken)
    setUser(me)
    scheduleProactiveRefresh(accessToken)
    return me
  }, [scheduleProactiveRefresh])

  /**
   * Logout: clear local credentials, then hard-navigate to "/" via
   * window.location.replace() once the server-side cookie is cleared.
   *
   * Why window.location.replace and not useNavigate:
   *   React Router's navigate() triggers a React state update that races
   *   with the setUser(null) state update.  In that race RequireAuth sees
   *   isAuthenticated=false while still mounted on /app and fires
   *   <Navigate to="/login"> before the router can transition to "/".
   *   window.location.replace() is a browser-level hard navigation that
   *   bypasses React entirely — no render cycle, no race condition.
   *
   * Why no setUser(null) before the reload:
   *   Calling setUser(null) synchronously would trigger a re-render that
   *   lets RequireAuth redirect to /login (the flash we're trying to avoid).
   *   The hard reload resets all React state anyway.
   *
   * Cookie clearing:
   *   window.location.replace is chained in .finally() so it runs only
   *   after POST /auth/logout has either succeeded or failed.  This
   *   ensures the httpOnly cookie is cleared before the new page load's
   *   POST /auth/refresh attempt — so the refresh returns 401 and the
   *   user is fully signed out.
   */
  const logout = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current)
    // Set the logout flag SYNCHRONOUSLY before any async work so that even if
    // apiLogout() fails (Render sleeping), the next page load will not restore
    // this session from the still-valid httpOnly refresh cookie.
    setLogoutFlag()
    clearAccessToken()
    clearAdminClubId()
    void apiLogout()
      .catch(() => {})
      .finally(() => {
        window.location.replace('/')
      })
  }, [])

  const refreshMe = useCallback(async () => {
    const me = await getMe()
    setUser(me)
  }, [])

  const joinClub = useCallback(async (clubId: string): Promise<AuthUser> => {
    const updatedUser = await apiJoinMyClub(clubId)
    setUser(updatedUser)
    return updatedUser
  }, [])

  const hasClubMembership = useMemo(
    () => Boolean(user && user.memberships.length > 0),
    [user],
  )

  const primaryMembership = useMemo<AuthMembership | null>(
    () => (user && user.memberships.length > 0 ? user.memberships[0] : null),
    [user],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      hasClubMembership,
      primaryMembership,
      login,
      register,
      logout,
      refreshMe,
      joinClub,
    }),
    [user, isLoading, hasClubMembership, primaryMembership, login, register, logout, refreshMe, joinClub],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Returns true when the user has admin-level access:
 * systemRole === "super_admin" OR at least one club_admin membership.
 */
export function isAdminUser(user: AuthUser | null): boolean {
  if (!user) return false
  return (
    user.systemRole === 'super_admin' ||
    user.memberships.some((m) => m.role === 'club_admin')
  )
}
