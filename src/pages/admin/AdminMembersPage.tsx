import { useEffect, useMemo, useState } from 'react'
import { AppPageHeading } from '../../components/layout/AppPageHeading.tsx'
import { Card } from '../../components/ui/Card.tsx'
import { useAuth } from '../../auth/AuthContext.tsx'
import { getClubMembers } from '../../api/auth.ts'
import type { ClubMember } from '../../api/auth.ts'

function roleBadge(role: string) {
  const isAdmin = role === 'club_admin'
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
        isAdmin
          ? 'bg-[#dbeafe] text-[#1e40af]'
          : 'bg-[#f1f5f9] text-[#475569]'
      }`}
    >
      {isAdmin ? 'Διαχειριστής' : 'Μέλος'}
    </span>
  )
}

export function AdminMembersPage() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')

  const [members, setMembers] = useState<ClubMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const adminClubId = user?.memberships.find((m) => m.role === 'club_admin')?.clubId ?? null
  const isSuperAdminWithoutAdminClub =
    user?.systemRole === 'super_admin' && adminClubId === null

  useEffect(() => {
    if (!adminClubId) return
    setLoading(true)
    setError(null)
    getClubMembers(adminClubId)
      .then(setMembers)
      .catch(() => setError('Σφάλμα κατά τη φόρτωση μελών. Δοκιμάστε ξανά.'))
      .finally(() => setLoading(false))
  }, [adminClubId])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return members
    return members.filter((m) => {
      const fullName = `${m.firstName} ${m.lastName}`.toLowerCase()
      return fullName.includes(q) || m.email.toLowerCase().includes(q)
    })
  }, [query, members])

  if (isSuperAdminWithoutAdminClub) {
    return (
      <div className="space-y-6">
        <AppPageHeading title="Μέλη Συλλόγου" description="Κατάλογος μελών" />
        <Card className="p-6 text-sm text-[#475569]">
          Η επιλογή συλλόγου για super admin θα υλοποιηθεί σε επόμενη φάση.
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AppPageHeading title="Μέλη Συλλόγου" description="Κατάλογος μελών συλλόγου" />

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

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
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-[#e8eef0] bg-[#f8fafc] text-xs font-bold uppercase tracking-wide text-[#64748b]">
              <th className="px-4 py-3">Ονοματεπώνυμο</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Ρόλος</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-sm text-[#64748b]">
                  Φόρτωση…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-sm text-[#64748b]">
                  Δεν βρέθηκαν αποτελέσματα.
                </td>
              </tr>
            ) : (
              filtered.map((m) => (
                <tr key={m.userId} className="border-b border-[#f1f5f9] last:border-0">
                  <td className="px-4 py-3 font-medium text-[#022c22]">
                    {[m.firstName, m.lastName].filter(Boolean).join(' ') || '—'}
                  </td>
                  <td className="px-4 py-3 text-[#475569]">{m.email}</td>
                  <td className="px-4 py-3">{roleBadge(m.role)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
