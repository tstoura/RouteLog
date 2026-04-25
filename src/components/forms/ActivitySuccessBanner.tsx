import { Check, Plus } from 'lucide-react'

type Props = {
  onNewRoute: () => void
  onViewHistory: () => void
}

export function ActivitySuccessBanner({ onNewRoute, onViewHistory }: Props) {
  return (
    <div
      role="status"
      className="flex flex-col gap-4 rounded-xl border border-[#bbf7d0] bg-[#ecfdf5] p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-5"
    >
      <div className="flex min-w-0 gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#00453e] text-white" aria-hidden>
          <Check className="size-5" strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <p className="font-heading text-base font-bold text-[#022c22]">Η δράση καταχωρήθηκε επιτυχώς</p>
          <p className="mt-1 text-sm leading-relaxed text-[#64748b]">Τα στοιχεία σας έχουν καταγραφεί στη βάση δεδομένων του συλλόγου.</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:shrink-0 sm:items-end">
        <div className="flex flex-wrap items-start gap-2 sm:justify-end">
          <div className="flex min-w-[140px] flex-col gap-1">
            <button
              type="button"
              onClick={onNewRoute}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#00453e] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#003a32]"
            >
              <Plus className="size-4 shrink-0" strokeWidth={2.5} aria-hidden />
              Νέα Διαδρομή
            </button>
            <p className="text-xs leading-snug text-[#94a3b8]">Συνέχισε με νέα διαδρομή στο ίδιο πεδίο.</p>
          </div>
          <button
            type="button"
            onClick={onViewHistory}
            className="inline-flex items-center justify-center rounded-lg bg-[#00453e] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#003a32]"
          >
            Προβολή στο Ιστορικό
          </button>
        </div>
      </div>
    </div>
  )
}
