import type { ReactNode } from 'react'

type Props = {
  /** Primary screen title (localized in UI). */
  title: string
  /** Optional subtitle under the title. */
  description?: string
  /** Right-side actions (filters, menu, etc.). */
  actions?: ReactNode
  /** Second row: tabs, filters, full-width search, etc. */
  children?: ReactNode
}

/**
 * Shared in-app screen header (Figma History / Home style).
 * Place at the top of `/app/*` pages for consistent chrome.
 */
export function AppScreenNav({ title, description, actions, children }: Props) {
  return (
    <div className="mb-6 space-y-4 border-b border-[#e8eeeb] pb-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-[#022c22]">{title}</h1>
          {description ? (
            <p className="mt-1 text-sm leading-snug text-[#64748b]">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </div>
  )
}
