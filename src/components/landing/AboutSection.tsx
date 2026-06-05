import { User, Users, Building2, Mountain } from 'lucide-react'

const cards = [
  {
    icon: <User className="size-5 shrink-0 text-[#005f56]" strokeWidth={1.8} aria-hidden />,
    title: 'Για μεμονωμένους χρήστες',
    text: 'Προσωπικό αρχείο δραστηριοτήτων, ανεξάρτητα από συμμετοχή σε σύλλογο.',
  },
  {
    icon: <Users className="size-5 shrink-0 text-[#005f56]" strokeWidth={1.8} aria-hidden />,
    title: 'Για τα μέλη συλλόγων',
    text: 'Καταγραφή προσωπικών και επίσημων δράσεων, με οργανωμένο ιστορικό.',
  },
  {
    icon: <Building2 className="size-5 shrink-0 text-[#005f56]" strokeWidth={1.8} aria-hidden />,
    title: 'Για τους συλλόγους',
    text: 'Συγκεντρωμένες επίσημες καταγραφές, βαθμολόγηση όπου απαιτείται και εξαγωγή δεδομένων.',
  },
  {
    icon: <Mountain className="size-5 shrink-0 text-[#005f56]" strokeWidth={1.8} aria-hidden />,
    title: 'Για τις αναρριχητικές διαδρομές',
    text: 'Σχόλια και αξιολογήσεις που βοηθούν τους χρήστες να ενημερώνονται πριν από την ανάβαση.',
  },
]

export function AboutSection() {
  return (
    <section id="about" className="scroll-mt-20 bg-white py-12">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-8 px-6">

        {/* Heading */}
        <header className="max-w-2xl space-y-2">
          <h2 className="font-heading text-3xl font-bold text-[#1a1c1e]">
            Γιατί δημιουργήθηκε το RouteLog
          </h2>
          <div className="h-1 w-20 rounded-full bg-[#005f56]" aria-hidden />
        </header>

        {/* Body text */}
        <div className="max-w-3xl space-y-4 text-base leading-7 text-[#3f4947]">
          <p>
            Το RouteLog δημιουργήθηκε για να απλοποιήσει την καταγραφή ορειβατικών
            δραστηριοτήτων και να μειώσει τα λάθη που προκύπτουν όταν οι δράσεις
            συγκεντρώνονται εκ των υστέρων, συχνά μέσα από αρχεία Excel.
          </p>
          <p>
            Στόχος είναι κάθε μέλος να μπορεί να καταγράφει τη δράση του κοντά στον
            χρόνο πραγματοποίησής της, ενώ ο σύλλογος να έχει πιο οργανωμένη εικόνα
            των επίσημων δραστηριοτήτων του.
          </p>
          <p>
            Η εφαρμογή μπορεί επίσης να χρησιμοποιηθεί από χρήστες που δεν ανήκουν
            σε κάποιον σύλλογο, ως προσωπικό αρχείο των δραστηριοτήτων που
            πραγματοποιούν.
          </p>
          <p>
            Παράλληλα, για τις αναρριχητικές διαδρομές υποστηρίζεται η καταγραφή
            σχολίων και αξιολογήσεων, ώστε οι χρήστες να μπορούν να μοιράζονται
            πρακτικές πληροφορίες και εμπειρίες που βοηθούν στην καλύτερη
            προετοιμασία επόμενων αναβάσεων.
          </p>
        </div>

        {/* Value cards — 1 col mobile / 2 col md / 4 col xl */}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((c) => (
            <div
              key={c.title}
              className="flex flex-col gap-3 rounded-2xl border border-[#e5ebe8] bg-[#f7f9f8] p-5"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-[rgba(0,95,86,0.08)]">
                {c.icon}
              </div>
              <div className="space-y-1.5">
                <h3 className="font-heading text-base font-bold text-[#1a1c1e]">{c.title}</h3>
                <p className="text-sm leading-relaxed text-[#526772]">{c.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Academic note — subtle, visually lighter */}
        <aside className="rounded-xl border border-[#e5ebe8] bg-[#f7f9f8] px-6 py-4 text-sm leading-relaxed text-[#64748b]">
          <span className="font-semibold text-[#475569]">Ακαδημαϊκό πλαίσιο · </span>
          Η εφαρμογή αναπτύχθηκε στο πλαίσιο διπλωματικής εργασίας, της φοιτήτριας
          Θεοδώρας Στούρα, στο Τμήμα Ηλεκτρολόγων Μηχανικών και Τεχνολογίας
          Υπολογιστών του Πανεπιστημίου Πατρών, υπό την καθοδήγηση του καθηγητή
          Χρήστου Σιντόρη.
        </aside>

      </div>
    </section>
  )
}
