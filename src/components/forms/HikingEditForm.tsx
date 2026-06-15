import type { FormEvent } from 'react'
import { useState } from 'react'
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
  SidePanelPointsCard,
  SidePanelRecordTypeStatus,
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
import { patchActivity, type PatchHikingPayload } from '../../api/activities.ts'
import type { ActivityListItem } from '../../api/activities.ts'
import { ApiError } from '../../api/client.ts'
import { usePointsPreview } from '../../hooks/usePointsPreview.ts'

// ── HikingEditForm ────────────────────────────────────────────────────────────

export type HikingEditFormProps = {
  activity: ActivityListItem & { hikingDetail: NonNullable<ActivityListItem['hikingDetail']> }
  onSaved: (updated: ActivityListItem) => void
  onCancel: () => void
}

export function HikingEditForm({ activity, onSaved, onCancel }: HikingEditFormProps) {
  const h = activity.hikingDetail
  const isOfficial = activity.isOfficial

  const [date, setDate] = useState(
    typeof activity.date === 'string' ? activity.date.slice(0, 10) : new Date(activity.date).toISOString().slice(0, 10),
  )
  const [mountain, setMountain] = useState(h.mountain)
  const [startPoint, setStartPoint] = useState(h.startPoint)
  const [endPoint, setEndPoint] = useState(h.endPoint)
  const [maxAltitude, setMaxAltitude] = useState(String(h.maxAltitude || ''))
  const [totalElevationGain, setTotalElevationGain] = useState(String(h.totalElevationGain || ''))
  const [distanceLength, setDistanceLength] = useState(String(h.distanceLength || ''))
  const [fieldType, setFieldType] = useState(h.fieldType)
  const [difficultyGrade, setDifficultyGrade] = useState(h.difficultyGrade)
  const [participantsNum, setParticipantsNum] = useState(h.participantsNum)
  const [privateNotes, setPrivateNotes] = useState(activity.privateNotes ?? '')
  const [publicNotes, setPublicNotes] = useState(activity.publicNotes ?? '')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // ── Live points preview (official activities only) ──────────────────────────
  const preview = usePointsPreview('hiking', {
    maxAltitude: Number(maxAltitude) || 0,
    totalElevationGain: Number(totalElevationGain) || 0,
    distanceLength:
      isOfficial && (!distanceLength.trim() || Number(distanceLength) <= 0)
        ? 15
        : Number(distanceLength) || 0,
    fieldType,
    difficultyGrade,
    participantsNum,
  }, isOfficial)

  const handleDecrement = () => setParticipantsNum((n) => Math.max(1, n - 1))
  const handleIncrement = () => setParticipantsNum((n) => n + 1)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitError(null)

    if (isOfficial) {
      if (!mountain.trim() || !startPoint.trim() || !endPoint.trim()) {
        setSubmitError('Βουνό, αφετηρία και κορυφή/τερματισμός είναι υποχρεωτικά για επίσημη καταγραφή.')
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
      const payload: PatchHikingPayload = {
        date,
        mountain: mountain.trim(),
        startPoint: startPoint.trim(),
        endPoint: endPoint.trim(),
        maxAltitude: Number(maxAltitude) || 0,
        totalElevationGain: Number(totalElevationGain) || 0,
        distanceLength:
          isOfficial && (!distanceLength.trim() || Number(distanceLength) <= 0)
            ? undefined
            : Number(distanceLength) || 0,
        fieldType,
        difficultyGrade,
        participantsNum,
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

  return (
    <form className="space-y-8" onSubmit={handleSubmit} onKeyDown={handleFormEnterAsTab}>
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-8">
          <FormSection title="ΒΑΣΙΚΑ ΣΤΟΙΧΕΙΑ" icon={<SectionIconBasics />}>
            <div className="grid gap-6 md:grid-cols-2">
              <label className="flex flex-col gap-3">
                <FieldLabel>ΗΜΕΡΟΜΗΝΙΑ</FieldLabel>
                <DateInputWithCalendar value={date} onChange={(e) => setDate(e.target.value)} type="date" />
              </label>

              <label className="flex flex-col gap-3">
                <FieldLabel>ΒΟΥΝΟ</FieldLabel>
                <Input value={mountain} onChange={(e) => setMountain(e.target.value)} placeholder="Βουνό" className="h-14 text-base shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" />
              </label>

              <label className="flex flex-col gap-3">
                <FieldLabel>ΑΦΕΤΗΡΙΑ</FieldLabel>
                <Input value={startPoint} onChange={(e) => setStartPoint(e.target.value)} placeholder="Αφετηρία" className="h-14 text-base shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" />
              </label>

              <label className="flex flex-col gap-3">
                <FieldLabel>ΚΟΡΥΦΗ / ΤΕΡΜΑΤΙΣΜΟΣ</FieldLabel>
                <Input value={endPoint} onChange={(e) => setEndPoint(e.target.value)} placeholder="Κορυφή ή τερματισμός" className="h-14 text-base shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" />
              </label>
            </div>
          </FormSection>

          <FormSection title="ΤΕΧΝΙΚΑ ΧΑΡΑΚΤΗΡΙΣΤΙΚΑ" icon={<SectionIconTechnical />}>
            <div className="flex flex-col gap-8">
              <label className="flex flex-col gap-3">
                <FieldLabel>ΜΕΓΙΣΤΟ ΥΨΟΜΕΤΡΟ (M)</FieldLabel>
                <Input type="text" inputMode="numeric" value={maxAltitude} onChange={(e) => setMaxAltitude(toWholeNumber(e.target.value))} placeholder="Υψόμετρο" className="h-14 text-base shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" />
              </label>

              <label className="flex flex-col gap-3">
                <FieldLabel>ΣΥΝΟΛΙΚΗ ΥΨΟΜΕΤΡΙΚΗ ΑΝΑΒΑΣΗ (M)</FieldLabel>
                <Input type="text" inputMode="numeric" value={totalElevationGain} onChange={(e) => setTotalElevationGain(toWholeNumber(e.target.value))} placeholder="Σ.Υ.Α." className="h-14 text-base shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" />
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
                {isOfficial && (
                  <FieldHints>
                    <FieldHint>Για αποστάσεις μικρότερες των 15km, η συμπλήρωση είναι προαιρετική.</FieldHint>
                  </FieldHints>
                )}
              </label>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="flex flex-col gap-3">
                  <SelectFieldControlled label="ΠΕΔΙΟ" options={HIKING_FIELD_TYPE_OPTIONS} value={fieldType} onChange={setFieldType} />
                  <FieldHints><FieldHint>{HIKING_FIELD_TYPE_HELPER}</FieldHint></FieldHints>
                </div>
                <div className="flex flex-col gap-3">
                  <SelectFieldControlled label="ΒΑΘΜΟΣ ΔΥΣΚΟΛΙΑΣ" options={HIKING_DIFFICULTY_GRADE_OPTIONS} value={difficultyGrade} onChange={setDifficultyGrade} />
                  <FieldHints><FieldHint>{HIKING_DIFFICULTY_GRADE_HELPER}</FieldHint></FieldHints>
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection title="ΣΥΜΜΕΤΟΧΗ" icon={<SectionIconParticipation />}>
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
                decrementAriaLabel="Μείωση"
                incrementAriaLabel="Αύξηση"
              />
              <FieldHints>
                {isOfficial && <FieldHint>Απαιτούνται τουλάχιστον 3 άτομα για επίσημη καταγραφή.</FieldHint>}
              </FieldHints>
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
