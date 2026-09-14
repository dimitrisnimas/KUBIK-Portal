"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { InvoiceDialog } from "@/components/invoice-dialog";
import { PaymentReviewDialog } from "@/components/payment-review-dialog";
import { usePortalSession } from "@/components/portal-shell";
import { api, formatCurrency } from "@/lib/api";
import type { InvoiceSummary, PaymentDeclaration } from "@/lib/types";

const formatDate = (value: string) => new Intl.DateTimeFormat("el-GR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00Z`));

export default function BillingPage() {
  const session = usePortalSession();
  const isAdmin = session.role === "Administrator";
  const [invoices, setInvoices] = useState<InvoiceSummary[] | null>(null);
  const [declarations, setDeclarations] = useState<PaymentDeclaration[]>([]);
  const [newInvoice, setNewInvoice] = useState(false);
  const [reviewing, setReviewing] = useState<PaymentDeclaration | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      const invoiceResult = await api<InvoiceSummary[]>("/invoices");
      const declarationResult = isAdmin ? await api<PaymentDeclaration[]>("/admin/payment-declarations") : [];
      setInvoices(invoiceResult); setDeclarations(declarationResult); setError("");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Η φόρτωση απέτυχε."); }
  }, [isAdmin]);
  useEffect(() => {
    let active = true;
    Promise.all([api<InvoiceSummary[]>("/invoices"), isAdmin ? api<PaymentDeclaration[]>("/admin/payment-declarations") : Promise.resolve([])])
      .then(([invoiceResult, declarationResult]) => { if (active) { setInvoices(invoiceResult); setDeclarations(declarationResult); } })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Η φόρτωση απέτυχε."); });
    return () => { active = false; };
  }, [isAdmin]);
  const pending = declarations.filter((item) => item.status === "PendingReview");

  return <div className="content-wrap">
    <header className="page-header"><div><span className="eyebrow">ΟΙΚΟΝΟΜΙΚΑ</span><h1>Τιμολόγηση</h1><p>{isAdmin ? "Παρακολουθήστε τα demo παραστατικά και αξιολογήστε δηλώσεις πληρωμής." : "Δείτε τα παραστατικά και δηλώστε μία τραπεζική μεταφορά για έλεγχο."}</p></div>{isAdmin && <button className="primary-button header-button" onClick={() => setNewInvoice(true)}>+ Νέο τιμολόγιο</button>}</header>
    {error && <p className="error-message" role="alert">{error}</p>}
    {isAdmin && pending.length > 0 && <section className="panel pending-panel"><div className="panel-header"><div><h2>Δηλώσεις προς έλεγχο</h2><p>{pending.length} {pending.length === 1 ? "δήλωση αναμένει" : "δηλώσεις αναμένουν"} αξιολόγηση</p></div></div><div className="declaration-list">{pending.map((item) => <article className="declaration-row" key={item.id}><div className="declaration-reference"><span>{item.invoiceNumber}</span><strong>{item.clientName}</strong><small>{item.reference} · {new Intl.DateTimeFormat("el-GR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.submittedAt))}</small></div><strong>{formatCurrency(item.invoiceTotal)}</strong><button className="secondary-button" onClick={() => setReviewing(item)}>Αξιολόγηση</button></article>)}</div></section>}
    <section className="panel invoice-panel"><div className="panel-header"><div><h2>Παραστατικά</h2><p>{invoices ? `${invoices.length} δοκιμαστικά τιμολόγια` : "Φόρτωση…"}</p></div></div>
      {!invoices ? <div className="loading-panel"><span className="spinner" /> Φόρτωση τιμολογίων…</div> : invoices.length === 0 ? <div className="empty-state"><strong>Δεν υπάρχουν τιμολόγια.</strong></div> : <div className="invoice-list">{invoices.map((invoice) => <Link className="invoice-row" href={`/portal/billing/${invoice.id}`} key={invoice.id}>
        <div className="invoice-icon">€</div><div className="invoice-main"><span>{invoice.number}</span><strong>{formatCurrency(invoice.total)}</strong><small>Έκδοση {formatDate(invoice.issueDate)} · Λήξη {formatDate(invoice.dueDate)}</small></div>
        <div className="invoice-payment">{invoice.paymentStatus === "PendingReview" && <span className="payment-pill pending">Πληρωμή υπό έλεγχο</span>}{invoice.paymentStatus === "Rejected" && invoice.status === "Unpaid" && <span className="payment-pill rejected">Η δήλωση απορρίφθηκε</span>}</div>
        <span className={`invoice-status ${invoice.status.toLowerCase()} ${invoice.isOverdue ? "overdue" : ""}`}>{invoice.status === "Paid" ? "Εξοφλημένο" : invoice.isOverdue ? "Ληξιπρόθεσμο" : "Ανεξόφλητο"}</span><span className="ticket-arrow">→</span>
      </Link>)}</div>}
    </section>
    {newInvoice && <InvoiceDialog session={session} onClose={() => setNewInvoice(false)} onChanged={() => { setNewInvoice(false); void load(); }} />}
    {reviewing && <PaymentReviewDialog declaration={reviewing} session={session} onClose={() => setReviewing(null)} onChanged={() => { setReviewing(null); void load(); }} />}
  </div>;
}
