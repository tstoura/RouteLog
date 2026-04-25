import type { ReactNode } from 'react'

type Props = {
  title: string
  description: string
  iconBoxClassName: string
  smallIcon: ReactNode
  watermark: ReactNode
}

export function FeatureCard({ title, description, iconBoxClassName, smallIcon, watermark }: Props) {
  return (
    <article className="relative overflow-hidden rounded-xl bg-[#fbfdfb] p-8 pb-14 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
      <div
        className={`flex size-12 items-center justify-center rounded ${iconBoxClassName}`}
        aria-hidden
      >
        {smallIcon}
      </div>
      <h3 className="font-heading pt-2 text-xl font-bold text-[#1a1c1e]">{title}</h3>
      <p className="mt-2 max-w-prose pb-4 text-base leading-[26px] text-[#3f4947]">{description}</p>
      <div
        className="pointer-events-none absolute right-4 top-1/2 flex -translate-y-1/2 items-center justify-center opacity-[0.22]"
        aria-hidden
      >
        {watermark}
      </div>
    </article>
  )
}
