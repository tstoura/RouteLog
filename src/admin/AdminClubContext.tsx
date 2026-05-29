import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { useAuth } from '../auth/AuthContext.tsx'
import { getClubs } from '../api/auth.ts'
import type { ClubOption } from '../api/auth.ts'
import {
  clearAdminClubId,
  getAdminClubId,
  setAdminClubId,
} from './adminClubStorage.ts'

// ── Context shape ──────────────────────────────────────────────────────────

export type AdminClubContextValue = {
  /**
   * Resolved club ID used by all admin data queries:
   *  - club_admin:  their single club_admin membership clubId (automatic)
   *  - super_admin: the club they picked from the dropdown (localStorage-persisted)
   *  - null        when super_admin hasn't selected a club yet
   */
  selectedClubId: string | null
  /** Human-readable name of the selected club, or null when nothing is selected. */
  selectedClubName: string | null
  /**
   * Full list of clubs available for the dropdown.
   * Populated only for super_admin (always empty for club_admin).
   */
  availableClubs: ClubOption[]
  /** True while GET /clubs is in flight (super_admin only). */
  isLoadingClubs: boolean
  /** Non-null when GET /clubs failed (super_admin only). */
  clubError: string | null
  /**
   * Persist a new club selection.
   * Only has an effect for super_admin; club_admin club is derived automatically.
   */
  setSelectedClubId: (id: string) => void
  /**
   * Clear the selected club, returning to the "Επιλέξτε σύλλογο" empty state.
   * Only has an effect for super_admin; no-op for club_admin.
   */
  clearSelectedClubId: () => void
  /** True when the authenticated user has systemRole === "super_admin". */
  isSuperAdmin: boolean
}

const AdminClubContext = createContext<AdminClubContextValue | null>(null)

// ── Provider ───────────────────────────────────────────────────────────────

export function AdminClubProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()

  const isSuperAdmin = user?.systemRole === 'super_admin'

  // For club_admin: use their club_admin membership (derived, not mutable).
  const clubAdminMembership = useMemo(
    () => user?.memberships.find((m) => m.role === 'club_admin') ?? null,
    [user],
  )

  // For super_admin: mutable selection backed by localStorage.
  const [availableClubs, setAvailableClubs] = useState<ClubOption[]>([])
  const [isLoadingClubs, setIsLoadingClubs] = useState(false)
  const [clubError, setClubError] = useState<string | null>(null)
  const [superAdminClubId, setSuperAdminClubId] = useState<string | null>(
    // Read persisted selection on first render.
    // Safe to call at mount time because AdminClubProvider is inside RequireAdmin,
    // so the user is already known to be authenticated.
    isSuperAdmin ? getAdminClubId() : null,
  )

  // Load the clubs list once when the provider mounts for a super_admin.
  useEffect(() => {
    if (!isSuperAdmin) return

    setIsLoadingClubs(true)
    setClubError(null)

    getClubs()
      .then((clubs) => {
        setAvailableClubs(clubs)
        // Validate the persisted ID — reset if the club no longer exists.
        const stored = getAdminClubId()
        if (stored && !clubs.some((c) => c.id === stored)) {
          setSuperAdminClubId(null)
          clearAdminClubId()
        }
      })
      .catch(() => setClubError('Σφάλμα φόρτωσης λίστας συλλόγων.'))
      .finally(() => setIsLoadingClubs(false))
  }, [isSuperAdmin])

  const setSelectedClubId = useCallback(
    (id: string) => {
      if (!isSuperAdmin) return // club_admin club is derived automatically
      setSuperAdminClubId(id)
      setAdminClubId(id)
    },
    [isSuperAdmin],
  )

  const clearSelectedClubId = useCallback(() => {
    if (!isSuperAdmin) return // club_admin club is derived automatically
    setSuperAdminClubId(null)
    clearAdminClubId()
  }, [isSuperAdmin])

  // Resolve the final selectedClubId and name based on role.
  const selectedClubId: string | null = isSuperAdmin
    ? superAdminClubId
    : (clubAdminMembership?.clubId ?? null)

  const selectedClubName: string | null = isSuperAdmin
    ? (availableClubs.find((c) => c.id === superAdminClubId)?.name ?? null)
    : (clubAdminMembership?.clubName ?? null)

  const value = useMemo<AdminClubContextValue>(
    () => ({
      selectedClubId,
      selectedClubName,
      availableClubs,
      isLoadingClubs,
      clubError,
      setSelectedClubId,
      clearSelectedClubId,
      isSuperAdmin,
    }),
    [
      selectedClubId,
      selectedClubName,
      availableClubs,
      isLoadingClubs,
      clubError,
      setSelectedClubId,
      clearSelectedClubId,
      isSuperAdmin,
    ],
  )

  return <AdminClubContext.Provider value={value}>{children}</AdminClubContext.Provider>
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useAdminClub(): AdminClubContextValue {
  const ctx = useContext(AdminClubContext)
  if (!ctx) throw new Error('useAdminClub must be used inside <AdminClubProvider>')
  return ctx
}
