import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, Mountain } from 'lucide-react'
import { AuthIconCircle } from '../../components/auth/AuthIconCircle.tsx'
import { AuthLabeledField } from '../../components/auth/AuthLabeledField.tsx'
import { AuthModalCard } from '../../components/auth/AuthModalCard.tsx'
import { AuthPageShell } from '../../components/auth/AuthPageShell.tsx'
import { useAuth } from '../../auth/AuthContext.tsx'
import { getClubs, type ClubOption } from '../../api/auth.ts'
import { ApiError } from '../../api/client.ts'

export function RegisterPage() {
  const navigate = useNavigate()
  const { register, isAuthenticated, isLoading } = useAuth()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [selectedClubId, setSelectedClubId] = useState<string>('')
  const [clubs, setClubs] = useState<ClubOption[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getClubs()
      .then((result) => setClubs(Array.isArray(result) ? result : []))
      .catch(() => {
        // Non-critical: club list unavailable; user can still register without a club.
      })
  }, [])

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/app" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!firstName.trim() || !lastName.trim()) {
      setError('Συμπληρώστε όνομα και επώνυμο.')
      return
    }
    if (!email.trim()) {
      setError('Συμπληρώστε email.')
      return
    }
    if (password.length < 8) {
      setError('Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες.')
      return
    }

    setIsSubmitting(true)
    try {
      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
        clubId: selectedClubId || undefined,
      })
      navigate('/app', { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setError('Το email χρησιμοποιείται ήδη. Δοκιμάστε να συνδεθείτε.')
        } else if (err.status === 422) {
          setError('Ελέγξτε τα πεδία και δοκιμάστε ξανά.')
        } else {
          setError('Σφάλμα εγγραφής. Παρακαλώ δοκιμάστε ξανά.')
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
        <h1 className="mt-5 font-heading text-2xl font-bold tracking-tight text-[#022c22]">
          Δημιουργία Λογαριασμού
        </h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#64748b]">
          Δημιουργήστε τον λογαριασμό σας στο RouteLog
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AuthLabeledField
            label="ΟΝΟΜΑ"
            placeholder="π.χ. Ιωάννης"
            name="firstName"
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={isSubmitting}
          />
          <AuthLabeledField
            label="ΕΠΩΝΥΜΟ"
            placeholder="π.χ. Παπαδόπουλος"
            name="lastName"
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <AuthLabeledField
          label="EMAIL"
          leftIcon={<Mail className="size-[18px]" strokeWidth={2} aria-hidden />}
          type="email"
          name="email"
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
          autoComplete="new-password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Τουλάχιστον 8 χαρακτήρες"
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

        {/* Club selector */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#64748b]">
            ΣΥΛΛΟΓΟΣ <span className="font-normal normal-case tracking-normal">(προαιρετικό)</span>
          </p>
          <select
            value={selectedClubId}
            onChange={(e) => setSelectedClubId(e.target.value)}
            disabled={isSubmitting}
            className="h-11 w-full rounded-lg border border-[#e8eef0] bg-white px-3 text-sm text-[#1a1c1e] shadow-sm focus:border-[#00453e] focus:outline-none focus:ring-1 focus:ring-[#00453e] disabled:opacity-60"
          >
            <option value="">Χωρίς σύλλογο / Δεν ανήκω σε σύλλογο</option>
            {clubs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-[#94a3b8]">
            Η εγγραφή σε σύλλογο σας ανθέτει ρόλο <strong>μέλους</strong> — όχι διαχειριστή.
            Μπορείτε να επιλέξετε σύλλογο τώρα ή αργότερα.
          </p>
        </div>

        {error ? (
          <p role="alert" className="rounded-xl border border-[#fca5a5] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#00453e] py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#003a32] disabled:opacity-60"
        >
          {isSubmitting ? 'Δημιουργία…' : 'Δημιουργία Λογαριασμού'}
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
