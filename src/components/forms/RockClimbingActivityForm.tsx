import type { FormEvent } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FormSection } from '../ui/FormSection.tsx'
import { Input } from '../ui/Input.tsx'
import { Textarea } from '../ui/Textarea.tsx'
import {
  ActivityTypeTabs,
  type ActivityFormTabKind,
  DateInputWithCalendar,
  FieldHint,
  FieldHints,
  FieldLabel,
  FormActions,
  FormSidePanel,
  RadioGroupField,
  SidePanelPersonalOnly,
  SidePanelPointsCard,
  SidePanelRecordTypeToggle,
  SectionIconBasics,
  SectionIconNotes,
  SectionIconParticipation,
  SectionIconTechnical,
  SelectFieldControlled,
} from './shared/FormBuildingBlocks.tsx'
import { AutoFilledBadge } from './AutoFilledBadge.tsx'
import { CreateRouteModal } from './CreateRouteModal.tsx'
import { FormFieldHelperText } from './FormFieldHelperText.tsx'
import { RouteCombobox } from './RouteCombobox.tsx'
import {
  CLIMBING_COMPLETION_OPTIONS,
  CLIMBING_REPETITION_OPTIONS,
  CLIMBING_SCALE_ACTIVITY_OPTIONS,
  CLIMBING_SEASON_OPTIONS,
  MIXED_CLIMBING_HELPER,
  MIXED_CLIMBING_OPTIONS,
  NO_REGULAR_DIFFICULTY_OPTION,
  getGradeOptionsForScale,
  scaleKeyFromGreek,
  scaleKeyToGreek,
} from '../../constants/climbingFormOptions.ts'
import type { ClimbingRouteFormRecord } from '../../types/climbingRouteForm.ts'
import { AUTO_FILL_EDITABLE_HELPER, AUTO_FILL_ROUTE_HELPER } from './activityAutofillCopy.ts'
import {
  createClimbingRoute,
  getClimbingRouteById,
  searchClimbingRoutes,
  type ClimbingRouteResponse,
} from '../../api/climbingRoutes.ts'
import { submitClimbingActivity } from '../../api/activities.ts'
import { ApiError } from '../../api/client.ts'
import { useAuth } from '../../auth/AuthContext.tsx'
import { usePointsPreview } from '../../hooks/usePointsPreview.ts'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Map a backend ClimbingRouteResponse to the form's display record type. */
function routeResponseToFormRecord(r: ClimbingRouteResponse): ClimbingRouteFormRecord {
  return {
    id: r.id,
    name: r.name,
    field: r.climbingField,
    mountainOrArea: r.mountainOrArea,
    difficultyScale:
      r.defaultScale === 'uiaa'
        ? 'UIAA'
        : r.defaultScale === 'alpine'
          ? 'Alpine'
          : 'Γαλλική',
    difficultyGrade: r.defaultGrade ?? '',
    altitude: r.altitude != null ? String(r.altitude) : undefined,
    routeLength: r.routeLength != null ? String(r.routeLength) : undefined,
  }
}

// ── Label row + autofill badge ─────────────────────────────────────────────────

function FormLabelRow({ label, showBadge }: { label: string; showBadge: boolean }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <FieldLabel>{label}</FieldLabel>
      {showBadge ? <AutoFilledBadge /> : null}
    </div>
  )
}

// ── Props ──────────────────────────────────────────────────────────────────────

export type RockClimbingActivityFormProps = {
  /** Prefill from `/app/new/climbing?route=…` */
  initialRouteSlug?: string | null
  /** Called after successful backend submission; receives server-calculated points. */
  onSubmitSuccess?: (points: number | null) => void
  /** Points from the most recent successful submission, passed back by the parent. */
  lastSubmittedPoints?: number | null
  /** Activity type tab click; parent handles reset / navigation. */
  onActivityTabSelect: (kind: ActivityFormTabKind) => void
}

// ── Initial state ─────────────────────────────────────────────────────────────
// Route prefill from ?route=<uuid> is handled asynchronously by a useEffect
// after mount. The form always starts with empty route fields; the UUID fetch
// populates them once the backend responds.

function buildStateFromRouteSlug(_slug: string | null) {
  return {
    routeId: '',
    routeName: '',
    mountain: '',
    fieldSector: '',
    scaleKey: 'french' as string,
    gradeVal: '',
    altitude: '',
    routeLength: '',
    autofill: false,
    autofillHadAlt: false,
    autofillHadLen: false,
  }
}

/** Returns true when the string is a valid UUID (v4 shape). */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
function isUUID(s: string): boolean {
  return UUID_RE.test(s)
}

// ── Component ──────────────────────────────────────────────────────────────────

export function RockClimbingActivityForm({
  initialRouteSlug = null,
  onSubmitSuccess,
  lastSubmittedPoints: _lastSubmittedPoints,
  onActivityTabSelect,
}: RockClimbingActivityFormProps) {
  const { user } = useAuth()
  const seed = useMemo(() => buildStateFromRouteSlug(initialRouteSlug ?? null), [initialRouteSlug])

  // True when the user has at least one club membership.
  const hasClub = Boolean(user && user.memberships.length > 0)

  // ── Official / personal toggle ─────────────────────────────────────────────
  const [isOfficial, setIsOfficial] = useState(true)

  // When the user has no club, always force isOfficial = false.
  useEffect(() => {
    if (!hasClub) setIsOfficial(false)
  }, [hasClub])

  // ── Basic ──────────────────────────────────────────────────────────────────
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [season, setSeason] = useState('summer')
  const [repeat, setRepeat] = useState('new')

  // ── Route ──────────────────────────────────────────────────────────────────
  const [routeId, setRouteId] = useState(seed.routeId)
  const [routeName, setRouteName] = useState(seed.routeName)
  const [mountain, setMountain] = useState(seed.mountain)
  const [fieldSector, setFieldSector] = useState(seed.fieldSector)
  const [autofill, setAutofill] = useState(seed.autofill)
  const [autofillHadAlt, setAutofillHadAlt] = useState(seed.autofillHadAlt)
  const [autofillHadLen, setAutofillHadLen] = useState(seed.autofillHadLen)
  const [lockedRouteName, setLockedRouteName] = useState<string | null>(() =>
    seed.autofill && seed.routeName ? seed.routeName : null,
  )

  // ── Backend route search ───────────────────────────────────────────────────
  const [searchResults, setSearchResults] = useState<ClimbingRouteFormRecord[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // saveError is set only when POST /climbing-routes fails (inside handleSaveNewRoute)
  const [routeError, setRouteError] = useState<string | null>(null)

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    if (!routeName.trim()) {
      setSearchResults([])
      setSearchError(null)
      return
    }
    searchTimerRef.current = setTimeout(() => {
      setIsSearching(true)
      setSearchError(null)
      searchClimbingRoutes(routeName.trim())
        .then((results) => setSearchResults(results.map(routeResponseToFormRecord)))
        .catch(() => setSearchError('Σφάλμα αναζήτησης διαδρομών. Δοκιμάστε ξανά.'))
        .finally(() => setIsSearching(false))
    }, 350)
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    }
  }, [routeName])

  // Routes created during this session (already saved to backend)
  const [sessionRoutes, setSessionRoutes] = useState<ClimbingRouteFormRecord[]>([])
  const allRoutes = useMemo(() => {
    const seen = new Set(searchResults.map((r) => r.id))
    return [...searchResults, ...sessionRoutes.filter((r) => !seen.has(r.id))]
  }, [searchResults, sessionRoutes])

  // ── Difficulty ─────────────────────────────────────────────────────────────
  const [scaleKey, setScaleKey] = useState(seed.scaleKey)
  const [gradeVal, setGradeVal] = useState(seed.gradeVal)
  const [mixedClimbing, setMixedClimbing] = useState('')
  // When scale is '-' (no regular difficulty), show a single locked '—' option.
  const gradeOptions = useMemo(
    () => (scaleKey === '-' ? [NO_REGULAR_DIFFICULTY_OPTION] : getGradeOptionsForScale(scaleKey)),
    [scaleKey],
  )

  const handleScaleChange = useCallback((newScale: string) => {
    setScaleKey(newScale)
    // "-" sentinel means no regular difficulty (mixed/ice only); grade follows automatically.
    // Any real scale resets grade to empty so the user must choose from valid options.
    setGradeVal(newScale === '-' ? '-' : '')
  }, [])

  // ── Technical ──────────────────────────────────────────────────────────────
  const [altitude, setAltitude] = useState(seed.altitude)
  const [routeLength, setRouteLength] = useState(seed.routeLength)

  // ── Participation ──────────────────────────────────────────────────────────
  const [participantsNum, setParticipantsNum] = useState(1)
  const [participantsText, setParticipantsText] = useState('')

  // ── Optional fields ────────────────────────────────────────────────────────
  const [completionType, setCompletionType] = useState('')
  const [privateNotes, setPrivateNotes] = useState('')
  const [publicNotes, setPublicNotes] = useState('')

  // ── Live points preview ─────────────────────────────────────────────────────
  const effectiveIsOfficial = hasClub ? isOfficial : false
  const preview = usePointsPreview('climbing', {
    altitude: Number(altitude) || 0,
    routeLength: Number(routeLength) || 0,
    season,
    repetitionType: repeat,
    participantsNum,
    difficultyScale: scaleKey && scaleKey !== '-' ? scaleKey : null,
    difficultyGrade: gradeVal && gradeVal !== '-' ? gradeVal : null,
    mixedClimbing: mixedClimbing || null,
  }, effectiveIsOfficial)

  const scoreValue = effectiveIsOfficial
    ? preview.isLoading ? '...' : preview.points ?? '—'
    : '—'
  const scoreDesc = effectiveIsOfficial
    ? preview.isLoading
      ? 'Υπολογισμός...'
      : preview.isReady
        ? 'Βαθμοί ΕΟΟΑ'
        : 'Συμπληρώστε τα απαραίτητα πεδία για να εμφανιστούν οι βαθμοί.'
    : 'Δεν υπολογίζονται βαθμοί ΕΟΟΑ για προσωπικές καταγραφές.'

  // ── Modal ──────────────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false)
  const [modalSeed, setModalSeed] = useState<Partial<ClimbingRouteFormRecord>>({})
  const [modalNonce, setModalNonce] = useState(0)

  // ── Submit state ───────────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // ── Apply a selected/created route to form fields ──────────────────────────
  const applyRoute = useCallback((r: ClimbingRouteFormRecord) => {
    // Only real backend UUIDs count as routeId; mock/temp IDs do not
    const isRealId = r.id.length === 36 && !r.id.startsWith('temp-') && !r.id.startsWith('r-')
    setRouteId(isRealId ? r.id : '')
    setRouteName(r.name)
    setMountain(r.mountainOrArea)
    setFieldSector(r.field)
    const newScaleKey = scaleKeyFromGreek(r.difficultyScale) || 'french'
    setScaleKey(newScaleKey)
    // Use scale-aware lookup so UIAA/Alpine grades match their own options list.
    // Falls back to the raw value (empty → leaves grade unselected) rather than crashing.
    const rawGrade = r.difficultyGrade?.trim() ?? ''
    const scaleOptions = getGradeOptionsForScale(newScaleKey)
    const matched = scaleOptions.find(
      (o) => o.value !== '' && o.value.toLowerCase() === rawGrade.toLowerCase(),
    )
    setGradeVal(matched?.value ?? rawGrade)
    setAltitude(r.altitude ?? '')
    setRouteLength(r.routeLength ?? '')
    setAutofillHadAlt(Boolean(r.altitude))
    setAutofillHadLen(Boolean(r.routeLength))
    setAutofill(true)
    setLockedRouteName(r.name)
    setRouteError(null)
  }, [])

  // When ?route=<uuid> is passed from the Routes detail page, fetch the route
  // from the backend and apply it. Mock-slug prefill (legacy) is handled
  // synchronously via buildStateFromRouteSlug above; UUIDs are async.
  useEffect(() => {
    if (!initialRouteSlug || !isUUID(initialRouteSlug)) return
    getClimbingRouteById(initialRouteSlug)
      .then((res) => applyRoute(routeResponseToFormRecord(res)))
      .catch(() => {
        // Silently ignore — form starts empty and user can search manually
      })
  }, [initialRouteSlug, applyRoute])

  const handleRouteComboboxChange = useCallback(
    (v: string) => {
      setRouteName(v)
      if (lockedRouteName !== null && v !== lockedRouteName) {
        setAutofill(false)
        setLockedRouteName(null)
        setRouteId('')
      }
    },
    [lockedRouteName],
  )

  const openCreateModal = useCallback(
    (extra?: Partial<ClimbingRouteFormRecord>) => {
      // Don't carry the '-' sentinel into the CreateRouteModal — it expects a real scale.
      const modalScale =
        scaleKey && scaleKey !== '-' ? scaleKeyToGreek(scaleKey) : undefined
      setModalSeed({
        name: routeName,
        field: fieldSector,
        mountainOrArea: mountain,
        difficultyScale: modalScale,
        difficultyGrade: gradeVal !== '-' ? gradeVal : undefined,
        altitude: altitude || undefined,
        routeLength: routeLength || undefined,
        ...extra,
      })
      setModalNonce((n) => n + 1)
      setModalOpen(true)
    },
    [routeName, fieldSector, mountain, scaleKey, gradeVal, altitude, routeLength],
  )

  /**
   * Called by CreateRouteModal on save.
   * Persists the new route to the backend, then applies it to the form.
   * The modal is unmodified — it still calls onSave(record) synchronously;
   * we fire the async API call from here and close the modal when done.
   */
  const handleSaveNewRoute = useCallback(
    async (r: ClimbingRouteFormRecord) => {
      try {
        const created = await createClimbingRoute({
          name: r.name,
          mountainOrArea: r.mountainOrArea,
          climbingField: r.field,
          defaultScale: scaleKeyFromGreek(r.difficultyScale) || undefined,
          defaultGrade: r.difficultyGrade || undefined,
          altitude: r.altitude ? Number(r.altitude) : undefined,
          routeLength: r.routeLength ? Number(r.routeLength) : undefined,
        })
        const saved = routeResponseToFormRecord(created)
        setSessionRoutes((prev) => [...prev, saved])
        applyRoute(saved)
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          setRouteError('Η διαδρομή υπάρχει ήδη. Αναζητήστε την με το πεδίο αναζήτησης.')
        } else {
          setRouteError('Σφάλμα αποθήκευσης διαδρομής. Δοκιμάστε ξανά.')
        }
      }
      setModalOpen(false)
    },
    [applyRoute],
  )

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitError(null)

    if (!user) {
      setSubmitError('Δεν είστε συνδεδεμένος. Παρακαλώ συνδεθείτε ξανά.')
      return
    }

    // Backend also enforces this; the UI hides the toggle so this is a safety net.
    // effectiveIsOfficial is computed at component level.

    // routeId is always required — user must pick or create a backend route
    if (!routeId) {
      setSubmitError(
        'Απαιτείται επιλογή διαδρομής από τη βάση. Αναζητήστε ή δημιουργήστε μια νέα διαδρομή.',
      )
      return
    }

    // True when the user has selected a real scale+grade (not the '-' sentinel)
    const hasRegularDifficulty =
      Boolean(scaleKey) && scaleKey !== '-' && Boolean(gradeVal) && gradeVal !== '-'

    if (effectiveIsOfficial) {
      if (!altitude || Number(altitude) < 1) {
        setSubmitError('Το υψόμετρο είναι υποχρεωτικό για επίσημη καταγραφή.')
        return
      }
      if (!routeLength || Number(routeLength) <= 0) {
        setSubmitError('Το ανάπτυγμα διαδρομής είναι υποχρεωτικό για επίσημη καταγραφή.')
        return
      }
      if (participantsNum < 1) {
        setSubmitError('Απαιτείται τουλάχιστον 1 άτομο.')
        return
      }
      if (participantsNum > 1 && !participantsText.trim()) {
        setSubmitError(
          'Καταχωρήστε τους σχοινοσυντρόφους για επίσημη καταγραφή με περισσότερα από 1 άτομα.',
        )
        return
      }
      if (!mixedClimbing && !hasRegularDifficulty) {
        setSubmitError(
          'Απαιτείται βαθμός δυσκολίας ή βαθμός ΜΙΚΤΑ για επίσημη καταγραφή.',
        )
        return
      }
    }

    setIsSubmitting(true)
    const altitudeVal = Number(altitude)
    const routeLengthVal = Number(routeLength)
    try {
      const result = await submitClimbingActivity({
        isOfficial: effectiveIsOfficial,
        routeId,
        date,
        season,
        repetitionType: repeat,
        altitude: effectiveIsOfficial
          ? altitudeVal || 1
          : altitudeVal >= 1 ? altitudeVal : undefined,
        routeLength: effectiveIsOfficial
          ? routeLengthVal || 0.01
          : routeLengthVal >= 0.01 ? routeLengthVal : undefined,
        participantsNum,
        participantsText: participantsText.trim() || undefined,
        difficultyScale: hasRegularDifficulty ? scaleKey : undefined,
        difficultyGrade: hasRegularDifficulty ? gradeVal : undefined,
        mixedClimbing: mixedClimbing || undefined,
        completionType: completionType || undefined,
        privateNotes: privateNotes.trim() || undefined,
        publicNotes: publicNotes.trim() || undefined,
      })
      onSubmitSuccess?.(result.points)
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message)
      } else {
        setSubmitError('Απρόσμενο σφάλμα. Παρακαλώ δοκιμάστε ξανά.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {modalOpen ? (
        <CreateRouteModal
          key={modalNonce}
          initial={modalSeed}
          showLinkedActivityBadge
          onClose={() => setModalOpen(false)}
          onSave={handleSaveNewRoute}
        />
      ) : null}

      <form className="space-y-8" onSubmit={handleSubmit}>
        <ActivityTypeTabs active="climbing" onTabSelect={onActivityTabSelect} />

        <div className="grid gap-8 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-9">
            <FormSection title="ΒΑΣΙΚΑ ΣΤΟΙΧΕΙΑ" icon={<SectionIconBasics />}>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="col-span-full grid grid-cols-1 gap-y-4 md:grid-cols-2 md:gap-x-6 md:gap-y-4">
                  <div className="col-start-1 row-start-1">
                    <FieldLabel>ΗΜΕΡΟΜΗΝΙΑ</FieldLabel>
                  </div>
                  <div className="col-start-1 row-start-4 flex items-start justify-between gap-3 md:col-start-2 md:row-start-1">
                    <FormLabelRow label="ΔΙΑΔΡΟΜΗ" showBadge={false} />
                    <button
                      type="button"
                      onClick={() => openCreateModal()}
                      className="shrink-0 rounded bg-[rgba(0,69,62,0.1)] px-2 py-1 text-[10px] font-semibold uppercase text-[#00453e] transition hover:bg-[rgba(0,69,62,0.16)]"
                    >
                      + ΝΕΑ ΔΙΑΔΡΟΜΗ
                    </button>
                  </div>
                  <div className="col-start-1 row-start-2 md:row-start-2">
                    <DateInputWithCalendar
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                  <div className="col-start-1 row-start-5 md:col-start-2 md:row-start-2">
                    <RouteCombobox
                      value={routeName}
                      onChange={handleRouteComboboxChange}
                      routes={allRoutes}
                      onSelectRoute={(r) => applyRoute(r)}
                      onFooterNewRoute={() => openCreateModal()}
                      onEmptyCreateRoute={() => openCreateModal()}
                    />
                    {isSearching ? (
                      <p className="mt-1 text-xs text-[#94a3b8]">Αναζήτηση...</p>
                    ) : null}
                    {searchError ? (
                      <p className="mt-1 text-xs font-medium text-[#b91c1c]">{searchError}</p>
                    ) : null}
                    {autofill ? (
                      <div className="mt-2">
                        <AutoFilledBadge />
                      </div>
                    ) : null}
                  </div>
                  <div className="col-start-1 row-start-3 md:row-start-3">
                    <FieldHints>
                      <FieldHint>
                        Η ημερομηνία που πραγματοποιήθηκε η
                        <br />
                        αναρρίχηση
                      </FieldHint>
                    </FieldHints>
                  </div>
                  <div className="col-start-1 row-start-6 flex flex-col gap-3 md:col-start-2 md:row-start-3">
                    {routeError ? (
                      <p className="text-xs font-medium text-[#b91c1c]">{routeError}</p>
                    ) : null}
                    {autofill ? <FormFieldHelperText>{AUTO_FILL_ROUTE_HELPER}</FormFieldHelperText> : null}
                    {!autofill ? (
                      <FieldHints>
                        <FieldHint>
                          Αναζητήστε υπάρχουσα διαδρομή ή καταχωρήστε νέα.
                          <br />
                          <span className="italic">
                            Αν επιλέξετε υπάρχουσα διαδρομή, τα υπόλοιπα στοιχεία συμπληρώνονται
                            αυτόματα.
                          </span>
                        </FieldHint>
                      </FieldHints>
                    ) : null}
                  </div>
                </div>

                <label className="flex flex-col gap-3">
                  <FormLabelRow label="ΒΟΥΝΟ / ΠΕΡΙΟΧΗ" showBadge={autofill} />
                  <Input
                    disabled={autofill}
                    value={mountain}
                    onChange={(e) => setMountain(e.target.value)}
                    placeholder="Τοποθεσία"
                    className="h-14 text-base shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] disabled:cursor-not-allowed disabled:border-[#e2e8e0] disabled:bg-[#f1f5f9] disabled:text-[#334155] disabled:opacity-100"
                  />
                  {autofill ? <FormFieldHelperText>{AUTO_FILL_ROUTE_HELPER}</FormFieldHelperText> : null}
                  {!autofill ? (
                    <FieldHints>
                      <FieldHint>
                        Η ευρύτερη περιοχή ή το βουνό όπου βρίσκεται η διαδρομή.
                        <br />
                        <span className="italic">Συμπληρώνεται αυτόματα από τη διαδρομή ή ορίζεται χειροκίνητα.</span>
                      </FieldHint>
                    </FieldHints>
                  ) : null}
                </label>

                <label className="flex flex-col gap-3">
                  <FormLabelRow label="ΠΕΔΙΟ" showBadge={autofill} />
                  <Input
                    disabled={autofill}
                    value={fieldSector}
                    onChange={(e) => setFieldSector(e.target.value)}
                    placeholder="Πεδίο Αναρρίχησης"
                    className="h-14 text-base shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] disabled:cursor-not-allowed disabled:border-[#e2e8e0] disabled:bg-[#f1f5f9] disabled:text-[#334155] disabled:opacity-100"
                  />
                  {autofill ? <FormFieldHelperText>{AUTO_FILL_ROUTE_HELPER}</FormFieldHelperText> : null}
                  {!autofill ? (
                    <FieldHints>
                      <FieldHint>
                        Η ονομασία του αναρριχητικού πεδίου.
                        <br />
                        <span className="italic">Συμπληρώνεται αυτόματα αν επιλεγεί υπάρχουσα διαδρομή.</span>
                      </FieldHint>
                    </FieldHints>
                  ) : null}
                </label>

                <div className="flex flex-col gap-3 md:col-span-2">
                  <RadioGroupField
                    name="season"
                    label="ΕΠΟΧΗ"
                    options={CLIMBING_SEASON_OPTIONS}
                    value={season}
                    onChange={setSeason}
                  />
                  <FieldHints>
                    <FieldHint>Οι συνθήκες κατά την αναρρίχηση (θερινές ή χειμερινές).</FieldHint>
                    <FieldHint>
                      <span className="italic">Επιλέξτε με βάση τις συνθήκες της ημέρας.</span>
                    </FieldHint>
                  </FieldHints>
                </div>

                <div className="flex flex-col gap-3 md:col-span-2">
                  <RadioGroupField
                    name="repeat"
                    label="ΕΠΑΝΑΛΗΨΗ"
                    options={CLIMBING_REPETITION_OPTIONS}
                    value={repeat}
                    onChange={setRepeat}
                  />
                  <FieldHints>
                    <FieldHint>Δηλώστε αν πρόκειται για νέα αναρριχητική διαδρομή ή υπάρχουσα.</FieldHint>
                  </FieldHints>
                </div>
              </div>
            </FormSection>

            <FormSection title="ΤΕΧΝΙΚΑ ΧΑΡΑΚΤΗΡΙΣΤΙΚΑ" icon={<SectionIconTechnical />}>
              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-3">
                  <SelectFieldControlled
                    label="ΤΡΟΠΟΣ ΟΛΟΚΛΗΡΩΣΗΣ"
                    options={CLIMBING_COMPLETION_OPTIONS}
                    value={completionType}
                    onChange={setCompletionType}
                  />
                  <FieldHints>
                    <FieldHint>Προαιρετικά: περιγράφει τον τρόπο που ολοκληρώθηκε η διαδρομή.</FieldHint>
                    {effectiveIsOfficial && (
                      <FieldHint>
                        <span className="italic">Δεν επηρεάζει τη βαθμολόγηση ΕΟΟΑ και δεν εξάγεται.</span>
                      </FieldHint>
                    )}
                  </FieldHints>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                  <div className="flex flex-col gap-3">
                    <FieldLabel>ΚΛΙΜΑΚΑ ΔΥΣΚΟΛΙΑΣ</FieldLabel>
                    <SelectFieldControlled
                      options={CLIMBING_SCALE_ACTIVITY_OPTIONS}
                      value={scaleKey}
                      onChange={handleScaleChange}
                      selectClassName="h-14 text-base shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
                    />
                    {autofill ? <AutoFilledBadge /> : null}
                    <FieldHints>
                      <FieldHint>
                        {autofill
                          ? AUTO_FILL_EDITABLE_HELPER
                          : 'Επιλέξτε το σύστημα βαθμολόγησης ή "—" για μόνο ΜΙΚΤΑ.'}
                      </FieldHint>
                    </FieldHints>
                  </div>

                  <div className="flex flex-col gap-3">
                    <FieldLabel>ΒΑΘΜΟΣ ΔΥΣΚΟΛΙΑΣ</FieldLabel>
                    <SelectFieldControlled
                      options={gradeOptions}
                      value={gradeVal}
                      onChange={setGradeVal}
                      selectClassName="h-14 text-base shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
                      disabled={scaleKey === '-'}
                      disabledValues={['']}
                    />
                    {autofill ? <AutoFilledBadge /> : null}
                    <FieldHints>
                      <FieldHint>
                        {autofill ? (
                          AUTO_FILL_EDITABLE_HELPER
                        ) : (
                          <>
                            Επιλέξτε τον βαθμό δυσκολίας της διαδρομής.
                            <br />
                            <span className="italic">
                              Αν επιλέξετε υπάρχουσα διαδρομή, προτείνεται αυτόματα τιμή.
                            </span>
                          </>
                        )}
                      </FieldHint>
                    </FieldHints>
                  </div>

                  <div className="flex flex-col gap-3">
                    <SelectFieldControlled
                      label="ΜΙΚΤΑ"
                      options={MIXED_CLIMBING_OPTIONS}
                      value={mixedClimbing}
                      onChange={setMixedClimbing}
                    />
                    <FieldHints>
                      <FieldHint>{MIXED_CLIMBING_HELPER}</FieldHint>
                    </FieldHints>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <label className="flex flex-col gap-3">
                    <FieldLabel>ΥΨΟΜΕΤΡΟ (M)</FieldLabel>
                    <Input
                      type="number"
                      min="1"
                      value={altitude}
                      onChange={(e) => setAltitude(e.target.value)}
                      placeholder="Υψόμετρο αναρρίχησης (m)"
                      className="h-14 text-base shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
                    />
                    {autofill && autofillHadAlt ? <AutoFilledBadge /> : null}
                    {effectiveIsOfficial && (
                      <FieldHints>
                        <FieldHint>
                          Για υψόμετρο έως 1000 m εφαρμόζεται ο ελάχιστος συντελεστής της βαθμολογίας.
                          <br />
                          <span className="italic">Για μεγαλύτερο υψόμετρο, η εποχή επηρεάζει τη βαθμολογία.</span>
                        </FieldHint>
                      </FieldHints>
                    )}
                  </label>

                  <label className="flex flex-col gap-3">
                    <FieldLabel>ΑΝΑΠΤΥΓΜΑ ΔΙΑΔΡΟΜΗΣ (M)</FieldLabel>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={routeLength}
                      onChange={(e) => setRouteLength(e.target.value)}
                      placeholder="Συνολικό μήκος αναρρίχησης (m)"
                      className="h-14 text-base shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
                    />
                    {autofill && autofillHadLen ? <AutoFilledBadge /> : null}
                    {effectiveIsOfficial && (
                      <FieldHints>
                        <FieldHint>
                          Για ανάπτυγμα έως 100 m εφαρμόζεται το ελάχιστο όριο της βαθμολογίας.
                          <br />
                          <span className="italic">Για μεγαλύτερο ανάπτυγμα, η πραγματική τιμή επηρεάζει τους βαθμούς.</span>
                        </FieldHint>
                      </FieldHints>
                    )}
                  </label>
                </div>
              </div>
            </FormSection>

            <FormSection title="ΣΥΜΜΕΤΟΧΗ & ΠΡΟΣΘΕΤΑ ΣΤΟΙΧΕΙΑ" icon={<SectionIconParticipation />}>
              <div className="grid gap-6 md:grid-cols-4">
                <div className="flex flex-col gap-3">
                  <FieldLabel>ΑΤΟΜΑ</FieldLabel>
                  <div className="flex items-center rounded-lg border border-[#e2e8e0] bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
                    <button
                      type="button"
                      onClick={() => setParticipantsNum((n) => Math.max(1, n - 1))}
                      aria-label="Μείωση αριθμού ατόμων"
                      className="cursor-pointer px-4 py-4 text-lg text-[#64748b]"
                    >
                      −
                    </button>
                    <Input
                      type="number"
                      min="1"
                      value={participantsNum}
                      onChange={(e) => setParticipantsNum(Math.max(1, Number(e.target.value)))}
                      className="h-14 rounded-none border-0 text-center shadow-none ring-0 focus:ring-0"
                    />
                    <button
                      type="button"
                      onClick={() => setParticipantsNum((n) => n + 1)}
                      aria-label="Αύξηση αριθμού ατόμων"
                      className="cursor-pointer px-4 py-4 text-lg text-[#64748b]"
                    >
                      +
                    </button>
                  </div>
                  <FieldHints>
                    <FieldHint>
                      {effectiveIsOfficial ? (
                        <>
                          Αριθμός συμμετεχόντων από τον σύλλογο.
                          <br />
                          <span className="italic">Λαμβάνονται υπόψη μόνο μέλη του συλλόγου.</span>
                        </>
                      ) : (
                        'Αριθμός συμμετεχόντων στην αναρρίχηση.'
                      )}
                    </FieldHint>
                  </FieldHints>
                </div>

                <div className="flex flex-col gap-3 md:col-span-3">
                  <FieldLabel>ΣΧΟΙΝΟΣΥΝΤΡΟΦΟΙ</FieldLabel>
                  <div className="rounded-lg border border-[#e2e8e0] bg-white p-2 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#d1fae5] bg-[#ecfdf5] px-3 py-1 text-xs font-semibold text-[#065f46]">
                        Εσείς
                      </span>
                      <Input
                        value={participantsText}
                        onChange={(e) => setParticipantsText(e.target.value)}
                        placeholder="Προσθήκη σχοινοσύντροφου..."
                        className="min-w-[200px] flex-1 border-0 shadow-none focus:ring-0"
                      />
                    </div>
                  </div>
                  <FieldHints>
                    <FieldHint>
                      {participantsNum > 1
                        ? 'Καταχώρησε τα ονόματα των υπόλοιπων σχοινοσυντρόφων (χωρίς εσένα).'
                        : 'Αν αναρριχηθήκατε μόνος/η, αφήστε αυτό το πεδίο κενό.'}
                    </FieldHint>
                  </FieldHints>
                </div>
              </div>
            </FormSection>

            <FormSection title="ΣΗΜΕΙΩΣΕΙΣ" icon={<SectionIconNotes />}>
              <div className="flex flex-col gap-10">
                <label className="flex flex-col gap-3">
                  <FieldLabel>ΠΡΟΣΩΠΙΚΗ ΣΗΜΕΙΩΣΗ (ΠΡΟΑΙΡΕΤΙΚΑ)</FieldLabel>
                  <Textarea
                    value={privateNotes}
                    onChange={(e) => setPrivateNotes(e.target.value)}
                    placeholder="Καταγράψτε μια προσωπική σημείωση ή ανάμνηση από τη δράση"
                    className="min-h-[150px]"
                  />
                  <FieldHints>
                    <FieldHint>Ιδιωτική σημείωση για την εμπειρία σου.</FieldHint>
                  </FieldHints>
                </label>

                <label className="flex flex-col gap-3">
                  <FieldLabel>ΑΞΙΟΛΟΓΗΣΗ ΔΙΑΔΡΟΜΗΣ (ΠΡΟΑΙΡΕΤΙΚΑ)</FieldLabel>
                  <Textarea
                    value={publicNotes}
                    onChange={(e) => setPublicNotes(e.target.value)}
                    placeholder="Καταγράψτε πληροφορίες ή εμπειρίες χρήσιμες για άλλους χρήστες"
                    className="min-h-[150px]"
                  />
                  <FieldHints>
                    <FieldHint>Πληροφορίες χρήσιμες για άλλους αναρριχητές.</FieldHint>
                  </FieldHints>
                </label>
              </div>
            </FormSection>

            {submitError ? (
              <div
                role="alert"
                className="rounded-lg border border-[#fca5a5] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]"
              >
                {submitError}
              </div>
            ) : null}

            <FormActions submitText={isSubmitting ? 'Υποβολή...' : 'Υποβολή Καταχώρησης'} />
          </div>

          <FormSidePanel colSpan={3}>
            {hasClub ? (
              <>
                <SidePanelRecordTypeToggle value={isOfficial} onChange={setIsOfficial} />
                {effectiveIsOfficial && (
                  <SidePanelPointsCard value={scoreValue} description={scoreDesc} />
                )}
              </>
            ) : (
              <SidePanelPersonalOnly />
            )}
          </FormSidePanel>
        </div>
      </form>
    </>
  )
}
