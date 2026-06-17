import { LANDING_ASSETS } from '../../constants/landingAssets.ts'

/**
 * Blurred, darkened hero image behind auth modals.
 */
export function AuthBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <img src={LANDING_ASSETS.hero} alt="" className="absolute inset-0 h-full w-full scale-105 object-cover object-[center_70%]" />
      {/*
        Two-layer overlay keeps the RouteLog green/teal brand visible through
        the blurred image. Inline style used because Tailwind cannot express
        multiple layered CSS backgrounds with arbitrary RGBA stops.
      */}
      <div
        className="absolute inset-0 backdrop-blur-md"
        style={{
          background: [
            'linear-gradient(90deg, rgba(0,58,45,0.72) 0%, rgba(0,70,62,0.64) 45%, rgba(0,58,55,0.66) 100%)',
            'rgba(2,44,34,0.35)',
          ].join(', '),
        }}
      />
    </div>
  )
}
