import { Link } from 'react-router-dom'
import type { HistoryCard } from '../../types/historyCard.ts'

type Props = {
  entry: HistoryCard
}

function PinIcon() {
  return (
    <svg className="shrink-0 text-[#4c616c]" width="12" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 22s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="11" r="2" fill="currentColor" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg className="shrink-0 text-[#4c616c]" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 19V5M9 19v-7M14 19V9M19 19v-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg className="shrink-0 text-[#4c616c]" width="16" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function PersonIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 20a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function HistoryActivityCard({ entry }: Props) {
  const tagTint =
    entry.kind === 'rock_climbing'
      ? 'bg-[rgba(207,230,242,0.5)] text-[#526772]'
      : entry.kind === 'hiking'
        ? 'bg-[rgba(200,230,210,0.45)] text-[#2f5a44]'
        : 'bg-[rgba(255,220,200,0.45)] text-[#5a3d2a]'

  const article = (
    <article className="relative flex h-full min-h-[320px] flex-col justify-between rounded-xl border border-[rgba(190,201,198,0.15)] bg-white p-6 shadow-[0px_0px_0px_1px_rgba(190,201,198,0.15)] transition hover:border-[#00453e]/25 hover:shadow-md">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${tagTint}`}
          >
            {entry.categoryLabel}
          </span>
          <span className="whitespace-nowrap text-sm font-medium text-[#4c616c]">{entry.dateLabel}</span>
        </div>
        <h2 className="font-heading text-2xl font-bold leading-snug text-[#1a1c1e]">{entry.title}</h2>
        {entry.styleBadge ? (
          <span className="inline-flex w-fit rounded border border-[rgba(100,46,26,0.2)] bg-[rgba(255,181,156,0.3)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#642e1a]">
            {entry.styleBadge}
          </span>
        ) : null}
        <div className="space-y-3 rounded-lg bg-[#f3f3f6] p-4">
          <div className="flex items-center gap-3 text-sm font-medium text-[#4c616c]">
            <PinIcon />
            <span>{entry.locationLine}</span>
          </div>
          <div className="flex items-center gap-3 text-sm font-medium text-[#4c616c]">
            <ChartIcon />
            <span>{entry.metricLine}</span>
          </div>
          <div className="flex items-center gap-3 text-sm font-medium text-[#4c616c]">
            <UsersIcon />
            <span>{entry.peopleLine}</span>
          </div>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-[rgba(226,226,229,0.5)] pt-4">
        {entry.status === 'official' ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#00453e] px-3 py-1 text-xs font-semibold text-white">
            <CheckIcon />
            Επίσημη
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#e8e8ec] px-3 py-1 text-xs font-semibold text-[#334155]">
            <PersonIcon />
            Προσωπική
          </span>
        )}
        <span
          className={`flex size-9 items-center justify-center rounded-full text-[#64748b] ${entry.detailSlug ? '' : ''}`}
          aria-hidden
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </span>
      </div>
    </article>
  )

  if (entry.detailSlug) {
    return (
      <Link
        to={`/app/history/${entry.detailSlug}`}
        className="block h-full cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00453e]"
      >
        {article}
      </Link>
    )
  }

  return article
}
