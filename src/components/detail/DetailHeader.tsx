import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Pencil, Trash2 } from 'lucide-react'

type Props = {
  backHref: string
  backLabel: string
  title: string
  fieldLine: string
  mountainLine: string
  /** For activities (date line). Usually omitted for routes. */
  dateLine?: string
  badges?: ReactNode
  /** Optional hero image below the back link (activity-detail style). */
  heroImageSrc?: string
  /** If false, hide hero even when `heroImageSrc` is set. Default: show when `heroImageSrc` exists. */
  showHeroImage?: boolean
  /** Show edit/delete action icons (placeholder). */
  showActions?: boolean
}

export function DetailHeader({
  backHref,
  backLabel,
  title,
  fieldLine,
  mountainLine,
  dateLine,
  badges,
  heroImageSrc,
  showHeroImage,
  showActions = true,
}: Props) {
  const displayHero = Boolean(heroImageSrc) && showHeroImage !== false

  return (
    <header className="space-y-4 border-b border-[#e8eeeb] pb-6">
      <Link
        to={backHref}
        className="inline-flex cursor-pointer items-center gap-1 text-sm font-semibold text-[#005f86] transition hover:text-[#00453e]"
      >
        <span aria-hidden>←</span>
        {backLabel}
      </Link>

      {displayHero ? (
        <div className="overflow-hidden rounded-xl border border-[#e8eef0] shadow-sm">
          <img src={heroImageSrc} alt="" className="h-48 w-full object-cover sm:h-52 md:h-60" loading="lazy" />
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-3xl font-extrabold tracking-tight text-[#022c22] md:text-4xl">{title}</h1>
            {showActions ? (
              <div className="flex items-center gap-1 text-[#94a3b8]">
                <button
                  type="button"
                  className="cursor-pointer rounded-lg p-2 transition hover:bg-[#f1f5f9] hover:text-[#475569]"
                  aria-label="Επεξεργασία"
                >
                  <Pencil className="size-5" strokeWidth={2} />
                </button>
                <button
                  type="button"
                  className="cursor-pointer rounded-lg p-2 transition hover:bg-red-50 hover:text-red-700"
                  aria-label="Διαγραφή"
                >
                  <Trash2 className="size-5" strokeWidth={2} />
                </button>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#64748b]">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4 shrink-0" strokeWidth={2} aria-hidden />
              <span>Πεδίο: {fieldLine}</span>
            </span>
            <span className="hidden sm:inline" aria-hidden>
              ·
            </span>
            <span>
              Βουνό/Περιοχή: {mountainLine}
            </span>
            {dateLine ? (
              <>
                <span className="hidden sm:inline text-[#cbd5e1]" aria-hidden>
                  |
                </span>
                <span className="font-medium text-[#475569]">{dateLine}</span>
              </>
            ) : null}
          </div>
        </div>
        {badges ? <div className="flex shrink-0 flex-wrap items-center gap-2">{badges}</div> : null}
      </div>
    </header>
  )
}
