import type { InputHTMLAttributes, WheelEvent } from 'react'

export function Input({ className = '', onWheel, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  // Blur on wheel for number inputs so page scrolling does not accidentally
  // increment/decrement scoring fields while the input is focused.
  const handleWheel = rest.type === 'number'
    ? (e: WheelEvent<HTMLInputElement>) => {
        e.currentTarget.blur()
        onWheel?.(e)
      }
    : onWheel

  return (
    <input
      className={`w-full rounded-lg border border-[#e2e8e0] bg-white px-3 py-2 text-sm text-[#1a1c1e] outline-none ring-[#005f56] transition placeholder:text-[#94a3b8] focus:border-[#005f56] focus:ring-2 ${className}`}
      onWheel={handleWheel}
      {...rest}
    />
  )
}
