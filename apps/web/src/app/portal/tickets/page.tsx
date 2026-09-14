"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { TicketDialog } from "@/components/ticket-dialog";
import { usePortalSession } from "@/components/portal-shell";
import { api, formatCurrency } from "@/lib/api";
import type { Asset, TicketSummary } from "@/lib/types";

const filters = [["all", "Όλα"], ["open", "Ανοιχτά"], ["AwaitingClient", "Αναμονή πελάτη"], ["Resolved", "Επιλυμένα"]];

export default function TicketsPage() {
  const session = usePortalSession();
  const [tickets, setTickets] = useState<TicketSummary[] | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filter, setFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    Promise.all([api<TicketSummary[]>("/tickets"), api<Asset[]>("/assets")])
      .then(([ticketResult, assetResult]) => { if (active) { setTickets(ticketResult); setAssets(assetResult); } })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Η φόρτωση απέτυχε."); });
    return () => { active = false; };
  }, []);
  const visible = useMemo(() => (tickets ?? []).filter((ticket) => {
    if (filter === "all") return true;
    if (filter === "open") return !["Resolved", "Closed"].includes(ticket.status);
    return ticket.status === filter;
  }), [tickets, filter]);

  return <div className="content-wrap">
    <header className="page-header"><div><span className="eyebrow">ΥΠΟΣΤΗΡΙΞΗ</span><h1>Αιτήματα</h1><p>{session.role === "Administrator" ? "Παρακολουθήστε και αξιολογήστε τα αιτήματα του demo πελάτη." : "Παρακολουθήστε την πορεία των αιτημάτων και αλλαγών σας."}</p></div>{session.role === "Client" && <button className="primary-button header-button" onClick={() => setDialogOpen(true)}>+ Νέο αίτημα</button>}</header>
    {error && <p className="error-message" role="alert">{error}</p>}
    <div className="ticket-filters" role="group" aria-label="Φίλτρα αιτημάτων">{filters.map(([value, label]) => <button className={filter === value ? "active" : ""} onClick={() => setFilter(value)} key={value}>{label}{value === "all" && tickets ? <span>{tickets.length}</span> : null}</button>)}</div>
    <section className="panel ticket-panel">
      {!tickets ? <div className="loading-panel"><span className="spinner" /> Φόρτωση αιτημάτων…</div> : visible.length === 0 ? <div className="empty-state"><strong>Δεν βρέθηκαν αιτήματα.</strong><p>Αλλάξτε φίλτρο ή δημιουργήστε ένα νέο αίτημα.</p></div> : <div className="ticket-list">{visible.map((ticket) => <Link href={`/portal/tickets/${ticket.id}`} className="ticket-row" key={ticket.id}>
        <div className={`ticket-kind kind-${ticket.kind.toLowerCase()}`}>{ticket.kindLabel.charAt(0)}</div>
        <div className="ticket-title"><span>{ticket.number} · {ticket.kindLabel}</span><strong>{ticket.title}</strong><small>{ticket.assetName ?? "Γενικό αίτημα"} · {ticket.messageCount} {ticket.messageCount === 1 ? "μήνυμα" : "μηνύματα"}</small></div>
        <div className="ticket-billing">{ticket.billingDecision ? <><span>{ticket.billingDecision.decisionLabel}</span><strong>{ticket.billingDecision.price ? formatCurrency(ticket.billingDecision.price) : "Χωρίς χρέωση"}</strong></> : <span>Δεν έχει αξιολογηθεί</span>}</div>
        <div className="ticket-date">{new Intl.DateTimeFormat("el-GR", { day: "2-digit", month: "short" }).format(new Date(ticket.updatedAt))}</div>
        <span className={`ticket-status status-${ticket.status.toLowerCase()}`}>{ticket.statusLabel}</span><span className="ticket-arrow">→</span>
      </Link>)}</div>}
    </section>
    {dialogOpen && <TicketDialog assets={assets} session={session} onClose={() => setDialogOpen(false)} />}
  </div>;
}
