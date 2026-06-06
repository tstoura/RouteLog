import { useEffect, useState } from 'react'
import { AppPageHeading } from '../../components/layout/AppPageHeading.tsx'
import { Card } from '../../components/ui/Card.tsx'
import { Button } from '../../components/ui/Button.tsx'
import { ExportDataModal } from '../../components/admin/ExportDataModal.tsx'
import { getClubActivities, getClubMembers } from '../../api/auth.ts'
import type { AdminActivityItem, ClubMember } from '../../api/auth.ts'
import { formatAdminDateDisplay } from '../../lib/formatAdminDate.ts'
import { useAdminClub } from '../../admin/AdminClubContext.tsx'

function OfficialBadge() {
  return (
    <span className="inline-flex rounded-full bg-[#d1fae5] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#047857]">
      Επίσημη
    </span>
  )
}

function categoryLabel(cat: string): string {
  if (cat === 'hiking') return 'Ορειβασία'
  if (cat === 'climbing') return 'Αναρρίχηση'
  if (cat === 'expedition') return 'Αποστολή'
  return cat
}

function activityLocation(item: AdminActivityItem): string {
  if (item.hikingDetail) return item.hikingDetail.mountain || '—'
  if (item.climbingDetail) {
    const parts = [item.climbingDetail.routeName, item.climbingDetail.mountainOrArea].filter(Boolean)
    return parts.join(' — ') || '—'
  }
  if (item.expeditionDetail) {
    const parts = [item.expeditionDetail.mountain, item.expeditionDetail.country].filter(Boolean)
    return parts.join(', ') || '—'
  }
  return '—'
}

function activityUserName(item: AdminActivityItem): string {
  const { firstName, lastName, email } = item.user
  const full = [firstName, lastName].filter(Boolean).join(' ')
  return full || email
}

export function AdminDashboardPage() {
  const { selectedClubId } = useAdminClub()
  const [exportOpen, setExportOpen] = useState(false)
  const [exportModalKey, setExportModalKey] = useState(0)
  const [exportSuccess, setExportSuccess] = useState(false)

  const [activities, setActivities] = useState<AdminActivityItem[]>([])
  const [members, setMembers] = useState<ClubMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedClubId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    Promise.all([getClubActivities(selectedClubId), getClubMembers(selectedClubId)])
      .then(([acts, mems]) => {
        setActivities(acts)
        setMembers(mems)
      })
      .catch(() => setError('Σφάλμα κατά τη φόρτωση δεδομένων. Δοκιμάστε ξανά.'))
      .finally(() => setLoading(false))
  }, [selectedClubId])

  const openExportModal = () => {
    setExportModalKey((k) => k + 1)
    setExportOpen(true)
  }

  const handleExportDone = () => {
    setExportSuccess(true)
    window.setTimeout(() => setExportSuccess(false), 6000)
  }

  if (!selectedClubId) {
    return (
      <div className="space-y-8">
        <AppPageHeading
          title="Πίνακας Διαχείρισης"
          description="Διαχείριση μελών και επίσημων δράσεων συλλόγου"
        />
        <Card className="p-6 text-center text-sm text-[#475569]">
          <p className="text-base font-semibold text-[#022c22]">Επιλέξτε σύλλογο</p>
          <p className="mt-1 text-[#64748b]">
            Χρησιμοποιήστε την αναπτυσσόμενη λίστα «Σύλλογος» για να επιλέξετε σύλλογο.
          </p>
        </Card>
      </div>
    )
  }

  const recent = activities.slice(0, 6)

  return (
    <div className="space-y-8">
      {exportSuccess ? (
        <div
          role="status"
          className="rounded-xl border border-[#bbf7d0] bg-[#ecfdf5] px-4 py-3 text-sm font-semibold text-[#065f46] shadow-sm"
        >
          Η εξαγωγή ολοκληρώθηκε επιτυχώς
        </div>
      ) : null}

      <AppPageHeading
        title="Πίνακας Διαχείρισης"
        description="Διαχείριση μελών και επίσημων δράσεων συλλόγου"
      />

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5 shadow-[0px_4px_14px_-4px_rgba(0,69,62,0.08)]">
          <p className="text-xs font-bold uppercase tracking-wide text-[#64748b]">Μέλη Συλλόγου</p>
          <p className="mt-2 font-heading text-3xl font-extrabold text-[#00453e]">
            {loading ? '…' : members.length}
          </p>
          <p className="mt-1 text-xs text-[#94a3b8]">Ενεργά προφίλ στο σύστημα</p>
        </Card>
        <Card className="p-5 shadow-[0px_4px_14px_-4px_rgba(0,69,62,0.08)]">
          <p className="text-xs font-bold uppercase tracking-wide text-[#64748b]">Επίσημες Δράσεις</p>
          <p className="mt-2 font-heading text-3xl font-extrabold text-[#00453e]">
            {loading ? '…' : activities.length}
          </p>
          <p className="mt-1 text-xs text-[#94a3b8]">Καταγραφές με επίσημο χαρακτήρα</p>
        </Card>
        <button
          type="button"
          onClick={openExportModal}
          className="rounded-xl border border-[#e8eef0] bg-white p-5 text-left shadow-[0px_4px_14px_-4px_rgba(0,69,62,0.08)] transition hover:border-[#00453e]/25 hover:shadow-md"
        >
          <p className="text-xs font-bold uppercase tracking-wide text-[#64748b]">Εξαγωγή Δεδομένων</p>
          <p className="mt-2 text-sm font-semibold text-[#022c22]">Προς την Ομοσπονδία (ΕΟΟΑ)</p>
          <p className="mt-2 text-xs text-[#94a3b8]">Επιλογή μελών και εξαγωγή δεδομένων σε αρχείο Excel.</p>
        </button>
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-heading text-lg font-bold text-[#022c22]">Πρόσφατες επίσημες δράσεις</h3>
          <Button type="button" className="h-11 w-full bg-[#00453e] sm:w-auto" onClick={openExportModal}>
            Εξαγωγή Δεδομένων (Excel)
          </Button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#eef2f0] bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#e8eef0] bg-[#f8fafc] text-xs font-bold uppercase tracking-wide text-[#64748b]">
                <th className="px-4 py-3">Χρήστης</th>
                <th className="px-4 py-3">Κατηγορία</th>
                <th className="px-4 py-3">Διαδρομή / Τοποθεσία</th>
                <th className="px-4 py-3">Ημερομηνία</th>
                <th className="px-4 py-3">Κατάσταση</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-[#64748b]">
                    Φόρτωση…
                  </td>
                </tr>
              ) : recent.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-[#64748b]">
                    Δεν υπάρχουν επίσημες δράσεις ακόμα.
                  </td>
                </tr>
              ) : (
                recent.map((row) => (
                  <tr key={row.id} className="border-b border-[#f1f5f9] last:border-0">
                    <td className="px-4 py-3 font-medium text-[#022c22]">{activityUserName(row)}</td>
                    <td className="px-4 py-3 text-[#475569]">{categoryLabel(row.category)}</td>
                    <td className="px-4 py-3 text-[#475569]">{activityLocation(row)}</td>
                    <td className="px-4 py-3 text-[#64748b]">{formatAdminDateDisplay(row.date)}</td>
                    <td className="px-4 py-3">
                      <OfficialBadge />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <ExportDataModal
        key={exportModalKey}
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        onConfirmExport={handleExportDone}
      />
    </div>
  )
}
