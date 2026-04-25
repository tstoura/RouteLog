import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BarChart3, Check, Info, Lock, MessageSquare, Search, Users } from 'lucide-react'
import { getActivityDetailBySlug } from '../../data/mockActivities.ts'
import { DetailBadge } from '../../components/detail/DetailBadge.tsx'
import { DetailHeader } from '../../components/detail/DetailHeader.tsx'
import { DetailInfoGrid } from '../../components/detail/DetailInfoGrid.tsx'
import { DetailPageLayout } from '../../components/detail/DetailPageLayout.tsx'
import { DetailSectionCard } from '../../components/detail/DetailSectionCard.tsx'
import { DetailSidebarLinkCard } from '../../components/detail/DetailSidebarLinkCard.tsx'
import { DetailSidebarMetricCard } from '../../components/detail/DetailSidebarMetricCard.tsx'

const formSectionIconClass = 'size-[18px] shrink-0 text-[#00453e]'

export function ActivityDetailPage() {
  const { activitySlug } = useParams<{ activitySlug: string }>()
  const data = useMemo(() => (activitySlug ? getActivityDetailBySlug(activitySlug) : undefined), [activitySlug])

  if (!data) {
    return (
      <div className="rounded-xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-10 text-center">
        <p className="font-heading text-lg text-[#64748b]">Η δραστηριότητα δεν βρέθηκε.</p>
        <Link to="/app/history" className="mt-4 inline-block text-sm font-semibold text-[#00453e] hover:underline">
          Επιστροφή στο Ιστορικό
        </Link>
      </div>
    )
  }

  const badges = (
    <>
      {data.styleBadge ? <DetailBadge variant="style">{data.styleBadge}</DetailBadge> : null}
      {data.status === 'official' ? (
        <DetailBadge variant="official" icon={<Check className="size-3.5" strokeWidth={2.5} aria-hidden />}>
          Επίσημη
        </DetailBadge>
      ) : (
        <DetailBadge variant="neutral">Προσωπική</DetailBadge>
      )}
    </>
  )

  const sidebar = (
    <>
      <DetailSidebarMetricCard title={data.sidebar.scoreTitle} value={data.sidebar.scoreValue} footnote={data.sidebar.scoreFootnote} />
      <DetailSidebarLinkCard to={data.routesDeepLink} icon={<Search className="size-6 text-[#00453e]" strokeWidth={2} aria-hidden />}>
        <span className="text-sm font-semibold leading-snug text-[#0f3d36]">Δες όλες τις διαδρομές στο ίδιο πεδίο</span>
      </DetailSidebarLinkCard>
    </>
  )

  return (
    <DetailPageLayout sidebar={sidebar}>
      <DetailHeader
        backHref="/app/history"
        backLabel="Πίσω στο Ιστορικό"
        title={data.title}
        fieldLine={data.fieldLabel}
        mountainLine={data.mountainLabel}
        dateLine={data.dateLabel}
        badges={badges}
      />

      <DetailSectionCard title="Βασικά Στοιχεία" icon={<Info className={formSectionIconClass} strokeWidth={2} aria-hidden />}>
        <DetailInfoGrid rows={data.basics} variant="two" />
      </DetailSectionCard>

      <DetailSectionCard
        title="Τεχνικά Χαρακτηριστικά"
        icon={<BarChart3 className={formSectionIconClass} strokeWidth={2} aria-hidden />}
      >
        <DetailInfoGrid rows={data.technical} variant="tiles" />
      </DetailSectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <DetailSectionCard title="Συμμετοχή" icon={<Users className={formSectionIconClass} strokeWidth={2} aria-hidden />}>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#00453e] text-xl font-bold text-white">
              {data.participation.peopleCount}
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#64748b]">ΑΤΟΜΑ</p>
              <p className="text-sm font-semibold text-[#1a1c1e]">{data.participation.peopleLabel}</p>
            </div>
          </div>
          <p className="mt-4 text-[10px] font-semibold uppercase tracking-wide text-[#64748b]">ΣΧΟΙΝΟΣΥΝΤΡΟΦΟΙ</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {data.participation.partners.map((p) => (
              <span key={p} className="rounded-full border border-[#e2e8e0] bg-[#f8fafc] px-3 py-1 text-xs font-semibold text-[#475569]">
                {p}
              </span>
            ))}
          </div>
        </DetailSectionCard>

        <DetailSectionCard
          title="Προσωπική Σημείωση"
          icon={<Lock className={formSectionIconClass} strokeWidth={2} aria-hidden />}
          badge={
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
              ΟΡΑΤΗ ΜΟΝΟ ΑΠΟ ΕΣΕΝΑ
            </span>
          }
        >
          <p className="text-sm italic leading-relaxed text-[#475569]">{data.personalNote.body}</p>
        </DetailSectionCard>
      </div>

      <DetailSectionCard
        title="Αξιολόγηση Διαδρομής"
        icon={<MessageSquare className={formSectionIconClass} strokeWidth={2} aria-hidden />}
        badge={
          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-900">
            ΟΡΑΤΗ ΑΠΟ ΤΗΝ ΚΟΙΝΟΤΗΤΑ
          </span>
        }
      >
        <blockquote className="border-l-4 border-[#00453e] bg-[#f8fafc] py-3 pl-4 text-sm leading-relaxed text-[#334155]">
          {data.routeEvaluation.body}
        </blockquote>
      </DetailSectionCard>
    </DetailPageLayout>
  )
}
