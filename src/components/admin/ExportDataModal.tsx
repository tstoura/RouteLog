import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '../ui/Button.tsx'
import { exportClubActivities, downloadBlob } from '../../api/export.ts'
import { ApiError } from '../../api/client.ts'
import { useAuth } from '../../auth/AuthContext.tsx'
import { getClubMembers } from '../../api/auth.ts'
import type { ClubMember } from '../../api/auth.ts'
import { useAdminClub } from '../../admin/AdminClubContext.tsx'

type Props = {
  open: boolean
  onClose: () => void
  /** Called after a successful export so the parent can show a success banner. */
  onConfirmExport: () => void
}

export function ExportDataModal({ open, onClose, onConfirmExport }: Props) {
  const { user } = useAuth()
  // Resolved club ID from AdminClubContext:
  //   - club_admin: their club_admin membership clubId (automatic)
  //   - super_admin: the club they selected from the dropdown
  const { selectedClubId: resolvedClubId } = useAdminClub()
  const currentYear = new Date().getFullYear()

  const [year, setYear] = useState<string>(String(currentYear))
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  // Member list state
  const [members, setMembers] = useState<ClubMember[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [membersLoading, setMembersLoading] = useState(false)
  const [membersError, setMembersError] = useState<string | null>(null)

  // Fetch members when the modal opens and we have a club.
  useEffect(() => {
    if (!open || !resolvedClubId) return

    setMembersLoading(true)
    setMembersError(null)

    getClubMembers(resolvedClubId)
      .then((result) => {
        const list = Array.isArray(result) ? result : []
        setMembers(list)
        // Default: all members selected.
        setSelectedIds(new Set(list.map((m) => m.userId)))
      })
      .catch((err) => {
        const msg = err instanceof ApiError ? err.message : 'Αδυναμία φόρτωσης λίστας μελών.'
        setMembersError(msg)
        setMembers([])
        setSelectedIds(new Set())
      })
      .finally(() => setMembersLoading(false))
  }, [open, resolvedClubId])

  if (!open) return null

  const toggleMember = (userId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  const toggleAll = () => {
    if (selectedIds.size === members.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(members.map((m) => m.userId)))
    }
  }

  const handleExport = async () => {
    if (!user) {
      setExportError('Δεν είστε συνδεδεμένος.')
      return
    }
    if (!resolvedClubId) {
      setExportError('Επιλέξτε σύλλογο από την αναπτυσσόμενη λίστα «Σύλλογος» πριν την εξαγωγή.')
      return
    }
    if (membersError) {
      setExportError('Δεν μπόρεσε να φορτωθεί η λίστα μελών. Κλείστε και ξανανοίξτε.')
      return
    }
    const parsedYear = parseInt(year, 10)
    if (!year || isNaN(parsedYear) || parsedYear < 2000 || parsedYear > currentYear + 1) {
      setExportError('Εισαγάγετε έγκυρο έτος (π.χ. 2026).')
      return
    }
    if (selectedIds.size === 0) {
      setExportError('Επιλέξτε τουλάχιστον ένα μέλος για εξαγωγή.')
      return
    }

    setIsExporting(true)
    setExportError(null)

    try {
      const blob = await exportClubActivities(resolvedClubId, {
        selectedUserIds: Array.from(selectedIds),
        year: parsedYear,
      })
      downloadBlob(blob, `routelog-export-${parsedYear}.xlsx`)
      onConfirmExport()
      onClose()
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setExportError(
          'Δεν έχετε δικαίωμα εξαγωγής. Η λειτουργία είναι διαθέσιμη μόνο σε διαχειριστές συλλόγου ή σούπερ-διαχειριστές.',
        )
      } else {
        const msg = err instanceof Error ? err.message : 'Σφάλμα κατά την εξαγωγή.'
        setExportError(msg)
      }
    } finally {
      setIsExporting(false)
    }
  }

  const allSelected = members.length > 0 && selectedIds.size === members.length
  const someSelected = selectedIds.size > 0 && !allSelected

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        aria-label="Κλείσιμο"
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
        className="relative max-h-[min(90dvh,680px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#e8eef0] bg-white p-6 shadow-[0_25px_50px_-12px_rgba(15,23,42,0.25)] sm:p-8"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="export-modal-title" className="font-heading text-xl font-bold text-[#00453e] sm:text-2xl">
              Εξαγωγή Δεδομένων
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#64748b]">
              Εξαγωγή επίσημων δραστηριοτήτων προς την ομοσπονδία σε μορφή Excel.
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

        {/* Year selector */}
        <div className="mt-6 space-y-2">
          <label htmlFor="export-year" className="block text-xs font-bold uppercase tracking-wide text-[#64748b]">
            Έτος
          </label>
          <input
            id="export-year"
            type="number"
            min={2000}
            max={currentYear + 1}
            step={1}
            value={year}
            onChange={(e) => {
              setYear(e.target.value)
              setExportError(null)
            }}
            className="h-11 w-full rounded-lg border border-[#e8eef0] bg-white px-3 text-sm text-[#1a1c1e] shadow-sm focus:border-[#00453e] focus:outline-none focus:ring-1 focus:ring-[#00453e]"
            placeholder="π.χ. 2026"
          />
        </div>

        {/* Member selection */}
        <div className="mt-5 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-[#64748b]">Μέλη</p>
          <p className="text-xs text-[#64748b]">
            Επιλέξτε τα μέλη των οποίων οι επίσημες δράσεις θα συμπεριληφθούν στην εξαγωγή.
          </p>

          {/* No club selected — super_admin must pick one from the sidebar */}
          {!resolvedClubId ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Επιλέξτε σύλλογο από την αναπτυσσόμενη λίστα «Σύλλογος» για να φορτωθούν τα μέλη.
            </p>
          ) : membersLoading ? (
            <p className="py-4 text-center text-sm text-[#94a3b8]">Φόρτωση μελών…</p>
          ) : membersError ? (
            <p className="rounded-xl border border-[#fca5a5] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">
              {membersError}
            </p>
          ) : members.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-4 py-4 text-center text-sm text-[#64748b]">
              Δεν βρέθηκαν μέλη στον σύλλογο.
            </p>
          ) : (
            <div className="rounded-xl border border-[#e8eef0] bg-[#f8fafc]">
              {/* Select-all header */}
              <label className="flex cursor-pointer items-center gap-3 border-b border-[#e8eef0] px-4 py-3 hover:bg-[#f1f5f9]">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected
                  }}
                  onChange={toggleAll}
                  className="size-4 cursor-pointer rounded accent-[#00453e]"
                />
                <span className="text-xs font-bold uppercase tracking-wide text-[#64748b]">
                  {allSelected ? 'Αποεπιλογή όλων' : 'Επιλογή όλων'}
                  {' '}
                  <span className="font-normal normal-case">
                    ({selectedIds.size}/{members.length})
                  </span>
                </span>
              </label>

              {/* Individual members */}
              <ul className="max-h-52 overflow-y-auto">
                {members.map((m) => (
                  <li key={m.userId}>
                    <label className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-[#f1f5f9]">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(m.userId)}
                        onChange={() => toggleMember(m.userId)}
                        className="size-4 cursor-pointer rounded accent-[#00453e]"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#022c22]">
                          {m.firstName} {m.lastName}
                        </p>
                        <p className="truncate text-xs text-[#64748b]">{m.email}</p>
                      </div>
                      {m.role === 'club_admin' ? (
                        <span className="shrink-0 rounded-full bg-[#d1fae5] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#047857]">
                          admin
                        </span>
                      ) : null}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Error message */}
        {exportError ? (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-[#fca5a5] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]"
          >
            {exportError}
          </p>
        ) : null}

        {/* Actions */}
        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            className="h-11 min-w-[120px]"
            onClick={onClose}
            disabled={isExporting}
          >
            Ακύρωση
          </Button>
          <Button
            type="button"
            className="h-11 min-w-[160px] bg-[#00453e]"
            onClick={handleExport}
            disabled={isExporting || membersLoading || !!membersError || !resolvedClubId}
          >
            {isExporting ? 'Εξαγωγή...' : 'Εξαγωγή Excel'}
          </Button>
        </div>
      </div>
    </div>
  )
}
