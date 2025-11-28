import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { getStatusColor, getStatusText } from '../utils/displayHelpers.js';
import toast from 'react-hot-toast';
import { User, Package, CreditCard, MessageSquare } from 'lucide-react';

export default function UserDetailsModal({ user, onClose }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchDetails = async () => {
      setLoading(true);
      try {
        const [assetsRes, invoicesRes, ticketsRes] = await Promise.all([
          api.get(`/admin/assets?user_id=${user.id}`),
          api.get(`/admin/billing/invoices?user_id=${user.id}`),
          api.get(`/admin/tickets?user_id=${user.id}`)
        ]);
        setDetails({ assets: assetsRes.data, invoices: invoicesRes.data, tickets: ticketsRes.data });
      } catch (error) {
        toast.error("Αποτυχία φόρτωσης λεπτομερειών πελάτη.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [user]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-4xl" onClick={(e) => e.stopPropagation()}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              Λεπτομέρειες Πελάτη
            </h2>
            <button onClick={onClose} className="action-btn">
              ×
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="loading-spinner"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* User Info */}
                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h3 className="font-medium text-slate-900 mb-3 flex items-center"><User className="h-4 w-4 mr-2" />Πληροφορίες Πελάτη</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Όνομα:</span>
                        <span className="font-medium">{user.first_name} {user.last_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Email:</span>
                        <span>{user.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Κατάσταση:</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                          {getStatusText(user.status)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Ημερομηνία Εγγραφής:</span>
                        <span>{new Date(user.created_at).toLocaleDateString('el-GR')}</span>
                      </div>
                      {user.last_login && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Τελευταία Σύνδεση:</span>
                          <span>{new Date(user.last_login).toLocaleDateString('el-GR')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Assets */}
                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h3 className="font-medium text-slate-900 mb-3 flex items-center"><Package className="h-4 w-4 mr-2" />Περιουσιακά Στοιχεία ({details.assets.length})</h3>
                    {details.assets.length === 0 ? (
                      <p className="text-sm text-slate-600">Δεν υπάρχουν περιουσιακά στοιχεία.</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {details.assets.map((asset) => (
                          <div key={asset.id} className="flex items-center justify-between p-2 bg-white rounded border">
                            <p className="font-medium text-sm">{asset.name}</p>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${asset.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                              {asset.status === 'active' ? 'Ενεργό' : asset.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Invoices and Tickets */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="font-medium text-slate-900 mb-3 flex items-center"><CreditCard className="h-4 w-4 mr-2" />Τιμολόγια ({details.invoices.length})</h3>
                  {details.invoices.length === 0 ? (
                    <p className="text-sm text-slate-600">Δεν υπάρχουν τιμολόγια.</p>
                  ) : (
                    <p className="text-sm text-slate-600">{details.invoices.length} τιμολόγια βρέθηκαν.</p>
                  )}
                </div>

                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="font-medium text-slate-900 mb-3 flex items-center"><MessageSquare className="h-4 w-4 mr-2" />Εισιτήρια ({details.tickets.length})</h3>
                  {details.tickets.length === 0 ? (
                    <p className="text-sm text-slate-600">Δεν υπάρχουν εισιτήρια.</p>
                  ) : (
                    <p className="text-sm text-slate-600">{details.tickets.length} εισιτήρια βρέθηκαν.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}