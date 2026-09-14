"use client";

import { FormEvent, useState } from "react";
import { api, formatCurrency } from "@/lib/api";
import type { Session } from "@/lib/types";

type DraftLine = { description: string; quantity: string; unitPrice: string };
const isoDate = (date: Date) => date.toISOString().slice(0, 10);

export function InvoiceDialog({ session, onClose, onChanged }: { session: Session; onClose: () => void; onChanged: () => void }) {
  const today = new Date(); const due = new Date(); due.setDate(due.getDate() + 30);
  const [issueDate, setIssueDate] = useState(isoDate(today));
  const [dueDate, setDueDate] = useState(isoDate(due));
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([{ description: "", quantity: "1", unitPrice: "0" }]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const subtotal = lines.reduce((sum, line) => sum + Number(line.quantity || 0) * Number(line.unitPrice || 0), 0);
  const total = Math.round(subtotal * 1.24 * 100) / 100;

  function updateLine(index: number, field: keyof DraftLine, value: string) {
    setLines((current) => current.map((line, position) => position === index ? { ...line, [field]: value } : line));
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      await api("/admin/invoices", {
        method: "POST", headers: { "X-CSRF-TOKEN": session.csrfToken },
        body: JSON.stringify({ issueDate, dueDate, notes: notes || null, lines: lines.map((line) => ({ description: line.description, quantity: Number(line.quantity), unitPrice: Number(line.unitPrice) })) })
      });
      onChanged();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Η δημιουργία απέτυχε."); }
    finally { setBusy(false); }
  }

  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="dialog-card invoice-dialog" role="dialog" aria-modal="true" aria-labelledby="invoice-dialog-title">
      <button className="dialog-close" onClick={onClose} aria-label="Κλείσιμο">×</button><span className="eyebrow">ΝΕΟ ΤΙΜΟΛΟΓΙΟ</span><h2 id="invoice-dialog-title">Δημιουργία παραστατικού demo</h2><p className="muted">Τα σύνολα και ο ΦΠΑ 24% υπολογίζονται αποκλειστικά από το API.</p>
      <form className="form-stack" onSubmit={submit}>
        <div className="form-grid"><label><span className="field-label">Ημερομηνία έκδοσης</span><input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} required /></label><label><span className="field-label">Ημερομηνία λήξης</span><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required /></label></div>
        <div><div className="line-heading"><span className="field-label">Γραμμές χρέωσης</span><button type="button" onClick={() => setLines((current) => [...current, { description: "", quantity: "1", unitPrice: "0" }])} disabled={lines.length >= 8}>+ Προσθήκη</button></div><div className="invoice-lines-editor">{lines.map((line, index) => <div className="invoice-line-editor" key={index}><input value={line.description} onChange={(e) => updateLine(index, "description", e.target.value)} placeholder="Περιγραφή υπηρεσίας" maxLength={100} required /><input type="number" min="0.01" step="0.01" value={line.quantity} onChange={(e) => updateLine(index, "quantity", e.target.value)} aria-label="Ποσότητα" required /><input type="number" min="0" step="0.01" value={line.unitPrice} onChange={(e) => updateLine(index, "unitPrice", e.target.value)} aria-label="Τιμή μονάδας" required /><button type="button" onClick={() => setLines((current) => current.filter((_, position) => position !== index))} disabled={lines.length === 1} aria-label="Αφαίρεση γραμμής">×</button></div>)}</div></div>
        <label><span className="field-label">Σημειώσεις <small>προαιρετικό</small></span><textarea rows={3} maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
        <div className="draft-total"><span>Εκτιμώμενο σύνολο με ΦΠΑ</span><strong>{formatCurrency(total)}</strong></div>
        {error && <p className="error-message" role="alert">{error}</p>}
        <div className="dialog-actions"><span /><span /><button type="button" className="secondary-button" onClick={onClose}>Ακύρωση</button><button className="primary-button inline-button" disabled={busy}>{busy ? "Δημιουργία…" : "Δημιουργία"}</button></div>
      </form>
    </section>
  </div>;
}
