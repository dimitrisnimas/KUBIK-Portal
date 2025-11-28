import React from 'react';
import { useForm } from 'react-hook-form';
import { useFileAttachments } from '../hooks/useFileAttachments';
import { prioritiesList, ticketCategories } from '../utils/displayHelpers';
import { Plus, X } from 'lucide-react';

export default function CreateTicketModal({ isOpen, onClose, onSubmit, assets }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const { files, handleFileChange, removeFile, clearFiles } = useFileAttachments();

  const handleFormSubmit = (data) => {
    onSubmit(data, files);
    reset();
    clearFiles();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Νέο Εισιτήριο</h2>
            <button onClick={onClose} className="action-btn">×</button>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <div>
              <label className="form-label">Τίτλος</label>
              <input
                type="text"
                className="form-input"
                placeholder="Σύντομος τίτλος του προβλήματος"
                {...register('title', { required: 'Ο τίτλος είναι υποχρεωτικός' })}
              />
              {errors.title && <p className="form-error">{errors.title.message}</p>}
            </div>

            <div>
              <label className="form-label">Σχετικό Περιουσιακό Στοιχείο (Προαιρετικό)</label>
              <select className="form-input" {...register('asset_id')}>
                <option value="">Επιλέξτε περιουσιακό στοιχείο</option>
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>{asset.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Κατηγορία</label>
              <select className="form-input" {...register('category', { required: 'Η κατηγορία είναι υποχρεωτική' })}>
                <option value="">Επιλέξτε κατηγορία</option>
                {ticketCategories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              {errors.category && <p className="form-error">{errors.category.message}</p>}
            </div>

            <div>
              <label className="form-label">Προτεραιότητα</label>
              <select className="form-input" {...register('priority', { required: 'Η προτεραιότητα είναι υποχρεωτική' })}>
                <option value="">Επιλέξτε προτεραιότητα</option>
                {prioritiesList.map((priority) => (
                  <option key={priority.id} value={priority.id}>{priority.name}</option>
                ))}
              </select>
              {errors.priority && <p className="form-error">{errors.priority.message}</p>}
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
              {errors.price_type && <p className="form-error">{errors.price_type.message}</p>}
            </div>

            <div>
              <label className="form-label">Περιγραφή</label>
              <textarea
                className="form-input"
                rows={4}
                placeholder="Περιγράψτε αναλυτικά το πρόβλημα ή την αίτησή σας"
                {...register('description', { required: 'Η περιγραφή είναι υποχρεωτική' })}
              />
              {errors.description && <p className="form-error">{errors.description.message}</p>}
            </div>

            <div>
              <label className="form-label">Επισυναπτόμενα Αρχεία</label>
              <input type="file" multiple className="form-input" onChange={handleFileChange} />
              {files.length > 0 && (
                <div className="mt-2 space-y-1">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span>{file.name}</span>
                      <button type="button" onClick={() => removeFile(index)} className="text-red-500 hover:text-red-700">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button type="submit" className="btn btn-primary btn-md flex-1">
                <Plus className="h-4 w-4 mr-2" />
                Δημιουργία Εισιτηρίου
              </button>
              <button type="button" className="btn btn-outline btn-md flex-1" onClick={onClose}>
                Ακύρωση
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}