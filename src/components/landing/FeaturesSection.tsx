import { ClockNavIcon, PlusNavIcon, RoutesNavIcon } from '../icons/AppNavIcons.tsx'
import { FeatureCard } from './FeatureCard.tsx'

export function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-24 bg-[#f2f5f3] py-24">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-16 px-6">
        <header className="space-y-2">
          <h2 className="font-heading text-3xl font-bold text-[#1a1c1e]">Τεχνικές Δυνατότητες</h2>
          <div className="h-1 w-20 rounded-full bg-[#005f56]" aria-hidden />
        </header>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            title="Καταγραφή Δράσεων"
            description="Εισαγωγή δραστηριοτήτων με δομημένα δεδομένα"
            iconBoxClassName="bg-[#005f56]"
            smallIcon={<PlusNavIcon size={20} stroke="#ffffff" />}
            watermark={<PlusNavIcon size={72} stroke="rgba(0, 95, 86, 0.2)" />}
          />
          <FeatureCard
            title="Διαδρομές"
            description="Ανακάλυψε διαδρομές και χρήσιμες πληροφορίες"
            iconBoxClassName="bg-[#cfe6f2]"
            smallIcon={<RoutesNavIcon size={20} colorClass="text-[#00453e]" />}
            watermark={<RoutesNavIcon size={72} colorClass="text-[#00453e]" />}
          />
          <FeatureCard
            title="Ιστορικό Δραστηριοτήτων"
            description="Όλες οι δράσεις σας σε ένα σημείο"
            iconBoxClassName="bg-[#e8eef0]"
            smallIcon={<ClockNavIcon size={20} stroke="#475569" />}
            watermark={<ClockNavIcon size={72} stroke="#00453e" />}
          />
        </div>
      </div>
    </section>
  )
}
