import { useForm } from 'react-hook-form'
import { useEffect } from 'react'
import toast from 'react-hot-toast'

export default function AssetFormModal({ isOpen, onClose, onSubmit, asset, clients, packages, categories }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm()

  const isEditMode = !!asset

  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        // Populate form with existing asset data
        reset({
          name: asset.name,
          description: asset.description,
          status: asset.status,
          client_id: asset.client_id || asset.user_id, // Handle both cases
          package_id: asset.package_id,
          category_id: asset.category_id,
          billing_cycle: asset.billing_cycle,
          business_name: asset.business_name || '',
          vat_number: asset.vat_number || '',
          billing_email: asset.billing_email || '',
          address: asset.address || '',
          billing_phone: asset.billing_phone || '',
          next_due_date: asset.next_due_date ? new Date(asset.next_due_date).toISOString().split('T')[0] : '',
          registration_date: asset.registration_date ? new Date(asset.registration_date).toISOString().split('T')[0] : '',
        })
      } else {
        // Reset to default values for new asset
        reset({
          name: '',
          description: '',
          status: 'active',
          client_id: '',
          package_id: '',
          category_id: '',
          billing_cycle: 'monthly',
          business_name: '',
          vat_number: '',
          billing_email: '',
          address: '',
          billing_phone: '',
          next_due_date: '',
          registration_date: new Date().toISOString().split('T')[0],
        })
      }
    }
  }, [isOpen, asset, isEditMode, reset])

  if (!isOpen) return null

  const handleFormSubmit = (data) => {
    // Map client_id to user_id and category_id to category name
    const category = categories.find(c => c.id == data.category_id)?.name || '';

    const formattedData = {
      ...data,
      user_id: data.client_id,
      category: category
    };

    onSubmit(formattedData)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">
            {isEditMode ? 'Επεξεργασία Περιουσιακού Στοιχείου' : 'Δημιουργία Νέου Περιουσιακού Στοιχείου'}
          </h2>
          <button onClick={onClose} className="action-btn">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div>
            <label className="form-label">Όνομα Περιουσιακού Στοιχείου</label>
            <input {...register('name', { required: 'Το όνομα είναι υποχρεωτικό' })} className="form-input" />
            {errors.name && <p className="form-error">{errors.name.message}</p>}
          </div>

          <div>
            <label className="form-label">Περιγραφή</label>
            <textarea {...register('description')} className="form-input" rows="3"></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Πελάτης</label>
              <select {...register('client_id', { required: 'Ο πελάτης είναι υποχρεωτικός' })} className="form-input">
                <option value="">Επιλέξτε Πελάτη</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
              </select>
              {errors.client_id && <p className="form-error">{errors.client_id.message}</p>}
            </div>
            <div>
              <label className="form-label">Πακέτο</label>
              <select {...register('package_id', { required: 'Το πακέτο είναι υποχρεωτικό' })} className="form-input">
                <option value="">Επιλέξτε Πακέτο</option>
                {packages.map(p => <option key={p.id} value={p.id}>{p.name} (€{p.price})</option>)}
              </select>
              {errors.package_id && <p className="form-error">{errors.package_id.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Κατηγορία</label>
              <select {...register('category_id', { required: 'Η κατηγορία είναι υποχρεωτική' })} className="form-input">
                <option value="">Επιλέξτε Κατηγορία</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.category_id && <p className="form-error">{errors.category_id.message}</p>}
            </div>
            <div>
              <label className="form-label">Κατάσταση</label>
              <select {...register('status')} className="form-input">
                <option value="active">Ενεργό</option>
                <option value="inactive">Ανενεργό</option>
                <option value="suspended">Αναστολή</option>
              </select>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4 mt-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Στοιχεία Τιμολόγησης</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Επωνυμία Επιχείρησης</label>
                <input {...register('business_name')} className="form-input" placeholder="Προαιρετικό" />
              </div>
              <div>
                <label className="form-label">ΑΦΜ</label>
                <input {...register('vat_number')} className="form-input" placeholder="Προαιρετικό" />
              </div>
              <div>
                <label className="form-label">Email Τιμολόγησης</label>
                <input {...register('billing_email')} type="email" className="form-input" placeholder="Προαιρετικό" />
              </div>
              <div>
                <label className="form-label">Τηλέφωνο Τιμολόγησης</label>
                <input {...register('billing_phone')} className="form-input" placeholder="Προαιρετικό" />
              </div>
              <div className="md:col-span-2">
                <label className="form-label">Διεύθυνση</label>
                <input {...register('address')} className="form-input" placeholder="Προαιρετικό" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="form-label">Ημερομηνία Εγγραφής</label>
              <input type="date" {...register('registration_date')} className="form-input" />
            </div>
            <div>
              <label className="form-label">Επόμενη Λήξη</label>
              <input type="date" {...register('next_due_date')} className="form-input" />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-outline">
              Ακύρωση
            </button>
            <button type="submit" className="btn btn-primary">
              {isEditMode ? 'Ενημέρωση' : 'Δημιουργία'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
