import { useState } from 'react'
import { FormSection } from '../ui/FormSection.tsx'
import {
  ACTIVITY_SEASON_RADIO_OPTIONS,
  ActivityTypeTabs,
  type ActivityFormTabKind,
  DateInputWithCalendar,
  FieldHint,
  FieldHints,
  FieldLabel,
  FormActions,
  NotesSection,
  type Option,
  RadioGroupField,
  ScoreSummaryCard,
  SectionIconBasics,
  SectionIconParticipation,
  SectionIconTechnical,
  SelectField,
} from './shared/FormBuildingBlocks.tsx'
import { Input } from '../ui/Input.tsx'

/** Expedition (Αποστολές Εξωτερικού) difficulty scale — source sheet «3.ΑΠΟΣΤΟΛΕΣ ΕΞΩΤΕΡΙΚΟΥ». */
const expeditionDifficultyOptions: Option[] = [
  { value: 'pezoporia', label: 'ΠΕΖΟΠΟΡΙΑ' },
  { value: 'f_minus', label: 'F-' },
  { value: 'f', label: 'F' },
  { value: 'f_plus', label: 'F+' },
  { value: 'pd_minus', label: 'PD-' },
  { value: 'pd', label: 'PD' },
  { value: 'pd_plus', label: 'PD+' },
  { value: 'ad_minus', label: 'AD-' },
  { value: 'ad', label: 'AD' },
  { value: 'ad_plus', label: 'AD+' },
  { value: 'd_minus', label: 'D-' },
  { value: 'd', label: 'D' },
  { value: 'd_plus', label: 'D+' },
  { value: 'td_minus', label: 'TD-' },
  { value: 'td', label: 'TD' },
  { value: 'td_plus', label: 'TD+' },
  { value: 'ed_minus', label: 'ED-' },
  { value: 'ed', label: 'ED' },
  { value: 'ed_plus', label: 'ED+' },
]

const organizationOptions: Option[] = [
  { value: '', label: 'Επιλογή' },
  { value: 'oxi', label: 'Όχι' },
  { value: 'evropi', label: 'Ευρώπη' },
  { value: 'afriki', label: 'Αφρική' },
  { value: 'alloi', label: 'Άλλες Ήπειροι' },
]

/** Matches other activity form inputs; short placeholders + helpers avoid clipping. */
const expeditionInputClass = 'h-14 min-h-14 px-4 text-base leading-normal shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]'

export type ExpeditionActivityFormProps = {
  onMockSubmitSuccess?: () => void
  onActivityTabSelect: (kind: ActivityFormTabKind) => void
}

export function ExpeditionActivityForm({ onMockSubmitSuccess, onActivityTabSelect }: ExpeditionActivityFormProps) {
  const [season, setSeason] = useState('θερινή')

  return (
    <form
      className="space-y-8"
      onSubmit={(e) => {
        e.preventDefault()
        onMockSubmitSuccess?.()
      }}
    >
      <ActivityTypeTabs active="expedition" onTabSelect={onActivityTabSelect} />

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-8">
          <FormSection title="ΒΑΣΙΚΑ ΣΤΟΙΧΕΙΑ" icon={<SectionIconBasics />}>
            <div className="grid gap-6 md:grid-cols-2">
              <label className="flex flex-col gap-3">
                <FieldLabel>ΗΜΕΡΟΜΗΝΙΑ</FieldLabel>
                <DateInputWithCalendar defaultValue="24/05/2026" />
                <FieldHints>
                  <FieldHint>Η ημερομηνία πραγματοποίησης της δραστηριότητας.</FieldHint>
                </FieldHints>
              </label>

              <label className="flex flex-col gap-3">
                <FieldLabel>ΧΩΡΑ</FieldLabel>
                <Input placeholder="π.χ. Νεπάλ" className={expeditionInputClass} />
                <FieldHints>
                  <FieldHint>Η χώρα στην οποία πραγματοποιήθηκε η αποστολή.</FieldHint>
                </FieldHints>
              </label>

              <label className="flex flex-col gap-3">
                <FieldLabel>ΟΡΟΣΕΙΡΑ</FieldLabel>
                <Input placeholder="π.χ. Ιμαλάια" className={expeditionInputClass} />
                <FieldHints>
                  <FieldHint>Η οροσειρά στην οποία ανήκει το βουνό.</FieldHint>
                </FieldHints>
              </label>

              <label className="flex flex-col gap-3">
                <FieldLabel>ΒΟΥΝΟ</FieldLabel>
                <Input placeholder="π.χ. Mont Blanc" className={expeditionInputClass} />
                <FieldHints>
                  <FieldHint>Το βουνό στο οποίο πραγματοποιήθηκε η ανάβαση.</FieldHint>
                </FieldHints>
              </label>

              <label className="flex flex-col gap-3">
                <FieldLabel>ΚΟΡΥΦΗ</FieldLabel>
                <Input placeholder="π.χ. Base Camp" className={expeditionInputClass} />
                <FieldHints>
                  <FieldHint>Η κορυφή που κατακτήθηκε.</FieldHint>
                </FieldHints>
              </label>

              <label className="flex flex-col gap-3">
                <FieldLabel>ΔΙΑΔΡΟΜΗ</FieldLabel>
                <Input placeholder="π.χ. Base Camp Trek" className={expeditionInputClass} />
                <FieldHints>
                  <FieldHint>Το όνομα ή η περιγραφή της διαδρομής.</FieldHint>
                </FieldHints>
              </label>

              <div className="flex flex-col gap-3 md:col-span-2">
                <RadioGroupField
                  name="expedition-season"
                  label="ΕΠΟΧΗ"
                  options={ACTIVITY_SEASON_RADIO_OPTIONS}
                  value={season}
                  onChange={setSeason}
                />
                <FieldHints>
                  <FieldHint>Επιλέξτε με βάση τις πραγματικές συνθήκες (θερινές ή χειμερινές).</FieldHint>
                </FieldHints>
              </div>
            </div>
          </FormSection>

          <FormSection title="ΤΕΧΝΙΚΑ ΧΑΡΑΚΤΗΡΙΣΤΙΚΑ" icon={<SectionIconTechnical />}>
            <div className="flex flex-col gap-8">
              <label className="flex flex-col gap-3">
                <FieldLabel>ΜΕΓΙΣΤΟ ΥΨΟΜΕΤΡΟ (M)</FieldLabel>
                <Input placeholder="π.χ. 5364" className={expeditionInputClass} />
                <FieldHints>
                  <FieldHint>Συμπληρώστε το υψηλότερο σημείο που φτάσατε.</FieldHint>
                </FieldHints>
              </label>

              <label className="flex flex-col gap-3">
                <FieldLabel>ΣΥΝΟΛΙΚΗ ΥΨΟΜΕΤΡΙΚΗ ΑΝΑΒΑΣΗ</FieldLabel>
                <Input placeholder="π.χ. 1200" className={expeditionInputClass} />
                <FieldHints>
                  <FieldHint>Η διαφορά υψομέτρου από το σημείο εκκίνησης έως το υψηλότερο σημείο.</FieldHint>
                </FieldHints>
              </label>

              <div className="flex flex-col gap-3">
                <SelectField label="ΒΑΘΜΟΣ ΔΥΣΚΟΛΙΑΣ" options={expeditionDifficultyOptions} defaultValue="pezoporia" />
                <FieldHints>
                  <FieldHint>Επιλέξτε τον βαθμό που αντιστοιχεί στη συνολική δυσκολία της ανάβασης.</FieldHint>
                </FieldHints>
              </div>
            </div>
          </FormSection>

          <FormSection title="ΣΥΜΜΕΤΟΧΗ & ΠΡΟΣΘΕΤΑ ΣΤΟΙΧΕΙΑ" icon={<SectionIconParticipation />}>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-3">
                <FieldLabel>ΑΤΟΜΑ</FieldLabel>
                <div className="flex items-center rounded-lg border border-[#e2e8e0] bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
                  <button type="button" className="px-4 py-4 text-lg text-[#64748b]">
                    −
                  </button>
                  <Input
                    defaultValue="1"
                    className="h-14 rounded-none border-0 text-center shadow-none ring-0 focus:ring-0"
                  />
                  <button type="button" className="px-4 py-4 text-lg text-[#64748b]">
                    +
                  </button>
                </div>
                <FieldHints>
                  <FieldHint>Συμπεριλάβετε όλα τα μέλη της ομάδας.</FieldHint>
                </FieldHints>
              </div>

              <div className="flex flex-col gap-3">
                <SelectField label="ΟΡΓΑΝΩΣΗ" options={organizationOptions} />
                <FieldHints>
                  <FieldHint>
                    Επιλέξτε την ήπειρο στην οποία πραγματοποιήθηκε η αποστολή. Αν δεν διοργανώθηκε από τον σύλλογο,
                    επιλέξτε «Όχι».
                  </FieldHint>
                </FieldHints>
              </div>
            </div>
          </FormSection>

          <NotesSection
            personalPlaceholder="Καταγράψτε προσωπικές εμπειρίες ή σημαντικές στιγμές από την αποστολή."
            personalHint="Ιδιωτική σημείωση μόνο για εσάς."
            publicPlaceholder="Καταγράψτε πληροφορίες χρήσιμες για άλλους χρήστες."
            publicHint="Συνθήκες, δυσκολίες, εξοπλισμός ή χρήσιμες συμβουλές."
          />

          <FormActions />
        </div>

        <ScoreSummaryCard
          description="Οι βαθμοί υπολογίζονται αυτόματα με βάση τα στοιχεία της αποστολής."
          value="-"
          icon="Σ"
        />
      </div>
    </form>
  )
}
