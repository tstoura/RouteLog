import { Route } from 'lucide-react'

type PlusProps = {
  size?: number
  stroke?: string
  className?: string
}

/** Matches sidebar "record activity" icon (circle with plus). */
export function PlusNavIcon({ size = 20, stroke = '#475569', className = '' }: PlusProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth="1.6" />
      <path d="M12 8v8M8 12h8" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

type ClockProps = {
  size?: number
  stroke?: string
  className?: string
}

/** Matches sidebar History icon. */
export function ClockNavIcon({ size = 18, stroke = '#475569', className = '' }: ClockProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth="1.6" />
      <path d="M12 7v6l3 2" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

type RoutesProps = {
  size?: number
  className?: string
  /** Stroke color via Lucide `currentColor` (Tailwind text class). */
  colorClass?: string
}

/** Matches sidebar Routes icon (Lucide Route). */
export function RoutesNavIcon({ size = 20, className = '', colorClass = 'text-[#475569]' }: RoutesProps) {
  return <Route className={`shrink-0 ${colorClass} ${className}`} size={size} strokeWidth={2} aria-hidden />
}
