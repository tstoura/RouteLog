import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../../auth/AuthContext.tsx'

/**
 * Route guard: renders children only when the user is authenticated.
 * While the initial token check is in progress, renders a minimal loading
 * indicator to prevent a flash of the login page.
 * Unauthenticated visitors are redirected to /login, with the current
 * location preserved so they can be sent back after login.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9f9fc]">
        <span className="text-sm text-[#94a3b8]">Φόρτωση…</span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
