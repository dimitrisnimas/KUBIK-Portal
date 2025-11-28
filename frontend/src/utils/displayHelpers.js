// Status color mapping for different statuses
export const getStatusColor = (status) => {
  const statusColors = {
    // Asset statuses
    'active': 'bg-green-100 text-green-800',
    'inactive': 'bg-gray-100 text-gray-800', 
    'suspended': 'bg-yellow-100 text-yellow-800',
    'cancelled': 'bg-red-100 text-red-800',
    
    // Invoice statuses
    'paid': 'bg-green-100 text-green-800',
    'pending': 'bg-yellow-100 text-yellow-800',
    'overdue': 'bg-red-100 text-red-800',
    'draft': 'bg-gray-100 text-gray-800',
    'cancelled': 'bg-red-100 text-red-800',
    
    // Ticket statuses
    'open': 'bg-blue-100 text-blue-800',
    'in_progress': 'bg-yellow-100 text-yellow-800',
    'resolved': 'bg-green-100 text-green-800',
    'closed': 'bg-gray-100 text-gray-800',
    
    // User statuses
    'enabled': 'bg-green-100 text-green-800',
    'disabled': 'bg-red-100 text-red-800',
    
    // Service statuses
    'running': 'bg-green-100 text-green-800',
    'stopped': 'bg-red-100 text-red-800',
    'maintenance': 'bg-yellow-100 text-yellow-800'
  }
  
  return statusColors[status] || 'bg-gray-100 text-gray-800'
}

// Status text mapping for Greek translations
export const getStatusText = (status) => {
  const statusTexts = {
    // Asset statuses
    'active': 'Ενεργό',
    'inactive': 'Ανενεργό',
    'suspended': 'Αναστολή',
    'cancelled': 'Ακυρωμένο',
    
    // Invoice statuses
    'paid': 'Πληρωμένο',
    'pending': 'Εκκρεμές',
    'overdue': 'Ληξιπρόθεσμο',
    'draft': 'Πρόχειρο',
    'cancelled': 'Ακυρωμένο',
    
    // Ticket statuses
    'open': 'Ανοιχτό',
    'in_progress': 'Σε Εξέλιξη',
    'resolved': 'Επιλύθηκε',
    'closed': 'Κλειστό',
    
    // User statuses
    'enabled': 'Ενεργός',
    'disabled': 'Απενεργοποιημένος',
    
    // Service statuses
    'running': 'Εν Λειτουργία',
    'stopped': 'Σταματημένο',
    'maintenance': 'Συντήρηση'
  }
  
  return statusTexts[status] || status
}

// Priority color mapping
export const getPriorityColor = (priority) => {
  const priorityColors = {
    'low': 'bg-gray-100 text-gray-800',
    'medium': 'bg-blue-100 text-blue-800',
    'high': 'bg-orange-100 text-orange-800',
    'urgent': 'bg-red-100 text-red-800'
  }
  
  return priorityColors[priority] || 'bg-gray-100 text-gray-800'
}

// Priority text mapping for Greek translations
export const getPriorityText = (priority) => {
  const priorityTexts = {
    'low': 'Χαμηλή',
    'medium': 'Κανονική',
    'high': 'Υψηλή',
    'urgent': 'Επείγουσα'
  }
  
  return priorityTexts[priority] || priority
}

// Format currency values
export const formatCurrency = (amount, currency = '€') => {
  if (amount === null || amount === undefined) return '—'
  const number = Number(amount)
  if (isNaN(number)) return '—'
  return `${currency}${number.toFixed(2)}`
}

// Format dates in Greek locale
export const formatDate = (date, options = {}) => {
  if (!date) return '—'
  try {
    const dateObj = new Date(date)
    const defaultOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }
    return dateObj.toLocaleDateString('el-GR', { ...defaultOptions, ...options })
  } catch (error) {
    return '—'
  }
}

// Format datetime in Greek locale
export const formatDateTime = (date) => {
  if (!date) return '—'
  try {
    const dateObj = new Date(date)
    return dateObj.toLocaleString('el-GR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    return '—'
  }
}

// Truncate text with ellipsis
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '—'
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Calculate days difference
export const daysDifference = (date1, date2 = new Date()) => {
  if (!date1) return null
  try {
    const d1 = new Date(date1)
    const d2 = new Date(date2)
    const diffTime = d1 - d2
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  } catch (error) {
    return null
  }
}

// Get relative time description
export const getRelativeTime = (date) => {
  if (!date) return '—'
  try {
    const days = daysDifference(date)
    if (days === null) return '—'
    
    if (days === 0) return 'Σήμερα'
    if (days === 1) return 'Αύριο'
    if (days === -1) return 'Χθες'
    if (days > 0) return `Σε ${days} ημέρες`
    if (days < 0) return `Πριν από ${Math.abs(days)} ημέρες`
  } catch (error) {
    return '—'
  }
}

// Format file size
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Format percentage
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined) return '—'
  const number = Number(value)
  if (isNaN(number)) return '—'
  return `${number.toFixed(decimals)}%`
}

// Priority list for tickets
export const prioritiesList = [
  { id: 'low', name: 'Χαμηλή' },
  { id: 'medium', name: 'Κανονική' },
  { id: 'high', name: 'Υψηλή' },
  { id: 'urgent', name: 'Επείγουσα' }
]

// Get status icon based on status
export const getStatusIcon = (status) => {
  const icons = {
    'open': '🔵',
    'in_progress': '🟡',
    'resolved': '✅',
    'closed': '⚫',
    'active': '✅',
    'inactive': '⚫',
    'suspended': '⏸️',
    'paid': '✅',
    'pending': '⏳',
    'overdue': '🔴',
    'draft': '📝'
  }
  
  return icons[status] || '❓'
}

// Get user status icon based on user status
export const getUserStatusIcon = (status) => {
  const icons = {
    'pending': '⏳',
    'approved': '✅',
    'rejected': '❌',
    'suspended': '⏸️',
    'enabled': '✅',
    'disabled': '❌'
  }
  
  return icons[status] || '❓'
}
