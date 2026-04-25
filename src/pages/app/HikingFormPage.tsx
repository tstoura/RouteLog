import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ActivityFormLayout } from '../../components/forms/ActivityFormLayout.tsx'
import { ActivitySuccessBanner } from '../../components/forms/ActivitySuccessBanner.tsx'
import { HikingActivityForm } from '../../components/forms/HikingActivityForm.tsx'
import type { ActivityFormTabKind } from '../../components/forms/shared/FormBuildingBlocks.tsx'

export function HikingFormPage() {
  const navigate = useNavigate()
  const [showSuccess, setShowSuccess] = useState(false)
  const [formKey, setFormKey] = useState(0)

  const handleMockSubmitSuccess = () => {
    setShowSuccess(true)
    navigate('/app/new/hiking', { replace: true })
    setFormKey((k) => k + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBannerNewRoute = () => {
    setShowSuccess(false)
    navigate('/app/new/hiking', { replace: true })
    setFormKey((k) => k + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleActivityTabSelect = useCallback(
    (kind: ActivityFormTabKind) => {
      setShowSuccess(false)
      if (kind === 'hiking') {
        navigate('/app/new/hiking', { replace: true })
        setFormKey((k) => k + 1)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
      navigate(kind === 'climbing' ? '/app/new/climbing' : '/app/new/expedition')
    },
    [navigate],
  )

  return (
    <ActivityFormLayout
      title="Καταγραφή Δράσης"
      description="Ορειβασία / Ορειβατικό Σκι"
      beforeContent={
        showSuccess ? (
          <ActivitySuccessBanner
            onNewRoute={handleBannerNewRoute}
            onViewHistory={() => navigate('/app/history')}
          />
        ) : null
      }
    >
      <HikingActivityForm key={formKey} onMockSubmitSuccess={handleMockSubmitSuccess} onActivityTabSelect={handleActivityTabSelect} />
    </ActivityFormLayout>
  )
}
