import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppPageHeading } from '../../components/layout/AppPageHeading.tsx'

const options = [
  {
    to: '/app/new/hiking',
    title: 'Ορειβασία / πεζοπορία',
    description: 'Για αναβάσεις, πεζοπορικές διαδρομές και ορειβατικές εξορμήσεις.',
    cta: 'Νέα ορειβατική δράση',
  },
  {
    to: '/app/new/climbing',
    title: 'Αναρρίχηση βράχου',
    description: 'Για αναρριχητικές διαδρομές με πεδίο, βαθμό δυσκολίας και τεχνικά στοιχεία.',
    cta: 'Νέα αναρριχητική δράση',
  },
  {
    to: '/app/new/expedition',
    title: 'Αποστολές εξωτερικού',
    description: 'Για πολυήμερες αποστολές και αναβάσεις σε βουνά του εξωτερικού.',
    cta: 'Νέα αποστολή',
  },
] as const

export function NewActivityPage() {
  return (
    <div className="space-y-8">
      <AppPageHeading
        title="Καταγραφή Δράσης"
        description="Επιλέξτε τον τύπο δραστηριότητας που θέλετε να καταγράψετε. Μπορείτε να δημιουργήσετε επίσημη καταγραφή για τον σύλλογο ή προσωπική καταγραφή για το αρχείο σας."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {options.map((o) => (
          <Link
            key={o.to}
            to={o.to}
            className="group flex flex-col justify-between gap-4 rounded-2xl border border-[#e2e8e0] bg-white p-6 shadow-sm transition hover:border-[#00453e]/40 hover:shadow-md"
          >
            <div className="space-y-1.5">
              <p className="font-heading font-semibold text-[#022c22]">{o.title}</p>
              <p className="text-sm leading-relaxed text-[#64748b]">{o.description}</p>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-[#005f56] transition group-hover:gap-2.5">
              <span>{o.cta}</span>
              <ArrowRight className="size-4 shrink-0" strokeWidth={2} aria-hidden />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
