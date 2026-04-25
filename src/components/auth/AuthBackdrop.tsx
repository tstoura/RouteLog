import { LANDING_ASSETS } from '../../constants/landingAssets.ts'

/** Blurred, darkened hero image behind auth modals. */
export function AuthBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <img src={LANDING_ASSETS.hero} alt="" className="absolute inset-0 h-full w-full scale-105 object-cover" />
      <div className="absolute inset-0 bg-[rgba(2,20,18,0.55)] backdrop-blur-md" />
    </div>
  )
}
