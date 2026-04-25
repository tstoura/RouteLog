import type { ReactNode } from 'react'

type Variant = 'style' | 'official' | 'neutral'

const variants: Record<Variant, string> = {
  style:
    'border border-[rgba(100,46,26,0.15)] bg-[rgba(200,230,210,0.55)] text-[#1a4d33]',
  official: 'bg-[#00453e] text-white',
  neutral: 'bg-[#e8e8ec] text-[#334155]',
}

type Props = {
  children: ReactNode
  variant: Variant
  icon?: ReactNode
  className?: string
}

export function DetailBadge({ children, variant, icon, className = '' }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${variants[variant]} ${className}`}
    >
      {icon}
      {children}
    </span>
  )
}
