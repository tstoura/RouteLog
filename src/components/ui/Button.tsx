import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

const variants: Record<Variant, string> = {
  primary:
    'bg-[#005f56] text-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] hover:bg-[#004a43] disabled:opacity-50',
  secondary:
    'border border-[#e2e8e0] bg-white text-[#022c22] hover:bg-[#f8fafc] disabled:opacity-50',
  ghost: 'text-[#005f56] hover:bg-[#005f56]/10 disabled:opacity-50',
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  children: ReactNode
}

export function Button({ variant = 'primary', className = '', children, ...rest }: Props) {
  return (
    <button
      type="button"
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
