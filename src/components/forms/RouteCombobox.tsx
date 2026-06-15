import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { PlusCircle, Search } from 'lucide-react'
import type { ClimbingRouteFormRecord } from '../../types/climbingRouteForm.ts'

type Props = {
  id?: string
  /**
   * Accessible name for the combobox input (visible «ΔΙΑΔΡΟΜΗ» is usually not a `<label>`).
   * @default Διαδρομή
   */
  ariaLabel?: string
  value: string
  onChange: (value: string) => void
  routes: ClimbingRouteFormRecord[]
  onSelectRoute: (route: ClimbingRouteFormRecord) => void
  onFooterNewRoute: () => void
  onEmptyCreateRoute: () => void
}

function routeMatchesQuery(route: ClimbingRouteFormRecord, q: string): boolean {
  const s = q.trim().toLowerCase()
  if (!s) return false
  const blob = [route.name, route.mountainOrArea, route.field].join(' ').toLowerCase()
  return blob.includes(s)
}

export function RouteCombobox({
  id: idProp,
  ariaLabel = 'Διαδρομή',
  value,
  onChange,
  routes,
  onSelectRoute,
  onFooterNewRoute,
  onEmptyCreateRoute,
}: Props) {
  const reactId = useId()
  const listboxId = idProp ?? `route-combobox-${reactId}`
  const containerRef = useRef<HTMLDivElement>(null)
  const listboxRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const queryActive = value.trim().length > 0
  const matches = useMemo(
    () => (queryActive ? routes.filter((r) => routeMatchesQuery(r, value)) : []),
    [routes, value, queryActive],
  )
  const showEmpty = queryActive && matches.length === 0

  // Total keyboard-navigable items: route matches + footer "new route" button
  const totalItems = matches.length + 1 // +1 for footer button
  const footerIndex = matches.length

  const close = useCallback(() => {
    setOpen(false)
    setActiveIndex(-1)
  }, [])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      const el = containerRef.current
      if (!el?.contains(e.target as Node)) close()
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open, close])

  // Scroll the active option into view whenever activeIndex changes
  useEffect(() => {
    if (!open || activeIndex < 0) return
    const listbox = listboxRef.current
    if (!listbox) return
    const activeEl = listbox.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
    activeEl?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, open])

  const handleSelect = (route: ClimbingRouteFormRecord) => {
    onSelectRoute(route)
    close()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || !queryActive) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (showEmpty) return
      setActiveIndex((prev) => (prev + 1) % totalItems)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (showEmpty) return
      setActiveIndex((prev) => (prev <= 0 ? totalItems - 1 : prev - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (showEmpty) return
      if (activeIndex >= 0 && activeIndex < matches.length) {
        handleSelect(matches[activeIndex])
      } else if (activeIndex === footerIndex) {
        close()
        onFooterNewRoute()
      } else if (matches.length === 1) {
        // no item highlighted but only one result — select it
        handleSelect(matches[0])
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      close()
    } else if (e.key === 'Tab') {
      close()
    }
  }

  const activeOptionId =
    open && activeIndex >= 0 && activeIndex < matches.length
      ? `${listboxId}-option-${activeIndex}`
      : undefined

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <span className="pointer-events-none absolute left-2 top-1/2 z-[1] -translate-y-1/2 text-[#64748b]" aria-hidden>
          <Search className="size-3.5" strokeWidth={2} />
        </span>
        <input
          id={listboxId}
          role="combobox"
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-controls={`${listboxId}-listbox`}
          aria-autocomplete="list"
          aria-activedescendant={activeOptionId}
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setOpen(true)
            setActiveIndex(-1)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Αναζητήστε υπάρχουσα διαδρομή"
          autoComplete="off"
          className="w-full min-w-0 rounded-lg border border-[#e2e8e0] bg-white py-3 pl-6 pr-3 text-sm text-[#1a1c1e] outline-none ring-[#005f56] transition placeholder:text-sm placeholder:text-[#94a3b8] focus:border-[#005f56] focus:ring-2"
        />
      </div>

      {open && queryActive ? (
        <div
          ref={listboxRef}
          id={`${listboxId}-listbox`}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 max-h-72 overflow-auto rounded-xl border border-[#e8eef0] bg-white py-2 shadow-[0_12px_40px_-8px_rgba(15,23,42,0.18)]"
        >
          {showEmpty ? (
            <div className="px-4 py-4">
              <p className="text-sm font-bold text-[#022c22]">Δεν βρέθηκε διαδρομή</p>
              <p className="mt-2 text-xs leading-relaxed text-[#64748b]">Πρόσθεσε τη διαδρομή στη βάση για να τη χρησιμοποιήσεις.</p>
              <button
                type="button"
                onClick={() => {
                  close()
                  onEmptyCreateRoute()
                }}
                className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#bbf7d0] bg-[#ecfdf5] px-4 py-3 text-sm font-semibold text-[#065f46] transition hover:bg-[#d1fae5]"
              >
                <PlusCircle className="size-5 shrink-0" strokeWidth={2} aria-hidden />
                Δημιουργία νέας διαδρομής
              </button>
            </div>
          ) : (
            <>
              {matches.map((route, idx) => {
                const active = idx === activeIndex
                return (
                  <button
                    key={route.id}
                    id={`${listboxId}-option-${idx}`}
                    data-index={idx}
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={[
                      'flex w-full cursor-pointer flex-col gap-0.5 px-4 py-3 text-left text-sm transition',
                      active ? 'bg-[#f0fdf4]' : 'hover:bg-[#f8fafc]',
                    ].join(' ')}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(route)}
                  >
                    <span className="font-semibold text-[#022c22]">{route.name}</span>
                    <span className="text-xs text-[#64748b]">
                      {route.mountainOrArea} — {route.field}
                    </span>
                  </button>
                )
              })}
              <div className="border-t border-[#eef2f2] px-2 py-2">
                <button
                  type="button"
                  data-index={footerIndex}
                  onMouseEnter={() => setActiveIndex(footerIndex)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    close()
                    onFooterNewRoute()
                  }}
                  className={[
                    'w-full cursor-pointer rounded-lg px-3 py-2.5 text-center text-[11px] font-bold uppercase tracking-wide text-[#00453e] transition',
                    activeIndex === footerIndex
                      ? 'bg-[rgba(0,69,62,0.14)]'
                      : 'bg-[rgba(0,69,62,0.08)] hover:bg-[rgba(0,69,62,0.14)]',
                  ].join(' ')}
                >
                  + ΝΕΑ ΔΙΑΔΡΟΜΗ
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}
