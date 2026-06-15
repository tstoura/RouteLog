import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { BarChart3, Check, Info, Lock, MapPin, MessageSquare, Users } from 'lucide-react'
import { deleteActivity, getActivityById, type ActivityListItem } from '../../api/activities.ts'
import { ApiError } from '../../api/client.ts'
import {
  categoryToLabel,
  climbingScaleDisplayLabel,
  completionTypeBadgeClasses,
  completionTypeToLabel,
  difficultyGradeToLabel,
  fieldTypeToLabel,
  formatDateLabel,
  organizationTypeToLabel,
  seasonToLabel,
} from '../../lib/activityLabels.ts'
import { climbingSameFieldRoutesHref } from '../../lib/climbingRoutesCatalogLink.ts'
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
      { label: 'Αφετηρία', value: h.startPoint || '—' },
      { label: 'Τερματισμός / Κορυφή', value: h.endPoint || '—' },
      { label: 'Βουνό', value: h.mountain },
      { label: 'Ημερομηνία', value: dateLabel },
      { label: 'Είδος πεδίου', value: fieldTypeToLabel(h.fieldType) },
      { label: 'Καταγραφή', value: status === 'official' ? 'Επίσημη' : 'Προσωπική' },
    ]
    // For personal records Phase A stores 0 when the user left numeric fields empty.
    // Show "—" instead of "0 m / 0 km" in those cases.
    const showHikingAltitude = item.isOfficial || h.maxAltitude > 0
    const showHikingElevation = item.isOfficial || h.totalElevationGain > 0
    const showHikingDistance = item.isOfficial || h.distanceLength > 0
    const technical: DetailInfoRow[] = [
      { label: 'Μέγιστο Υψόμετρο', value: showHikingAltitude ? `${h.maxAltitude} m` : '—' },
      { label: 'Σ.Υ.Α.', value: showHikingElevation ? `${h.totalElevationGain} m` : '—' },
      { label: 'Απόσταση', value: showHikingDistance ? `${h.distanceLength} km` : '—' },
      { label: 'Βαθμός Δυσκολίας', value: difficultyGradeToLabel(h.difficultyGrade) },
    ]
    return {
      slug: item.id,
      title: h.mountain,
      kind,
      historyCardId: item.id,
      fieldLabel:
        h.startPoint && h.endPoint
          ? `${h.startPoint} → ${h.endPoint}`
          : h.startPoint || h.endPoint || '—',
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
      routesDeepLink: null,
    }
  }

  // ── Rock Climbing ────────────────────────────────────────────────────────────
  if (item.category === 'climbing' && item.climbingDetail) {
    const c = item.climbingDetail
    // Prefer the original submitted grade; mappedGrade is for scoring only
    const grade = c.difficultyGrade ?? c.mappedGrade
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
      { label: 'Κλίμακα', value: scaleDisplay },
      { label: 'Βαθμός', value: gradeDisplay },
      { label: 'Ανάπτυγμα', value: c.routeLength > 0 ? `${c.routeLength} m` : '—' },
      { label: 'Τελικό Υψόμετρο', value: c.altitude > 0 ? `${c.altitude} m` : '—' },
    ]
    if (c.completionType) {
      technical.push({ label: 'Τρόπος Ολοκλήρωσης', value: completionTypeToLabel(c.completionType) })
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
      styleCompletionType: c.completionType ?? undefined,
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
      routesDeepLink: climbingSameFieldRoutesHref(c.climbingField),
    }
  }

  // ── Expedition ───────────────────────────────────────────────────────────────
  if (item.category === 'expedition' && item.expeditionDetail) {
    const e = item.expeditionDetail
    const basics: DetailInfoRow[] = [
      { label: 'Χώρα', value: e.country },
      { label: 'Οροσειρά', value: e.mountainRange || '—' },
      { label: 'Βουνό', value: e.mountain },
      { label: 'Κορυφή', value: e.summit || '—' },
      { label: 'Διαδρομή', value: e.routeName || '—' },
      { label: 'Ημερομηνία', value: dateLabel },
    ]
    const technical: DetailInfoRow[] = [
      { label: 'Εποχή', value: seasonToLabel(e.season) },
      { label: 'Μέγιστο Υψόμετρο', value: e.altitude > 0 ? `${e.altitude} m` : '—' },
      { label: 'Σ.Υ.Α.', value: e.totalElevationGain > 0 ? `${e.totalElevationGain} m` : '—' },
      { label: 'Βαθμός Δυσκολίας', value: difficultyGradeToLabel(e.difficultyGrade) || '—' },
      { label: 'Οργάνωση', value: organizationTypeToLabel(e.organizationType) },
      { label: 'Καταγραφή', value: status === 'official' ? 'Επίσημη' : 'Προσωπική' },
    ]
    return {
      slug: item.id,
      title: e.mountain,
      kind,
      historyCardId: item.id,
      fieldLabel: e.routeName || '—',
      mountainLabel: e.mountainRange ? `${e.mountainRange}, ${e.country}` : e.country,
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
      routesDeepLink: null,
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
    routesDeepLink: null,
  }
}

// ── Page ───────────────────────────────────────────────────────────────────────

export function ActivityDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { activitySlug } = useParams<{ activitySlug: string }>()

  // Deterministic back target: the history page URL passed by HistoryPage as
  // location.state.fromHistory, or /app/history as a safe fallback.
  const fromHistory: string =
    (location.state as { fromHistory?: string } | null)?.fromHistory ?? '/app/history'

  function handleBack() {
    navigate(fromHistory, { replace: true })
  }

  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [data, setData] = useState<ActivityDetailModel | null>(null)
  const [rawActivity, setRawActivity] = useState<ActivityListItem | null>(null)

  // ── Delete modal state ──────────────────────────────────────────────────────
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    if (!activitySlug) {
      setLoadError('Μη έγκυρο αναγνωριστικό δραστηριότητας.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setLoadError(null)

    getActivityById(activitySlug)
      .then((item) => {
        setRawActivity(item)
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

  const handleEdit = () => {
    navigate(`/app/history/${activitySlug}/edit`, { state: { fromHistory } })
  }

  const handleDeleteConfirm = async () => {
    if (!activitySlug) return
    setIsDeleting(true)
    setDeleteError(null)
    try {
      await deleteActivity(activitySlug)
      navigate('/app/history', { replace: true })
    } catch (err) {
      setDeleteError(
        err instanceof ApiError
          ? err.message
          : 'Σφάλμα κατά τη διαγραφή. Παρακαλώ δοκιμάστε ξανά.',
      )
    } finally {
      setIsDeleting(false)
    }
  }

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
      {data.styleBadge ? (
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${completionTypeBadgeClasses(data.styleCompletionType)}`}
        >
          {data.styleBadge}
        </span>
      ) : null}
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
      {data.status === 'official' ? (
        <DetailSidebarMetricCard
          title={data.sidebar.scoreTitle}
          value={data.sidebar.scoreValue}
          footnote={data.sidebar.scoreFootnote}
        />
      ) : (
        <DetailSidebarMetricCard
          variant="soft"
          title="ΠΡΟΣΩΠΙΚΗ ΚΑΤΑΓΡΑΦΗ"
          value="—"
          footnote="Δεν υπολογίζονται βαθμοί ΕΟΟΑ για προσωπικές καταγραφές."
          hideFootnoteIcon
        />
      )}
      {data.kind === 'rock_climbing' && data.routesDeepLink ? (
        <DetailSidebarLinkCard
          to={data.routesDeepLink}
          icon={<MapPin className="size-6 text-[#00453e]" strokeWidth={2} aria-hidden />}
        >
          <span className="text-sm font-semibold leading-snug text-[#0f3d36]">
            Δες όλες τις διαδρομές στο ίδιο πεδίο
          </span>
        </DetailSidebarLinkCard>
      ) : null}
    </>
  )

  return (
    <DetailPageLayout sidebar={sidebar}>
      <DetailHeader
        backHref={fromHistory}
        backLabel="Πίσω στο Ιστορικό"
        onBack={handleBack}
        title={data.title}
        fieldLine={data.fieldLabel}
        mountainLine={data.mountainLabel}
        dateLine={data.dateLabel}
        badges={badges}
        onEdit={handleEdit}
        onDelete={() => setShowDeleteModal(true)}
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

      {/* ── Delete confirmation modal ──────────────────────────────────────── */}
      {showDeleteModal ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 id="delete-modal-title" className="font-heading text-xl font-bold text-[#1a1c1e]">
              Διαγραφή δράσης;
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#475569]">
              {rawActivity?.isOfficial
                ? 'Η επίσημη δράση θα αφαιρεθεί οριστικά από το ιστορικό σας και από μελλοντικές εξαγωγές του συλλόγου. Η ενέργεια αυτή δεν μπορεί να αναιρεθεί.'
                : 'Η δράση θα αφαιρεθεί οριστικά από το ιστορικό σας. Η ενέργεια αυτή δεν μπορεί να αναιρεθεί.'}
            </p>
            {deleteError ? (
              <p role="alert" className="mt-3 rounded-lg border border-[#fca5a5] bg-[#fef2f2] px-3 py-2 text-sm text-[#b91c1c]">
                {deleteError}
              </p>
            ) : null}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteError(null)
                }}
                className="flex-1 rounded-lg border border-[#e2e8e0] bg-white py-2.5 text-sm font-semibold text-[#3f4947] transition hover:bg-[#f8fafc] disabled:opacity-60"
              >
                Ακύρωση
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {isDeleting ? 'Διαγραφή...' : 'Διαγραφή'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </DetailPageLayout>
  )
}
