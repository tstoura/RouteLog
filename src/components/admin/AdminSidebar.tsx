import { Link, NavLink, useLocation } from 'react-router-dom'
import { ClipboardList, LayoutDashboard, Users } from 'lucide-react'
import { RouteLogLogoMark } from '../brand/RouteLogLogoMark.tsx'

function HelpIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#475569]" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M9.5 9.5a2.5 2.5 0 0 1 4.95-.5c0 1.5-2.45 1.3-2.45 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="12" cy="16.5" r="0.75" fill="currentColor" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#475569]" aria-hidden>
      <path
        d="M14 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M10 12h11M18 8l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

const navItemInactive =
  'flex w-full items-center gap-3 rounded-[12.8px] px-4 py-3 text-left text-sm font-semibold text-[#475569] transition hover:bg-white/60'
const navItemActive =
  'flex w-full items-center gap-3 rounded-[12.8px] bg-gradient-to-r from-[#00453e] to-[#005f56] px-4 py-3 text-sm font-semibold text-white shadow-sm'

export function AdminSidebar() {
  const { pathname } = useLocation()

  const dashActive = pathname === '/admin' || pathname === '/admin/'
  const membersActive = pathname.startsWith('/admin/members')
  const activitiesActive = pathname.startsWith('/admin/activities')

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-[#e4e4e8] bg-[#eeeef0] px-4 py-8 md:flex">
      <div className="mb-8">
        <RouteLogLogoMark to="/admin" size="sidebar" className="w-full" />
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#64748b]">Πίνακας διαχείρισης</p>
      </div>

      <nav className="flex flex-1 flex-col gap-2">
        <NavLink
          to="/admin"
          end
          className={() => (dashActive ? navItemActive : navItemInactive)}
          aria-current={dashActive ? 'page' : undefined}
        >
          <LayoutDashboard className="size-5 shrink-0" strokeWidth={2} aria-hidden />
          Dashboard
        </NavLink>
        <NavLink
          to="/admin/members"
          className={() => (membersActive ? navItemActive : navItemInactive)}
          aria-current={membersActive ? 'page' : undefined}
        >
          <Users className="size-5 shrink-0" strokeWidth={2} aria-hidden />
          Χρήστες
        </NavLink>
        <NavLink
          to="/admin/activities"
          className={() => (activitiesActive ? navItemActive : navItemInactive)}
          aria-current={activitiesActive ? 'page' : undefined}
        >
          <ClipboardList className="size-5 shrink-0" strokeWidth={2} aria-hidden />
          Δράσεις
        </NavLink>
      </nav>

      <div className="mt-auto space-y-2 border-t border-[#dcdce0] pt-4">
        <button type="button" className={navItemInactive} disabled>
          <HelpIcon />
          Βοήθεια
        </button>
        <Link to="/login" className={navItemInactive}>
          <LogoutIcon />
          Αποσύνδεση
        </Link>
      </div>
    </aside>
  )
}
