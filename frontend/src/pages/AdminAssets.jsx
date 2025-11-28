import { useState, useEffect } from 'react'
import AssetFormModal from '../components/AssetFormModal'
import { useDataFetching } from '../hooks/useDataFetching.js'
import { getStatusColor, getStatusText } from '../utils/displayHelpers.js'
import { api } from '../lib/api'
import { 
  Package, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  User,
  Calendar,
  CreditCard,
  Globe,
  Settings,
  CheckCircle,
  AlertCircle,
  Clock,
  X,
  Download,
  Upload,
  Building,
  MapPin,
  Mail,
  Phone
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminAssets() {
  const { data: assets, loading, refetch: fetchAssets } = useDataFetching('/admin/assets');
  const { data: categories } = useDataFetching('/admin/categories', []);
  const { data: packages } = useDataFetching('/admin/packages', []);
  const { data: clients } = useDataFetching('/admin/users', []);
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [modalState, setModalState] = useState({ type: null, asset: null }) // 'create' or 'edit'
  const [showBillingModal, setShowBillingModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [assetInvoices, setAssetInvoices] = useState([])
  const [billingLoading, setBillingLoading] = useState(false)

  const handleFormSubmit = async (data) => {
    const { type, asset } = modalState

    if (type === 'create') {
      try {
        await api.post('/admin/assets', data)
        toast.success('Το περιουσιακό στοιχείο δημιουργήθηκε επιτυχώς')
        setModalState({ type: null, asset: null })
        fetchAssets()
      } catch (error) {
        console.error('Error creating asset:', error)
        toast.error('Αποτυχία δημιουργίας περιουσιακού στοιχείου')
      }
    } else if (type === 'edit' && asset) {
      try {
        await api.put(`/admin/assets/${asset.id}`, data)
        toast.success('Το περιουσιακό στοιχείο ενημερώθηκε επιτυχώς');
        setModalState({ type: null, asset: null });
        fetchAssets();
      } catch (error) {
        console.error('Error updating asset:', error);
        toast.error('Αποτυχία ενημέρωσης περιουσιακού στοιχείου');
      }
    }
  };

  const handleDeleteAsset = async (assetId) => {
    if (!window.confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το περιουσιακό στοιχείο;')) {
      return
    }
    
    try {
      await api.delete(`/admin/assets/${assetId}`)
      toast.success('Το περιουσιακό στοιχείο διαγράφηκε επιτυχώς')
      fetchAssets()
    } catch (error) {
      console.error('Error deleting asset:', error)
      toast.error('Αποτυχία διαγραφής περιουσιακού στοιχείου')
    }
  }

  const handleViewBilling = async (asset) => {
    setSelectedAsset(asset)
    setShowBillingModal(true)
    setBillingLoading(true)
    try {
      const response = await api.get(`/admin/billing/invoices?asset_id=${asset.id}`)
      setAssetInvoices(response.data)
    } catch (error) {
      toast.error("Αποτυχία φόρτωσης τιμολογίων περιουσιακού στοιχείου.")
      setAssetInvoices([])
    } finally {
      setBillingLoading(false)
    }
  }

  const filteredAssets = (assets || []).filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (asset.first_name && asset.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (asset.last_name && asset.last_name.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || asset.category === categoryFilter
    return matchesSearch && matchesStatus && matchesCategory
  })

  const getCategoryColor = (categoryName) => {
    const category = (categories || []).find(c => c.name === categoryName)
    return category ? category.color : '#6B7280'
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
            Διαχείριση Περιουσιακών Στοιχείων
          </h1>
          <p className="text-slate-600 text-lg">
            Διαχειριστείτε τα περιουσιακά στοιχεία των πελατών και τις χρεώσεις τους.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card stat-card-blue">
          <div className="flex items-center">
            <Package className="h-8 w-8" />
            <div className="ml-4">
              <p className="text-sm opacity-90">Συνολικά Περιουσιακά</p>
              <p className="text-3xl font-bold">{assets.length}</p>
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-green">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8" />
            <div className="ml-4">
              <p className="text-sm opacity-90">Ενεργά</p>
              <p className="text-3xl font-bold">{assets.filter(a => a.status === 'active').length}</p>
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-purple">
          <div className="flex items-center">
            <CreditCard className="h-8 w-8" />
            <div className="ml-4">
              <p className="text-sm opacity-90">Συνολική Αξία</p>
              <p className="text-3xl font-bold">€{(assets.reduce((sum, asset) => sum + (parseFloat(asset.package_price) || 0), 0) || 0).toFixed(2)}</p>
            </div>
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
                  placeholder="Αναζήτηση περιουσιακών στοιχείων..."
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
                <option value="active">Ενεργά</option>
                <option value="inactive">Ανενεργά</option>
                <option value="suspended">Αναστέλλεται</option>
              </select>
              <select
                className="form-input"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">Όλες οι κατηγορίες</option>
                {categories.map(category => (
                  <option key={category.id} value={category.name}>{category.name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setModalState({ type: 'create', asset: null })}
              className="btn btn-primary btn-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Νέο Περιουσιακό Στοιχείο
            </button>
          </div>
        </div>

        {/* Assets List */}
        <div className="p-6">
          {filteredAssets.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500">Δεν βρέθηκαν περιουσιακά στοιχεία.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAssets.map((asset) => (
                <div key={asset.id} className="card">
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                          <Package className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">{asset.name}</h3>
                          <p className="text-slate-600">{asset.first_name} {asset.last_name}</p>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-slate-500">
                            <span>Δημιουργία: {new Date(asset.created_at).toLocaleDateString('el-GR')}</span>
                            <span>Πακέτο: {asset.package_name}</span>
                            <span>€{(parseFloat(asset.package_price) || 0).toFixed(2)}/μήνα</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span 
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                          style={{ backgroundColor: `${getCategoryColor(asset.category)}20`, color: getCategoryColor(asset.category) }}
                        >
                          {asset.category}
                        </span>
                        
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(asset.status)}`}>
                          {getStatusText(asset.status)}
                        </span>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewBilling(asset)}
                            className="btn btn-outline btn-sm"
                          >
                            <CreditCard className="h-4 w-4 mr-1" />
                            Χρεώσεις
                          </button>
                          
                          <button
                            onClick={() => setModalState({ type: 'edit', asset: asset })}
                            className="btn btn-outline btn-sm"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Επεξεργασία
                          </button>
                          
                          <button
                            onClick={() => handleDeleteAsset(asset.id)}
                            className="btn btn-error btn-sm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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

      <AssetFormModal
        isOpen={modalState.type === 'create' || modalState.type === 'edit'}
        onClose={() => setModalState({ type: null, asset: null })}
        onSubmit={handleFormSubmit}
        asset={modalState.asset}
        clients={clients}
        packages={packages}
        categories={categories}
      />

      {/* Billing Modal */}
      {showBillingModal && selectedAsset && (
        <div className="modal-overlay" onClick={() => setShowBillingModal(false)}>
          <div className="modal-content max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">
                  Χρεώσεις - {selectedAsset.name}
                </h2>
                <button 
                  onClick={() => setShowBillingModal(false)}
                  className="action-btn"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Asset Info */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="font-medium text-slate-900 mb-3">Πληροφορίες Περιουσιακού Στοιχείου</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Όνομα:</span>
                      <span className="font-medium">{selectedAsset.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Πελάτης:</span>
                      <span>{selectedAsset.first_name} {selectedAsset.last_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Πακέτο:</span>
                      <span>{selectedAsset.package_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Τιμή:</span>
                                             <span className="font-medium">€{(parseFloat(selectedAsset.package_price) || 0).toFixed(2)}/μήνα</span>
                    </div>
                  </div>
                </div>

                {/* Billing Info */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="font-medium text-slate-900 mb-3">Πληροφορίες Χρέωσης</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">ΑΦΜ:</span>
                      <span>{selectedAsset.vat_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Διεύθυνση:</span>
                      <span>{selectedAsset.address}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Email:</span>
                      <span>{selectedAsset.billing_email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Τηλέφωνο:</span>
                      <span>{selectedAsset.billing_phone}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoices */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-medium text-slate-900 mb-3">Τιμολόγια ({assetInvoices.length})</h3>
                {billingLoading ? (
                  <div className="flex justify-center items-center p-4">
                    <div className="loading-spinner-sm"></div>
                  </div>
                ) : assetInvoices.length === 0 ? (
                  <p className="text-sm text-slate-600">Δεν υπάρχουν τιμολόγια για αυτό το στοιχείο.</p>
                ) : (
                  <div className="overflow-x-auto max-h-64">
                    <table className="min-w-full text-sm">
                      <thead className="sticky top-0 bg-slate-50">
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-2 px-3 font-medium text-slate-600">Αριθμός</th>
                          <th className="text-left py-2 px-3 font-medium text-slate-600">Ποσό</th>
                          <th className="text-left py-2 px-3 font-medium text-slate-600">Λήξη</th>
                          <th className="text-left py-2 px-3 font-medium text-slate-600">Κατάσταση</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {assetInvoices.map((invoice) => (
                          <tr key={invoice.id} className="border-b border-slate-100">
                            <td className="py-2 px-3">
                              <span className="font-medium text-slate-900">{invoice.invoice_number}</span>
                            </td>
                            <td className="py-2 px-3">
                              <span className="font-medium text-slate-900">€{Number(invoice.total_amount).toFixed(2)}</span>
                            </td>
                            <td className="py-2 px-3">
                              <span className="text-slate-600">
                                {new Date(invoice.due_date).toLocaleDateString('el-GR')}
                              </span>
                            </td>
                            <td className="py-2 px-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                                {getStatusText(invoice.status)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 