import type { DetailInfoRow } from '../../types/activityDetail.ts'

type Props = {
  rows: DetailInfoRow[]
  /** Two columns (basics) or five small cells (technical). */
  variant?: 'two' | 'tiles'
}

export function DetailInfoGrid({ rows, variant = 'two' }: Props) {
  if (variant === 'tiles') {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {rows.map((row) => (
          <div
            key={row.label}
            className="rounded-lg border border-[#e8e8ec] bg-[#f3f3f6] px-3 py-3 text-center sm:text-left"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#64748b]">{row.label}</p>
            <p className="mt-1 text-sm font-semibold text-[#1a1c1e]">{row.value}</p>
          </div>
        ))}
      </div>
    )
  }

  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.label} className="space-y-1">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-[#64748b]">{row.label}</dt>
          <dd className="text-sm font-semibold text-[#1a1c1e]">{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}
