import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { 
  CreditCard, 
  Download, 
  Eye, 
  Calendar,
  Euro,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  Building,
  User,
  FileText,
  DollarSign
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function Billing() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [vatRate, setVatRate] = useState(24)

  useEffect(() => {
    fetchInvoices()
    fetchVatRate()
  }, [])

  const fetchInvoices = async () => {
    try {
      const response = await api.get('/users/invoices')
      setInvoices(response.data)
    } catch (error) {
      toast.error('Αποτυχία φόρτωσης τιμολογίων')
    } finally {
      setLoading(false)
    }
  }

  const fetchVatRate = async () => {
    try {
      // Try to fetch from /system/settings (should be public for clients)
      const response = await api.get('/system/settings')
      const found = response.data.settings?.find(s => s.setting_key === 'vat_rate')
      setVatRate(Number(found?.setting_value) || 24)
    } catch (e) {
      setVatRate(24)
    }
  }

  const downloadInvoice = async (invoiceId) => {
    try {
      const response = await api.get(`/billing/download/${invoiceId}`, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `invoice-${invoiceId}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      toast.success('Το τιμολόγιο κατέβηκε επιτυχώς')
    } catch (error) {
      toast.error('Αποτυχία λήψης τιμολογίου')
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
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner h-32 w-32"></div>
      </div>
    )
  }

  const totalPaid = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0)
  const totalPending = invoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0)
  const totalOverdue = invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="card card-gradient">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Η Χρέωση Μου
          </h1>
          <p className="text-slate-600 text-lg">
            Προβάλετε τα τιμολόγιά σας και το ιστορικό πληρωμών.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card stat-card-green">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8" />
            <div className="ml-4">
              <p className="text-sm opacity-90">Πληρωμένα</p>
              <p className="text-3xl font-bold">€{Number(totalPaid).toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-yellow">
          <div className="flex items-center">
            <Clock className="h-8 w-8" />
            <div className="ml-4">
              <p className="text-sm opacity-90">Εκκρεμεί</p>
              <p className="text-3xl font-bold">€{Number(totalPending).toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-red">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8" />
            <div className="ml-4">
              <p className="text-sm opacity-90">Ληξιπρόθεσμα</p>
              <p className="text-3xl font-bold">€{Number(totalOverdue).toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Instructions */}
      <div className="card">
        <div className="p-6">
          <div className="flex items-start space-x-3">
            <CreditCard className="h-6 w-6 text-blue-600 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Οδηγίες Πληρωμής
              </h3>
              <div className="text-sm text-slate-700 space-y-2">
                <p>
                  <strong>Τραπεζικός Λογαριασμός:</strong> GR12 3456 7890 1234 5678 9012 345
                </p>
                <p>
                  <strong>Δικαιούχος:</strong> Kubik Digital Services
                </p>
                <p>
                  <strong>Αναφορά:</strong> Παρακαλώ συμπεριλάβετε τον αριθμό τιμολογίου ως αναφορά πληρωμής
                </p>
                <p className="mt-3 text-slate-800">
                  <strong>Σημείωση:</strong> Οι πληρωμές επεξεργάζονται χειροκίνητα. Παρακαλώ επιτρέψτε 2-3 εργάσιμες ημέρες για επιβεβαίωση.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invoices */}
      <div className="card">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Τιμολόγια</h2>
        </div>
        
        <div className="divide-y divide-slate-200">
          {invoices.length === 0 ? (
            <div className="p-8 text-center">
              <CreditCard className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500">Δεν υπάρχουν τιμολόγια ακόμα.</p>
            </div>
          ) : (
            invoices.map((invoice) => (
              <div key={invoice.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(invoice.status)}
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        Τιμολόγιο #{invoice.invoice_number}
                      </p>
                      <p className="text-sm text-slate-500">
                        {invoice.description || 'Πληρωμή υπηρεσίας'}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Περιουσιακό: {invoice.asset_name} ({invoice.asset_category})
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-900">
                        €{Number(invoice.amount).toFixed(2)}
                      </p>
                      <p className="text-sm text-slate-500">
                        Λήξη: {new Date(invoice.due_date).toLocaleDateString('el-GR')}
                      </p>
                    </div>
                    
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                      {getStatusText(invoice.status)}
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
                        onClick={() => downloadInvoice(invoice.id)}
                        className="btn btn-outline btn-sm"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Λήψη
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Invoice Details Modal */}
      {showInvoiceModal && selectedInvoice && (
        <div className="modal-overlay" onClick={() => setShowInvoiceModal(false)}>
          <div className="modal-content max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">
                  Τιμολόγιο #{selectedInvoice.invoice_number}
                </h2>
                <button 
                  onClick={() => setShowInvoiceModal(false)}
                  className="action-btn"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Invoice Details */}
                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h3 className="font-medium text-slate-900 mb-3">Λεπτομέρειες Τιμολογίου</h3>
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
                      {selectedInvoice.paid_date && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Ημερομηνία Πληρωμής:</span>
                          <span>{new Date(selectedInvoice.paid_date).toLocaleDateString('el-GR')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4">
                    <h3 className="font-medium text-slate-900 mb-3">Περιουσιακό Στοιχείο</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Όνομα:</span>
                        <span className="font-medium">{selectedInvoice.asset_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Κατηγορία:</span>
                        <span>{selectedInvoice.asset_category}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Invoice Items */}
                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h3 className="font-medium text-slate-900 mb-3">Στοιχεία Τιμολογίου</h3>
                    <div className="space-y-3">
                      {(selectedInvoice.items || []).map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-slate-200 last:border-b-0">
                          <div>
                            <p className="font-medium text-slate-900">{item.description}</p>
                            <p className="text-sm text-slate-600">Ποσότητα: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-slate-900">€{item.total.toFixed(2)}</p>
                            <p className="text-sm text-slate-600">€{item.unit_price.toFixed(2)} / μονάδα</p>
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-between items-center pt-3 border-t border-slate-300">
                        <span className="font-bold text-slate-900">Σύνολο:</span>
                        <span className="font-bold text-slate-900 text-lg">€{Number(selectedInvoice.amount).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4">
                    <h3 className="font-medium text-slate-900 mb-3">Ενέργειες</h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => downloadInvoice(selectedInvoice.id)}
                        className="btn btn-outline btn-sm w-full"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Λήψη PDF
                      </button>
                      {selectedInvoice.status === 'pending' && (
                        <button className="btn btn-primary btn-sm w-full">
                          <CreditCard className="h-4 w-4 mr-2" />
                          Πληρωμή
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 