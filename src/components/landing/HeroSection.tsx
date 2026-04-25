import { Link } from 'react-router-dom'
import { Badge } from '../ui/Badge.tsx'
import { LANDING_ASSETS } from '../../constants/landingAssets.ts'

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function HeroSection() {
  return (
    <section className="relative flex min-h-[min(921px,90vh)] w-full items-center justify-center overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <img
          src={LANDING_ASSETS.hero}
          alt=""
          className="absolute left-0 top-[-19%] h-[139%] w-full max-w-none object-cover"
        />
      </div>
      <div
        className="absolute inset-0 bg-gradient-to-r from-[rgba(2,44,34,0.8)] via-[rgba(2,44,34,0.4)] via-50% to-[rgba(2,44,34,0)]"
        aria-hidden
      />
      <div className="relative mx-auto flex w-full max-w-[1280px] flex-1 flex-col items-start px-6 py-12">
        <div className="flex max-w-[42rem] flex-col gap-6">
          <Badge>Πλατφορμα Καταγραφης Δραστηριοτητων</Badge>
          <h1 className="font-heading text-4xl font-bold leading-tight tracking-[-0.05em] text-white sm:text-5xl md:text-6xl lg:text-[72px] lg:leading-[72px] lg:tracking-[-1.8px]">
            <span className="block">Καταγράψτε τις</span>
            <span className="block">Δράσεις σας.</span>
            <span className="block text-[#8ad4c8]">Ζήστε ξανά </span>
            <span className="block text-[#8ad4c8]">κάθε ανάβαση.</span>
          </h1>
          <p className="max-w-lg text-lg font-semibold leading-7 text-[#e2e8f0]">
            Καταγράψτε δραστηριότητες ορειβασίας,
            <br />
            αναρρίχησης βράχου και αποστολών εξωτερικού με ακρίβεια και συνέπεια.
          </p>
          <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-start">
            <Link
              to="/login"
              className="relative inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#005f56] px-8 py-[17px] text-base font-semibold text-white shadow-[0px_20px_25px_-5px_rgba(0,95,86,0.2),0px_8px_10px_-6px_rgba(0,95,86,0.2)] transition hover:bg-[#004a43]"
            >
              Σύνδεση
              <ArrowIcon />
            </Link>
            <Link
              to="/register"
              className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-white/20 bg-white/10 px-8 py-[17px] text-base font-semibold text-white backdrop-blur-md transition hover:bg-white/15"
            >
              Δημιουργία Λογαριασμού
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
