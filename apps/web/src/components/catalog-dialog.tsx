"use client";

import { FormEvent, useState } from "react";
import { api } from "@/lib/api";
import type { ServiceCategory, ServicePackage, Session } from "@/lib/types";

export function CatalogDialog({ kind, category, servicePackage, categories, session, onClose, onChanged }: {
  kind: "category" | "package"; category?: ServiceCategory; servicePackage?: ServicePackage;
  categories: ServiceCategory[]; session: Session; onClose: () => void; onChanged: () => void;
}) {
  const editingCategory = kind === "category" ? category : undefined;
  const editingPackage = kind === "package" ? servicePackage : undefined;
  const [name, setName] = useState(editingCategory?.name ?? editingPackage?.name ?? "");
  const [color, setColor] = useState(editingCategory?.color ?? "#2563eb");
  const [displayOrder, setDisplayOrder] = useState(editingCategory?.displayOrder ?? categories.length + 1);
  const [categoryId, setCategoryId] = useState(editingPackage?.categoryId ?? category?.id ?? categories[0]?.id ?? "");
  const [description, setDescription] = useState(editingPackage?.description ?? "");
  const [monthlyPrice, setMonthlyPrice] = useState(editingPackage?.monthlyPrice?.toString() ?? "0");
  const [features, setFeatures] = useState(editingPackage?.features.join("\n") ?? "");
  const [isActive, setIsActive] = useState(editingCategory?.isActive ?? editingPackage?.isActive ?? true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const headers = { "X-CSRF-TOKEN": session.csrfToken };
  const existingId = editingCategory?.id ?? editingPackage?.id;

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      if (kind === "category") {
        const body = JSON.stringify({ name, color, displayOrder: Number(displayOrder), isActive });
        await api(existingId ? `/admin/service-categories/${existingId}` : "/admin/service-categories", { method: existingId ? "PUT" : "POST", headers, body });
      } else {
        const body = JSON.stringify({ categoryId, name, description, monthlyPrice: Number(monthlyPrice), isActive, features: features.split("\n").map((x) => x.trim()).filter(Boolean) });
        await api(existingId ? `/admin/service-packages/${existingId}` : "/admin/service-packages", { method: existingId ? "PUT" : "POST", headers, body });
      }
      onChanged();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Η αποθήκευση απέτυχε."); }
    finally { setBusy(false); }
  }

  async function remove() {
    if (!existingId) return; setBusy(true); setError("");
    const path = kind === "category" ? `/admin/service-categories/${existingId}` : `/admin/service-packages/${existingId}`;
    try { await api<void>(path, { method: "DELETE", headers }); onChanged(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Η διαγραφή απέτυχε."); setBusy(false); }
  }

  const label = kind === "category" ? "κατηγορίας" : "πακέτου";
  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="catalog-dialog-title">
      <button className="dialog-close" onClick={onClose} aria-label="Κλείσιμο">×</button>
      <span className="eyebrow">{existingId ? "ΕΠΕΞΕΡΓΑΣΙΑ" : "ΝΕΑ ΚΑΤΑΧΩΡΙΣΗ"}</span>
      <h2 id="catalog-dialog-title">{existingId ? `Επεξεργασία ${label}` : `Δημιουργία ${label}`}</h2>
      <p className="muted">Η αλλαγή αφορά μόνο το προσωρινό demo workspace.</p>
      <form onSubmit={submit} className="form-stack">
        <label><span className="field-label">Όνομα</span><input value={name} onChange={(e) => setName(e.target.value)} required /></label>
        {kind === "category" ? <div className="form-grid">
          <label><span className="field-label">Χρώμα</span><div className="color-field"><input type="color" value={color} onChange={(e) => setColor(e.target.value)} /><input value={color} onChange={(e) => setColor(e.target.value)} pattern="#[0-9a-fA-F]{6}" /></div></label>
          <label><span className="field-label">Σειρά εμφάνισης</span><input type="number" min={0} max={1000} value={displayOrder} onChange={(e) => setDisplayOrder(Number(e.target.value))} /></label>
        </div> : <>
          <label><span className="field-label">Κατηγορία</span><select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>{categories.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
          <label><span className="field-label">Περιγραφή</span><textarea value={description} onChange={(e) => setDescription(e.target.value)} minLength={5} maxLength={1000} rows={4} required /></label>
          <label><span className="field-label">Μηνιαία τιμή (€)</span><input type="number" min={0} max={1000000} step="0.01" value={monthlyPrice} onChange={(e) => setMonthlyPrice(e.target.value)} required /></label>
          <label><span className="field-label">Παροχές <small>μία ανά γραμμή</small></span><textarea value={features} onChange={(e) => setFeatures(e.target.value)} rows={5} /></label>
        </>}
        <label className="toggle-field"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /><span><strong>Ενεργό</strong><small>Εμφανίζεται στον κατάλογο του demo πελάτη.</small></span></label>
        {error && <p className="error-message" role="alert">{error}</p>}
        <div className="dialog-actions">
          {existingId && (!confirmDelete ? <button type="button" className="danger-text" onClick={() => setConfirmDelete(true)}>Διαγραφή</button> : <button type="button" className="danger-button" onClick={remove} disabled={busy}>Οριστική διαγραφή</button>)}
          <span />
          <button type="button" className="secondary-button" onClick={onClose}>Ακύρωση</button>
          <button className="primary-button inline-button" disabled={busy || (kind === "package" && !categoryId)}>{busy ? "Αποθήκευση…" : "Αποθήκευση"}</button>
        </div>
      </form>
    </section>
  </div>;
}
