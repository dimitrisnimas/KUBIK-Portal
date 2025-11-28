import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { api } from '../lib/api'
import { 
  MessageSquare, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  User,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  Send,
  Reply,
  Tag,
  Mail,
  Phone,
  Building
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminTickets() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [showReplyModal, setShowReplyModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm()

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      const response = await api.get('/admin/tickets')
      setTickets(response.data)
    } catch (error) {
      console.error('Error fetching tickets:', error)
      toast.error('Αποτυχία φόρτωσης εισιτηρίων')
    } finally {
      setLoading(false)
    }
  }

  const handleReply = async (data) => {
    try {
      await api.post(`/admin/tickets/${selectedTicket.id}/reply`, {
        content: data.content,
        send_email: data.send_email
      })
      
      toast.success('Η απάντηση στάλθηκε επιτυχώς')
      setShowReplyModal(false)
      reset()
      fetchTickets()
    } catch (error) {
      toast.error('Αποτυχία αποστολής απάντησης')
    }
  }

  const handleUpdateStatus = async (ticketId, newStatus) => {
    try {
      await api.put(`/admin/tickets/${ticketId}/status`, { status: newStatus })
      toast.success('Η κατάσταση ενημερώθηκε επιτυχώς')
      fetchTickets()
    } catch (error) {
      toast.error('Αποτυχία ενημέρωσης κατάστασης')
    }
  }

  const handleDeleteTicket = async (ticketId) => {
    if (!confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το εισιτήριο;')) return
    
    try {
      await api.delete(`/admin/tickets/${ticketId}`)
      toast.success('Το εισιτήριο διαγράφηκε επιτυχώς')
      fetchTickets()
    } catch (error) {
      toast.error('Αποτυχία διαγραφής εισιτηρίου')
    }
  }

  const handleReplyClick = (ticket) => {
    setSelectedTicket(ticket)
    setShowReplyModal(true)
  }

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.client.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.client.last_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter
    return matchesSearch && matchesStatus && matchesPriority
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800'
      case 'closed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'open':
        return 'Ανοιχτό'
      case 'in_progress':
        return 'Σε Εξέλιξη'
      case 'closed':
        return 'Κλειστό'
      case 'pending':
        return 'Εκκρεμεί'
      default:
        return status
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low':
        return 'bg-gray-100 text-gray-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'urgent':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'low':
        return 'Χαμηλή'
      case 'medium':
        return 'Μεσαία'
      case 'high':
        return 'Υψηλή'
      case 'urgent':
        return 'Επείγουσα'
      default:
        return priority
    }
  }

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'low':
        return <Tag className="h-4 w-4 text-gray-500" />
      case 'medium':
        return <Tag className="h-4 w-4 text-yellow-500" />
      case 'high':
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      case 'urgent':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Tag className="h-4 w-4 text-gray-500" />
    }
  }

  const stats = {
    totalTickets: tickets.length,
    openTickets: tickets.filter(t => t.status === 'open').length,
    inProgressTickets: tickets.filter(t => t.status === 'in_progress').length,
    closedTickets: tickets.filter(t => t.status === 'closed').length
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
            Διαχείριση Εισιτηρίων
          </h1>
          <p className="text-slate-600 text-lg">
            Διαχειριστείτε τα εισιτήρια υποστήριξης και επικοινωνήστε με τους πελάτες.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="stat-card stat-card-blue">
          <div className="flex items-center">
            <MessageSquare className="h-8 w-8" />
            <div className="ml-4">
              <p className="text-sm opacity-90">Συνολικά Εισιτήρια</p>
              <p className="text-3xl font-bold">{stats.totalTickets}</p>
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-blue">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8" />
            <div className="ml-4">
              <p className="text-sm opacity-90">Ανοιχτά</p>
              <p className="text-3xl font-bold">{stats.openTickets}</p>
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-yellow">
          <div className="flex items-center">
            <Clock className="h-8 w-8" />
            <div className="ml-4">
              <p className="text-sm opacity-90">Σε Εξέλιξη</p>
              <p className="text-3xl font-bold">{stats.inProgressTickets}</p>
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-green">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8" />
            <div className="ml-4">
              <p className="text-sm opacity-90">Κλειστά</p>
              <p className="text-3xl font-bold">{stats.closedTickets}</p>
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
                  placeholder="Αναζήτηση εισιτηρίων..."
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
                <option value="open">Ανοιχτά</option>
                <option value="in_progress">Σε Εξέλιξη</option>
                <option value="closed">Κλειστά</option>
                <option value="pending">Εκκρεμεί</option>
              </select>
              <select
                className="form-input"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="all">Όλες οι προτεραιότητες</option>
                <option value="low">Χαμηλή</option>
                <option value="medium">Μεσαία</option>
                <option value="high">Υψηλή</option>
                <option value="urgent">Επείγουσα</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tickets List */}
        <div className="p-6">
          {filteredTickets.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500">Δεν βρέθηκαν εισιτήρια.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTickets.map((ticket) => (
                <div key={ticket.id} className="card">
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                          <MessageSquare className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">{ticket.title}</h3>
                          <p className="text-slate-600">{ticket.client?.first_name || 'N/A'} {ticket.client?.last_name || ''}</p>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-slate-500">
                            <span>Δημιουργία: {new Date(ticket.created_at).toLocaleDateString('el-GR')}</span>
                            <span>Κατηγορία: {ticket.category}</span>
                            <span>{ticket.messages?.length || 0} μηνύματα</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(ticket.priority)}`}>
                          {getPriorityIcon(ticket.priority)}
                          <span className="ml-1">{getPriorityText(ticket.priority)}</span>
                        </span>
                        
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ticket.status)}`}>
                          {getStatusText(ticket.status)}
                        </span>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedTicket(ticket)
                              setShowTicketModal(true)
                            }}
                            className="btn btn-outline btn-sm"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Προβολή
                          </button>
                          
                          <button
                            onClick={() => handleReplyClick(ticket)}
                            className="btn btn-outline btn-sm"
                          >
                            <Reply className="h-4 w-4 mr-1" />
                            Απάντηση
                          </button>
                          
                          <select
                            className="form-input form-input-sm"
                            value={ticket.status}
                            onChange={(e) => handleUpdateStatus(ticket.id, e.target.value)}
                          >
                            <option value="open">Ανοιχτό</option>
                            <option value="in_progress">Σε Εξέλιξη</option>
                            <option value="closed">Κλειστό</option>
                            <option value="pending">Εκκρεμεί</option>
                          </select>
                          
                          <button
                            onClick={() => handleDeleteTicket(ticket.id)}
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

      {/* Reply Modal */}
      {showReplyModal && selectedTicket && (
        <div className="modal-overlay" onClick={() => setShowReplyModal(false)}>
          <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Απάντηση στο Εισιτήριο</h2>
                <button 
                  onClick={() => setShowReplyModal(false)}
                  className="action-btn"
                >
                  ×
                </button>
              </div>

              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-medium text-slate-900 mb-3">Πληροφορίες Εισιτηρίου</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Θέμα:</span>
                    <span className="font-medium">{selectedTicket.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Πελάτης:</span>
                    <span>{selectedTicket.client?.first_name || 'N/A'} {selectedTicket.client?.last_name || ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Email:</span>
                    <span>{selectedTicket.client?.email || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit(handleReply)} className="space-y-4">
                <div>
                  <label className="form-label">Απάντηση</label>
                  <textarea
                    className="form-input"
                    rows="6"
                    placeholder="Γράψτε την απάντησή σας..."
                    {...register('content', { required: 'Η απάντηση είναι υποχρεωτική' })}
                  />
                  {errors.content && (
                    <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="send_email"
                    className="form-checkbox"
                    {...register('send_email')}
                  />
                  <label htmlFor="send_email" className="text-sm text-slate-600">
                    Στείλε email στον πελάτη
                  </label>
                </div>

                <div className="flex space-x-3">
                  <button 
                    type="submit"
                    className="btn btn-primary btn-md flex-1"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Αποστολή Απάντησης
                  </button>
                  <button 
                    type="button"
                    className="btn btn-outline btn-md flex-1"
                    onClick={() => setShowReplyModal(false)}
                  >
                    Ακύρωση
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Details Modal */}
      {showTicketModal && selectedTicket && (
        <div className="modal-overlay" onClick={() => setShowTicketModal(false)}>
          <div className="modal-content max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">
                  Εισιτήριο #{selectedTicket.id} - {selectedTicket.title}
                </h2>
                <button 
                  onClick={() => setShowTicketModal(false)}
                  className="action-btn"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Ticket Info */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="font-medium text-slate-900 mb-3">Πληροφορίες Εισιτηρίου</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Θέμα:</span>
                      <span className="font-medium">{selectedTicket.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Κατηγορία:</span>
                      <span>{selectedTicket.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Κατάσταση:</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTicket.status)}`}>
                        {getStatusText(selectedTicket.status)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Προτεραιότητα:</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedTicket.priority)}`}>
                        {getPriorityText(selectedTicket.priority)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Δημιουργία:</span>
                      <span>{new Date(selectedTicket.created_at).toLocaleDateString('el-GR')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Τελευταία Ενημέρωση:</span>
                      <span>{new Date(selectedTicket.updated_at).toLocaleDateString('el-GR')}</span>
                    </div>
                  </div>
                </div>

                {/* Client Info */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="font-medium text-slate-900 mb-3">Πληροφορίες Πελάτη</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Όνομα:</span>
                      <span>{selectedTicket.client?.first_name || 'N/A'} {selectedTicket.client?.last_name || ''}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Email:</span>
                      <span>{selectedTicket.client?.email || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-medium text-slate-900 mb-3">Ιστορικό Μηνυμάτων</h3>
                <div className="space-y-4">
                  {(selectedTicket.messages || []).map((message) => (
                    <div key={message.id} className={`p-4 rounded-lg ${
                      message.sender === 'admin' ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-white border-l-4 border-gray-300'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">
                          {message.sender_name}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(message.created_at).toLocaleString('el-GR')}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700">{message.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => {
                    setShowTicketModal(false)
                    handleReplyClick(selectedTicket)
                  }}
                  className="btn btn-primary btn-md"
                >
                  <Reply className="h-4 w-4 mr-2" />
                  Απάντηση
                </button>
                <select
                  className="form-input"
                  value={selectedTicket.status}
                  onChange={(e) => handleUpdateStatus(selectedTicket.id, e.target.value)}
                >
                  <option value="open">Ανοιχτό</option>
                  <option value="in_progress">Σε Εξέλιξη</option>
                  <option value="closed">Κλειστό</option>
                  <option value="pending">Εκκρεμεί</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 