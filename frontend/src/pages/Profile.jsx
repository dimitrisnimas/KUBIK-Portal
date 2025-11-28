import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'
import { 
  User, 
  Mail, 
  Lock,
  Save,
  Eye,
  EyeOff,
  Shield,
  Settings
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function Profile() {
  const { user, checkAuth } = useAuth()
  const [loading, setLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm()

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    watch,
    formState: { errors: passwordErrors },
  } = useForm()

  const newPassword = watch('newPassword')

  useEffect(() => {
    if (user) {
      reset({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
      })
    }
  }, [user, reset])

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await api.put('/users/profile', {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email
      })
      toast.success('Το προφίλ ενημερώθηκε επιτυχώς')
      await checkAuth()
    } catch (error) {
      const err = error.response?.data;
      if (err?.errors && err.errors.length > 0) {
        toast.error(err.errors[0].msg)
      } else {
        toast.error(err?.error || 'Αποτυχία ενημέρωσης προφίλ')
      }
    } finally {
      setLoading(false)
    }
  }

  const onPasswordSubmit = async (data) => {
    setPasswordLoading(true)
    try {
      await api.put('/users/password', {
        current_password: data.currentPassword,
        new_password: data.newPassword,
      })
      toast.success('Ο κωδικός πρόσβασης ενημερώθηκε επιτυχώς')
      resetPassword()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Αποτυχία ενημέρωσης κωδικού')
    } finally {
      setPasswordLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner h-32 w-32"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="card card-gradient">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Το Προφίλ Μου
          </h1>
          <p className="text-slate-600 text-lg">
            Διαχειριστείτε τις πληροφορίες του λογαριασμού σας.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Personal Information */}
        <div className="card">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center">
              <User className="h-5 w-5 text-slate-600 mr-2" />
              <h2 className="text-lg font-semibold text-slate-900">Προσωπικές Πληροφορίες</h2>
            </div>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            <div>
              <label className="form-label">
                Όνομα
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  className="form-input pl-10"
                  placeholder="Εισάγετε το όνομά σας"
                  {...register('first_name', { required: 'Το όνομα είναι υποχρεωτικό' })}
                />
              </div>
              {errors.first_name && (
                <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
              )}
            </div>

            <div>
              <label className="form-label">
                Επώνυμο
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  className="form-input pl-10"
                  placeholder="Εισάγετε το επώνυμό σας"
                  {...register('last_name', { required: 'Το επώνυμο είναι υποχρεωτικό' })}
                />
              </div>
              {errors.last_name && (
                <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
              )}
            </div>

            <div>
              <label className="form-label">
                Διεύθυνση Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  className="form-input pl-10"
                  placeholder="Εισάγετε το email σας"
                  {...register('email', {
                    required: 'Το email είναι υποχρεωτικό',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Μη έγκυρη διεύθυνση email',
                    },
                  })}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? (
                <>
                  <div className="loading-spinner h-4 w-4 mr-2"></div>
                  Ενημέρωση...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Ενημέρωση Προφίλ
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security Settings */}
        <div className="card">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-slate-600 mr-2" />
              <h2 className="text-lg font-semibold text-slate-900">Ρυθμίσεις Ασφαλείας</h2>
            </div>
          </div>
          
          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="p-6 space-y-4">
            <div>
              <label className="form-label">
                Τρέχων Κωδικός Πρόσβασης
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input pl-10 pr-10"
                  placeholder="Εισάγετε τον τρέχοντα κωδικό"
                  {...registerPassword('currentPassword', { required: 'Ο τρέχων κωδικός είναι υποχρεωτικός' })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-slate-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-slate-400" />
                  )}
                </button>
              </div>
              {passwordErrors.currentPassword && (
                <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword.message}</p>
              )}
            </div>

            <div>
              <label className="form-label">
                Νέος Κωδικός Πρόσβασης
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  className="form-input pl-10 pr-10"
                  placeholder="Εισάγετε τον νέο κωδικό"
                  {...registerPassword('newPassword', {
                    required: 'Ο νέος κωδικός είναι υποχρεωτικός',
                    minLength: {
                      value: 8,
                      message: 'Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες',
                    },
                  })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-5 w-5 text-slate-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-slate-400" />
                  )}
                </button>
              </div>
              {passwordErrors.newPassword && (
                <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword.message}</p>
              )}
            </div>

            <div>
              <label className="form-label">
                Επιβεβαίωση Νέου Κωδικού
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="form-input pl-10 pr-10"
                  placeholder="Επαναλάβετε τον νέο κωδικό"
                  {...registerPassword('confirmPassword', {
                    required: 'Η επιβεβαίωση του κωδικού είναι υποχρεωτική',
                    validate: (value) =>
                      value === newPassword || 'Οι κωδικοί δεν ταιριάζουν',
                  })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-slate-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-slate-400" />
                  )}
                </button>
              </div>
              {passwordErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="btn btn-primary w-full"
            >
              {passwordLoading ? (
                <>
                  <div className="loading-spinner h-4 w-4 mr-2"></div>
                  Ενημέρωση...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Ενημέρωση Κωδικού
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Account Information */}
      <div className="card">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center">
            <Settings className="h-5 w-5 text-slate-600 mr-2" />
            <h2 className="text-lg font-semibold text-slate-900">Πληροφορίες Λογαριασμού</h2>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600">Αριθμός Λογαριασμού</label>
                <p className="text-slate-900 font-medium">#{user.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Κατάσταση</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user.status === 'approved' ? 'bg-green-100 text-green-800' : 
                  user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-red-100 text-red-800'
                }`}>
                  {user.status === 'approved' ? 'Εγκεκριμένος' : 
                   user.status === 'pending' ? 'Εκκρεμεί' : 
                   user.status === 'rejected' ? 'Απορρίφθηκε' : user.status}
                </span>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Ημερομηνία Εγγραφής</label>
                <p className="text-slate-900">{user.created_at ? new Date(user.created_at).toLocaleDateString('el-GR') : 'Άγνωστη'}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600">Τελευταία Σύνδεση</label>
                <p className="text-slate-900">{user.last_login ? new Date(user.last_login).toLocaleDateString('el-GR') : 'Ποτέ'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Υπόλοιπο Πορτοφολιού</label>
                <p className="text-slate-900 font-medium">€{user.wallet_balance || 0.00}</p>
              </div>
              {user.admin_role && (
                <div>
                  <label className="text-sm font-medium text-slate-600">Ρόλος Διαχειριστή</label>
                  <p className="text-slate-900 font-medium">{user.admin_role === 'super_admin' ? 'Super Admin' : 'Admin'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 