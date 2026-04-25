import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AppPageHeading } from '../../components/layout/AppPageHeading.tsx'
import { HistoryActivityCard } from '../../components/history/HistoryActivityCard.tsx'
import { HistoryPillFilterSection } from '../../components/history/HistoryPillFilterSection.tsx'
import { Input } from '../../components/ui/Input.tsx'
import { Select } from '../../components/ui/Select.tsx'
import { mockHistoryCards } from '../../data/mockHistoryCards.ts'
import { sortHistoryCardsByActivityDateDesc } from '../../lib/historyCardDateSort.ts'
import {
  matchesEntryStatusFilter,
  matchesRockCompletionFilter,
  type HistoryEntryStatusFilter,
  type RockCompletionFilterKey,
} from '../../lib/historyRockFilters.ts'
import type { ActivityKind } from '../../types/activity.ts'

const categoryFilters: { kind: ActivityKind | 'all'; label: string }[] = [
  { kind: 'all', label: 'Όλες' },
  { kind: 'hiking', label: 'Ορειβασία / Ορειβατικό Σκι' },
  { kind: 'rock_climbing', label: 'Αναρρίχηση Βράχου' },
  { kind: 'expedition', label: 'Αποστολές Εξωτερικού' },
]

const rockCompletionPillOptions: { value: RockCompletionFilterKey; label: string }[] = [
  { value: 'all', label: 'Όλες' },
  { value: 'on_sight', label: 'On Sight' },
  { value: 'flash', label: 'Flash' },
  { value: 'red_point', label: 'Red Point' },
]

const entryStatusPillOptions: { value: HistoryEntryStatusFilter; label: string }[] = [
  { value: 'all', label: 'Όλες' },
  { value: 'official', label: 'Επίσημες' },
  { value: 'personal', label: 'Προσωπικές' },
]

export function HistoryPage() {
  const { search } = useLocation()
  const [query, setQuery] = useState('')
  const [year, setYear] = useState('all')
  const [rockCompletion, setRockCompletion] = useState<RockCompletionFilterKey>('all')
  const [entryStatus, setEntryStatus] = useState<HistoryEntryStatusFilter>('all')

  const activeKind = useMemo((): ActivityKind | 'all' => {
    const sp = new URLSearchParams(search)
    const raw = sp.get('kind')
    if (raw === 'hiking' || raw === 'rock_climbing' || raw === 'expedition') return raw
    return 'all'
  }, [search])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const rcFilter: RockCompletionFilterKey = activeKind === 'rock_climbing' ? rockCompletion : 'all'
    const stFilter: HistoryEntryStatusFilter = activeKind === 'rock_climbing' ? entryStatus : 'all'
    const list = mockHistoryCards
      .filter((c) => (activeKind === 'all' ? true : c.kind === activeKind))
      .filter((c) => {
        if (!q) return true
        const blob = [c.title, c.locationLine, c.metricLine, c.peopleLine, c.styleBadge, c.categoryLabel]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return blob.includes(q)
      })
      .filter((c) => {
        if (year === 'all') return true
        const parts = c.dateLabel.split('/')
        const y = parts.length === 3 ? parts[2] : ''
        return y === year
      })
      .filter((c) => {
        if (activeKind !== 'rock_climbing') return true
        return matchesRockCompletionFilter(c, rcFilter) && matchesEntryStatusFilter(c, stFilter)
      })

    return sortHistoryCardsByActivityDateDesc(list)
  }, [activeKind, query, year, rockCompletion, entryStatus])

  return (
    <div className="flex flex-col gap-8">
      <AppPageHeading title="Ιστορικό Δραστηριοτήτων" description="Δείτε και διαχειριστείτε τις καταχωρήσεις σας" />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[#4c616c]">Κατηγορία</h2>
        <div className="flex flex-wrap gap-2">
          {categoryFilters.map((f) => {
            const href = f.kind === 'all' ? '/app/history' : `/app/history?kind=${f.kind}`
            const active = activeKind === f.kind
            return (
              <Link
                key={f.kind}
                to={href}
                className={[
                  'cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition',
                  active
                    ? 'bg-[#00453e] text-white shadow-[0px_0px_0px_1px_rgba(190,201,198,0.3)]'
                    : 'bg-[#f3f3f6] text-[#1a1c1e] shadow-[0px_0px_0px_1px_rgba(190,201,198,0.3)] hover:bg-[#e8e8ec]',
                ].join(' ')}
              >
                {f.label}
              </Link>
            )
          })}
        </div>
      </section>

      {activeKind === 'rock_climbing' ? (
        <div className="space-y-6">
          <p className="text-xs font-extrabold uppercase tracking-[2px] text-[#64748b]">ΕΜΦΑΝΙΣΗ: ΑΝΑΡΡΙΧΗΣΗ ΒΡΑΧΟΥ</p>
          <HistoryPillFilterSection
            title="Τρόπος ολοκλήρωσης"
            value={rockCompletion}
            onChange={setRockCompletion}
            options={rockCompletionPillOptions}
            aria-label="Φίλτρο τρόπου ολοκλήρωσης"
          />
          <HistoryPillFilterSection
            title="Καταχώρηση"
            value={entryStatus}
            onChange={setEntryStatus}
            options={entryStatusPillOptions}
            aria-label="Φίλτρο τύπου καταχώρησης"
          />
        </div>
      ) : null}

      <section className="flex flex-col gap-4 rounded-xl bg-transparent sm:flex-row sm:items-stretch">
        <div className="relative min-w-[150px] flex-1">
          <Select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="appearance-none bg-[#e2e2e5] py-3 pl-4 pr-10 text-sm font-medium text-[#1a1c1e] shadow-[0px_0px_0px_1px_rgba(190,201,198,0.3)]"
            aria-label="Έτος"
          >
            <option value="all">Όλα τα έτη</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2023">2023</option>
          </Select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#4c616c]">▾</span>
        </div>
        <div className="relative min-w-[250px] flex-[1.5]">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#4c616c]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" />
              <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </span>
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Αναζήτηση διαδρομής ή βουνού..."
            className="border-0 bg-[#e2e2e5] py-3 pl-12 pr-4 text-sm shadow-[0px_0px_0px_1px_rgba(190,201,198,0.3)] placeholder:text-[#4c616c]"
            aria-label="Αναζήτηση"
          />
        </div>
      </section>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-10 text-center text-sm text-[#64748b]">
          Δεν βρέθηκαν καταχωρήσεις για τα επιλεγμένα φίλτρα.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((entry) => (
            <li key={entry.id}>
              <HistoryActivityCard entry={entry} />
            </li>
          ))}
        </ul>
      )}

      <nav className="flex justify-center gap-2 pb-8 pt-4" aria-label="Σελιδοποίηση">
        <PaginationButton label="Προηγούμενη σελίδα" disabled>
          ‹
        </PaginationButton>
        <PaginationButton active>1</PaginationButton>
        <PaginationButton>2</PaginationButton>
        <PaginationButton>3</PaginationButton>
        <PaginationButton label="Επόμενη σελίδα">›</PaginationButton>
      </nav>
    </div>
  )
}

function PaginationButton({
  children,
  active,
  disabled,
  label,
}: {
  children: ReactNode
  active?: boolean
  disabled?: boolean
  label?: string
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={label}
      className={[
        'flex size-10 items-center justify-center rounded-lg text-sm font-semibold transition',
        active
          ? 'cursor-default bg-[#00453e] text-white'
          : 'cursor-pointer bg-[#f3f3f6] text-[#475569] hover:bg-[#e8e8ec] disabled:cursor-not-allowed disabled:opacity-40',
      ].join(' ')}
    >
      {children}
    </button>
  )
}
