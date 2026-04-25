import type { InputHTMLAttributes, ReactNode } from 'react'

type Props = {
  label: string
  leftIcon?: ReactNode
  rightSlot?: ReactNode
  inputClassName?: string
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'className'>

export function AuthLabeledField({ label, leftIcon, rightSlot, inputClassName = '', id, ...inputProps }: Props) {
  const inputId = id ?? label.replace(/\s+/g, '-').toLowerCase()
  const padLeft = leftIcon ? 'pl-2' : 'pl-3.5'

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-[11px] font-bold uppercase tracking-[0.08em] text-[#64748b]">
        {label}
      </label>
      <div className="flex items-stretch overflow-hidden rounded-xl border border-[#e2e8f0] bg-[#f1f5f9] transition focus-within:border-[#00453e] focus-within:ring-2 focus-within:ring-[#00453e]/20">
        {leftIcon ? <span className="flex shrink-0 items-center pl-3.5 text-[#64748b]">{leftIcon}</span> : null}
        <input
          id={inputId}
          className={`min-w-0 flex-1 border-0 bg-transparent py-3 pr-3 text-sm text-[#1a1c1e] outline-none placeholder:text-[#94a3b8] ${padLeft} ${rightSlot ? 'pr-2' : ''} ${inputClassName}`}
          {...inputProps}
        />
        {rightSlot ? <div className="flex shrink-0 items-center pr-2">{rightSlot}</div> : null}
      </div>
    </div>
  )
}
