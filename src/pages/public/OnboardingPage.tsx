import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthModalCard } from '../../components/auth/AuthModalCard.tsx'
import { AuthLabeledField } from '../../components/auth/AuthLabeledField.tsx'
import { RouteLogLogoMark } from '../../components/brand/RouteLogLogoMark.tsx'
import { ScrollToTop } from '../../components/layout/ScrollToTop.tsx'
import { Select } from '../../components/ui/Select.tsx'
import { APP_LAYOUT_CREDIT } from '../../constants/appCredit.ts'

const MOCK_CLUBS = [
  { value: '', label: 'Επιλέξτε σύλλογο' },
  { value: 'eos-ath', label: 'Ε.Ο.Σ. Αθηνών' },
  { value: 'eos-thess', label: 'Ε.Ο.Σ. Θεσσαλονίκης' },
  { value: 'eos-patra', label: 'Ε.Ο.Σ. Πατρών' },
  { value: 'other', label: 'Άλλος σύλλογος' },
]

function MountainHeaderArt() {
  return (
    <div className="relative h-28 overflow-hidden bg-gradient-to-b from-[#e2e8f0] to-white" aria-hidden>
      <svg className="absolute bottom-0 left-0 right-0 h-20 w-full text-[#cbd5e1]" viewBox="0 0 400 80" preserveAspectRatio="none">
        <path
          fill="currentColor"
          opacity="0.45"
          d="M0,80 L0,45 L55,20 L100,50 L150,12 L210,55 L280,8 L340,48 L400,25 L400,80 Z"
        />
        <path
          fill="currentColor"
          opacity="0.25"
          d="M0,80 L0,55 L80,28 L160,60 L240,18 L320,50 L400,32 L400,80 Z"
        />
      </svg>
    </div>
  )
}

export function OnboardingPage() {
  const navigate = useNavigate()
  const [clubMember, setClubMember] = useState<'yes' | 'no'>('yes')
  const [clubId, setClubId] = useState('')
  const [registryNumber, setRegistryNumber] = useState('')

  const goApp = () => navigate('/app')

  return (
    <div className="flex min-h-screen flex-col bg-[#f1f5f9] text-[#1a1c1e]">
      <ScrollToTop />
      <header className="shrink-0 px-5 pb-2 pt-5 sm:px-8 sm:pt-6">
        <RouteLogLogoMark size="lg" />
        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#94a3b8]">TRACK YOUR ADVENTURES</p>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 pb-6 pt-2 sm:px-6 sm:pb-8">
        <AuthModalCard className="w-full max-w-md overflow-hidden p-0 shadow-[0_20px_45px_-20px_rgba(15,23,42,0.2)]">
          <MountainHeaderArt />
          <div className="px-5 pb-6 pt-1 sm:px-7 sm:pb-7">
            <div className="space-y-1.5 text-center">
              <h1 className="font-heading text-xl font-bold tracking-tight text-[#00453e] sm:text-2xl">Καλώς ήρθατε στο RouteLog</h1>
              <p className="text-sm leading-relaxed text-[#64748b]">Πείτε μας λίγα πράγματα για εσάς για να ξεκινήσετε</p>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <p className="text-left text-sm font-semibold text-[#334155]">Είστε μέλος ορειβατικού συλλόγου;</p>
                <div className="mt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setClubMember('yes')}
                    className={[
                      'flex-1 rounded-xl border-2 py-3 text-sm font-semibold transition',
                      clubMember === 'yes'
                        ? 'border-[#00453e] bg-white text-[#00453e] shadow-sm'
                        : 'border-transparent bg-[#e8edf2] text-[#64748b] hover:bg-[#dfe6ee]',
                    ].join(' ')}
                  >
                    Ναι
                  </button>
                  <button
                    type="button"
                    onClick={() => setClubMember('no')}
                    className={[
                      'flex-1 rounded-xl border-2 py-3 text-sm font-semibold transition',
                      clubMember === 'no'
                        ? 'border-[#00453e] bg-white text-[#00453e] shadow-sm'
                        : 'border-transparent bg-[#e8edf2] text-[#64748b] hover:bg-[#dfe6ee]',
                    ].join(' ')}
                  >
                    Όχι
                  </button>
                </div>
              </div>

              {clubMember === 'yes' ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="onboarding-club" className="block text-[11px] font-bold uppercase tracking-[0.08em] text-[#64748b]">
                      ΣΥΛΛΟΓΟΣ
                    </label>
                    <Select
                      id="onboarding-club"
                      value={clubId}
                      onChange={(e) => setClubId(e.target.value)}
                      className="h-12 w-full rounded-xl border border-[#e2e8f0] bg-[#f1f5f9] py-2.5 text-sm font-medium text-[#334155]"
                    >
                      {MOCK_CLUBS.map((o) => (
                        <option key={o.value || 'placeholder'} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <AuthLabeledField
                    label="ΑΡΙΘΜΟΣ ΜΗΤΡΩΟΥ (ΠΡΟΑΙΡΕΤΙΚΑ)"
                    name="registry"
                    value={registryNumber}
                    onChange={(e) => setRegistryNumber(e.target.value)}
                    placeholder="Εισάγετε τον προσωπικό σας αριθμό μέλους"
                    autoComplete="off"
                  />
                </div>
              ) : null}

              <button
                type="button"
                onClick={goApp}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#00453e] py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#003a32]"
              >
                Συνέχεια
                <span aria-hidden>→</span>
              </button>

              <button
                type="button"
                onClick={goApp}
                className="w-full cursor-pointer py-1.5 text-center text-sm font-semibold text-[#64748b] transition hover:text-[#334155]"
              >
                Παράλειψη
              </button>
            </div>
          </div>
        </AuthModalCard>
      </main>

      <footer className="shrink-0 py-5 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-[#94a3b8] sm:py-6">
        {APP_LAYOUT_CREDIT}
      </footer>
    </div>
  )
}
