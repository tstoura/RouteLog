import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  className?: string
}

export function AuthIconCircle({ children, className = '' }: Props) {
  return (
    <div
      className={`mx-auto flex size-14 items-center justify-center rounded-full bg-[#e8f2ef] text-[#00453e] shadow-inner ${className}`}
    >
      {children}
    </div>
  )
}
