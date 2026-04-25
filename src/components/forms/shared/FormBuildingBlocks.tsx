import type { ComponentProps, ReactNode } from 'react'
import { useState } from 'react'
import { BarChart3, FileText, Info, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { FormSection } from '../../ui/FormSection.tsx'
import { Select } from '../../ui/Select.tsx'
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
  return <p className="text-xs leading-[17.5px] text-[#94a3b8]">{children}</p>
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

type DateInputProps = Omit<ComponentProps<typeof Input>, 'className'> & { className?: string }

export function DateInputWithCalendar({ className = '', ...rest }: DateInputProps) {
  return (
    <div className="relative">
      <Input {...rest} className={`h-14 pr-12 text-base shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] ${className}`} />
      <span
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b]"
        aria-hidden
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
          <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </span>
    </div>
  )
}

/** Summer / winter season radios — shared by climbing and expedition activity forms. */
export const ACTIVITY_SEASON_RADIO_OPTIONS: { value: string; label: string }[] = [
  { value: 'θερινή', label: 'Θερινή' },
  { value: 'χειμερινή', label: 'Χειμερινή' },
]

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
  options,
  value,
  onChange,
  selectClassName = '',
  disabled,
}: {
  /** If omitted, only the select is shown (custom label rendered outside). */
  label?: string
  options: Option[]
  value: string
  onChange: (value: string) => void
  selectClassName?: string
  disabled?: boolean
}) {
  return (
    <label className="flex flex-col gap-3">
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <Select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`h-14 text-base shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] disabled:cursor-not-allowed disabled:border-[#e2e8e0] disabled:bg-[#f1f5f9] disabled:text-[#334155] disabled:opacity-100 ${selectClassName}`}
      >
        {options.map((opt) => (
          <option key={`${opt.value}-${opt.label}`} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
    </label>
  )
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

export function OfficialParticipationSection() {
  const [enabled, setEnabled] = useState(true)
  return (
    <section className="rounded-xl border border-[rgba(0,69,62,0.1)] bg-[rgba(0,69,62,0.05)] p-6">
      <div className="flex gap-4">
        <button
          type="button"
          aria-pressed={enabled}
          aria-label={enabled ? 'Απενεργοποίηση επίσημης καταγραφής' : 'Ενεργοποίηση επίσημης καταγραφής'}
          onClick={() => setEnabled((v) => !v)}
          className={[
            'relative mt-1 h-6 w-12 shrink-0 rounded-full transition-colors',
            enabled ? 'bg-[#00453e]' : 'bg-[#cbd5e1]',
          ].join(' ')}
        >
          <span
            className={[
              'absolute left-1 top-1 size-4 rounded-full bg-white shadow-sm transition-transform',
              enabled ? 'translate-x-6' : 'translate-x-0',
            ].join(' ')}
          />
        </button>
        <div className="space-y-1">
          <p className="text-sm font-semibold uppercase tracking-[0.35px] text-[#1a1c1e]">
            ΣΥΜΜΕΤΟΧΗ ΣΤΗΝ ΕΠΙΣΗΜΗ ΚΑΤΑΓΡΑΦΗ
          </p>
          <p className="text-sm italic text-[#475569]">
            Η καταχώρηση θα συμπεριληφθεί στα επίσημα στοιχεία του συλλόγου.
          </p>
          <p className="text-xs font-semibold uppercase tracking-[1.4px] text-[rgba(0,69,62,0.7)]">
            ΟΡΙΣΜΕΝΑ ΣΤΟΙΧΕΙΑ ΑΠΑΙΤΟΥΝΤΑΙ ΜΟΝΟ ΓΙΑ ΕΠΙΣΗΜΗ ΚΑΤΑΓΡΑΦΗ.
          </p>
        </div>
      </div>
    </section>
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
}: {
  title?: string
  value?: string
  description: string
  icon?: string
}) {
  return (
    <aside className="hidden lg:col-span-4 lg:block">
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
