import { useState, useEffect } from 'react'
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Reply,
  Clock,
  AlertCircle,
  CheckCircle,
  User,
  Calendar,
  Tag
} from 'lucide-react'

export default function AdminTicketManagement() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedTicket, setSelectedTicket] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Mock data - replace with actual API calls
      const mockTickets = [
        {
          id: 1,
          title: 'Server performance issues',
          description: 'Our web server is experiencing slow response times during peak hours.',
          client_name: 'John Doe',
          client_email: 'john@client1.com',
          asset_name: 'Web Server - Production',
          status: 'open',
          priority: 'high',
          category: 'performance',
          created_at: '2024-07-10 14:30',
          updated_at: '2024-07-11 09:15',
          responses: [
            {
              id: 1,
              author: 'John Doe',
              message: 'Server is very slow today',
              created_at: '2024-07-10 14:30'
            },
            {
              id: 2,
              author: 'Support Team',
              message: 'We are investigating the issue. Please check back in 2 hours.',
              created_at: '2024-07-10 15:45'
            }
          ]
        },
        {
          id: 2,
          title: 'Database connection error',
          description: 'Cannot connect to the database from our application.',
          client_name: 'Jane Smith',
          client_email: 'jane@client2.de',
          asset_name: 'Database Cluster',
          status: 'in_progress',
          priority: 'urgent',
          category: 'database',
          created_at: '2024-07-09 11:20',
          updated_at: '2024-07-11 10:30',
          responses: [
            {
              id: 3,
              author: 'Jane Smith',
              message: 'Database connection is failing',
              created_at: '2024-07-09 11:20'
            }
          ]
        },
        {
          id: 3,
          title: 'Billing question',
          description: 'Need clarification on the latest invoice charges.',
          client_name: 'John Doe',
          client_email: 'john@client1.com',
          asset_name: 'Web Server - Production',
          status: 'resolved',
          priority: 'low',
          category: 'billing',
          created_at: '2024-07-08 16:45',
          updated_at: '2024-07-10 14:20',
          responses: [
            {
              id: 4,
              author: 'John Doe',
              message: 'Can you explain the additional charges?',
              created_at: '2024-07-08 16:45'
            },
            {
              id: 5,
              author: 'Support Team',
              message: 'The charges are for additional bandwidth usage. I\'ve sent you a detailed breakdown.',
              created_at: '2024-07-09 10:15'
            }
          ]
        }
      ]

      setTickets(mockTickets)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.asset_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || ticket.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status) => {
    const statusClasses = {
      open: 'badge badge-error',
      in_progress: 'badge badge-warning',
      resolved: 'badge badge-success',
      closed: 'badge badge-info'
    }
    return statusClasses[status] || 'badge badge-info'
  }

  const getPriorityBadge = (priority) => {
    const priorityClasses = {
      urgent: 'badge badge-error',
      high: 'badge badge-warning',
      medium: 'badge badge-info',
      low: 'badge badge-success'
    }
    return priorityClasses[priority] || 'badge badge-info'
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-4 w-4" />
      case 'in_progress':
        return <Clock className="h-4 w-4" />
      case 'resolved':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const getTicketCount = (status) => {
    return tickets.filter(ticket => ticket.status === status).length
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
            Support Ticket Management
          </h1>
          <p className="text-slate-600 text-lg">
            Manage and respond to client support tickets efficiently.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="stat-card stat-card-red">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8" />
            <div className="ml-4">
              <p className="text-sm opacity-90">Open</p>
              <p className="text-3xl font-bold">{getTicketCount('open')}</p>
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-orange">
          <div className="flex items-center">
            <Clock className="h-8 w-8" />
            <div className="ml-4">
              <p className="text-sm opacity-90">In Progress</p>
              <p className="text-3xl font-bold">{getTicketCount('in_progress')}</p>
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-green">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8" />
            <div className="ml-4">
              <p className="text-sm opacity-90">Resolved</p>
              <p className="text-3xl font-bold">{getTicketCount('resolved')}</p>
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-blue">
          <div className="flex items-center">
            <MessageSquare className="h-8 w-8" />
            <div className="ml-4">
              <p className="text-sm opacity-90">Total</p>
              <p className="text-3xl font-bold">{tickets.length}</p>
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
                  placeholder="Search tickets, clients, or assets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="input"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <button className="btn btn-primary btn-md">
              <Plus className="h-4 w-4 mr-2" />
              Create Ticket
            </button>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        {filteredTickets.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <MessageSquare className="empty-state-icon" />
              <p className="empty-state-text">No tickets found.</p>
            </div>
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <div key={ticket.id} className="card hover:shadow-lg transition-all duration-200">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-semibold text-slate-900">{ticket.title}</h3>
                      <span className={getStatusBadge(ticket.status)}>
                        {getStatusIcon(ticket.status)}
                        <span className="ml-1">{ticket.status.replace('_', ' ')}</span>
                      </span>
                      <span className={getPriorityBadge(ticket.priority)}>
                        {ticket.priority}
                      </span>
                    </div>
                    
                    <p className="text-slate-600 mb-4">{ticket.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-slate-400" />
                        <span className="text-slate-900">{ticket.client_name}</span>
                      </div>
                      <div className="flex items-center">
                        <Tag className="h-4 w-4 mr-2 text-slate-400" />
                        <span className="text-slate-900">{ticket.asset_name}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                        <span className="text-slate-900">{ticket.created_at}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">
                          {ticket.responses.length} response{ticket.responses.length !== 1 ? 's' : ''}
                        </span>
                        <div className="flex space-x-2">
                          <button 
                            className="action-btn action-btn-primary"
                            onClick={() => setSelectedTicket(ticket)}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="action-btn">
                            <Reply className="h-4 w-4" />
                          </button>
                          <button className="action-btn">
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="modal-overlay" onClick={() => setSelectedTicket(null)}>
          <div className="modal-content max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Ticket #{selectedTicket.id}</h2>
                <button 
                  onClick={() => setSelectedTicket(null)}
                  className="action-btn"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{selectedTicket.title}</h3>
                  <div className="flex items-center space-x-3 mb-4">
                    <span className={getStatusBadge(selectedTicket.status)}>
                      {getStatusIcon(selectedTicket.status)}
                      <span className="ml-1">{selectedTicket.status.replace('_', ' ')}</span>
                    </span>
                    <span className={getPriorityBadge(selectedTicket.priority)}>
                      {selectedTicket.priority}
                    </span>
                  </div>
                  <p className="text-slate-600">{selectedTicket.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="form-label">Client</label>
                    <p className="text-slate-900">{selectedTicket.client_name}</p>
                    <p className="text-slate-500">{selectedTicket.client_email}</p>
                  </div>
                  <div>
                    <label className="form-label">Asset</label>
                    <p className="text-slate-900">{selectedTicket.asset_name}</p>
                  </div>
                </div>

                <div>
                  <label className="form-label">Conversation</label>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {selectedTicket.responses.map((response) => (
                      <div key={response.id} className="p-4 rounded-xl bg-slate-50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-slate-900">{response.author}</span>
                          <span className="text-sm text-slate-500">{response.created_at}</span>
                        </div>
                        <p className="text-slate-700">{response.message}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button className="btn btn-primary btn-md flex-1">
                    <Reply className="h-4 w-4 mr-2" />
                    Reply
                  </button>
                  <button className="btn btn-outline btn-md flex-1">
                    <Edit className="h-4 w-4 mr-2" />
                    Update Status
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