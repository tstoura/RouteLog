import { useState } from 'react'
import { X } from 'lucide-react'
import type { MockAdminUser } from '../../types/adminMock.ts'
import { Button } from '../ui/Button.tsx'

type Props = {
  open: boolean
  users: MockAdminUser[]
  onClose: () => void
  /** Called with selected user ids (mock export). */
  onConfirmExport: (selectedUserIds: string[]) => void
}

function buildAllSelected(users: MockAdminUser[]): Record<string, boolean> {
  return Object.fromEntries(users.map((u) => [u.id, true]))
}

export function ExportDataModal({ open, users, onClose, onConfirmExport }: Props) {
  const [selected, setSelected] = useState(() => buildAllSelected(users))

  if (!open) return null

  const toggle = (id: string) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const selectedIds = Object.entries(selected)
    .filter(([, v]) => v)
    .map(([k]) => k)

  const handleExport = () => {
    onConfirmExport(selectedIds)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="presentation">
      <button type="button" aria-label="Κλείσιμο" className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
        className="relative max-h-[min(90dvh,640px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#e8eef0] bg-white p-6 shadow-[0_25px_50px_-12px_rgba(15,23,42,0.25)] sm:p-8"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="export-modal-title" className="font-heading text-xl font-bold text-[#00453e] sm:text-2xl">
              Εξαγωγή Δεδομένων
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#64748b]">
              Επιλέξτε ποια μέλη θα συμπεριληφθούν στην εξαγωγή προς την ομοσπονδία.
            </p>
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

        <ul className="mt-6 max-h-64 space-y-2 overflow-y-auto rounded-xl border border-[#e8eef0] bg-[#f8fafc] p-3">
          {users.map((u) => (
            <li key={u.id}>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2.5 transition hover:bg-white">
                <input
                  type="checkbox"
                  className="mt-1 size-4 shrink-0 rounded border-[#cbd5e1] text-[#00453e] focus:ring-[#00453e]"
                  checked={Boolean(selected[u.id])}
                  onChange={() => toggle(u.id)}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-[#022c22]">{u.name}</span>
                  <span className="block text-xs text-[#64748b]">{u.email}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>

        <p className="mt-4 text-xs leading-relaxed text-[#64748b]">
          Οι δράσεις των μη επιλεγμένων χρηστών δεν θα συμπεριληφθούν στο αρχείο.
        </p>

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" className="h-11 min-w-[120px]" onClick={onClose}>
            Ακύρωση
          </Button>
          <Button type="button" className="h-11 min-w-[160px] bg-[#00453e]" onClick={handleExport}>
            Εξαγωγή Excel
          </Button>
        </div>
      </div>
    </div>
  )
}
