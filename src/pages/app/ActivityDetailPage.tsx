import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BarChart3, Check, Info, Lock, MessageSquare, Users } from 'lucide-react'
import { getActivityById, type ActivityListItem } from '../../api/activities.ts'
import { DEV_USER_ID } from '../../lib/devUser.ts'
import {
  categoryToLabel,
  climbingScaleDisplayLabel,
  completionTypeToLabel,
  difficultyGradeToLabel,
  fieldTypeToLabel,
  formatDateLabel,
  organizationTypeToLabel,
  repetitionTypeToLabel,
  seasonToLabel,
} from '../../lib/activityLabels.ts'
import type { ActivityDetailModel, DetailInfoRow } from '../../types/activityDetail.ts'
import type { ActivityKind } from '../../types/activity.ts'
import type { HistoryStatus } from '../../types/historyCard.ts'
import { DetailBadge } from '../../components/detail/DetailBadge.tsx'
import { DetailHeader } from '../../components/detail/DetailHeader.tsx'
import { DetailInfoGrid } from '../../components/detail/DetailInfoGrid.tsx'
import { DetailPageLayout } from '../../components/detail/DetailPageLayout.tsx'
import { DetailSectionCard } from '../../components/detail/DetailSectionCard.tsx'
import { DetailSidebarLinkCard } from '../../components/detail/DetailSidebarLinkCard.tsx'
import { DetailSidebarMetricCard } from '../../components/detail/DetailSidebarMetricCard.tsx'

const formSectionIconClass = 'size-[18px] shrink-0 text-[#00453e]'

// ── Backend → ActivityDetailModel mapper ──────────────────────────────────────

function buildDetailModel(item: ActivityListItem): ActivityDetailModel {
  const dateLabel = formatDateLabel(item.date)
  const kind: ActivityKind =
    item.category === 'climbing' ? 'rock_climbing' : (item.category as ActivityKind)
  const status: HistoryStatus = item.isOfficial ? 'official' : 'personal'

  const sidebar = {
    scoreTitle: 'ΥΠΟΛΟΓΙΣΜΕΝΟΙ ΒΑΘΜΟΙ',
    scoreValue: item.points != null ? String(item.points) : '—',
    scoreFootnote:
      item.points != null ? 'Βαθμοί ΕΟΟΑ' : 'Προσωπική καταγραφή — χωρίς βαθμούς',
  }

  // ── Hiking ──────────────────────────────────────────────────────────────────
  if (item.category === 'hiking' && item.hikingDetail) {
    const h = item.hikingDetail
    const basics: DetailInfoRow[] = [
      { label: 'Αφετηρία', value: h.startPoint },
      { label: 'Τερματισμός / Κορυφή', value: h.endPoint },
      { label: 'Βουνό', value: h.mountain },
      { label: 'Ημερομηνία', value: dateLabel },
      { label: 'Είδος πεδίου', value: fieldTypeToLabel(h.fieldType) },
      { label: 'Καταγραφή', value: status === 'official' ? 'Επίσημη' : 'Προσωπική' },
    ]
    const technical: DetailInfoRow[] = [
      { label: 'Μέγιστο Υψόμετρο', value: `${h.maxAltitude} m` },
      { label: 'Σ.Υ.Α.', value: `${h.totalElevationGain} m` },
      { label: 'Απόσταση', value: `${h.distanceLength} km` },
      { label: 'Βαθμός Δυσκολίας', value: difficultyGradeToLabel(h.difficultyGrade) },
    ]
    return {
      slug: item.id,
      title: h.mountain,
      kind,
      historyCardId: item.id,
      fieldLabel: `${h.startPoint} → ${h.endPoint}`,
      mountainLabel: h.mountain,
      dateLabel,
      status,
      basics,
      technical,
      participation: {
        peopleCount: h.participantsNum,
        peopleLabel: `${h.participantsNum} άτομα`,
        partners: [],
      },
      personalNote: { body: item.privateNotes ?? '' },
      routeEvaluation: { body: item.publicNotes ?? '' },
      sidebar,
      routesDeepLink: '/app/routes',
    }
  }

  // ── Rock Climbing ────────────────────────────────────────────────────────────
  if (item.category === 'climbing' && item.climbingDetail) {
    const c = item.climbingDetail
    const grade = c.mappedGrade ?? c.difficultyGrade
    const gradeDisplay = grade ?? c.mixedClimbing ?? '—'
    const scaleDisplay = c.difficultyScale
      ? climbingScaleDisplayLabel(c.difficultyScale)
      : c.mixedClimbing
        ? 'Μεικτό/Πάγος'
        : '—'

    const basics: DetailInfoRow[] = [
      { label: 'Διαδρομή', value: c.routeName },
      { label: 'Αναρριχητικό Πεδίο', value: c.climbingField },
      { label: 'Βουνό / Περιοχή', value: c.mountainOrArea },
      { label: 'Ημερομηνία', value: dateLabel },
      { label: 'Εποχή', value: seasonToLabel(c.season) },
      { label: 'Καταγραφή', value: status === 'official' ? 'Επίσημη' : 'Προσωπική' },
    ]
    const technical: DetailInfoRow[] = [
      { label: 'Ανάβαση', value: repetitionTypeToLabel(c.repetitionType) },
      { label: 'Υψόμετρο', value: `${c.altitude} m` },
      { label: 'Ανάπτυγμα', value: `${c.routeLength} m` },
      { label: 'Κλίμακα', value: scaleDisplay },
      { label: 'Βαθμός', value: gradeDisplay },
    ]
    if (c.completionType) {
      technical.push({ label: 'Στυλ', value: completionTypeToLabel(c.completionType) })
    }

    const partnersList = c.participantsText
      ? c.participantsText
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean)
      : []

    return {
      slug: item.id,
      title: c.routeName,
      kind,
      historyCardId: item.id,
      fieldLabel: c.climbingField,
      mountainLabel: c.mountainOrArea,
      dateLabel,
      status,
      styleBadge: c.completionType ? completionTypeToLabel(c.completionType) : undefined,
      basics,
      technical,
      participation: {
        peopleCount: c.participantsNum,
        peopleLabel: c.participantsText ?? `${c.participantsNum} άτομα`,
        partners: partnersList,
      },
      personalNote: { body: item.privateNotes ?? '' },
      routeEvaluation: { body: item.publicNotes ?? '' },
      sidebar,
      routesDeepLink: '/app/routes',
    }
  }

  // ── Expedition ───────────────────────────────────────────────────────────────
  if (item.category === 'expedition' && item.expeditionDetail) {
    const e = item.expeditionDetail
    const basics: DetailInfoRow[] = [
      { label: 'Χώρα', value: e.country },
      { label: 'Οροσειρά', value: e.mountainRange },
      { label: 'Βουνό', value: e.mountain },
      { label: 'Κορυφή', value: e.summit },
      { label: 'Διαδρομή', value: e.routeName },
      { label: 'Ημερομηνία', value: dateLabel },
    ]
    const technical: DetailInfoRow[] = [
      { label: 'Εποχή', value: seasonToLabel(e.season) },
      { label: 'Μέγιστο Υψόμετρο', value: `${e.altitude} m` },
      { label: 'Σ.Υ.Α.', value: `${e.totalElevationGain} m` },
      { label: 'Βαθμός Δυσκολίας', value: difficultyGradeToLabel(e.difficultyGrade) },
      { label: 'Οργάνωση', value: organizationTypeToLabel(e.organizationType) },
      { label: 'Καταγραφή', value: status === 'official' ? 'Επίσημη' : 'Προσωπική' },
    ]
    return {
      slug: item.id,
      title: e.mountain,
      kind,
      historyCardId: item.id,
      fieldLabel: e.routeName,
      mountainLabel: `${e.mountainRange}, ${e.country}`,
      dateLabel,
      status,
      basics,
      technical,
      participation: {
        peopleCount: e.participantsNum,
        peopleLabel: `${e.participantsNum} άτομα`,
        partners: [],
      },
      personalNote: { body: item.privateNotes ?? '' },
      routeEvaluation: { body: item.publicNotes ?? '' },
      sidebar,
      routesDeepLink: '/app/routes',
    }
  }

  // Fallback
  return {
    slug: item.id,
    title: categoryToLabel(item.category),
    kind: 'hiking',
    historyCardId: item.id,
    fieldLabel: '—',
    mountainLabel: '—',
    dateLabel,
    status,
    basics: [],
    technical: [],
    participation: { peopleCount: 0, peopleLabel: '—', partners: [] },
    personalNote: { body: item.privateNotes ?? '' },
    routeEvaluation: { body: item.publicNotes ?? '' },
    sidebar,
    routesDeepLink: '/app/routes',
  }
}

// ── Page ───────────────────────────────────────────────────────────────────────

export function ActivityDetailPage() {
  const { activitySlug } = useParams<{ activitySlug: string }>()

  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [data, setData] = useState<ActivityDetailModel | null>(null)

  useEffect(() => {
    if (!activitySlug) {
      setLoadError('Μη έγκυρο αναγνωριστικό δραστηριότητας.')
      setIsLoading(false)
      return
    }
    if (!DEV_USER_ID) {
      setLoadError('Ορίστε VITE_DEV_USER_ID στο .env για να δείτε λεπτομέρειες.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setLoadError(null)

    // TODO: replace DEV_USER_ID with JWT-decoded userId
    getActivityById(activitySlug, DEV_USER_ID)
      .then((item) => {
        setData(buildDetailModel(item))
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Σφάλμα φόρτωσης δραστηριότητας.'
        setLoadError(msg)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [activitySlug])

  if (isLoading) {
    return (
      <div className="rounded-xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-10 text-center">
        <p className="text-sm text-[#64748b]">Φόρτωση δραστηριότητας...</p>
      </div>
    )
  }

  if (loadError || !data) {
    return (
      <div className="rounded-xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-10 text-center">
        <p className="font-heading text-lg text-[#64748b]">
          {loadError ?? 'Η δραστηριότητα δεν βρέθηκε.'}
        </p>
        <Link
          to="/app/history"
          className="mt-4 inline-block text-sm font-semibold text-[#00453e] hover:underline"
        >
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
      <DetailSidebarMetricCard
        title={data.sidebar.scoreTitle}
        value={data.sidebar.scoreValue}
        footnote={data.sidebar.scoreFootnote}
      />
      <DetailSidebarLinkCard
        to={data.routesDeepLink}
        icon={
          <svg className="size-6 text-[#00453e]" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        }
      >
        <span className="text-sm font-semibold leading-snug text-[#0f3d36]">
          Δες όλες τις διαδρομές
        </span>
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

      {data.basics.length > 0 ? (
        <DetailSectionCard
          title="Βασικά Στοιχεία"
          icon={<Info className={formSectionIconClass} strokeWidth={2} aria-hidden />}
        >
          <DetailInfoGrid rows={data.basics} variant="two" />
        </DetailSectionCard>
      ) : null}

      {data.technical.length > 0 ? (
        <DetailSectionCard
          title="Τεχνικά Χαρακτηριστικά"
          icon={<BarChart3 className={formSectionIconClass} strokeWidth={2} aria-hidden />}
        >
          <DetailInfoGrid rows={data.technical} variant="tiles" />
        </DetailSectionCard>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <DetailSectionCard
          title="Συμμετοχή"
          icon={<Users className={formSectionIconClass} strokeWidth={2} aria-hidden />}
        >
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#00453e] text-xl font-bold text-white">
              {data.participation.peopleCount}
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#64748b]">
                ΑΤΟΜΑ
              </p>
              <p className="text-sm font-semibold text-[#1a1c1e]">{data.participation.peopleLabel}</p>
            </div>
          </div>
          {data.participation.partners.length > 0 ? (
            <>
              <p className="mt-4 text-[10px] font-semibold uppercase tracking-wide text-[#64748b]">
                ΣΧΟΙΝΟΣΥΝΤΡΟΦΟΙ
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {data.participation.partners.map((p) => (
                  <span
                    key={p}
                    className="rounded-full border border-[#e2e8e0] bg-[#f8fafc] px-3 py-1 text-xs font-semibold text-[#475569]"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </>
          ) : null}
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
          {data.personalNote.body ? (
            <p className="text-sm italic leading-relaxed text-[#475569]">
              {data.personalNote.body}
            </p>
          ) : (
            <p className="text-sm text-[#94a3b8]">Καμία προσωπική σημείωση.</p>
          )}
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
        {data.routeEvaluation.body ? (
          <blockquote className="border-l-4 border-[#00453e] bg-[#f8fafc] py-3 pl-4 text-sm leading-relaxed text-[#334155]">
            {data.routeEvaluation.body}
          </blockquote>
        ) : (
          <p className="text-sm text-[#94a3b8]">Καμία αξιολόγηση.</p>
        )}
      </DetailSectionCard>
    </DetailPageLayout>
  )
}
