import type { ReactNode } from 'react'
import { AuthBackdrop } from './AuthBackdrop.tsx'

type Props = {
  /** White modal card content */
  modal: ReactNode
  /** Optional content below the card (e.g. extra links outside the modal) */
  belowCard?: ReactNode
}

export function AuthPageShell({ modal, belowCard }: Props) {
  return (
    <div className="relative flex min-h-[calc(100dvh-4.5rem)] flex-1 flex-col items-center justify-center px-4 py-10 sm:py-14">
      <AuthBackdrop />
      <div className={`relative z-10 flex w-full max-w-[440px] flex-col items-stretch ${belowCard ? 'gap-6' : ''}`}>
        {modal}
        {belowCard ?? null}
      </div>
    </div>
  )
}
