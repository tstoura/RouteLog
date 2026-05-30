import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

export type CustomSelectOption = { value: string; label: string }

type Props = {
  value: string
  onChange: (value: string) => void
  options: CustomSelectOption[]
  /** Height class for the trigger button. Defaults to 'h-14'. */
  heightClass?: string
  disabled?: boolean
  className?: string
  /** Values that should be rendered disabled/unselectable (e.g. empty placeholder options). */
  disabledValues?: string[]
}

/**
 * Styled custom dropdown that visually matches the GradeDropdown used in the
 * CreateRouteModal.  Replaces native <select> in form dropdowns so all selects
 * share the same look.
 */
export function CustomSelect({
  value,
  onChange,
  options,
  heightClass = 'h-14',
  disabled = false,
  className = '',
  disabledValues = [],
}: Props) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedLabel = useMemo(
    () => options.find((o) => o.value === value)?.label ?? '',
    [options, value],
  )

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        className={[
          `flex ${heightClass} w-full items-center justify-between rounded-lg border px-3 text-sm transition`,
          'bg-white ring-[#005f56]',
          disabled
            ? 'cursor-not-allowed border-[#e2e8e0] bg-[#f1f5f9] text-[#334155] opacity-100'
            : open
              ? 'border-[#005f56] ring-2'
              : 'border-[#e2e8e0] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] hover:border-[#cbd5e1]',
          !disabled && value ? 'text-[#1a1c1e]' : 'text-[#94a3b8]',
        ].join(' ')}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown
          className={`ml-2 size-4 shrink-0 text-[#64748b] transition-transform ${open ? 'rotate-180' : ''}`}
          strokeWidth={2}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 max-h-52 overflow-auto rounded-xl border border-[#e8eef0] bg-white py-1 shadow-[0_8px_24px_-4px_rgba(15,23,42,0.15)]"
        >
          {options.map((opt) => {
            const isDisabled = disabledValues.includes(opt.value)
            const isSelected = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={isDisabled}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  if (!isDisabled) {
                    onChange(opt.value)
                    setOpen(false)
                  }
                }}
                className={[
                  'w-full px-4 py-2.5 text-left text-sm transition',
                  isDisabled
                    ? 'cursor-default text-[#94a3b8]'
                    : isSelected
                      ? 'bg-[#f0fdf4] font-semibold text-[#00453e]'
                      : 'text-[#1a1c1e] hover:bg-[#f0fdf4] hover:text-[#00453e]',
                ].join(' ')}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
