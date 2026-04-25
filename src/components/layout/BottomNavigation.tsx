import { NavLink } from 'react-router-dom'
import { ClockNavIcon, PlusNavIcon, RoutesNavIcon } from '../icons/AppNavIcons.tsx'

const itemClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] font-semibold transition-colors',
    isActive ? 'text-[#005f56]' : 'text-[#64748b] hover:text-[#022c22]',
  ].join(' ')

function IconHome({ active }: { active: boolean }) {
  const stroke = active ? '#005f56' : '#64748b'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconHistory({ active }: { active: boolean }) {
  return <ClockNavIcon size={22} stroke={active ? '#005f56' : '#64748b'} />
}

function IconRoutes({ active }: { active: boolean }) {
  return <RoutesNavIcon size={22} colorClass={active ? 'text-[#005f56]' : 'text-[#64748b]'} />
}

function IconNew({ active }: { active: boolean }) {
  return <PlusNavIcon size={22} stroke={active ? '#005f56' : '#64748b'} />
}

/** App bottom navigation — same chrome on all `/app` screens (mobile). */
export function BottomNavigation() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#e2e8e0] bg-[#fbfdfb]/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-12px_rgba(2,44,34,0.08)] backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-lg justify-between px-2 pt-1">
        <NavLink to="/app" end className={itemClass}>
          {({ isActive }) => (
            <>
              <IconHome active={isActive} />
              Αρχική
            </>
          )}
        </NavLink>
        <NavLink to="/app/history" className={itemClass}>
          {({ isActive }) => (
            <>
              <IconHistory active={isActive} />
              Ιστορικό
            </>
          )}
        </NavLink>
        <NavLink to="/app/routes" className={itemClass}>
          {({ isActive }) => (
            <>
              <IconRoutes active={isActive} />
              Διαδρομές
            </>
          )}
        </NavLink>
        <NavLink to="/app/new" className={itemClass}>
          {({ isActive }) => (
            <>
              <IconNew active={isActive} />
              Νέα
            </>
          )}
        </NavLink>
      </div>
    </nav>
  )
}
