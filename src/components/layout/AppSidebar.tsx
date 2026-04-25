import { Link, NavLink, useLocation } from 'react-router-dom'
import { APP_LAYOUT_CREDIT } from '../../constants/appCredit.ts'
import { ClockNavIcon, PlusNavIcon, RoutesNavIcon } from '../icons/AppNavIcons.tsx'
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

/**
 * App sidebar navigation (Figma-aligned: home, history, etc.).
 * Visible from `md` breakpoint up; smaller screens use the bottom bar.
 */
export function AppSidebar() {
  const { pathname } = useLocation()

  const recordingActive = pathname === '/app' || pathname.startsWith('/app/new')
  const routesActive = pathname.startsWith('/app/routes')
  const historyActive = pathname.startsWith('/app/history')

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-[#e4e4e8] bg-[#eeeef0] px-4 py-8 md:flex">
      <div className="mb-8">
        <RouteLogLogoMark to="/app" size="sidebar" className="w-full" />
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#64748b]">
          Ορειβατικό Ημερολόγιο
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-2">
        <NavLink
          to="/app/new"
          className={() => (recordingActive ? navItemActive : navItemInactive)}
          aria-current={recordingActive ? 'page' : undefined}
        >
          <PlusNavIcon stroke={recordingActive ? '#ffffff' : '#475569'} />
          Καταγραφή Δράσης
        </NavLink>
        <NavLink
          to="/app/routes"
          className={() => (routesActive ? navItemActive : navItemInactive)}
          aria-current={routesActive ? 'page' : undefined}
        >
          <RoutesNavIcon size={20} colorClass={routesActive ? 'text-white' : 'text-[#475569]'} />
          Διαδρομές
        </NavLink>
        <NavLink
          to="/app/history"
          className={() => (historyActive ? navItemActive : navItemInactive)}
          aria-current={historyActive ? 'page' : undefined}
        >
          <ClockNavIcon stroke={historyActive ? '#ffffff' : '#475569'} />
          Ιστορικό
        </NavLink>
      </nav>

      <div className="mt-auto space-y-2 border-t border-[#dcdce0] pt-4">
        {/* TODO: wire Help to a real destination */}
        <button type="button" className={navItemInactive} disabled>
          <HelpIcon />
          Βοήθεια
        </button>
        <Link to="/" className={navItemInactive}>
          <LogoutIcon />
          Αποσύνδεση
        </Link>
        <p className="px-1 pt-3 text-center text-[9px] font-bold uppercase leading-relaxed tracking-[0.12em] text-[#94a3b8]">
          {APP_LAYOUT_CREDIT}
        </p>
      </div>
    </aside>
  )
}
