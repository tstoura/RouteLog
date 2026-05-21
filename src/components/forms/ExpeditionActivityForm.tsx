import { type FormEvent, useState } from 'react'
import { FormSection } from '../ui/FormSection.tsx'
import {
  ActivityTypeTabs,
  type ActivityFormTabKind,
  DateInputWithCalendar,
  FieldHint,
  FieldHints,
  FieldLabel,
  FormActions,
  OfficialParticipationSection,
  RadioGroupField,
  ScoreSummaryCard,
  SectionIconBasics,
  SectionIconNotes,
  SectionIconParticipation,
  SectionIconTechnical,
  SelectFieldControlled,
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
import { DEV_CLUB_ID, DEV_USER_ID } from '../../lib/devUser.ts'

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
  lastSubmittedPoints,
  onActivityTabSelect,
}: ExpeditionActivityFormProps) {
  // ── Official / personal toggle ───────────────────────────────────────────────
  const [isOfficial, setIsOfficial] = useState(true)

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

  const handleDecrement = () => setParticipantsNum((n) => Math.max(1, n - 1))
  const handleIncrement = () => setParticipantsNum((n) => n + 1)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitError(null)

    // TODO: replace DEV_USER_ID / DEV_CLUB_ID with JWT-decoded user context
    //       once auth guards are implemented (later phase).
    if (!DEV_USER_ID) {
      setSubmitError('Δεν βρέθηκε αναγνωριστικό χρήστη. Ορίστε VITE_DEV_USER_ID στο .env.')
      return
    }
    if (isOfficial && !DEV_CLUB_ID) {
      setSubmitError('Δεν βρέθηκε αναγνωριστικό συλλόγου. Ορίστε VITE_DEV_CLUB_ID στο .env.')
      return
    }

    // ── Frontend validation for official records ──────────────────────────────
    if (isOfficial) {
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

    // ── TODO: for personal records, determine which fields can be omitted ─────
    // Currently all standard fields are required by the backend regardless of
    // isOfficial. This will be revisited when personal record optional fields
    // are clarified in a later phase.

    setIsSubmitting(true)
    try {
      const result = await submitExpeditionActivity({
        userId: DEV_USER_ID,
        isOfficial,
        clubId: isOfficial ? DEV_CLUB_ID : undefined,
        date,
        country: country.trim(),
        mountainRange: mountainRange.trim(),
        mountain: mountain.trim(),
        summit: summit.trim(),
        routeName: routeName.trim(),
        season,
        altitude: Number(altitude) || 0,
        totalElevationGain: Number(totalElevationGain) || 0,
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
    <form className="space-y-8" onSubmit={handleSubmit}>
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
                  placeholder="π.χ. Νεπάλ"
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
                  placeholder="π.χ. Ιμαλάια"
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
                  placeholder="π.χ. Mont Blanc"
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
                  placeholder="π.χ. Κορυφή 5364 m"
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
                  placeholder="π.χ. Base Camp Trek"
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
                <FieldLabel>ΜΕΓΙΣΤΟ ΥΨΟΜΕΤΡΟ (M)</FieldLabel>
                <Input
                  type="number"
                  min="0"
                  value={altitude}
                  onChange={(e) => setAltitude(e.target.value)}
                  placeholder="π.χ. 5364"
                  className={expeditionInputClass}
                />
                <FieldHints>
                  <FieldHint>Συμπληρώστε το υψηλότερο σημείο που φτάσατε.</FieldHint>
                </FieldHints>
              </label>

              <label className="flex flex-col gap-3">
                <FieldLabel>ΣΥΝΟΛΙΚΗ ΥΨΟΜΕΤΡΙΚΗ ΑΝΑΒΑΣΗ</FieldLabel>
                <Input
                  type="number"
                  min="0"
                  value={totalElevationGain}
                  onChange={(e) => setTotalElevationGain(e.target.value)}
                  placeholder="π.χ. 1200"
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
                  label="ΒΑΘΜΟΣ ΔΥΣΚΟΛΙΑΣ"
                  options={EXPEDITION_GRADE_SELECT_OPTIONS}
                  value={difficultyGrade}
                  onChange={setDifficultyGrade}
                  disabledValues={['']}
                />
                <FieldHints>
                  <FieldHint>{EXPEDITION_DIFFICULTY_GRADE_HELPER}</FieldHint>
                </FieldHints>
              </div>
            </div>
          </FormSection>

          <FormSection title="ΣΥΜΜΕΤΟΧΗ & ΠΡΟΣΘΕΤΑ ΣΤΟΙΧΕΙΑ" icon={<SectionIconParticipation />}>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-3">
                <FieldLabel>ΑΤΟΜΑ</FieldLabel>
                <div className="flex items-center rounded-lg border border-[#e2e8e0] bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
                  <button
                    type="button"
                    onClick={handleDecrement}
                    aria-label="Μείωση αριθμού ατόμων"
                    className="px-4 py-4 text-lg text-[#64748b]"
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
                    onClick={handleIncrement}
                    aria-label="Αύξηση αριθμού ατόμων"
                    className="px-4 py-4 text-lg text-[#64748b]"
                  >
                    +
                  </button>
                </div>
                <FieldHints>
                  <FieldHint>Συμπεριλάβετε όλα τα μέλη της ομάδας.</FieldHint>
                </FieldHints>
              </div>

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

          <OfficialParticipationSection value={isOfficial} onChange={setIsOfficial} />

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

        <ScoreSummaryCard
          description={
            isOfficial
              ? 'Οι βαθμοί υπολογίζονται αυτόματα με βάση τα στοιχεία της αποστολής.'
              : 'Οι βαθμοί δεν υπολογίζονται για προσωπικές καταγραφές.'
          }
          value={lastSubmittedPoints != null ? String(lastSubmittedPoints) : '-'}
          icon="Σ"
        />
      </div>
    </form>
  )
}
