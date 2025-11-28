import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useDataFetching } from '../hooks/useDataFetching.js'
import { useFileAttachments } from '../hooks/useFileAttachments.js'
import { getStatusColor, getStatusText, getPriorityColor, getPriorityText, prioritiesList, getStatusIcon } from '../utils/displayHelpers.js'
import { api } from '../lib/api'
import { 
  Plus, 
  MessageSquare, 
  Clock, 
  TrendingUp, 
  CheckCircle, 
  X,
  Paperclip,
  AlertCircle,
  FileText,
  Settings,
  Send,
  User,
  Calendar
} from 'lucide-react'
import toast from 'react-hot-toast'

const ticketCategories = [
  { id: 'support', name: 'Υποστήριξη', icon: MessageSquare },
  { id: 'change_request', name: 'Αίτημα Αλλαγής', icon: Settings },
  { id: 'bug_report', name: 'Αναφορά Σφάλματος', icon: AlertCircle },
  { id: 'feature_request', name: 'Αίτημα Χαρακτηριστικού', icon: FileText },
]

export default function Tickets() {
  const { data: tickets, loading, refetch: fetchTickets } = useDataFetching('/tickets')
  const { data: assets } = useDataFetching('/users/assets', [])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showReplyModal, setShowReplyModal] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)

  const { 
    files: selectedFiles, 
    handleFileChange, 
    removeFile, 
    clearFiles: clearSelectedFiles 
  } = useFileAttachments();
  const { 
    files: replyFiles, 
    handleFileChange: handleReplyFileChange, 
    removeFile: removeReplyFile, 
    clearFiles: clearReplyFiles 
  } = useFileAttachments();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm()

  const {
    register: registerReply,
    handleSubmit: handleSubmitReply,
    reset: resetReply,
    formState: { errors: replyErrors },
  } = useForm()

  const selectedCategory = watch('category')

  const onSubmit = async (data) => {
    const formData = new FormData()
    
    // Add ticket data
    Object.keys(data).forEach(key => {
      formData.append(key, data[key])
    })
    
    // Add files
    selectedFiles.forEach(file => {
      formData.append('attachments', file)
    })

    try {
      await api.post('/tickets', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      toast.success('Το εισιτήριο δημιουργήθηκε επιτυχώς!')
      setShowCreateModal(false)
      clearSelectedFiles()
      reset()
      fetchTickets()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Αποτυχία δημιουργίας εισιτηρίου')
    }
  }

  const onSubmitReply = async (data) => {
    const formData = new FormData()
    formData.append('content', data.message)
    
    // Add files
    replyFiles.forEach(file => {
      formData.append('attachments', file)
    })

    if (!selectedTicket) {
      toast.error('Δεν έχει επιλεγεί εισιτήριο.');
      return;
    }

    try {
      await api.post(`/tickets/${selectedTicket.id}/messages`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      toast.success('Η απάντησή σας στάλθηκε επιτυχώς!')
      setShowReplyModal(false)
      clearReplyFiles()
      resetReply()
      fetchTickets()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Αποτυχία αποστολής απάντησης')
    }
  }

  const handleReply = async (ticket) => {
    try {
      const response = await api.get(`/tickets/${ticket.id}`);
      setSelectedTicket(response.data);
      setShowReplyModal(true);
    } catch (error) {
      toast.error('Αποτυχία φόρτωσης λεπτομερειών εισιτηρίου');
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
      {/* Header */}
      <div className="card card-gradient">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Τα Εισιτήρια Μου
          </h1>
          <p className="text-slate-600 text-lg">
            Υποβάλετε αιτήματα υποστήριξης και αιτήματα αλλαγών για τις υπηρεσίες σας.
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
              <p className="text-3xl font-bold">{tickets.length}</p>
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-yellow">
          <div className="flex items-center">
            <Clock className="h-8 w-8" />
            <div className="ml-4">
              <p className="text-sm opacity-90">Ανοιχτά</p>
              <p className="text-3xl font-bold">{tickets.filter(t => t.status === 'open').length}</p>
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-blue">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8" />
            <div className="ml-4">
              <p className="text-sm opacity-90">Σε Εξέλιξη</p>
              <p className="text-3xl font-bold">{tickets.filter(t => t.status === 'in_progress').length}</p>
            </div>
          </div>
        </div>

        <div className="stat-card stat-card-green">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8" />
            <div className="ml-4">
              <p className="text-sm opacity-90">Επιλυμένα</p>
              <p className="text-3xl font-bold">{tickets.filter(t => t.status === 'resolved').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="card">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Τα Εισιτήρια Σας</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary btn-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Νέο Εισιτήριο
            </button>
          </div>
        </div>
        
        <div className="divide-y divide-slate-200">
          {tickets.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500">Δεν υπάρχουν εισιτήρια ακόμα. Δημιουργήστε το πρώτο σας εισιτήριο.</p>
            </div>
          ) : (
            tickets.map((ticket) => (
              <div key={ticket.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getStatusIcon(ticket.status)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-medium text-slate-900">
                          {ticket.title}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                          {getStatusText(ticket.status)}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                          {getPriorityText(ticket.priority)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">
                        #{ticket.id} • {ticketCategories.find(c => c.id === ticket.category)?.name}
                      </p>
                      <p className="text-sm text-slate-700 mb-3">
                        {ticket.description}
                      </p>
                      <div className="flex items-center text-xs text-slate-500 space-x-4">
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(ticket.created_at).toLocaleDateString('el-GR')}
                        </span>
                        <span>
                          {ticket.message_count || 0} μηνύματα
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleReply(ticket)}
                      className="btn btn-outline btn-sm"
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Προβολή & Απάντηση
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Νέο Εισιτήριο</h2>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="action-btn"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="form-label">Τίτλος</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Σύντομος τίτλος του προβλήματος"
                    {...register('title', { required: 'Ο τίτλος είναι υποχρεωτικός' })}
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">Σχετικό Περιουσιακό Στοιχείο (Προαιρετικό)</label>
                  <select
                    className="form-input"
                    {...register('asset_id')}
                  >
                    <option value="">Επιλέξτε περιουσιακό στοιχείο</option>
                    {assets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Κατηγορία</label>
                  <select
                    className="form-input"
                    {...register('category', { required: 'Η κατηγορία είναι υποχρεωτική' })}
                  >
                    <option value="">Επιλέξτε κατηγορία</option>
                    {ticketCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">Προτεραιότητα</label>
                  <select
                    className="form-input"
                    {...register('priority', { required: 'Η προτεραιότητα είναι υποχρεωτική' })}
                  >
                    <option value="">Επιλέξτε προτεραιότητα</option>
                    {prioritiesList.map((priority) => (
                      <option key={priority.id} value={priority.id}>
                        {priority.name}
                      </option>
                    ))}
                  </select>
                  {errors.priority && (
                    <p className="mt-1 text-sm text-red-600">{errors.priority.message}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">Τύπος Αιτήματος</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="radio" className="form-radio" {...register('price_type', { required: 'Ο τύπος αιτήματος είναι υποχρεωτικός' })} value="with_package" />
                      <span className="ml-2 text-sm">Αφορά υπάρχουσα υπηρεσία (με πακέτο)</span>
                    </label>
                    <label className="flex items-center">
                      <input type="radio" className="form-radio" {...register('price_type', { required: 'Ο τύπος αιτήματος είναι υποχρεωτικός' })} value="without_package" />
                      <span className="ml-2 text-sm">Γενική ερώτηση / Νέο αίτημα (χωρίς πακέτο)</span>
                    </label>
                  </div>
                  {errors.price_type && (
                    <p className="mt-1 text-sm text-red-600">{errors.price_type.message}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">Περιγραφή</label>
                  <textarea
                    className="form-input"
                    rows={4}
                    placeholder="Περιγράψτε αναλυτικά το πρόβλημα ή την αίτησή σας"
                    {...register('description', { required: 'Η περιγραφή είναι υποχρεωτική' })}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">Επισυναπτόμενα Αρχεία</label>
                  <input
                    type="file"
                    multiple
                    className="form-input"
                    onChange={handleFileChange}
                  />
                  {selectedFiles.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span>{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex space-x-3">
                  <button 
                    type="submit"
                    className="btn btn-primary btn-md flex-1"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Δημιουργία Εισιτηρίου
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

      {/* Reply Modal */}
      {showReplyModal && selectedTicket && (
        <div className="modal-overlay" onClick={() => setShowReplyModal(false)}>
          <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">
                  Απάντηση στο Εισιτήριο #{selectedTicket.id}
                </h2>
                <button 
                  onClick={() => setShowReplyModal(false)}
                  className="action-btn"
                >
                  ×
                </button>
              </div>

              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-medium text-slate-900 mb-2">{selectedTicket.title}</h3>
                <p className="text-sm text-slate-600">{selectedTicket.description}</p>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-4 p-4 bg-white rounded-lg border">
                <h4 className="font-medium text-slate-900 mb-2">Ιστορικό Συνομιλίας</h4>
                {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                  selectedTicket.messages.map((message) => (
                    <div key={message.id} className={`flex items-start space-x-3 ${message.sender_type === 'admin' ? 'justify-end' : ''}`}>
                      {message.sender_type !== 'admin' && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-slate-500">
                          <User className="h-4 w-4 text-white" />
                        </div>
                      )}
                      <div className={`flex-1 max-w-md ${message.sender_type === 'admin' ? 'text-right' : ''}`}>
                        <div className={`inline-block p-3 rounded-lg ${message.sender_type === 'admin' ? 'bg-blue-100 text-blue-900' : 'bg-slate-100 text-slate-900'}`}>
                          <p className="text-sm text-left">{message.content}</p>
                          <p className="text-xs opacity-70 mt-1 text-left">{new Date(message.created_at).toLocaleString('el-GR')}</p>
                        </div>
                      </div>
                      {message.sender_type === 'admin' && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-blue-500">
                          <User className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                  ))
                ) : <p className="text-sm text-slate-500">Δεν υπάρχει ιστορικό για αυτό το εισιτήριο.</p>}
              </div>
              <form onSubmit={handleSubmitReply(onSubmitReply)} className="space-y-4">
                <div>
                  <label className="form-label">Μήνυμα</label>
                  <textarea
                    className="form-input"
                    rows={4}
                    placeholder="Γράψτε την απάντησή σας..."
                    {...registerReply('message', { required: 'Το μήνυμα είναι υποχρεωτικό' })}
                  />
                  {replyErrors.message && (
                    <p className="mt-1 text-sm text-red-600">{replyErrors.message.message}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">Επισυναπτόμενα Αρχεία</label>
                  <input
                    type="file"
                    multiple
                    className="form-input"
                    onChange={handleReplyFileChange}
                  />
                  {replyFiles.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {replyFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span>{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeReplyFile(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
    </div>
  )
}