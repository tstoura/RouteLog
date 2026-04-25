import type { ReactNode } from 'react'

const pillActive =
  'bg-[#00453e] text-white shadow-[0px_0px_0px_1px_rgba(190,201,198,0.3)]'
const pillInactive =
  'bg-[#f3f3f6] text-[#1a1c1e] shadow-[0px_0px_0px_1px_rgba(190,201,198,0.3)] hover:bg-[#e8e8ec]'

type Option<T extends string> = { value: T; label: string }

type Props<T extends string> = {
  title: string
  value: T
  onChange: (value: T) => void
  options: Option<T>[]
  'aria-label'?: string
  endSlot?: ReactNode
}

/**
 * Row of pill filters (same styling as History category pills).
 * Used when extra filters are shown (e.g. rock climbing).
 */
export function HistoryPillFilterSection<T extends string>({
  title,
  value,
  onChange,
  options,
  'aria-label': ariaLabel,
  endSlot,
}: Props<T>) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-[#4c616c]">{title}</h2>
        {endSlot}
      </div>
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label={ariaLabel ?? title}
      >
        {options.map((opt) => {
          const active = value === opt.value
          return (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => onChange(opt.value)}
              className={[
                'cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition',
                active ? pillActive : pillInactive,
              ].join(' ')}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </section>
  )
}
