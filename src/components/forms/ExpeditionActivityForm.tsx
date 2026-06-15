import { type FormEvent, useEffect, useState } from 'react'
import { FormSection } from '../ui/FormSection.tsx'
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
  toWholeNumber,
  handleFormEnterAsTab,
  ParticipantCountStepper,
} from './shared/FormBuildingBlocks.tsx'
import { Input } from '../ui/Input.tsx'
import { Textarea } from '../ui/Textarea.tsx'
import {
  EXPEDITION_DIFFICULTY_GRADE_HELPER,
  EXPEDITION_DIFFICULTY_GRADE_OPTIONS,
  EXPEDITION_ORGANIZATION_HELPER,
  EXPEDITION_ORGANIZATION_TYPE_OPTIONS,
  EXPEDITION_SEASON_OPTIONS,
} from '../../constants/expeditionFormOptions.ts'
import { submitExpeditionActivity } from '../../api/activities.ts'
import { ApiError } from '../../api/client.ts'
import { useAuth } from '../../auth/AuthContext.tsx'
import { usePointsPreview } from '../../hooks/usePointsPreview.ts'

/** Matches other activity form inputs. */
const expeditionInputClass =
  'h-14 min-h-14 px-4 text-base leading-normal shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]'

/** ΒΑΘΜΟΣ ΔΥΣΚΟΛΙΑΣ options: empty placeholder + real backend values. */
const EXPEDITION_GRADE_SELECT_OPTIONS = [
  { value: '', label: 'Επιλογή βαθμού...' },
  ...EXPEDITION_DIFFICULTY_GRADE_OPTIONS,
]

/** ΟΡΓΑΝΩΣΗ options: empty placeholder + real backend values. */
const EXPEDITION_ORG_SELECT_OPTIONS = [
  { value: '', label: 'Επιλογή...' },
  ...EXPEDITION_ORGANIZATION_TYPE_OPTIONS,
]

export type ExpeditionActivityFormProps = {
  onSubmitSuccess?: (points: number | null) => void
  lastSubmittedPoints?: number | null
  onActivityTabSelect: (kind: ActivityFormTabKind) => void
}

export function ExpeditionActivityForm({
  onSubmitSuccess,
  lastSubmittedPoints: _lastSubmittedPoints,
  onActivityTabSelect,
}: ExpeditionActivityFormProps) {
  const { user } = useAuth()

  // True when the user has at least one club membership.
  const hasClub = Boolean(user && user.memberships.length > 0)

  // ── Official / personal toggle ───────────────────────────────────────────────
  const [isOfficial, setIsOfficial] = useState(true)

  // When the user has no club, always force isOfficial = false.
  useEffect(() => {
    if (!hasClub) setIsOfficial(false)
  }, [hasClub])

  // Effective value used in JSX and submit handler.
  // Users without club always submit personal (false), regardless of toggle.
  const effectiveIsOfficial = hasClub ? isOfficial : false

  // ── Basic fields ─────────────────────────────────────────────────────────────
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [country, setCountry] = useState('')
  const [mountainRange, setMountainRange] = useState('')
  const [mountain, setMountain] = useState('')
  const [summit, setSummit] = useState('')
  const [routeName, setRouteName] = useState('')
  // Default to the first valid backend season value.
  const [season, setSeason] = useState<string>(EXPEDITION_SEASON_OPTIONS[0].value)

  // ── Technical fields ─────────────────────────────────────────────────────────
  const [altitude, setAltitude] = useState('')
  const [totalElevationGain, setTotalElevationGain] = useState('')
  const [difficultyGrade, setDifficultyGrade] = useState('')

  // ── Participation ─────────────────────────────────────────────────────────────
  const [participantsNum, setParticipantsNum] = useState(1)
  const [organizationType, setOrganizationType] = useState('')

  // ── Notes (optional for both official and personal records) ──────────────────
  const [privateNotes, setPrivateNotes] = useState('')
  const [publicNotes, setPublicNotes] = useState('')

  // ── Submit state ─────────────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // ── Live points preview ─────────────────────────────────────────────────────
  const preview = usePointsPreview('expedition', {
    altitude: Number(altitude) || 0,
    totalElevationGain: Number(totalElevationGain) || 0,
    season,
    difficultyGrade,
    participantsNum,
    organizationType,
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

    if (!user) {
      setSubmitError('Δεν είστε συνδεδεμένος. Παρακαλώ συνδεθείτε ξανά.')
      return
    }

    // Backend also enforces this; the UI hides the toggle so this is a safety net.
    // effectiveIsOfficial is computed at component level.

    // ── Frontend validation for official records ──────────────────────────────
    if (effectiveIsOfficial) {
      if (
        !country.trim() ||
        !mountainRange.trim() ||
        !mountain.trim() ||
        !summit.trim() ||
        !routeName.trim()
      ) {
        setSubmitError(
          'Χώρα, οροσειρά, βουνό, κορυφή και διαδρομή είναι υποχρεωτικά για επίσημη καταγραφή.',
        )
        return
      }
      if (!altitude || Number(altitude) <= 0) {
        setSubmitError('Το μέγιστο υψόμετρο είναι υποχρεωτικό για επίσημη καταγραφή.')
        return
      }
      if (!totalElevationGain || Number(totalElevationGain) <= 0) {
        setSubmitError(
          'Η συνολική υψομετρική ανάβαση είναι υποχρεωτική για επίσημη καταγραφή.',
        )
        return
      }
      if (!difficultyGrade) {
        setSubmitError('Ο βαθμός δυσκολίας είναι υποχρεωτικός για επίσημη καταγραφή.')
        return
      }
      if (!organizationType) {
        setSubmitError('Η οργάνωση είναι υποχρεωτική για επίσημη καταγραφή.')
        return
      }
      if (participantsNum < 1) {
        setSubmitError('Απαιτείται τουλάχιστον 1 άτομο.')
        return
      }
    }

    setIsSubmitting(true)
    try {
      const result = await submitExpeditionActivity({
        isOfficial: effectiveIsOfficial,
        date,
        country: country.trim(),
        mountainRange: mountainRange.trim(),
        mountain: mountain.trim(),
        summit: summit.trim(),
        routeName: routeName.trim(),
        season,
        altitude: effectiveIsOfficial ? Number(altitude) || 0 : (Number(altitude) > 0 ? Number(altitude) : undefined),
        totalElevationGain: effectiveIsOfficial ? Number(totalElevationGain) || 0 : (Number(totalElevationGain) > 0 ? Number(totalElevationGain) : undefined),
        difficultyGrade,
        participantsNum,
        organizationType: organizationType || 'no',
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
      <ActivityTypeTabs active="expedition" onTabSelect={onActivityTabSelect} />

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
                  <FieldHint>Η ημερομηνία πραγματοποίησης της δραστηριότητας.</FieldHint>
                </FieldHints>
              </label>

              <label className="flex flex-col gap-3">
                <FieldLabel>ΧΩΡΑ</FieldLabel>
                <Input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Χώρα"
                  className={expeditionInputClass}
                />
                <FieldHints>
                  <FieldHint>Η χώρα στην οποία πραγματοποιήθηκε η αποστολή.</FieldHint>
                </FieldHints>
              </label>

              <label className="flex flex-col gap-3">
                <FieldLabel>ΟΡΟΣΕΙΡΑ</FieldLabel>
                <Input
                  value={mountainRange}
                  onChange={(e) => setMountainRange(e.target.value)}
                  placeholder="Οροσειρά"
                  className={expeditionInputClass}
                />
                <FieldHints>
                  <FieldHint>Η οροσειρά στην οποία ανήκει το βουνό.</FieldHint>
                </FieldHints>
              </label>

              <label className="flex flex-col gap-3">
                <FieldLabel>ΒΟΥΝΟ</FieldLabel>
                <Input
                  value={mountain}
                  onChange={(e) => setMountain(e.target.value)}
                  placeholder="Βουνό"
                  className={expeditionInputClass}
                />
                <FieldHints>
                  <FieldHint>Το βουνό στο οποίο πραγματοποιήθηκε η ανάβαση.</FieldHint>
                </FieldHints>
              </label>

              <label className="flex flex-col gap-3">
                <FieldLabel>ΚΟΡΥΦΗ</FieldLabel>
                <Input
                  value={summit}
                  onChange={(e) => setSummit(e.target.value)}
                  placeholder="Κορυφή"
                  className={expeditionInputClass}
                />
                <FieldHints>
                  <FieldHint>Η κορυφή που κατακτήθηκε.</FieldHint>
                </FieldHints>
              </label>

              <label className="flex flex-col gap-3">
                <FieldLabel>ΔΙΑΔΡΟΜΗ</FieldLabel>
                <Input
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                  placeholder="Διαδρομή"
                  className={expeditionInputClass}
                />
                <FieldHints>
                  <FieldHint>Το όνομα ή η περιγραφή της διαδρομής.</FieldHint>
                </FieldHints>
              </label>

              <div className="flex flex-col gap-3 md:col-span-2">
                <RadioGroupField
                  name="expedition-season"
                  label="ΕΠΟΧΗ"
                  options={EXPEDITION_SEASON_OPTIONS}
                  value={season}
                  onChange={setSeason}
                />
                <FieldHints>
                  <FieldHint>
                    Επιλέξτε με βάση τις πραγματικές συνθήκες (θερινές ή χειμερινές).
                  </FieldHint>
                  <FieldHint>
                    <span className="italic">
                      Για αποστολές σε συνθήκες ορειβατικού σκι, επιλέξτε «Χειμερινή».
                    </span>
                  </FieldHint>
                </FieldHints>
              </div>
            </div>
          </FormSection>

          <FormSection title="ΤΕΧΝΙΚΑ ΧΑΡΑΚΤΗΡΙΣΤΙΚΑ" icon={<SectionIconTechnical />}>
            <div className="flex flex-col gap-8">
              <label className="flex flex-col gap-3">
                <FieldLabel>{effectiveIsOfficial ? 'ΜΕΓΙΣΤΟ ΥΨΟΜΕΤΡΟ (M)' : 'ΜΕΓΙΣΤΟ ΥΨΟΜΕΤΡΟ (M) (ΠΡΟΑΙΡΕΤΙΚΟ)'}</FieldLabel>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={altitude}
                  onChange={(e) => setAltitude(toWholeNumber(e.target.value))}
                  placeholder="Μέγιστο υψόμετρο"
                  className={expeditionInputClass}
                />
                <FieldHints>
                  <FieldHint>Συμπληρώστε το υψηλότερο σημείο που φτάσατε.</FieldHint>
                </FieldHints>
              </label>

              <label className="flex flex-col gap-3">
                <FieldLabel>{effectiveIsOfficial ? 'ΣΥΝΟΛΙΚΗ ΥΨΟΜΕΤΡΙΚΗ ΑΝΑΒΑΣΗ' : 'ΣΥΝΟΛΙΚΗ ΥΨΟΜΕΤΡΙΚΗ ΑΝΑΒΑΣΗ (ΠΡΟΑΙΡΕΤΙΚΟ)'}</FieldLabel>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={totalElevationGain}
                  onChange={(e) => setTotalElevationGain(toWholeNumber(e.target.value))}
                  placeholder="Σ.Υ.Α."
                  className={expeditionInputClass}
                />
                <FieldHints>
                  <FieldHint>
                    Η διαφορά υψομέτρου από το σημείο εκκίνησης έως το υψηλότερο σημείο.
                  </FieldHint>
                </FieldHints>
              </label>

              <div className="flex flex-col gap-3">
                <SelectFieldControlled
                  label={effectiveIsOfficial ? 'ΒΑΘΜΟΣ ΔΥΣΚΟΛΙΑΣ' : 'ΒΑΘΜΟΣ ΔΥΣΚΟΛΙΑΣ (ΠΡΟΑΙΡΕΤΙΚΟ)'}
                  options={EXPEDITION_GRADE_SELECT_OPTIONS}
                  value={difficultyGrade}
                  onChange={setDifficultyGrade}
                  disabledValues={effectiveIsOfficial ? [''] : []}
                />
                <FieldHints>
                  <FieldHint>{EXPEDITION_DIFFICULTY_GRADE_HELPER}</FieldHint>
                </FieldHints>
              </div>
            </div>
          </FormSection>

          <FormSection title="ΣΥΜΜΕΤΟΧΗ & ΠΡΟΣΘΕΤΑ ΣΤΟΙΧΕΙΑ" icon={<SectionIconParticipation />}>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex min-w-0 flex-col gap-3">
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
                  <FieldHint>Συμπεριλάβετε όλα τα μέλη της ομάδας.</FieldHint>
                </FieldHints>
              </div>

              {effectiveIsOfficial ? (
                <div className="flex flex-col gap-3">
                  <SelectFieldControlled
                    label="ΟΡΓΑΝΩΣΗ"
                    options={EXPEDITION_ORG_SELECT_OPTIONS}
                    value={organizationType}
                    onChange={setOrganizationType}
                    disabledValues={['']}
                  />
                  <FieldHints>
                    <FieldHint>{EXPEDITION_ORGANIZATION_HELPER}</FieldHint>
                  </FieldHints>
                </div>
              ) : null}
            </div>
          </FormSection>

          <FormSection title="ΣΗΜΕΙΩΣΕΙΣ" icon={<SectionIconNotes />}>
            <div className="flex flex-col gap-10">
              <label className="flex flex-col gap-3">
                <FieldLabel>ΠΡΟΣΩΠΙΚΗ ΣΗΜΕΙΩΣΗ (ΠΡΟΑΙΡΕΤΙΚΑ)</FieldLabel>
                <Textarea
                  value={privateNotes}
                  onChange={(e) => setPrivateNotes(e.target.value)}
                  placeholder="Καταγράψτε προσωπικές εμπειρίες ή σημαντικές στιγμές από την αποστολή."
                  className="min-h-[150px]"
                />
                <FieldHints>
                  <FieldHint>Ιδιωτική σημείωση μόνο για εσάς.</FieldHint>
                </FieldHints>
              </label>

              <label className="flex flex-col gap-3">
                <FieldLabel>ΑΞΙΟΛΟΓΗΣΗ ΑΠΟΣΤΟΛΗΣ (ΠΡΟΑΙΡΕΤΙΚΑ)</FieldLabel>
                <Textarea
                  value={publicNotes}
                  onChange={(e) => setPublicNotes(e.target.value)}
                  placeholder="Καταγράψτε πληροφορίες χρήσιμες για άλλους χρήστες."
                  className="min-h-[150px]"
                />
                <FieldHints>
                  <FieldHint>Συνθήκες, δυσκολίες, εξοπλισμός ή χρήσιμες συμβουλές.</FieldHint>
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
