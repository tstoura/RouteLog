import { useCallback, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ActivityFormLayout } from '../../components/forms/ActivityFormLayout.tsx'
import { ActivitySuccessBanner } from '../../components/forms/ActivitySuccessBanner.tsx'
import { RockClimbingActivityForm } from '../../components/forms/RockClimbingActivityForm.tsx'
import type { ActivityFormTabKind } from '../../components/forms/shared/FormBuildingBlocks.tsx'

export function RockClimbingFormPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const routeSlug = searchParams.get('route')
  const [showSuccess, setShowSuccess] = useState(false)
  const [formKey, setFormKey] = useState(0)

  const handleMockSubmitSuccess = () => {
    setShowSuccess(true)
    navigate('/app/new/climbing', { replace: true })
    setFormKey((k) => k + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBannerNewRoute = () => {
    setShowSuccess(false)
    navigate('/app/new/climbing', { replace: true })
    setFormKey((k) => k + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleActivityTabSelect = useCallback(
    (kind: ActivityFormTabKind) => {
      setShowSuccess(false)
      if (kind === 'climbing') {
        navigate('/app/new/climbing', { replace: true })
        setFormKey((k) => k + 1)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
      const paths: Record<Exclude<ActivityFormTabKind, 'climbing'>, string> = {
        hiking: '/app/new/hiking',
        expedition: '/app/new/expedition',
      }
      navigate(paths[kind])
    },
    [navigate],
  )

  return (
    <ActivityFormLayout
      title="Καταγραφή Δράσης"
      description="Αναρρίχηση Βράχου"
      beforeContent={
        showSuccess ? (
          <ActivitySuccessBanner
            onNewRoute={handleBannerNewRoute}
            onViewHistory={() => navigate('/app/history')}
          />
        ) : null
      }
    >
      <RockClimbingActivityForm
        key={`${formKey}-${routeSlug ?? ''}`}
        initialRouteSlug={routeSlug}
        onMockSubmitSuccess={handleMockSubmitSuccess}
        onActivityTabSelect={handleActivityTabSelect}
      />
    </ActivityFormLayout>
  )
}
