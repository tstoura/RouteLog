import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mountain, User } from 'lucide-react'
import { AuthIconCircle } from '../../components/auth/AuthIconCircle.tsx'
import { AuthLabeledField } from '../../components/auth/AuthLabeledField.tsx'
import { AuthModalCard } from '../../components/auth/AuthModalCard.tsx'
import { AuthPageShell } from '../../components/auth/AuthPageShell.tsx'

export function LoginPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [usernameOrEmail, setUsernameOrEmail] = useState('')

  const modal = (
    <AuthModalCard>
      <div className="flex flex-col items-center text-center">
        <AuthIconCircle>
          <Mountain className="size-7" strokeWidth={2} aria-hidden />
        </AuthIconCircle>
        <h1 className="mt-5 font-heading text-2xl font-bold tracking-tight text-[#022c22]">Σύνδεση</h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#64748b]">Αποκτήστε πρόσβαση στον λογαριασμό σας στο RouteLog</p>
      </div>

      <form
        className="mt-8 space-y-5"
        onSubmit={(e) => {
          e.preventDefault()
          const id = usernameOrEmail.trim().toLowerCase()
          if (id === 'admin') navigate('/admin')
          else navigate('/app')
        }}
      >
        <AuthLabeledField
          label="ΟΝΟΜΑ ΧΡΗΣΤΗ Ή EMAIL"
          leftIcon={<User className="size-[18px]" strokeWidth={2} aria-hidden />}
          name="username"
          autoComplete="username"
          placeholder="π.χ. climber123 ή email@example.com"
          value={usernameOrEmail}
          onChange={(e) => setUsernameOrEmail(e.target.value)}
        />
        <AuthLabeledField
          label="ΚΩΔΙΚΟΣ ΠΡΟΣΒΑΣΗΣ"
          leftIcon={<Lock className="size-[18px]" strokeWidth={2} aria-hidden />}
          name="password"
          autoComplete="current-password"
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
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

        <button
          type="submit"
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#00453e] py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#003a32]"
        >
          Σύνδεση
          <span aria-hidden>→</span>
        </button>

        <button
          type="button"
          className="w-full cursor-pointer py-1 text-center text-sm font-semibold text-[#64748b] transition hover:text-[#334155]"
          onClick={() => navigate('/')}
        >
          Ακύρωση
        </button>

        <p className="pt-1 text-center">
          <button
            type="button"
            className="cursor-pointer text-xs font-medium text-[#94a3b8] underline-offset-2 transition hover:text-[#64748b] hover:underline"
            onClick={() => {}}
          >
            Ξεχάσατε τον κωδικό σας;
          </button>
        </p>
      </form>

      <div className="mt-6 space-y-3 border-t border-[#eef2f2] pt-6 text-center">
        <p className="text-sm text-[#64748b]">
          Δεν έχετε λογαριασμό;{' '}
          <Link to="/register" className="cursor-pointer font-semibold text-[#005f56] hover:underline">
            Δημιουργία λογαριασμού
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
