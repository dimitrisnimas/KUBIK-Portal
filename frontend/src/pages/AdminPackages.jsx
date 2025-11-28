import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { api } from '../lib/api'
import { 
  Package, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Users,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertCircle,
  X,
  Tag,
  Settings,
  Star,
  Clock,
  TrendingUp,
  Building,
  Globe,
  Smartphone,
  ShoppingCart
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminPackages() {
  const [packages, setPackages] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [showPackageModal, setShowPackageModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showSubscribersModal, setShowSubscribersModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm()

  useEffect(() => {
    fetchPackages()
    fetchCategories()
  }, [])

  const fetchPackages = async () => {
    try {
      // Mock data - replace with actual API call
      const mockPackages = [
        {
          id: 1,
          name: 'Βασικό Eshop',
          description: 'Ιδανικό για μικρές επιχειρήσεις που ξεκινούν online',
          category: 'Eshop',
          price: 299.99,
          billing_cycle: 'monthly',
          features: [
            'Μέχρι 100 προϊόντα',
            'Βασικό SEO',
            'Email υποστήριξη',
            'SSL πιστοποίηση',
            'Mobile responsive'
          ],
          status: 'active',
          subscribers_count: 15,
          created_at: '2024-01-01',
          subscribers: [
            {
              id: 1,
              client_name: 'Γιώργος Παπαδόπουλος',
              asset_name: 'My Eshop',
              subscribed_at: '2024-01-15',
              status: 'active'
            },
            {
              id: 2,
              client_name: 'Μαρία Κωνσταντίνου',
              asset_name: 'Fashion Store',
              subscribed_at: '2024-01-20',
              status: 'active'
            }
          ]
        },
        {
          id: 2,
          name: 'Επαγγελματική Ιστοσελίδα',
          description: 'Σύγχρονη ιστοσελίδα για επαγγελματίες και εταιρείες',
          category: 'Website',
          price: 199.99,
          billing_cycle: 'monthly',
          features: [
            'Προσαρμοσμένος σχεδιασμός',
            'CMS σύστημα',
            'Blog λειτουργικότητα',
            'SEO βελτιστοποίηση',
            '24/7 υποστήριξη'
          ],
          status: 'active',
          subscribers_count: 8,
          created_at: '2024-01-05',
          subscribers: [
            {
              id: 3,
              client_name: 'Δημήτρης Γεωργίου',
              asset_name: 'Company Website',
              subscribed_at: '2024-01-25',
              status: 'active'
            }
          ]
        },
        {
          id: 3,
          name: 'Social Media Management',
          description: 'Πλήρης διαχείριση social media για την επιχείρησή σας',
          category: 'Social Media',
          price: 149.99,
          billing_cycle: 'monthly',
          features: [
            'Διαχείριση 3 social media',
            'Δημιουργία περιεχομένου',
            'Αναλυτικές αναφορές',
            'Διαφημιστικές καμπάνιες',
            'Εβδομαδιαία αναφορές'
          ],
          status: 'active',
          subscribers_count: 12,
          created_at: '2024-01-10',
          subscribers: [
            {
              id: 4,
              client_name: 'Ελένη Δημητρίου',
              asset_name: 'Social Media Campaign',
              subscribed_at: '2024-01-30',
              status: 'active'
            }
          ]
        },
        {
          id: 4,
          name: 'Premium Hosting',
          description: 'Υψηλής απόδοσης hosting με τεχνική υποστήριξη',
          category: 'Hosting',
          price: 99.99,
          billing_cycle: 'monthly',
          features: [
            '99.9% uptime guarantee',
            '24/7 τεχνική υποστήριξη',
            'Αυτόματα backups',
            'SSL πιστοποίηση',
            'CDN υπηρεσίες'
          ],
          status: 'active',
          subscribers_count: 25,
          created_at: '2024-01-15',
          subscribers: []
        }
      ]
      setPackages(mockPackages)
    } catch (error) {
      toast.error('Αποτυχία φόρτωσης πακέτων')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const mockCategories = [
        { id: 1, name: 'Eshop', color: '#3B82F6' },
        { id: 2, name: 'Website', color: '#10B981' },
        { id: 3, name: 'Social Media', color: '#F59E0B' },
        { id: 4, name: 'Hosting', color: '#8B5CF6' }
      ]
      setCategories(mockCategories)
    } catch (error) {
      toast.error('Αποτυχία φόρτωσης κατηγοριών')
    }
  }

  const handleCreatePackage = async (data) => {
    try {
      // Find the category ID from the category name
      const category = categories.find(c => c.name === data.category);
      const category_id = category ? category.id : null;
      
      // Format features as array if it's a string
      const features = typeof data.features === 'string' 
        ? data.features.split('\n').filter(f => f.trim()) 
        : data.features || [];
      
      const packageData = {
        name: data.name,
        description: data.description,
        price: parseFloat(data.price),
        currency: 'EUR',
        billing_cycle: data.billing_cycle || 'monthly',
        category_id: category_id,
        features: features,
        is_active: true
      };
      
      await api.post('/admin/packages', packageData)
      toast.success('Το πακέτο δημιουργήθηκε επιτυχώς')
      setShowPackageModal(false)
      reset()
      fetchPackages()
    } catch (error) {
      toast.error('Αποτυχία δημιουργίας πακέτου')
    }
  }

  const handleEditPackage = async (data) => {
    try {
      console.log('Form data received:', data);
      
      // Find the category ID from the category name
      const category = categories.find(c => c.name === data.category);
      const category_id = category ? category.id : null;
      
      console.log('Category found:', category);
      console.log('Category ID:', category_id);
      
      // Format features as array if it's a string
      const features = typeof data.features === 'string' 
        ? data.features.split('\n').filter(f => f.trim()) 
        : data.features || [];
      
      console.log('Features processed:', features);
      
      const packageData = {
        name: data.name,
        description: data.description,
        price: parseFloat(data.price),
        currency: 'EUR',
        billing_cycle: data.billing_cycle || 'monthly',
        category_id: category_id,
        features: features,
        is_active: true
      };
      
      console.log('Package data being sent:', packageData);
      console.log('Selected package ID:', selectedPackage.id);
      
      await api.put(`/admin/packages/${selectedPackage.id}`, packageData)
      toast.success('Το πακέτο ενημερώθηκε επιτυχώς')
      setShowEditModal(false)
      setSelectedPackage(null)
      reset()
      fetchPackages()
    } catch (error) {
      console.error('Error updating package:', error);
      console.error('Error response:', error.response?.data);
      toast.error('Αποτυχία ενημέρωσης πακέτου')
    }
  }

  const handleDeletePackage = async (packageId) => {
    if (!confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το πακέτο;')) return
    
    try {
      await api.delete(`/admin/packages/${packageId}`)
      toast.success('Το πακέτο διαγράφηκε επιτυχώς')
      fetchPackages()
    } catch (error) {
      toast.error('Αποτυχία διαγραφής πακέτου')
    }
  }

  const handleEditClick = (pkg) => {
    setSelectedPackage(pkg)
    setValue('name', pkg.name)
    setValue('description', pkg.description || '')
    setValue('category', pkg.category_name || pkg.category || '')
    setValue('price', pkg.price)
    setValue('billing_cycle', pkg.billing_cycle || 'monthly')
    
    // Handle features - could be string, array, or JSON string
    let features = [];
    if (typeof pkg.features === 'string') {
      try {
        features = JSON.parse(pkg.features);
      } catch {
        features = pkg.features.split('\n').filter(f => f.trim());
      }
    } else if (Array.isArray(pkg.features)) {
      features = pkg.features;
    }
    
    setValue('features', Array.isArray(features) ? features.join('\n') : '')
    setShowEditModal(true)
  }

  const handleViewSubscribers = (pkg) => {
    setSelectedPackage(pkg)
    setShowSubscribersModal(true)
  }

  const filteredPackages = packages.filter(pkg => {
    const matchesSearch = pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pkg.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || pkg.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const getCategoryColor = (categoryName) => {
    const category = categories.find(c => c.name === categoryName)
    return category ? category.color : '#6B7280'
  }

  const getBillingCycleText = (cycle) => {
    switch (cycle) {
      case 'monthly':
        return 'Μηνιαίως'
      case 'yearly':
        return 'Ετησίως'
      case 'quarterly':
        return 'Τριμηνιαίως'
      default:
        return cycle
    }
  }

  const stats = {
    totalPackages: packages.length,
    activePackages: packages.filter(p => p.status === 'active').length,
    totalSubscribers: packages.reduce((sum, p) => sum + p.subscribers_count, 0),
    totalRevenue: packages.reduce((sum, p) => sum + (p.price * p.subscribers_count), 0)
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
            Διαχείριση Πακέτων
          </h1>
          <p className="text-slate-600 text-lg">
            Διαχειριστείτε τα πακέτα υπηρεσιών και τους συνδρομητές.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="stat-card stat-card-blue">
          <div className="flex items-center">
            <Package className="h-8 w-8" />
            <div className="ml-4">
              <p className="text-sm opacity-90">Συνολικά Πακέτα</p>
              <p className="text-3xl font-bold">{stats.totalPackages}</p>
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-green">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8" />
            <div className="ml-4">
              <p className="text-sm opacity-90">Ενεργά</p>
              <p className="text-3xl font-bold">{stats.activePackages}</p>
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-purple">
          <div className="flex items-center">
            <Users className="h-8 w-8" />
            <div className="ml-4">
              <p className="text-sm opacity-90">Συνδρομητές</p>
              <p className="text-3xl font-bold">{stats.totalSubscribers}</p>
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-yellow">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8" />
            <div className="ml-4">
              <p className="text-sm opacity-90">Μηνιαία Έσοδα</p>
              <p className="text-3xl font-bold">€{stats.totalRevenue.toFixed(2)}</p>
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
                  placeholder="Αναζήτηση πακέτων..."
                  className="form-input pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
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
              onClick={() => setShowPackageModal(true)}
              className="btn btn-primary btn-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Νέο Πακέτο
            </button>
          </div>
        </div>

        {/* Packages List */}
        <div className="p-6">
          {filteredPackages.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500">Δεν βρέθηκαν πακέτα.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPackages.map((pkg) => (
                <div key={pkg.id} className="card">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${getCategoryColor(pkg.category)}20` }}>
                          <Package className="h-5 w-5" style={{ color: getCategoryColor(pkg.category) }} />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">{pkg.name}</h3>
                          <span 
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                            style={{ backgroundColor: `${getCategoryColor(pkg.category)}20`, color: getCategoryColor(pkg.category) }}
                          >
                            {pkg.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-slate-600 text-sm mb-4">{pkg.description}</p>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Τιμή:</span>
                        <span className="font-semibold text-slate-900">€{pkg.price.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Κύκλος:</span>
                        <span className="text-sm text-slate-600">{getBillingCycleText(pkg.billing_cycle)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Συνδρομητές:</span>
                        <span className="font-semibold text-slate-900">{pkg.subscribers_count}</span>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <h4 className="text-sm font-medium text-slate-900">Χαρακτηριστικά:</h4>
                      <ul className="space-y-1">
                        {pkg.features.slice(0, 3).map((feature, index) => (
                          <li key={index} className="text-xs text-slate-600 flex items-center">
                            <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                            {feature}
                          </li>
                        ))}
                        {pkg.features.length > 3 && (
                          <li className="text-xs text-slate-500">+{pkg.features.length - 3} ακόμα</li>
                        )}
                      </ul>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewSubscribers(pkg)}
                        className="btn btn-outline btn-sm flex-1"
                      >
                        <Users className="h-4 w-4 mr-1" />
                        Συνδρομητές
                      </button>
                      
                      <button
                        onClick={() => handleEditClick(pkg)}
                        className="btn btn-outline btn-sm"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDeletePackage(pkg.id)}
                        className="btn btn-error btn-sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Package Modal */}
      {showPackageModal && (
        <div className="modal-overlay" onClick={() => setShowPackageModal(false)}>
          <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Νέο Πακέτο</h2>
                <button 
                  onClick={() => setShowPackageModal(false)}
                  className="action-btn"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit(handleCreatePackage)} className="space-y-4">
                <div>
                  <label className="form-label">Όνομα Πακέτου</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Εισάγετε το όνομα"
                    {...register('name', { required: 'Το όνομα είναι υποχρεωτικό' })}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">Περιγραφή</label>
                  <textarea
                    className="form-input"
                    rows="3"
                    placeholder="Εισάγετε την περιγραφή"
                    {...register('description', { required: 'Η περιγραφή είναι υποχρεωτική' })}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Κατηγορία</label>
                    <select
                      className="form-input"
                      {...register('category', { required: 'Η κατηγορία είναι υποχρεωτική' })}
                    >
                      <option value="">Επιλέξτε κατηγορία</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.name}>{category.name}</option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="form-label">Τιμή (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      placeholder="0.00"
                      {...register('price', { required: 'Η τιμή είναι υποχρεωτική' })}
                    />
                    {errors.price && (
                      <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="form-label">Κύκλος Χρέωσης</label>
                  <select
                    className="form-input"
                    {...register('billing_cycle', { required: 'Ο κύκλος χρέωσης είναι υποχρεωτικός' })}
                  >
                    <option value="">Επιλέξτε κύκλο</option>
                    <option value="monthly">Μηνιαίως</option>
                    <option value="quarterly">Τριμηνιαίως</option>
                    <option value="yearly">Ετησίως</option>
                  </select>
                  {errors.billing_cycle && (
                    <p className="mt-1 text-sm text-red-600">{errors.billing_cycle.message}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">Χαρακτηριστικά (ένα ανά γραμμή)</label>
                  <textarea
                    className="form-input"
                    rows="5"
                    placeholder="Εισάγετε τα χαρακτηριστικά..."
                    {...register('features')}
                  />
                  <p className="mt-1 text-sm text-slate-600">Γράψτε ένα χαρακτηριστικό ανά γραμμή</p>
                </div>

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
                    onClick={() => setShowPackageModal(false)}
                  >
                    Ακύρωση
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Package Modal */}
      {showEditModal && selectedPackage && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Επεξεργασία Πακέτου</h2>
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="action-btn"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit(handleEditPackage)} className="space-y-4">
                <div>
                  <label className="form-label">Όνομα Πακέτου</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Εισάγετε το όνομα"
                    {...register('name', { required: 'Το όνομα είναι υποχρεωτικό' })}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">Περιγραφή</label>
                  <textarea
                    className="form-input"
                    rows="3"
                    placeholder="Εισάγετε την περιγραφή"
                    {...register('description', { required: 'Η περιγραφή είναι υποχρεωτική' })}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Κατηγορία</label>
                    <select
                      className="form-input"
                      {...register('category', { required: 'Η κατηγορία είναι υποχρεωτική' })}
                    >
                      <option value="">Επιλέξτε κατηγορία</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.name}>{category.name}</option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="form-label">Τιμή (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      placeholder="0.00"
                      {...register('price', { required: 'Η τιμή είναι υποχρεωτική' })}
                    />
                    {errors.price && (
                      <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="form-label">Κύκλος Χρέωσης</label>
                  <select
                    className="form-input"
                    {...register('billing_cycle', { required: 'Ο κύκλος χρέωσης είναι υποχρεωτικός' })}
                  >
                    <option value="">Επιλέξτε κύκλο</option>
                    <option value="monthly">Μηνιαίως</option>
                    <option value="quarterly">Τριμηνιαίως</option>
                    <option value="yearly">Ετησίως</option>
                  </select>
                  {errors.billing_cycle && (
                    <p className="mt-1 text-sm text-red-600">{errors.billing_cycle.message}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">Χαρακτηριστικά (ένα ανά γραμμή)</label>
                  <textarea
                    className="form-input"
                    rows="5"
                    placeholder="Εισάγετε τα χαρακτηριστικά..."
                    {...register('features')}
                  />
                  <p className="mt-1 text-sm text-slate-600">Γράψτε ένα χαρακτηριστικό ανά γραμμή</p>
                </div>

                <div className="flex space-x-3">
                  <button 
                    type="submit"
                    className="btn btn-primary btn-md flex-1"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Ενημέρωση
                  </button>
                  <button 
                    type="button"
                    className="btn btn-outline btn-md flex-1"
                    onClick={() => setShowEditModal(false)}
                  >
                    Ακύρωση
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Subscribers Modal */}
      {showSubscribersModal && selectedPackage && (
        <div className="modal-overlay" onClick={() => setShowSubscribersModal(false)}>
          <div className="modal-content max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">
                  Συνδρομητές - {selectedPackage.name}
                </h2>
                <button 
                  onClick={() => setShowSubscribersModal(false)}
                  className="action-btn"
                >
                  ×
                </button>
              </div>

              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-medium text-slate-900 mb-3">Στατιστικά Πακέτου</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900">{selectedPackage.subscribers_count}</p>
                    <p className="text-sm text-slate-600">Συνολικοί Συνδρομητές</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">€{(selectedPackage.price * selectedPackage.subscribers_count).toFixed(2)}</p>
                    <p className="text-sm text-slate-600">Μηνιαία Έσοδα</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{selectedPackage.category}</p>
                    <p className="text-sm text-slate-600">Κατηγορία</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-medium text-slate-900 mb-3">Λίστα Συνδρομητών</h3>
                {selectedPackage.subscribers.length === 0 ? (
                  <p className="text-sm text-slate-600">Δεν υπάρχουν συνδρομητές.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 font-medium text-slate-600">Πελάτης</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-600">Περιουσιακό Στοιχείο</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-600">Ημερομηνία Συνδρομής</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-600">Κατάσταση</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPackage.subscribers.map((subscriber) => (
                          <tr key={subscriber.id} className="border-b border-slate-100">
                            <td className="py-3 px-4">
                              <span className="font-medium text-slate-900">{subscriber.client_name}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-slate-600">{subscriber.asset_name}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-slate-600">
                                {new Date(subscriber.subscribed_at).toLocaleDateString('el-GR')}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                subscriber.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {subscriber.status === 'active' ? 'Ενεργός' : subscriber.status}
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