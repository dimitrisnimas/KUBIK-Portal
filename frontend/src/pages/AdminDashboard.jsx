import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getStatusColor, getStatusText, getPriorityColor, getPriorityText, formatCurrency } from '../utils/displayHelpers.js'
import { api } from '../lib/api'
import { 
  Users, 
  Package, 
  CreditCard, 
  MessageSquare, 
  TrendingUp, 
  AlertCircle,
  DollarSign,
  Eye,
  Clock,
  CheckCircle,
  X,
  Plus,
  Calendar,
  User,
  Building,
  Mail
} from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    totalAssets: 0,
    totalRevenue: 0,
    pendingInvoices: 0,
    overdueInvoices: 0,
    openTickets: 0,
    urgentTickets: 0,
    totalPackages: 0
  })
  const [recentClients, setRecentClients] = useState([])
  const [overdueClients, setOverdueClients] = useState([])
  const [recentTickets, setRecentTickets] = useState([])
  const [recentInvoices, setRecentInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const response = await api.get('/admin/dashboard-data');
      const data = response.data;

      setStats(data.stats);
      setRecentClients(data.recentClients);
      setOverdueClients(data.overdueClients);
      setRecentTickets(data.recentTickets);
      setRecentInvoices(data.recentInvoices);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error('Error fetching dashboard data')
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
      {/* Removed Client Selector for Super Admin */}
      {/* Welcome Header */}
      <div className="card card-gradient">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Καλώς ήρθατε, {user?.first_name || 'Admin'}!
          </h1>
          <p className="text-slate-600 text-lg">
            Επισκόπηση του συστήματος και διαχείριση πελατών.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card stat-card-blue">
          <div className="flex items-center">
            <Users className="h-8 w-8" />
            <div className="ml-4">
              <p className="text-sm opacity-90">Συνολικοί Πελάτες</p>
              <p className="text-3xl font-bold">{stats.totalClients}</p>
              <p className="text-xs opacity-75">{stats.activeClients} ενεργοί</p>
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-green">
          <div className="flex items-center">
            <Package className="h-8 w-8" />
            <div className="ml-4">
              <p className="text-sm opacity-90">Συνολικά Περιουσιακά</p>
              <p className="text-3xl font-bold">{stats.totalAssets}</p>
              <p className="text-xs opacity-75">{stats.totalPackages} πακέτα</p>
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-purple">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8" />
            <div className="ml-4">
              <p className="text-sm opacity-90">Συνολικά Έσοδα</p>
              <p className="text-3xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-xs opacity-75">{stats.pendingInvoices} εκκρεμεί</p>
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-yellow">
          <div className="flex items-center">
            <MessageSquare className="h-8 w-8" />
            <div className="ml-4">
              <p className="text-sm opacity-90">Ανοιχτά Εισιτήρια</p>
              <p className="text-3xl font-bold">{stats.openTickets}</p>
              <p className="text-xs opacity-75">Επείγοντα: {stats.urgentTickets}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Overdue Clients Alert */}
      {overdueClients.length > 0 && (
        <div className="card border-red-200 bg-red-50">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <AlertCircle className="h-6 w-6 text-red-600 mr-2" />
                <h2 className="text-lg font-semibold text-red-900">
                  Πελάτες με Ληξιπρόθεσμες Πληρωμές
                </h2>
              </div>
              <span className="text-sm text-red-600 font-medium">
                Σύνολο: {formatCurrency(overdueClients.reduce((sum, client) => sum + (Number(client.overdue_amount) || 0), 0))}
              </span>
            </div>
            
            <div className="space-y-3">
              {overdueClients.map((client) => (
                <div key={client.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-red-200">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="font-medium text-slate-900">
                        {client.first_name} {client.last_name}
                      </p>
                      <p className="text-sm text-slate-600">{client.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-medium text-red-600">{formatCurrency(client.overdue_amount)}</p>
                      <p className="text-sm text-slate-600">{client.overdue_invoices} τιμολόγια</p>
                    </div>
                    <Link to={`/admin/clients?search=${encodeURIComponent(client.email)}`} className="btn btn-outline btn-sm">
                      <Eye className="h-4 w-4 mr-1" />
                      Προβολή
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Γρήγορες Ενέργειες</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/admin/clients" className="quick-action-card">
              <Users className="h-6 w-6" />
              <span>Διαχείριση Πελατών</span>
            </Link>
            <Link to="/admin/assets" className="quick-action-card">
              <Package className="h-6 w-6" />
              <span>Διαχείριση Περιουσιακών</span>
            </Link>
            <Link to="/admin/billing" className="quick-action-card">
              <CreditCard className="h-6 w-6" />
              <span>Διαχείριση Χρεώσεων</span>
            </Link>
            <Link to="/admin/tickets" className="quick-action-card">
              <MessageSquare className="h-6 w-6" />
              <span>Διαχείριση Εισιτηρίων</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Clients */}
        <div className="card">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Πρόσφατοι Πελάτες</h2>
              <Link to="/admin/clients" className="text-sm text-blue-600 hover:text-blue-700">
                Προβολή Όλων
              </Link>
            </div>
          </div>
          <div className="p-6">
            {recentClients.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-500">Δεν υπάρχουν πρόσφατοι πελάτες.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentClients.map((client) => (
                  <div key={client.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-slate-600" />
                      <div>
                        <p className="font-medium text-slate-900">
                          {client.first_name} {client.last_name}
                        </p>
                        <p className="text-sm text-slate-600">{client.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
                        {getStatusText(client.status)}
                      </span>
                      <Link to={`/admin/clients?search=${encodeURIComponent(client.email)}`} className="text-blue-600 hover:text-blue-700">
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
              <Link to="/admin/tickets" className="text-sm text-blue-600 hover:text-blue-700">
                Προβολή Όλων
              </Link>
            </div>
          </div>
          <div className="p-6">
            {recentTickets.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-500">Δεν υπάρχουν πρόσφατα εισιτήρια.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentTickets.map((ticket) => (
                  <div key={ticket.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <MessageSquare className="h-5 w-5 text-slate-600" />
                      <div>
                        <p className="font-medium text-slate-900">{ticket.title}</p>
                        <p className="text-sm text-slate-600">{ticket.client_name || 'N/A'}</p>
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
            <Link to="/admin/billing" className="text-sm text-blue-600 hover:text-blue-700">
              Προβολή Όλων
            </Link>
          </div>
        </div>
        <div className="p-6">
          {recentInvoices.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500">Δεν υπάρχουν πρόσφατα τιμολόγια.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Αριθμός</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Πελάτης</th>
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
                        <span className="text-slate-600">{invoice.client_name || `${invoice.first_name} ${invoice.last_name}`}</span>
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
                        <Link to={`/admin/billing`} className="text-blue-600 hover:text-blue-700">
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
    </div>
  )
} 