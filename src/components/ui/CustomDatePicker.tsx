import { useState, useRef, useEffect } from 'react'
import { DayPicker } from 'react-day-picker'
import { format, parseISO, isValid } from 'date-fns'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'

type Props = {
  value?: string          // YYYY-MM-DD
  onChange?: (e: { target: { value: string } }) => void
  max?: string            // YYYY-MM-DD — dates after this are disabled
  disabled?: boolean
  className?: string
  /** Use when the trigger is not wrapped in a `<label>` (e.g. grid layouts). */
  ariaLabel?: string
}

/**
 * Styled date picker that replaces the native <input type="date"> calendar.
 * Emits the same synthetic-event interface so all forms work without changes.
 */
export function CustomDatePicker({ value, onChange, max, disabled, className = '', ariaLabel }: Props) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const today = new Date()
  const maxDate = max ? parseISO(max) : today
  const selectedDate = value && isValid(parseISO(value)) ? parseISO(value) : undefined
  const displayValue = selectedDate ? format(selectedDate, 'dd/MM/yyyy') : ''

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange?.({ target: { value: format(date, 'yyyy-MM-dd') } })
    }
    setOpen(false)
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger button — matches the Input height/border/focus ring */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        aria-label={ariaLabel}
        className="flex h-14 w-full items-center justify-between rounded-lg border border-[#e2e8e0] bg-white px-3 py-2 text-base shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] ring-[#005f56] transition focus:border-[#005f56] focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className={displayValue ? 'text-[#1a1c1e]' : 'text-[#94a3b8]'}>
          {displayValue || 'Επιλέξτε ημερομηνία'}
        </span>
        <CalendarDays className="size-5 shrink-0 text-[#64748b]" strokeWidth={1.8} aria-hidden />
      </button>

      {/* Calendar popover */}
      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-50 rounded-xl border border-[#e2e8e0] bg-white p-4 shadow-[0px_8px_30px_-4px_rgba(0,0,0,0.12)]">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            defaultMonth={selectedDate ?? today}
            disabled={{ after: maxDate }}
            components={{
              Chevron: ({ orientation }) =>
                orientation === 'left'
                  ? <ChevronLeft className="size-4" strokeWidth={2} />
                  : <ChevronRight className="size-4" strokeWidth={2} />,
            }}
            classNames={{
              root: 'w-[260px]',
              months: 'flex flex-col',
              month: 'space-y-3',
              month_caption: 'flex items-center justify-between px-1 mb-1',
              caption_label: 'text-sm font-semibold text-[#1a1c1e]',
              nav: 'flex items-center gap-1',
              button_previous:
                'flex size-7 items-center justify-center rounded-full text-[#00453e] transition hover:bg-[rgba(0,95,86,0.1)]',
              button_next:
                'flex size-7 items-center justify-center rounded-full text-[#00453e] transition hover:bg-[rgba(0,95,86,0.1)]',
              month_grid: 'w-full border-collapse',
              weekdays: 'flex',
              weekday:
                'flex h-8 w-9 items-center justify-center text-[10px] font-semibold uppercase text-[#94a3b8]',
              weeks: 'mt-1',
              week: 'flex',
              day: 'flex size-9 items-center justify-center',
              day_button:
                'flex size-8 items-center justify-center rounded-full text-sm text-[#1a1c1e] transition hover:bg-[rgba(0,95,86,0.1)] focus:outline-none',
              selected:
                '[&>button]:bg-[#005f56] [&>button]:text-white [&>button]:font-semibold [&>button]:hover:bg-[#004a43]',
              today: '[&>button]:font-bold [&>button]:text-[#005f56]',
              outside: '[&>button]:text-[#cbd5e1]',
              disabled: '[&>button]:cursor-not-allowed [&>button]:text-[#e2e8f0] [&>button]:hover:bg-transparent',
            }}
          />
          {/* Quick actions */}
          <div className="mt-3 flex justify-between border-t border-[#f1f5f9] pt-3">
            <button
              type="button"
              className="text-xs font-medium text-[#94a3b8] transition hover:text-[#475569]"
              onClick={() => { onChange?.({ target: { value: '' } }); setOpen(false) }}
            >
              Εκκαθάριση
            </button>
            <button
              type="button"
              className="text-xs font-semibold text-[#005f56] transition hover:text-[#004a43]"
              onClick={() => handleSelect(today)}
            >
              Σήμερα
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
