import { Link } from 'react-router-dom'
import { Mountain } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext.tsx'

/**
 * Displayed by the router's catch-all `*` route.
 * Shows a friendly 404 message in Greek with a context-aware CTA:
 *   - Authenticated users → link to /app
 *   - Unauthenticated users → link to /login
 */
export function NotFoundPage() {
  const { isAuthenticated, isLoading } = useAuth()

  const ctaHref = isAuthenticated ? '/app' : '/login'
  const ctaLabel = isAuthenticated ? 'Επιστροφή στην αρχική' : 'Σύνδεση'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#f9f9fc] px-6 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-[#e6f0ee]">
        <Mountain className="size-10 text-[#00453e]" strokeWidth={1.5} aria-hidden />
      </div>

      <div className="space-y-2">
        <p className="font-heading text-6xl font-extrabold text-[#00453e]">404</p>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-[#022c22]">
          Η σελίδα δεν βρέθηκε
        </h1>
        <p className="max-w-sm text-sm leading-relaxed text-[#64748b]">
          Η διεύθυνση που ζητήσατε δεν αντιστοιχεί σε διαθέσιμη σελίδα.
        </p>
      </div>

      {!isLoading ? (
        <Link
          to={ctaHref}
          className="inline-flex items-center gap-2 rounded-xl bg-[#00453e] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#003a32]"
        >
          {ctaLabel}
          <span aria-hidden>→</span>
        </Link>
      ) : null}

      <p className="text-xs text-[#94a3b8]">
        <Link to="/" className="hover:text-[#005f56]">
          ← Αρχική σελίδα
        </Link>
      </p>
    </div>
  )
}
