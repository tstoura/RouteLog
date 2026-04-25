import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

const linkCardClass =
  'flex flex-col items-center gap-2 rounded-xl border border-[#cfe6f2] bg-[#e8f4fc] p-5 text-center shadow-sm transition hover:border-[#00453e]/30 hover:bg-[#dceef9]'

type Props = {
  to: string
  icon: ReactNode
  children: ReactNode
  className?: string
}

/** Secondary sidebar card (shared styling on activity / route detail). */
export function DetailSidebarLinkCard({ to, icon, children, className = '' }: Props) {
  return (
    <Link to={to} className={[linkCardClass, 'cursor-pointer', className].filter(Boolean).join(' ')}>
      {icon}
      {children}
    </Link>
  )
}
