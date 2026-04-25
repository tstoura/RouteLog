import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BarChart3, Info, MessageSquare, Plus, Search } from 'lucide-react'
import { getRouteDetailBySlug } from '../../data/mockRouteDetails.ts'
import { DetailBadge } from '../../components/detail/DetailBadge.tsx'
import { DetailHeader } from '../../components/detail/DetailHeader.tsx'
import { DetailInfoGrid } from '../../components/detail/DetailInfoGrid.tsx'
import { DetailPageLayout } from '../../components/detail/DetailPageLayout.tsx'
import { DetailSectionCard } from '../../components/detail/DetailSectionCard.tsx'
import { DetailSidebarLinkCard } from '../../components/detail/DetailSidebarLinkCard.tsx'
import { DetailSidebarMetricCard } from '../../components/detail/DetailSidebarMetricCard.tsx'
import { Button } from '../../components/ui/Button.tsx'
import { Card } from '../../components/ui/Card.tsx'

const formSectionIconClass = 'size-[18px] shrink-0 text-[#00453e]'

export function RouteDetailPage() {
  const navigate = useNavigate()
  const { routeSlug } = useParams<{ routeSlug: string }>()
  const data = useMemo(() => (routeSlug ? getRouteDetailBySlug(routeSlug) : undefined), [routeSlug])

  if (!data) {
    return (
      <div className="rounded-xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-10 text-center">
        <p className="font-heading text-lg text-[#64748b]">Η διαδρομή δεν βρέθηκε.</p>
        <Link to="/app/routes" className="mt-4 inline-block cursor-pointer text-sm font-semibold text-[#00453e] hover:underline">
          Επιστροφή στις Διαδρομές
        </Link>
      </div>
    )
  }

  const showHistoryLink = data.showHistorySidebarLink !== false
  const showReviewsBadge = data.showReviewsCommunityBadge !== false

  const badges = <DetailBadge variant="official">{data.difficultyLabel}</DetailBadge>

  const sidebar = (
    <>
      <DetailSidebarMetricCard
        variant="green"
        title={data.sidebar.title.toUpperCase()}
        value={data.sidebar.value}
        footnote={data.sidebar.footnote}
        hideFootnoteIcon
      />
      {showHistoryLink ? (
        <DetailSidebarLinkCard
          to="/app/history?kind=rock_climbing"
          icon={<Search className="size-6 text-[#00453e]" strokeWidth={2} aria-hidden />}
        >
          <span className="text-sm font-semibold leading-snug text-[#0f3d36]">Δες σχετικές καταχωρήσεις στο Ιστορικό</span>
        </DetailSidebarLinkCard>
      ) : null}
    </>
  )

  return (
    <DetailPageLayout sidebar={sidebar}>
      <DetailHeader
        backHref="/app/routes"
        backLabel="Πίσω στις Διαδρομές"
        title={data.name}
        fieldLine={data.fieldLabel}
        mountainLine={data.mountainLabel}
        badges={badges}
        heroImageSrc={data.heroImageSrc}
        showHeroImage={data.showHeroImage}
        showActions={false}
      />

      <Card className="p-5">
        <div className="flex flex-col items-center gap-2">
          <Button
            variant="primary"
            className="h-11 w-auto min-w-0 max-w-full bg-[#00453e] px-6 hover:bg-[#003a32] sm:px-8"
            onClick={() => navigate(`/app/new/climbing?route=${encodeURIComponent(data.slug)}`)}
          >
            <Plus className="size-4 shrink-0" strokeWidth={2.5} aria-hidden />
            Καταχώρησε νέα ανάβαση
          </Button>
          <p className="max-w-md text-center text-xs leading-relaxed text-[#94a3b8]">
            Ξεκίνα νέα καταγραφή με τα στοιχεία της διαδρομής προσυμπληρωμένα.
          </p>
        </div>
      </Card>

      <DetailSectionCard title="Βασικά Στοιχεία" icon={<Info className={formSectionIconClass} strokeWidth={2} aria-hidden />}>
        <DetailInfoGrid rows={data.basics} variant="two" />
      </DetailSectionCard>

      <DetailSectionCard
        title="Τεχνικά Χαρακτηριστικά"
        icon={<BarChart3 className={formSectionIconClass} strokeWidth={2} aria-hidden />}
      >
        <DetailInfoGrid rows={data.technical} variant="tiles" />
      </DetailSectionCard>

      <DetailSectionCard
        title="Αξιολογήσεις Χρηστών"
        icon={<MessageSquare className={formSectionIconClass} strokeWidth={2} aria-hidden />}
        badge={
          showReviewsBadge ? (
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-900">
              ΟΡΑΤΗ ΑΠΟ ΤΗΝ ΚΟΙΝΟΤΗΤΑ
            </span>
          ) : undefined
        }
      >
        <div className="space-y-4">
          {data.userReviews.map((r) => (
            <Card key={`${r.memberLabel}-${r.dateLabel}`} className="border-[#e8eef0] bg-[#f8fafc] p-4 shadow-none">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-[#64748b]">{r.memberLabel}</span>
                <time className="text-xs font-medium text-[#94a3b8]" dateTime={r.dateLabel}>
                  {r.dateLabel}
                </time>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[#334155]">{r.comment}</p>
            </Card>
          ))}
        </div>
      </DetailSectionCard>
    </DetailPageLayout>
  )
}
