import { useEffect, useState } from 'react'
import { KeyRound, Mail, ShieldCheck, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('user')
  const [code, setCode] = useState('')
  const [step, setStep] = useState('request')
  const [loading, setLoading] = useState(false)
  const [resendSeconds, setResendSeconds] = useState(0)
  const { requestOtp, verifyOtp } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (resendSeconds <= 0) return undefined
    const timer = window.setInterval(() => {
      setResendSeconds((current) => Math.max(0, current - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [resendSeconds])

  const sendCode = async (event) => {
    event?.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error('Συμπληρώστε μια έγκυρη διεύθυνση email.')
      return
    }

    setLoading(true)
    try {
      const result = await requestOtp(email, role)
      setStep('verify')
      setCode('')
      setResendSeconds(result.resendAfterSeconds || 60)
      toast.success('Ο κωδικός στάλθηκε στο email σας.')
    } catch (error) {
      const data = error.response?.data
      if (data?.retryAfterSeconds) setResendSeconds(data.retryAfterSeconds)
      toast.error(data?.error || 'Δεν ήταν δυνατή η αποστολή του κωδικού.')
    } finally {
      setLoading(false)
    }
  }

  const submitCode = async (event) => {
    event.preventDefault()
    if (!/^\d{6}$/.test(code)) {
      toast.error('Ο κωδικός αποτελείται από 6 ψηφία.')
      return
    }

    setLoading(true)
    try {
      await verifyOtp(email, role, code)
      toast.success('Η σύνδεση ολοκληρώθηκε.')
      navigate('/')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Ο κωδικός δεν είναι έγκυρος.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">KUBIK Portal Demo</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Συνδεθείτε με έναν κωδικό μίας χρήσης που θα σταλεί στο email σας.
          </p>
        </div>

        {step === 'request' ? (
          <form className="space-y-6" onSubmit={sendCode}>
            <fieldset>
              <legend className="mb-3 text-sm font-medium text-slate-700">Demo προβολή</legend>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('user')}
                  className={`rounded-xl border p-4 text-left transition ${role === 'user' ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900' : 'border-slate-200 hover:border-slate-400'}`}
                  aria-pressed={role === 'user'}
                >
                  <User className="mb-3 h-5 w-5 text-slate-700" aria-hidden="true" />
                  <span className="block text-sm font-semibold text-slate-900">Πελάτης</span>
                  <span className="mt-1 block text-xs text-slate-500">Client dashboard</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`rounded-xl border p-4 text-left transition ${role === 'admin' ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900' : 'border-slate-200 hover:border-slate-400'}`}
                  aria-pressed={role === 'admin'}
                >
                  <ShieldCheck className="mb-3 h-5 w-5 text-slate-700" aria-hidden="true" />
                  <span className="block text-sm font-semibold text-slate-900">Διαχειριστής</span>
                  <span className="mt-1 block text-xs text-slate-500">Admin dashboard</span>
                </button>
              </div>
            </fieldset>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
              <div className="relative mt-2">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="input pl-10"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <span className="loading-spinner h-5 w-5" /> : 'Αποστολή κωδικού'}
            </button>
          </form>
        ) : (
          <form className="space-y-6" onSubmit={submitCode}>
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              Στείλαμε κωδικό στο <strong className="text-slate-900">{email}</strong> για τη
              demo προβολή <strong className="text-slate-900">{role === 'admin' ? 'διαχειριστή' : 'πελάτη'}</strong>.
            </div>

            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-slate-700">Κωδικός μίας χρήσης</label>
              <div className="relative mt-2">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  id="otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="input pl-10 text-center text-xl font-semibold tracking-[0.35em]"
                  placeholder="000000"
                  autoFocus
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <span className="loading-spinner h-5 w-5" /> : 'Επιβεβαίωση και σύνδεση'}
            </button>

            <div className="flex items-center justify-between text-sm">
              <button type="button" onClick={() => setStep('request')} className="font-medium text-slate-600 hover:text-slate-900">
                Αλλαγή email
              </button>
              <button
                type="button"
                onClick={sendCode}
                disabled={loading || resendSeconds > 0}
                className="font-medium text-slate-700 hover:text-slate-900 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                {resendSeconds > 0 ? `Νέος κωδικός σε ${resendSeconds}s` : 'Αποστολή ξανά'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
