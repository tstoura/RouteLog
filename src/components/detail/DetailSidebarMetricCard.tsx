import type { ReactNode } from 'react'
import { TrendingUp } from 'lucide-react'

type Props = {
  title: string
  value: string
  footnote?: string
  /** If set, replaces the default icon in the footnote. */
  footnoteIcon?: ReactNode
  /** Hide the default icon (green metric card). */
  hideFootnoteIcon?: boolean
  variant?: 'green' | 'soft'
}

export function DetailSidebarMetricCard({
  title,
  value,
  footnote,
  footnoteIcon,
  hideFootnoteIcon,
  variant = 'green',
}: Props) {
  const isGreen = variant === 'green'
  const footIcon =
    footnoteIcon !== undefined
      ? footnoteIcon
      : !hideFootnoteIcon && isGreen
        ? <TrendingUp className="size-4 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
        : null
  return (
    <div
      className={
        isGreen
          ? 'rounded-xl bg-[#00453e] p-6 text-center text-white shadow-[0px_20px_40px_-16px_rgba(0,69,62,0.35)]'
          : 'rounded-xl border border-[#cfe6f2] bg-[#e8f4fc] p-5 text-center shadow-sm'
      }
    >
      <p
        className={`text-xs font-extrabold uppercase tracking-[1.4px] ${isGreen ? 'text-[rgba(255,255,255,0.85)]' : 'text-[#475569]'}`}
      >
        {title}
      </p>
      <p className={`py-3 font-heading text-5xl font-bold tracking-tight ${isGreen ? 'text-white' : 'text-[#00453e]'}`}>
        {value}
      </p>
      {footnote ? (
        <p
          className={`mx-auto flex max-w-[220px] items-center justify-center gap-1.5 text-xs leading-snug ${isGreen ? 'text-[rgba(200,230,210,0.95)]' : 'text-[#526772]'}`}
        >
          {footIcon}
          {footnote}
        </p>
      ) : null}
    </div>
  )
}
