import React, { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { 
  Package, 
  CheckCircle, 
  X, 
  Star,
  Clock,
  Users,
  Settings,
  Zap,
  Shield,
  Globe,
  Smartphone,
  Monitor,
  ShoppingCart,
  TrendingUp
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

export default function Services() {
  const [packages, setPackages] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [packagesResponse, categoriesResponse] = await Promise.all([
        api.get('/admin/packages/available'),
        api.get('/admin/categories/available')
      ]);
      setPackages(packagesResponse.data);
      setCategories(categoriesResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Αποτυχία φόρτωσης δεδομένων')
    } finally {
      setLoading(false)
    }
  }

  const filteredPackages = selectedCategory === 'all' 
    ? packages 
    : packages.filter(pkg => pkg.category_id?.toString() === selectedCategory)

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId)
    return category ? category.name : categoryId
  }

  const getCategoryIcon = (categoryName) => {
    const categoryMap = {
      'Hosting': Globe,
      'Ιστοσελίδες': Monitor,
      'Eshop': ShoppingCart,
      'Social Media': Smartphone,
      'SEO': TrendingUp,
      'Συντήρηση': Settings,
    };
    return categoryMap[categoryName] || Package;
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
            Οι Υπηρεσίες Μας
          </h1>
          <p className="text-slate-600 text-lg">
            Ανακαλύψτε την πλήρη γκάμα των ψηφιακών υπηρεσιών μας για την επιχείρησή σας.
          </p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="card">
        <div className="p-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Όλες οι Υπηρεσίες
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id.toString())}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                  selectedCategory === category.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {React.createElement(getCategoryIcon(category.name), { className: 'h-4 w-4' })}
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredPackages.map((pkg) => {
          const categoryName = getCategoryName(pkg.category_id);
          const CategoryIcon = getCategoryIcon(categoryName);
          
          return (
            <div key={pkg.id} className={`card relative ${pkg.is_featured ? 'ring-2 ring-blue-500' : ''}`}>
              {pkg.is_featured && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Δημοφιλές
                  </span>
                </div>
              )}
              
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <CategoryIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{pkg.name}</h3>
                    <p className="text-sm text-slate-600">{categoryName}</p>
                  </div>
                </div>

                <p className="text-slate-600 mb-4">{pkg.description}</p>

                <div className="mb-6">
                  <div className="flex items-baseline space-x-1">
                    <span className="text-3xl font-bold text-slate-900">€{pkg.price}</span>
                    <span className="text-slate-500">/μήνα</span>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  {pkg.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-slate-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <Link to="/assets" className="btn btn-primary w-full">
                  Επιλογή Υπηρεσίας
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {/* Why Choose Us */}
      <div className="card">
        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Γιατί να Επιλέξετε Εμάς;
            </h2>
            <p className="text-slate-600">
              Παρέχουμε αξιόπιστες και επαγγελματικές υπηρεσίες με την καλύτερη τιμή.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="p-3 bg-blue-100 rounded-lg w-fit mx-auto mb-4">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Ασφάλεια</h3>
              <p className="text-sm text-slate-600">
                Προστασία SSL και καθημερινά backups για την ασφάλεια των δεδομένων σας.
              </p>
            </div>

            <div className="text-center">
              <div className="p-3 bg-green-100 rounded-lg w-fit mx-auto mb-4">
                <Zap className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Ταχύτητα</h3>
              <p className="text-sm text-slate-600">
                Υψηλές ταχύτητες φόρτωσης με CDN και βελτιστοποιημένα servers.
              </p>
            </div>

            <div className="text-center">
              <div className="p-3 bg-yellow-100 rounded-lg w-fit mx-auto mb-4">
                <Users className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Υποστήριξη</h3>
              <p className="text-sm text-slate-600">
                24/7 τεχνική υποστήριξη για όλες τις ερωτήσεις και προβλήματα σας.
              </p>
            </div>

            <div className="text-center">
              <div className="p-3 bg-purple-100 rounded-lg w-fit mx-auto mb-4">
                <Settings className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Ευελιξία</h3>
              <p className="text-sm text-slate-600">
                Προσαρμοσμένες λύσεις που προσαρμόζονται στις ανάγκες της επιχείρησής σας.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact CTA */}
      <div className="card card-gradient">
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Έχετε Ερωτήσεις;
          </h2>
          <p className="text-slate-600 mb-6">
            Η ομάδα μας είναι εδώ για να σας βοηθήσει να επιλέξετε την κατάλληλη υπηρεσία.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="btn btn-primary">
              Επικοινωνήστε Μαζί Μας
            </button>
            <button className="btn btn-outline">
              Ζητήστε Προσφορά
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 