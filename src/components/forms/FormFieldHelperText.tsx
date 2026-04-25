import type { ReactNode } from 'react'

/** Green helper line for route-driven autofill (uppercase, matches other form hints). */
export function FormFieldHelperText({ children }: { children: ReactNode }) {
  return <p className="text-[11px] font-semibold uppercase leading-snug tracking-wide text-[#0f766e]">{children}</p>
}
