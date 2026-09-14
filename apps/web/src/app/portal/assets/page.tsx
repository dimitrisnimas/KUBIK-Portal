"use client";

import { useCallback, useEffect, useState } from "react";
import { AssetDialog } from "@/components/asset-dialog";
import { AssetList } from "@/components/asset-list";
import { usePortalSession } from "@/components/portal-shell";
import { api } from "@/lib/api";
import type { Asset, ServiceCategory } from "@/lib/types";

export default function AssetsPage() {
  const session = usePortalSession();
  const [assets, setAssets] = useState<Asset[] | null>(null);
  const [catalog, setCatalog] = useState<ServiceCategory[]>([]);
  const [editor, setEditor] = useState<Asset | "new" | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      const [assetsResult, catalogResult] = await Promise.all([api<Asset[]>("/assets"), api<ServiceCategory[]>("/catalog")]);
      setAssets(assetsResult); setCatalog(catalogResult); setError("");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Η φόρτωση απέτυχε."); }
  }, []);
  useEffect(() => {
    let active = true;
    Promise.all([api<Asset[]>("/assets"), api<ServiceCategory[]>("/catalog")])
      .then(([assetsResult, catalogResult]) => { if (active) { setAssets(assetsResult); setCatalog(catalogResult); } })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Η φόρτωση απέτυχε."); });
    return () => { active = false; };
  }, []);

  return <div className="content-wrap">
    <header className="page-header"><div><span className="eyebrow">ΧΑΡΤΟΦΥΛΑΚΙΟ</span><h1>Έργα</h1><p>{session.role === "Administrator" ? "Διαχειριστείτε τα έργα του δοκιμαστικού πελάτη." : "Διαχειριστείτε τα ψηφιακά στοιχεία του demo workspace."}</p></div><button className="primary-button header-button" onClick={() => setEditor("new")}>+ Νέο έργο</button></header>
    {error && <p className="error-message" role="alert">{error}</p>}
    <section className="panel">
      <div className="panel-header"><div><h2>Όλα τα έργα</h2><p>{assets ? `${assets.length} δοκιμαστικά στοιχεία` : "Φόρτωση…"}</p></div></div>
      {assets ? <AssetList assets={assets} showOwner={session.role === "Administrator"} onEdit={setEditor} /> : <div className="loading-panel"><span className="spinner" /> Φόρτωση στοιχείων…</div>}
    </section>
    {editor && <AssetDialog asset={editor === "new" ? undefined : editor} catalog={catalog} session={session} onClose={() => setEditor(null)} onChanged={() => { setEditor(null); void load(); }} />}
  </div>;
}
