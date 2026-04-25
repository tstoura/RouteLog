import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ActivityFormLayout } from '../../components/forms/ActivityFormLayout.tsx'
import { ActivitySuccessBanner } from '../../components/forms/ActivitySuccessBanner.tsx'
import { ExpeditionActivityForm } from '../../components/forms/ExpeditionActivityForm.tsx'
import type { ActivityFormTabKind } from '../../components/forms/shared/FormBuildingBlocks.tsx'

export function ExpeditionFormPage() {
  const navigate = useNavigate()
  const [showSuccess, setShowSuccess] = useState(false)
  const [formKey, setFormKey] = useState(0)

  const handleMockSubmitSuccess = () => {
    setShowSuccess(true)
    navigate('/app/new/expedition', { replace: true })
    setFormKey((k) => k + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBannerNewRoute = () => {
    setShowSuccess(false)
    navigate('/app/new/expedition', { replace: true })
    setFormKey((k) => k + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleActivityTabSelect = useCallback(
    (kind: ActivityFormTabKind) => {
      setShowSuccess(false)
      if (kind === 'expedition') {
        navigate('/app/new/expedition', { replace: true })
        setFormKey((k) => k + 1)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
      navigate(kind === 'climbing' ? '/app/new/climbing' : '/app/new/hiking')
    },
    [navigate],
  )

  return (
    <ActivityFormLayout
      title="Καταγραφή Δράσης"
      description="Αποστολές Εξωτερικού"
      beforeContent={
        showSuccess ? (
          <ActivitySuccessBanner
            onNewRoute={handleBannerNewRoute}
            onViewHistory={() => navigate('/app/history')}
          />
        ) : null
      }
    >
      <ExpeditionActivityForm
        key={formKey}
        onMockSubmitSuccess={handleMockSubmitSuccess}
        onActivityTabSelect={handleActivityTabSelect}
      />
    </ActivityFormLayout>
  )
}
