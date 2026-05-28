import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext.tsx'
import { useAdminClub } from '../../admin/AdminClubContext.tsx'

/** Admin top bar: shows the authenticated admin user's name, a logout button,
 *  and — for super_admin on mobile — the club selector dropdown. */
export function AdminTopBar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const {
    isSuperAdmin,
    selectedClubId,
    availableClubs,
    isLoadingClubs,
    setSelectedClubId,
    clearSelectedClubId,
  } = useAdminClub()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const displayName = user ? `${user.firstName} ${user.lastName}` : '—'

  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-[#e8e8ed] bg-[rgba(249,249,252,0.92)] px-4 py-4 backdrop-blur-md md:gap-3 md:justify-end md:px-8">
      {/* Club selector — super_admin only, visible on mobile (desktop uses the sidebar) */}
      {isSuperAdmin && (
        <div className="flex-1 md:hidden">
          {isLoadingClubs ? (
            <span className="text-xs text-[#94a3b8]">Φόρτωση…</span>
          ) : (
            <select
              value={selectedClubId ?? ''}
              onChange={(e) => {
                if (e.target.value) setSelectedClubId(e.target.value)
                else clearSelectedClubId()
              }}
              className="h-8 w-full max-w-[200px] rounded-lg border border-[#e0e5e3] bg-white px-2 text-xs text-[#1a1c1e] shadow-sm focus:border-[#00453e] focus:outline-none focus:ring-1 focus:ring-[#00453e]"
              aria-label="Επιλογή συλλόγου"
            >
              <option value="">— Σύλλογος —</option>
              {availableClubs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* User name badge + logout — pushed to the right */}
      <div className="ml-auto flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-full border border-[rgba(190,201,198,0.25)] bg-[#f3f3f6] px-3 py-1.5">
          <span className="text-xs font-semibold text-[#3f4947]">{displayName}</span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          title="Αποσύνδεση"
          aria-label="Αποσύνδεση"
          className="flex items-center gap-1.5 rounded-full border border-[rgba(190,201,198,0.25)] bg-[#f3f3f6] px-3 py-1.5 text-xs font-semibold text-[#64748b] transition hover:bg-[#e8edf2] hover:text-[#022c22]"
        >
          <LogOut className="size-[14px]" strokeWidth={2} aria-hidden />
          <span className="hidden sm:inline">Αποσύνδεση</span>
        </button>
      </div>
    </header>
  )
}
