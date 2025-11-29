import React from 'react';
import { useForm } from 'react-hook-form';
import { UserPlus } from 'lucide-react';

export default function CreateUserModal({ isOpen, onClose, onSubmit }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Νέος Πελάτης</h2>
            <button onClick={onClose} className="action-btn">
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="form-label">Όνομα</label>
              <input
                type="text"
                className="form-input"
                placeholder="Εισάγετε το όνομα"
                {...register('first_name', { required: 'Το όνομα είναι υποχρεωτικό' })}
              />
              {errors.first_name && (
                <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
              )}
            </div>

            <div>
              <label className="form-label">Επώνυμο</label>
              <input
                type="text"
                className="form-input"
                placeholder="Εισάγετε το επώνυμο"
                {...register('last_name', { required: 'Το επώνυμο είναι υποχρεωτικό' })}
              />
              {errors.last_name && (
                <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
              )}
            </div>

            <div>
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="Εισάγετε το email"
                {...register('email', {
                  required: 'Το email είναι υποχρεωτικό',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Μη έγκυρη διεύθυνση email',
                  },
                })}
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label className="form-label">Κωδικός Πρόσβασης</label>
              <input
                type="password"
                className="form-input"
                placeholder="Εισάγετε κωδικό πρόσβασης"
                {...register('password', {
                  required: 'Ο κωδικός πρόσβασης είναι υποχρεωτικός',
                  minLength: {
                    value: 8,
                    message: 'Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες'
                  }
                })}
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
            </div>

            <div className="flex space-x-3">
              <button type="submit" className="btn btn-primary btn-md flex-1">
                <UserPlus className="h-4 w-4 mr-2" />
                Δημιουργία Πελάτη
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
