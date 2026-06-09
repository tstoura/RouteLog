import { Award, MapPin, Mountain, Ruler, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { completionTypeBadgeClasses } from '../../lib/activityLabels.ts'
import type { HistoryCard, HistoryInfoIconKey } from '../../types/historyCard.ts'

type Props = {
  entry: HistoryCard
  /** Current history page URL (pathname + search) passed as location state so detail can navigate back deterministically. */
  fromHistory?: string
}

// ── Icon map ───────────────────────────────────────────────────────────────────

const iconCls = 'size-3.5 shrink-0 text-[#4c616c]'

function RowIcon({ iconKey }: { iconKey: HistoryInfoIconKey }) {
  switch (iconKey) {
    case 'pin':
      return <MapPin className={iconCls} strokeWidth={1.8} aria-hidden />
    case 'mountain':
      return <Mountain className={iconCls} strokeWidth={1.8} aria-hidden />
    case 'ruler':
      return <Ruler className={iconCls} strokeWidth={1.8} aria-hidden />
    case 'award':
      return <Award className={iconCls} strokeWidth={1.8} aria-hidden />
    case 'users':
      return <Users className={iconCls} strokeWidth={1.8} aria-hidden />
    case 'gauge':
      return null
  }
}

// ── Footer icon badges ─────────────────────────────────────────────────────────

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

// ── Card ───────────────────────────────────────────────────────────────────────

export function HistoryActivityCard({ entry, fromHistory }: Props) {
  const tagTint =
    entry.kind === 'rock_climbing'
      ? 'bg-[rgba(207,230,242,0.5)] text-[#526772]'
      : entry.kind === 'hiking'
        ? 'bg-[rgba(200,230,210,0.45)] text-[#2f5a44]'
        : 'bg-[rgba(255,220,200,0.45)] text-[#5a3d2a]'

  const article = (
    <article className="relative flex h-full min-h-[320px] flex-col justify-between overflow-hidden rounded-xl border border-[rgba(190,201,198,0.15)] bg-white p-6 shadow-[0px_0px_0px_1px_rgba(190,201,198,0.15)] transition hover:border-[#00453e]/25 hover:shadow-md">
      <div className="space-y-4">
        {/* Header: category tag + date */}
        <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide whitespace-nowrap ${tagTint}`}
          >
            {entry.categoryLabel}
          </span>
          <span className="shrink-0 whitespace-nowrap text-sm font-medium text-[#4c616c]">
            {entry.dateLabel}
          </span>
        </div>

        {/* Title + difficulty badge */}
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-heading text-2xl font-bold leading-snug text-[#1a1c1e]">
            {entry.title}
          </h2>
          {entry.difficultyBadge ? (
            <span className="rounded-md bg-[#00453e] px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">
              {entry.difficultyBadge}
            </span>
          ) : null}
        </div>

        {/* Completion style badge (climbing only) */}
        {entry.styleBadge ? (
          <span className={`inline-flex w-fit rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${completionTypeBadgeClasses(entry.rockCompletion)}`}>
            {entry.styleBadge}
          </span>
        ) : null}

        {/* Info rows */}
        {entry.infoRows.length > 0 ? (
          <div className="space-y-2.5 rounded-lg bg-[#f3f3f6] p-4">
            {entry.infoRows.map((row, i) => (
              <div key={i} className="flex items-start gap-3 text-sm font-medium text-[#4c616c]">
                <span className="mt-[1px]">
                  <RowIcon iconKey={row.iconKey} />
                </span>
                <span className="min-w-0 leading-snug">{row.text}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Footer: official/personal badge + chevron */}
      <div className="mt-6 flex items-center justify-between border-t border-[rgba(226,226,229,0.5)] pt-4">
        {entry.status === 'official' ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#00453e] px-3 py-1 text-xs font-semibold text-white">
            <CheckIcon />
            Επίσημη καταγραφή
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#e8e8ec] px-3 py-1 text-xs font-semibold text-[#334155]">
            <PersonIcon />
            Προσωπική καταγραφή
          </span>
        )}
        <span className="flex size-9 items-center justify-center rounded-full text-[#64748b]" aria-hidden>
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
        state={fromHistory ? { fromHistory } : undefined}
        className="block h-full cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00453e]"
      >
        {article}
      </Link>
    )
  }

  return article
}
