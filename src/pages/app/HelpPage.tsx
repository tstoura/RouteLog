import { Link } from 'react-router-dom'
import {
  BookOpen,
  HelpCircle,
  Star,
  Users,
  History,
  Edit,
  Shield,
  PlusCircle,
  Mountain,
} from 'lucide-react'
import { AppPageHeading } from '../../components/layout/AppPageHeading.tsx'

type HelpSection = {
  icon: React.ReactNode
  title: string
  body: React.ReactNode
}

const sections: HelpSection[] = [
  {
    icon: <BookOpen className="size-5 shrink-0 text-[#00453e]" strokeWidth={1.8} aria-hidden />,
    title: 'Πριν ξεκινήσετε',
    body: (
      <>
        Το RouteLog είναι ένα ψηφιακό ημερολόγιο ορειβατικών δραστηριοτήτων. Για περισσότερες
        πληροφορίες σχετικά με τον σκοπό δημιουργίας της εφαρμογής, μπορείτε να δείτε την ενότητα{' '}
        <Link to="/#about" className="font-medium text-[#00453e] underline underline-offset-2 hover:text-[#005f56]">
          «Σχετικά»
        </Link>{' '}
        στην αρχική σελίδα.
      </>
    ),
  },
  {
    icon: <PlusCircle className="size-5 shrink-0 text-[#00453e]" strokeWidth={1.8} aria-hidden />,
    title: 'Πώς ξεκινώ μια νέα καταγραφή;',
    body: 'Από την επιλογή «Καταγραφή Δράσης» επιλέγετε την κατηγορία δραστηριότητας και συμπληρώνετε τα βασικά στοιχεία της φόρμας. Αν είστε μέλος συλλόγου, μπορείτε να επιλέξετε αν η καταγραφή είναι προσωπική ή επίσημη.',
  },
  {
    icon: <Star className="size-5 shrink-0 text-[#00453e]" strokeWidth={1.8} aria-hidden />,
    title: 'Προσωπική ή επίσημη καταγραφή;',
    body: 'Οι προσωπικές καταγραφές αποθηκεύονται μόνο στο προσωπικό σας ιστορικό και δεν βαθμολογούνται με βαθμούς ΕΟΟΑ. Οι επίσημες καταγραφές είναι διαθέσιμες σε μέλη συλλόγου, ελέγχονται αυστηρότερα και μπορούν να χρησιμοποιηθούν για εξαγωγή δεδομένων.',
  },
  {
    icon: <HelpCircle className="size-5 shrink-0 text-[#00453e]" strokeWidth={1.8} aria-hidden />,
    title: 'Πότε εμφανίζονται βαθμοί ΕΟΟΑ;',
    body: 'Οι βαθμοί εμφανίζονται μόνο σε επίσημες καταγραφές, όταν έχουν συμπληρωθεί τα απαραίτητα πεδία. Η εφαρμογή υπολογίζει αυτόματα τους βαθμούς με βάση τους κανόνες βαθμολόγησης που έχουν ενσωματωθεί στο σύστημα.',
  },
  {
    icon: <Mountain className="size-5 shrink-0 text-[#00453e]" strokeWidth={1.8} aria-hidden />,
    title: 'Τι είναι οι αναρριχητικές διαδρομές;',
    body: 'Στην ενότητα «Διαδρομές» εμφανίζονται οι αναρριχητικές διαδρομές που υπάρχουν στη βάση της εφαρμογής. Οι διαδρομές μπορεί να έχουν προστεθεί από το σύστημα ή από χρήστες. Αν δεν βρίσκετε τη διαδρομή που αναζητάτε, μπορείτε να την προσθέσετε στη βάση και να τη χρησιμοποιήσετε στην καταγραφή σας.',
  },
  {
    icon: <Users className="size-5 shrink-0 text-[#00453e]" strokeWidth={1.8} aria-hidden />,
    title: 'Πώς δηλώνω σύλλογο;',
    body: 'Αν δεν έχετε δηλώσει σύλλογο κατά την εγγραφή, μπορείτε να το κάνετε από το προφίλ σας, επάνω δεξιά. Μέχρι τότε, οι δράσεις σας αποθηκεύονται ως προσωπικές καταγραφές.',
  },
  {
    icon: <History className="size-5 shrink-0 text-[#00453e]" strokeWidth={1.8} aria-hidden />,
    title: 'Πού βρίσκω τις καταγραφές μου;',
    body: 'Στο Ιστορικό μπορείτε να δείτε όλες τις δράσεις σας, να τις φιλτράρετε ανά κατηγορία ή έτος και να ανοίξετε τη σελίδα λεπτομερειών κάθε καταγραφής.',
  },
  {
    icon: <Edit className="size-5 shrink-0 text-[#00453e]" strokeWidth={1.8} aria-hidden />,
    title: 'Μπορώ να επεξεργαστώ ή να διαγράψω μια δράση;',
    body: 'Ναι. Από τη σελίδα λεπτομερειών μπορείτε να επεξεργαστείτε ή να διαγράψετε μια καταγραφή. Ο τύπος καταγραφής και η κατηγορία δεν αλλάζουν κατά την επεξεργασία.',
  },
  {
    icon: <Shield className="size-5 shrink-0 text-[#00453e]" strokeWidth={1.8} aria-hidden />,
    title: 'Τι κάνει ο διαχειριστής συλλόγου;',
    body: 'Ο διαχειριστής μπορεί να δει μέλη και επίσημες δράσεις του συλλόγου και να εξάγει τα επίσημα δεδομένα σε αρχείο Excel, στη δομή που ζητείται από την ΕΟΟΑ.',
  },
]

export function HelpPage() {
  return (
    <div className="flex flex-col gap-10">
      <AppPageHeading
        title="Βοήθεια"
        description="Σύντομες οδηγίες για τη χρήση του RouteLog."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sections.map((s) => (
          <div
            key={s.title}
            className="flex flex-col gap-3 rounded-2xl border border-[#e4e4e8] bg-white p-6 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.06)]"
          >
            <div className="flex items-center gap-2.5">
              {s.icon}
              <h2 className="text-sm font-bold uppercase tracking-[0.5px] text-[#1a1c1e]">
                {s.title}
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-[#475569]">{s.body}</p>
          </div>
        ))}
      </div>

      {/* Subtle MVP note */}
      <aside className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-5 py-4 text-sm leading-relaxed text-[#64748b]">
        <span className="font-semibold text-[#475569]">Σημείωση · </span>
        Η εφαρμογή βρίσκεται σε έκδοση MVP. Ορισμένες λειτουργίες, όπως η πληρέστερη υποστήριξη
        διαδρομών για όλες τις κατηγορίες, αποτελούν μελλοντική επέκταση.
      </aside>
    </div>
  )
}
