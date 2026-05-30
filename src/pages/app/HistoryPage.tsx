import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AppPageHeading } from '../../components/layout/AppPageHeading.tsx'
import { HistoryActivityCard } from '../../components/history/HistoryActivityCard.tsx'
import { HistoryPillFilterSection } from '../../components/history/HistoryPillFilterSection.tsx'
import { Input } from '../../components/ui/Input.tsx'
import { CustomSelect } from '../../components/ui/CustomSelect.tsx'
import { getActivities, type ActivityListItem } from '../../api/activities.ts'
import {
  categoryToLabel,
  completionTypeToLabel,
  formatDateLabel,
  resolveKnownDifficultyLabel,
} from '../../lib/activityLabels.ts'
import type { HistoryInfoRow } from '../../types/historyCard.ts'
import { sortHistoryCardsByActivityDateDesc } from '../../lib/historyCardDateSort.ts'
import {
  matchesEntryStatusFilter,
  matchesRockCompletionFilter,
  type HistoryEntryStatusFilter,
  type RockCompletionFilterKey,
} from '../../lib/historyRockFilters.ts'
import type { HistoryCard } from '../../types/historyCard.ts'
import type { ActivityKind } from '../../types/activity.ts'

// ── Category filter bar ────────────────────────────────────────────────────────

/**
 * URL uses `rock_climbing` to match existing `ActivityKind` type.
 * When calling the backend, `rock_climbing` is mapped to `climbing`.
 */
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

function participantsText(n: number): string {
  return n === 1 ? `Άτομο: 1` : `Άτομα: ${n}`
}

// ── Backend → HistoryCard mapper ───────────────────────────────────────────────

function buildHistoryCard(item: ActivityListItem): HistoryCard {
  const dateLabel = formatDateLabel(item.date)
  // Backend uses "climbing"; frontend ActivityKind uses "rock_climbing" for card tinting.
  const kind: ActivityKind =
    item.category === 'climbing' ? 'rock_climbing' : (item.category as ActivityKind)
  const status = item.isOfficial ? ('official' as const) : ('personal' as const)
  const catLabel = categoryToLabel(item.category)

  if (item.category === 'hiking' && item.hikingDetail) {
    const h = item.hikingDetail
    const rows: HistoryInfoRow[] = []

    // Route line — only render when at least one endpoint is present; never show " → " alone.
    const hasStart = Boolean(h.startPoint)
    const hasEnd = Boolean(h.endPoint)
    if (hasStart && hasEnd) {
      rows.push({ iconKey: 'pin', text: `Αφετηρία: ${h.startPoint} → Τερματισμός: ${h.endPoint}` })
    } else if (hasStart) {
      rows.push({ iconKey: 'pin', text: `Αφετηρία: ${h.startPoint}` })
    } else if (hasEnd) {
      rows.push({ iconKey: 'pin', text: `Τερματισμός: ${h.endPoint}` })
    }
    // Both missing → omit the route row entirely.

    // Altitude — always show for official; for personal only show when meaningfully > 0
    // (Phase A stores 0 when the user left the field empty on a personal record).
    if (item.isOfficial || h.maxAltitude > 0) {
      rows.push({ iconKey: 'mountain', text: `Μέγιστο υψόμετρο: ${h.maxAltitude} m` })
    }

    if (item.points != null) rows.push({ iconKey: 'award', text: `Βαθμοί: ${item.points}` })
    rows.push({ iconKey: 'users', text: participantsText(h.participantsNum) })
    return {
      id: item.id, kind, categoryLabel: catLabel, dateLabel, title: h.mountain,
      difficultyBadge: resolveKnownDifficultyLabel(h.difficultyGrade),
      infoRows: rows, status, detailSlug: item.id,
    }
  }

  if (item.category === 'climbing' && item.climbingDetail) {
    const c = item.climbingDetail
    // Badge: prefer mappedGrade, then difficultyGrade, then mixedClimbing
    const gradeBadge = c.mappedGrade ?? c.difficultyGrade ?? c.mixedClimbing ?? undefined
    const rows: HistoryInfoRow[] = [
      { iconKey: 'pin', text: `${c.climbingField} · ${c.mountainOrArea}` },
    ]
    if (item.isOfficial || c.altitude > 0) {
      rows.push({ iconKey: 'mountain', text: `Υψόμετρο: ${c.altitude} m` })
    }
    if (item.isOfficial || c.routeLength > 0) {
      rows.push({ iconKey: 'ruler', text: `Ανάπτυγμα: ${c.routeLength} m` })
    }
    if (item.points != null) rows.push({ iconKey: 'award', text: `Βαθμοί: ${item.points}` })
    rows.push({ iconKey: 'users', text: participantsText(c.participantsNum) })
    return {
      id: item.id, kind, categoryLabel: catLabel, dateLabel, title: c.routeName,
      difficultyBadge: gradeBadge ? resolveKnownDifficultyLabel(gradeBadge) : undefined,
      infoRows: rows, status, detailSlug: item.id,
      rockCompletion: (c.completionType ?? undefined) as HistoryCard['rockCompletion'],
      styleBadge: c.completionType ? completionTypeToLabel(c.completionType) : undefined,
    }
  }

  if (item.category === 'expedition' && item.expeditionDetail) {
    const e = item.expeditionDetail
    const rows: HistoryInfoRow[] = [
      { iconKey: 'pin', text: `${e.country} · ${e.mountainRange}` },
    ]
    // Altitude: always show for official; for personal only show when meaningfully > 0
    // (Phase A stores 0 when the user left the field empty on a personal record).
    if (item.isOfficial || e.altitude > 0) {
      rows.push({ iconKey: 'mountain', text: `Υψόμετρο: ${e.altitude} m` })
    }
    if (item.points != null) rows.push({ iconKey: 'award', text: `Βαθμοί: ${item.points}` })
    rows.push({ iconKey: 'users', text: participantsText(e.participantsNum) })
    return {
      id: item.id, kind, categoryLabel: catLabel, dateLabel, title: e.mountain,
      difficultyBadge: resolveKnownDifficultyLabel(e.difficultyGrade),
      infoRows: rows, status, detailSlug: item.id,
    }
  }

  // Fallback for unknown category or missing detail
  return {
    id: item.id, kind: 'hiking', categoryLabel: catLabel, dateLabel,
    title: 'Δραστηριότητα', infoRows: [], status, detailSlug: item.id,
  }
}

/** Map frontend `ActivityKind` to backend category string. */
function kindToBackendCategory(kind: ActivityKind | 'all'): string | undefined {
  if (kind === 'all') return undefined
  if (kind === 'rock_climbing') return 'climbing'
  return kind
}

// ── Page ───────────────────────────────────────────────────────────────────────

export function HistoryPage() {
  const { search } = useLocation()

  const [query, setQuery] = useState('')
  const [year, setYear] = useState('all')
  const [rockCompletion, setRockCompletion] = useState<RockCompletionFilterKey>('all')
  const [entryStatus, setEntryStatus] = useState<HistoryEntryStatusFilter>('all')

  // Loading state
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [allCards, setAllCards] = useState<HistoryCard[]>([])

  const activeKind = useMemo((): ActivityKind | 'all' => {
    const sp = new URLSearchParams(search)
    const raw = sp.get('kind')
    if (raw === 'hiking' || raw === 'rock_climbing' || raw === 'expedition') return raw
    return 'all'
  }, [search])

  // Fetch from backend when activeKind changes
  useEffect(() => {
    setIsLoading(true)
    setLoadError(null)

    const backendCategory = kindToBackendCategory(activeKind)

    getActivities(backendCategory)
      .then((items) => {
        setAllCards(sortHistoryCardsByActivityDateDesc(items.map(buildHistoryCard)))
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Σφάλμα φόρτωσης ιστορικού.'
        setLoadError(msg)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [activeKind])

  // Dynamic year options derived from loaded data
  const yearOptions = useMemo(() => {
    const years = new Set<string>()
    for (const c of allCards) {
      const parts = c.dateLabel.split('/')
      if (parts.length === 3 && parts[2]) years.add(parts[2])
    }
    return [...years].sort((a, b) => b.localeCompare(a))
  }, [allCards])

  // Client-side filter on top of loaded data
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const rcFilter: RockCompletionFilterKey =
      activeKind === 'rock_climbing' ? rockCompletion : 'all'
    const stFilter: HistoryEntryStatusFilter =
      activeKind === 'rock_climbing' ? entryStatus : 'all'

    return allCards
      .filter((c) => {
        if (!q) return true
        return [c.title, c.difficultyBadge, c.styleBadge, c.categoryLabel, ...c.infoRows.map((r) => r.text)]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q)
      })
      .filter((c) => {
        if (year === 'all') return true
        const parts = c.dateLabel.split('/')
        return parts.length === 3 && parts[2] === year
      })
      .filter((c) => {
        if (activeKind !== 'rock_climbing') return true
        return matchesRockCompletionFilter(c, rcFilter) && matchesEntryStatusFilter(c, stFilter)
      })
  }, [allCards, activeKind, query, year, rockCompletion, entryStatus])

  return (
    <div className="flex flex-col gap-8">
      <AppPageHeading
        title="Ιστορικό Δραστηριοτήτων"
        description="Δείτε και διαχειριστείτε τις καταχωρήσεις σας"
      />

      {/* Category filter */}
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

      {/* Rock climbing sub-filters */}
      {activeKind === 'rock_climbing' ? (
        <div className="space-y-6">
          <p className="text-xs font-extrabold uppercase tracking-[2px] text-[#64748b]">
            ΕΜΦΑΝΙΣΗ: ΑΝΑΡΡΙΧΗΣΗ ΒΡΑΧΟΥ
          </p>
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

      {/* Search and year filter row */}
      <section className="flex flex-col gap-4 rounded-xl bg-transparent sm:flex-row sm:items-stretch">
        <CustomSelect
          value={year}
          onChange={setYear}
          heightClass="h-11"
          className="min-w-[150px] flex-1"
          aria-label="Έτος"
          options={[
            { value: 'all', label: 'Όλα τα έτη' },
            ...yearOptions.map((y) => ({ value: y, label: y })),
          ]}
        />
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

      {/* Loading state */}
      {isLoading ? (
        <p className="rounded-xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-10 text-center text-sm text-[#64748b]">
          Φόρτωση καταχωρήσεων...
        </p>
      ) : loadError ? (
        /* Error state */
        <p
          role="alert"
          className="rounded-xl border border-[#fca5a5] bg-[#fef2f2] p-6 text-sm text-[#b91c1c]"
        >
          {loadError}
        </p>
      ) : filtered.length === 0 ? (
        /* Empty state */
        <p className="rounded-xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-10 text-center text-sm text-[#64748b]">
          {allCards.length === 0
            ? 'Δεν υπάρχουν καταχωρήσεις ακόμα. Προσθέστε μια νέα δραστηριότητα!'
            : 'Δεν βρέθηκαν καταχωρήσεις για τα επιλεγμένα φίλτρα.'}
        </p>
      ) : (
        /* Results */
        <>
          <p className="text-xs font-semibold text-[#94a3b8]">
            {filtered.length} {filtered.length === 1 ? 'καταχώρηση' : 'καταχωρήσεις'}
          </p>
          <ul className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((entry) => (
              <li key={entry.id}>
                <HistoryActivityCard entry={entry} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

