import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, LogOut, User } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext.tsx'
import { getClubs } from '../../api/auth.ts'
import type { ClubOption } from '../../api/auth.ts'
import { ApiError } from '../../api/client.ts'
import { CustomSelect } from '../ui/CustomSelect.tsx'

// ── Helpers ────────────────────────────────────────────────────────────────

function roleLabelGr(role: string): string {
  if (role === 'club_admin') return 'Διαχειριστής'
  return 'Μέλος'
}

// ── Profile panel (dropdown card) ──────────────────────────────────────────

type PanelProps = {
  onClose: () => void
  /** When true, users without a club see a join-club form. Admin topbar sets this to false. */
  allowJoinClub: boolean
}

function ProfilePanel({ onClose, allowJoinClub }: PanelProps) {
  const { user, logout, joinClub, hasClubMembership, primaryMembership } = useAuth()

  // Club list for the join form (only fetched when allowJoinClub and no membership)
  const [clubs, setClubs] = useState<ClubOption[]>([])
  const [clubsLoading, setClubsLoading] = useState(false)
  const [clubsError, setClubsError] = useState<string | null>(null)

  // Join form state
  const [selectedClubId, setSelectedClubId] = useState('')
  const [joinLoading, setJoinLoading] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [joinSuccess, setJoinSuccess] = useState(false)

  // Fetch clubs only when the join form is relevant
  useEffect(() => {
    if (!allowJoinClub || hasClubMembership) return
    setClubsLoading(true)
    setClubsError(null)
    getClubs()
      .then((list) => setClubs(list))
      .catch(() => setClubsError('Δεν ήταν δυνατή η φόρτωση συλλόγων. Δοκιμάστε ξανά.'))
      .finally(() => setClubsLoading(false))
  }, [allowJoinClub, hasClubMembership])

  const clubSelectOptions = useMemo(
    () => [
      { value: '', label: 'Επιλέξτε σύλλογο' },
      ...clubs.map((c) => ({ value: c.id, label: c.name })),
    ],
    [clubs],
  )

  const handleJoinClub = async () => {
    if (!selectedClubId) return
    setJoinLoading(true)
    setJoinError(null)
    try {
      await joinClub(selectedClubId)
      setJoinSuccess(true)
    } catch (err) {
      if (err instanceof ApiError) {
        setJoinError(err.message)
      } else {
        setJoinError('Απρόσμενο σφάλμα. Δοκιμάστε ξανά.')
      }
    } finally {
      setJoinLoading(false)
    }
  }

  if (!user) return null

  const displayName = `${user.firstName} ${user.lastName}`
  const preferredLabel =
    user.preferredActivity === 'hiking'
      ? 'Ορειβασία'
      : user.preferredActivity === 'climbing'
        ? 'Αναρρίχηση'
        : user.preferredActivity === 'expedition'
          ? 'Αποστολές'
          : null

  return (
    <div
      className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-[#e2e8e0] bg-white shadow-[0px_8px_30px_rgba(0,0,0,0.12)]"
      role="dialog"
      aria-label="Προφίλ χρήστη"
    >
      {/* Header */}
      <div className="border-b border-[#f0f0f4] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[rgba(0,69,62,0.1)] text-sm font-bold text-[#00453e]">
            {user.firstName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#1a1c1e]">{displayName}</p>
            <p className="truncate text-xs text-[#64748b]">{user.email}</p>
          </div>
        </div>
        {preferredLabel ? (
          <p className="mt-2 text-xs text-[#94a3b8]">
            Προτιμώμενη δραστηριότητα:{' '}
            <span className="font-medium text-[#64748b]">{preferredLabel}</span>
          </p>
        ) : null}
      </div>

      {/* Club section */}
      <div className="px-5 py-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.6px] text-[#94a3b8]">
          Σύλλογος
        </p>

        {hasClubMembership && primaryMembership ? (
          /* User already has a club */
          <div className="rounded-lg border border-[rgba(0,69,62,0.15)] bg-[rgba(0,69,62,0.05)] px-4 py-3">
            <p className="text-sm font-semibold text-[#00453e]">{primaryMembership.clubName}</p>
            <p className="mt-0.5 text-xs text-[#64748b]">
              Ρόλος: {roleLabelGr(primaryMembership.role)}
            </p>
          </div>
        ) : joinSuccess ? (
          /* Just joined */
          <div className="rounded-lg border border-[rgba(0,69,62,0.15)] bg-[rgba(0,69,62,0.05)] px-4 py-3">
            <p className="text-sm font-semibold text-[#00453e]">
              {clubs.find((c) => c.id === selectedClubId)?.name ?? 'Σύλλογος'}
            </p>
            <p className="mt-0.5 text-xs text-[#00453e]">Εγγραφή ολοκληρώθηκε ✓</p>
          </div>
        ) : allowJoinClub ? (
          /* No club — show join form (app users only) */
          <div className="space-y-3">
            <p className="text-sm text-[#475569]">Δεν έχετε δηλώσει σύλλογο.</p>

            {clubsLoading ? (
              <p className="text-xs text-[#94a3b8]">Φόρτωση συλλόγων...</p>
            ) : clubsError ? (
              <p className="text-xs text-[#b91c1c]">{clubsError}</p>
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  <CustomSelect
                    value={selectedClubId}
                    onChange={setSelectedClubId}
                    options={clubSelectOptions}
                    heightClass="h-10"
                    disabled={joinLoading}
                    disabledValues={['']}
                    className="relative z-10"
                  />
                  <button
                    type="button"
                    onClick={handleJoinClub}
                    disabled={!selectedClubId || joinLoading}
                    className="h-10 w-full rounded-lg bg-[#00453e] px-4 text-sm font-semibold text-white transition hover:bg-[#005f56] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {joinLoading ? 'Αποθήκευση...' : 'Δήλωση συλλόγου'}
                  </button>
                </div>
                {joinError ? (
                  <p className="text-xs text-[#b91c1c]">{joinError}</p>
                ) : null}
              </>
            )}
          </div>
        ) : (
          /* Admin without club — just inform, no join form */
          <p className="text-sm text-[#94a3b8]">Δεν υπάρχουν στοιχεία συλλόγου.</p>
        )}
      </div>

      {/* Logout */}
      <div className="border-t border-[#f0f0f4] px-5 py-3">
        <button
          type="button"
          onClick={() => {
            onClose()
            logout()
          }}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-[#64748b] transition hover:bg-[#f8f9fa] hover:text-[#1a1c1e]"
        >
          <LogOut className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
          Αποσύνδεση
        </button>
      </div>
    </div>
  )
}

// ── ProfileDropdown (trigger + panel) ──────────────────────────────────────

type Props = {
  /** When true, show the join-club form for users without a membership. */
  allowJoinClub: boolean
}

/**
 * Reusable profile dropdown used in both AppTopBar and AdminTopBar.
 *
 * Renders a clickable user-pill trigger button that opens a profile panel.
 * The panel shows user info, club/role, and logout.
 * When allowJoinClub=true (app layout), users without a club see the join form.
 * When allowJoinClub=false (admin layout), admins only see their club info.
 */
export function ProfileDropdown({ allowJoinClub }: Props) {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const displayName = user ? `${user.firstName} ${user.lastName}` : '—'

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen])

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label="Άνοιγμα προφίλ"
        className="flex items-center gap-2 rounded-full border border-[rgba(190,201,198,0.25)] bg-[#f3f3f6] px-3 py-1.5 transition hover:bg-[#e8edf2]"
      >
        <User className="size-[14px] shrink-0 text-[#64748b]" strokeWidth={2} aria-hidden />
        <span className="text-xs font-semibold text-[#3f4947]">{displayName}</span>
        <ChevronDown
          className={[
            'size-[12px] shrink-0 text-[#94a3b8] transition-transform',
            isOpen ? 'rotate-180' : '',
          ].join(' ')}
          strokeWidth={2}
          aria-hidden
        />
      </button>

      {isOpen ? (
        <ProfilePanel onClose={() => setIsOpen(false)} allowJoinClub={allowJoinClub} />
      ) : null}
    </div>
  )
}
