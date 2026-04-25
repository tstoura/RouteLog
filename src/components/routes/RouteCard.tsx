import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../ui/Badge.tsx'
import { Card } from '../ui/Card.tsx'
import type { Route } from '../../types/route.ts'

const kindLabels: Record<NonNullable<Route['activityKind']>, string> = {
  hiking: 'Ορειβασία',
  rock_climbing: 'Αναρρίχηση',
  expedition: 'Αποστολή',
}

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#94a3b8]" aria-hidden>
      <path
        d="M12 21s7-4.35 7-10a7 7 0 1 0-14 0c0 5.65 7 10 7 10Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="11" r="2.2" fill="currentColor" />
    </svg>
  )
}

function MountainIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#94a3b8]" aria-hidden>
      <path
        d="m3 18 7-12 4 7 3-5 4 10H3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

type Props = {
  route: Route
}

export function RouteCard({ route: r }: Props) {
  const kind = r.activityKind ? kindLabels[r.activityKind] : null
  const isClimbing = r.activityKind === 'rock_climbing'
  const locationLines: { icon: ReactNode; text: string }[] = []
  if (r.sector) locationLines.push({ icon: <PinIcon />, text: r.sector })
  if (r.mountain) locationLines.push({ icon: <MountainIcon />, text: r.mountain })
  if (!locationLines.length && r.region) {
    locationLines.push({ icon: <PinIcon />, text: r.region })
  }

  const inner = (
    <>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-heading text-base font-bold text-[#022c22] md:text-lg">{r.name}</h2>
          {r.difficultyLabel ? (
            <span className="rounded-md bg-[#00453e] px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">
              {r.difficultyLabel}
            </span>
          ) : null}
          {!isClimbing && kind ? <Badge>{kind}</Badge> : null}
        </div>

        {isClimbing && locationLines.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            {locationLines.map((line, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-[#64748b]">
                {line.icon}
                <span className="leading-snug">{line.text}</span>
              </div>
            ))}
          </div>
        ) : !isClimbing ? (
          <div className="space-y-1 text-sm text-[#64748b]">
            {r.region ? <p>{r.region}</p> : null}
            {r.distanceKm != null && r.elevationGainM != null ? (
              <p className="text-xs text-[#94a3b8]">
                {r.distanceKm} km · υ.μ. +{r.elevationGainM} m
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <span className="shrink-0 rounded-lg bg-[rgba(0,69,62,0.1)] px-4 py-2.5 text-sm font-semibold text-[#00453e] transition group-hover:bg-[rgba(0,69,62,0.16)]">
        Προβολή
      </span>
    </>
  )

  const cardClass =
    'group flex flex-row items-center justify-between gap-4 p-4 transition hover:border-[#cce8e0] hover:shadow-md md:p-5'

  if (r.slug) {
    return (
      <Link to={`/app/routes/${r.slug}`} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00453e]">
        <Card className={cardClass}>{inner}</Card>
      </Link>
    )
  }

  return <Card className={cardClass}>{inner}</Card>
}
