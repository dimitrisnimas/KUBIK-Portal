import { useState, useEffect } from 'react'
import { 
  Mail, 
  Plus, 
  Edit, 
  Eye, 
  Save,
  X,
  FileText,
  Send
} from 'lucide-react'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

export default function AdminEmailTemplates() {
  const [templates, setTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const response = await api.get('/admin/email-templates')
      setTemplates(response.data)
    } catch (error) {
      console.error('Error fetching email templates:', error)
      if (error.response?.status === 401) {
        toast.error('Δεν έχετε δικαιώματα για πρόσβαση στα email templates')
      } else {
        toast.error('Αποτυχία φόρτωσης email templates')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (template) => {
    setEditingTemplate({ ...template })
  }

  const handleSave = async () => {
    if (!editingTemplate) return
    
    try {
      await api.put(`/admin/email-templates/${editingTemplate.id}`, editingTemplate)
      toast.success('Το email template αποθηκεύτηκε επιτυχώς')
      setEditingTemplate(null)
      fetchData() // Refresh the list
    } catch (error) {
      console.error('Error saving template:', error)
      toast.error('Αποτυχία αποθήκευσης email template')
    }
  }

  const handleCancel = () => {
    setEditingTemplate(null)
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
            Email Templates
          </h1>
          <p className="text-slate-600 text-lg">
            Manage and customize email templates for your clients with dynamic variables.
          </p>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="card hover:shadow-lg transition-all duration-200">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <Mail className="h-6 w-6 text-blue-600" />
                <h3 className="ml-3 text-lg font-semibold text-slate-900">{template.name}</h3>
              </div>
              
              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Subject</label>
                  <p className="text-sm text-slate-600 truncate">{template.subject}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-slate-700">Variables</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {template.variables.map((variable) => (
                      <span key={variable} className="badge badge-info text-xs">
                        {`{{${variable}}}`}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <button 
                  className="btn btn-outline btn-sm flex-1"
                  onClick={() => setSelectedTemplate(template)}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Preview
                </button>
                <button 
                  className="btn btn-primary btn-sm flex-1"
                  onClick={() => handleEdit(template)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Template Preview Modal */}
      {selectedTemplate && (
        <div className="modal-overlay" onClick={() => setSelectedTemplate(null)}>
          <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">{selectedTemplate.name}</h2>
                <button 
                  onClick={() => setSelectedTemplate(null)}
                  className="action-btn"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="form-label">Subject</label>
                  <p className="text-slate-900 font-medium">{selectedTemplate.subject}</p>
                </div>

                <div>
                  <label className="form-label">Content</label>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">
                      {selectedTemplate.content}
                    </pre>
                  </div>
                </div>

                <div>
                  <label className="form-label">Available Variables</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.variables.map((variable) => (
                      <span key={variable} className="badge badge-info">
                        {`{{${variable}}}`}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button 
                    className="btn btn-primary btn-md flex-1"
                    onClick={() => {
                      setSelectedTemplate(null)
                      handleEdit(selectedTemplate)
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Template
                  </button>
                  <button className="btn btn-outline btn-md flex-1">
                    <Send className="h-4 w-4 mr-2" />
                    Test Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Template Modal */}
      {editingTemplate && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="modal-content max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Edit {editingTemplate.name}</h2>
                <button onClick={handleCancel} className="action-btn">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Template Name</label>
                  <input
                    type="text"
                    value={editingTemplate.name}
                    onChange={(e) => setEditingTemplate({
                      ...editingTemplate,
                      name: e.target.value
                    })}
                    className="input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <input
                    type="text"
                    value={editingTemplate.subject}
                    onChange={(e) => setEditingTemplate({
                      ...editingTemplate,
                      subject: e.target.value
                    })}
                    className="input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Content</label>
                  <textarea
                    value={editingTemplate.content}
                    onChange={(e) => setEditingTemplate({
                      ...editingTemplate,
                      content: e.target.value
                    })}
                    rows={12}
                    className="input resize-none"
                    placeholder="Enter email content with variables like {{first_name}}"
                  />
                </div>

                <div className="flex space-x-3">
                  <button 
                    className="btn btn-primary btn-md flex-1"
                    onClick={handleSave}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </button>
                  <button 
                    className="btn btn-outline btn-md flex-1"
                    onClick={handleCancel}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
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