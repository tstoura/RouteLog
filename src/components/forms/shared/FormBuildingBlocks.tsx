import type { ChangeEvent, KeyboardEvent, ReactNode } from 'react'
import { BarChart3, FileText, Info, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { FormSection } from '../../ui/FormSection.tsx'
import { Select } from '../../ui/Select.tsx'
import { CustomSelect } from '../../ui/CustomSelect.tsx'
import { CustomDatePicker } from '../../ui/CustomDatePicker.tsx'
import { Textarea } from '../../ui/Textarea.tsx'
import { Button } from '../../ui/Button.tsx'
import { Input } from '../../ui/Input.tsx'

export type Option = { value: string; label: string }

/** Helper copy below a control; use inside a `flex flex-col gap-*` field stack. */
export function FieldHints({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`space-y-2 ${className}`}>{children}</div>
}

export function FieldLabel({ children }: { children: string }) {
  return <p className="text-xs font-semibold uppercase tracking-[0.6px] text-[#64748b]">{children}</p>
}

export function FieldHint({ children }: { children: ReactNode }) {
  return (
    <p className="max-w-full break-words text-xs leading-[17.5px] text-[#94a3b8]">{children}</p>
  )
}

const formSectionIconClass = 'size-[18px] shrink-0 text-[#00453e]'

export function SectionIconBasics() {
  return <Info className={formSectionIconClass} strokeWidth={2} aria-hidden />
}

export function SectionIconTechnical() {
  return <BarChart3 className={formSectionIconClass} strokeWidth={2} aria-hidden />
}

export function SectionIconParticipation() {
  return <Users className={formSectionIconClass} strokeWidth={2} aria-hidden />
}

export function SectionIconNotes() {
  return <FileText className={formSectionIconClass} strokeWidth={2} aria-hidden />
}

type DateInputProps = {
  value?: string
  onChange?: (e: { target: { value: string } }) => void
  max?: string
  disabled?: boolean
  className?: string
  /** Accepted but ignored — the native `type="date"` attr is not needed by the custom picker */
  type?: string
  /** Passed to the date trigger when it is not inside a wrapping `<label>`. */
  ariaLabel?: string
}

/**
 * Normalises a raw text-input value for whole-number (integer) meter fields.
 * Strips dots, commas and spaces that users commonly type as thousands
 * separators (e.g. "1.500" → "1500", "1,500" → "1500").
 * Non-digit characters other than separators are also removed so the stored
 * string is always a plain integer or empty.
 */
export function toWholeNumber(raw: string): string {
  return raw.replace(/[.,\s]/g, '').replace(/\D/g, '')
}

/**
 * Normalises a raw text-input value for decimal numeric fields (e.g. route
 * length in metres). Strips any character that is not a digit, dot or comma,
 * normalises commas to dots, and ensures at most one decimal point.
 * Prevents users from entering letters or units (e.g. "20μ", "20m").
 */
export function toDecimalNumber(raw: string): string {
  // Remove anything that isn't a digit, dot or comma
  const stripped = raw.replace(/[^\d.,]/g, '').replace(/,/g, '.')
  // Keep only the first decimal point
  const [integer, ...rest] = stripped.split('.')
  return rest.length > 0 ? `${integer}.${rest.join('')}` : integer
}

/**
 * Form-level onKeyDown handler: makes Enter behave like Tab inside <input>
 * elements, advancing focus to the next focusable form element instead of
 * submitting the form. Textareas, selects, and buttons are unaffected.
 */
export function handleFormEnterAsTab(e: KeyboardEvent<HTMLFormElement>) {
  if (e.key !== 'Enter') return
  const target = e.target as HTMLElement
  if (target.tagName !== 'INPUT') return
  e.preventDefault()
  const focusable = Array.from(
    e.currentTarget.querySelectorAll<HTMLElement>(
      'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]):not([type="button"])',
    ),
  )
  const idx = focusable.indexOf(target)
  if (idx !== -1 && idx < focusable.length - 1) {
    focusable[idx + 1].focus()
  }
}

/**
 * − | numeric value | + in one bordered row. Stays a single unit at narrow widths
 * (flex-nowrap, overflow-hidden, flexible centre slot).
 */
export function ParticipantCountStepper({
  displayValue,
  onChange,
  onBlur,
  onDecrement,
  onIncrement,
  decrementAriaLabel = 'Μείωση αριθμού ατόμων',
  incrementAriaLabel = 'Αύξηση αριθμού ατόμων',
  inputAriaLabel = 'Αριθμός ατόμων',
}: {
  displayValue: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  onBlur: () => void
  onDecrement: () => void
  onIncrement: () => void
  decrementAriaLabel?: string
  incrementAriaLabel?: string
  /** Accessible name for the numeric field (visual label is often «ΑΤΟΜΑ» above). */
  inputAriaLabel?: string
}) {
  return (
    <div className="flex h-14 w-full min-w-0 flex-nowrap items-stretch overflow-hidden rounded-lg border border-[#e2e8e0] bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
      <button
        type="button"
        onClick={onDecrement}
        aria-label={decrementAriaLabel}
        className="shrink-0 cursor-pointer px-2.5 text-lg text-[#64748b] sm:px-4"
      >
        −
      </button>
      <div className="flex min-w-0 flex-1 items-stretch justify-center">
        <Input
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={onChange}
          onBlur={onBlur}
          aria-label={inputAriaLabel}
          className="h-full w-full min-w-0 rounded-none border-0 px-1 text-center text-base tabular-nums shadow-none ring-0 focus:ring-0"
        />
      </div>
      <button
        type="button"
        onClick={onIncrement}
        aria-label={incrementAriaLabel}
        className="shrink-0 cursor-pointer px-2.5 text-lg text-[#64748b] sm:px-4"
      >
        +
      </button>
    </div>
  )
}

export function DateInputWithCalendar({ className = '', max, type: _type, ...rest }: DateInputProps) {
  const today = new Date().toISOString().slice(0, 10)
  return (
    <CustomDatePicker
      {...rest}
      max={max ?? today}
      className={className}
    />
  )
}

export function RadioGroupField({
  name,
  label,
  options,
  value,
  onChange,
}: {
  name: string
  label: string
  options: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="w-full text-left">
        <span className="text-xs font-semibold uppercase tracking-[0.6px] text-[#64748b]">{label}</span>
      </legend>
      <div className="flex flex-wrap gap-3 pt-0.5" role="radiogroup" aria-label={label}>
        {options.map((opt) => {
          const selected = value === opt.value
          return (
            <label
              key={opt.value}
              className={[
                'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition',
                selected
                  ? 'border-[#00453e] bg-[rgba(0,69,62,0.08)] text-[#00453e]'
                  : 'border-[#e2e8e0] bg-white text-[#475569] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] hover:border-[#cbd5e1]',
              ].join(' ')}
            >
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={selected}
                onChange={() => onChange(opt.value)}
                className="sr-only"
              />
              {opt.label}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

export function SelectField({
  label,
  options,
  defaultValue = '',
}: {
  label: string
  options: Option[]
  /** Initial selected `value` (uncontrolled). */
  defaultValue?: string
}) {
  return (
    <label className="flex flex-col gap-3">
      <FieldLabel>{label}</FieldLabel>
      <Select defaultValue={defaultValue} className="h-14 text-base shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
        {options.map((opt) => (
          <option key={`${label}-${opt.label}`} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
    </label>
  )
}

export function SelectFieldControlled({
  label,
  ariaLabel,
  options,
  value,
  onChange,
  selectClassName = '',
  disabled,
  disabledValues,
}: {
  /** If omitted, use `ariaLabel` and render a sibling `FieldLabel` outside this component. */
  label?: string
  /** Names the select trigger when `label` is omitted (required in that case for a11y). */
  ariaLabel?: string
  options: Option[]
  value: string
  onChange: (value: string) => void
  selectClassName?: string
  disabled?: boolean
  /** Option values that should be rendered as disabled (e.g. empty placeholder options). */
  disabledValues?: string[]
}) {
  const control = (
    <CustomSelect
      value={value}
      onChange={onChange}
      options={options}
      disabled={disabled}
      disabledValues={disabledValues}
      className={selectClassName}
      ariaLabel={label ? undefined : ariaLabel}
    />
  )

  if (label) {
    return (
      <label className="flex flex-col gap-3">
        <FieldLabel>{label}</FieldLabel>
        {control}
      </label>
    )
  }

  return <div className="flex flex-col gap-3">{control}</div>
}

export type ActivityFormTabKind = 'hiking' | 'climbing' | 'expedition'

const activityTabItems: { kind: ActivityFormTabKind; label: string }[] = [
  { kind: 'hiking', label: 'Ορειβασία / Ορειβατικό Σκι' },
  { kind: 'climbing', label: 'Αναρρίχηση Βράχου' },
  { kind: 'expedition', label: 'Αποστολές Εξωτερικού' },
]

/**
 * Activity type tabs; parent handles every click (including the active tab), e.g. reset + navigation.
 */
export function ActivityTypeTabs({
  active,
  onTabSelect,
}: {
  active: ActivityFormTabKind
  onTabSelect: (kind: ActivityFormTabKind) => void
}) {
  const activeClass =
    'cursor-pointer rounded-lg bg-[#00453e] px-4 py-2 text-sm font-semibold text-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.06)]'
  const inactiveClass =
    'cursor-pointer rounded-lg bg-[#e2e2e5] px-4 py-2 text-sm font-semibold text-[#3f4947] transition hover:bg-[#d6d6da]'

  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Τύπος δραστηριότητας">
      {activityTabItems.map(({ kind, label }) => {
        const isActive = active === kind
        return (
          <button
            key={kind}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabSelect(kind)}
            className={isActive ? activeClass : inactiveClass}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

export function NotesSection({
  personalPlaceholder,
  personalHint,
  publicPlaceholder,
  publicHint,
}: {
  personalPlaceholder: string
  personalHint: string
  publicPlaceholder: string
  publicHint: string
}) {
  return (
    <FormSection title="ΣΗΜΕΙΩΣΕΙΣ" icon={<SectionIconNotes />}>
      <div className="flex flex-col gap-10">
        <label className="flex flex-col gap-3">
          <FieldLabel>ΠΡΟΣΩΠΙΚΗ ΣΗΜΕΙΩΣΗ (ΠΡΟΑΙΡΕΤΙΚΑ)</FieldLabel>
          <Textarea placeholder={personalPlaceholder} className="min-h-[150px]" />
          <FieldHints>
            <FieldHint>{personalHint}</FieldHint>
          </FieldHints>
        </label>

        <label className="flex flex-col gap-3">
          <FieldLabel>ΑΞΙΟΛΟΓΗΣΗ ΔΙΑΔΡΟΜΗΣ (ΠΡΟΑΙΡΕΤΙΚΑ)</FieldLabel>
          <Textarea placeholder={publicPlaceholder} className="min-h-[150px]" />
          <FieldHints>
            <FieldHint>{publicHint}</FieldHint>
          </FieldHints>
        </label>
      </div>
    </FormSection>
  )
}

export function FormActions({
  submitText = 'Υποβολή Καταχώρησης',
  cancelText = 'Ακύρωση',
  onCancel,
  draftButton,
}: {
  submitText?: string
  cancelText?: string
  /** If set, called instead of default browser back navigation. */
  onCancel?: () => void
  /** When set, the secondary button is a draft action instead of cancel/back. */
  draftButton?: { label: string; onClick: () => void }
}) {
  const navigate = useNavigate()
  const handleCancel = () => {
    if (onCancel) onCancel()
    else navigate(-1)
  }

  const secondaryLabel = draftButton?.label ?? cancelText
  const handleSecondary = () => {
    if (draftButton) draftButton.onClick()
    else handleCancel()
  }

  return (
    <div className="flex flex-col gap-3 border-t border-[#e2e8f0] pt-4 sm:flex-row">
      <Button type="submit" className="h-12 flex-1 bg-[#00453e] text-[15px] tracking-[0.35px]">
        {submitText}
      </Button>
      <Button
        type="button"
        variant="secondary"
        className="h-12 flex-1 bg-[#e2e2e5] text-[15px] tracking-[0.35px] text-[#3f4947]"
        onClick={handleSecondary}
      >
        {secondaryLabel}
      </Button>
    </div>
  )
}

export function ScoreSummaryCard({
  title = 'ΥΠΟΛΟΓΙΣΜΕΝΟΙ ΒΑΘΜΟΙ',
  value = '-',
  description,
  icon = 'Σ',
  colSpan = 4,
}: {
  title?: string
  value?: string
  description: string
  icon?: string
  /** Grid column span at lg breakpoint. Defaults to 4 (used by hiking form). */
  colSpan?: 3 | 4
}) {
  return (
    <aside className={`hidden lg:block lg:sticky lg:top-24 lg:self-start ${colSpan === 3 ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
      <div className="rounded-xl bg-[#00453e] p-8 text-center text-white shadow-[0px_25px_50px_-12px_rgba(6,78,59,0.1)]">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-[#005f56] text-2xl font-bold">
          {icon}
        </div>
        <h3 className="text-sm font-extrabold uppercase tracking-[1.4px]">{title}</h3>
        <p className="py-4 text-6xl font-semibold tracking-[-3px]">{value}</p>
        <p className="mx-auto max-w-[200px] text-sm leading-[22px] text-[rgba(140,214,202,0.85)]">{description}</p>
      </div>
    </aside>
  )
}

// ── Side-panel building blocks (Tasks 1–3) ────────────────────────────────────

/**
 * Sticky right-column wrapper used by all activity forms.
 * Visible on all screen sizes — on mobile it flows naturally below the form;
 * on desktop (lg+) it becomes sticky alongside the form.
 */
export function FormSidePanel({
  children,
  colSpan = 4,
}: {
  children: ReactNode
  colSpan?: 3 | 4
}) {
  return (
    <aside
      className={[
        'min-w-0 space-y-4',
        colSpan === 3 ? 'lg:col-span-3' : 'lg:col-span-4',
        'lg:sticky lg:top-24 lg:self-start',
      ].join(' ')}
    >
      {children}
    </aside>
  )
}

/**
 * Green EOOA points preview card — shown only when isOfficial=true and the
 * user has a club membership.
 */
export function SidePanelPointsCard({
  value,
  description,
}: {
  value: string
  description: string
}) {
  return (
    <div className="rounded-xl bg-[#00453e] p-8 text-center text-white shadow-[0px_25px_50px_-12px_rgba(6,78,59,0.1)]">
      <h3 className="text-sm font-extrabold uppercase tracking-[1.4px]">ΒΑΘΜΟΙ ΔΡΑΣΗΣ</h3>
      <p className="py-4 text-6xl font-semibold tracking-[-3px]">{value}</p>
      <p className="mx-auto max-w-[200px] text-sm leading-[22px] text-[rgba(140,214,202,0.85)]">{description}</p>
    </div>
  )
}

/**
 * Interactive official/personal record-type toggle shown in the sticky side
 * panel for club members on create forms.
 */
export function SidePanelRecordTypeToggle({
  value,
  onChange,
}: {
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="min-w-0 rounded-xl border border-[rgba(0,69,62,0.1)] bg-[rgba(0,69,62,0.05)] p-5">
      <p className="mb-4 text-xs font-extrabold uppercase tracking-[1.4px] text-[#64748b]">
        ΤΥΠΟΣ ΚΑΤΑΓΡΑΦΗΣ
      </p>
      <button
        type="button"
        aria-pressed={value}
        aria-label={value ? 'Απενεργοποίηση επίσημης καταγραφής' : 'Ενεργοποίηση επίσημης καταγραφής'}
        onClick={() => onChange(!value)}
        className="flex w-full min-w-0 flex-col gap-3 text-left"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={[
              'relative h-6 w-12 shrink-0 rounded-full transition-colors',
              value ? 'bg-[#00453e]' : 'bg-[#cbd5e1]',
            ].join(' ')}
          >
            <span
              className={[
                'absolute left-1 top-1 size-4 rounded-full bg-white shadow-sm transition-transform',
                value ? 'translate-x-6' : 'translate-x-0',
              ].join(' ')}
            />
          </div>
          <p
            className={[
              'min-w-0 text-sm font-semibold uppercase tracking-[0.35px]',
              value ? 'text-[#00453e]' : 'text-[#64748b]',
            ].join(' ')}
          >
            {value ? 'ΕΠΙΣΗΜΗ ΚΑΤΑΓΡΑΦΗ' : 'ΠΡΟΣΩΠΙΚΗ ΚΑΤΑΓΡΑΦΗ'}
          </p>
        </div>
        <div className="min-w-0 space-y-2">
          <p className="text-xs leading-relaxed text-[#94a3b8]">
            {value
              ? 'Η καταχώρηση θα συμπεριληφθεί στα επίσημα στοιχεία του συλλόγου.'
              : 'Αποθηκεύεται μόνο στο προσωπικό σας αρχείο.'}
          </p>
          {value && (
            <p className="text-xs font-semibold uppercase leading-snug tracking-[0.5px] text-[rgba(0,69,62,0.7)]">
              ΟΡΙΣΜΕΝΑ ΣΤΟΙΧΕΙΑ ΑΠΑΙΤΟΥΝΤΑΙ ΜΟΝΟ ΓΙΑ ΕΠΙΣΗΜΗ ΚΑΤΑΓΡΑΦΗ.
            </p>
          )}
        </div>
      </button>
    </div>
  )
}

/**
 * Static personal-only status card shown for users with no club membership.
 *
 * Intentionally has NO toggle — it must not look interactive.
 */
export function SidePanelPersonalOnly() {
  return (
    <div className="rounded-xl border border-[rgba(0,69,62,0.1)] bg-[rgba(0,69,62,0.05)] p-5">
      <p className="mb-3 text-xs font-extrabold uppercase tracking-[1.4px] text-[#64748b]">
        ΤΥΠΟΣ ΚΑΤΑΓΡΑΦΗΣ
      </p>
      <div className="space-y-2">
        <span className="inline-block rounded-full bg-[rgba(0,69,62,0.12)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.8px] text-[#00453e]">
          ΠΡΟΣΩΠΙΚΗ ΚΑΤΑΓΡΑΦΗ
        </span>
        <p className="text-sm text-[#475569]">
          Δεν έχετε δηλώσει σύλλογο, επομένως η δράση θα αποθηκευτεί στο προσωπικό σας αρχείο.
        </p>
        <p className="text-xs text-[rgba(0,69,62,0.7)]">
          Μπορείτε να δηλώσετε σύλλογο από το προφίλ σας.
        </p>
      </div>
    </div>
  )
}

/**
 * Read-only record-type status shown in the sticky side panel of edit forms.
 * The type cannot be changed during editing.
 */
export function SidePanelRecordTypeStatus({ isOfficial }: { isOfficial: boolean }) {
  return (
    <div className="rounded-xl border border-[rgba(0,69,62,0.1)] bg-[rgba(0,69,62,0.05)] p-5">
      <p className="mb-3 text-xs font-extrabold uppercase tracking-[1.4px] text-[#64748b]">
        ΤΥΠΟΣ ΚΑΤΑΓΡΑΦΗΣ
      </p>
      <div className="space-y-2">
        <span
          className={[
            'inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.8px]',
            isOfficial ? 'bg-[#d1fae5] text-[#047857]' : 'bg-[#f1f5f9] text-[#64748b]',
          ].join(' ')}
        >
          {isOfficial ? 'ΕΠΙΣΗΜΗ ΚΑΤΑΓΡΑΦΗ' : 'ΠΡΟΣΩΠΙΚΗ ΚΑΤΑΓΡΑΦΗ'}
        </span>
        <p className="text-xs text-[#94a3b8]">Ο τύπος καταγραφής δεν αλλάζει κατά την επεξεργασία.</p>
      </div>
    </div>
  )
}
