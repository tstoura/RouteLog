import { useMemo, useState } from 'react'
import { AppPageHeading } from '../../components/layout/AppPageHeading.tsx'
import { mockAdminUsers } from '../../data/mockAdminUsers.ts'

export function AdminMembersPage() {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return mockAdminUsers
    return mockAdminUsers.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    )
  }, [query])

  return (
    <div className="space-y-6">
      <AppPageHeading title="Μέλη Συλλόγου" description="Κατάλογος μελών με στατιστικά δραστηριότητας (mock)" />

      <div>
        <label htmlFor="admin-members-search" className="sr-only">
          Αναζήτηση
        </label>
        <input
          id="admin-members-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Αναζήτηση με όνομα ή email…"
          className="w-full max-w-md rounded-xl border border-[#e2e8e0] bg-white px-4 py-3 text-sm text-[#022c22] shadow-sm outline-none ring-[#005f56] placeholder:text-[#94a3b8] focus:border-[#005f56] focus:ring-2"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#eef2f0] bg-white shadow-sm">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-[#e8eef0] bg-[#f8fafc] text-xs font-bold uppercase tracking-wide text-[#64748b]">
              <th className="px-4 py-3">Όνομα</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3 text-right">Σύνολο Δράσεων</th>
              <th className="px-4 py-3 text-right">Επίσημες Δράσεις</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-b border-[#f1f5f9] last:border-0">
                <td className="px-4 py-3 font-medium text-[#022c22]">{u.name}</td>
                <td className="px-4 py-3 text-[#475569]">{u.email}</td>
                <td className="px-4 py-3 text-right tabular-nums text-[#334155]">{u.totalActivities}</td>
                <td className="px-4 py-3 text-right tabular-nums font-semibold text-[#00453e]">{u.officialActivities}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-[#64748b]">Δεν βρέθηκαν αποτελέσματα.</p>
        ) : null}
      </div>
    </div>
  )
}
