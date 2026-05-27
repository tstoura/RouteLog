import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext.tsx'

/**
 * Main content top bar: shows the authenticated user's name and a logout button.
 */
export function AppTopBar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const displayName = user ? `${user.firstName} ${user.lastName}` : '—'

  return (
    <header className="sticky top-0 z-30 flex items-center justify-end gap-4 border-b border-[#e8e8ed] bg-[rgba(249,249,252,0.85)] px-4 py-4 backdrop-blur-md md:px-8">
      <div className="flex items-center gap-3 rounded-full border border-[rgba(190,201,198,0.25)] bg-[#f3f3f6] px-3 py-1.5">
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
    </header>
  )
}
