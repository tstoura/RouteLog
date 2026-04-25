import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { RouteCard } from '../../components/routes/RouteCard.tsx'
import { AppPageHeading } from '../../components/layout/AppPageHeading.tsx'
import { CreateRouteModal } from '../../components/forms/CreateRouteModal.tsx'
import { EmptyState } from '../../components/ui/EmptyState.tsx'
import { Input } from '../../components/ui/Input.tsx'
import { Select } from '../../components/ui/Select.tsx'
import { mockRoutes } from '../../data/mockRoutes.ts'
import { climbingFormRecordToRoute } from '../../lib/climbingFormRecordToRoute.ts'
import { sortRoutesByUpdatedAtDesc } from '../../lib/historyCardDateSort.ts'
import type { ClimbingRouteFormRecord } from '../../types/climbingRouteForm.ts'
import type { Route, RouteActivityKind } from '../../types/route.ts'

const categoryTabs: { kind: RouteActivityKind; label: string }[] = [
  { kind: 'hiking', label: 'Ορειβασία / Ορειβατικό Σκι' },
  { kind: 'rock_climbing', label: 'Αναρρίχηση Βράχου' },
  { kind: 'expedition', label: 'Αποστολές Εξωτερικού' },
]

const FIELD_LABELS: Record<string, string> = {
  metropolis: 'ΚΥΡΙΟ ΠΕΔΙΟ - METROPOLIS',
  panagia: 'ΠΑΝΑΓΙΑ',
  galazio: 'ΣΤΡΟΦΙΛΙΑ - ΓΑΛΑΖΙΟ ΟΝΕΙΡΟ',
}

export function RoutesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [kindFilter, setKindFilter] = useState<RouteActivityKind>('rock_climbing')
  const [fieldPlace, setFieldPlace] = useState('')
  const [gradePlace, setGradePlace] = useState('')
  const [mountainPlace, setMountainPlace] = useState('')
  const [newRoutesFromModal, setNewRoutesFromModal] = useState<Route[]>([])
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createModalNonce, setCreateModalNonce] = useState(0)

  const openCreateRouteModal = useCallback(() => {
    setCreateModalNonce((n) => n + 1)
    setCreateModalOpen(true)
  }, [])

  const handleSaveNewRouteFromList = useCallback((r: ClimbingRouteFormRecord) => {
    setNewRoutesFromModal((prev) => [...prev, climbingFormRecordToRoute(r)])
    setCreateModalOpen(false)
  }, [])

  const urlCategory = searchParams.get('category')
  const urlFieldRaw = searchParams.get('field')
  const urlKindResolved: RouteActivityKind | null =
    urlCategory === 'climbing'
      ? 'rock_climbing'
      : urlCategory === 'hiking'
        ? 'hiking'
        : urlCategory === 'expedition'
          ? 'expedition'
          : null
  const urlFieldNormalized =
    urlFieldRaw === 'metropolis' || urlFieldRaw === 'panagia' || urlFieldRaw === 'galazio' ? urlFieldRaw : null

  const filterKind = urlKindResolved ?? kindFilter
  const filterField = urlFieldNormalized ?? fieldPlace

  const fromActivityContext = urlCategory === 'climbing' && urlFieldRaw === 'metropolis'

  const showNewRouteCta = filterKind === 'rock_climbing'
  const showFieldFilter = filterKind === 'rock_climbing'

  const clearSearchAndPersist = () => {
    setSearchParams({}, { replace: true })
  }

  const routeSource = useMemo(() => [...mockRoutes, ...newRoutesFromModal], [newRoutesFromModal])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = routeSource
      .filter((r) => r.activityKind === filterKind)
      .filter((r) => {
        if (!filterField || r.activityKind !== 'rock_climbing') return true
        return r.fieldKey === filterField
      })
      .filter((r) => {
        if (!gradePlace || gradePlace === 'all-grades') return true
        const g = (r.difficultyLabel ?? '').toLowerCase()
        if (gradePlace === '6c') return g.includes('6c') && !g.includes('6c+')
        if (gradePlace === '7a') return g.includes('7a')
        if (gradePlace === '7b') return g.includes('7b') || g.includes('8')
        return true
      })
      .filter((r) => {
        if (!mountainPlace) return true
        const m = (r.mountain ?? '').toLowerCase()
        if (mountainPlace === 'kleisoura') return m.includes('κλεισούρα')
        if (mountainPlace === 'kalogria') return m.includes('καλόγρια')
        if (mountainPlace === 'olympos') return m.includes('όλυμπο')
        return true
      })
      .filter((r) => {
        if (!q) return true
        const blob = [r.name, r.region, r.sector, r.mountain, r.difficultyLabel].filter(Boolean).join(' ').toLowerCase()
        return blob.includes(q)
      })
    return sortRoutesByUpdatedAtDesc(list)
  }, [query, filterKind, filterField, gradePlace, mountainPlace, routeSource])

  const fieldEyebrow = fromActivityContext ? FIELD_LABELS.metropolis : filterField ? FIELD_LABELS[filterField] : null

  return (
    <div className="flex flex-col gap-8">
      {createModalOpen ? (
        <CreateRouteModal
          key={createModalNonce}
          initial={{}}
          showLinkedActivityBadge={false}
          onClose={() => setCreateModalOpen(false)}
          onSave={handleSaveNewRouteFromList}
        />
      ) : null}
      {fromActivityContext && fieldEyebrow ? (
        <div className="space-y-2">
          <p className="text-xs font-extrabold uppercase tracking-[2.2px] text-[#64748b]">ΠΕΔΙΟ: {fieldEyebrow}</p>
          <AppPageHeading title="Διαδρομές" description="Διαδρομές στο ίδιο πεδίο με την καταχώρησή σου" />
        </div>
      ) : (
        <AppPageHeading title="Διαδρομές" description="Αναζήτησε και εξερεύνησε διαδρομές" />
      )}

      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 z-[1] -translate-y-1/2 text-[#64748b]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" />
            <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Αναζήτηση διαδρομής, πεδίου ή βουνού"
          className="h-12 w-full rounded-xl border border-[#e8e8ed] bg-white py-3 pl-12 pr-4 text-sm shadow-sm placeholder:text-[#94a3b8]"
          aria-label="Αναζήτηση διαδρομών"
        />
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Κατηγορία διαδρομής">
          {categoryTabs.map((t) => {
            const active = filterKind === t.kind
            return (
              <button
                key={t.kind}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setKindFilter(t.kind)
                  clearSearchAndPersist()
                }}
                className={[
                  'cursor-pointer rounded-full px-4 py-2.5 text-sm font-semibold transition',
                  active
                    ? 'bg-[#00453e] text-white shadow-[0px_0px_0px_1px_rgba(190,201,198,0.3)]'
                    : 'bg-[#e8e8ec] text-[#3f4947] shadow-[0px_0px_0px_1px_rgba(190,201,198,0.25)] hover:bg-[#dedee2]',
                ].join(' ')}
              >
                {t.label}
              </button>
            )
          })}
        </div>

        {showNewRouteCta ? (
          <div className="flex flex-col items-stretch gap-1 sm:items-end">
            <button
              type="button"
              onClick={openCreateRouteModal}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#00453e] px-5 py-3 text-sm font-semibold text-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] transition hover:bg-[#003a32]"
            >
              <span className="text-lg leading-none" aria-hidden>
                +
              </span>
              Νέα Διαδρομή
            </button>
            <p className="text-center text-xs text-[#64748b] sm:text-right">Δεν βρίσκεις τη διαδρομή; Πρόσθεσέ τη στη βάση.</p>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {showFieldFilter ? (
          <div className="relative min-w-[140px] flex-1 sm:max-w-[200px]">
            <Select
              value={filterField}
              onChange={(e) => {
                setFieldPlace(e.target.value)
                clearSearchAndPersist()
              }}
              className="h-11 w-full cursor-pointer appearance-none rounded-full border-0 bg-[#e8e8ec] py-2 pl-4 pr-10 text-sm font-medium text-[#1a1c1e]"
              aria-label="Πεδίο (φίλτρο)"
            >
              <option value="">Πεδίο</option>
              <option value="metropolis">Κύριο Πεδίο - Metropolis</option>
              <option value="panagia">Παναγιά</option>
              <option value="galazio">Στροφιλιά - Γαλάζιο Όνειρο</option>
            </Select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#4c616c]">▾</span>
          </div>
        ) : null}
        <div className="relative min-w-[140px] flex-1 sm:max-w-[200px]">
          <Select
            value={gradePlace}
            onChange={(e) => setGradePlace(e.target.value)}
            className="h-11 w-full cursor-pointer appearance-none rounded-full border-0 bg-[#e8e8ec] py-2 pl-4 pr-10 text-sm font-medium text-[#1a1c1e]"
            aria-label="Βαθμός δυσκολίας (φίλτρο)"
          >
            <option value="">Βαθμός Δυσκολίας</option>
            <option value="all-grades">Όλοι</option>
            <option value="6c">6C</option>
            <option value="7a">7A</option>
            <option value="7b">7B+</option>
          </Select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#4c616c]">▾</span>
        </div>
        <div className="relative min-w-[140px] flex-1 sm:max-w-[220px]">
          <Select
            value={mountainPlace}
            onChange={(e) => setMountainPlace(e.target.value)}
            className="h-11 w-full cursor-pointer appearance-none rounded-full border-0 bg-[#e8e8ec] py-2 pl-4 pr-10 text-sm font-medium text-[#1a1c1e]"
            aria-label="Βουνό / περιοχή (φίλτρο)"
          >
            <option value="">Βουνό / Περιοχή</option>
            <option value="kleisoura">Κλεισούρα</option>
            <option value="kalogria">Καλόγρια</option>
            <option value="olympos">Όλυμπος</option>
          </Select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#4c616c]">▾</span>
        </div>
      </div>

      <section className="space-y-4" aria-labelledby="routes-list-heading">
        <h2 id="routes-list-heading" className="sr-only">
          Λίστα διαδρομών
        </h2>

        {filtered.length === 0 ? (
          <EmptyState
            title="Δεν βρέθηκαν διαδρομές"
            description={
              showNewRouteCta
                ? 'Δοκιμάστε άλλη αναζήτηση ή αλλάξτε κατηγορία. Μπορείτε να προσθέσετε νέα διαδρομή με το κουμπί παραπάνω.'
                : 'Δοκιμάστε άλλη αναζήτηση ή αλλάξτε κατηγορία.'
            }
            action={
              showNewRouteCta ? (
                <button
                  type="button"
                  onClick={openCreateRouteModal}
                  className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-[#00453e] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#003a32]"
                >
                  Νέα Διαδρομή
                </button>
              ) : undefined
            }
          />
        ) : (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
            {filtered.map((r) => (
              <li key={r.id}>
                <RouteCard route={r} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {filtered.length > 0 ? (
        <nav className="flex justify-center gap-2 pb-4 pt-2" aria-label="Σελιδοποίηση">
          <PaginationButton label="Προηγούμενη σελίδα" disabled>
            ‹
          </PaginationButton>
          <PaginationButton active>1</PaginationButton>
          <PaginationButton>2</PaginationButton>
          <PaginationButton>3</PaginationButton>
          <PaginationButton label="Επόμενη σελίδα">›</PaginationButton>
        </nav>
      ) : null}
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
