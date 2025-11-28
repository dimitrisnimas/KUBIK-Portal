import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { api } from '../lib/api'
import { 
  CreditCard, 
  Plus, 
  Eye, 
  Download, 
  Upload, 
  Search, 
  Filter,
  User,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Clock,
  X,
  FileText,
  Send,
  Building,
  MapPin,
  Mail,
  Phone,
  TrendingUp,
  BarChart3,
  Receipt
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminBilling() {
  const [invoices, setInvoices] = useState([])
  const [clients, setClients] = useState([])
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [clientFilter, setClientFilter] = useState('all')
  const [selectedFile, setSelectedFile] = useState(null)
  const [vatRate, setVatRate] = useState(24)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm()

  const watchedClientId = watch('client_id');

  useEffect(() => {
    fetchBillingData()
    fetchClients()
    fetchAssets()
    fetchVatRate()
  }, [])

  const fetchBillingData = async () => {
    setLoading(true)
    try {
      const response = await api.get('/admin/billing/invoices')
      setInvoices(response.data)
    } catch (error) {
      console.error('Error fetching invoices:', error)
      toast.error('Αποτυχία φόρτωσης τιμολογίων')
    } finally {
      setLoading(false)
    }
  }

  const fetchClients = async () => {
    try {
      const response = await api.get('/admin/users')
      setClients(response.data)
    } catch (error) {
      console.error('Error fetching clients:', error)
      toast.error('Αποτυχία φόρτωσης πελατών')
    }
  }

  const fetchAssets = async () => {
    try {
      const response = await api.get('/admin/assets')
      setAssets(response.data)
    } catch (error) {
      console.error('Error fetching assets:', error)
      toast.error('Αποτυχία φόρτωσης περιουσιακών στοιχείων')
    }
  }

  const fetchVatRate = async () => {
    try {
      const response = await api.get('/admin/settings')
      setVatRate(Number(response.data.billing?.vat_rate) || 24)
    } catch (e) {
      setVatRate(24)
    }
  }

  const handleUploadInvoice = async (data) => {
    try {
      const formData = new FormData()
      formData.append('client_id', data.client_id)
      formData.append('asset_id', data.asset_id)
      formData.append('amount', data.amount)
      formData.append('due_date', data.due_date)
      formData.append('description', data.description)
      if (selectedFile) {
        formData.append('pdf_file', selectedFile)
      }

      await api.post('/admin/billing/upload-invoice', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      toast.success('Το τιμολόγιο ανέβηκε επιτυχώς')
      setShowUploadModal(false)
      setSelectedFile(null)
      reset()
      fetchBillingData()
    } catch (error) {
      toast.error('Αποτυχία ανεβάσματος τιμολογίου')
    }
  }

  const handleManualPayment = async (data) => {
    try {
      await api.post('/admin/billing/manual-payment', {
        invoice_id: selectedInvoice.id,
        amount: data.amount,
        payment_method: 'bank_transfer',
        payment_date: data.payment_date,
        reference: data.reference,
        notes: data.notes
      })
      
      toast.success('Η πληρωμή καταγράφηκε επιτυχώς')
      setShowPaymentModal(false)
      reset()
      fetchBillingData()
    } catch (error) {
      toast.error('Αποτυχία καταγραφής πληρωμής')
    }
  }

  const handleDownloadInvoice = async (invoice) => {
    try {
      const response = await api.get(`/admin/billing/download/${invoice.id}`, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${invoice.invoice_number}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      
      toast.success('Το τιμολόγιο κατέβηκε επιτυχώς')
    } catch (error) {
      toast.error('Αποτυχία κατεβάσματος τιμολογίου')
    }
  }

  const handleSendInvoice = async (invoice) => {
    try {
      await api.post(`/admin/billing/send-invoice/${invoice.id}`)
      toast.success('Το τιμολόγιο στάλθηκε επιτυχώς')
    } catch (error) {
      toast.error('Αποτυχία αποστολής τιμολογίου')
    }
  }

  const generateMonthlyInvoices = async () => {
    try {
      await api.post('/admin/billing/generate-monthly')
      toast.success('Τα μηνιαία τιμολόγια δημιουργήθηκαν επιτυχώς')
      fetchBillingData()
    } catch (error) {
      toast.error('Αποτυχία δημιουργίας μηνιαίων τιμολογίων')
    }
  }

  const filteredInvoices = (invoices || []).filter(invoice => {
    const matchesSearch = invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (invoice.first_name && invoice.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (invoice.last_name && invoice.last_name.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
    const matchesClient = clientFilter === 'all' || invoice.user_id?.toString() === clientFilter
    return matchesSearch && matchesStatus && matchesClient
  })

  const assetsForSelectedClient = watchedClientId
    ? (assets || []).filter(asset => asset.user_id?.toString() === watchedClientId)
    : [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'paid':
        return 'Πληρωμένο'
      case 'pending':
        return 'Εκκρεμεί'
      case 'overdue':
        return 'Ληξιπρόθεσμο'
      default:
        return status
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const stats = {
    totalInvoices: (invoices || []).length,
    totalRevenue: (invoices || []).filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.total_amount || 0), 0),
    pendingAmount: (invoices || []).filter(i => i.status === 'pending').reduce((sum, i) => sum + Number(i.total_amount || 0), 0),
    overdueAmount: (invoices || []).filter(i => i.status === 'overdue').reduce((sum, i) => sum + Number(i.total_amount || 0), 0)
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
            Διαχείριση Χρεώσεων
          </h1>
          <p className="text-slate-600 text-lg">
            Διαχειριστείτε τα τιμολόγια, τις πληρωμές και τα έσοδα.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="stat-card stat-card-blue">
          <div className="flex items-center">
            <Receipt className="h-8 w-8" />
            <div className="ml-4">
              <p className="text-sm opacity-90">Συνολικά Τιμολόγια</p>
              <p className="text-3xl font-bold">{stats.totalInvoices}</p>
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-green">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8" />
            <div className="ml-4">
              <p className="text-sm opacity-90">Συνολικά Έσοδα</p>
              <p className="text-3xl font-bold">€{Number(stats.totalRevenue).toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-yellow">
          <div className="flex items-center">
            <Clock className="h-8 w-8" />
            <div className="ml-4">
              <p className="text-sm opacity-90">Εκκρεμεί</p>
              <p className="text-3xl font-bold">€{Number(stats.pendingAmount).toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-red">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8" />
            <div className="ml-4">
              <p className="text-sm opacity-90">Ληξιπρόθεσμα</p>
              <p className="text-3xl font-bold">€{Number(stats.overdueAmount).toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Γρήγορες Ενέργειες</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn btn-primary btn-sm"
            >
              <Upload className="h-4 w-4 mr-2" />
              Ανέβασμα Τιμολογίου
            </button>
            <button
              onClick={generateMonthlyInvoices}
              className="btn btn-success btn-sm"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Δημιουργία Μηνιαίων
            </button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="card">
        <div className="p-6 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Αναζήτηση τιμολογίων..."
                  className="form-input pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="form-input"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Όλες οι καταστάσεις</option>
                <option value="paid">Πληρωμένα</option>
                <option value="pending">Εκκρεμεί</option>
                <option value="overdue">Ληξιπρόθεσμα</option>
              </select>
              <select
                className="form-input"
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
              >
                <option value="all">Όλοι οι πελάτες</option>
                {(clients || []).map(client => (
                  <option key={client.id} value={client.id}>
                    {client.first_name} {client.last_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Invoices List */}
        <div className="p-6">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500">Δεν βρέθηκαν τιμολόγια.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInvoices.map((invoice) => (
                <div key={invoice.id} className="card">
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                          <Receipt className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">{invoice.invoice_number}</h3>
                          <p className="text-slate-600">{invoice.first_name} {invoice.last_name}</p>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-slate-500">
                            <span>Περιουσιακό: {invoice.asset_name}</span>
                            <span>Λήξη: {new Date(invoice.due_date).toLocaleDateString('el-GR')}</span>
                            <span>€{Number(invoice.total_amount).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}>
                          {getStatusIcon(invoice.status)}
                          <span className="ml-1">{getStatusText(invoice.status)}</span>
                        </span>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedInvoice(invoice)
                              setShowInvoiceModal(true)
                            }}
                            className="btn btn-outline btn-sm"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Προβολή
                          </button>
                          
                          <button
                            onClick={() => handleDownloadInvoice(invoice)}
                            className="btn btn-outline btn-sm"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Κατέβασμα
                          </button>
                          
                          <button
                            onClick={() => handleSendInvoice(invoice)}
                            className="btn btn-outline btn-sm"
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Αποστολή
                          </button>
                          
                          {invoice.status !== 'paid' && (
                            <button
                              onClick={() => {
                                setSelectedInvoice(invoice)
                                setShowPaymentModal(true)
                              }}
                              className="btn btn-success btn-sm"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Πληρωμή
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upload Invoice Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Ανέβασμα Τιμολογίου</h2>
                <button 
                  onClick={() => setShowUploadModal(false)}
                  className="action-btn"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit(handleUploadInvoice)} className="space-y-4">
                <div>
                  <label className="form-label">Πελάτης</label>
                  <select
                    className="form-input"
                    {...register('client_id', { required: 'Ο πελάτης είναι υποχρεωτικός' })}
                  >
                    <option value="">Επιλέξτε πελάτη</option>
                    {(clients || []).map(client => (
                      <option key={client.id} value={client.id}>
                        {client.first_name} {client.last_name} ({client.email})
                      </option>
                    ))}
                  </select>
                  {errors.client_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.client_id.message}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">Περιουσιακό Στοιχείο</label>
                  <select
                    className="form-input"
                    disabled={!watchedClientId}
                    {...register('asset_id', { required: 'Το περιουσιακό στοιχείο είναι υποχρεωτικό' })}
                  >
                    <option value="">Επιλέξτε περιουσιακό στοιχείο</option>
                    {assetsForSelectedClient.map(asset => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name} - {asset.category} (€{(parseFloat(asset.package_price) || 0).toFixed(2)}/μήνα)
                      </option>
                    ))}
                  </select>
                  {errors.asset_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.asset_id.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Ποσό (χωρίς ΦΠΑ)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      placeholder="0.00"
                      {...register('amount', { required: 'Το ποσό είναι υποχρεωτικό' })}
                    />
                    {errors.amount && (
                      <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="form-label">Ημερομηνία Λήξης</label>
                    <input
                      type="date"
                      className="form-input"
                      {...register('due_date', { required: 'Η ημερομηνία λήξης είναι υποχρεωτική' })}
                    />
                    {errors.due_date && (
                      <p className="mt-1 text-sm text-red-600">{errors.due_date.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="form-label">Περιγραφή</label>
                  <textarea
                    className="form-input"
                    rows="3"
                    placeholder="Περιγραφή του τιμολογίου..."
                    {...register('description')}
                  />
                </div>

                <div>
                  <label className="form-label">Αρχείο PDF</label>
                  <input
                    type="file"
                    accept=".pdf"
                    className="form-input"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                  />
                  <p className="mt-1 text-sm text-slate-600">Ανεβάστε το PDF του τιμολογίου</p>
                </div>

                <div className="flex space-x-3">
                  <button 
                    type="submit"
                    className="btn btn-primary btn-md flex-1"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Ανέβασμα
                  </button>
                  <button 
                    type="button"
                    className="btn btn-outline btn-md flex-1"
                    onClick={() => setShowUploadModal(false)}
                  >
                    Ακύρωση
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Manual Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Χειροκίνητη Πληρωμή</h2>
                <button 
                  onClick={() => setShowPaymentModal(false)}
                  className="action-btn"
                >
                  ×
                </button>
              </div>

              {selectedInvoice && (
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="font-medium text-slate-900 mb-3">Πληροφορίες Τιμολογίου</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Αριθμός:</span>
                      <span className="font-medium">{selectedInvoice.invoice_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Πελάτης:</span>
                      <span>{selectedInvoice.first_name} {selectedInvoice.last_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Ποσό:</span>
                      <span className="font-medium">€{Number(selectedInvoice.total_amount).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit(handleManualPayment)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Ποσό Πληρωμής</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      placeholder="0.00"
                      defaultValue={selectedInvoice?.total_amount || 0}
                      {...register('amount', { required: 'Το ποσό είναι υποχρεωτικό' })}
                    />
                    {errors.amount && (
                      <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="form-label">Ημερομηνία Πληρωμής</label>
                    <input
                      type="date"
                      className="form-input"
                      defaultValue={new Date().toISOString().split('T')[0]}
                      {...register('payment_date', { required: 'Η ημερομηνία πληρωμής είναι υποχρεωτική' })}
                    />
                    {errors.payment_date && (
                      <p className="mt-1 text-sm text-red-600">{errors.payment_date.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="form-label">Αριθμός Παραπομπής</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Αριθμός τραπεζικής μεταφοράς"
                    {...register('reference')}
                  />
                </div>

                <div>
                  <label className="form-label">Σημειώσεις</label>
                  <textarea
                    className="form-input"
                    rows="3"
                    placeholder="Πρόσθετες σημειώσεις..."
                    {...register('notes')}
                  />
                </div>

                <div className="flex space-x-3">
                  <button 
                    type="submit"
                    className="btn btn-success btn-md flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Καταγραφή Πληρωμής
                  </button>
                  <button 
                    type="button"
                    className="btn btn-outline btn-md flex-1"
                    onClick={() => setShowPaymentModal(false)}
                  >
                    Ακύρωση
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Details Modal */}
      {showInvoiceModal && selectedInvoice && (
        <div className="modal-overlay" onClick={() => setShowInvoiceModal(false)}>
          <div className="modal-content max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">
                  Λεπτομέρειες Τιμολογίου - {selectedInvoice.invoice_number}
                </h2>
                <button 
                  onClick={() => setShowInvoiceModal(false)}
                  className="action-btn"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Invoice Info */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="font-medium text-slate-900 mb-3">Πληροφορίες Τιμολογίου</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Αριθμός:</span>
                      <span className="font-medium">{selectedInvoice.invoice_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Ημερομηνία:</span>
                      <span>{new Date(selectedInvoice.created_at).toLocaleDateString('el-GR')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Λήξη:</span>
                      <span>{new Date(selectedInvoice.due_date).toLocaleDateString('el-GR')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Κατάσταση:</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedInvoice.status)}`}>
                        {getStatusText(selectedInvoice.status)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Client Info */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="font-medium text-slate-900 mb-3">Πληροφορίες Πελάτη</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Όνομα:</span>
                      <span>{selectedInvoice.first_name} {selectedInvoice.last_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Περιουσιακό:</span>
                      <span>{selectedInvoice.asset_name}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Billing Details */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-medium text-slate-900 mb-3">Λεπτομέρειες Χρέωσης</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">ΑΦΜ:</span>
                      <span>{selectedInvoice.asset_vat_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Διεύθυνση:</span>
                      <span>{selectedInvoice.asset_address}</span>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Email:</span>
                      <span>{selectedInvoice.asset_billing_email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Τηλέφωνο:</span>
                      <span>{selectedInvoice.asset_billing_phone}</span>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Ποσό:</span>
                      <span>€{Number(selectedInvoice.amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">ΦΠΑ:</span>
                      <span>€{Number(selectedInvoice.vat_amount || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 font-medium">Σύνολο:</span>
                      <span className="font-medium">€{Number(selectedInvoice.total_amount).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => handleDownloadInvoice(selectedInvoice)}
                  className="btn btn-outline btn-md"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Κατέβασμα PDF
                </button>
                <button
                  onClick={() => handleSendInvoice(selectedInvoice)}
                  className="btn btn-outline btn-md"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Αποστολή Email
                </button>
                {selectedInvoice.status !== 'paid' && (
                  <button
                    onClick={() => {
                      setShowInvoiceModal(false)
                      setShowPaymentModal(true)
                    }}
                    className="btn btn-success btn-md"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Καταγραφή Πληρωμής
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 