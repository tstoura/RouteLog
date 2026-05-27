import { useEffect, useMemo, useState } from 'react'
import { AppPageHeading } from '../../components/layout/AppPageHeading.tsx'
import { Card } from '../../components/ui/Card.tsx'
import { Button } from '../../components/ui/Button.tsx'
import { Select } from '../../components/ui/Select.tsx'
import { ExportDataModal } from '../../components/admin/ExportDataModal.tsx'
import { useAuth } from '../../auth/AuthContext.tsx'
import { getClubActivities } from '../../api/auth.ts'
import type { AdminActivityItem } from '../../api/auth.ts'
import { formatAdminDateDisplay } from '../../lib/formatAdminDate.ts'

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

export function AdminActivitiesPage() {
  const { user } = useAuth()
  const [year, setYear] = useState<string>('all')
  const [month, setMonth] = useState<string>('all')
  const [exportOpen, setExportOpen] = useState(false)
  const [exportModalKey, setExportModalKey] = useState(0)
  const [exportSuccess, setExportSuccess] = useState(false)

  const [activities, setActivities] = useState<AdminActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const adminClubId = user?.memberships.find((m) => m.role === 'club_admin')?.clubId ?? null
  const isSuperAdminWithoutAdminClub =
    user?.systemRole === 'super_admin' && adminClubId === null

  useEffect(() => {
    if (!adminClubId) return
    setLoading(true)
    setError(null)
    getClubActivities(adminClubId)
      .then(setActivities)
      .catch(() => setError('Σφάλμα κατά τη φόρτωση δράσεων. Δοκιμάστε ξανά.'))
      .finally(() => setLoading(false))
  }, [adminClubId])

  const openExportModal = () => {
    setExportModalKey((k) => k + 1)
    setExportOpen(true)
  }

  const handleExportDone = () => {
    setExportSuccess(true)
    window.setTimeout(() => setExportSuccess(false), 6000)
  }

  // Build year options from actual data.
  const yearOptions = useMemo(() => {
    const ys = new Set<string>()
    for (const a of activities) ys.add(a.date.slice(0, 4))
    return ['all', ...[...ys].sort((a, b) => b.localeCompare(a))]
  }, [activities])

  // Client-side filter by year and month.
  const filtered = useMemo(() => {
    let list = activities
    if (year !== 'all') list = list.filter((a) => a.date.slice(0, 4) === year)
    if (month !== 'all') {
      const m = month.padStart(2, '0')
      list = list.filter((a) => a.date.slice(5, 7) === m)
    }
    return list
  }, [activities, year, month])

  if (isSuperAdminWithoutAdminClub) {
    return (
      <div className="space-y-6">
        <AppPageHeading
          title="Δράσεις Μελών"
          description="Επίσημες καταγραφές"
        />
        <Card className="p-6 text-sm text-[#475569]">
          Η επιλογή συλλόγου για super admin θα υλοποιηθεί σε επόμενη φάση.
        </Card>
      </div>
    )
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

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

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
        <Button
          type="button"
          variant="secondary"
          className="h-11 sm:ml-auto"
          onClick={() => { setYear('all'); setMonth('all') }}
        >
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
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-[#64748b]">
                  Φόρτωση…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-[#64748b]">
                  Δεν υπάρχουν δράσεις για τα επιλεγμένα φίλτρα.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
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

      <ExportDataModal
        key={exportModalKey}
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        onConfirmExport={handleExportDone}
      />
    </div>
  )
}
