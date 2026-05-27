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
import { getMe, login as apiLogin, register as apiRegister } from '../api/auth.ts'
import type { AuthUser, LoginPayload, RegisterPayload } from '../api/auth.ts'
import { clearAccessToken, getAccessToken, setAccessToken } from './tokenStorage.ts'

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

  const hydrateFromToken = useCallback(async () => {
    const token = getAccessToken()
    if (!token) {
      setIsLoading(false)
      return
    }
    try {
      const me = await getMe()
      setUser(me)
    } catch {
      // Token is invalid or expired — clear it silently.
      clearAccessToken()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialCheckDone.current) return
    initialCheckDone.current = true
    void hydrateFromToken()
  }, [hydrateFromToken])

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

  const logout = useCallback(() => {
    clearAccessToken()
    setUser(null)
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
