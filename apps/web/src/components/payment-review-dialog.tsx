"use client";

import { FormEvent, useState } from "react";
import { api, formatCurrency } from "@/lib/api";
import type { PaymentDeclaration, Session } from "@/lib/types";

export function PaymentReviewDialog({ declaration, session, onClose, onChanged }: { declaration: PaymentDeclaration; session: Session; onClose: () => void; onChanged: () => void }) {
  const [status, setStatus] = useState("Approved");
  const [reviewNote, setReviewNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      await api(`/admin/payment-declarations/${declaration.id}/review`, { method: "POST", headers: { "X-CSRF-TOKEN": session.csrfToken }, body: JSON.stringify({ status, reviewNote: reviewNote || null }) });
      onChanged();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Η αξιολόγηση απέτυχε."); }
    finally { setBusy(false); }
  }
  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="review-title">
    <button className="dialog-close" onClick={onClose} aria-label="Κλείσιμο">×</button><span className="eyebrow">ΕΛΕΓΧΟΣ ΠΛΗΡΩΜΗΣ</span><h2 id="review-title">{declaration.invoiceNumber}</h2><p className="muted">{declaration.clientName} · {formatCurrency(declaration.invoiceTotal)}</p>
    <div className="declaration-reference"><span>Αναφορά μεταφοράς</span><strong>{declaration.reference}</strong>{declaration.submittedNote && <p>{declaration.submittedNote}</p>}</div>
    <form className="form-stack" onSubmit={submit}><label><span className="field-label">Απόφαση</span><select value={status} onChange={(e) => setStatus(e.target.value)}><option value="Approved">Έγκριση και εξόφληση τιμολογίου</option><option value="Rejected">Απόρριψη δήλωσης</option></select></label><label><span className="field-label">Σημείωση ελέγχου <small>προαιρετικό</small></span><textarea rows={4} maxLength={1000} value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} /></label>{error && <p className="error-message">{error}</p>}<div className="dialog-actions"><span /><span /><button type="button" className="secondary-button" onClick={onClose}>Ακύρωση</button><button className={`inline-button ${status === "Rejected" ? "danger-button" : "primary-button"}`} disabled={busy}>{busy ? "Καταχώριση…" : status === "Approved" ? "Έγκριση" : "Απόρριψη"}</button></div></form>
  </section></div>;
}
