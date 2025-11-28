import { useState, useEffect } from 'react'
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2,
  Eye,
  Check,
  X,
  DollarSign,
  Users,
  Settings,
  Save,
  Tag,
  FolderPlus
} from 'lucide-react'
import { api } from '../lib/api';

export default function AdminPackageManagement() {
  const [packages, setPackages] = useState([])
  const [categories, setCategories] = useState([
    { id: 1, name: 'Eshop', color: 'bg-blue-500' },
    { id: 2, name: 'Social Media', color: 'bg-green-500' },
    { id: 3, name: 'Web Development', color: 'bg-purple-500' },
    { id: 4, name: 'SEO', color: 'bg-orange-500' }
  ])
  const [loading, setLoading] = useState(true)
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingPackage, setEditingPackage] = useState(null)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [activeTab, setActiveTab] = useState('packages')
  const [showSubscribersModal, setShowSubscribersModal] = useState(false)
  const [selectedPackageSubscribers, setSelectedPackageSubscribers] = useState(null)
  const [newPackage, setNewPackage] = useState({
    name: '',
    description: '',
    price: 0,
    category_id: 1,
    features: [],
    billing_cycle: 'μήνα',
    is_active: true
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [packagesResponse, categoriesResponse] = await Promise.all([
        api.get('/admin/packages'),
        api.get('/admin/categories')
      ])
      
      // Ensure packages have proper structure with features as array
      const processedPackages = packagesResponse.data.map(pkg => ({
        ...pkg,
        features: Array.isArray(pkg.features) ? pkg.features : 
                 (typeof pkg.features === 'string' ? JSON.parse(pkg.features) : 
                 (pkg.features ? JSON.parse(pkg.features) : [])),
        subscribers: pkg.subscribers || 0,
        price: pkg.price || 0,
        billing_cycle: pkg.billing_cycle || 'μήνα',
        category_id: pkg.category_id || 1
      }))
      
      setPackages(processedPackages)
      setCategories(categoriesResponse.data || categories)
    } catch (error) {
      console.error('Error fetching data:', error)
      // Use fallback data if API fails
      setPackages([
        {
          id: 1,
          name: 'Βασικό Πακέτο',
          description: 'Βασικές υπηρεσίες για μικρές επιχειρήσεις',
          price: 99,
          billing_cycle: 'μήνα',
          category_id: 1,
          subscribers: 5,
          features: ['Βασική υποστήριξη', 'Email υποστήριξη', 'Ενημέρωση συστήματος']
        },
        {
          id: 2,
          name: 'Premium Πακέτο',
          description: 'Προηγμένες υπηρεσίες για μεγάλες επιχειρήσεις',
          price: 199,
          billing_cycle: 'μήνα',
          category_id: 2,
          subscribers: 3,
          features: ['24/7 υποστήριξη', 'Προτεραιότητα', 'Προηγμένες λειτουργίες', 'Απομακρυσμένη υποστήριξη']
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const getTotalRevenue = () => {
    return (packages || []).reduce((sum, pkg) => sum + (pkg.price * pkg.subscribers), 0)
  }

  const getTotalSubscribers = () => {
    return (packages || []).reduce((sum, pkg) => sum + pkg.subscribers, 0)
  }

  const handleEditPackage = (pkg) => {
    setEditingPackage({ ...pkg })
    setShowEditModal(true)
  }

  const handleSavePackage = async () => {
    if (editingPackage) {
      try {
        await api.put(`/admin/packages/${editingPackage.id}`, {
          name: editingPackage.name,
          description: editingPackage.description,
          price: editingPackage.price,
          category_id: editingPackage.category_id,
          features: editingPackage.features,
          billing_cycle: editingPackage.billing_cycle,
          is_active: editingPackage.is_active
        })
        
        setPackages(packages.map(pkg => 
          pkg.id === editingPackage.id ? editingPackage : pkg
        ))
        setShowEditModal(false)
        setEditingPackage(null)
      } catch (error) {
        console.error('Error updating package:', error)
        alert('Σφάλμα κατά την ενημέρωση του πακέτου')
      }
    }
  }

  const handleCreatePackage = async () => {
    if (newPackage.name && newPackage.description) {
      try {
        const response = await api.post('/admin/packages', {
          name: newPackage.name,
          description: newPackage.description,
          price: newPackage.price,
          category_id: newPackage.category_id,
          features: newPackage.features,
          billing_cycle: newPackage.billing_cycle,
          is_active: newPackage.is_active
        })
        
        const packageToAdd = {
          ...newPackage,
          id: response.data.id,
          subscribers: 0
        }
        setPackages([...packages, packageToAdd])
        setNewPackage({
          name: '',
          description: '',
          price: 0,
          category_id: 1,
          features: [],
          billing_cycle: 'μήνα',
          is_active: true
        })
        setShowCreateModal(false)
      } catch (error) {
        console.error('Error creating package:', error)
        alert('Σφάλμα κατά τη δημιουργία του πακέτου')
      }
    }
  }

  const handleEditCategory = (category) => {
    setEditingCategory({ ...category })
    setShowCategoryModal(true)
  }

  const handleViewSubscribers = async (pkg) => {
    try {
      const response = await api.get(`/admin/packages/${pkg.id}/subscribers`)
      setSelectedPackageSubscribers({ ...pkg, subscribers: response.data })
      setShowSubscribersModal(true)
    } catch (error) {
      console.error('Error fetching subscribers:', error)
      alert('Σφάλμα κατά τη φόρτωση των συνδρομητών')
    }
  }

  const handleSaveCategory = async () => {
    if (editingCategory) {
      try {
        if (editingCategory.id) {
          // Update existing category
          await api.put(`/admin/categories/${editingCategory.id}`, {
            name: editingCategory.name,
            color: editingCategory.color
          })
          setCategories(categories.map(cat => 
            cat.id === editingCategory.id ? editingCategory : cat
          ))
        } else {
          // Add new category
          const response = await api.post('/admin/categories', {
            name: editingCategory.name,
            color: editingCategory.color
          })
          const newCategory = {
            ...editingCategory,
            id: response.data.id
          }
          setCategories([...categories, newCategory])
        }
        setShowCategoryModal(false)
        setEditingCategory(null)
      } catch (error) {
        console.error('Error saving category:', error)
        alert('Σφάλμα κατά την αποθήκευση της κατηγορίας')
      }
    }
  }

  const handleDeleteCategory = async (categoryId) => {
    if (packages.some(pkg => pkg.category_id === categoryId)) {
      alert('Δεν μπορείτε να διαγράψετε μια κατηγορία που έχει πακέτα')
      return
    }
    
    try {
      await api.delete(`/admin/categories/${categoryId}`)
      setCategories(categories.filter(cat => cat.id !== categoryId))
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Σφάλμα κατά τη διαγραφή της κατηγορίας')
    }
  }

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId)
    return category ? category.name : 'Άγνωστη'
  }

  const getCategoryColor = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId)
    return category ? category.color : 'bg-gray-500'
  }

  const colorOptions = [
    { name: 'Μπλε', value: 'bg-blue-500' },
    { name: 'Πράσινο', value: 'bg-green-500' },
    { name: 'Μωβ', value: 'bg-purple-500' },
    { name: 'Πορτοκαλί', value: 'bg-orange-500' },
    { name: 'Κόκκινο', value: 'bg-red-500' },
    { name: 'Κίτρινο', value: 'bg-yellow-500' },
    { name: 'Γκρι', value: 'bg-gray-500' },
    { name: 'Ροζ', value: 'bg-pink-500' }
  ]

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
            Διαχειριστείτε τα πακέτα υπηρεσιών, τις τιμές και τα χαρακτηριστικά για τους πελάτες.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('packages')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'packages'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Πακέτα
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'categories'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Κατηγορίες
        </button>
      </div>

      {activeTab === 'packages' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="stat-card stat-card-blue">
              <div className="flex items-center">
                <Package className="h-8 w-8" />
                <div className="ml-4">
                  <p className="text-sm opacity-90">Ενεργά Πακέτα</p>
                  <p className="text-3xl font-bold">{packages.length}</p>
                </div>
              </div>
            </div>

            <div className="stat-card stat-card-green">
              <div className="flex items-center">
                <Users className="h-8 w-8" />
                <div className="ml-4">
                  <p className="text-sm opacity-90">Συνολικοί Συνδρομητές</p>
                  <p className="text-3xl font-bold">{getTotalSubscribers()}</p>
                </div>
              </div>
            </div>

            <div className="stat-card stat-card-purple">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8" />
                <div className="ml-4">
                  <p className="text-sm opacity-90">Μηνιαία Έσοδα</p>
                  <p className="text-3xl font-bold">€{getTotalRevenue().toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Packages Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div key={pkg.id} className="card hover:shadow-lg transition-all duration-200">
                <div className="p-6">
                  {/* Package Header */}
                  <div className="text-center mb-6">
                    <div className="flex items-center justify-center mb-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${getCategoryColor(pkg.category_id)}`}>
                        <Tag className="h-3 w-3 mr-1" />
                        {getCategoryName(pkg.category_id)}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{pkg.name}</h3>
                    <p className="text-slate-600 text-sm mb-4">{pkg.description}</p>
                    <div className="text-3xl font-bold text-slate-900">
                      €{pkg.price}
                      <span className="text-sm font-normal text-slate-500">/{pkg.billing_cycle}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-6">
                    {Array.isArray(pkg.features) && pkg.features.map((feature, index) => (
                      <div key={index} className="flex items-center">
                        <Check className="h-4 w-4 text-emerald-500 mr-3" />
                        <span className="text-sm text-slate-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="border-t border-slate-200 pt-4 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Συνδρομητές:</span>
                      <span className="font-semibold text-slate-900">{pkg.subscribers}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Μηνιαία Έσοδα:</span>
                      <span className="font-semibold text-slate-900">
                        €{(pkg.price * pkg.subscribers).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button 
                      className="action-btn action-btn-primary flex-1"
                      onClick={() => setSelectedPackage(pkg)}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button 
                      className="action-btn flex-1"
                      onClick={() => handleViewSubscribers(pkg)}
                    >
                      <Users className="h-4 w-4" />
                    </button>
                    <button 
                      className="action-btn flex-1"
                      onClick={() => handleEditPackage(pkg)}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="action-btn action-btn-danger flex-1">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Create Package Button */}
          <div className="text-center">
            <button 
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary btn-lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Δημιουργία Νέου Πακέτου
            </button>
          </div>
        </>
      )}

      {activeTab === 'categories' && (
        <>
          {/* Categories Management */}
          <div className="card">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Διαχείριση Κατηγοριών</h3>
                <button
                  onClick={() => {
                    setEditingCategory({ name: '', color: 'bg-blue-500' })
                    setShowCategoryModal(true)
                  }}
                  className="btn btn-primary btn-sm"
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Προσθήκη Κατηγορίας
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-4 h-4 rounded-full ${category.color} mr-3`}></div>
                      <span className="font-medium text-slate-900">{category.name}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditCategory(category)}
                        className="action-btn"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="action-btn action-btn-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Package Detail Modal */}
      {selectedPackage && (
        <div className="modal-overlay" onClick={() => setSelectedPackage(null)}>
          <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">{selectedPackage.name}</h2>
                <button 
                  onClick={() => setSelectedPackage(null)}
                  className="action-btn"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="form-label">Περιγραφή</label>
                  <p className="text-slate-700">{selectedPackage.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Τιμή</label>
                    <p className="text-2xl font-bold text-slate-900">
                      €{selectedPackage.price} / {selectedPackage.billing_cycle}
                    </p>
                  </div>
                  <div>
                    <label className="form-label">Συνδρομητές</label>
                    <p className="text-2xl font-bold text-slate-900">{selectedPackage.subscribers}</p>
                  </div>
                </div>

                <div>
                  <label className="form-label">Χαρακτηριστικά</label>
                  <div className="space-y-2">
                    {Array.isArray(selectedPackage.features) && selectedPackage.features.map((feature, index) => (
                      <div key={index} className="flex items-center">
                        <Check className="h-4 w-4 text-emerald-500 mr-3" />
                        <span className="text-slate-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Κατάσταση:</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${selectedPackage.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {selectedPackage.is_active ? 'Ενεργό' : 'Ανενεργό'}
                  </span>
                </div>

                <div className="flex space-x-3">
                  <button 
                    className="btn btn-primary btn-md flex-1"
                    onClick={() => {
                      setSelectedPackage(null)
                      handleEditPackage(selectedPackage)
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Επεξεργασία Πακέτου
                  </button>
                  <button className="btn btn-outline btn-md flex-1">
                    <Users className="h-4 w-4 mr-2" />
                    Προβολή Συνδρομητών
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Package Modal */}
      {showEditModal && editingPackage && (
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

              <div className="space-y-4">
                <div>
                  <label className="form-label">Όνομα Πακέτου</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingPackage.name}
                    onChange={(e) => setEditingPackage({...editingPackage, name: e.target.value})}
                  />
                </div>

                <div>
                  <label className="form-label">Περιγραφή</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    value={editingPackage.description}
                    onChange={(e) => setEditingPackage({...editingPackage, description: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Τιμή (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={editingPackage.price}
                      onChange={(e) => setEditingPackage({...editingPackage, price: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="form-label">Κατηγορία</label>
                    <select
                      className="form-input"
                      value={editingPackage.category_id}
                      onChange={(e) => setEditingPackage({...editingPackage, category_id: parseInt(e.target.value)})}
                    >
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label">Χαρακτηριστικά (ένα ανά γραμμή)</label>
                  <textarea
                    className="form-input"
                    rows={6}
                    value={Array.isArray(editingPackage.features) ? editingPackage.features.join('\n') : ''}
                    onChange={(e) => setEditingPackage({
                      ...editingPackage, 
                      features: e.target.value.split('\n').filter(f => f.trim())
                    })}
                    placeholder="Χαρακτηριστικό 1&#10;Χαρακτηριστικό 2&#10;Χαρακτηριστικό 3"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="form-label">Ενεργό Πακέτο</label>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5"
                      checked={editingPackage.is_active}
                      onChange={(e) => setEditingPackage({...editingPackage, is_active: e.target.checked})}
                    />
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button 
                    className="btn btn-primary btn-md flex-1"
                    onClick={handleSavePackage}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Αποθήκευση
                  </button>
                  <button 
                    className="btn btn-outline btn-md flex-1"
                    onClick={() => setShowEditModal(false)}
                  >
                    Ακύρωση
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Package Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Δημιουργία Νέου Πακέτου</h2>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="action-btn"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="form-label">Όνομα Πακέτου</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newPackage.name}
                    onChange={(e) => setNewPackage({...newPackage, name: e.target.value})}
                    placeholder="π.χ. Premium Package"
                  />
                </div>

                <div>
                  <label className="form-label">Περιγραφή</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    value={newPackage.description}
                    onChange={(e) => setNewPackage({...newPackage, description: e.target.value})}
                    placeholder="Περιγραφή του πακέτου..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Τιμή (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={newPackage.price}
                      onChange={(e) => setNewPackage({...newPackage, price: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <label className="form-label">Κατηγορία</label>
                    <select
                      className="form-input"
                      value={newPackage.category_id}
                      onChange={(e) => setNewPackage({...newPackage, category_id: parseInt(e.target.value)})}
                    >
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label">Χαρακτηριστικά (ένα ανά γραμμή)</label>
                  <textarea
                    className="form-input"
                    rows={6}
                    value={newPackage.features.join('\n')}
                    onChange={(e) => setNewPackage({
                      ...newPackage, 
                      features: e.target.value.split('\n').filter(f => f.trim())
                    })}
                    placeholder="Χαρακτηριστικό 1&#10;Χαρακτηριστικό 2&#10;Χαρακτηριστικό 3"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="form-label">Ενεργό Πακέτο</label>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5"
                      checked={newPackage.is_active}
                      onChange={(e) => setNewPackage({...newPackage, is_active: e.target.checked})}
                    />
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button 
                    className="btn btn-primary btn-md flex-1"
                    onClick={handleCreatePackage}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Δημιουργία Πακέτου
                  </button>
                  <button 
                    className="btn btn-outline btn-md flex-1"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Ακύρωση
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && editingCategory && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">
                  {editingCategory.id ? 'Επεξεργασία Κατηγορίας' : 'Προσθήκη Κατηγορίας'}
                </h2>
                <button 
                  onClick={() => setShowCategoryModal(false)}
                  className="action-btn"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="form-label">Όνομα Κατηγορίας</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                    placeholder="π.χ. Eshop, Social Media"
                  />
                </div>

                <div>
                  <label className="form-label">Χρώμα</label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setEditingCategory({...editingCategory, color: color.value})}
                        className={`w-8 h-8 rounded-full ${color.value} border-2 ${
                          editingCategory.color === color.value ? 'border-slate-900' : 'border-transparent'
                        }`}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button 
                    className="btn btn-primary btn-md flex-1"
                    onClick={handleSaveCategory}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Αποθήκευση
                  </button>
                  <button 
                    className="btn btn-outline btn-md flex-1"
                    onClick={() => setShowCategoryModal(false)}
                  >
                    Ακύρωση
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subscribers Modal */}
      {showSubscribersModal && selectedPackageSubscribers && (
        <div className="modal-overlay" onClick={() => setShowSubscribersModal(false)}>
          <div className="modal-content max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">
                  Συνδρομητές - {selectedPackageSubscribers.name}
                </h2>
                <button 
                  onClick={() => setShowSubscribersModal(false)}
                  className="action-btn"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-slate-600">Συνολικοί Συνδρομητές</p>
                      <p className="text-2xl font-bold text-slate-900">{selectedPackageSubscribers.subscribers?.length || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Μηνιαία Έσοδα</p>
                      <p className="text-2xl font-bold text-slate-900">
                        €{((selectedPackageSubscribers.subscribers?.length || 0) * selectedPackageSubscribers.price).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Τιμή ανά Συνδρομητή</p>
                      <p className="text-2xl font-bold text-slate-900">€{selectedPackageSubscribers.price}</p>
                    </div>
                  </div>
                </div>

                {selectedPackageSubscribers.subscribers && selectedPackageSubscribers.subscribers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 font-medium text-slate-600">Πελάτης</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-600">Email</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-600">Ημερομηνία Εγγραφής</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-600">Κατάσταση</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-600">Ενέργειες</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPackageSubscribers.subscribers.map((subscriber) => (
                          <tr key={subscriber.id} className="border-b border-slate-100">
                            <td className="py-3 px-4">
                              <span className="font-medium text-slate-900">
                                {subscriber.first_name} {subscriber.last_name}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-slate-600">{subscriber.email}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-slate-600">
                                {new Date(subscriber.created_at).toLocaleDateString('el-GR')}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                subscriber.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {subscriber.status === 'active' ? 'Ενεργός' : subscriber.status}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <button className="text-blue-600 hover:text-blue-700">
                                <Eye className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-500">Δεν υπάρχουν συνδρομητές για αυτό το πακέτο.</p>
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