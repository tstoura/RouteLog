import { MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { completionTypeBadgeClasses } from '../../lib/activityLabels.ts'
import type { HistoryCard } from '../../types/historyCard.ts'

type Props = {
  dateLabel: string
  /** "climbingField" portion of the session key. */
  field: string
  /** "mountainOrArea" portion of the session key. */
  area: string
  cards: HistoryCard[]
}

function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

function PersonIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 20a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

/**
 * Renders a group of rock climbing activities from the same session
 * (same date + climbingField + mountainOrArea) as a single compact card.
 * Only shown when 2+ activities match the grouping key.
 */
export function ClimbingSessionGroup({ dateLabel, field, area, cards }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-[rgba(190,201,198,0.2)] bg-white shadow-[0px_0px_0px_1px_rgba(190,201,198,0.15)] transition hover:border-[#00453e]/25 hover:shadow-md">
      {/* Session header */}
      <div className="flex items-start justify-between gap-3 border-b border-[#f0f0f3] bg-[#f8fafc] px-5 py-5">
        <div className="space-y-2">
          <span className="inline-flex items-center rounded-full bg-[rgba(207,230,242,0.6)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#526772]">
            Αναρρίχηση βράχου
          </span>
          <p className="flex items-center gap-1.5 text-sm font-medium text-[#1a1c1e]">
            <MapPin className="size-3.5 shrink-0 text-[#4c616c]" strokeWidth={1.8} aria-hidden />
            <span>{field}</span>
            {area ? <><span className="text-[#94a3b8]">·</span><span>{area}</span></> : null}
          </p>
        </div>
        <span className="shrink-0 whitespace-nowrap text-sm font-medium text-[#4c616c]">
          {dateLabel}
        </span>
      </div>

      {/* Route rows */}
      <ul className="divide-y divide-[#f0f0f3]">
        {cards.map((card) => {
          const pointsText = card.infoRows.find((r) => r.iconKey === 'award')?.text

          const row = (
            <div className="flex items-center justify-between gap-3 px-5 py-4 transition hover:bg-[#f8fafc]">
              {/* Left: name + badges */}
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="truncate font-heading text-sm font-semibold text-[#1a1c1e]">
                  {card.title}
                </span>
                {card.difficultyBadge ? (
                  <span className="shrink-0 rounded bg-[#00453e] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    {card.difficultyBadge}
                  </span>
                ) : null}
                {card.styleBadge ? (
                  <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${completionTypeBadgeClasses(card.rockCompletion)}`}>
                    {card.styleBadge}
                  </span>
                ) : null}
              </div>

              {/* Right: official/personal + points + chevron */}
              <div className="flex shrink-0 items-center gap-2.5">
                {card.status === 'official' ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#00453e] px-2.5 py-0.5 text-[10px] font-semibold text-white">
                    <CheckIcon />
                    Επίσημη
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#e8e8ec] px-2.5 py-0.5 text-[10px] font-semibold text-[#334155]">
                    <PersonIcon />
                    Προσωπική
                  </span>
                )}
                {pointsText ? (
                  <span className="hidden text-xs font-medium text-[#64748b] sm:inline">
                    {pointsText}
                  </span>
                ) : null}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[#94a3b8]" aria-hidden>
                  <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          )

          return (
            <li key={card.id}>
              {card.detailSlug ? (
                <Link
                  to={`/app/history/${card.detailSlug}`}
                  className="block cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#00453e]"
                >
                  {row}
                </Link>
              ) : (
                row
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
