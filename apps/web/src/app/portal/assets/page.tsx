"use client";

import { useEffect, useState } from "react";
import { AssetList } from "@/components/asset-list";
import { api } from "@/lib/api";
import type { Asset } from "@/lib/types";

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { api<Asset[]>("/assets").then(setAssets).catch((reason) => setError(reason.message)); }, []);
  return <div className="content-wrap">
    <header className="page-header"><div><span className="eyebrow">ΧΑΡΤΟΦΥΛΑΚΙΟ</span><h1>Υπηρεσίες & έργα</h1><p>Τα ψηφιακά στοιχεία και τα ενεργά πακέτα του demo workspace.</p></div></header>
    {error && <p className="error-message" role="alert">{error}</p>}
    <section className="panel">
      <div className="panel-header"><div><h2>Όλα τα έργα</h2><p>{assets ? `${assets.length} δοκιμαστικά στοιχεία` : "Φόρτωση…"}</p></div></div>
      {assets ? <AssetList assets={assets} /> : <div className="loading-panel"><span className="spinner" /> Φόρτωση στοιχείων…</div>}
    </section>
  </div>;
}
