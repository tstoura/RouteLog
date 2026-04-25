import type { ReactNode } from 'react'

type Props = {
  title: string
  children: ReactNode
  /** Icon to the left of the title (same tint as section heading). */
  icon?: ReactNode
}

export function FormSection({ title, children, icon }: Props) {
  return (
    <section className="flex flex-col gap-5 rounded-xl border border-[#e2e8e0] bg-[#fbfdfb] p-4">
      <h3 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-[1.4px] text-[#00453e]">
        {icon ? <span className="inline-flex shrink-0 items-center justify-center text-[#00453e]">{icon}</span> : null}
        <span>{title}</span>
      </h3>
      {children}
    </section>
  )
}
