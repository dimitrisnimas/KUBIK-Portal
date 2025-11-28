import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { getStatusColor, getStatusText, getUserStatusIcon } from '../utils/displayHelpers.js'
import UserDetailsModal from '../components/UserDetailsModal.jsx'
import CreateUserModal from '../components/CreateUserModal.jsx'
import StatCard from '../components/StatCard.jsx'
import { useDataFetching } from '../hooks/useDataFetching.js'
import { api } from '../lib/api'
import { 
  Users, 
  UserPlus, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle, 
  X, 
  Clock,
  AlertCircle,
  Search,
  Filter,
  Package,
  CreditCard,
  MessageSquare,
  Calendar,
  Mail,
  Phone,
  Building,
  MapPin,
  Plus,
  User,
  Shield,
  Ban
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function AdminUsers() {
  const { data: users, loading, refetch: fetchUsers } = useDataFetching('/admin/users');
  const [selectedUser, setSelectedUser] = useState(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [searchParams] = useSearchParams()

  useEffect(() => {
    const initialSearch = searchParams.get('search')
    if (initialSearch) {
      setSearchTerm(initialSearch)
    }
  }, [searchParams])

  const handleViewUser = async (user) => {
    // The modal will now handle fetching its own details.
    setSelectedUser(user)
    setShowUserModal(true)
  }

  const handleUserAction = async (userId, action) => {
    // The 'unsuspend' action should map to 'approved' status
    const newStatus = action === 'unsuspend' ? 'approved' : action;
    try {
      await api.put(`/admin/users/${userId}/status`, { status: newStatus });
      const actionText = {
        'approve': 'εγκρίθηκε',
        'reject': 'απορρίφθηκε',
    'suspend': 'τέθηκε σε αναστολή',
    'unsuspend': 'ενεργοποιήθηκε ξανά'
      }
  toast.success(`Ο λογαριασμός χρήστη ${actionText[action]} επιτυχώς`)
      fetchUsers()
    } catch (error) {
      console.error('Error performing user action:', error)
      toast.error('Αποτυχία εκτέλεσης ενέργειας')
    }
  }

  const handleCreateUser = async (data) => {
    try {
      await api.post('/admin/users', data)
      toast.success('Ο πελάτης δημιουργήθηκε επιτυχώς')
      setShowCreateModal(false) // The form reset is now handled inside the modal
      fetchUsers()
    } catch (error) {
      console.error('Error creating user:', error)
      toast.error('Αποτυχία δημιουργίας πελάτη')
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτόν τον πελάτη;')) {
      return
    }
    
    try {
      await api.delete(`/admin/users/${userId}`)
      toast.success('Ο πελάτης διαγράφηκε επιτυχώς')
      fetchUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Αποτυχία διαγραφής πελάτη')
    }
  }

  const filteredUsers = (users || []).filter(user => {
    const matchesSearch = user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter
    return matchesSearch && matchesStatus
  })

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
            Διαχείριση Πελατών
          </h1>
          <p className="text-slate-600 text-lg">
            Διαχειριστείτε τους πελάτες, τις εγγραφές και τις ενέργειες τους.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          icon={Users}
          title="Συνολικοί Πελάτες"
          value={(users || []).length}
          colorClass="stat-card-blue"
        />
        <StatCard 
          icon={CheckCircle}
          title="Εγκεκριμένοι"
          value={(users || []).filter(u => u.status === 'approved').length}
          colorClass="stat-card-green"
        />
        <StatCard 
          icon={Clock}
          title="Εκκρεμεί"
          value={(users || []).filter(u => u.status === 'pending').length}
          colorClass="stat-card-yellow"
        />
        <StatCard 
          icon={AlertCircle}
          title="Απορρίφθηκε"
          value={(users || []).filter(u => u.status === 'rejected').length}
          colorClass="stat-card-red"
        />
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
                  placeholder="Αναζήτηση πελατών..."
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
                <option value="approved">Εγκεκριμένοι</option>
                <option value="pending">Εκκρεμεί</option>
                <option value="rejected">Απορρίφθηκε</option>
                <option value="suspended">Αναστέλλεται</option>
              </select>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary btn-sm"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Νέος Πελάτης
            </button>
          </div>
        </div>

        {/* Users List */}
        <div className="p-6">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500">Δεν βρέθηκαν πελάτες.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div key={user.id} className="card">
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                          <span className="text-white font-semibold text-lg">
                            {user.first_name?.[0]}{user.last_name?.[0]}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">
                            {user.first_name} {user.last_name}
                          </h3>
                          <p className="text-slate-600">{user.email}</p>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-slate-500">
                            <span>Εγγραφή: {new Date(user.created_at).toLocaleDateString('el-GR')}</span>
                            {user.last_login && (
                              <span>Τελευταία σύνδεση: {new Date(user.last_login).toLocaleDateString('el-GR')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(user.status)}`}>
                          {getUserStatusIcon(user.status)}
                          <span className="ml-1">{getStatusText(user.status)}</span>
                        </span>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewUser(user)}
                            className="btn btn-outline btn-sm"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Προβολή
                          </button>
                          
                          {user.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleUserAction(user.id, 'approve')}
                                className="btn btn-success btn-sm"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Έγκριση
                              </button>
                              <button
                                onClick={() => handleUserAction(user.id, 'reject')}
                                className="btn btn-error btn-sm"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Απόρριψη
                              </button>
                            </>
                          )}
                          
                          {user.status === 'approved' && (
                            <button
                              onClick={() => handleUserAction(user.id, 'suspend')}
                              className="btn btn-warning btn-sm"
                            >
                              <Ban className="h-4 w-4 mr-1" />
                              Αναστολή
                            </button>
                          )}
                          
                          {user.status === 'suspended' && (
                            <button
                              onClick={() => handleUserAction(user.id, 'unsuspend')}
                              className="btn btn-success btn-sm"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                          Ενεργοποίηση
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleDeleteUser(user.id)}
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

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <UserDetailsModal 
          user={selectedUser} 
          onClose={() => {
            setShowUserModal(false)
            setSelectedUser(null)
          }} 
        />
      )}

      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateUser}
      />
    </div>
  )
} 