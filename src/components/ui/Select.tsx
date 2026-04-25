import type { SelectHTMLAttributes } from 'react'

export function Select({ className = '', children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full rounded-lg border border-[#e2e8e0] bg-white px-3 py-2 text-sm text-[#1a1c1e] outline-none ring-[#005f56] focus:border-[#005f56] focus:ring-2 ${className}`}
      {...rest}
    >
      {children}
    </select>
  )
}
