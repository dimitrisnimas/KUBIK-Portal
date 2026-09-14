"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { usePortalSession } from "@/components/portal-shell";
import { api, formatCurrency } from "@/lib/api";
import type { TicketDetail } from "@/lib/types";

const transitionOptions: Record<string, [string, string][]> = {
  New: [["InProgress", "Σε εξέλιξη"], ["Closed", "Κλειστό"]],
  InProgress: [["AwaitingClient", "Αναμονή πελάτη"], ["Resolved", "Επιλύθηκε"], ["Closed", "Κλειστό"]],
  AwaitingClient: [["InProgress", "Σε εξέλιξη"], ["Resolved", "Επιλύθηκε"], ["Closed", "Κλειστό"]],
  Resolved: [["InProgress", "Σε εξέλιξη"], ["Closed", "Κλειστό"]],
  Closed: [["InProgress", "Σε εξέλιξη"]],
};

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const session = usePortalSession();
  const isAdmin = session.role === "Administrator";
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [reply, setReply] = useState("");
  const [nextStatus, setNextStatus] = useState("");
  const [decision, setDecision] = useState("Covered");
  const [price, setPrice] = useState("");
  const [decisionNote, setDecisionNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const headers = useMemo(() => ({ "X-CSRF-TOKEN": session.csrfToken }), [session.csrfToken]);
  const load = useCallback(async () => {
    try { setTicket(await api<TicketDetail>(`/tickets/${id}`)); setError(""); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Η φόρτωση απέτυχε."); }
  }, [id]);
  useEffect(() => {
    let active = true;
    api<TicketDetail>(`/tickets/${id}`).then((result) => { if (active) setTicket(result); })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Η φόρτωση απέτυχε."); });
    return () => { active = false; };
  }, [id]);

  async function sendReply(event: FormEvent) {
    event.preventDefault(); if (!reply.trim()) return; setBusy(true); setError("");
    try { await api(`/tickets/${id}/messages`, { method: "POST", headers, body: JSON.stringify({ body: reply }) }); setReply(""); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Η αποστολή απέτυχε."); }
    finally { setBusy(false); }
  }

  async function changeStatus() {
    if (!nextStatus) return; setBusy(true); setError("");
    try { await api(`/admin/tickets/${id}/status`, { method: "PATCH", headers, body: JSON.stringify({ status: nextStatus }) }); setNextStatus(""); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Η αλλαγή κατάστασης απέτυχε."); }
    finally { setBusy(false); }
  }

  async function recordDecision(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      await api(`/admin/tickets/${id}/billing-decisions`, { method: "POST", headers, body: JSON.stringify({ decision, price: decision === "Chargeable" ? Number(price) : null, note: decisionNote || null }) });
      setPrice(""); setDecisionNote(""); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Η αξιολόγηση απέτυχε."); }
    finally { setBusy(false); }
  }

  if (!ticket) return <div className="content-wrap"><div className="panel loading-panel"><span className="spinner" /> Φόρτωση αιτήματος…</div>{error && <p className="error-message">{error}</p>}</div>;
  const latestDecision = ticket.billingDecisions[0];
  const transitions = transitionOptions[ticket.status] ?? [];

  return <div className="content-wrap ticket-detail-page">
    <Link className="back-link" href="/portal/tickets">← Όλα τα αιτήματα</Link>
    <header className="ticket-detail-header"><div><span className="eyebrow">{ticket.number} · {ticket.kindLabel}</span><h1>{ticket.title}</h1><p>{ticket.assetName ?? "Γενικό αίτημα"} · Δημιουργήθηκε {new Intl.DateTimeFormat("el-GR", { dateStyle: "long" }).format(new Date(ticket.createdAt))}</p></div><span className={`ticket-status large status-${ticket.status.toLowerCase()}`}>{ticket.statusLabel}</span></header>
    {error && <p className="error-message" role="alert">{error}</p>}
    <div className="ticket-detail-grid">
      <section className="panel conversation-panel">
        <div className="panel-header"><div><h2>Συνομιλία</h2><p>{ticket.messages.length} {ticket.messages.length === 1 ? "μήνυμα" : "μηνύματα"}</p></div></div>
        <div className="message-thread">{ticket.messages.map((message) => <article className={`ticket-message ${message.authorRole === session.role ? "mine" : ""}`} key={message.id}>
          <div className="message-avatar">{message.authorName.charAt(0)}</div><div className="message-content"><div><strong>{message.authorName}</strong><span>{message.authorRole === "Administrator" ? "Διαχειριστής demo" : "Πελάτης demo"} · {new Intl.DateTimeFormat("el-GR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(message.createdAt))}</span></div><p>{message.body}</p></div>
        </article>)}</div>
        <form className="reply-form" onSubmit={sendReply}><label htmlFor="reply" className="field-label">Νέο μήνυμα</label><textarea id="reply" value={reply} onChange={(e) => setReply(e.target.value)} rows={4} maxLength={4000} disabled={ticket.status === "Closed"} placeholder={ticket.status === "Closed" ? "Το αίτημα είναι κλειστό." : "Γράψτε την απάντησή σας…"} /><div><small>Έως 4.000 χαρακτήρες</small><button className="primary-button inline-button" disabled={busy || !reply.trim() || ticket.status === "Closed"}>Αποστολή</button></div></form>
      </section>
      <aside className="ticket-side">
        <section className="panel detail-card"><h2>Στοιχεία αιτήματος</h2><dl><div><dt>Πελάτης</dt><dd>{ticket.ownerName}</dd></div><div><dt>Τύπος</dt><dd>{ticket.kindLabel}</dd></div><div><dt>Προτεραιότητα</dt><dd>{ticket.priorityLabel}</dd></div><div><dt>Έργο</dt><dd>{ticket.assetName ?? "Γενικό"}</dd></div></dl></section>
        <section className="panel detail-card billing-card"><h2>Αξιολόγηση χρέωσης</h2>{latestDecision ? <div className={`billing-result ${latestDecision.decision.toLowerCase()}`}><strong>{latestDecision.decisionLabel}</strong><span>{latestDecision.price ? formatCurrency(latestDecision.price) : "Περιλαμβάνεται στο πακέτο"}</span>{latestDecision.note && <p>{latestDecision.note}</p>}<small>{new Intl.DateTimeFormat("el-GR", { dateStyle: "medium" }).format(new Date(latestDecision.decidedAt))}</small></div> : <p className="muted side-copy">Δεν έχει ληφθεί ακόμη διοικητική απόφαση.</p>}
          {isAdmin && <form className="admin-control" onSubmit={recordDecision}><label><span className="field-label">Νέα απόφαση</span><select value={decision} onChange={(e) => setDecision(e.target.value)}><option value="Covered">Καλύπτεται</option><option value="Chargeable">Χρεώσιμο</option></select></label>{decision === "Chargeable" && <label><span className="field-label">Τιμή (€)</span><input type="number" min="0.01" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required /></label>}<label><span className="field-label">Σημείωση <small>προαιρετικό</small></span><textarea rows={3} maxLength={500} value={decisionNote} onChange={(e) => setDecisionNote(e.target.value)} /></label><button className="secondary-button full-button" disabled={busy}>Καταχώριση απόφασης</button></form>}
        </section>
        {isAdmin && <section className="panel detail-card"><h2>Κατάσταση</h2><div className="admin-status"><select value={nextStatus} onChange={(e) => setNextStatus(e.target.value)}><option value="">Επιλέξτε μετάβαση</option>{transitions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><button className="secondary-button full-button" onClick={changeStatus} disabled={!nextStatus || busy}>Ενημέρωση κατάστασης</button></div></section>}
        {ticket.billingDecisions.length > 1 && <section className="panel detail-card"><h2>Ιστορικό αποφάσεων</h2><div className="decision-history">{ticket.billingDecisions.map((item) => <div key={item.id}><strong>{item.decisionLabel}{item.price ? ` · ${formatCurrency(item.price)}` : ""}</strong><span>{item.reviewerName} · {new Intl.DateTimeFormat("el-GR", { dateStyle: "short" }).format(new Date(item.decidedAt))}</span></div>)}</div></section>}
      </aside>
    </div>
  </div>;
}
