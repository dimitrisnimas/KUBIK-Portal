import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import {
  Briefcase, 
  Plus, 
  Edit, 
  Trash2,
  Eye,
  Check,
  Tag,
  DollarSign,
  Calendar,
  Package
} from 'lucide-react'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

export default function Assets() {
  const [assets, setAssets] = useState([])
  const [packages, setPackages] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      description: '',
      category_id: '',
      package_id: null,
      business_name: '',
      vat_number: '',
      address: '',
      billing_email: '',
      billing_phone: ''
    }
  })

  const watchedCategoryId = watch('category_id');

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch assets from API
      const assetsResponse = await api.get('/users/assets')
      setAssets(assetsResponse.data)

      // Fetch packages from the correct endpoint
      const packagesResponse = await api.get('/assets/packages/available')
      setPackages(packagesResponse.data)

      const categoriesResponse = await api.get('/assets/categories/available')
      setCategories(categoriesResponse.data)
    } catch (error) {
      console.error('Error fetching data:', error)
      if (error.response?.status === 401) {
        toast.error('Παρακαλώ συνδεθείτε για να δείτε τα περιουσιακά σας στοιχεία')
      } else {
        toast.error('Αποτυχία φόρτωσης δεδομένων')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAsset = async (data) => {
    try {
      const categoryObject = categories.find(c => c.id.toString() === data.category_id);
      const assetData = {
        name: data.name,
        description: data.description,
        category: categoryObject ? categoryObject.name : '',
        package_id: data.package_id,
        business_name: data.business_name,
        vat_number: data.vat_number,
        address: data.address,
        billing_email: data.billing_email,
        billing_phone: data.billing_phone
      }
      await api.post('/assets', assetData)
      toast.success('Το περιουσιακό στοιχείο δημιουργήθηκε επιτυχώς')
      reset()
      setShowCreateModal(false)
      fetchData()
    } catch (error) {
      console.error('Error creating asset:', error)
      toast.error(error.response?.data?.message || 'Αποτυχία δημιουργίας περιουσιακού στοιχείου')
    }
  }

  const getCategoryColorByName = (name) => {
    const category = categories.find(cat => cat.name === name);
    return category ? category.color : 'bg-gray-500';
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="card card-gradient">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Τα Περιουσιακά Μου
          </h1>
          <p className="text-slate-600 text-lg">
            Διαχειριστείτε τα περιουσιακά σας στοιχεία και τις συνδρομές σας.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card stat-card-blue">
          <div className="flex items-center">
            <Briefcase className="h-8 w-8" />
            <div className="ml-4">
              <p className="text-sm opacity-90">Συνολικά Περιουσιακά</p>
              <p className="text-3xl font-bold">{assets.length}</p>
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-green">
          <div className="flex items-center">
            <Package className="h-8 w-8" />
            <div className="ml-4">
              <p className="text-sm opacity-90">Ενεργές Συνδρομές</p>
              <p className="text-3xl font-bold">{assets.filter(a => a.status === 'active').length}</p>
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-purple">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8" />
            <div className="ml-4">
              <p className="text-sm opacity-90">Μηνιαία Χρέωση</p>
              <p className="text-3xl font-bold">€{assets.reduce((sum, asset) => sum + (asset.package_price || 0), 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {assets.map((asset) => (
          <div key={asset.id} className="card hover:shadow-lg transition-all duration-200">
            <div className="p-6">
              {/* Asset Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{asset.name}</h3>
                  <p className="text-slate-600 text-sm mb-3">{asset.description}</p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  asset.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {asset.status === 'active' ? 'Ενεργό' : 'Ανενεργό'}
                </span>
              </div>

              {/* Category */}
              {asset.category && (
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${getCategoryColorByName(asset.category)}`}>
                    <Tag className="h-3 w-3 mr-1" />
                    {asset.category}
                  </span>
                </div>
              )}

              {/* Created Date */}
              <div className="flex items-center text-sm text-slate-500 mb-4">
                <Calendar className="h-4 w-4 mr-2" />
                Δημιουργήθηκε: {new Date(asset.created_at).toLocaleDateString('el-GR')}
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button onClick={() => setSelectedAsset(asset)} className="action-btn action-btn-primary flex-1">
                  <Eye className="h-4 w-4" />
                </button>
                <button onClick={() => setSelectedAsset(asset)} className="action-btn flex-1">
                  <Edit className="h-4 w-4" />
                </button>
                <button onClick={() => setSelectedAsset(asset)} className="action-btn action-btn-danger flex-1">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Asset Button */}
      <div className="text-center">
        <button 
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary btn-lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Προσθήκη Νέου Περιουσιακού
        </button>
      </div>

      {/* Create Asset Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Προσθήκη Νέου Περιουσιακού</h2>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="action-btn"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit(handleCreateAsset)} className="space-y-4">
                <div>
                  <label className="form-label">Όνομα Περιουσιακού</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="π.χ. My Eshop, Social Media Campaign"
                    {...register('name', { required: 'Το όνομα είναι υποχρεωτικό' })}
                  />
                  {errors.name && <p className="form-error">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="form-label">Περιγραφή</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder="Περιγράψτε το περιουσιακό σας στοιχείο"
                    {...register('description')}
                  />
                </div>

                <div>
                  <label className="form-label">Κατηγορία</label>
                  <select
                    className="form-input"
                    {...register('category_id', { required: 'Η κατηγορία είναι υποχρεωτική' })}
                  >
                    <option value="">Επιλέξτε Κατηγορία</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.category_id && <p className="form-error">{errors.category_id.message}</p>}
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-medium text-slate-900 mb-3">Πληροφορίες Χρέωσης *</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Όνομα Επιχείρησης</label>
                      <input type="text" className="form-input" {...register('business_name', { required: true })} />
                    </div>
                    <div>
                      <label className="form-label">ΑΦΜ</label>
                      <input type="text" className="form-input" {...register('vat_number', { required: true })} />
                    </div>
                    <div>
                      <label className="form-label">Email Χρέωσης</label>
                      <input type="email" className="form-input" {...register('billing_email', { required: true })} />
                    </div>
                    <div>
                      <label className="form-label">Τηλέφωνο</label>
                      <input type="text" className="form-input" {...register('billing_phone', { required: true })} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="form-label">Διεύθυνση</label>
                      <input type="text" className="form-input" {...register('address', { required: true })} />
                    </div>
                  </div>
                </div>

                {watchedCategoryId && (
                  <div>
                    <label className="form-label">Επιλογή Πακέτου</label>
                    <div className="grid grid-cols-1 gap-3 mt-2">
                      {packages.filter(p => p.category_id?.toString() === watchedCategoryId).map((pkg) => (
                        <div
                          key={pkg.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            watch('package_id') === pkg.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                          onClick={() => reset({ ...watch(), package_id: pkg.id })}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-slate-900">{pkg.name}</h4>
                              <p className="text-sm text-slate-600">{pkg.description}</p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {pkg.features.slice(0, 3).map((feature, index) => (
                                  <span key={index} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                                    {feature}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-slate-900">€{pkg.price}</p>
                              <p className="text-sm text-slate-600">/μήνα</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <input type="hidden" {...register('package_id', { required: 'Το πακέτο είναι υποχρεωτικό' })} />
                    {errors.package_id && <p className="form-error mt-2">{errors.package_id.message}</p>}
                  </div>
                )}

                <div className="flex space-x-3">
                  <button 
                    type="submit"
                    className="btn btn-primary btn-md flex-1"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Δημιουργία
                  </button>
                  <button 
                    type="button"
                    className="btn btn-outline btn-md flex-1"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Ακύρωση
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 