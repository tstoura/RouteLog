import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { AppPageHeading } from '../../components/layout/AppPageHeading.tsx'
import { getActivityById, type ActivityListItem } from '../../api/activities.ts'
import { HikingEditForm } from '../../components/forms/HikingEditForm.tsx'
import { ClimbingEditForm } from '../../components/forms/ClimbingEditForm.tsx'
import { ExpeditionEditForm } from '../../components/forms/ExpeditionEditForm.tsx'

// ── Titles per category ───────────────────────────────────────────────────────

function pageTitle(category: string): string {
  if (category === 'hiking') return 'Επεξεργασία Ορειβατικής Δράσης'
  if (category === 'climbing') return 'Επεξεργασία Αναρριχητικής Δράσης'
  if (category === 'expedition') return 'Επεξεργασία Αποστολής'
  return 'Επεξεργασία Δράσης'
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function EditActivityPage() {
  const { activitySlug } = useParams<{ activitySlug: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  // Thread fromHistory through the entire edit flow so the detail page can
  // return to the exact history state after the user finishes editing.
  const fromHistory: string =
    (location.state as { fromHistory?: string } | null)?.fromHistory ?? '/app/history'

  const detailState = { fromHistory }

  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [activity, setActivity] = useState<ActivityListItem | null>(null)

  useEffect(() => {
    if (!activitySlug) {
      setLoadError('Μη έγκυρο αναγνωριστικό δραστηριότητας.')
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setLoadError(null)
    getActivityById(activitySlug)
      .then((a) => setActivity(a))
      .catch((err: unknown) => {
        setLoadError(
          err instanceof Error ? err.message : 'Σφάλμα φόρτωσης δραστηριότητας.',
        )
      })
      .finally(() => setIsLoading(false))
  }, [activitySlug])

  const handleSaved = useCallback(
    (_updated: ActivityListItem) => {
      navigate(`/app/history/${activitySlug}`, { replace: true, state: detailState })
    },
    // detailState is stable (derived from location.state which doesn't change)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [navigate, activitySlug, fromHistory],
  )

  const handleCancel = useCallback(() => {
    navigate(`/app/history/${activitySlug}`, { replace: true, state: detailState })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, activitySlug, fromHistory])

  // ── Loading / error states ──────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="rounded-xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-10 text-center">
        <p className="text-sm text-[#64748b]">Φόρτωση δραστηριότητας...</p>
      </div>
    )
  }

  if (loadError || !activity) {
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

  const title = pageTitle(activity.category)

  // ── Layout wrapper ──────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Link
          to={`/app/history/${activitySlug}`}
          replace
          state={detailState}
          className="text-sm font-medium text-[#005f56] hover:underline"
        >
          ← Επιστροφή στη Δράση
        </Link>
        <AppPageHeading title={title} />
      </div>

      {/* Render the appropriate edit form based on activity category */}
      {activity.category === 'hiking' && activity.hikingDetail ? (
        <HikingEditForm
          activity={activity as ActivityListItem & { hikingDetail: NonNullable<ActivityListItem['hikingDetail']> }}
          onSaved={handleSaved}
          onCancel={handleCancel}
        />
      ) : activity.category === 'climbing' && activity.climbingDetail ? (
        <ClimbingEditForm
          activity={activity as ActivityListItem & { climbingDetail: NonNullable<ActivityListItem['climbingDetail']> }}
          onSaved={handleSaved}
          onCancel={handleCancel}
        />
      ) : activity.category === 'expedition' && activity.expeditionDetail ? (
        <ExpeditionEditForm
          activity={activity as ActivityListItem & { expeditionDetail: NonNullable<ActivityListItem['expeditionDetail']> }}
          onSaved={handleSaved}
          onCancel={handleCancel}
        />
      ) : (
        <div className="rounded-xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-10 text-center">
          <p className="text-sm text-[#64748b]">
            Μη υποστηριζόμενος τύπος δραστηριότητας.
          </p>
        </div>
      )}
    </div>
  )
}
