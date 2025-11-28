import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Register() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm()

  const password = watch('password')

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      // Transform field names to match backend API
      const userData = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        password: data.password
      }
      await registerUser(userData)
      toast.success(
        'Η εγγραφή ήταν επιτυχής! Ο λογαριασμός σας θα πρέπει να εγκριθεί από τον διαχειριστή πριν μπορέσετε να χρησιμοποιήσετε την πλατφόρμα. Θα λάβετε email ειδοποίησης μόλις εγκριθεί η αίτησή σας.',
        { duration: 6000 }
      )
      navigate('/login')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Η εγγραφή απέτυχε')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Δημιουργήστε τον λογαριασμό σας
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ή{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              συνδεθείτε στον υπάρχοντα λογαριασμό σας
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {/* Information Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Διαδικασία Έγκρισης
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Μετά την εγγραφή, ο λογαριασμός σας θα πρέπει να εγκριθεί από τον διαχειριστή. 
                    Θα λάβετε email ειδοποίησης μόλις εγκριθεί η αίτησή σας και μπορείτε να συνδεθείτε.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Προσωπικές Πληροφορίες</h3>
              
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  Όνομα
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="firstName"
                    type="text"
                    className="input pl-10"
                    placeholder="Εισάγετε το όνομά σας"
                  {...register('first_name', {
                      required: 'Το όνομα είναι υποχρεωτικό',
                    })}
                  />
                </div>
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Επώνυμο
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="lastName"
                    type="text"
                    className="input pl-10"
                    placeholder="Εισάγετε το επώνυμό σας"
                    {...register('last_name', {
                      required: 'Το επώνυμο είναι υποχρεωτικό',
                    })}
                  />
                </div>
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Διεύθυνση Email
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    className="input pl-10"
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
            </div>

            {/* Password */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Κωδικός Πρόσβασης</h3>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Κωδικός Πρόσβασης
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="input pl-10 pr-10"
                    placeholder="Εισάγετε τον κωδικό πρόσβασης"
                    {...register('password', {
                      required: 'Ο κωδικός πρόσβασης είναι υποχρεωτικός',
                      minLength: {
                        value: 8,
                        message: 'Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες',
                      },
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/,
                        message: 'Ο κωδικός πρέπει να περιέχει τουλάχιστον: 1 μικρό γράμμα, 1 κεφαλαίο, 1 αριθμό και 1 ειδικό χαρακτήρα',
                      },
                    })}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
                <div className="mt-2 text-sm text-gray-600">
                  <p className="font-medium">Απαιτήσεις κωδικού:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Τουλάχιστον 8 χαρακτήρες</li>
                    <li>Ένα μικρό γράμμα (a-z)</li>
                    <li>Ένα κεφαλαίο γράμμα (A-Z)</li>
                    <li>Έναν αριθμό (0-9)</li>
                    <li>Έναν ειδικό χαρακτήρα (!@#$%^&* κλπ.)</li>
                  </ul>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Επιβεβαίωση Κωδικού
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="input pl-10 pr-10"
                    placeholder="Επαναλάβετε τον κωδικό πρόσβασης"
                    {...register('confirmPassword', {
                      required: 'Η επιβεβαίωση του κωδικού είναι υποχρεωτική',
                      validate: (value) =>
                        value === password || 'Οι κωδικοί δεν ταιριάζουν',
                    })}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="loading-spinner h-5 w-5"></div>
              ) : (
                'Εγγραφή'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Με την εγγραφή συμφωνείτε με τους{' '}
              <Link
                to="/terms"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Όρους Χρήσης
              </Link>{' '}
              και την{' '}
              <Link
                to="/privacy"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Πολιτική Απορρήτου
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
} 