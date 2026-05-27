import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../../auth/AuthContext.tsx'

/**
 * Route guard for admin pages.
 *
 * Access is granted when the authenticated user:
 * - has systemRole === "super_admin", OR
 * - has at least one ClubMembership with role === "club_admin"
 *
 * Unauthenticated users → /login
 * Authenticated but unauthorised users → /app (with a "Forbidden" state)
 *
 * The backend remains the authoritative source of truth; this guard provides
 * UX-level protection only.
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9f9fc]">
        <span className="text-sm text-[#94a3b8]">Φόρτωση…</span>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  const isAdmin =
    user.systemRole === 'super_admin' ||
    user.memberships.some((m) => m.role === 'club_admin')

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f9f9fc] p-6 text-center">
        <p className="text-lg font-semibold text-[#022c22]">Δεν έχετε πρόσβαση σε αυτή τη σελίδα.</p>
        <p className="text-sm text-[#64748b]">
          Η σελίδα διαχείρισης είναι διαθέσιμη μόνο σε διαχειριστές.
        </p>
        <a href="/app" className="text-sm font-semibold text-[#005f56] hover:underline">
          ← Επιστροφή στην εφαρμογή
        </a>
      </div>
    )
  }

  return <>{children}</>
}
