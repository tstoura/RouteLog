import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
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
  SidePanelPersonalOnly,
  SidePanelPointsCard,
  SidePanelRecordTypeToggle,
  SectionIconBasics,
  SectionIconNotes,
  SectionIconParticipation,
  SectionIconTechnical,
  SelectFieldControlled,
  toWholeNumber,
  toDecimalNumber,
  handleFormEnterAsTab,
  ParticipantCountStepper,
} from './shared/FormBuildingBlocks.tsx'
import {
  HIKING_DIFFICULTY_GRADE_HELPER,
  HIKING_DIFFICULTY_GRADE_OPTIONS,
  HIKING_FIELD_TYPE_HELPER,
  HIKING_FIELD_TYPE_OPTIONS,
} from '../../constants/hikingFormOptions.ts'
import { submitHikingActivity } from '../../api/activities.ts'
import { ApiError } from '../../api/client.ts'
import { useAuth } from '../../auth/AuthContext.tsx'
import { usePointsPreview } from '../../hooks/usePointsPreview.ts'

export type HikingActivityFormProps = {
  /** Called after a successful backend submission; receives the server-calculated points. */
  onSubmitSuccess?: (points: number | null) => void
  /** Points from the most recent successful submission, passed back by the parent. */
  lastSubmittedPoints?: number | null
  /** Activity type tab click; parent handles reset / navigation. */
  onActivityTabSelect: (kind: ActivityFormTabKind) => void
}

export function HikingActivityForm({ onSubmitSuccess, lastSubmittedPoints: _lastSubmittedPoints, onActivityTabSelect }: HikingActivityFormProps) {
  const { user } = useAuth()

  // True when the user has at least one club membership.
  const hasClub = Boolean(user && user.memberships.length > 0)

  // ── Official / personal toggle ──────────────────────────────────────────────
  const [isOfficial, setIsOfficial] = useState(true)

  // When the user has no club, always force isOfficial = false.
  useEffect(() => {
    if (!hasClub) setIsOfficial(false)
  }, [hasClub])

  // ── Basic fields ────────────────────────────────────────────────────────────
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [mountain, setMountain] = useState('')
  const [startPoint, setStartPoint] = useState('')
  const [endPoint, setEndPoint] = useState('')

  // ── Technical fields ────────────────────────────────────────────────────────
  const [maxAltitude, setMaxAltitude] = useState('')
  const [totalElevationGain, setTotalElevationGain] = useState('')
  const [distanceLength, setDistanceLength] = useState('')
  // fieldType and difficultyGrade default to the first valid backend value.
  const [fieldType, setFieldType] = useState<string>(HIKING_FIELD_TYPE_OPTIONS[0].value)
  const [difficultyGrade, setDifficultyGrade] = useState<string>(HIKING_DIFFICULTY_GRADE_OPTIONS[0].value)

  // ── Participation ───────────────────────────────────────────────────────────
  const [participantsNum, setParticipantsNum] = useState(1)

  // ── Notes (optional for both official and personal records) ─────────────────
  const [privateNotes, setPrivateNotes] = useState('')
  const [publicNotes, setPublicNotes] = useState('')

  // ── Submit state ────────────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // ── Live points preview ─────────────────────────────────────────────────────
  const effectiveIsOfficial = hasClub ? isOfficial : false
  const preview = usePointsPreview('hiking', {
    maxAltitude: Number(maxAltitude) || 0,
    totalElevationGain: Number(totalElevationGain) || 0,
    distanceLength:
      effectiveIsOfficial && (!distanceLength.trim() || Number(distanceLength) <= 0)
        ? 15
        : Number(distanceLength) || 0,
    fieldType,
    difficultyGrade,
    participantsNum,
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

  const handleDecrement = () => setParticipantsNum((n) => Math.max(1, n - 1))
  const handleIncrement = () => setParticipantsNum((n) => n + 1)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitError(null)

    // ── Auth guard ──────────────────────────────────────────────────────────
    if (!user) {
      setSubmitError('Δεν είστε συνδεδεμένος. Παρακαλώ συνδεθείτε ξανά.')
      return
    }

    // Backend also enforces this; the UI hides the toggle so this is a safety net.
    // effectiveIsOfficial is computed at component level.

    // ── Frontend validation for official records ────────────────────────────
    if (effectiveIsOfficial) {
      if (!mountain.trim() || !startPoint.trim() || !endPoint.trim()) {
        setSubmitError(
          'Βουνό, αφετηρία και κορυφή/τερματισμός είναι υποχρεωτικά για επίσημη καταγραφή.',
        )
        return
      }
      if (!maxAltitude || Number(maxAltitude) <= 0) {
        setSubmitError('Το μέγιστο υψόμετρο είναι υποχρεωτικό για επίσημη καταγραφή.')
        return
      }
      if (!totalElevationGain || Number(totalElevationGain) <= 0) {
        setSubmitError('Η συνολική υψομετρική ανάβαση (Σ.Υ.Α.) είναι υποχρεωτική για επίσημη καταγραφή.')
        return
      }
      if (participantsNum < 3) {
        setSubmitError('Η επίσημη ορειβατική καταγραφή απαιτεί τουλάχιστον 3 άτομα.')
        return
      }
    }

    setIsSubmitting(true)
    try {
      const result = await submitHikingActivity({
        isOfficial: effectiveIsOfficial,
        date,
        mountain: mountain.trim(),
        startPoint: startPoint.trim(),
        endPoint: endPoint.trim(),
        maxAltitude: Number(maxAltitude) || 0,
        totalElevationGain: Number(totalElevationGain) || 0,
        distanceLength:
          effectiveIsOfficial && (!distanceLength.trim() || Number(distanceLength) <= 0)
            ? undefined
            : Number(distanceLength) || 0,
        fieldType,
        difficultyGrade,
        participantsNum,
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
    <form className="space-y-8" onSubmit={handleSubmit} onKeyDown={handleFormEnterAsTab}>
      <ActivityTypeTabs active="hiking" onTabSelect={onActivityTabSelect} />

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-8">
          <FormSection title="ΒΑΣΙΚΑ ΣΤΟΙΧΕΙΑ" icon={<SectionIconBasics />}>
            <div className="grid gap-6 md:grid-cols-2">
              <label className="flex flex-col gap-3">
                <FieldLabel>ΗΜΕΡΟΜΗΝΙΑ</FieldLabel>
                <DateInputWithCalendar
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
                <FieldHints>
                  <FieldHint>Η ημερομηνία πραγματοποίησης της ανάβασης.</FieldHint>
                </FieldHints>
              </label>

              <label className="flex flex-col gap-3">
                <FieldLabel>ΒΟΥΝΟ</FieldLabel>
                <Input
                  value={mountain}
                  onChange={(e) => setMountain(e.target.value)}
                  placeholder="Βουνό"
                  className="h-14 text-base shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
                />
                <FieldHints>
                  <FieldHint>Το βουνό στο οποίο πραγματοποιήθηκε η ανάβαση.</FieldHint>
                </FieldHints>
              </label>

              <label className="flex flex-col gap-3">
                <FieldLabel>ΑΦΕΤΗΡΙΑ</FieldLabel>
                <Input
                  value={startPoint}
                  onChange={(e) => setStartPoint(e.target.value)}
                  placeholder="Αφετηρία"
                  className="h-14 text-base shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
                />
                <FieldHints>
                  <FieldHint>Το σημείο εκκίνησης της διαδρομής.</FieldHint>
                </FieldHints>
              </label>

              <label className="flex flex-col gap-3">
                <FieldLabel>ΚΟΡΥΦΗ / ΤΕΡΜΑΤΙΣΜΟΣ</FieldLabel>
                <Input
                  value={endPoint}
                  onChange={(e) => setEndPoint(e.target.value)}
                  placeholder="Κορυφή ή τερματισμός"
                  className="h-14 text-base shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
                />
                <FieldHints>
                  <FieldHint>Το σημείο στο οποίο ολοκληρώθηκε η διαδρομή.</FieldHint>
                </FieldHints>
              </label>
            </div>
          </FormSection>

          <FormSection title="ΤΕΧΝΙΚΑ ΧΑΡΑΚΤΗΡΙΣΤΙΚΑ" icon={<SectionIconTechnical />}>
            <div className="flex flex-col gap-8">
              <label className="flex flex-col gap-3">
                <FieldLabel>ΜΕΓΙΣΤΟ ΥΨΟΜΕΤΡΟ (M)</FieldLabel>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={maxAltitude}
                  onChange={(e) => setMaxAltitude(toWholeNumber(e.target.value))}
                  placeholder="Υψόμετρο"
                  className="h-14 text-base shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
                />
                <FieldHints>
                  <FieldHint>Το μέγιστο υψόμετρο της ανάβασης.</FieldHint>
                </FieldHints>
              </label>

              <label className="flex flex-col gap-3">
                <FieldLabel>ΣΥΝΟΛΙΚΗ ΥΨΟΜΕΤΡΙΚΗ ΑΝΑΒΑΣΗ (M)</FieldLabel>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={totalElevationGain}
                  onChange={(e) => setTotalElevationGain(toWholeNumber(e.target.value))}
                  placeholder="Σ.Υ.Α."
                  className="h-14 text-base shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
                />
                <FieldHints>
                  <FieldHint>Η διαφορά υψομέτρου από το σημείο εκκίνησης ως το υψηλότερο σημείο.</FieldHint>
                </FieldHints>
              </label>

              <label className="flex flex-col gap-3">
                <FieldLabel>ΜΗΚΟΣ ΔΙΑΔΡΟΜΗΣ (KM)</FieldLabel>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={distanceLength}
                  onChange={(e) => setDistanceLength(toDecimalNumber(e.target.value))}
                  placeholder="Μήκος διαδρομής (KM)"
                  className="h-14 text-base shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
                />
                {effectiveIsOfficial && (
                  <FieldHints>
                    <FieldHint>Για αποστάσεις μικρότερες των 15km, η συμπλήρωση είναι προαιρετική.</FieldHint>
                  </FieldHints>
                )}
              </label>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="flex flex-col gap-3">
                  <SelectFieldControlled
                    label="ΠΕΔΙΟ"
                    options={HIKING_FIELD_TYPE_OPTIONS}
                    value={fieldType}
                    onChange={setFieldType}
                  />
                  <FieldHints>
                    <FieldHint>
                      {effectiveIsOfficial
                        ? HIKING_FIELD_TYPE_HELPER
                        : 'Οι συνθήκες του πεδίου κατά τη δραστηριότητα.'}
                    </FieldHint>
                  </FieldHints>
                </div>

                <div className="flex flex-col gap-3">
                  <SelectFieldControlled
                    label="ΒΑΘΜΟΣ ΔΥΣΚΟΛΙΑΣ"
                    options={HIKING_DIFFICULTY_GRADE_OPTIONS}
                    value={difficultyGrade}
                    onChange={setDifficultyGrade}
                  />
                  <FieldHints>
                    <FieldHint>{HIKING_DIFFICULTY_GRADE_HELPER}</FieldHint>
                  </FieldHints>
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection title="ΣΥΜΜΕΤΟΧΗ & ΠΡΟΣΘΕΤΑ ΣΤΟΙΧΕΙΑ" icon={<SectionIconParticipation />}>
            <div className="flex flex-col gap-3 md:max-w-[340px]">
              <FieldLabel>ΑΤΟΜΑ</FieldLabel>
              <ParticipantCountStepper
                displayValue={participantsNum === 0 ? '' : String(participantsNum)}
                onChange={(e) => {
                  const cleaned = toWholeNumber(e.target.value)
                  setParticipantsNum(cleaned === '' ? 0 : Math.max(0, parseInt(cleaned, 10)))
                }}
                onBlur={() => setParticipantsNum((n) => Math.max(1, n))}
                onDecrement={handleDecrement}
                onIncrement={handleIncrement}
              />
              <FieldHints>
                <FieldHint>
                  {effectiveIsOfficial
                    ? 'Ο αριθμός των μελών του συλλόγου που συμμετείχαν.'
                    : 'Ο αριθμός των συμμετεχόντων στην ανάβαση.'}
                </FieldHint>
                {hasClub && isOfficial && (
                  <FieldHint>Απαιτούνται τουλάχιστον 3 άτομα για επίσημη καταγραφή.</FieldHint>
                )}
              </FieldHints>
            </div>
          </FormSection>

          <FormSection title="ΣΗΜΕΙΩΣΕΙΣ" icon={<SectionIconNotes />}>
            <div className="flex flex-col gap-10">
              <label className="flex flex-col gap-3">
                <FieldLabel>ΠΡΟΣΩΠΙΚΗ ΣΗΜΕΙΩΣΗ (ΠΡΟΑΙΡΕΤΙΚΑ)</FieldLabel>
                <Textarea
                  value={privateNotes}
                  onChange={(e) => setPrivateNotes(e.target.value)}
                  placeholder="Καταγράψτε προσωπικές σκέψεις ή εμπειρίες από τη δραστηριότητα."
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
                  placeholder="Καταγράψτε πληροφορίες χρήσιμες για άλλους χρήστες."
                  className="min-h-[150px]"
                />
                <FieldHints>
                  <FieldHint>Πληροφορίες χρήσιμες για άλλους χρήστες.</FieldHint>
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

          <FormActions
            submitText={isSubmitting ? 'Υποβολή...' : 'Υποβολή Καταχώρησης'}
          />
        </div>

        <FormSidePanel colSpan={4}>
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
  )
}
