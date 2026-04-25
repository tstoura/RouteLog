import { useCallback, useMemo, useState } from 'react'
import { FormSection } from '../ui/FormSection.tsx'
import { Input } from '../ui/Input.tsx'
import {
  ActivityTypeTabs,
  type ActivityFormTabKind,
  DateInputWithCalendar,
  FieldHint,
  FieldHints,
  FieldLabel,
  FormActions,
  NotesSection,
  OfficialParticipationSection,
  type Option,
  ACTIVITY_SEASON_RADIO_OPTIONS,
  RadioGroupField,
  ScoreSummaryCard,
  SectionIconBasics,
  SectionIconParticipation,
  SectionIconTechnical,
  SelectField,
  SelectFieldControlled,
} from './shared/FormBuildingBlocks.tsx'
import { AutoFilledBadge } from './AutoFilledBadge.tsx'
import { CreateRouteModal } from './CreateRouteModal.tsx'
import { FormFieldHelperText } from './FormFieldHelperText.tsx'
import { RouteCombobox } from './RouteCombobox.tsx'
import { getBaseClimbingFormRoutes } from '../../data/climbingFormRoutes.ts'
import {
  CLIMBING_GRADE_OPTIONS,
  CLIMBING_SCALE_FORM_OPTIONS,
  coerceGradeOptionValue,
  scaleKeyFromGreek,
  scaleKeyToGreek,
} from '../../constants/climbingFormOptions.ts'
import type { ClimbingRouteFormRecord } from '../../types/climbingRouteForm.ts'
import { mapRouteToClimbingFormValues } from '../../lib/activityRoutePrefill.ts'
import { AUTO_FILL_ROUTE_HELPER } from './activityAutofillCopy.ts'

const repeatRadioOptions = [
  { value: 'νέα', label: 'Νέα' },
  { value: 'επανάληψη', label: 'Επανάληψη' },
]

const completionOptions: Option[] = [
  { value: '', label: 'Επιλέξτε τρόπο ολοκλήρωσης' },
  { value: 'onsight', label: 'On Sight' },
  { value: 'flash', label: 'Flash' },
  { value: 'redpoint', label: 'Red Point' },
  { value: 'toprope', label: 'Top Rope' },
]

const mixedOptions: Option[] = [
  { value: '', label: 'Επιλογή' },
  { value: 'όχι', label: 'Όχι' },
  { value: 'μικτό', label: 'Μικτό' },
  { value: 'πάγος', label: 'Πάγος' },
]

const gradeSelectOptions: Option[] = CLIMBING_GRADE_OPTIONS as Option[]
const scaleSelectOptions: Option[] = CLIMBING_SCALE_FORM_OPTIONS as Option[]

/** Label row + autofill badge; same flex layout as the route field row. */
function FormLabelRow({ label, showBadge }: { label: string; showBadge: boolean }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <FieldLabel>{label}</FieldLabel>
      {showBadge ? <AutoFilledBadge /> : null}
    </div>
  )
}

export type RockClimbingActivityFormProps = {
  /** Prefill from `/app/new/climbing?route=…` */
  initialRouteSlug?: string | null
  /** Called after mock submit (parent shows banner / resets form). */
  onMockSubmitSuccess?: () => void
  /** Activity type tab click (including the active tab); parent handles reset / navigation. */
  onActivityTabSelect: (kind: ActivityFormTabKind) => void
}

function buildStateFromRouteSlug(slug: string | null) {
  const mapped = slug ? mapRouteToClimbingFormValues(slug) : undefined
  if (!mapped) {
    return {
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
  return {
    routeName: mapped.name,
    mountain: mapped.mountainOrArea,
    fieldSector: mapped.field,
    scaleKey: scaleKeyFromGreek(mapped.difficultyScale) || 'french',
    gradeVal: coerceGradeOptionValue(mapped.difficultyGrade),
    altitude: mapped.altitude ?? '',
    routeLength: mapped.routeLength ?? '',
    autofill: true,
    autofillHadAlt: Boolean(mapped.altitude),
    autofillHadLen: Boolean(mapped.routeLength),
  }
}

export function RockClimbingActivityForm({
  initialRouteSlug = null,
  onMockSubmitSuccess,
  onActivityTabSelect,
}: RockClimbingActivityFormProps) {
  const seed = useMemo(() => buildStateFromRouteSlug(initialRouteSlug ?? null), [initialRouteSlug])

  const [season, setSeason] = useState('θερινή')
  const [repeat, setRepeat] = useState('νέα')

  const [routeName, setRouteName] = useState(seed.routeName)
  const [mountain, setMountain] = useState(seed.mountain)
  const [fieldSector, setFieldSector] = useState(seed.fieldSector)
  const [scaleKey, setScaleKey] = useState(seed.scaleKey)
  const [gradeVal, setGradeVal] = useState(seed.gradeVal)
  const [altitude, setAltitude] = useState(seed.altitude)
  const [routeLength, setRouteLength] = useState(seed.routeLength)

  const [autofill, setAutofill] = useState(seed.autofill)
  const [autofillHadAlt, setAutofillHadAlt] = useState(seed.autofillHadAlt)
  const [autofillHadLen, setAutofillHadLen] = useState(seed.autofillHadLen)
  /** Route name after last list pick; if text diverges, mountain/field unlock from autofill lock. */
  const [lockedRouteName, setLockedRouteName] = useState<string | null>(() =>
    seed.autofill && seed.routeName ? seed.routeName : null,
  )

  const [userRoutes, setUserRoutes] = useState<ClimbingRouteFormRecord[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [modalSeed, setModalSeed] = useState<Partial<ClimbingRouteFormRecord>>({})
  const [modalNonce, setModalNonce] = useState(0)

  const allRoutes = useMemo(() => [...getBaseClimbingFormRoutes(), ...userRoutes], [userRoutes])

  const applyRoute = useCallback((r: ClimbingRouteFormRecord) => {
    setRouteName(r.name)
    setMountain(r.mountainOrArea)
    setFieldSector(r.field)
    setScaleKey(scaleKeyFromGreek(r.difficultyScale) || 'french')
    setGradeVal(coerceGradeOptionValue(r.difficultyGrade))
    setAltitude(r.altitude ?? '')
    setRouteLength(r.routeLength ?? '')
    setAutofillHadAlt(Boolean(r.altitude))
    setAutofillHadLen(Boolean(r.routeLength))
    setAutofill(true)
    setLockedRouteName(r.name)
  }, [])

  const handleRouteComboboxChange = useCallback((v: string) => {
    setRouteName(v)
    if (lockedRouteName !== null && v !== lockedRouteName) {
      setAutofill(false)
      setLockedRouteName(null)
    }
  }, [lockedRouteName])

  const openCreateModal = useCallback(
    (extra?: Partial<ClimbingRouteFormRecord>) => {
      setModalSeed({
        name: routeName,
        field: fieldSector,
        mountainOrArea: mountain,
        difficultyScale: scaleKeyToGreek(scaleKey || 'french'),
        difficultyGrade: gradeVal,
        altitude: altitude || undefined,
        routeLength: routeLength || undefined,
        ...extra,
      })
      setModalNonce((n) => n + 1)
      setModalOpen(true)
    },
    [routeName, fieldSector, mountain, scaleKey, gradeVal, altitude, routeLength],
  )

  const handleSaveNewRoute = useCallback(
    (r: ClimbingRouteFormRecord) => {
      setUserRoutes((prev) => [...prev, r])
      applyRoute(r)
      setModalOpen(false)
    },
    [applyRoute],
  )

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

      <form
        className="space-y-8"
        onSubmit={(e) => {
          e.preventDefault()
          onMockSubmitSuccess?.()
        }}
      >
        <ActivityTypeTabs active="climbing" onTabSelect={onActivityTabSelect} />

        <div className="grid gap-8 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-8">
            <FormSection title="ΒΑΣΙΚΑ ΣΤΟΙΧΕΙΑ" icon={<SectionIconBasics />}>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="col-span-full grid grid-cols-1 gap-y-4 md:grid-cols-2 md:gap-x-6 md:gap-y-4">
                  <div className="col-start-1 row-start-1">
                    <FieldLabel>ΗΜΕΡΟΜΗΝΙΑ</FieldLabel>
                  </div>
                  <div className="col-start-1 row-start-4 flex items-start justify-between gap-3 md:col-start-2 md:row-start-1">
                    <FormLabelRow label="ΔΙΑΔΡΟΜΗ" showBadge={autofill} />
                    <button
                      type="button"
                      onClick={() => openCreateModal()}
                      className="shrink-0 rounded bg-[rgba(0,69,62,0.1)] px-2 py-1 text-[10px] font-semibold uppercase text-[#00453e] transition hover:bg-[rgba(0,69,62,0.16)]"
                    >
                      + ΝΕΑ ΔΙΑΔΡΟΜΗ
                    </button>
                  </div>
                  <div className="col-start-1 row-start-2 md:row-start-2">
                    <DateInputWithCalendar defaultValue="04/17/2026" />
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
                    {autofill ? <FormFieldHelperText>{AUTO_FILL_ROUTE_HELPER}</FormFieldHelperText> : null}
                    <FieldHints>
                      <FieldHint>
                        Αναζήτησε υπάρχουσα διαδρομή ή καταχωρήστε νέα.
                        <br />
                        <span className="italic">Αν επιλέξετε υπάρχουσα διαδρομή, τα υπόλοιπα στοιχεία συμπληρώνονται αυτόματα.</span>
                      </FieldHint>
                    </FieldHints>
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
                  <FieldHints>
                    <FieldHint>
                      Η ευρύτερη περιοχή ή το βουνό όπου βρίσκεται η διαδρομή.
                      <br />
                      <span className="italic">Συμπληρώνεται αυτόματα από τη διαδρομή ή ορίζεται χειροκίνητα.</span>
                    </FieldHint>
                  </FieldHints>
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
                  <FieldHints>
                    <FieldHint>
                      Η ονομασία του αναρριχητικού πεδίου.
                      <br />
                      <span className="italic">Συμπληρώνεται αυτόματα αν επιλεγεί υπάρχουσα διαδρομή.</span>
                    </FieldHint>
                  </FieldHints>
                </label>

                <div className="flex flex-col gap-3 md:col-span-2">
                  <RadioGroupField
                    name="season"
                    label="ΕΠΟΧΗ"
                    options={ACTIVITY_SEASON_RADIO_OPTIONS}
                    value={season}
                    onChange={setSeason}
                  />
                  <FieldHints>
                    <FieldHint>Οι συνθήκες κατά την ανάβαση (θερινές ή χειμερινές).</FieldHint>
                    <FieldHint>
                      <span className="italic">Επίλεξε με βάση τις συνθήκες της ημέρας.</span>
                    </FieldHint>
                  </FieldHints>
                </div>

                <div className="flex flex-col gap-3 md:col-span-2">
                  <RadioGroupField
                    name="repeat"
                    label="ΕΠΑΝΑΛΗΨΗ"
                    options={repeatRadioOptions}
                    value={repeat}
                    onChange={setRepeat}
                  />
                  <FieldHints>
                    <FieldHint>Δηλώστε αν πρόκειται για νέα ανάβαση ή επανάληψη.</FieldHint>
                  </FieldHints>
                </div>
              </div>
            </FormSection>

            <FormSection title="ΤΕΧΝΙΚΑ ΧΑΡΑΚΤΗΡΙΣΤΙΚΑ" icon={<SectionIconTechnical />}>
              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-3">
                  <SelectField label="ΤΡΟΠΟΣ ΟΛΟΚΛΗΡΩΣΗΣ" options={completionOptions} />
                  <FieldHints>
                    <FieldHint>Προαιρετικά: περιγράφει τον τρόπο που ολοκληρώθηκε η διαδρομή.</FieldHint>
                  </FieldHints>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                  <div className="flex flex-col gap-3">
                    <FieldLabel>ΚΛΙΜΑΚΑ ΔΥΣΚΟΛΙΑΣ</FieldLabel>
                    <SelectFieldControlled
                      options={scaleSelectOptions}
                      value={scaleKey}
                      onChange={setScaleKey}
                      selectClassName="h-14 text-base shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
                    />
                    {autofill ? <AutoFilledBadge /> : null}
                    <FieldHints>
                      <FieldHint>Επιλέξτε το σύστημα βαθμολόγησης που προτιμάτε.</FieldHint>
                    </FieldHints>
                  </div>
                  <div className="flex flex-col gap-3">
                    <FieldLabel>ΒΑΘΜΟΣ ΔΥΣΚΟΛΙΑΣ</FieldLabel>
                    <SelectFieldControlled
                      options={gradeSelectOptions}
                      value={gradeVal}
                      onChange={setGradeVal}
                      selectClassName="h-14 text-base shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
                    />
                    {autofill ? <AutoFilledBadge /> : null}
                    <FieldHints>
                      <FieldHint>
                        Επιλέξτε το βαθμό δυσκολίας της διαδρομής.
                        <br />
                        <span className="italic">Αν επιλέξεις υπάρχουσα διαδρομή, προτείνεται αυτόματα τιμή.</span>
                      </FieldHint>
                    </FieldHints>
                  </div>
                  <div className="flex flex-col gap-3">
                    <SelectField label="ΜΙΚΤΑ" options={mixedOptions} />
                    <FieldHints>
                      <FieldHint>Συμπληρώστε μόνο αν η διαδρομή περιλαμβάνει μικτό ή παγοαναρριχητικό πεδίο.</FieldHint>
                    </FieldHints>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <label className="flex flex-col gap-3">
                    <FieldLabel>ΥΨΟΜΕΤΡΟ (M)</FieldLabel>
                    <Input
                      value={altitude}
                      onChange={(e) => setAltitude(e.target.value)}
                      placeholder="Υψόμετρο αναρρίχησης (m)"
                      className="h-14 text-base shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
                    />
                    {autofill && autofillHadAlt ? <AutoFilledBadge /> : null}
                    <FieldHints>
                      <FieldHint>
                        Το υψόμετρο στο οποίο καταλήγει η αναρρίχηση.
                        <br />
                        <span className="italic">Για χαμηλό υψόμετρο (&lt;1000m), η συμπλήρωση είναι προαιρετική.</span>
                      </FieldHint>
                    </FieldHints>
                  </label>

                  <label className="flex flex-col gap-3">
                    <FieldLabel>ΑΝΑΠΤΥΓΜΑ ΔΙΑΔΡΟΜΗΣ (M)</FieldLabel>
                    <Input
                      value={routeLength}
                      onChange={(e) => setRouteLength(e.target.value)}
                      placeholder="Συνολικό μήκος αναρρίχησης"
                      className="h-14 text-base shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
                    />
                    {autofill && autofillHadLen ? <AutoFilledBadge /> : null}
                    <FieldHints>
                      <FieldHint>
                        Το συνολικό μήκος της αναρρίχησης.
                        <br />
                        <span className="italic">Για πολύ μικρές διαδρομές (&lt;100m), η συμπλήρωση είναι προαιρετική.</span>
                      </FieldHint>
                    </FieldHints>
                  </label>
                </div>
              </div>
            </FormSection>

            <FormSection title="ΣΥΜΜΕΤΟΧΗ & ΠΡΟΣΘΕΤΑ ΣΤΟΙΧΕΙΑ" icon={<SectionIconParticipation />}>
              <div className="grid gap-6 md:grid-cols-4">
                <div className="flex flex-col gap-3">
                  <FieldLabel>ΑΤΟΜΑ</FieldLabel>
                  <div className="flex items-center rounded-lg border border-[#e2e8e0] bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
                    <button type="button" className="px-4 py-4 text-lg text-[#64748b]">
                      −
                    </button>
                    <Input defaultValue="1" className="h-14 rounded-none border-0 text-center shadow-none ring-0 focus:ring-0" />
                    <button type="button" className="px-4 py-4 text-lg text-[#64748b]">
                      +
                    </button>
                  </div>
                  <FieldHints>
                    <FieldHint>
                      Αριθμός συμμετεχόντων από τον σύλλογο.
                      <br />
                      <span className="italic">Λαμβάνονται υπόψη μόνο μέλη του συλλόγου.</span>
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
                        placeholder="Προσθήκη σχοινοσύντροφου..."
                        className="min-w-[200px] flex-1 border-0 shadow-none focus:ring-0"
                      />
                    </div>
                  </div>
                  <FieldHints>
                    <FieldHint>
                      Καταχώρησε τα άτομα που συμμετείχαν στην ανάβαση.
                      <br />
                      <span className="italic">Πρώτο όνομα: το δικό σου. Στη συνέχεια πρόσθεσε τους υπόλοιπους σχοινοσυντρόφους.</span>
                    </FieldHint>
                  </FieldHints>
                </div>
              </div>
            </FormSection>

            <NotesSection
              personalPlaceholder="Κατάγραψε μια προσωπική σημείωση ή ανάμνηση από τη δράση"
              personalHint="Ιδιωτική σημείωση για την εμπειρία σου."
              publicPlaceholder="Κατάγραψε πληροφορίες ή εμπειρίες χρήσιμες για άλλους χρήστες"
              publicHint="Πληροφορίες χρήσιμες για άλλους αναρριχητές."
            />

            <OfficialParticipationSection />

            <FormActions />
          </div>

          <ScoreSummaryCard description="Οι βαθμοί υπολογίζονται αυτόματα βάσει της υψομετρικής, του μήκους και της δυσκολίας." />
        </div>
      </form>
    </>
  )
}
