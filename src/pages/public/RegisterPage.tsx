import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, Mountain } from 'lucide-react'
import { AuthDividerWithLabel } from '../../components/auth/AuthDividerWithLabel.tsx'
import { AuthIconCircle } from '../../components/auth/AuthIconCircle.tsx'
import { AuthLabeledField } from '../../components/auth/AuthLabeledField.tsx'
import { AuthModalCard } from '../../components/auth/AuthModalCard.tsx'
import { AuthPageShell } from '../../components/auth/AuthPageShell.tsx'
import { GoogleSignInButton } from '../../components/auth/GoogleSignInButton.tsx'

type ActivityPref = 'hiking' | 'climbing'

export function RegisterPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [activityPref, setActivityPref] = useState<ActivityPref>('hiking')

  const modal = (
    <AuthModalCard>
      <div className="flex flex-col items-center text-center">
        <AuthIconCircle>
          <Mountain className="size-7" strokeWidth={2} aria-hidden />
        </AuthIconCircle>
        <h1 className="mt-5 font-heading text-2xl font-bold tracking-tight text-[#022c22]">Δημιουργία Λογαριασμού</h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#64748b]">Δημιουργήστε τον λογαριασμό σας στο RouteLog</p>
      </div>

      <div className="mt-6 space-y-4">
        <GoogleSignInButton onClick={() => {}} />
        <AuthDividerWithLabel label="ή" />
      </div>

      <form
        className="mt-2 space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          navigate('/onboarding')
        }}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AuthLabeledField label="ΟΝΟΜΑ" placeholder="π.χ. Ιωάννης" name="firstName" autoComplete="given-name" />
          <AuthLabeledField label="ΕΠΩΝΥΜΟ" placeholder="π.χ. Παπαδόπουλος" name="lastName" autoComplete="family-name" />
        </div>

        <AuthLabeledField
          label="EMAIL"
          leftIcon={<Mail className="size-[18px]" strokeWidth={2} aria-hidden />}
          type="email"
          name="email"
          autoComplete="email"
          placeholder="example@email.com"
        />

        <AuthLabeledField
          label="ΚΩΔΙΚΟΣ ΠΡΟΣΒΑΣΗΣ"
          leftIcon={<Lock className="size-[18px]" strokeWidth={2} aria-hidden />}
          name="password"
          autoComplete="new-password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Εισάγετε τον κωδικό σας"
          rightSlot={
            <button
              type="button"
              className="cursor-pointer rounded-lg p-2 text-[#64748b] transition hover:bg-white/80 hover:text-[#334155]"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Απόκρυψη κωδικού' : 'Εμφάνιση κωδικού'}
            >
              {showPassword ? <EyeOff className="size-5" strokeWidth={2} /> : <Eye className="size-5" strokeWidth={2} />}
            </button>
          }
        />

        <AuthLabeledField
          label="ΕΠΙΒΕΒΑΙΩΣΗ ΚΩΔΙΚΟΥ"
          leftIcon={<Lock className="size-[18px]" strokeWidth={2} aria-hidden />}
          name="confirmPassword"
          autoComplete="new-password"
          type={showConfirm ? 'text' : 'password'}
          placeholder="Επιβεβαιώστε τον κωδικό σας"
          rightSlot={
            <button
              type="button"
              className="cursor-pointer rounded-lg p-2 text-[#64748b] transition hover:bg-white/80 hover:text-[#334155]"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? 'Απόκρυψη επιβεβαίωσης' : 'Εμφάνιση επιβεβαίωσης'}
            >
              {showConfirm ? <EyeOff className="size-5" strokeWidth={2} /> : <Eye className="size-5" strokeWidth={2} />}
            </button>
          }
        />

        <div className="space-y-3 pt-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#64748b]">ΠΡΟΤΙΜΗΣΗ ΔΡΑΣΤΗΡΙΟΤΗΤΑΣ (ΠΡΟΑΙΡΕΤΙΚΟ)</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => setActivityPref('hiking')}
              className={[
                'flex-1 cursor-pointer rounded-xl border px-4 py-3 text-center text-sm font-semibold transition',
                activityPref === 'hiking'
                  ? 'border-[#cbd5e1] bg-[#e2e8e0] text-[#022c22]'
                  : 'border-transparent bg-[#f1f5f9] text-[#64748b] hover:bg-[#e8edf2]',
              ].join(' ')}
            >
              Ορειβασία / Ορειβατικό Σκι
            </button>
            <button
              type="button"
              onClick={() => setActivityPref('climbing')}
              className={[
                'flex-1 cursor-pointer rounded-xl border px-4 py-3 text-center text-sm font-semibold transition',
                activityPref === 'climbing'
                  ? 'border-[#cbd5e1] bg-[#e2e8e0] text-[#022c22]'
                  : 'border-transparent bg-[#f1f5f9] text-[#64748b] hover:bg-[#e8edf2]',
              ].join(' ')}
            >
              Αναρρίχηση
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#00453e] py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#003a32]"
        >
          Δημιουργία Λογαριασμού
          <span aria-hidden>→</span>
        </button>

        <button
          type="button"
          className="w-full cursor-pointer py-1 text-center text-sm font-semibold text-[#64748b] transition hover:text-[#334155]"
          onClick={() => navigate('/')}
        >
          Ακύρωση
        </button>
      </form>

      <div className="mt-6 space-y-3 border-t border-[#eef2f2] pt-6 text-center">
        <p className="text-sm text-[#64748b]">
          Έχετε ήδη λογαριασμό;{' '}
          <Link to="/login" className="cursor-pointer font-semibold text-[#005f56] hover:underline">
            Σύνδεση
          </Link>
        </p>
        <p className="text-xs text-[#94a3b8]">
          <Link to="/" className="cursor-pointer hover:text-[#005f56]">
            ← Επιστροφή στην αρχική
          </Link>
        </p>
      </div>
    </AuthModalCard>
  )

  return <AuthPageShell modal={modal} />
}
