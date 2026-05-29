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
} from '../api/auth.ts'
import type { AuthUser, LoginPayload, RegisterPayload } from '../api/auth.ts'
import { clearAccessToken, setAccessToken } from './tokenStorage.ts'
import { clearAdminClubId } from '../admin/adminClubStorage.ts'

// ── Context shape ──────────────────────────────────────────────────────────

type AuthContextValue = {
  /** The decoded user object, or null if not authenticated. */
  user: AuthUser | null
  /** True while the initial token verification is in progress. */
  isLoading: boolean
  /** True once the user is verified (token present and /auth/me succeeded). */
  isAuthenticated: boolean
  /** Log in with email and password; returns the authenticated user. */
  login: (payload: LoginPayload) => Promise<AuthUser>
  /** Register a new account; returns the created user on success. */
  register: (payload: RegisterPayload) => Promise<AuthUser>
  /** Clear the token and user — navigating out is handled by the caller. */
  logout: () => void
  /** Re-fetch /auth/me and refresh the user in state. */
  refreshMe: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// ── Provider ───────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // Prevent double-run in StrictMode
  const initialCheckDone = useRef(false)

  /**
   * On startup, call POST /auth/refresh to restore the session from the
   * httpOnly refresh cookie. No localStorage is involved — the access token
   * lives only in memory (tokenStorage.ts).
   *
   * Success → store the new access token in memory and set the user.
   * Failure (401 / no cookie) → unauthenticated state.
   */
  const hydrateFromRefreshCookie = useCallback(async () => {
    try {
      const { accessToken, user: me } = await apiRefresh()
      setAccessToken(accessToken)
      setUser(me)
    } catch {
      // No valid refresh cookie — user is not authenticated.
      clearAccessToken()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialCheckDone.current) return
    initialCheckDone.current = true
    void hydrateFromRefreshCookie()
  }, [hydrateFromRefreshCookie])

  const login = useCallback(async (payload: LoginPayload): Promise<AuthUser> => {
    const { accessToken, user: me } = await apiLogin(payload)
    setAccessToken(accessToken)
    setUser(me)
    return me
  }, [])

  const register = useCallback(async (payload: RegisterPayload): Promise<AuthUser> => {
    const { accessToken, user: me } = await apiRegister(payload)
    setAccessToken(accessToken)
    setUser(me)
    return me
  }, [])

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

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, isAuthenticated: user !== null, login, register, logout, refreshMe }),
    [user, isLoading, login, register, logout, refreshMe],
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
