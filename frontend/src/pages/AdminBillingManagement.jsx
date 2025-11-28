import { useState, useEffect } from 'react'
import { 
  DollarSign, 
  CreditCard, 
  FileText, 
  Calendar,
  TrendingUp,
  TrendingDown,
  Eye,
  Download,
  Send,
  Plus,
  Search,
  Filter,
  Building,
  Mail,
  MapPin,
  Phone,
  Globe
} from 'lucide-react'

export default function AdminBillingManagement() {
  const [invoices, setInvoices] = useState([])
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('this_month')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Mock data - replace with actual API calls
      const mockInvoices = [
        {
          id: 1,
          asset_id: 1,
          asset_name: 'Web Server - Production',
          client_name: 'John Doe',
          invoice_number: 'INV-2024-001',
          amount: 299.99,
          tax_amount: 59.99,
          total_amount: 359.98,
          currency: 'GBP',
          status: 'paid',
          due_date: '2024-07-15',
          paid_date: '2024-07-10',
          billing_info: {
            company_name: 'Client One Ltd',
            billing_email: 'billing@client1.com',
            billing_address: '123 Business St, London, UK',
            vat_number: 'GB123456789',
            phone: '+44 20 1234 5678',
            website: 'www.client1.com'
          }
        },
        {
          id: 2,
          asset_id: 2,
          asset_name: 'Database Cluster',
          client_name: 'Jane Smith',
          invoice_number: 'INV-2024-002',
          amount: 599.99,
          tax_amount: 113.99,
          total_amount: 713.98,
          currency: 'EUR',
          status: 'pending',
          due_date: '2024-07-20',
          paid_date: null,
          billing_info: {
            company_name: 'Client Two GmbH',
            billing_email: 'accounts@client2.de',
            billing_address: '456 Corporate Ave, Berlin, Germany',
            vat_number: 'DE987654321',
            phone: '+49 30 9876 5432',
            website: 'www.client2.de'
          }
        }
      ]

      const mockAssets = [
        {
          id: 1,
          name: 'Web Server - Production',
          client_name: 'John Doe',
          monthly_cost: 299.99,
          currency: 'GBP',
          last_billed: '2024-07-01'
        },
        {
          id: 2,
          name: 'Database Cluster',
          client_name: 'Jane Smith',
          monthly_cost: 599.99,
          currency: 'EUR',
          last_billed: '2024-07-01'
        }
      ]

      setInvoices(mockInvoices)
      setAssets(mockAssets)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredInvoices = invoices.filter(invoice => 
    invoice.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status) => {
    const statusClasses = {
      paid: 'badge badge-success',
      pending: 'badge badge-warning',
      overdue: 'badge badge-error',
      draft: 'badge badge-info'
    }
    return statusClasses[status] || 'badge badge-info'
  }

  const getTotalRevenue = () => {
    return invoices.reduce((sum, invoice) => sum + invoice.total_amount, 0)
  }

  const getPendingAmount = () => {
    return invoices
      .filter(invoice => invoice.status === 'pending')
      .reduce((sum, invoice) => sum + invoice.total_amount, 0)
  }

  const getThisMonthRevenue = () => {
    return invoices
      .filter(invoice => invoice.paid_date && invoice.paid_date.startsWith('2024-07'))
      .reduce((sum, invoice) => sum + invoice.total_amount, 0)
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
            Billing & Revenue Management
          </h1>
          <p className="text-slate-600 text-lg">
            Manage client invoices, payments, and billing history per asset with individual VAT and contact details.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card stat-card-green">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8" />
            <div className="ml-4">
              <p className="text-sm opacity-90">Total Revenue</p>
              <p className="text-3xl font-bold">${getTotalRevenue().toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-orange">
          <div className="flex items-center">
            <CreditCard className="h-8 w-8" />
            <div className="ml-4">
              <p className="text-sm opacity-90">Pending Payments</p>
              <p className="text-3xl font-bold">${getPendingAmount().toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-purple">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8" />
            <div className="ml-4">
              <p className="text-sm opacity-90">This Month</p>
              <p className="text-3xl font-bold">${getThisMonthRevenue().toLocaleString()}</p>
            </div>
          </div>
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
                  placeholder="Search invoices, assets, or clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="input"
              >
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="this_quarter">This Quarter</option>
                <option value="this_year">This Year</option>
                <option value="all">All Time</option>
              </select>
            </div>
            <button className="btn btn-primary btn-md">
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </button>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-bold text-slate-900">Recent Invoices</h2>
        </div>
        <div className="card-content">
          {filteredInvoices.length === 0 ? (
            <div className="empty-state">
              <FileText className="empty-state-icon" />
              <p className="empty-state-text">No invoices found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Asset</th>
                    <th>Client</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Due Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td>
                        <div>
                          <p className="font-semibold text-slate-900">{invoice.invoice_number}</p>
                          <p className="text-sm text-slate-500">{invoice.currency}</p>
                        </div>
                      </td>
                      <td>
                        <div>
                          <p className="font-medium text-slate-900">{invoice.asset_name}</p>
                          <p className="text-sm text-slate-500">{invoice.billing_info.company_name}</p>
                        </div>
                      </td>
                      <td>
                        <div>
                          <p className="font-medium text-slate-900">{invoice.client_name}</p>
                          <p className="text-sm text-slate-500">{invoice.billing_info.billing_email}</p>
                        </div>
                      </td>
                      <td>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {invoice.currency} {invoice.total_amount}
                          </p>
                          <p className="text-sm text-slate-500">
                            Tax: {invoice.currency} {invoice.tax_amount}
                          </p>
                        </div>
                      </td>
                      <td>
                        <span className={getStatusBadge(invoice.status)}>
                          {invoice.status}
                        </span>
                      </td>
                      <td>
                        <div>
                          <p className="text-sm text-slate-900">{invoice.due_date}</p>
                          {invoice.paid_date && (
                            <p className="text-xs text-slate-500">Paid: {invoice.paid_date}</p>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center space-x-2">
                          <button className="action-btn action-btn-primary" title="View Invoice">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="action-btn" title="Download PDF">
                            <Download className="h-4 w-4" />
                          </button>
                          {invoice.status === 'pending' && (
                            <button className="action-btn" title="Send Reminder">
                              <Send className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Asset Billing Summary */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-bold text-slate-900">Asset Billing Summary</h2>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {assets.map((asset) => (
              <div key={asset.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-900">{asset.name}</h3>
                  <span className="text-sm text-slate-500">{asset.currency}</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Client:</span>
                    <span className="font-medium">{asset.client_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Monthly Cost:</span>
                    <span className="font-semibold">{asset.currency} {asset.monthly_cost}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Last Billed:</span>
                    <span className="text-slate-900">{asset.last_billed}</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200">
                  <div className="flex space-x-2">
                    <button className="btn btn-outline btn-sm flex-1">
                      <FileText className="h-3 w-3 mr-1" />
                      View Invoices
                    </button>
                    <button className="btn btn-primary btn-sm flex-1">
                      <Plus className="h-3 w-3 mr-1" />
                      Create Invoice
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 