import { Link } from 'react-router-dom'
import { AppPageHeading } from '../../components/layout/AppPageHeading.tsx'
import { Card } from '../../components/ui/Card.tsx'

const options = [
  {
    to: '/app/new/hiking',
    title: 'Ορειβασία / πεζοπορία',
    description: 'Καταγραφή διαδρομών και υψομέτρων.',
  },
  {
    to: '/app/new/climbing',
    title: 'Αναρρίχηση βράχου',
    description: 'Κλιμακωτές αναβάσεις και τεχνικά πεδία.',
  },
  {
    to: '/app/new/expedition',
    title: 'Αποστολή εξωτερικού',
    description: 'Πολυήμερες αποστολές και logistics.',
  },
] as const

export function NewActivityPage() {
  return (
    <div className="space-y-8">
      <AppPageHeading
        title="Καταγραφή Δράσης"
        description="Επιλέξτε τύπο δραστηριότητας — οι φόρμες είναι πρωτότυπα πλαίσια."
      />
      <ul className="space-y-3">
        {options.map((o) => (
          <li key={o.to}>
            <Link to={o.to}>
              <Card className="p-4 transition hover:border-[#005f56]/40 hover:shadow-md">
                <p className="font-heading font-semibold text-[#022c22]">{o.title}</p>
                <p className="mt-1 text-sm text-[#64748b]">{o.description}</p>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
