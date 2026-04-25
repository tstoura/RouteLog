import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  sidebar: ReactNode
}

/** Shared detail layout: main column + right sidebar (activity / route). */
export function DetailPageLayout({ children, sidebar }: Props) {
  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
      <div className="min-w-0 space-y-6 lg:col-span-8">{children}</div>
      <aside className="space-y-4 lg:col-span-4">{sidebar}</aside>
    </div>
  )
}
