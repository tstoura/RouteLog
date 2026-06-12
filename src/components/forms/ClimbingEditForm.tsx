import type { FormEvent } from 'react'
import { useCallback, useMemo, useState } from 'react'
import { FormSection } from '../ui/FormSection.tsx'
import { Input } from '../ui/Input.tsx'
import { Textarea } from '../ui/Textarea.tsx'
import {
  DateInputWithCalendar,
  FieldHint,
  FieldHints,
  FieldLabel,
  FormActions,
  FormSidePanel,
  RadioGroupField,
  SidePanelPointsCard,
  SidePanelRecordTypeStatus,
  SectionIconBasics,
  SectionIconNotes,
  SectionIconParticipation,
  SectionIconTechnical,
  SelectFieldControlled,
  toWholeNumber,
} from './shared/FormBuildingBlocks.tsx'
import {
  CLIMBING_COMPLETION_OPTIONS,
  CLIMBING_REPETITION_OPTIONS,
  CLIMBING_SCALE_ACTIVITY_OPTIONS,
  CLIMBING_SEASON_OPTIONS,
  MIXED_CLIMBING_HELPER,
  MIXED_CLIMBING_OPTIONS,
  NO_REGULAR_DIFFICULTY_OPTION,
  getGradeOptionsForScale,
} from '../../constants/climbingFormOptions.ts'
import { patchActivity, type PatchClimbingPayload } from '../../api/activities.ts'
import type { ActivityListItem } from '../../api/activities.ts'
import { ApiError } from '../../api/client.ts'
import { MapPin } from 'lucide-react'
import { usePointsPreview } from '../../hooks/usePointsPreview.ts'

// ── Read-only route card ───────────────────────────────────────────────────────

function ReadOnlyRouteCard({
  routeName,
  climbingField,
  mountainOrArea,
}: {
  routeName: string
  climbingField: string
  mountainOrArea: string
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-[#e2e8e0] bg-[#f8fafc] px-4 py-3">
      <MapPin className="mt-0.5 size-4 shrink-0 text-[#00453e]" strokeWidth={2} aria-hidden />
      <div className="min-w-0 space-y-0.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.8px] text-[#64748b]">
          ΔΙΑΔΡΟΜΗ (ΣΤΑΘΕΡΗ)
        </p>
        <p className="font-semibold text-[#1a1c1e]">{routeName}</p>
        <p className="text-sm text-[#64748b]">
          {climbingField}
          {mountainOrArea ? ` · ${mountainOrArea}` : ''}
        </p>
        <p className="text-xs text-[#94a3b8]">Η διαδρομή δεν αλλάζει κατά την επεξεργασία.</p>
      </div>
    </div>
  )
}

// ── ClimbingEditForm ──────────────────────────────────────────────────────────

export type ClimbingEditFormProps = {
  activity: ActivityListItem & { climbingDetail: NonNullable<ActivityListItem['climbingDetail']> }
  onSaved: (updated: ActivityListItem) => void
  onCancel: () => void
}

export function ClimbingEditForm({ activity, onSaved, onCancel }: ClimbingEditFormProps) {
  const c = activity.climbingDetail
  const isOfficial = activity.isOfficial

  const [date, setDate] = useState(
    typeof activity.date === 'string' ? activity.date.slice(0, 10) : new Date(activity.date).toISOString().slice(0, 10),
  )
  const [season, setSeason] = useState(c.season)
  const [repetitionType, setRepetitionType] = useState(c.repetitionType)
  const [altitude, setAltitude] = useState(String(c.altitude || ''))
  const [routeLength, setRouteLength] = useState(String(c.routeLength || ''))
  const [participantsNum, setParticipantsNum] = useState(c.participantsNum)
  const [participantsText, setParticipantsText] = useState(c.participantsText ?? '')

  // Scale/grade — initialize from existing record.
  // If record has no regular difficulty (difficultyScale null) but has mixedClimbing,
  // use '-' sentinel so gradeVal locks to '—'.
  const initialScaleKey =
    c.difficultyScale ?? (c.mixedClimbing && !c.difficultyGrade ? '-' : '')
  const [scaleKey, setScaleKey] = useState(initialScaleKey)
  const [gradeVal, setGradeVal] = useState(
    c.difficultyGrade ?? (initialScaleKey === '-' ? '-' : ''),
  )
  const [mixedClimbing, setMixedClimbing] = useState(c.mixedClimbing ?? '')

  const gradeOptions = useMemo(
    () => (scaleKey === '-' ? [NO_REGULAR_DIFFICULTY_OPTION] : getGradeOptionsForScale(scaleKey)),
    [scaleKey],
  )

  const handleScaleChange = useCallback((newScale: string) => {
    setScaleKey(newScale)
    setGradeVal(newScale === '-' ? '-' : '')
  }, [])

  const [completionType, setCompletionType] = useState(c.completionType ?? '')
  const [privateNotes, setPrivateNotes] = useState(activity.privateNotes ?? '')
  const [publicNotes, setPublicNotes] = useState(activity.publicNotes ?? '')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // ── Live points preview (official activities only) ──────────────────────────
  const preview = usePointsPreview('climbing', {
    altitude: Number(altitude) || 0,
    routeLength: Number(routeLength) || 0,
    season,
    repetitionType,
    participantsNum,
    difficultyScale: scaleKey && scaleKey !== '-' ? scaleKey : null,
    difficultyGrade: gradeVal && gradeVal !== '-' ? gradeVal : null,
    mixedClimbing: mixedClimbing || null,
  }, isOfficial)

  const handleDecrement = () => setParticipantsNum((n) => Math.max(1, n - 1))
  const handleIncrement = () => setParticipantsNum((n) => n + 1)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitError(null)

    if (isOfficial) {
      if (!altitude || Number(altitude) <= 0) {
        setSubmitError('Το υψόμετρο είναι υποχρεωτικό για επίσημη καταγραφή.')
        return
      }
      if (!routeLength || Number(routeLength) <= 0) {
        setSubmitError('Το ανάπτυγμα διαδρομής είναι υποχρεωτικό για επίσημη καταγραφή.')
        return
      }
      const hasRegularDifficulty =
        scaleKey && scaleKey !== '-' && gradeVal && gradeVal !== '-' && gradeVal !== ''
      const hasMixedDifficulty = Boolean(mixedClimbing)
      if (!hasRegularDifficulty && !hasMixedDifficulty) {
        setSubmitError('Ο βαθμός δυσκολίας ή το μεικτό/πάγος είναι υποχρεωτικά για επίσημη καταγραφή.')
        return
      }
    }

    setIsSubmitting(true)
    try {
      const payload: PatchClimbingPayload = {
        date,
        season,
        repetitionType,
        altitude: Number(altitude) || undefined,
        routeLength: Number(routeLength) || undefined,
        participantsNum,
        participantsText: participantsText.trim() || undefined,
        difficultyScale: scaleKey && scaleKey !== '-' ? scaleKey : undefined,
        difficultyGrade: gradeVal && gradeVal !== '-' ? gradeVal : undefined,
        mixedClimbing: mixedClimbing.trim() || undefined,
        completionType: completionType || undefined,
        privateNotes: privateNotes.trim() || undefined,
        publicNotes: publicNotes.trim() || undefined,
      }
      const updated = await patchActivity(activity.id, payload)
      onSaved(updated)
    } catch (err) {
      setSubmitError(
        err instanceof ApiError
          ? err.message
          : 'Απρόσμενο σφάλμα. Παρακαλώ δοκιμάστε ξανά.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const gradeSelectOptions = useMemo(
    () => [{ value: '', label: 'Βαθμός...' }, ...gradeOptions],
    [gradeOptions],
  )

  return (
    <form className="space-y-8" onSubmit={handleSubmit}>
      <ReadOnlyRouteCard
        routeName={c.routeName}
        climbingField={c.climbingField}
        mountainOrArea={c.mountainOrArea}
      />

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-8">
          <FormSection title="ΒΑΣΙΚΑ ΣΤΟΙΧΕΙΑ" icon={<SectionIconBasics />}>
            <div className="grid gap-6 md:grid-cols-2">
              <label className="flex flex-col gap-3">
                <FieldLabel>ΗΜΕΡΟΜΗΝΙΑ</FieldLabel>
                <DateInputWithCalendar value={date} onChange={(e) => setDate(e.target.value)} type="date" />
              </label>

              <div className="flex flex-col gap-3">
                <RadioGroupField
                  label="ΕΠΟΧΗ"
                  name="season-edit"
                  options={CLIMBING_SEASON_OPTIONS}
                  value={season}
                  onChange={setSeason}
                />
              </div>

              <div className="flex flex-col gap-3">
                <RadioGroupField
                  label="ΑΝΑΒΑΣΗ"
                  name="repetitionType-edit"
                  options={CLIMBING_REPETITION_OPTIONS}
                  value={repetitionType}
                  onChange={setRepetitionType}
                />
              </div>
            </div>
          </FormSection>

          <FormSection title="ΤΕΧΝΙΚΑ ΧΑΡΑΚΤΗΡΙΣΤΙΚΑ" icon={<SectionIconTechnical />}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-6 md:grid-cols-2">
                <label className="flex flex-col gap-3">
                  <FieldLabel>ΥΨΟΜΕΤΡΟ (M)</FieldLabel>
                  <Input type="text" inputMode="numeric" value={altitude} onChange={(e) => setAltitude(toWholeNumber(e.target.value))} placeholder="Υψόμετρο" className="h-14 text-base shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" />
                  {isOfficial && (
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
                  <FieldLabel>ΑΝΑΠΤΥΓΜΑ (M)</FieldLabel>
                  <Input type="number" min="0.01" step="0.01" value={routeLength} onChange={(e) => setRouteLength(e.target.value)} placeholder="Ανάπτυγμα" className="h-14 text-base shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" />
                  {isOfficial && (
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

              <div className="grid gap-6 md:grid-cols-2">
                <div className="flex flex-col gap-3">
                  <SelectFieldControlled label="ΚΛΙΜΑΚΑ ΔΥΣΚΟΛΙΑΣ" options={CLIMBING_SCALE_ACTIVITY_OPTIONS} value={scaleKey} onChange={handleScaleChange} />
                </div>
                <div className="flex flex-col gap-3">
                  <SelectFieldControlled label="ΒΑΘΜΟΣ ΔΥΣΚΟΛΙΑΣ" options={gradeSelectOptions} value={gradeVal} onChange={setGradeVal} />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <SelectFieldControlled label="ΜΕΙΚΤΟ / ΠΑΓΟΣ (ΠΡΟΑΙΡΕΤΙΚΑ)" options={[{ value: '', label: 'Καμία επιλογή' }, ...MIXED_CLIMBING_OPTIONS]} value={mixedClimbing} onChange={setMixedClimbing} />
                <FieldHints><FieldHint>{MIXED_CLIMBING_HELPER}</FieldHint></FieldHints>
              </div>
            </div>
          </FormSection>

          <FormSection title="ΣΥΜΜΕΤΟΧΗ" icon={<SectionIconParticipation />}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3 md:max-w-[340px]">
                <FieldLabel>ΑΤΟΜΑ</FieldLabel>
                <div className="flex items-center rounded-lg border border-[#e2e8e0] bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
                  <button type="button" onClick={handleDecrement} aria-label="Μείωση" className="cursor-pointer px-4 py-4 text-lg text-[#64748b]">−</button>
                  <Input type="number" min="1" value={participantsNum} onChange={(e) => setParticipantsNum(Math.max(1, Number(e.target.value)))} className="h-14 rounded-none border-0 text-center shadow-none ring-0 focus:ring-0" />
                  <button type="button" onClick={handleIncrement} aria-label="Αύξηση" className="cursor-pointer px-4 py-4 text-lg text-[#64748b]">+</button>
                </div>
              </div>

              <label className="flex flex-col gap-3">
                <FieldLabel>ΣΧΟΙΝΟΣΥΝΤΡΟΦΟΙ (ΠΡΟΑΙΡΕΤΙΚΑ)</FieldLabel>
                <Input value={participantsText} onChange={(e) => setParticipantsText(e.target.value)} placeholder="Ονόματα σχοινοσυντρόφων" className="h-14 text-base shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" />
                <FieldHints><FieldHint>Χωρισμένα με κόμμα.</FieldHint></FieldHints>
              </label>

              <div className="flex flex-col gap-3">
                <SelectFieldControlled label="ΤΡΟΠΟΣ ΟΛΟΚΛΗΡΩΣΗΣ (ΠΡΟΑΙΡΕΤΙΚΑ)" options={[{ value: '', label: 'Καμία επιλογή' }, ...CLIMBING_COMPLETION_OPTIONS]} value={completionType} onChange={setCompletionType} />
              </div>
            </div>
          </FormSection>

          <FormSection title="ΣΗΜΕΙΩΣΕΙΣ" icon={<SectionIconNotes />}>
            <div className="flex flex-col gap-10">
              <label className="flex flex-col gap-3">
                <FieldLabel>ΠΡΟΣΩΠΙΚΗ ΣΗΜΕΙΩΣΗ (ΠΡΟΑΙΡΕΤΙΚΑ)</FieldLabel>
                <Textarea value={privateNotes} onChange={(e) => setPrivateNotes(e.target.value)} placeholder="Προσωπικές σκέψεις ή εμπειρίες." className="min-h-[150px]" />
              </label>
              <label className="flex flex-col gap-3">
                <FieldLabel>ΑΞΙΟΛΟΓΗΣΗ ΔΙΑΔΡΟΜΗΣ (ΠΡΟΑΙΡΕΤΙΚΑ)</FieldLabel>
                <Textarea value={publicNotes} onChange={(e) => setPublicNotes(e.target.value)} placeholder="Πληροφορίες χρήσιμες για άλλους χρήστες." className="min-h-[150px]" />
              </label>
            </div>
          </FormSection>

          {submitError ? (
            <div role="alert" className="rounded-lg border border-[#fca5a5] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">
              {submitError}
            </div>
          ) : null}

          <FormActions
            submitText={isSubmitting ? 'Αποθήκευση...' : 'Αποθήκευση αλλαγών'}
            cancelText="Ακύρωση"
            onCancel={onCancel}
          />
        </div>

        <FormSidePanel colSpan={4}>
          <SidePanelRecordTypeStatus isOfficial={isOfficial} />
          {isOfficial && (
            <SidePanelPointsCard
              value={preview.isLoading ? '...' : preview.points ?? '—'}
              description={
                preview.isLoading
                  ? 'Υπολογισμός...'
                  : preview.isReady
                    ? 'Βαθμοί ΕΟΟΑ'
                    : 'Συμπληρώστε τα απαραίτητα πεδία για να εμφανιστούν οι βαθμοί.'
              }
            />
          )}
        </FormSidePanel>
      </div>
    </form>
  )
}
