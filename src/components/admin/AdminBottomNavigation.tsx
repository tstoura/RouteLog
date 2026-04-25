import { NavLink } from 'react-router-dom'
import { ClipboardList, LayoutDashboard, Users } from 'lucide-react'

const itemClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] font-semibold transition-colors',
    isActive ? 'text-[#005f56]' : 'text-[#64748b] hover:text-[#022c22]',
  ].join(' ')

/** Admin bottom navigation for `/admin` on small screens. */
export function AdminBottomNavigation() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#e2e8e0] bg-[#fbfdfb]/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-12px_rgba(2,44,34,0.08)] backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-lg justify-between px-2 pt-1">
        <NavLink to="/admin" end className={itemClass}>
          <LayoutDashboard className="size-[22px]" strokeWidth={2} aria-hidden />
          Dashboard
        </NavLink>
        <NavLink to="/admin/members" className={itemClass}>
          <Users className="size-[22px]" strokeWidth={2} aria-hidden />
          Χρήστες
        </NavLink>
        <NavLink to="/admin/activities" className={itemClass}>
          <ClipboardList className="size-[22px]" strokeWidth={2} aria-hidden />
          Δράσεις
        </NavLink>
      </div>
    </nav>
  )
}
