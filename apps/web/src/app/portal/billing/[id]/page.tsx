"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { usePortalSession } from "@/components/portal-shell";
import { api, formatCurrency } from "@/lib/api";
import type { InvoiceDetail } from "@/lib/types";

const formatDate = (value: string) => new Intl.DateTimeFormat("el-GR", { dateStyle: "long" }).format(new Date(`${value}T00:00:00Z`));

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const session = usePortalSession();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try { setInvoice(await api<InvoiceDetail>(`/invoices/${id}`)); setError(""); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Η φόρτωση απέτυχε."); }
  }, [id]);
  useEffect(() => {
    let active = true;
    api<InvoiceDetail>(`/invoices/${id}`).then((result) => { if (active) setInvoice(result); })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Η φόρτωση απέτυχε."); });
    return () => { active = false; };
  }, [id]);
  async function declarePayment(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      await api(`/invoices/${id}/payment-declarations`, { method: "POST", headers: { "X-CSRF-TOKEN": session.csrfToken }, body: JSON.stringify({ reference, note: note || null }) });
      setReference(""); setNote(""); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Η δήλωση απέτυχε."); }
    finally { setBusy(false); }
  }
  if (!invoice) return <div className="content-wrap"><div className="panel loading-panel"><span className="spinner" /> Φόρτωση τιμολογίου…</div>{error && <p className="error-message">{error}</p>}</div>;
  const pending = invoice.paymentDeclarations.some((item) => item.status === "PendingReview");

  return <div className="content-wrap invoice-detail-page">
    <Link className="back-link" href="/portal/billing">← Όλα τα τιμολόγια</Link>
    <header className="ticket-detail-header"><div><span className="eyebrow">ΔΟΚΙΜΑΣΤΙΚΟ ΠΑΡΑΣΤΑΤΙΚΟ</span><h1>{invoice.number}</h1><p>Έκδοση {formatDate(invoice.issueDate)} · Λήξη {formatDate(invoice.dueDate)}</p></div><div className="invoice-header-actions"><span className={`invoice-status ${invoice.status.toLowerCase()}`}>{invoice.statusLabel}</span><a className="secondary-button pdf-button" href={`/api/v1/invoices/${invoice.id}/pdf`} target="_blank" rel="noreferrer">Λήψη PDF</a></div></header>
    {error && <p className="error-message" role="alert">{error}</p>}
    <div className="invoice-detail-grid">
      <section className="panel invoice-document"><div className="invoice-document-head"><div><span>KUBIK</span><small>PORTAL DEMO</small></div><div><span>ΤΙΜΟΛΟΓΙΟ</span><strong>{invoice.number}</strong></div></div><div className="invoice-parties"><div><span>ΠΕΛΑΤΗΣ</span><strong>{invoice.clientName}</strong></div><div><span>ΚΑΤΑΣΤΑΣΗ</span><strong>{invoice.statusLabel}</strong></div></div>
        <div className="invoice-lines"><div className="invoice-line invoice-line-head"><span>Περιγραφή</span><span>Ποσ.</span><span>Τιμή</span><span>Σύνολο</span></div>{invoice.lines.map((line) => <div className="invoice-line" key={line.id}><strong>{line.description}</strong><span>{line.quantity}</span><span>{formatCurrency(line.unitPrice)}</span><strong>{formatCurrency(line.lineTotal)}</strong></div>)}</div>
        <div className="invoice-totals"><div><span>Καθαρή αξία</span><strong>{formatCurrency(invoice.subtotal)}</strong></div><div><span>ΦΠΑ {invoice.vatRate}%</span><strong>{formatCurrency(invoice.vatAmount)}</strong></div><div className="grand-total"><span>Σύνολο</span><strong>{formatCurrency(invoice.total)}</strong></div></div>{invoice.notes && <div className="invoice-notes"><span>ΣΗΜΕΙΩΣΕΙΣ</span><p>{invoice.notes}</p></div>}
      </section>
      <aside className="ticket-side">
        {session.role === "Client" && invoice.status === "Unpaid" && <section className="panel detail-card"><h2>Δήλωση τραπεζικής μεταφοράς</h2>{pending ? <div className="payment-waiting"><strong>Η δήλωση εξετάζεται</strong><p>Το τιμολόγιο παραμένει ανεξόφλητο μέχρι την έγκριση του διαχειριστή.</p></div> : <><p className="muted side-copy">Καταχωρίστε την αναφορά της μεταφοράς. Δεν πραγματοποιείται πραγματική πληρωμή.</p><form className="admin-control" onSubmit={declarePayment}><label><span className="field-label">Αναφορά συναλλαγής</span><input value={reference} onChange={(e) => setReference(e.target.value)} minLength={4} maxLength={500} required /></label><label><span className="field-label">Σημείωση <small>προαιρετικό</small></span><textarea rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} /></label><button className="primary-button inline-button full-button" disabled={busy}>{busy ? "Υποβολή…" : "Υποβολή για έλεγχο"}</button></form></>}</section>}
        <section className="panel detail-card"><h2>Ιστορικό δηλώσεων</h2>{invoice.paymentDeclarations.length === 0 ? <p className="muted side-copy">Δεν έχει υποβληθεί δήλωση πληρωμής.</p> : <div className="payment-history">{invoice.paymentDeclarations.map((item) => <article key={item.id}><div><strong>{item.statusLabel}</strong><span>{new Intl.DateTimeFormat("el-GR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.submittedAt))}</span></div><code>{item.reference}</code>{item.reviewNote && <p>{item.reviewNote}</p>}</article>)}</div>}</section>
      </aside>
    </div>
  </div>;
}
