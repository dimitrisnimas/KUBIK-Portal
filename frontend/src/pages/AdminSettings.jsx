import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { api } from '../lib/api'
import { 
  Settings, 
  Save, 
  Building, 
  Mail, 
  Phone, 
  Globe,
  MapPin,
  CreditCard,
  Shield,
  Bell,
  Palette,
  Database,
  Server,
  Key,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  UserPlus,
  UserMinus,
  UserCheck,
  Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [settings, setSettings] = useState({
    company: {
      name: 'KubikPortal',
      email: 'info@kubikportal.gr',
      phone: '+30 210 1234567',
      address: 'Λεωφ. Συγγρού 123, Αθήνα 11741',
      website: 'https://kubikportal.gr',
      vat_number: 'EL123456789',
      tax_office: 'Αθήνας'
    },
    email: {
      smtp_host: 'smtp.gmail.com',
      smtp_port: 587,
      smtp_user: 'noreply@kubikportal.gr',
      smtp_password: '********',
      from_name: 'KubikPortal',
      from_email: 'noreply@kubikportal.gr'
    },
    billing: {
      currency: 'EUR',
      vat_rate: 24,
      payment_terms: 30,
      late_fee_rate: 5,
      bank_name: 'Εθνική Τράπεζα',
      bank_account: 'GR1234567890123456789012345',
      bank_iban: 'GR1234567890123456789012345',
      bank_swift: 'ETHNGRAA'
    },
    system: {
      maintenance_mode: false,
      registration_enabled: true,
      email_verification: true,
      admin_approval: true,
      session_timeout: 24,
      max_login_attempts: 5,
      password_min_length: 8
    },
    notifications: {
      new_user_notification: true,
      new_ticket_notification: true,
      overdue_invoice_notification: true,
      monthly_report: true,
      email_notifications: true,
      sms_notifications: false
    }
  })

  // Super admin management state
  const [superAdmins, setSuperAdmins] = useState([])
  const [users, setUsers] = useState([])
  const [saLoading, setSALoading] = useState(true)
  const [saActionLoading, setSAActionLoading] = useState(false)
  const [newSuperAdmin, setNewSuperAdmin] = useState({ first_name: '', last_name: '', email: '', password: '' })
  const [promoteUserId, setPromoteUserId] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm()

  useEffect(() => {
    fetchSettings()
    fetchSuperAdmins()
    fetchAllUsers()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await api.get('/admin/settings')
      setSettings(response.data)
      
      // Set form values
      reset(response.data)
    } catch (error) {
      console.error('Error fetching settings:', error)
      if (error.response?.status === 401) {
        toast.error('Δεν έχετε δικαιώματα για πρόσβαση στις ρυθμίσεις')
      } else {
        toast.error('Αποτυχία φόρτωσης ρυθμίσεων')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async (data) => {
    setSaving(true)
    try {
      await api.put('/admin/settings', data)
      toast.success('Οι ρυθμίσεις αποθηκεύτηκαν επιτυχώς')
      setSettings(data)
    } catch (error) {
      toast.error('Αποτυχία αποθήκευσης ρυθμίσεων')
    } finally {
      setSaving(false)
    }
  }

  const handleTestEmail = async () => {
    try {
      await api.post('/admin/settings/test-email')
      toast.success('Το test email στάλθηκε επιτυχώς')
    } catch (error) {
      toast.error('Αποτυχία αποστολής test email')
    }
  }

  const handleBackupDatabase = async () => {
    try {
      const response = await api.post('/admin/settings/backup-database', {}, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `backup-${new Date().toISOString().split('T')[0]}.sql`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      
      toast.success('Το backup δημιουργήθηκε επιτυχώς')
    } catch (error) {
      toast.error('Αποτυχία δημιουργίας backup')
    }
  }

  const fetchSuperAdmins = async () => {
    setSALoading(true)
    try {
      // Use the new backend endpoint to get only actual super admins
      const res = await api.get('/admin/super-admins')
      setSuperAdmins(res.data)
    } catch (e) {
      setSuperAdmins([])
    } finally {
      setSALoading(false)
    }
  }

  const fetchAllUsers = async () => {
    try {
      const res = await api.get('/admin/users')
      setUsers(res.data)
    } catch (e) {
      setUsers([])
    }
  }

  const handleCreateSuperAdmin = async (e) => {
    e.preventDefault()
    setSAActionLoading(true)
    try {
      await api.post('/admin/super-admins', newSuperAdmin)
      toast.success('Ο super admin δημιουργήθηκε!')
      setNewSuperAdmin({ first_name: '', last_name: '', email: '', password: '' })
      fetchSuperAdmins()
      fetchAllUsers()
    } catch (e) {
      toast.error('Αποτυχία δημιουργίας super admin')
    } finally {
      setSAActionLoading(false)
    }
  }

  const handlePromoteUser = async (e) => {
    e.preventDefault()
    if (!promoteUserId) return
    setSAActionLoading(true)
    try {
      await api.put(`/admin/super-admins/${promoteUserId}`)
      toast.success('Ο χρήστης προήχθη σε super admin!')
      setPromoteUserId('')
      fetchSuperAdmins()
      fetchAllUsers()
    } catch (e) {
      if (e.response && e.response.status === 404) {
        toast.error('Ο χρήστης δεν βρέθηκε ή έχει διαγραφεί.')
      } else {
        toast.error('Αποτυχία προαγωγής χρήστη')
      }
    } finally {
      setSAActionLoading(false)
    }
  }

  const handleDemoteSuperAdmin = async (userId) => {
    if (!window.confirm('Είστε σίγουροι ότι θέλετε να αφαιρέσετε τον super admin;')) return
    setSAActionLoading(true)
    try {
      await api.delete(`/admin/super-admins/${userId}`)
      toast.success('Ο super admin μετατράπηκε σε απλό χρήστη!')
      fetchSuperAdmins()
      fetchAllUsers()
    } catch (e) {
      toast.error('Αποτυχία αφαίρεσης super admin')
    } finally {
      setSAActionLoading(false)
    }
  }

  if (loading) {
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
            Ρυθμίσεις Συστήματος
          </h1>
          <p className="text-slate-600 text-lg">
            Διαχειριστείτε τις ρυθμίσεις της εταιρείας, email, χρεώσεων και συστήματος.
          </p>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit(handleSaveSettings)} className="space-y-8">
        {/* Company Settings */}
        <div className="card">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center">
              <Building className="h-6 w-6 text-blue-600 mr-3" />
              <h2 className="text-lg font-semibold text-slate-900">Πληροφορίες Εταιρείας</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label">Όνομα Εταιρείας</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Εισάγετε το όνομα της εταιρείας"
                  {...register('company.name', { required: 'Το όνομα της εταιρείας είναι υποχρεωτικό' })}
                />
                {errors.company?.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.company.name.message}</p>
                )}
              </div>

              <div>
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="info@company.gr"
                  {...register('company.email', { 
                    required: 'Το email είναι υποχρεωτικό',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Μη έγκυρη διεύθυνση email'
                    }
                  })}
                />
                {errors.company?.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.company.email.message}</p>
                )}
              </div>

              <div>
                <label className="form-label">Τηλέφωνο</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="+30 210 1234567"
                  {...register('company.phone')}
                />
              </div>

              <div>
                <label className="form-label">Ιστοσελίδα</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://company.gr"
                  {...register('company.website')}
                />
              </div>

              <div>
                <label className="form-label">ΑΦΜ</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="EL123456789"
                  {...register('company.vat_number')}
                />
              </div>

              <div>
                <label className="form-label">ΔΟΥ</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Αθήνας"
                  {...register('company.tax_office')}
                />
              </div>

              <div className="md:col-span-2">
                <label className="form-label">Διεύθυνση</label>
                <textarea
                  className="form-input"
                  rows="3"
                  placeholder="Εισάγετε τη διεύθυνση"
                  {...register('company.address')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Email Settings */}
        <div className="card">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Mail className="h-6 w-6 text-green-600 mr-3" />
                <h2 className="text-lg font-semibold text-slate-900">Ρυθμίσεις Email</h2>
              </div>
              <button
                type="button"
                onClick={handleTestEmail}
                className="btn btn-outline btn-sm"
              >
                <Mail className="h-4 w-4 mr-2" />
                Test Email
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label">SMTP Host</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="smtp.gmail.com"
                  {...register('email.smtp_host', { required: 'Το SMTP host είναι υποχρεωτικό' })}
                />
                {errors.email?.smtp_host && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.smtp_host.message}</p>
                )}
              </div>

              <div>
                <label className="form-label">SMTP Port</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="587"
                  {...register('email.smtp_port', { required: 'Το SMTP port είναι υποχρεωτικό' })}
                />
                {errors.email?.smtp_port && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.smtp_port.message}</p>
                )}
              </div>

              <div>
                <label className="form-label">SMTP Username</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="noreply@company.gr"
                  {...register('email.smtp_user', { required: 'Το SMTP username είναι υποχρεωτικό' })}
                />
                {errors.email?.smtp_user && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.smtp_user.message}</p>
                )}
              </div>

              <div>
                <label className="form-label">SMTP Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input pr-10"
                    placeholder="••••••••"
                    {...register('email.smtp_password', { required: 'Το SMTP password είναι υποχρεωτικό' })}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-slate-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-400" />
                    )}
                  </button>
                </div>
                {errors.email?.smtp_password && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.smtp_password.message}</p>
                )}
              </div>

              <div>
                <label className="form-label">Όνομα Αποστολέα</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Company Name"
                  {...register('email.from_name')}
                />
              </div>

              <div>
                <label className="form-label">Email Αποστολέα</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="noreply@company.gr"
                  {...register('email.from_email')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Billing Settings */}
        <div className="card">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center">
              <CreditCard className="h-6 w-6 text-purple-600 mr-3" />
              <h2 className="text-lg font-semibold text-slate-900">Ρυθμίσεις Χρεώσεων</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label">Νόμισμα</label>
                <select
                  className="form-input"
                  {...register('billing.currency')}
                >
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>

              <div>
                <label className="form-label">Ποσοστό ΦΠΑ (%)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  placeholder="24"
                  {...register('billing.vat_rate')}
                />
              </div>

              <div>
                <label className="form-label">Ημέρες Πληρωμής</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="30"
                  {...register('billing.payment_terms')}
                />
              </div>

              <div>
                <label className="form-label">Ποσοστό Καθυστέρησης (%)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  placeholder="5"
                  {...register('billing.late_fee_rate')}
                />
              </div>

              <div>
                <label className="form-label">Τράπεζα</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Εθνική Τράπεζα"
                  {...register('billing.bank_name')}
                />
              </div>

              <div>
                <label className="form-label">IBAN</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="GR1234567890123456789012345"
                  {...register('billing.bank_iban')}
                />
              </div>

              <div>
                <label className="form-label">SWIFT/BIC</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="ETHNGRAA"
                  {...register('billing.bank_swift')}
                />
              </div>

              <div>
                <label className="form-label">Αριθμός Λογαριασμού</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="1234567890123456789012345"
                  {...register('billing.bank_account')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* System Settings */}
        <div className="card">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Server className="h-6 w-6 text-orange-600 mr-3" />
                <h2 className="text-lg font-semibold text-slate-900">Ρυθμίσεις Συστήματος</h2>
              </div>
              <button
                type="button"
                onClick={handleBackupDatabase}
                className="btn btn-outline btn-sm"
              >
                <Database className="h-4 w-4 mr-2" />
                Backup Database
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <label className="font-medium text-slate-900">Λειτουργία Συντήρησης</label>
                  <p className="text-sm text-slate-600">Απενεργοποίηση πρόσβασης για συντήρηση</p>
                </div>
                <input
                  type="checkbox"
                  className="form-checkbox"
                  {...register('system.maintenance_mode')}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <label className="font-medium text-slate-900">Ενεργοποίηση Εγγραφής</label>
                  <p className="text-sm text-slate-600">Επιτρέψτε νέες εγγραφές χρηστών</p>
                </div>
                <input
                  type="checkbox"
                  className="form-checkbox"
                  {...register('system.registration_enabled')}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <label className="font-medium text-slate-900">Επιβεβαίωση Email</label>
                  <p className="text-sm text-slate-600">Απαιτείται επιβεβαίωση email</p>
                </div>
                <input
                  type="checkbox"
                  className="form-checkbox"
                  {...register('system.email_verification')}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <label className="font-medium text-slate-900">Έγκριση Admin</label>
                  <p className="text-sm text-slate-600">Απαιτείται έγκριση από admin</p>
                </div>
                <input
                  type="checkbox"
                  className="form-checkbox"
                  {...register('system.admin_approval')}
                />
              </div>

              <div>
                <label className="form-label">Timeout Σύνδεσης (ώρες)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="24"
                  {...register('system.session_timeout')}
                />
              </div>

              <div>
                <label className="form-label">Μέγιστες Προσπάθειες Σύνδεσης</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="5"
                  {...register('system.max_login_attempts')}
                />
              </div>

              <div>
                <label className="form-label">Ελάχιστο Μήκος Κωδικού</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="8"
                  {...register('system.password_min_length')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="card">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center">
              <Bell className="h-6 w-6 text-red-600 mr-3" />
              <h2 className="text-lg font-semibold text-slate-900">Ρυθμίσεις Ειδοποιήσεων</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <label className="font-medium text-slate-900">Νέος Χρήστης</label>
                  <p className="text-sm text-slate-600">Ειδοποίηση για νέες εγγραφές</p>
                </div>
                <input
                  type="checkbox"
                  className="form-checkbox"
                  {...register('notifications.new_user_notification')}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <label className="font-medium text-slate-900">Νέο Εισιτήριο</label>
                  <p className="text-sm text-slate-600">Ειδοποίηση για νέα εισιτήρια</p>
                </div>
                <input
                  type="checkbox"
                  className="form-checkbox"
                  {...register('notifications.new_ticket_notification')}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <label className="font-medium text-slate-900">Ληξιπρόθεσμα Τιμολόγια</label>
                  <p className="text-sm text-slate-600">Ειδοποίηση για ληξιπρόθεσμα</p>
                </div>
                <input
                  type="checkbox"
                  className="form-checkbox"
                  {...register('notifications.overdue_invoice_notification')}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <label className="font-medium text-slate-900">Μηνιαία Αναφορά</label>
                  <p className="text-sm text-slate-600">Αυτόματη μηνιαία αναφορά</p>
                </div>
                <input
                  type="checkbox"
                  className="form-checkbox"
                  {...register('notifications.monthly_report')}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <label className="font-medium text-slate-900">Email Ειδοποιήσεις</label>
                  <p className="text-sm text-slate-600">Ενεργοποίηση email ειδοποιήσεων</p>
                </div>
                <input
                  type="checkbox"
                  className="form-checkbox"
                  {...register('notifications.email_notifications')}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <label className="font-medium text-slate-900">SMS Ειδοποιήσεις</label>
                  <p className="text-sm text-slate-600">Ενεργοποίηση SMS ειδοποιήσεων</p>
                </div>
                <input
                  type="checkbox"
                  className="form-checkbox"
                  {...register('notifications.sms_notifications')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="card">
          <div className="p-6">
            <div className="flex items-center justify-center space-x-4">
              <button 
                type="submit"
                disabled={saving}
                className="btn btn-primary btn-lg"
              >
                {saving ? (
                  <>
                    <div className="loading-spinner h-4 w-4 mr-2"></div>
                    Αποθήκευση...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Αποθήκευση Ρυθμίσεων
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Super Admin Management (now outside the main form) */}
      <div className="card">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center">
            <Shield className="h-6 w-6 text-yellow-600 mr-3" />
            <h2 className="text-lg font-semibold text-slate-900">Διαχείριση Super Admin</h2>
          </div>
        </div>
        <div className="p-6 space-y-6">
          {/* Create new super admin */}
          <form onSubmit={handleCreateSuperAdmin} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="form-label">Όνομα</label>
              <input type="text" className="form-input" value={newSuperAdmin.first_name} onChange={e => setNewSuperAdmin({ ...newSuperAdmin, first_name: e.target.value })} required />
            </div>
            <div>
              <label className="form-label">Επώνυμο</label>
              <input type="text" className="form-input" value={newSuperAdmin.last_name} onChange={e => setNewSuperAdmin({ ...newSuperAdmin, last_name: e.target.value })} required />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={newSuperAdmin.email} onChange={e => setNewSuperAdmin({ ...newSuperAdmin, email: e.target.value })} required />
            </div>
            <div>
              <label className="form-label">Κωδικός</label>
              <input type="password" className="form-input" value={newSuperAdmin.password} onChange={e => setNewSuperAdmin({ ...newSuperAdmin, password: e.target.value })} required />
            </div>
            <div className="md:col-span-4 flex items-center mt-2">
              <button type="submit" className="btn btn-success btn-md flex items-center" disabled={saActionLoading}>
                {saActionLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                Δημιουργία Super Admin
              </button>
            </div>
          </form>
          {/* Promote existing user */}
          <form onSubmit={handlePromoteUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-3">
              <label className="form-label">Μετατροπή υπάρχοντος χρήστη σε Super Admin</label>
              <select className="form-input" value={promoteUserId} onChange={e => setPromoteUserId(e.target.value)} required>
                <option value="">Επιλέξτε χρήστη...</option>
                {users.filter(u => !superAdmins.some(sa => sa.id === u.id)).map(u => (
                  <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.email})</option>
                ))}
              </select>
            </div>
            <div>
              <button type="submit" className="btn btn-warning btn-md flex items-center" disabled={saActionLoading || !promoteUserId}>
                {saActionLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <UserCheck className="h-4 w-4 mr-2" />}
                Προαγωγή σε Super Admin
              </button>
            </div>
          </form>
          {/* List super admins */}
          <div>
            <label className="form-label">Λίστα Super Admins</label>
            {saLoading ? (
              <div className="flex items-center space-x-2"><Loader2 className="animate-spin h-4 w-4" /> Φόρτωση...</div>
            ) : (
              <ul className="divide-y divide-slate-200">
                {superAdmins.map(sa => (
                  <li key={sa.id} className="flex items-center justify-between py-2">
                    <span>{sa.first_name} {sa.last_name} ({sa.email})</span>
                    <button className="btn btn-danger btn-xs flex items-center" onClick={() => handleDemoteSuperAdmin(sa.id)} disabled={saActionLoading}>
                      <UserMinus className="h-4 w-4 mr-1" /> Αφαίρεση
                    </button>
                  </li>
                ))}
                {superAdmins.length === 0 && <li className="text-slate-500 py-2">Δεν υπάρχουν super admins.</li>}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 