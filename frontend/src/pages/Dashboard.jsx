import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getStatusColor, getStatusText, getPriorityColor, getPriorityText } from '../utils/displayHelpers.js'
import { api } from '../lib/api'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  Package, 
  MessageSquare, 
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  Plus,
  Calendar,
  Users,
  Activity
} from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalAssets: 0,
    activeAssets: 0,
    total_invoices: 0,
    pending_invoices: 0,
    totalTickets: 0,
    openTickets: 0,
    total_paid: 0,
    monthlyExpenses: 0
  })
  const [recentAssets, setRecentAssets] = useState([])
  const [recentTickets, setRecentTickets] = useState([])
  const [recentInvoices, setRecentInvoices] = useState([])
  const [myServices, setMyServices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/dashboard/data');
      const data = response.data;

      setStats(data.stats);
      setRecentAssets(data.recentAssets);
      setRecentTickets(data.recentTickets);
      setRecentInvoices(data.recentInvoices);
      setMyServices(data.myServices);
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Αποτυχία φόρτωσης δεδομένων dashboard')
    } finally {
      setLoading(false)
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
      {/* Welcome Header */}
      <div className="card card-gradient">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Καλώς ήρθατε, {user?.first_name || 'Χρήστη'}!
          </h1>
          <p className="text-slate-600 text-lg">
            Εδώ μπορείτε να δείτε μια επισκόπηση των υπηρεσιών και των δραστηριοτήτων σας.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card stat-card-blue">
          <div className="flex items-center">
            <Package className="h-8 w-8" />
            <div className="ml-4">
              <p className="text-sm opacity-90">Συνολικά Περιουσιακά</p>
              <p className="text-3xl font-bold">{stats.totalAssets}</p>
              <p className="text-xs opacity-75">{stats.activeAssets} ενεργά</p>
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-green">
          <div className="flex items-center">
            <CreditCard className="h-8 w-8" />
            <div className="ml-4">
              <p className="text-sm opacity-90">Συνολικά Τιμολόγια</p>
              <p className="text-3xl font-bold">{stats.total_invoices}</p>
              <p className="text-xs opacity-75">{stats.pending_invoices} εκκρεμεί</p>
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-yellow">
          <div className="flex items-center">
            <MessageSquare className="h-8 w-8" />
            <div className="ml-4">
              <p className="text-sm opacity-90">Συνολικά Αιτήματα</p>
              <p className="text-3xl font-bold">{stats.totalTickets}</p>
              <p className="text-xs opacity-75">{stats.openTickets} ανοιχτά</p>
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-purple">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8" />
            <div className="ml-4">
              <p className="text-sm opacity-90">Συνολικά Πληρωμένα</p>
              <p className="text-3xl font-bold">€{Number(stats.total_paid).toFixed(2)}</p>
              <p className="text-xs opacity-75">Έξοδα: €{Number(stats.monthlyExpenses).toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Γρήγορες Ενέργειες</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/assets" className="quick-action-card">
              <Plus className="h-6 w-6" />
              <span>Νέο Περιουσιακό</span>
            </Link>
            <Link to="/tickets" className="quick-action-card">
              <MessageSquare className="h-6 w-6" />
              <span>Νέο Εισιτήριο</span>
            </Link>
            <Link to="/billing" className="quick-action-card">
              <CreditCard className="h-6 w-6" />
              <span>Προβολή Τιμολογίων</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Assets */}
        <div className="card">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Πρόσφατα Περιουσιακά</h2>
              <Link to="/assets" className="text-sm text-blue-600 hover:text-blue-700">
                Προβολή Όλων
              </Link>
            </div>
          </div>
          <div className="p-6">
            {recentAssets.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-500">Δεν υπάρχουν περιουσιακά ακόμα.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentAssets.map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Package className="h-5 w-5 text-slate-600" />
                      <div>
                        <p className="font-medium text-slate-900">{asset.name}</p>
                        <p className="text-sm text-slate-600">{asset.package_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(asset.status)}`}>
                        {getStatusText(asset.status)}
                      </span>
                    <Link to="/assets" className="text-blue-600 hover:text-blue-700">
                        <Eye className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Tickets */}
        <div className="card">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Πρόσφατα Εισιτήρια</h2>
              <Link to="/tickets" className="text-sm text-blue-600 hover:text-blue-700">
                Προβολή Όλων
              </Link>
            </div>
          </div>
          <div className="p-6">
            {recentTickets.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-500">Δεν υπάρχουν εισιτήρια ακόμα.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentTickets.map((ticket) => (
                  <div key={ticket.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <MessageSquare className="h-5 w-5 text-slate-600" />
                      <div>
                        <p className="font-medium text-slate-900">{ticket.title}</p>
                        <p className="text-sm text-slate-600">
                          {new Date(ticket.created_at).toLocaleDateString('el-GR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                        {getPriorityText(ticket.priority)}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                        {getStatusText(ticket.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="card">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Πρόσφατα Τιμολόγια</h2>
            <Link to="/billing" className="text-sm text-blue-600 hover:text-blue-700">
              Προβολή Όλων
            </Link>
          </div>
        </div>
        <div className="p-6">
          {recentInvoices.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500">Δεν υπάρχουν τιμολόγια ακόμα.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Αριθμός</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Ποσό</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Λήξη</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Κατάσταση</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Ενέργειες</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-slate-100">
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-900">{invoice.invoice_number}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-900">€{Number(invoice.total_amount).toFixed(2)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-600">
                          {new Date(invoice.due_date).toLocaleDateString('el-GR')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          {getStatusText(invoice.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Link to={`/billing`} className="text-blue-600 hover:text-blue-700">
                          <Eye className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* My Services Section */}
      <div className="card">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Οι Υπηρεσίες Μου</h2>
        </div>
        <div className="p-6">
          {myServices.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500">Δεν υπάρχουν ενεργές υπηρεσίες.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Όνομα</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Πακέτο</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Κατηγορία</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Τιμή</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Χαρακτηριστικά</th>
                  </tr>
                </thead>
                <tbody>
                  {myServices.map(service => (
                    <tr key={service.id} className="border-b border-slate-100">
                      <td className="py-3 px-4 font-medium text-slate-900">{service.name}</td>
                      <td className="py-3 px-4">{service.package_name}</td>
                      <td className="py-3 px-4">{service.category_name}</td>
                      <td className="py-3 px-4">€{Number(service.package_price).toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <ul className="list-disc pl-4">
                          {service.package_features && service.package_features.length > 0 ? (
                            service.package_features.map((f, idx) => (
                              <li key={idx}>{f}</li>
                            ))
                          ) : (
                            <li>—</li>
                          )}
                        </ul>
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
  )
} 