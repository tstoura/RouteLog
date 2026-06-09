import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BarChart3, Info, MessageSquare, Plus, Search } from 'lucide-react'
import { getClimbingRouteById, getRouteActivityReviews, type ActivityReview, type ClimbingRouteResponse } from '../../api/climbingRoutes.ts'
import { ApiError } from '../../api/client.ts'
import { DetailBadge } from '../../components/detail/DetailBadge.tsx'
import { DetailHeader } from '../../components/detail/DetailHeader.tsx'
import { DetailInfoGrid } from '../../components/detail/DetailInfoGrid.tsx'
import { DetailPageLayout } from '../../components/detail/DetailPageLayout.tsx'
import { DetailSectionCard } from '../../components/detail/DetailSectionCard.tsx'
import { DetailSidebarLinkCard } from '../../components/detail/DetailSidebarLinkCard.tsx'
import { DetailSidebarMetricCard } from '../../components/detail/DetailSidebarMetricCard.tsx'
import { Button } from '../../components/ui/Button.tsx'
import { Card } from '../../components/ui/Card.tsx'
import { scaleToLabel, completionTypeToLabel, formatDateLabel } from '../../lib/activityLabels.ts'
import type { DetailInfoRow } from '../../types/activityDetail.ts'

const formSectionIconClass = 'size-[18px] shrink-0 text-[#00453e]'

// ── Build detail model from backend response ──────────────────────────────────

function buildBasics(r: ClimbingRouteResponse): DetailInfoRow[] {
  return [
    { label: 'ΔΙΑΔΡΟΜΗ', value: r.name },
    { label: 'ΠΕΔΙΟ', value: r.climbingField },
    { label: 'ΠΕΡΙΟΧΗ / ΒΟΥΝΟ', value: r.mountainOrArea },
  ]
}

function buildTechnical(r: ClimbingRouteResponse): DetailInfoRow[] {
  return [
    { label: 'ΚΛΙΜΑΚΑ ΔΥΣΚΟΛΙΑΣ', value: scaleToLabel(r.defaultScale) },
    { label: 'ΒΑΘΜΟΣ', value: r.defaultGrade ?? '—' },
    { label: 'ΥΨΟΜΕΤΡΟ (M)', value: r.altitude != null ? String(r.altitude) : '—' },
    { label: 'ΑΝΑΠΤΥΓΜΑ ΔΙΑΔΡΟΜΗΣ (M)', value: r.routeLength != null ? String(r.routeLength) : '—' },
  ]
}

// ── Review card helpers ───────────────────────────────────────────────────────

function reviewDateLabel(isoDate: string): string {
  return formatDateLabel(isoDate)
}

function reviewSubtitle(review: ActivityReview): string | null {
  const d = review.climbingDetail
  if (!d) return null
  const parts: string[] = []
  if (d.completionType) parts.push(completionTypeToLabel(d.completionType))
  // Prefer mappedGrade (UIAA/Alpine) over raw difficultyGrade, fall back to mixedClimbing
  const grade = d.mappedGrade ?? d.difficultyGrade ?? d.mixedClimbing
  if (grade) parts.push(grade)
  return parts.length ? parts.join(' · ') : null
}

// ── Component ─────────────────────────────────────────────────────────────────

export function RouteDetailPage() {
  const navigate = useNavigate()
  const { routeSlug } = useParams<{ routeSlug: string }>()

  function handleBackToRoutes() {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0
    if (idx > 0) {
      navigate(-1)
    } else {
      navigate('/app/routes')
    }
  }

  const [route, setRoute] = useState<ClimbingRouteResponse | null>(null)
  const [reviews, setReviews] = useState<ActivityReview[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!routeSlug) return
    setIsLoading(true)
    setError(null)
    setNotFound(false)

    Promise.all([
      getClimbingRouteById(routeSlug).catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true)
        } else {
          setError('Σφάλμα φόρτωσης διαδρομής.')
        }
        return null
      }),
      getRouteActivityReviews(routeSlug).catch(() => [] as ActivityReview[]),
    ]).then(([routeData, reviewData]) => {
      if (routeData) setRoute(routeData)
      setReviews(reviewData)
      setIsLoading(false)
    })
  }, [routeSlug])

  if (isLoading) {
    return (
      <div className="py-16 text-center text-sm text-[#64748b]">
        Φόρτωση διαδρομής…
      </div>
    )
  }

  if (notFound || (!isLoading && !route)) {
    return (
      <div className="rounded-xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-10 text-center">
        <p className="font-heading text-lg text-[#64748b]">Η διαδρομή δεν βρέθηκε.</p>
        <Link to="/app/routes" className="mt-4 inline-block cursor-pointer text-sm font-semibold text-[#00453e] hover:underline">
          Επιστροφή στις Διαδρομές
        </Link>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-10 text-center">
        <p className="text-sm text-red-700">{error}</p>
        <Link to="/app/routes" className="mt-4 inline-block text-sm font-semibold text-[#00453e] hover:underline">
          Επιστροφή στις Διαδρομές
        </Link>
      </div>
    )
  }

  // route is guaranteed non-null here
  const r = route!

  const basics = buildBasics(r)
  const technical = buildTechnical(r)
  const difficultyLabel = r.defaultGrade ?? '—'

  const badges = <DetailBadge variant="official">{difficultyLabel}</DetailBadge>

  const sidebar = (
    <>
      <DetailSidebarMetricCard
        variant="green"
        title="ΒΑΘΜΟΣ ΔΥΣΚΟΛΙΑΣ"
        value={difficultyLabel}
        footnote={`${scaleToLabel(r.defaultScale)} · κλασική αναρρίχηση`}
        hideFootnoteIcon
      />
      <DetailSidebarLinkCard
        to="/app/history?kind=rock_climbing"
        icon={<Search className="size-6 text-[#00453e]" strokeWidth={2} aria-hidden />}
      >
        <span className="text-sm font-semibold leading-snug text-[#0f3d36]">Δες σχετικές καταχωρήσεις στο Ιστορικό</span>
      </DetailSidebarLinkCard>
    </>
  )

  return (
    <DetailPageLayout sidebar={sidebar}>
      <DetailHeader
        backHref="/app/routes"
        backLabel="Πίσω στις Διαδρομές"
        onBack={handleBackToRoutes}
        title={r.name}
        fieldLine={r.climbingField}
        mountainLine={r.mountainOrArea}
        badges={badges}
        showActions={false}
      />

      <Card className="p-5">
        <div className="flex flex-col items-center gap-2">
          <Button
            variant="primary"
            className="h-11 w-auto min-w-0 max-w-full bg-[#00453e] px-6 hover:bg-[#003a32] sm:px-8"
            onClick={() => navigate(`/app/new/climbing?route=${encodeURIComponent(r.id)}`)}
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
        <DetailInfoGrid rows={basics} variant="two" />
      </DetailSectionCard>

      <DetailSectionCard
        title="Τεχνικά Χαρακτηριστικά"
        icon={<BarChart3 className={formSectionIconClass} strokeWidth={2} aria-hidden />}
      >
        <DetailInfoGrid rows={technical} variant="tiles" />
      </DetailSectionCard>

      <DetailSectionCard
        title="Αξιολογήσεις Χρηστών"
        icon={<MessageSquare className={formSectionIconClass} strokeWidth={2} aria-hidden />}
        badge={
          reviews.length > 0 ? (
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-900">
              ΟΡΑΤΗ ΑΠΟ ΤΗΝ ΚΟΙΝΟΤΗΤΑ
            </span>
          ) : undefined
        }
      >
        {reviews.length === 0 ? (
          <p className="text-sm text-[#94a3b8]">Δεν υπάρχουν ακόμα αξιολογήσεις για αυτή τη διαδρομή.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((rev) => {
              const subtitle = reviewSubtitle(rev)
              return (
                <Card key={rev.id} className="border-[#e8eef0] bg-[#f8fafc] p-4 shadow-none">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-[#64748b]">
                      {subtitle ?? 'Καταγραφή'}
                    </span>
                    <time className="text-xs font-medium text-[#94a3b8]" dateTime={rev.date}>
                      {reviewDateLabel(rev.date)}
                    </time>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-[#334155]">{rev.publicNotes}</p>
                </Card>
              )
            })}
          </div>
        )}
      </DetailSectionCard>
    </DetailPageLayout>
  )
}
