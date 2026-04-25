import type { ReactNode } from 'react'

type Props = {
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-6 py-12 text-center">
      <p className="font-heading text-lg font-semibold text-[#022c22]">{title}</p>
      {description ? <p className="mt-2 max-w-sm text-sm text-[#64748b]">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}
