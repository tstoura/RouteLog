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
  EXPEDITION_DIFFICULTY_GRADE_HELPER,
  EXPEDITION_DIFFICULTY_GRADE_OPTIONS,
  EXPEDITION_ORGANIZATION_HELPER,
  EXPEDITION_ORGANIZATION_TYPE_OPTIONS,
  EXPEDITION_SEASON_OPTIONS,
} from '../../constants/expeditionFormOptions.ts'
import { patchActivity, type PatchExpeditionPayload } from '../../api/activities.ts'
import type { ActivityListItem } from '../../api/activities.ts'
import { ApiError } from '../../api/client.ts'
import { usePointsPreview } from '../../hooks/usePointsPreview.ts'

const inputClass = 'h-14 text-base shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]'

const GRADE_SELECT_OPTIONS = [
  { value: '', label: 'Επιλογή βαθμού...' },
  ...EXPEDITION_DIFFICULTY_GRADE_OPTIONS,
]

const ORG_SELECT_OPTIONS = [
  { value: '', label: 'Επιλογή...' },
  ...EXPEDITION_ORGANIZATION_TYPE_OPTIONS,
]

// ── ExpeditionEditForm ────────────────────────────────────────────────────────

export type ExpeditionEditFormProps = {
  activity: ActivityListItem & { expeditionDetail: NonNullable<ActivityListItem['expeditionDetail']> }
  onSaved: (updated: ActivityListItem) => void
  onCancel: () => void
}

export function ExpeditionEditForm({ activity, onSaved, onCancel }: ExpeditionEditFormProps) {
  const e = activity.expeditionDetail
  const isOfficial = activity.isOfficial

  const [date, setDate] = useState(
    typeof activity.date === 'string' ? activity.date.slice(0, 10) : new Date(activity.date).toISOString().slice(0, 10),
  )
  const [country, setCountry] = useState(e.country)
  const [mountainRange, setMountainRange] = useState(e.mountainRange)
  const [mountain, setMountain] = useState(e.mountain)
  const [summit, setSummit] = useState(e.summit)
  const [routeName, setRouteName] = useState(e.routeName)
  const [season, setSeason] = useState(e.season)
  const [altitude, setAltitude] = useState(String(e.altitude || ''))
  const [totalElevationGain, setTotalElevationGain] = useState(String(e.totalElevationGain || ''))
  const [difficultyGrade, setDifficultyGrade] = useState(e.difficultyGrade)
  const [participantsNum, setParticipantsNum] = useState(e.participantsNum)
  const [organizationType, setOrganizationType] = useState(e.organizationType)
  const [privateNotes, setPrivateNotes] = useState(activity.privateNotes ?? '')
  const [publicNotes, setPublicNotes] = useState(activity.publicNotes ?? '')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // ── Live points preview (official activities only) ──────────────────────────
  const preview = usePointsPreview('expedition', {
    altitude: Number(altitude) || 0,
    totalElevationGain: Number(totalElevationGain) || 0,
    season,
    difficultyGrade,
    participantsNum,
    organizationType,
  }, isOfficial)

  const handleDecrement = () => setParticipantsNum((n) => Math.max(1, n - 1))
  const handleIncrement = () => setParticipantsNum((n) => n + 1)

  const handleSubmit = async (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault()
    setSubmitError(null)

    if (isOfficial) {
      if (!country.trim() || !mountain.trim()) {
        setSubmitError('Χώρα και βουνό είναι υποχρεωτικά για επίσημη καταγραφή.')
        return
      }
      if (!difficultyGrade) {
        setSubmitError('Ο βαθμός δυσκολίας είναι υποχρεωτικός για επίσημη καταγραφή.')
        return
      }
      if (!altitude || Number(altitude) <= 0) {
        setSubmitError('Το υψόμετρο είναι υποχρεωτικό για επίσημη καταγραφή.')
        return
      }
      if (!totalElevationGain || Number(totalElevationGain) <= 0) {
        setSubmitError('Η συνολική υψομετρική ανάβαση (Σ.Υ.Α.) είναι υποχρεωτική για επίσημη καταγραφή.')
        return
      }
      if (!organizationType) {
        setSubmitError('Η οργάνωση είναι υποχρεωτική για επίσημη καταγραφή.')
        return
      }
    }

    setIsSubmitting(true)
    try {
      const payload: PatchExpeditionPayload = {
        date,
        country: country.trim(),
        mountainRange: mountainRange.trim() || undefined,
        mountain: mountain.trim(),
        summit: summit.trim() || undefined,
        routeName: routeName.trim() || undefined,
        season,
        altitude: Number(altitude) || undefined,
        totalElevationGain: Number(totalElevationGain) || undefined,
        difficultyGrade: difficultyGrade || undefined,
        participantsNum,
        organizationType: organizationType || undefined,
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
    <form className="space-y-8" onSubmit={handleSubmit}>
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-8">
          <FormSection title="ΒΑΣΙΚΑ ΣΤΟΙΧΕΙΑ" icon={<SectionIconBasics />}>
            <div className="grid gap-6 md:grid-cols-2">
              <label className="flex flex-col gap-3">
                <FieldLabel>ΗΜΕΡΟΜΗΝΙΑ</FieldLabel>
                <DateInputWithCalendar value={date} onChange={(e) => setDate(e.target.value)} type="date" />
              </label>

              <label className="flex flex-col gap-3">
                <FieldLabel>ΧΩΡΑ</FieldLabel>
                <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Χώρα" className={inputClass} />
              </label>

              <label className="flex flex-col gap-3">
                <FieldLabel>ΟΡΟΣΕΙΡΑ (ΠΡΟΑΙΡΕΤΙΚΑ)</FieldLabel>
                <Input value={mountainRange} onChange={(e) => setMountainRange(e.target.value)} placeholder="Οροσειρά" className={inputClass} />
              </label>

              <label className="flex flex-col gap-3">
                <FieldLabel>ΒΟΥΝΟ</FieldLabel>
                <Input value={mountain} onChange={(e) => setMountain(e.target.value)} placeholder="Βουνό" className={inputClass} />
              </label>

              <label className="flex flex-col gap-3">
                <FieldLabel>ΚΟΡΥΦΗ (ΠΡΟΑΙΡΕΤΙΚΑ)</FieldLabel>
                <Input value={summit} onChange={(e) => setSummit(e.target.value)} placeholder="Κορυφή" className={inputClass} />
              </label>

              <label className="flex flex-col gap-3">
                <FieldLabel>ΔΙΑΔΡΟΜΗ (ΠΡΟΑΙΡΕΤΙΚΑ)</FieldLabel>
                <Input value={routeName} onChange={(e) => setRouteName(e.target.value)} placeholder="Όνομα διαδρομής" className={inputClass} />
              </label>
            </div>
          </FormSection>

          <FormSection title="ΤΕΧΝΙΚΑ ΧΑΡΑΚΤΗΡΙΣΤΙΚΑ" icon={<SectionIconTechnical />}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <RadioGroupField label="ΕΠΟΧΗ" name="season-exp-edit" options={EXPEDITION_SEASON_OPTIONS} value={season} onChange={setSeason} />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <label className="flex flex-col gap-3">
                  <FieldLabel>ΜΕΓΙΣΤΟ ΥΨΟΜΕΤΡΟ (M)</FieldLabel>
                  <Input type="text" inputMode="numeric" value={altitude} onChange={(e) => setAltitude(toWholeNumber(e.target.value))} placeholder="Υψόμετρο" className={inputClass} />
                </label>
                <label className="flex flex-col gap-3">
                  <FieldLabel>ΣΥΝΟΛΙΚΗ ΥΨΟΜΕΤΡΙΚΗ ΑΝΑΒΑΣΗ (M)</FieldLabel>
                  <Input type="text" inputMode="numeric" value={totalElevationGain} onChange={(e) => setTotalElevationGain(toWholeNumber(e.target.value))} placeholder="Σ.Υ.Α." className={inputClass} />
                </label>
              </div>

              <div className="flex flex-col gap-3">
                <SelectFieldControlled label="ΒΑΘΜΟΣ ΔΥΣΚΟΛΙΑΣ" options={GRADE_SELECT_OPTIONS} value={difficultyGrade} onChange={setDifficultyGrade} />
                <FieldHints><FieldHint>{EXPEDITION_DIFFICULTY_GRADE_HELPER}</FieldHint></FieldHints>
              </div>

              <div className="flex flex-col gap-3">
                <SelectFieldControlled label="ΟΡΓΑΝΩΣΗ" options={ORG_SELECT_OPTIONS} value={organizationType} onChange={setOrganizationType} />
                <FieldHints><FieldHint>{EXPEDITION_ORGANIZATION_HELPER}</FieldHint></FieldHints>
              </div>
            </div>
          </FormSection>

          <FormSection title="ΣΥΜΜΕΤΟΧΗ" icon={<SectionIconParticipation />}>
            <div className="flex flex-col gap-3 md:max-w-[340px]">
              <FieldLabel>ΑΤΟΜΑ</FieldLabel>
              <div className="flex items-center rounded-lg border border-[#e2e8e0] bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
                <button type="button" onClick={handleDecrement} aria-label="Μείωση" className="cursor-pointer px-4 py-4 text-lg text-[#64748b]">−</button>
                <Input type="number" min="1" value={participantsNum} onChange={(e) => setParticipantsNum(Math.max(1, Number(e.target.value)))} className="h-14 rounded-none border-0 text-center shadow-none ring-0 focus:ring-0" />
                <button type="button" onClick={handleIncrement} aria-label="Αύξηση" className="cursor-pointer px-4 py-4 text-lg text-[#64748b]">+</button>
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
                <FieldLabel>ΑΞΙΟΛΟΓΗΣΗ ΑΠΟΣΤΟΛΗΣ (ΠΡΟΑΙΡΕΤΙΚΑ)</FieldLabel>
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
