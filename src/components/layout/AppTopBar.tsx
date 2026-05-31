import { ProfileDropdown } from './ProfileDropdown.tsx'

/**
 * Main content top bar (AppLayout).
 * Shows the profile dropdown with join-club form enabled for users without a membership.
 */
export function AppTopBar() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-end gap-4 border-b border-[#e8e8ed] bg-[rgba(249,249,252,0.85)] px-4 py-4 backdrop-blur-md md:px-8">
      <ProfileDropdown allowJoinClub={true} />
    </header>
  )
}
