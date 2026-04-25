import type { ReactNode } from 'react'

type Props = {
  title: string
  description?: ReactNode
  action?: ReactNode
}

export function SectionHeader({ title, description, action }: Props) {
  return (
    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="font-heading text-xl font-bold text-[#022c22]">{title}</h2>
        {description ? <div className="mt-1 text-sm text-[#64748b]">{description}</div> : null}
      </div>
      {action}
    </div>
  )
}
