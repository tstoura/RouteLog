import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Link2, MapPin, X } from 'lucide-react'
import { toWholeNumber, toDecimalNumber } from './shared/FormBuildingBlocks.tsx'
import type { ClimbingRouteFormRecord } from '../../types/climbingRouteForm.ts'
import {
  CLIMBING_SCALE_FORM_OPTIONS,
  getGradeOptionsForScale,
  scaleKeyToGreek,
  type ClimbingSelectOption,
} from '../../constants/climbingFormOptions.ts'
import { Button } from '../ui/Button.tsx'
import { Input } from '../ui/Input.tsx'
import { CustomSelect } from '../ui/CustomSelect.tsx'

// ── Styled grade dropdown ──────────────────────────────────────────────────────
// Custom-styled dropdown that visually matches the app. Selection-only — no
// free-text entry. Grade options update when the parent scale changes.

function GradeDropdown({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: ClimbingSelectOption[]
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const displayOptions = useMemo(() => options.filter((o) => o.value !== ''), [options])
  const selectedLabel = options.find((o) => o.value === value)?.label ?? ''

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={[
          'flex h-12 w-full items-center justify-between rounded-lg border px-3 text-sm transition',
          'bg-white ring-[#005f56]',
          open
            ? 'border-[#005f56] ring-2'
            : 'border-[#e2e8e0] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] hover:border-[#cbd5e1]',
          value ? 'text-[#1a1c1e]' : 'text-[#94a3b8]',
        ].join(' ')}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{selectedLabel || 'Επιλογή βαθμού...'}</span>
        <ChevronDown
          className={`size-4 shrink-0 text-[#64748b] transition-transform ${open ? 'rotate-180' : ''}`}
          strokeWidth={2}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 max-h-52 overflow-auto rounded-xl border border-[#e8eef0] bg-white py-1 shadow-[0_8px_24px_-4px_rgba(15,23,42,0.15)]"
        >
          {displayOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={opt.value === value}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(opt.value)
                setOpen(false)
              }}
              className={[
                'w-full px-4 py-2.5 text-left text-sm transition',
                opt.value === value
                  ? 'bg-[#f0fdf4] font-semibold text-[#00453e]'
                  : 'text-[#1a1c1e] hover:bg-[#f0fdf4] hover:text-[#00453e]',
              ].join(' ')}
            >
              {opt.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

type Props = {
  initial: Partial<ClimbingRouteFormRecord>
  onClose: () => void
  onSave: (route: ClimbingRouteFormRecord) => void
  /** When false (e.g. opened from `/app/routes`), hides the linked-to-activity badge. Default: true. */
  showLinkedActivityBadge?: boolean
}

function FieldLabelReq({ children }: { children: string }) {
  return (
    <span className="text-sm font-bold text-[#00453e]">
      {children} <span className="text-red-600">*</span>
    </span>
  )
}

export function CreateRouteModal({ initial, onClose, onSave, showLinkedActivityBadge = true }: Props) {
  const [name, setName] = useState(() => initial.name ?? '')
  const [field, setField] = useState(() => initial.field ?? '')
  const [mountain, setMountain] = useState(() => initial.mountainOrArea ?? '')
  // Default scale is 'french' — most routes in the combobox are sport climbing grades.
  const [scaleKey, setScaleKey] = useState<string>(() => {
    if (initial.difficultyScale === 'UIAA') return 'uiaa'
    if (initial.difficultyScale === 'Alpine') return 'alpine'
    if (initial.difficultyScale === 'Γαλλική') return 'french'
    return 'french'
  })
  const [grade, setGrade] = useState(() => initial.difficultyGrade ?? '')
  const [altitude, setAltitude] = useState(() => initial.altitude ?? '')
  const [length, setLength] = useState(() => initial.routeLength ?? '')

  // Grade options update when scale changes.
  const gradeOptions = useMemo(() => getGradeOptionsForScale(scaleKey).filter((o) => o.value !== ''), [scaleKey])

  const handleScaleChange = (newScale: string) => {
    setScaleKey(newScale)
    setGrade('') // reset grade — scales have non-overlapping grade lists
  }

  const handleSave = () => {
    if (!name.trim() || !field.trim() || !mountain.trim() || !scaleKey || !grade.trim()) return
    const route: ClimbingRouteFormRecord = {
      id: `temp-${Date.now()}`,
      name: name.trim(),
      field: field.trim(),
      mountainOrArea: mountain.trim(),
      difficultyScale: scaleKeyToGreek(scaleKey),
      difficultyGrade: grade.trim(),
      altitude: altitude.trim() || undefined,
      routeLength: length.trim() || undefined,
    }
    onSave(route)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        aria-label="Κλείσιμο διαλόγου"
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-route-title"
        className="relative max-h-[min(90dvh,720px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#e8eef0] bg-white p-6 shadow-[0_25px_50px_-12px_rgba(15,23,42,0.25)] sm:p-8"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="new-route-title" className="font-heading text-xl font-bold text-[#00453e] sm:text-2xl">
              Νέα Διαδρομή
            </h2>
            <p className="mt-2 text-sm text-[#64748b]">Πρόσθεσε μια νέα διαδρομή που δεν υπάρχει στη βάση.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#64748b] transition hover:bg-[#f1f5f9] hover:text-[#022c22]"
            aria-label="Κλείσιμο"
          >
            <X className="size-6" strokeWidth={2} />
          </button>
        </div>

        {showLinkedActivityBadge ? (
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#e0f2f1] px-3 py-1.5 text-xs font-semibold text-[#0f766e]">
            <Link2 className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
            Συνδέεται με την καταγραφή σου
          </div>
        ) : null}

        <div className={showLinkedActivityBadge ? 'mt-6 space-y-5' : 'mt-5 space-y-5'}>
          <label className="block space-y-2">
            <FieldLabelReq>Όνομα Διαδρομής</FieldLabelReq>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Όνομα Διαδρομής" className="h-12" required />
            <p className="text-xs text-[#94a3b8]">Χρησιμοποίησε την επίσημη ονομασία της διαδρομής.</p>
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="space-y-2">
              <FieldLabelReq>Περιοχή / Βουνό</FieldLabelReq>
              <Input value={mountain} onChange={(e) => setMountain(e.target.value)} placeholder="Βουνό/Περιοχή" className="h-12" required />
              <p className="text-xs text-[#94a3b8]">Η ευρύτερη περιοχή ή το βουνό όπου βρίσκεται η διαδρομή.</p>
            </label>
            <label className="space-y-2">
              <FieldLabelReq>Πεδίο</FieldLabelReq>
              <div className="relative">
                <Input value={field} onChange={(e) => setField(e.target.value)} placeholder="Πεδίο" className="h-12 pr-10" required />
                <MapPin className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-[#94a3b8]" aria-hidden />
              </div>
              <p className="text-xs text-[#94a3b8]">Το αναρριχητικό πεδίο στο οποίο βρίσκεται η διαδρομή.</p>
            </label>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="space-y-2">
              <FieldLabelReq>Κλίμακα</FieldLabelReq>
              {/* Uses CLIMBING_SCALE_FORM_OPTIONS: French | UIAA | Alpine (no empty placeholder). */}
              <CustomSelect
                value={scaleKey}
                onChange={handleScaleChange}
                options={CLIMBING_SCALE_FORM_OPTIONS}
                heightClass="h-12"
              />
            </label>
            <div className="space-y-2">
              <FieldLabelReq>Βαθμός Δυσκολίας</FieldLabelReq>
              {/* Custom styled dropdown — selection only, no free text. Updates when scale changes. */}
              <GradeDropdown value={grade} onChange={setGrade} options={gradeOptions} />
              <p className="text-xs text-[#94a3b8]">Επίλεξε τον βαθμό δυσκολίας σύμφωνα με την αντίστοιχη κλίμακα.</p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-bold text-[#00453e]">Τελικό Υψόμετρο (m)</span>
              <Input
                type="text"
                inputMode="numeric"
                value={altitude}
                onChange={(e) => setAltitude(toWholeNumber(e.target.value))}
                placeholder="Υψόμετρο αναρρίχησης (m)"
                className="h-12 placeholder:text-xs"
              />
              <p className="text-xs text-[#94a3b8]">Το υψόμετρο στο οποίο καταλήγει η αναρρίχηση.</p>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-bold text-[#00453e]">Ανάπτυγμα Αναρρίχησης</span>
              <Input
                type="text"
                inputMode="decimal"
                value={length}
                onChange={(e) => setLength(toDecimalNumber(e.target.value))}
                placeholder="Συνολικό μήκος αναρρίχησης (m)"
                className="h-12 placeholder:text-xs"
              />
              <p className="text-xs text-[#94a3b8]">Το συνολικό μήκος της αναρρίχησης.</p>
            </label>
          </div>
        </div>

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" className="h-12 min-w-[120px] border-[#cfe6f2] bg-[#e8f4fc] text-[#0f3d36]" onClick={onClose}>
            Ακύρωση
          </Button>
          <Button type="button" className="h-12 min-w-[180px] bg-[#00453e]" onClick={handleSave}>
            Αποθήκευση Διαδρομής
          </Button>
        </div>
      </div>
    </div>
  )
}
