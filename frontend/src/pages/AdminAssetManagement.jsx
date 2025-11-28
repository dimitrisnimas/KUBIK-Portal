import { useState, useEffect } from 'react'
import { 
  Briefcase, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2,
  DollarSign,
  MapPin,
  Mail,
  Building,
  Phone,
  Globe,
  FileText,
  Calendar,
  User,
  Database
} from 'lucide-react'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

export default function AdminAssetManagement() {
  const [assets, setAssets] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClient, setSelectedClient] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [assetsResponse, clientsResponse] = await Promise.all([
        api.get('/admin/assets'),
        api.get('/admin/users')
      ])
      setAssets(assetsResponse.data)
      setClients(clientsResponse.data)
    } catch (error) {
      toast.error('Error fetching data')
    } finally {
      setLoading(false)
    }
  }

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.client_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesClient = selectedClient === 'all' || asset.client_id === parseInt(selectedClient)
    return matchesSearch && matchesClient
  })

  const getStatusBadge = (status) => {
    const statusClasses = {
      active: 'badge badge-success',
      inactive: 'badge badge-error',
      suspended: 'badge badge-warning'
    }
    return statusClasses[status] || 'badge badge-info'
  }

  const getTypeIcon = (type) => {
    const icons = {
      server: <Briefcase className="h-4 w-4" />,
      database: <Database className="h-4 w-4" />,
      website: <Globe className="h-4 w-4" />,
      application: <FileText className="h-4 w-4" />
    }
    return icons[type] || <Briefcase className="h-4 w-4" />
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
            Asset Management
          </h1>
          <p className="text-slate-600 text-lg">
            Manage all client assets with individual billing information, VAT details, and contact information.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="card">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="search-input flex-1">
                <Search className="search-icon" />
                <input
                  type="text"
                  placeholder="Search assets or clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="input"
              >
                <option value="all">All Clients</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary btn-md"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Asset
            </button>
          </div>
        </div>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredAssets.map((asset) => (
          <div key={asset.id} className="card hover:shadow-lg transition-all duration-200">
            <div className="p-6">
              {/* Asset Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mr-3">
                    {getTypeIcon(asset.type)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{asset.name}</h3>
                    <p className="text-sm text-slate-500">Client: {asset.client_name}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    className="action-btn action-btn-primary"
                    onClick={() => setSelectedAsset(asset)}
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button className="action-btn">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button className="action-btn action-btn-danger">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Asset Details */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Status:</span>
                  <span className={getStatusBadge(asset.status)}>
                    {asset.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Monthly Cost:</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {asset.billing_info.currency} {asset.monthly_cost}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Last Billed:</span>
                  <span className="text-sm text-slate-900">{asset.last_billed}</span>
                </div>
              </div>

              {/* Billing Info Preview */}
              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Billing Information</h4>
                <div className="space-y-1 text-xs text-slate-600">
                  <div className="flex items-center">
                    <Building className="h-3 w-3 mr-2" />
                    {asset.billing_info.company_name}
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-3 w-3 mr-2" />
                    {asset.billing_info.billing_email}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-3 w-3 mr-2" />
                    {asset.billing_info.billing_address}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredAssets.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <Briefcase className="empty-state-icon" />
            <p className="empty-state-text">
              {searchTerm || selectedClient !== 'all' 
                ? 'No assets found matching your criteria.' 
                : 'No assets created yet. Create your first asset to get started.'}
            </p>
          </div>
        </div>
      )}

      {/* Asset Detail Modal */}
      {selectedAsset && (
        <div className="modal-overlay" onClick={() => setSelectedAsset(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Asset Details</h2>
                <button 
                  onClick={() => setSelectedAsset(null)}
                  className="action-btn"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{selectedAsset.name}</h3>
                  <p className="text-sm text-slate-600">Type: {selectedAsset.type}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Monthly Cost</label>
                    <p className="text-lg font-semibold text-slate-900">
                      {selectedAsset.billing_info.currency} {selectedAsset.monthly_cost}
                    </p>
                  </div>
                  <div>
                    <label className="form-label">Tax Rate</label>
                    <p className="text-lg font-semibold text-slate-900">
                      {selectedAsset.billing_info.tax_rate}%
                    </p>
                  </div>
                </div>

                <div>
                  <label className="form-label">Billing Information</label>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <Building className="h-4 w-4 mr-2 text-slate-400" />
                      <span>{selectedAsset.billing_info.company_name}</span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-slate-400" />
                      <span>{selectedAsset.billing_info.billing_email}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-slate-400" />
                      <span>{selectedAsset.billing_info.billing_address}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-slate-400" />
                      <span>{selectedAsset.billing_info.phone}</span>
                    </div>
                    <div className="flex items-center">
                      <Globe className="h-4 w-4 mr-2 text-slate-400" />
                      <span>{selectedAsset.billing_info.website}</span>
                    </div>
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-slate-400" />
                      <span>VAT: {selectedAsset.billing_info.vat_number}</span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button className="btn btn-primary btn-md flex-1">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Asset
                  </button>
                  <button className="btn btn-outline btn-md flex-1">
                    <DollarSign className="h-4 w-4 mr-2" />
                    View Billing
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 