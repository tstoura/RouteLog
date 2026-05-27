import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mountain, Mail } from 'lucide-react'
import { AuthIconCircle } from '../../components/auth/AuthIconCircle.tsx'
import { AuthLabeledField } from '../../components/auth/AuthLabeledField.tsx'
import { AuthModalCard } from '../../components/auth/AuthModalCard.tsx'
import { AuthPageShell } from '../../components/auth/AuthPageShell.tsx'
import { useAuth, isAdminUser } from '../../auth/AuthContext.tsx'
import { ApiError } from '../../api/client.ts'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated, isLoading, user } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Capture an explicit redirect target set by RequireAuth/RequireAdmin.
  const explicitFrom = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname

  if (!isLoading && isAuthenticated) {
    // Already logged in: send admins to /admin, members to /app.
    return <Navigate to={isAdminUser(user) ? '/admin' : '/app'} replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim() || !password) {
      setError('Συμπληρώστε email και κωδικό πρόσβασης.')
      return
    }

    setIsSubmitting(true)
    try {
      const loggedInUser = await login({ email: email.trim().toLowerCase(), password })
      if (explicitFrom) {
        // Honour the original destination (e.g. deep link before session expired).
        navigate(explicitFrom, { replace: true })
      } else {
        // Default: admins go to /admin, members go to /app.
        navigate(isAdminUser(loggedInUser) ? '/admin' : '/app', { replace: true })
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError('Λάθος email ή κωδικός πρόσβασης.')
        } else {
          setError(err.message)
        }
      } else {
        setError('Απρόσμενο σφάλμα. Παρακαλώ δοκιμάστε ξανά.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const modal = (
    <AuthModalCard>
      <div className="flex flex-col items-center text-center">
        <AuthIconCircle>
          <Mountain className="size-7" strokeWidth={2} aria-hidden />
        </AuthIconCircle>
        <h1 className="mt-5 font-heading text-2xl font-bold tracking-tight text-[#022c22]">Σύνδεση</h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#64748b]">
          Αποκτήστε πρόσβαση στον λογαριασμό σας στο RouteLog
        </p>
      </div>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <AuthLabeledField
          label="EMAIL"
          leftIcon={<Mail className="size-[18px]" strokeWidth={2} aria-hidden />}
          name="email"
          type="email"
          autoComplete="email"
          placeholder="example@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
        />
        <AuthLabeledField
          label="ΚΩΔΙΚΟΣ ΠΡΟΣΒΑΣΗΣ"
          leftIcon={<Lock className="size-[18px]" strokeWidth={2} aria-hidden />}
          name="password"
          autoComplete="current-password"
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isSubmitting}
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

        {error ? (
          <p role="alert" className="rounded-xl border border-[#fca5a5] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#00453e] py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#003a32] disabled:opacity-60"
        >
          {isSubmitting ? 'Σύνδεση…' : 'Σύνδεση'}
          {!isSubmitting && <span aria-hidden>→</span>}
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
