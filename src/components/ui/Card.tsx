import type { HTMLAttributes, ReactNode } from 'react'

type Props = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
}

export function Card({ children, className = '', ...rest }: Props) {
  return (
    <div
      className={`rounded-xl border border-[#eef2f0] bg-white p-4 shadow-sm ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}
