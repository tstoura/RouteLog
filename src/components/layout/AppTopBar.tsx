import { APP_HOME_ASSETS } from '../../constants/appHomeAssets.ts'

/**
 * Main content top bar (Figma-aligned): user badge area.
 */
export function AppTopBar() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-end gap-4 border-b border-[#e8e8ed] bg-[rgba(249,249,252,0.85)] px-4 py-4 backdrop-blur-md md:px-8">
      <div className="flex items-center gap-3 rounded-full border border-[rgba(190,201,198,0.25)] bg-[#f3f3f6] px-3 py-1.5">
        <span className="text-xs font-semibold text-[#3f4947]">Μέλος #8429</span>
        <span className="relative size-8 overflow-hidden rounded-full ring-2 ring-white">
          <img
            src={APP_HOME_ASSETS.userBadge}
            alt=""
            className="size-full object-cover"
            width={32}
            height={32}
          />
        </span>
      </div>
    </header>
  )
}
