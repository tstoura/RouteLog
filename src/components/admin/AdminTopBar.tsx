import { useAdminClub } from '../../admin/AdminClubContext.tsx'
import { CustomSelect } from '../ui/CustomSelect.tsx'
import { ProfileDropdown } from '../layout/ProfileDropdown.tsx'
import { useMemo } from 'react'

/**
 * Admin top bar.
 * Shows the profile dropdown (no join-club form for admins) and — for
 * super_admin on mobile — the styled club selector.
 */
export function AdminTopBar() {
  const {
    isSuperAdmin,
    selectedClubId,
    availableClubs,
    isLoadingClubs,
    setSelectedClubId,
    clearSelectedClubId,
  } = useAdminClub()

  const clubOptions = useMemo(
    () => [
      { value: '', label: '— Σύλλογος —' },
      ...availableClubs.map((c) => ({ value: c.id, label: c.name })),
    ],
    [availableClubs],
  )

  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-[#e8e8ed] bg-[rgba(249,249,252,0.92)] px-4 py-4 backdrop-blur-md md:gap-3 md:justify-end md:px-8">
      {/* Club selector — super_admin only, visible on mobile (desktop uses the sidebar) */}
      {isSuperAdmin && (
        <div className="flex-1 md:hidden">
          {isLoadingClubs ? (
            <span className="text-xs text-[#94a3b8]">Φόρτωση…</span>
          ) : (
            <CustomSelect
              value={selectedClubId ?? ''}
              onChange={(v) => (v ? setSelectedClubId(v) : clearSelectedClubId())}
              options={clubOptions}
              heightClass="h-9"
              className="max-w-[200px]"
            />
          )}
        </div>
      )}

      {/* Profile dropdown — no join-club form for admin users */}
      <div className="ml-auto">
        <ProfileDropdown allowJoinClub={false} />
      </div>
    </header>
  )
}
