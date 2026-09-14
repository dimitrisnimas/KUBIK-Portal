"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Asset, Session } from "@/lib/types";

export function TicketDialog({ assets, session, onClose }: { assets: Asset[]; session: Session; onClose: () => void }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [kind, setKind] = useState("Support");
  const [priority, setPriority] = useState("Normal");
  const [managedAssetId, setManagedAssetId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const result = await api<{ id: string }>("/tickets", {
        method: "POST", headers: { "X-CSRF-TOKEN": session.csrfToken },
        body: JSON.stringify({ title, message, kind, priority, managedAssetId: managedAssetId || null })
      });
      router.push(`/portal/tickets/${result.id}`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Η δημιουργία απέτυχε."); setBusy(false); }
  }

  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="ticket-dialog-title">
      <button className="dialog-close" onClick={onClose} aria-label="Κλείσιμο">×</button>
      <span className="eyebrow">ΝΕΟ ΑΙΤΗΜΑ</span><h2 id="ticket-dialog-title">Πώς μπορούμε να βοηθήσουμε;</h2>
      <p className="muted">Η ομάδα θα εξετάσει το αίτημα. Η κάλυψη ή χρέωση αποφασίζεται αποκλειστικά από τον διαχειριστή.</p>
      <form onSubmit={submit} className="form-stack">
        <label><span className="field-label">Τίτλος</span><input value={title} onChange={(e) => setTitle(e.target.value)} minLength={4} maxLength={180} required /></label>
        <div className="form-grid">
          <label><span className="field-label">Τύπος αιτήματος</span><select value={kind} onChange={(e) => setKind(e.target.value)}><option value="Support">Υποστήριξη</option><option value="ChangeRequest">Αίτημα αλλαγής</option><option value="Bug">Πρόβλημα</option><option value="Feature">Νέα λειτουργία</option></select></label>
          <label><span className="field-label">Προτεραιότητα</span><select value={priority} onChange={(e) => setPriority(e.target.value)}><option value="Normal">Κανονική</option><option value="High">Υψηλή</option><option value="Urgent">Επείγουσα</option></select></label>
        </div>
        <label><span className="field-label">Σχετικό έργο <small>προαιρετικό</small></span><select value={managedAssetId} onChange={(e) => setManagedAssetId(e.target.value)}><option value="">Γενικό αίτημα</option>{assets.map((asset) => <option value={asset.id} key={asset.id}>{asset.name}</option>)}</select></label>
        <label><span className="field-label">Περιγραφή</span><textarea value={message} onChange={(e) => setMessage(e.target.value)} minLength={2} maxLength={4000} rows={7} required /></label>
        {error && <p className="error-message" role="alert">{error}</p>}
        <div className="dialog-actions"><span /><span /><button type="button" className="secondary-button" onClick={onClose}>Ακύρωση</button><button className="primary-button inline-button" disabled={busy}>{busy ? "Υποβολή…" : "Υποβολή αιτήματος"}</button></div>
      </form>
    </section>
  </div>;
}
