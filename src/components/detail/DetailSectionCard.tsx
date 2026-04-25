import type { ReactNode } from 'react'
import { Card } from '../ui/Card.tsx'

type Props = {
  title: string
  icon: ReactNode
  badge?: ReactNode
  children: ReactNode
  className?: string
}

/** White section card with title + icon (aligned with forms / Figma). */
export function DetailSectionCard({ title, icon, badge, children, className = '' }: Props) {
  return (
    <Card className={`border-[#e2e8e0] p-5 shadow-sm ${className}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-[1.4px] text-[#00453e]">
          <span className="inline-flex shrink-0 items-center text-[#00453e]">{icon}</span>
          {title}
        </h2>
        {badge}
      </div>
      {children}
    </Card>
  )
}
