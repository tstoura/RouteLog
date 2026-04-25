import { FormSection } from '../ui/FormSection.tsx'
import {
  ActivityTypeTabs,
  type ActivityFormTabKind,
  DateInputWithCalendar,
  FieldHint,
  FieldHints,
  FieldLabel,
  FormActions,
  NotesSection,
  type Option,
  ScoreSummaryCard,
  SectionIconBasics,
  SectionIconParticipation,
  SectionIconTechnical,
  SelectField,
} from './shared/FormBuildingBlocks.tsx'
import { Input } from '../ui/Input.tsx'

const areaOptions: Option[] = [
  { value: 'kanoniko', label: 'ΚΑΝΟΝΙΚΟ' },
  { value: 'xeimerino', label: 'Χειμερινό πεδίο' },
]

const difficultyOptions: Option[] = [
  { value: 'pezoporia', label: 'ΠΕΖΟΠΟΡΙΑ' },
  { value: 'epiki', label: 'Επική' },
  { value: 'alpino', label: 'Αλπικό' },
]

export type HikingActivityFormProps = {
  onMockSubmitSuccess?: () => void
  onActivityTabSelect: (kind: ActivityFormTabKind) => void
}

export function HikingActivityForm({ onMockSubmitSuccess, onActivityTabSelect }: HikingActivityFormProps) {
  return (
    <form
      className="space-y-8"
      onSubmit={(e) => {
        e.preventDefault()
        onMockSubmitSuccess?.()
      }}
    >
      <ActivityTypeTabs active="hiking" onTabSelect={onActivityTabSelect} />

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-8">
          <FormSection title="ΒΑΣΙΚΑ ΣΤΟΙΧΕΙΑ" icon={<SectionIconBasics />}>
            <div className="grid gap-6 md:grid-cols-2">
              <label className="flex flex-col gap-3">
                <FieldLabel>ΗΜΕΡΟΜΗΝΙΑ</FieldLabel>
                <DateInputWithCalendar defaultValue="05/30/2024" />
                <FieldHints>
                  <FieldHint>Η ημερομηνία πραγματοποίησης της ανάβασης.</FieldHint>
                </FieldHints>
              </label>

              <label className="flex flex-col gap-3">
                <FieldLabel>ΒΟΥΝΟ</FieldLabel>
                <Input
                  placeholder="Το βουνό στο οποίο πραγματοποιήθηκε η ανάβαση."
                  className="h-14 text-base shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
                />
              </label>

              <label className="flex flex-col gap-3">
                <FieldLabel>ΑΦΕΤΗΡΙΑ</FieldLabel>
                <Input
                  placeholder="Το σημείο εκκίνησης της διαδρομής."
                  className="h-14 text-base shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
                />
              </label>

              <label className="flex flex-col gap-3">
                <FieldLabel>ΚΟΡΥΦΗ / ΤΕΡΜΑΤΙΣΜΟΣ</FieldLabel>
                <Input
                  placeholder="Το σημείο στο οποίο ολοκληρώθηκε η διαδρομή."
                  className="h-14 text-base shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
                />
              </label>
            </div>
          </FormSection>

          <FormSection title="ΤΕΧΝΙΚΑ ΧΑΡΑΚΤΗΡΙΣΤΙΚΑ" icon={<SectionIconTechnical />}>
            <div className="flex flex-col gap-8">
              <label className="flex flex-col gap-3">
                <FieldLabel>ΜΕΓΙΣΤΟ ΥΨΟΜΕΤΡΟ (M)</FieldLabel>
                <Input
                  placeholder="Το μέγιστο υψόμετρο της ανάβασης."
                  className="h-14 text-base shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
                />
              </label>

              <label className="flex flex-col gap-3">
                <FieldLabel>ΣΥΝΟΛΙΚΗ ΥΨΟΜΕΤΡΙΚΗ ΑΝΑΒΑΣΗ (M)</FieldLabel>
                <Input placeholder="Σ.Υ.Α" className="h-14 text-base shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" />
                <FieldHints>
                  <FieldHint>Η διαφορά υψομέτρου από το σημείο εκκίνησης ως το υψηλότερο σημείο.</FieldHint>
                </FieldHints>
              </label>

              <label className="flex flex-col gap-3">
                <FieldLabel>ΜΗΚΟΣ ΔΙΑΔΡΟΜΗΣ (M)</FieldLabel>
                <Input
                  placeholder="Το συνολικό μήκος της διαδρομής."
                  className="h-14 text-base shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
                />
                <FieldHints>
                  <FieldHint>Για διαδρομές κάτω των 15 km, η συμπλήρωση είναι προαιρετική.</FieldHint>
                </FieldHints>
              </label>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="flex flex-col gap-3">
                  <SelectField label="ΠΕΔΙΟ" options={areaOptions} />
                  <FieldHints>
                    <FieldHint>Η συνθήκη του πεδίου κατά τη δραστηριότητα.</FieldHint>
                  </FieldHints>
                </div>
                <div className="flex flex-col gap-3">
                  <SelectField label="ΒΑΘΜΟΣ ΔΥΣΚΟΛΙΑΣ" options={difficultyOptions} />
                  <FieldHints>
                    <FieldHint>Προέκυψε δυναμικά βάσει διαδρομής.</FieldHint>
                    <FieldHint>Επίλεξε τον βαθμό που αντιστοιχεί στη συνολική δυσκολία.</FieldHint>
                  </FieldHints>
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection title="ΣΥΜΜΕΤΟΧΗ & ΠΡΟΣΘΕΤΑ ΣΤΟΙΧΕΙΑ" icon={<SectionIconParticipation />}>
            <div className="flex flex-col gap-3 md:max-w-[340px]">
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
                <FieldHint>Ο αριθμός των μελών του συλλόγου που συμμετείχαν.</FieldHint>
                <FieldHint>Απαιτούνται τουλάχιστον 3 άτομα για επίσημη καταγραφή.</FieldHint>
              </FieldHints>
            </div>
          </FormSection>

          <NotesSection
            personalPlaceholder="Καταγράψτε προσωπικές σκέψεις ή εμπειρίες από τη δραστηριότητα."
            personalHint="Ιδιωτική σημείωση για την εμπειρία σου."
            publicPlaceholder="Καταγράψτε πληροφορίες χρήσιμες για άλλους χρήστες."
            publicHint="Πληροφορίες χρήσιμες για άλλους χρήστες."
          />

          <FormActions />
        </div>

        <ScoreSummaryCard
          description="Οι βαθμοί υπολογίζονται αυτόματα βάσει το σημείο της δραστηριότητας."
          value="-"
          icon="Σ"
        />
      </div>
    </form>
  )
}
