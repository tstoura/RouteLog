import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { RouteCard } from '../../components/routes/RouteCard.tsx'
import { AppPageHeading } from '../../components/layout/AppPageHeading.tsx'
import { CreateRouteModal } from '../../components/forms/CreateRouteModal.tsx'
import { EmptyState } from '../../components/ui/EmptyState.tsx'
import { Input } from '../../components/ui/Input.tsx'
import { CustomSelect } from '../../components/ui/CustomSelect.tsx'
import {
  createClimbingRoute,
  listClimbingRoutes,
  type ClimbingRouteResponse,
} from '../../api/climbingRoutes.ts'
import { ApiError } from '../../api/client.ts'
import { scaleKeyFromGreek } from '../../constants/climbingFormOptions.ts'
import type { ClimbingRouteFormRecord } from '../../types/climbingRouteForm.ts'
import type { Route, RouteActivityKind } from '../../types/route.ts'

// ── Helpers ───────────────────────────────────────────────────────────────────

function routeResponseToRoute(r: ClimbingRouteResponse): Route {
  return {
    id: r.id,
    slug: r.id,
    name: r.name,
    sector: r.climbingField,
    mountain: r.mountainOrArea,
    difficultyLabel: r.defaultGrade ?? undefined,
    activityKind: 'rock_climbing',
    updatedAt: new Date().toISOString().slice(0, 10),
  }
}

function deduped(primary: Route[], extra: Route[]): Route[] {
  const seen = new Set(primary.map((r) => r.id))
  return [...primary, ...extra.filter((r) => !seen.has(r.id))]
}

function distinct<T>(values: (T | undefined)[]): T[] {
  const out: T[] = []
  const seen = new Set<T>()
  for (const v of values) {
    if (v !== undefined && v !== null && !seen.has(v)) {
      seen.add(v)
      out.push(v)
    }
  }
  return out
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 12

const categoryTabs: { kind: RouteActivityKind; label: string }[] = [
  { kind: 'hiking', label: 'Ορειβασία / Ορειβατικό Σκι' },
  { kind: 'rock_climbing', label: 'Αναρρίχηση Βράχου' },
  { kind: 'expedition', label: 'Αποστολές Εξωτερικού' },
]

/**
 * Maps URL ?field= param key → display label in the page eyebrow.
 * This is kept for backward compat with the climbing activity form's
 * "View routes in this field" link (?category=climbing&field=metropolis).
 */
const URL_FIELD_LABELS: Record<string, string> = {
  metropolis: 'ΚΥΡΙΟ ΠΕΔΙΟ - METROPOLIS',
  panagia: 'ΠΑΝΑΓΙΑ',
  galazio: 'ΣΤΡΟΦΙΛΙΑ - ΓΑΛΑΖΙΟ ΟΝΕΙΡΟ',
}

/**
 * Maps URL ?field= key → climbingField substring forwarded to the backend.
 * Used only when arriving from the activity form context.
 */
const URL_FIELD_KEYWORDS: Record<string, string> = {
  metropolis: 'metropolis',
  panagia: 'παναγ',
  galazio: 'γαλάζ',
}

// ── Component ─────────────────────────────────────────────────────────────────

export function RoutesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [kindFilter, setKindFilter] = useState<RouteActivityKind>('rock_climbing')

  // ── Filter state driven by URL params ─────────────────────────────────────
  // These four persist across navigation (back/forward) and page refresh.
  //   search  → free-text search sent to the backend
  //   sector  → client-side dropdown: climbingField value
  //   mountain → client-side dropdown: mountainOrArea value
  //   grade   → client-side dropdown: difficultyLabel value
  const queryParam = searchParams.get('search') ?? ''
  const dropdownField = searchParams.get('sector') ?? ''
  const dropdownMountain = searchParams.get('mountain') ?? ''
  const dropdownGrade = searchParams.get('grade') ?? ''

  // Controlled input value — mirrors queryParam but updates immediately on keypress,
  // then debounces the URL update so the backend isn't hammered per keystroke.
  const [searchInput, setSearchInput] = useState(queryParam)

  // Keep the input in sync when URL changes externally (back/forward navigation).
  useEffect(() => {
    setSearchInput(queryParam)
  }, [queryParam])

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleSearchChange(value: string) {
    setSearchInput(value)
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = setTimeout(() => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (value.trim()) next.set('search', value.trim())
          else next.delete('search')
          return next
        },
        { replace: true },
      )
    }, 350)
  }

  function setFilterParam(key: string, value: string) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true },
    )
  }

  function setFieldFilter(value: string) { setFilterParam('sector', value) }
  function setMountainFilter(value: string) { setFilterParam('mountain', value) }
  function setGradeFilter(value: string) { setFilterParam('grade', value) }

  function clearAllFilters() {
    setSearchInput('')
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('search')
        next.delete('sector')
        next.delete('mountain')
        next.delete('grade')
        return next
      },
      { replace: true },
    )
  }

  const [page, setPage] = useState(1)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createModalNonce, setCreateModalNonce] = useState(0)

  // Backend fetch state
  const [fetchedRoutes, setFetchedRoutes] = useState<Route[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)

  // Routes created this session — prepended to the list immediately after creation
  const [createdRoutes, setCreatedRoutes] = useState<Route[]>([])

  // ── URL params ─────────────────────────────────────────────────────────────

  const urlCategory = searchParams.get('category')
  const urlFieldKey = searchParams.get('field')
  const urlKindResolved: RouteActivityKind | null =
    urlCategory === 'climbing'
      ? 'rock_climbing'
      : urlCategory === 'hiking'
        ? 'hiking'
        : urlCategory === 'expedition'
          ? 'expedition'
          : null

  const filterKind = urlKindResolved ?? kindFilter
  const fromActivityContext = urlCategory === 'climbing' && urlFieldKey != null
  const urlContextFieldKeyword = urlFieldKey ? (URL_FIELD_KEYWORDS[urlFieldKey] ?? urlFieldKey) : undefined
  const fieldEyebrow = urlFieldKey ? (URL_FIELD_LABELS[urlFieldKey] ?? urlFieldKey.toUpperCase()) : null

  const showNewRouteCta = filterKind === 'rock_climbing'

  const clearUrlParams = () => {
    setSearchInput('')
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    setSearchParams({}, { replace: true })
  }

  // ── Fetch from backend ─────────────────────────────────────────────────────
  // queryParam is already debounced (350 ms) by handleSearchChange, so we fire
  // the request immediately when it changes rather than adding a second delay.

  useEffect(() => {
    if (filterKind !== 'rock_climbing') {
      setFetchedRoutes([])
      setFetchError(null)
      return
    }

    setIsLoading(true)
    setFetchError(null)
    listClimbingRoutes({
      q: queryParam || undefined,
      // When coming from the activity form context, pre-filter by field
      climbingField: urlContextFieldKeyword,
      take: 100,
    })
      .then((results) => {
        setFetchedRoutes(results.map(routeResponseToRoute))
        setPage(1)
      })
      .catch(() => setFetchError('Σφάλμα φόρτωσης διαδρομών. Δοκιμάστε ξανά.'))
      .finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParam, filterKind, urlContextFieldKeyword])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [dropdownField, dropdownGrade, dropdownMountain])

  // ── All routes (fetched + session-created, deduped) ────────────────────────

  const allRoutes = useMemo(
    () => deduped(fetchedRoutes, createdRoutes),
    [fetchedRoutes, createdRoutes],
  )

  // ── Derive filter options from the full fetched set (pre-client-filter) ────

  const fieldOptions = useMemo(
    () => distinct(allRoutes.map((r) => r.sector)).sort((a, b) => a.localeCompare(b, 'el')),
    [allRoutes],
  )
  const mountainOptions = useMemo(
    () => distinct(allRoutes.map((r) => r.mountain)).sort((a, b) => a.localeCompare(b, 'el')),
    [allRoutes],
  )
  const gradeOptions = useMemo(
    () => distinct(allRoutes.map((r) => r.difficultyLabel)).sort(),
    [allRoutes],
  )

  // ── Client-side filter ─────────────────────────────────────────────────────

  const filtered = useMemo(
    () =>
      allRoutes
        .filter((r) => !dropdownField || r.sector === dropdownField)
        .filter((r) => !dropdownMountain || r.mountain === dropdownMountain)
        .filter((r) => !dropdownGrade || r.difficultyLabel === dropdownGrade),
    [allRoutes, dropdownField, dropdownMountain, dropdownGrade],
  )

  // ── Pagination ─────────────────────────────────────────────────────────────

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageSlice = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  // ── Modal handlers ─────────────────────────────────────────────────────────

  const openCreateRouteModal = useCallback(() => {
    setCreateModalNonce((n) => n + 1)
    setCreateError(null)
    setCreateModalOpen(true)
  }, [])

  const handleSaveNewRouteFromList = useCallback(async (r: ClimbingRouteFormRecord) => {
    setCreateError(null)
    const scaleKey = scaleKeyFromGreek(r.difficultyScale) || 'french'
    try {
      const res = await createClimbingRoute({
        name: r.name,
        climbingField: r.field,
        mountainOrArea: r.mountainOrArea,
        defaultScale: scaleKey,
        defaultGrade: r.difficultyGrade,
        altitude: r.altitude ? Number(r.altitude) : undefined,
        routeLength: r.routeLength ? Number(r.routeLength) : undefined,
      })
      setCreatedRoutes((prev) => [routeResponseToRoute(res), ...prev])
      setCreateModalOpen(false)
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setCreateError('Η διαδρομή υπάρχει ήδη στη βάση. Αναζητήστε την παραπάνω.')
      } else {
        setCreateError('Σφάλμα αποθήκευσης διαδρομής. Δοκιμάστε ξανά.')
      }
    }
  }, [])

  // ── Render ─────────────────────────────────────────────────────────────────

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

      {createError ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {createError}
        </div>
      ) : null}

      {fromActivityContext && fieldEyebrow ? (
        <div className="space-y-2">
          <p className="text-xs font-extrabold uppercase tracking-[2.2px] text-[#64748b]">ΠΕΔΙΟ: {fieldEyebrow}</p>
          <AppPageHeading title="Διαδρομές" description="Διαδρομές στο ίδιο πεδίο με την καταχώρησή σου" />
        </div>
      ) : (
        <AppPageHeading title="Διαδρομές" description="Αναζήτησε και εξερεύνησε διαδρομές" />
      )}

      {/* Search */}
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 z-[1] -translate-y-1/2 text-[#64748b]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" />
            <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
        <Input
          type="search"
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Αναζήτηση διαδρομής"
          className="h-12 w-full rounded-xl border border-[#e8e8ed] bg-white py-3 pl-12 pr-4 text-sm shadow-sm placeholder:text-[#94a3b8]"
          aria-label="Αναζήτηση διαδρομών"
        />
      </div>

      {/* Category tabs + New Route CTA */}
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
                  clearUrlParams()
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
              <span className="text-lg leading-none" aria-hidden>+</span>
              Νέα Διαδρομή
            </button>
            <p className="text-center text-xs text-[#64748b] sm:text-right">
              Δεν βρίσκεις τη διαδρομή; Πρόσθεσέ τη στη βάση.
            </p>
          </div>
        ) : null}
      </div>

      {/* Data-driven dropdowns — only shown for rock_climbing with actual routes loaded */}
      {filterKind === 'rock_climbing' && allRoutes.length > 0 ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {fieldOptions.length > 0 ? (
            <CustomSelect
              value={dropdownField}
              onChange={setFieldFilter}
              heightClass="h-11"
              className="min-w-[160px] flex-1 sm:max-w-[240px]"
              aria-label="Πεδίο (φίλτρο)"
              options={[
                { value: '', label: 'Πεδίο' },
                ...fieldOptions.map((f) => ({ value: f, label: f })),
              ]}
            />
          ) : null}

          {mountainOptions.length > 0 ? (
            <CustomSelect
              value={dropdownMountain}
              onChange={setMountainFilter}
              heightClass="h-11"
              className="min-w-[160px] flex-1 sm:max-w-[240px]"
              aria-label="Βουνό / Περιοχή (φίλτρο)"
              options={[
                { value: '', label: 'Βουνό / Περιοχή' },
                ...mountainOptions.map((m) => ({ value: m, label: m })),
              ]}
            />
          ) : null}

          {gradeOptions.length > 0 ? (
            <CustomSelect
              value={dropdownGrade}
              onChange={setGradeFilter}
              heightClass="h-11"
              className="min-w-[195px] flex-1 sm:max-w-[240px]"
              aria-label="Βαθμός δυσκολίας (φίλτρο)"
              options={[
                { value: '', label: 'Βαθμός Δυσκολίας' },
                ...gradeOptions.map((g) => ({ value: g, label: g })),
              ]}
            />
          ) : null}
        </div>
      ) : null}

      {/* Active filter chips */}
      {(dropdownField || dropdownGrade || dropdownMountain) ? (
        <div className="flex flex-wrap items-center gap-2">
          {dropdownField ? (
            <FilterChip label={dropdownField} onRemove={() => setFieldFilter('')} />
          ) : null}
          {dropdownMountain ? (
            <FilterChip label={dropdownMountain} onRemove={() => setMountainFilter('')} />
          ) : null}
          {dropdownGrade ? (
            <FilterChip label={dropdownGrade} onRemove={() => setGradeFilter('')} />
          ) : null}
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-xs text-[#64748b] hover:underline cursor-pointer"
          >
            Καθαρισμός φίλτρων
          </button>
        </div>
      ) : null}

      {/* Routes list */}
      <section className="space-y-4" aria-labelledby="routes-list-heading">
        <h2 id="routes-list-heading" className="sr-only">Λίστα διαδρομών</h2>

        {fetchError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {fetchError}
          </div>
        ) : isLoading ? (
          <div className="py-12 text-center text-sm text-[#64748b]">Φόρτωση διαδρομών…</div>
        ) : filterKind !== 'rock_climbing' ? (
          <EmptyState
            title="Σύντομα διαθέσιμο"
            description="Οι διαδρομές για αυτήν την κατηγορία δεν είναι ακόμα διαθέσιμες."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Δεν βρέθηκαν διαδρομές"
            description={
              showNewRouteCta
                ? 'Δοκιμάστε άλλη αναζήτηση ή αλλάξτε φίλτρα. Μπορείτε να προσθέσετε νέα διαδρομή με το κουμπί παραπάνω.'
                : 'Δοκιμάστε άλλη αναζήτηση ή αλλάξτε φίλτρα.'
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
          <>
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
              {pageSlice.map((r) => (
                <li key={r.id}>
                  <RouteCard route={r} />
                </li>
              ))}
            </ul>

            {/* Pagination — only shown when there are multiple pages */}
            {totalPages > 1 ? (
              <nav className="flex items-center justify-center gap-2 pt-4" aria-label="Σελιδοποίηση">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="flex size-10 cursor-pointer items-center justify-center rounded-lg bg-[#f3f3f6] text-sm font-semibold text-[#475569] transition hover:bg-[#e8e8ec] disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Προηγούμενη σελίδα"
                >
                  ‹
                </button>
                <span className="min-w-[6rem] text-center text-sm font-medium text-[#475569]">
                  {safePage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="flex size-10 cursor-pointer items-center justify-center rounded-lg bg-[#f3f3f6] text-sm font-semibold text-[#475569] transition hover:bg-[#e8e8ec] disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Επόμενη σελίδα"
                >
                  ›
                </button>
              </nav>
            ) : null}
          </>
        )}
      </section>
    </div>
  )
}

// ── FilterChip ─────────────────────────────────────────────────────────────────

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e0f2f1] px-3 py-1 text-xs font-semibold text-[#0f766e]">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="cursor-pointer rounded-full hover:text-[#134e4a]"
        aria-label={`Αφαίρεση φίλτρου ${label}`}
      >
        ×
      </button>
    </span>
  )
}
