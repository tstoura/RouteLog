import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '../ui/Button.tsx'
import { exportClubActivities, downloadBlob } from '../../api/export.ts'
import { ApiError } from '../../api/client.ts'

type Props = {
  open: boolean
  onClose: () => void
  /** Called after a successful export so the parent can show a success banner. */
  onConfirmExport: () => void
  /**
   * Club ID for the real export endpoint.
   * TODO: replace with JWT-decoded clubId.
   */
  clubId: string
  /**
   * User ID of the requester (must be club_admin or super_admin).
   * TODO: replace with JWT-decoded userId.
   */
  requesterUserId: string
}

export function ExportDataModal({
  open,
  onClose,
  onConfirmExport,
  clubId,
  requesterUserId,
}: Props) {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState<string>(String(currentYear))
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  if (!open) return null

  const handleExport = async () => {
    const parsedYear = parseInt(year, 10)
    if (!year || isNaN(parsedYear) || parsedYear < 2000 || parsedYear > currentYear + 1) {
      setExportError('Εισαγάγετε έγκυρο έτος (π.χ. 2026).')
      return
    }

    setIsExporting(true)
    setExportError(null)

    try {
      /**
       * TODO: replace requesterUserId with JWT-decoded userId.
       * TODO: replace [requesterUserId] with real multi-user selection
       *       once GET /clubs/:clubId/members endpoint is available.
       */
      const blob = await exportClubActivities(clubId, {
        selectedUserIds: [requesterUserId],
        requesterUserId,
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
        className="relative max-h-[min(90dvh,640px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#e8eef0] bg-white p-6 shadow-[0_25px_50px_-12px_rgba(15,23,42,0.25)] sm:p-8"
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

        {/* User info */}
        <div className="mt-4 rounded-xl border border-[#e8eef0] bg-[#f8fafc] p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-[#64748b]">Μέλη</p>
          <p className="mt-1 text-sm text-[#475569]">
            Εξαγωγή για τον τρέχοντα χρήστη (DEV_USER_ID).
          </p>
          {/* TODO: replace with a multi-user checklist once GET /clubs/:clubId/members is available. */}
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            MVP: εξάγεται μόνο ο τρέχων χρήστης. Η πολλαπλή επιλογή μελών θα υλοποιηθεί
            όταν είναι διαθέσιμο το endpoint λίστας μελών.
          </p>
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
            disabled={isExporting}
          >
            {isExporting ? 'Εξαγωγή...' : 'Εξαγωγή Excel'}
          </Button>
        </div>
      </div>
    </div>
  )
}
