import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  className?: string
}

export function AuthModalCard({ children, className = '' }: Props) {
  return (
    <div
      className={`relative w-full rounded-2xl border border-[#e8eef0] bg-white p-8 shadow-[0_25px_50px_-12px_rgba(15,23,42,0.18)] sm:p-9 ${className}`}
    >
      {children}
    </div>
  )
}
