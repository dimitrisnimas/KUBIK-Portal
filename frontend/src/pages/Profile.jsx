import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Mail, Save, Settings, ShieldCheck, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'

export default function Profile() {
  const { user, checkAuth } = useAuth()
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm()

  useEffect(() => {
    if (!user) return
    reset({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
    })
  }, [user, reset])

  const updateProfile = async (data) => {
    setLoading(true)
    try {
      await api.put('/users/profile', {
        first_name: data.first_name,
        last_name: data.last_name,
      })
      await checkAuth()
      toast.success('Το προφίλ ενημερώθηκε για την τρέχουσα demo συνεδρία.')
    } catch (error) {
      const response = error.response?.data
      toast.error(response?.errors?.[0]?.msg || response?.error || 'Η ενημέρωση απέτυχε.')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="loading-spinner h-20 w-20" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="card card-gradient">
        <div className="p-8">
          <h1 className="mb-2 text-3xl font-bold text-slate-900">Το προφίλ μου</h1>
          <p className="text-lg text-slate-600">
            Τα στοιχεία που αλλάζετε ισχύουν μόνο για την τρέχουσα demo συνεδρία.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section className="card">
          <div className="border-b border-slate-200 p-6">
            <div className="flex items-center">
              <User className="mr-2 h-5 w-5 text-slate-600" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-slate-900">Προσωπικά στοιχεία</h2>
            </div>
          </div>

          <form onSubmit={handleSubmit(updateProfile)} className="space-y-4 p-6">
            <div>
              <label htmlFor="first_name" className="form-label">Όνομα</label>
              <input
                id="first_name"
                type="text"
                className="form-input"
                {...register('first_name', {
                  required: 'Το όνομα είναι υποχρεωτικό',
                  minLength: { value: 2, message: 'Το όνομα πρέπει να έχει τουλάχιστον 2 χαρακτήρες' },
                })}
              />
              {errors.first_name && <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>}
            </div>

            <div>
              <label htmlFor="last_name" className="form-label">Επώνυμο</label>
              <input
                id="last_name"
                type="text"
                className="form-input"
                {...register('last_name', {
                  required: 'Το επώνυμο είναι υποχρεωτικό',
                  minLength: { value: 2, message: 'Το επώνυμο πρέπει να έχει τουλάχιστον 2 χαρακτήρες' },
                })}
              />
              {errors.last_name && <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>}
            </div>

            <div>
              <label htmlFor="verified_email" className="form-label">Επιβεβαιωμένο email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  id="verified_email"
                  type="email"
                  value={user.email}
                  className="form-input bg-slate-50 pl-10 text-slate-600"
                  readOnly
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">Το email προέρχεται από την OTP επιβεβαίωση και δεν αλλάζει μέσα στη συνεδρία.</p>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              {loading ? <span className="loading-spinner mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" aria-hidden="true" />}
              Αποθήκευση στη συνεδρία
            </button>
          </form>
        </section>

        <section className="card">
          <div className="border-b border-slate-200 p-6">
            <div className="flex items-center">
              <ShieldCheck className="mr-2 h-5 w-5 text-slate-600" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-slate-900">Ασφάλεια σύνδεσης</h2>
            </div>
          </div>
          <div className="space-y-5 p-6">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="font-semibold text-emerald-900">Passwordless authentication</p>
              <p className="mt-1 text-sm leading-6 text-emerald-800">
                Δεν υπάρχει κωδικός πρόσβασης. Η σύνδεση έγινε με κωδικό μίας χρήσης στο επιβεβαιωμένο email σας.
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Demo ρόλος</p>
              <p className="mt-1 font-semibold text-slate-900">{user.demo_role === 'admin' ? 'Διαχειριστής' : 'Πελάτης'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Διάρκεια</p>
              <p className="mt-1 text-slate-900">Η συνεδρία τερματίζεται με logout ή όταν κλείσει ο browser.</p>
            </div>
          </div>
        </section>
      </div>

      <section className="card">
        <div className="border-b border-slate-200 p-6">
          <div className="flex items-center">
            <Settings className="mr-2 h-5 w-5 text-slate-600" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-slate-900">Πληροφορίες demo λογαριασμού</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-3">
          <div>
            <p className="text-sm font-medium text-slate-600">Αναγνωριστικό persona</p>
            <p className="mt-1 font-medium text-slate-900">#{user.id}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600">Κατάσταση</p>
            <span className="mt-1 inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
              Ενεργή demo συνεδρία
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600">Υπόλοιπο demo πορτοφολιού</p>
            <p className="mt-1 font-medium text-slate-900">€{Number(user.wallet_balance || 0).toFixed(2)}</p>
          </div>
        </div>
      </section>
    </div>
  )
}
