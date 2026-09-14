"use client";

import { useCallback, useEffect, useState } from "react";
import { CatalogDialog } from "@/components/catalog-dialog";
import { usePortalSession } from "@/components/portal-shell";
import { api, formatCurrency } from "@/lib/api";
import type { ServiceCategory, ServicePackage } from "@/lib/types";

type Editor = { kind: "category"; category?: ServiceCategory } | { kind: "package"; category?: ServiceCategory; servicePackage?: ServicePackage };

export default function ServicesPage() {
  const session = usePortalSession();
  const isAdmin = session.role === "Administrator";
  const [catalog, setCatalog] = useState<ServiceCategory[] | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try { setCatalog(await api<ServiceCategory[]>("/catalog")); setError(""); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Η φόρτωση απέτυχε."); }
  }, []);
  useEffect(() => {
    let active = true;
    api<ServiceCategory[]>("/catalog")
      .then((result) => { if (active) setCatalog(result); })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Η φόρτωση απέτυχε."); });
    return () => { active = false; };
  }, []);

  return <div className="content-wrap">
    <header className="page-header"><div><span className="eyebrow">ΚΑΤΑΛΟΓΟΣ</span><h1>Πακέτα υπηρεσιών</h1><p>{isAdmin ? "Οργανώστε τις δοκιμαστικές κατηγορίες, παροχές και τιμές." : "Δείτε τι περιλαμβάνει κάθε διαθέσιμο πακέτο υπηρεσιών."}</p></div>{isAdmin && <button className="primary-button header-button" onClick={() => setEditor({ kind: "category" })}>+ Νέα κατηγορία</button>}</header>
    {error && <p className="error-message" role="alert">{error}</p>}
    {!catalog ? <div className="panel loading-panel"><span className="spinner" /> Φόρτωση καταλόγου…</div> : catalog.length === 0 ? <div className="panel empty-state"><strong>Δεν υπάρχουν κατηγορίες.</strong><p>Δημιουργήστε την πρώτη κατηγορία υπηρεσιών.</p></div> : <div className="catalog-sections">
      {catalog.map((category) => <section className="catalog-section" key={category.id}>
        <div className="category-heading"><div className="category-title"><i style={{ background: category.color }} /><div><h2>{category.name}</h2><p>{category.packages.length} {category.packages.length === 1 ? "πακέτο" : "πακέτα"}{!category.isActive ? " · Ανενεργή" : ""}</p></div></div>{isAdmin && <div className="small-actions"><button onClick={() => setEditor({ kind: "category", category })}>Επεξεργασία</button><button onClick={() => setEditor({ kind: "package", category })}>+ Πακέτο</button></div>}</div>
        {category.packages.length === 0 ? <div className="category-empty">Δεν υπάρχουν πακέτα σε αυτή την κατηγορία.</div> : <div className="package-grid">{category.packages.map((item) => <article className={`package-card ${!item.isActive ? "inactive" : ""}`} key={item.id}>
          <div className="package-top"><span className="package-icon" style={{ color: category.color, background: `${category.color}14` }}>K</span>{isAdmin && <button className="row-action" onClick={() => setEditor({ kind: "package", category, servicePackage: item })} aria-label={`Επεξεργασία ${item.name}`}>•••</button>}</div>
          <h3>{item.name}</h3><p>{item.description}</p><strong className="package-price">{formatCurrency(item.monthlyPrice)}<small>/ μήνα</small></strong>
          <ul>{item.features.map((feature) => <li key={feature}><span>✓</span>{feature}</li>)}</ul>
          {!item.isActive && <span className="inactive-badge">Ανενεργό</span>}
        </article>)}</div>}
      </section>)}
    </div>}
    {editor && <CatalogDialog kind={editor.kind} category={editor.category} servicePackage={editor.kind === "package" ? editor.servicePackage : undefined} categories={catalog ?? []} session={session} onClose={() => setEditor(null)} onChanged={() => { setEditor(null); void load(); }} />}
  </div>;
}
