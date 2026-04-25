import { useMemo, useState } from 'react'
import { AppPageHeading } from '../../components/layout/AppPageHeading.tsx'
import { Card } from '../../components/ui/Card.tsx'
import { Button } from '../../components/ui/Button.tsx'
import { ExportDataModal } from '../../components/admin/ExportDataModal.tsx'
import { mockAdminUsers } from '../../data/mockAdminUsers.ts'
import { mockOfficialActivities } from '../../data/mockOfficialActivities.ts'
import { formatAdminDateDisplay } from '../../lib/formatAdminDate.ts'

function OfficialBadge() {
  return (
    <span className="inline-flex rounded-full bg-[#d1fae5] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#047857]">
      Επίσημη
    </span>
  )
}

export function AdminDashboardPage() {
  const [exportOpen, setExportOpen] = useState(false)
  const [exportModalKey, setExportModalKey] = useState(0)
  const [exportSuccess, setExportSuccess] = useState(false)

  const openExportModal = () => {
    setExportModalKey((k) => k + 1)
    setExportOpen(true)
  }

  const memberCount = mockAdminUsers.length
  const officialCount = mockOfficialActivities.length

  const recent = useMemo(
    () => [...mockOfficialActivities].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6),
    [],
  )

  const handleExportDone = () => {
    setExportSuccess(true)
    window.setTimeout(() => setExportSuccess(false), 6000)
  }

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

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5 shadow-[0px_4px_14px_-4px_rgba(0,69,62,0.08)]">
          <p className="text-xs font-bold uppercase tracking-wide text-[#64748b]">Μέλη Συλλόγου</p>
          <p className="mt-2 font-heading text-3xl font-extrabold text-[#00453e]">{memberCount}</p>
          <p className="mt-1 text-xs text-[#94a3b8]">Ενεργά προφίλ στο σύστημα</p>
        </Card>
        <Card className="p-5 shadow-[0px_4px_14px_-4px_rgba(0,69,62,0.08)]">
          <p className="text-xs font-bold uppercase tracking-wide text-[#64748b]">Επίσημες Δράσεις</p>
          <p className="mt-2 font-heading text-3xl font-extrabold text-[#00453e]">{officialCount}</p>
          <p className="mt-1 text-xs text-[#94a3b8]">Καταγραφές με επίσημο χαρακτήρα</p>
        </Card>
        <button
          type="button"
          onClick={openExportModal}
          className="rounded-xl border border-[#e8eef0] bg-white p-5 text-left shadow-[0px_4px_14px_-4px_rgba(0,69,62,0.08)] transition hover:border-[#00453e]/25 hover:shadow-md"
        >
          <p className="text-xs font-bold uppercase tracking-wide text-[#64748b]">Εξαγωγή Δεδομένων</p>
          <p className="mt-2 text-sm font-semibold text-[#022c22]">Προς ομοσπονδία (Excel)</p>
          <p className="mt-2 text-xs text-[#94a3b8]">Επιλογή μελών και εξαγωγή — δοκιμαστική λειτουργία</p>
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
              {recent.map((row) => (
                <tr key={row.id} className="border-b border-[#f1f5f9] last:border-0">
                  <td className="px-4 py-3 font-medium text-[#022c22]">{row.userName}</td>
                  <td className="px-4 py-3 text-[#475569]">{row.category}</td>
                  <td className="px-4 py-3 text-[#475569]">{row.routeOrLocation}</td>
                  <td className="px-4 py-3 text-[#64748b]">{formatAdminDateDisplay(row.date)}</td>
                  <td className="px-4 py-3">
                    <OfficialBadge />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <ExportDataModal
        key={exportModalKey}
        open={exportOpen}
        users={mockAdminUsers}
        onClose={() => setExportOpen(false)}
        onConfirmExport={() => {
          handleExportDone()
        }}
      />
    </div>
  )
}
