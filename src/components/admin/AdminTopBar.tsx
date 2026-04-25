import { Settings } from 'lucide-react'
import { APP_HOME_ASSETS } from '../../constants/appHomeAssets.ts'

/** Admin top bar: no page title here (title lives in body via AppPageHeading). */
export function AdminTopBar() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-end gap-2 border-b border-[#e8e8ed] bg-[rgba(249,249,252,0.92)] px-4 py-4 backdrop-blur-md md:gap-3 md:px-8">
      <button
        type="button"
        className="hidden rounded-lg p-2 text-[#64748b] transition hover:bg-[#e8eef0] hover:text-[#022c22] sm:block"
        aria-label="Ρυθμίσεις"
      >
        <Settings className="size-5" strokeWidth={2} aria-hidden />
      </button>
      <div className="flex items-center gap-2 rounded-full border border-[rgba(190,201,198,0.25)] bg-[#f3f3f6] px-3 py-1.5">
        <span className="text-xs font-semibold text-[#3f4947]">Διαχειριστής</span>
        <span className="relative size-8 shrink-0 overflow-hidden rounded-full ring-2 ring-white">
          <img src={APP_HOME_ASSETS.userBadge} alt="" className="size-full object-cover" width={32} height={32} />
        </span>
      </div>
    </header>
  )
}
