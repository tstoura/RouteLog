import type { HTMLAttributes, ReactNode } from 'react'

type Props = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode
}

export function Badge({ children, className = '', ...rest }: Props) {
  return (
    <span
      className={`inline-flex w-fit shrink-0 self-start items-center rounded-full bg-[#a6f1e4] px-3 py-1 text-xs font-semibold uppercase tracking-[1.2px] text-[#00201c] ${className}`}
      {...rest}
    >
      {children}
    </span>
  )
}
