import { User } from 'lucide-react'
import { Link } from 'react-router-dom'

export function CTASection() {
  return (
    <section className="relative overflow-hidden px-6 py-24 sm:py-32">
      <div className="absolute inset-0 bg-[rgba(0,95,86,0.05)]" aria-hidden />
      <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 text-center">
        <h2 className="font-heading text-3xl font-extrabold text-[#1a1c1e] sm:text-4xl">Ξεκινήστε Σήμερα!</h2>
        <p className="max-w-2xl text-lg leading-7 text-[#3f4947]">
          Γίνετε μέλος μιας κοινότητας αφοσιωμένων ορειβατών που εμπιστεύονται το RouteLog για τη
          διαχείριση των τεχνικών δεδομένων των δραστηριοτήτων τους.
        </p>
        <Link
          to="/register"
          className="relative inline-flex items-center gap-3 rounded-lg bg-[#005f56] px-10 py-5 text-base font-semibold text-white shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] transition hover:bg-[#004a43]"
        >
          <User className="size-5 shrink-0 text-white" strokeWidth={2} aria-hidden />
          Δημιουργία Λογαριασμού
        </Link>
      </div>
    </section>
  )
}
