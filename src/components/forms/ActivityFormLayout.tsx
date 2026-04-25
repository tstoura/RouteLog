import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AppPageHeading } from '../layout/AppPageHeading.tsx'

type Props = {
  title: string
  description?: string
  /** Content rendered above the form (e.g. success banner). */
  beforeContent?: ReactNode
  children: ReactNode
}

export function ActivityFormLayout({ title, description, beforeContent, children }: Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Link to="/app/new" className="text-sm font-medium text-[#005f56] hover:underline">
          ← Επιστροφή στην επιλογή τύπου
        </Link>
        <AppPageHeading title={title} description={description} />
      </div>
      {beforeContent ? <div className="space-y-4">{beforeContent}</div> : null}
      {children}
    </div>
  )
}
