import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { APP_HOME_ASSETS } from '../../constants/appHomeAssets.ts'
import { ClockNavIcon, PlusNavIcon, RoutesNavIcon } from '../../components/icons/AppNavIcons.tsx'

export function HomePage() {
  return (
    <div className="flex flex-col gap-12">
      <header className="space-y-2">
        <h1 className="font-heading text-4xl font-extrabold tracking-tight text-[#1a1c1e] md:text-5xl md:leading-[48px] md:tracking-[-1.2px]">
          Καλώς ήρθες, Νίκο.
        </h1>
        <p className="text-lg font-medium text-[#526772]">Τι θέλεις να κάνεις σήμερα;</p>
      </header>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:grid-rows-[minmax(280px,auto)]">
        <Link
          to="/app/new"
          className="relative flex min-h-[280px] flex-col justify-between overflow-hidden rounded-2xl p-8 text-left shadow-[0px_20px_25px_-5px_rgba(0,69,62,0.1),0px_8px_10px_-6px_rgba(0,69,62,0.1)] lg:col-span-6"
          style={{
            backgroundImage: 'linear-gradient(135deg, rgb(0, 69, 62) 0%, rgb(0, 95, 86) 100%)',
          }}
        >
          <img
            src={APP_HOME_ASSETS.heroMountainArt}
            alt=""
            className="pointer-events-none absolute right-6 top-10 w-[110px] max-w-[40%] opacity-90"
            width={110}
            height={90}
          />
          <div className="relative z-10 space-y-2">
            <div className="flex size-12 items-center justify-center rounded-xl bg-white/20">
              <PlusNavIcon size={20} stroke="#ffffff" />
            </div>
            <h2 className="pt-4 font-heading text-2xl font-bold text-white">Καταγραφή Δράσης</h2>
            <p className="max-w-sm text-base font-medium leading-6 text-[#8cd6ca]">
              Καταχώρησε μια νέα δραστηριότητα
              <br />
              εύκολα και γρήγορα
            </p>
          </div>
          <div className="relative z-10 flex items-center gap-2 pt-6 text-sm font-semibold text-white">
            <span>ΕΝΑΡΞΗ ΤΩΡΑ</span>
            <ArrowRight className="size-4 shrink-0 text-white" strokeWidth={2} aria-hidden />
          </div>
        </Link>

        <Link
          to="/app/history"
          className="flex min-h-[280px] flex-col justify-between rounded-2xl border border-[rgba(190,201,198,0.1)] bg-white p-6 shadow-sm lg:col-span-3"
        >
          <div className="space-y-2">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#cfe6f2]">
              <ClockNavIcon size={18} stroke="#00453e" />
            </div>
            <h2 className="pt-2 font-heading text-lg font-bold text-[#1a1c1e]">Ιστορικό</h2>
            <p className="text-sm leading-relaxed text-[#3f4947]">
              Δες όλες τις
              <br />
              προηγούμενες
              <br />
              καταγραφές σου
            </p>
          </div>
          <p className="pt-4 text-xs font-semibold uppercase tracking-[1.2px] text-[#00453e]">ΠΡΟΒΟΛΗ</p>
        </Link>

        <Link
          to="/app/routes"
          className="flex min-h-[280px] flex-col justify-between rounded-2xl border border-[rgba(190,201,198,0.1)] bg-white p-6 shadow-sm lg:col-span-3"
        >
          <div className="space-y-2">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#cfe6f2]">
              <RoutesNavIcon size={18} colorClass="text-[#00453e]" />
            </div>
            <h2 className="pt-2 font-heading text-lg font-bold text-[#1a1c1e]">Διαδρομές</h2>
            <p className="text-sm leading-relaxed text-[#3f4947]">
              Ανακάλυψε διαδρομές
              <br />
              και χρήσιμες
              <br />
              πληροφορίες
            </p>
          </div>
          <p className="pt-4 text-xs font-semibold uppercase tracking-[1.2px] text-[#00453e]">ΕΞΕΡΕΥΝΗΣΗ</p>
        </Link>
      </section>

      <section className="space-y-6 pt-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-heading text-xs font-extrabold uppercase tracking-[2.4px] text-[#4c616c]">
            ΓΡΗΓΟΡΗ ΠΡΟΣΒΑΣΗ ΑΝΑ ΚΑΤΗΓΟΡΙΑ
          </p>
          <div className="hidden h-px flex-1 bg-[rgba(190,201,198,0.2)] sm:ml-6 sm:block" />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <CategoryTile
            to="/app/new/hiking"
            image={APP_HOME_ASSETS.categoryHiking}
            eyebrow="ΔΡΑΣΤΗΡΙΟΤΗΤΑ"
            title={
              <>
                Ορειβασία / Ορειβατικό
                <br />
                Σκι
              </>
            }
            cta="Δες διαδρομές"
          />
          <CategoryTile
            to="/app/new/climbing"
            image={APP_HOME_ASSETS.categoryClimbing}
            eyebrow="ΔΡΑΣΤΗΡΙΟΤΗΤΑ"
            title="Αναρρίχηση Βράχου"
            cta="Δες πεδία & διαδρομές"
          />
          <CategoryTile
            to="/app/new/expedition"
            image={APP_HOME_ASSETS.categoryExpedition}
            eyebrow="ΔΡΑΣΤΗΡΙΟΤΗΤΑ"
            title="Αποστολές Εξωτερικού"
            cta="Δες καταγραφές"
          />
        </div>
      </section>
    </div>
  )
}

function CategoryTile({
  to,
  image,
  eyebrow,
  title,
  cta,
}: {
  to: string
  image: string
  eyebrow: string
  title: ReactNode
  cta: string
}) {
  return (
    <Link
      to={to}
      className="group relative aspect-[4/3] overflow-hidden rounded-2xl shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
    >
      <img src={image} alt="" className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-105" />
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute bottom-0 left-0 right-0 flex flex-col gap-1 p-6 text-left">
        <span className="text-[10px] font-semibold uppercase tracking-[1px] text-white/80">{eyebrow}</span>
        <span className="pb-2 font-heading text-xl font-bold leading-snug text-white">{title}</span>
        <span className="inline-flex w-fit rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
          {cta}
        </span>
      </div>
    </Link>
  )
}
