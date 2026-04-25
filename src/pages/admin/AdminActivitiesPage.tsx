import { useMemo, useState } from 'react'
import { AppPageHeading } from '../../components/layout/AppPageHeading.tsx'
import { Card } from '../../components/ui/Card.tsx'
import { Button } from '../../components/ui/Button.tsx'
import { Select } from '../../components/ui/Select.tsx'
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

const yearsFromData = (): string[] => {
  const ys = new Set<string>()
  for (const a of mockOfficialActivities) {
    ys.add(a.date.slice(0, 4))
  }
  return [...ys].sort((a, b) => b.localeCompare(a))
}

export function AdminActivitiesPage() {
  const [year, setYear] = useState<string>('all')
  const [month, setMonth] = useState<string>('all')
  const [exportOpen, setExportOpen] = useState(false)
  const [exportModalKey, setExportModalKey] = useState(0)
  const [exportSuccess, setExportSuccess] = useState(false)

  const openExportModal = () => {
    setExportModalKey((k) => k + 1)
    setExportOpen(true)
  }

  const yearOptions = useMemo(() => ['all', ...yearsFromData()], [])

  const filtered = useMemo(() => {
    let list = [...mockOfficialActivities]
    if (year !== 'all') list = list.filter((a) => a.date.startsWith(year))
    if (month !== 'all') {
      const m = month.padStart(2, '0')
      list = list.filter((a) => a.date.slice(5, 7) === m)
    }
    return list.sort((a, b) => b.date.localeCompare(a.date))
  }, [year, month])

  const handleExportDone = () => {
    setExportSuccess(true)
    window.setTimeout(() => setExportSuccess(false), 6000)
  }

  return (
    <div className="space-y-6">
      {exportSuccess ? (
        <div
          role="status"
          className="rounded-xl border border-[#bbf7d0] bg-[#ecfdf5] px-4 py-3 text-sm font-semibold text-[#065f46] shadow-sm"
        >
          Η εξαγωγή ολοκληρώθηκε επιτυχώς
        </div>
      ) : null}

      <AppPageHeading
        title="Δράσεις Μελών"
        description="Επίσημες καταγραφές — φιλτράρισμα στο πρόγραμμα περιήγησης"
      />

      <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="space-y-2 sm:min-w-[160px]">
          <span className="text-xs font-bold uppercase tracking-wide text-[#64748b]">Έτος</span>
          <Select value={year} onChange={(e) => setYear(e.target.value)} className="h-11 text-sm">
            <option value="all">Όλα τα έτη</option>
            {yearOptions
              .filter((y) => y !== 'all')
              .map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
          </Select>
        </label>
        <label className="space-y-2 sm:min-w-[160px]">
          <span className="text-xs font-bold uppercase tracking-wide text-[#64748b]">Μήνας</span>
          <Select value={month} onChange={(e) => setMonth(e.target.value)} className="h-11 text-sm">
            <option value="all">Όλοι οι μήνες</option>
            <option value="1">Ιανουάριος</option>
            <option value="2">Φεβρουάριος</option>
            <option value="3">Μάρτιος</option>
            <option value="4">Απρίλιος</option>
            <option value="5">Μάιος</option>
            <option value="6">Ιούνιος</option>
            <option value="7">Ιούλιος</option>
            <option value="8">Αύγουστος</option>
            <option value="9">Σεπτέμβριος</option>
            <option value="10">Οκτώβριος</option>
            <option value="11">Νοέμβριος</option>
            <option value="12">Δεκέμβριος</option>
          </Select>
        </label>
        <Button type="button" variant="secondary" className="h-11 sm:ml-auto" onClick={() => { setYear('all'); setMonth('all') }}>
          Όλες
        </Button>
      </Card>

      <div className="flex justify-end">
        <Button type="button" className="h-11 bg-[#00453e]" onClick={openExportModal}>
          Εξαγωγή Δεδομένων (Excel)
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#eef2f0] bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
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
            {filtered.map((row) => (
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
        {filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-[#64748b]">Δεν υπάρχουν δράσεις για τα επιλεγμένα φίλτρα.</p>
        ) : null}
      </div>

      <ExportDataModal
        key={exportModalKey}
        open={exportOpen}
        users={mockAdminUsers}
        onClose={() => setExportOpen(false)}
        onConfirmExport={() => handleExportDone()}
      />
    </div>
  )
}
