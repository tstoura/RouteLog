import { User, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth, isAdminUser } from '../../auth/AuthContext.tsx'

export function CTASection() {
  const { isAuthenticated, isLoading, user, logout } = useAuth()
  const appDest = isAdminUser(user) ? '/admin' : '/app'

  return (
    <section className="relative overflow-hidden px-6 py-24 sm:py-32">
      <div className="absolute inset-0 bg-[rgba(0,95,86,0.05)]" aria-hidden />
      <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 text-center">
        <h2 className="font-heading text-3xl font-extrabold text-[#1a1c1e] sm:text-4xl">
          {isAuthenticated ? 'Καλωσήρθατε πίσω!' : 'Ξεκινήστε Σήμερα!'}
        </h2>
        <p className="max-w-2xl text-lg leading-7 text-[#3f4947]">
          {isAuthenticated
            ? 'Συνεχίστε καταγράφοντας τις δραστηριότητές σας στο RouteLog.'
            : 'Γίνετε μέλος μιας κοινότητας αφοσιωμένων ορειβατών που εμπιστεύονται το RouteLog για τη διαχείριση των τεχνικών δεδομένων των δραστηριοτήτων τους.'}
        </p>

        {isLoading ? (
          /* Pulse placeholder — avoids register button flash for returning users */
          <div className="h-[66px] w-56 animate-pulse rounded-lg bg-[rgba(0,95,86,0.15)]" aria-hidden />
        ) : isAuthenticated ? (
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Link
              to={appDest}
              className="relative inline-flex items-center gap-3 rounded-lg bg-[#005f56] px-10 py-5 text-base font-semibold text-white shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] transition hover:bg-[#004a43]"
            >
              <ArrowRight className="size-5 shrink-0" strokeWidth={2} aria-hidden />
              Μετάβαση στην εφαρμογή
            </Link>
            <button
              type="button"
              onClick={logout}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#00453e]/30 px-7 py-4 text-base font-semibold text-[#00453e] transition hover:bg-[rgba(0,95,86,0.07)]"
            >
              Αποσύνδεση
            </button>
          </div>
        ) : (
          <Link
            to="/register"
            className="relative inline-flex items-center gap-3 rounded-lg bg-[#005f56] px-10 py-5 text-base font-semibold text-white shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] transition hover:bg-[#004a43]"
          >
            <User className="size-5 shrink-0 text-white" strokeWidth={2} aria-hidden />
            Δημιουργία Λογαριασμού
          </Link>
        )}
      </div>
    </section>
  )
}
