"use client";

import { FormEvent, useState } from "react";
import { api } from "@/lib/api";
import type { Asset, ServiceCategory, Session } from "@/lib/types";

const assetTypes = [
  ["Website", "Ιστοσελίδα"], ["Eshop", "Ηλεκτρονικό κατάστημα"],
  ["SocialMedia", "Κοινωνικά δίκτυα"], ["Seo", "SEO"],
];

export function AssetDialog({ asset, catalog, session, onClose, onChanged }: {
  asset?: Asset; catalog: ServiceCategory[]; session: Session; onClose: () => void; onChanged: () => void;
}) {
  const [name, setName] = useState(asset?.name ?? "");
  const [assetType, setAssetType] = useState(asset?.type ?? "Website");
  const [url, setUrl] = useState(asset?.url ?? "");
  const [servicePackageId, setServicePackageId] = useState(asset?.servicePackageId ?? "");
  const [status, setStatus] = useState(asset?.status === "Σε παύση" ? "Paused" : "Active");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const headers = { "X-CSRF-TOKEN": session.csrfToken };
  const availablePackages = catalog.flatMap((category) => category.packages).filter((item) => item.isActive || item.id === asset?.servicePackageId);

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const body = JSON.stringify({ name, assetType, url: url || null, servicePackageId: servicePackageId || null });
      if (asset) {
        await api<Asset>(`/assets/${asset.id}`, { method: "PUT", headers, body });
        if (session.role === "Administrator" && status !== (asset.status === "Σε παύση" ? "Paused" : "Active")) {
          await api<void>(`/admin/assets/${asset.id}/status`, { method: "PATCH", headers, body: JSON.stringify({ status }) });
        }
      } else {
        await api<Asset>("/assets", { method: "POST", headers, body });
      }
      onChanged();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Η αποθήκευση απέτυχε."); }
    finally { setBusy(false); }
  }

  async function remove() {
    if (!asset) return; setBusy(true); setError("");
    try { await api<void>(`/assets/${asset.id}`, { method: "DELETE", headers }); onChanged(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Η διαγραφή απέτυχε."); setBusy(false); }
  }

  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="asset-dialog-title">
      <button className="dialog-close" onClick={onClose} aria-label="Κλείσιμο">×</button>
      <span className="eyebrow">{asset ? "ΕΠΕΞΕΡΓΑΣΙΑ ΕΡΓΟΥ" : "ΝΕΟ ΕΡΓΟ"}</span>
      <h2 id="asset-dialog-title">{asset ? asset.name : "Προσθήκη έργου"}</h2>
      <p className="muted">Το έργο αποθηκεύεται μόνο στο προσωρινό demo workspace.</p>
      <form onSubmit={submit} className="form-stack">
        <label><span className="field-label">Όνομα έργου</span><input value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={160} required /></label>
        <div className="form-grid">
          <label><span className="field-label">Τύπος</span><select value={assetType} onChange={(e) => setAssetType(e.target.value)}>{assetTypes.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <label><span className="field-label">Πακέτο υπηρεσιών</span><select value={servicePackageId} onChange={(e) => setServicePackageId(e.target.value)}><option value="">Χωρίς πακέτο</option>{availablePackages.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
        </div>
        <label><span className="field-label">Διεύθυνση URL <small>προαιρετικό</small></span><input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.gr" /></label>
        {asset && session.role === "Administrator" && <label><span className="field-label">Κατάσταση</span><select value={status} onChange={(e) => setStatus(e.target.value)}><option value="Active">Ενεργό</option><option value="Paused">Σε παύση</option></select></label>}
        {error && <p className="error-message" role="alert">{error}</p>}
        <div className="dialog-actions">
          {asset && (!confirmDelete ? <button type="button" className="danger-text" onClick={() => setConfirmDelete(true)}>Διαγραφή έργου</button> : <button type="button" className="danger-button" onClick={remove} disabled={busy}>Οριστική διαγραφή</button>)}
          <span />
          <button type="button" className="secondary-button" onClick={onClose}>Ακύρωση</button>
          <button className="primary-button inline-button" disabled={busy}>{busy ? "Αποθήκευση…" : "Αποθήκευση"}</button>
        </div>
      </form>
    </section>
  </div>;
}
