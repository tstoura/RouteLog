import type { InputHTMLAttributes } from 'react'

export function Input({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-lg border border-[#e2e8e0] bg-white px-3 py-2 text-sm text-[#1a1c1e] outline-none ring-[#005f56] transition placeholder:text-[#94a3b8] focus:border-[#005f56] focus:ring-2 ${className}`}
      {...rest}
    />
  )
}
